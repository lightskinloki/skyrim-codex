// The table: the GM's browser hosts it, each player's device joins it.
// This step carries presence only (who is at the table). Live sheets, rolls and
// combat ride the same channel in later steps (docs/TABLE-SYNC-DECISIONS.md).
//
// Every message has two paths. Direct (WebRTC) when the devices can reach each
// other; through the worker otherwise — guest Wi-Fi that isolates devices, a
// phone on mobile data. The join code works on any network, the way Jackbox's
// does. Relay frames carry either { signal } (connection setup) or { app }
// (a table message).
import { Character } from '@/types/character';
import { PeerLink, RelaySocket, Signal, relayUrl } from './link';

/** What a device says about itself the moment it connects. */
export interface Hello {
  type: 'hello';
  /** The one character this device plays, as the GM needs it to run a fight. */
  character: Character;
}

export type TableMessage = Hello;

export interface TableMember {
  peerId: string;
  /** The GM's copy of this player's sheet, refreshed as it changes. */
  character: Character;
  connected: boolean;
  /** Which path is carrying this player's messages right now. */
  via: 'direct' | 'relayed';
}

type RelayData = { signal: Signal } | { app: TableMessage };

const ROOM_KEY = 'skyrimTTRPG_tableRoom';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 — easy to read aloud

function newCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** A room id safe for the relay: the character's own id, trimmed to the allowed set. */
function peerIdFor(character: Character): string {
  return character.id.replace(/[^\w-]/g, '').slice(0, 64) || 'player';
}

export function joinLink(code: string): string {
  return `${location.origin}/?join=${code}`;
}

// ---------------------------------------------------------------- GM side

export class TableHost {
  readonly code: string;
  private relay: RelaySocket;
  private links = new Map<string, PeerLink>();
  private members = new Map<string, TableMember>();

  constructor(private onChange: (members: TableMember[]) => void) {
    // A new code every time GM mode opens. The one exception is reloading this
    // same tab mid-session: sessionStorage survives a reload but not a new tab,
    // a closed tab, or leaving GM mode (endTable), so the old code dies there.
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(ROOM_KEY);
    } catch {
      // storage blocked — a fresh code each load is still workable
    }
    this.code = saved ?? newCode();
    try {
      sessionStorage.setItem(ROOM_KEY, this.code);
    } catch {
      // ignore
    }
    this.relay = new RelaySocket(relayUrl(this.code, 'role=gm'), (m) => this.onRelay(m));
  }

  list(): TableMember[] {
    return [...this.members.values()];
  }

  /** To one player: direct if that link is up, otherwise through the worker. */
  send(peer: string, message: TableMessage): void {
    const link = this.links.get(peer);
    if (link?.isOpen) link.send(message);
    else this.relay.send({ to: peer, data: { app: message } satisfies RelayData });
  }

  /** Disconnects without ending the room — used when the page unloads (a reload resumes it). */
  close(): void {
    this.relay.close();
    for (const link of this.links.values()) link.close();
  }

  /** The GM left GM mode: this code is finished. */
  endTable(): void {
    try {
      sessionStorage.removeItem(ROOM_KEY);
    } catch {
      // ignore
    }
    this.close();
  }

  private onRelay(m: Record<string, unknown>) {
    if (m.event === 'peer-left' && typeof m.peer === 'string') {
      this.links.get(m.peer)?.close();
      this.links.delete(m.peer);
      this.update(m.peer, { connected: false });
      return;
    }
    const peer = m.from;
    const data = m.data as RelayData | undefined;
    if (typeof peer !== 'string' || !data) return;
    if ('app' in data) {
      this.onPeerMessage(peer, data.app);
      return;
    }

    // A new offer means the device (re)started its direct connection: replace ours.
    const signal = data.signal;
    if ('sdp' in signal && signal.sdp.type === 'offer') {
      this.links.get(peer)?.close();
      const link = new PeerLink(
        (s) => this.relay.send({ to: peer, data: { signal: s } satisfies RelayData }),
        (msg) => this.onPeerMessage(peer, msg as TableMessage),
        (open) => this.update(peer, { via: open ? 'direct' : 'relayed' }),
        false,
      );
      this.links.set(peer, link);
    }
    void this.links.get(peer)?.receiveSignal(signal);
  }

  private onPeerMessage(peer: string, msg: TableMessage) {
    if (msg?.type === 'hello' && msg.character?.id) {
      this.members.set(peer, {
        peerId: peer,
        character: msg.character,
        connected: true,
        via: this.links.get(peer)?.isOpen ? 'direct' : 'relayed',
      });
      this.emit();
    }
  }

  private update(peer: string, patch: Partial<TableMember>) {
    const member = this.members.get(peer);
    if (!member) return;
    this.members.set(peer, { ...member, ...patch });
    this.emit();
  }

  private emit() {
    this.onChange(this.list());
  }
}

// ---------------------------------------------------------- player side

export type SeatStatus = 'connecting' | 'connected' | 'gm-away';

export class TableSeat {
  private relay: RelaySocket;
  private link: PeerLink | null = null;
  /** The last sheet the GM was sent, so a local edit that changes nothing
   *  table-relevant (a session note) doesn't put a frame on the wire. */
  private sent = '';

  constructor(
    readonly code: string,
    private character: Character,
    private onStatus: (status: SeatStatus) => void,
  ) {
    const peer = peerIdFor(character);
    this.relay = new RelaySocket(relayUrl(code, `peer=${encodeURIComponent(peer)}`), (m) => this.onRelay(m));
    onStatus('connecting');
  }

  /** The sheet changed: keep the GM's copy current (the fight list reads it). */
  setCharacter(character: Character): void {
    this.character = character;
    this.sendHello();
  }

  /** To the GM: direct if the link is up, otherwise through the worker. */
  send(message: TableMessage): void {
    if (this.link?.isOpen) this.link.send(message);
    else this.relay.send({ data: { app: message } satisfies RelayData });
  }

  close(): void {
    this.relay.close();
    this.link?.close();
  }

  private onRelay(m: Record<string, unknown>) {
    if (m.event === 'gm-online') {
      this.join();
      return;
    }
    if (m.event === 'gm-offline') {
      this.link?.close();
      this.link = null;
      this.onStatus('gm-away');
      return;
    }
    const data = m.data as RelayData | undefined;
    if (m.from !== 'gm' || !data) return;
    if ('signal' in data) void this.link?.receiveSignal(data.signal);
    // ('app' messages from the GM arrive here from step 3 on)
  }

  /** The GM is there: say hello straight away (through the worker), then try for a direct link. */
  private join() {
    // A reconnect may be a new GM with an empty table: always say hello again.
    this.sent = '';
    this.sendHello();
    this.onStatus('connected');
    this.link?.close();
    this.link = new PeerLink(
      (s) => this.relay.send({ data: { signal: s } satisfies RelayData }),
      () => {},
      (open) => {
        // Re-announce over the direct path so the GM marks it "direct".
        if (open) {
          this.sent = '';
          this.sendHello();
        }
      },
      true,
    );
  }

  private sendHello(): void {
    const message = this.hello();
    const snapshot = JSON.stringify(message);
    if (snapshot === this.sent) return;
    this.sent = snapshot;
    this.send(message);
  }

  private hello(): Hello {
    // The sheet's rules state travels; the player's private session notes stay
    // on their device (Privacy by Design) and would bloat every frame.
    const character: Character = { ...this.character };
    delete character.notes;
    return { type: 'hello', character };
  }
}
