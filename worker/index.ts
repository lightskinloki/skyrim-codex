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
  AI: Ai;
}

const CODE = /^[A-Z0-9]{4,8}$/;
const WORKERS_AI_IMAGE_MODEL = '@cf/black-forest-labs/flux-2-klein-4b';

function decodeBase64DataUrl(dataUrl: string): { bytes: Uint8Array; mime: string } | null {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return null;
  const bin = atob(match[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, mime: match[1] };
}

function uint8ToBase64(bytes: Uint8Array): string {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

async function handleAiRender(request: Request, env: Env): Promise<Response> {
  if (!env.AI) {
    return Response.json({ error: 'Cloudflare Workers AI binding is not configured.' }, { status: 503 });
  }

  let body: { prompt?: string; imageDataUrl?: string; width?: number; height?: number };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const rawPrompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!rawPrompt) {
    return Response.json({ error: 'Prompt is required.' }, { status: 400 });
  }
  const decoded = typeof body.imageDataUrl === 'string' ? decodeBase64DataUrl(body.imageDataUrl) : null;
  if (!decoded) {
    return Response.json({ error: 'Valid PNG, JPEG, or WebP reference imageDataUrl is required.' }, { status: 400 });
  }

  const width = Math.max(256, Math.min(1024, Math.round(Number(body.width) || 768)));
  const height = Math.max(256, Math.min(1024, Math.round(Number(body.height) || 1024)));
  const fluxPrompt = rawPrompt.replace(
    'the attached rough layered portrait collage',
    'image 0 (the attached rough layered portrait collage)'
  );

  const form = new FormData();
  form.append('prompt', fluxPrompt.slice(0, 2000));
  form.append('input_image_0', new Blob([decoded.bytes], { type: decoded.mime }), 'reference.png');
  form.append('width', String(width));
  form.append('height', String(height));

  const serialized = new Response(form);
  const contentType = serialized.headers.get('content-type') || 'multipart/form-data';

  try {
    const aiResult = await env.AI.run(WORKERS_AI_IMAGE_MODEL, {
      multipart: {
        body: serialized.body!,
        contentType,
      },
    });

    let b64: string | undefined;
    if (aiResult && typeof aiResult === 'object' && 'image' in aiResult && typeof aiResult.image === 'string') {
      b64 = aiResult.image;
    } else if (aiResult instanceof ReadableStream) {
      const buf = await new Response(aiResult).arrayBuffer();
      b64 = uint8ToBase64(new Uint8Array(buf));
    }

    if (!b64) {
      return Response.json({ error: 'AI model returned no image output.' }, { status: 502 });
    }

    const outMime = b64.startsWith('iVBOR') ? 'image/png' : 'image/jpeg';
    return Response.json({
      imageDataUrl: `data:${outMime};base64,${b64}`,
      model: WORKERS_AI_IMAGE_MODEL,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `Built-in AI render failed: ${msg}` }, { status: 502 });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/render') {
      if (request.method !== 'POST') {
        return Response.json({ error: 'Method not allowed' }, { status: 405 });
      }
      return handleAiRender(request, env);
    }

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
