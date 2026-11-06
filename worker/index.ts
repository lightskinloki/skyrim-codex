// The introduction service for a table. One RoomRelay per room code.
//
// It introduces the GM's browser to each player's device (WebRTC setup), and
// when the network won't let them reach each other directly — guest Wi-Fi,
// a phone on mobile data — it carries their table messages too, the way
// Jackbox's room codes work anywhere. It stores nothing: no sheets, no game
// state, and the room is gone when everyone has left
// (docs/TABLE-SYNC-DECISIONS.md).
//
// Wire format (JSON text frames):
//   GM      → { to: <peerId>, data }      forwarded to that player
//   player  → { data }                    forwarded to the GM
//   relay   → { from: <peerId>, data }    (to the GM)
//   relay   → { from: 'gm', data }        (to a player)
//   relay   → { event: 'gm-online' | 'gm-offline' }               (to players)
//   relay   → { event: 'peer-left', peer: <peerId> }              (to the GM)
import { DurableObject } from 'cloudflare:workers';

interface Env {
  ROOMS: DurableObjectNamespace<RoomRelay>;
  ASSETS: Fetcher;
}

const CODE = /^[A-Z0-9]{4,8}$/;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    // /api/room/<CODE>?role=gm  |  /api/room/<CODE>?peer=<id>
    const match = url.pathname.match(/^\/api\/room\/([^/]+)$/);
    if (!match) return new Response('Not found', { status: 404 });

    const code = match[1].toUpperCase();
    if (!CODE.test(code)) return new Response('Bad room code', { status: 400 });
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected a WebSocket', { status: 426 });
    }
    return env.ROOMS.getByName(code).fetch(request);
  },
};

export class RoomRelay extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const isGm = url.searchParams.get('role') === 'gm';
    const peer = url.searchParams.get('peer') ?? '';
    if (!isGm && !/^[\w-]{1,64}$/.test(peer)) return new Response('Bad peer id', { status: 400 });

    const tag = isGm ? 'gm' : `peer:${peer}`;
    // A reconnecting GM or player replaces their old socket.
    for (const old of this.ctx.getWebSockets(tag)) old.close(1000, 'replaced');

    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server, [tag]);

    if (isGm) this.toPlayers({ event: 'gm-online' });
    else if (this.gm()) server.send(JSON.stringify({ event: 'gm-online' }));

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== 'string' || message.length > 900_000) return;
    let msg: { to?: string; data?: unknown };
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }
    const tag = this.ctx.getTags(ws)[0];
    if (tag === 'gm') {
      if (!msg.to) return;
      for (const s of this.ctx.getWebSockets(`peer:${msg.to}`)) s.send(JSON.stringify({ from: 'gm', data: msg.data }));
    } else {
      this.gm()?.send(JSON.stringify({ from: tag.slice('peer:'.length), data: msg.data }));
    }
  }

  async webSocketClose(ws: WebSocket) {
    const tag = this.ctx.getTags(ws)[0];
    if (tag === 'gm') this.toPlayers({ event: 'gm-offline' });
    else this.gm()?.send(JSON.stringify({ event: 'peer-left', peer: tag.slice('peer:'.length) }));
  }

  private gm(): WebSocket | undefined {
    return this.ctx.getWebSockets('gm').find((s) => s.readyState === WebSocket.OPEN);
  }

  private toPlayers(payload: object) {
    const text = JSON.stringify(payload);
    for (const s of this.ctx.getWebSockets()) {
      if (this.ctx.getTags(s)[0] !== 'gm') s.send(text);
    }
  }
}
