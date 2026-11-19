// One direct connection between the GM's browser and one player's device.
//
// The worker (worker/index.ts) only carries the setup messages below; once the
// data channel opens, everything travels device to device. No outside STUN or
// TURN servers: the table shares a network, so local candidates are enough —
// and a future on-machine build needs nothing from the internet.

export type Signal =
  | { sdp: RTCSessionDescriptionInit }
  | { candidate: RTCIceCandidateInit };

export class PeerLink {
  private pc = new RTCPeerConnection({ iceServers: [] });
  private channel: RTCDataChannel | null = null;
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private closed = false;

  constructor(
    private sendSignal: (signal: Signal) => void,
    private onMessage: (message: unknown) => void,
    private onOpenChange: (open: boolean) => void,
    initiator: boolean,
  ) {
    this.pc.onicecandidate = (e) => {
      if (e.candidate) this.sendSignal({ candidate: e.candidate.toJSON() });
    };
    this.pc.onconnectionstatechange = () => {
      const s = this.pc.connectionState;
      if (s === 'failed' || s === 'closed') this.onOpenChange(false);
    };
    if (initiator) {
      this.attach(this.pc.createDataChannel('table', { ordered: true }));
      void this.makeOffer();
    } else {
      this.pc.ondatachannel = (e) => this.attach(e.channel);
    }
  }

  get isOpen(): boolean {
    return this.channel?.readyState === 'open';
  }

  send(message: unknown): void {
    if (this.isOpen) this.channel!.send(JSON.stringify(message));
  }

  async receiveSignal(signal: Signal): Promise<void> {
    if (this.closed) return;
    if ('sdp' in signal) {
      await this.pc.setRemoteDescription(signal.sdp);
      for (const c of this.pendingCandidates.splice(0)) await this.pc.addIceCandidate(c);
      if (signal.sdp.type === 'offer') {
        await this.pc.setLocalDescription(await this.pc.createAnswer());
        this.sendSignal({ sdp: this.pc.localDescription!.toJSON() });
      }
    } else if (this.pc.remoteDescription) {
      await this.pc.addIceCandidate(signal.candidate);
    } else {
      this.pendingCandidates.push(signal.candidate);
    }
  }

  close(): void {
    this.closed = true;
    this.channel?.close();
    this.pc.close();
  }

  private async makeOffer() {
    await this.pc.setLocalDescription(await this.pc.createOffer());
    this.sendSignal({ sdp: this.pc.localDescription!.toJSON() });
  }

  private attach(channel: RTCDataChannel) {
    this.channel = channel;
    channel.onopen = () => this.onOpenChange(true);
    channel.onclose = () => this.onOpenChange(false);
    channel.onmessage = (e) => {
      try {
        this.onMessage(JSON.parse(e.data));
      } catch {
        // ignore a malformed frame rather than drop the connection
      }
    };
  }
}

/**
 * The socket to the introduction service, reconnecting on its own. The worker
 * is only needed to set up or re-set-up a connection, so a short outage here
 * never interrupts devices that are already connected.
 */
export class RelaySocket {
  private ws: WebSocket | null = null;
  private stopped = false;
  private retry = 500;

  constructor(
    private url: string,
    private onMessage: (message: Record<string, unknown>) => void,
    private onOpen: () => void = () => {},
  ) {
    this.connect();
  }

  send(message: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(message));
  }

  close(): void {
    this.stopped = true;
    this.ws?.close();
  }

  private connect() {
    if (this.stopped) return;
    const ws = new WebSocket(this.url);
    this.ws = ws;
    ws.onopen = () => {
      this.retry = 500;
      this.onOpen();
    };
    ws.onmessage = (e) => {
      try {
        this.onMessage(JSON.parse(e.data));
      } catch {
        // ignore
      }
    };
    ws.onclose = () => {
      if (this.stopped) return;
      setTimeout(() => this.connect(), this.retry);
      this.retry = Math.min(this.retry * 2, 8000);
    };
  }
}

export function relayUrl(code: string, query: string): string {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}/api/room/${encodeURIComponent(code)}?${query}`;
}
