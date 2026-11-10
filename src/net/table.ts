// The table: the GM's browser hosts it, each player's device joins it.
//
// Every message has two paths. Direct (WebRTC) when the devices can reach each
// other; through the worker otherwise — guest Wi-Fi that isolates devices, a
// phone on mobile data. The join code works on any network, the way Jackbox's
// does. Relay frames carry either { signal } (connection setup) or { app }
// (a table message).
//
// The sheet travels in both directions. A player owns what happens on their
// turn; the GM owns corrections. Each sheet carries a revision: the host only
// accepts a frame at least as new as the one it holds, and a player adopts a GM
// sheet without echoing it back, so an in-flight frame can never resurrect
// older HP (docs/TABLE-SYNC-DECISIONS.md — there is no "real" copy).
import { Character } from '@/types/character';
import { PeerLink, RelaySocket, Signal, relayUrl } from './link';

/** What a device says about itself the moment it connects. */
export interface Hello {
  type: 'hello';
  /** The one character this device plays, as the GM needs it to run a fight. */
  character: Character;
  rev: number;
}

/** A whole sheet, in either direction. `by` decides who is being corrected. */
export interface SheetMessage {
  type: 'sheet';
  character: Character;
  rev: number;
  by: 'player' | 'gm';
}

/** A brace the player has taken, and the shield's computed bonus. */
export interface BraceMessage {
  type: 'brace';
  bonus: number;
  label: string;
}

/** The GM opened or closed a fight: every seat should be in Combat Mode. */
export interface FightMessage {
  type: 'fight';
  state: 'start' | 'end';
  round?: number;
  title?: string;
}

/** An enemy the GM has not concealed. Concealed ones never reach a player. */
export interface VisibleEnemy {
  id: string;
  name: string;
}

export interface RosterMessage {
  type: 'roster';
  enemies: VisibleEnemy[];
}

export type RollTier = 'crit' | 'success' | 'success_complication' | 'fail' | 'crit_fail';

/** A roll the player made, phrased as an outcome rather than a number. */
export interface RollCard {
  id: string;
  actor: string;
  action: string;
  tier: RollTier;
  /** Already multiplied; 0 on a miss, null when the GM holds the damage. */
  damage: number | null;
  /** Before the multiplier, so a held complication still has a number to price. */
  base: number;
  die: number;
  total: number;
  target?: { id: string; name: string };
  at: number;
}

export interface RollMessage {
  type: 'roll';
  card: RollCard;
}

export type TableMessage =
  | Hello
  | SheetMessage
  | BraceMessage
  | FightMessage
  | RosterMessage
  | RollMessage;

export interface TableMember {
  peerId: string;
  /** The GM's copy of this player's sheet, refreshed as it changes. */
  character: Character;
  /** The newest sheet revision seen for this seat. */
  rev: number;
  connected: boolean;
  /** Which path is carrying this player's messages right now. */
  via: 'direct' | 'relayed';
  /** Damage the next hit should take off, until it lands or the turn ends. */
  brace?: { bonus: number; label: string };
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
  /** The last roster published, replayed to anyone who joins mid-fight. */
  private roster: VisibleEnemy[] = [];

  constructor(
    private onChange: (members: TableMember[]) => void,
    private onRoll: (card: RollCard) => void = () => {},
  ) {
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

  /**
   * The GM changes a player's sheet. The host is the only writer here, so the
   * revision always moves forward and every other copy takes the new number.
   */
  editCharacter(peerId: string, edit: (character: Character) => Character): void {
    const member = this.members.get(peerId);
    if (!member) return;
    const character = edit(member.character);
    this.sendSheet(peerId, character);
  }

  private sendSheet(peerId: string, character: Character): void {
    const member = this.members.get(peerId);
    if (!member) return;
    const rev = Math.max(member.rev + 1, 1);
    this.members.set(peerId, { ...member, character, rev });
    this.emit();
    this.send(peerId, { type: 'sheet', character, rev, by: 'gm' });
  }

  /** A player braced: hold the bonus until the GM spends it on a hit. */
  setBrace(peerId: string, brace: { bonus: number; label: string } | null): void {
    const member = this.members.get(peerId);
    const next = brace && brace.bonus > 0 ? brace : null;
    if (!member || next?.bonus === member.brace?.bonus) return;
    this.members.set(peerId, { ...member, brace: next ?? undefined });
    this.emit();
  }

  /** What the players are allowed to know is in the room. Concealed enemies
   *  are left out entirely, not renamed (S6). */
  publishRoster(enemies: VisibleEnemy[]): void {
    this.roster = enemies;
    const message: RosterMessage = { type: 'roster', enemies };
    for (const member of this.members.values()) {
      if (member.connected) this.send(member.peerId, message);
    }
  }

  /** The fight opened or closed: every seat hears it at once. */
  announceFight(state: FightMessage['state'], detail: { round?: number; title?: string } = {}): void {
    const message: FightMessage = { type: 'fight', state, ...detail };
    for (const member of this.members.values()) {
      if (member.connected) this.send(member.peerId, message);
    }
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

  private onPeerMessage(peer: string, message: TableMessage) {
    if (message?.type === 'hello' && message.character?.id) {
      const held = this.members.get(peer);
      // A reconnect from a device that missed a GM correction is caught up by
      // the host rather than overwriting the correction with stale numbers.
      if (held && message.rev < held.rev) {
        this.members.set(peer, { ...held, connected: true, via: this.links.get(peer)?.isOpen ? 'direct' : 'relayed' });
        this.emit();
        this.sendSheet(peer, held.character);
        if (this.roster.length > 0) this.send(peer, { type: 'roster', enemies: this.roster });
        return;
      }
      this.members.set(peer, {
        peerId: peer,
        character: message.character,
        rev: message.rev,
        connected: true,
        via: this.links.get(peer)?.isOpen ? 'direct' : 'relayed',
        brace: held?.brace,
      });
      this.emit();
      // A seat joining mid-fight still needs to know what is on the board.
      if (this.roster.length > 0) this.send(peer, { type: 'roster', enemies: this.roster });
      return;
    }

    if (message?.type === 'sheet' && message.character?.id) {
      const member = this.members.get(peer);
      if (!member) return;
      if (message.rev < member.rev) return;
      this.members.set(peer, {
        ...member,
        character: message.character,
        rev: message.rev,
        connected: true,
      });
      this.emit();
      return;
    }

    if (message?.type === 'brace') {
      this.setBrace(peer, { bonus: Math.max(0, message.bonus | 0), label: message.label });
      return;
    }

    if (message?.type === 'roll' && message.card) {
      this.onRoll(message.card);
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
  /** What the GM last handed us, so adopting it does not echo back. */
  private lastRemote = '';
  private rev = 0;

  constructor(
    readonly code: string,
    private character: Character,
    private onStatus: (status: SeatStatus) => void,
    private onCharacter?: (character: Character) => void,
    private onFight?: (message: FightMessage) => void,
    private onRoster?: (enemies: VisibleEnemy[]) => void,
  ) {
    const peer = peerIdFor(character);
    this.relay = new RelaySocket(relayUrl(code, `peer=${encodeURIComponent(peer)}`), (m) => this.onRelay(m));
    onStatus('connecting');
  }

  /** The sheet changed locally: keep the GM's copy current (the fight list reads it). */
  setCharacter(character: Character): void {
    this.character = character;
    const snapshot = JSON.stringify(this.hello().character);
    // Adopting a GM correction arrives through this same prop; it must not bounce.
    if (snapshot === this.lastRemote) return;
    this.rev += 1;
    this.sendHello();
  }

  /** A brace taken this turn, with the number the shield gives it. */
  sendBrace(bonus: number, label: string): void {
    this.send({ type: 'brace', bonus, label });
  }

  /** The outcome of a roll, damage included, so the GM does not have to ask. */
  sendRoll(card: RollCard): void {
    this.send({ type: 'roll', card });
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
    else this.onMessage(data.app);
  }

  private onMessage(message: TableMessage) {
    if (message?.type === 'sheet' && message.character?.id) {
      this.adopt(message);
      return;
    }
    if (message?.type === 'fight') {
      this.onFight?.(message);
      return;
    }
    if (message?.type === 'roster') {
      this.onRoster?.(message.enemies);
    }
  }

  /** The GM corrected this sheet. Take it, and never send it back. */
  private adopt(message: SheetMessage): void {
    this.character = message.character;
    this.rev = Math.max(this.rev, message.rev);
    this.lastRemote = JSON.stringify(this.hello().character);
    this.sent = JSON.stringify({ type: 'hello', character: message.character, rev: this.rev });
    this.onCharacter?.(message.character);
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
      (message) => this.onMessage(message as TableMessage),
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
    return { type: 'hello', character, rev: this.rev };
  }
}
