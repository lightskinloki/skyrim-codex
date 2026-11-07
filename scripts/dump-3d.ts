import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { makeDemoRoom } from '@/battlemap/room';
import { buildScene } from '@/battlemap/gl/scene';
import { renderFrame, renderStats } from '@/battlemap/gl/render';

/** Offline frame dump, at exactly 1:1, for inspecting the renderer rather than
 *  a browser-scaled screenshot. */

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

const crc = (buf: Buffer): number => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type: string, data: Buffer): Buffer => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc(body), 0);
  return Buffer.concat([len, body, c]);
};

function writePng(path: string, w: number, h: number, col: Uint32Array) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const c = col[y * w + x];
      const o = y * (w * 3 + 1) + 1 + x * 3;
      raw[o] = c & 255;
      raw[o + 1] = (c >>> 8) & 255;
      raw[o + 2] = (c >>> 16) & 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  writeFileSync(path, png);
}

const room = makeDemoRoom();
const yaw = Number(process.argv[2] ?? 32);
const pitch = Number(process.argv[3] ?? 55);
const scene = buildScene(room, yaw);
const opts = { showPath: true, selectedToken: "pc-1", time: 1 };
const f = renderFrame(scene, { yaw, pitch, pix: 32 }, room.rig, opts);
writePng(`screenshots/gl-yaw${yaw}-p${pitch}.png`, f.w, f.h, f.col);

// Steady-state cost: buffers are reused the way Board3D reuses them.
let fr = renderFrame(scene, { yaw, pitch, pix: 32 }, room.rig, opts);
const t0 = performance.now();
for (let n = 0; n < 8; n++) fr = renderFrame(scene, { yaw, pitch, pix: 32 }, room.rig, opts, fr);
const ms = (performance.now() - t0) / 8;
const mask = new Uint32Array(f.w * f.h);
let covered = 0;
for (let y = 0; y < f.h; y++) {
  for (let x = 0; x < f.w; x++) {
    const v = f.shadow[(y >> 2) * f.sw + (x >> 2)] ? 255 : 0;
    if (v) covered++;
    mask[y * f.w + x] = (255 << 24) | (v << 16) | (v << 8) | v;
  }
}
writePng(`screenshots/gl-shadow-yaw${yaw}.png`, f.w, f.h, mask);
console.log(
  `frame ${ms.toFixed(1)} ms`,
  Object.fromEntries(Object.entries(renderStats).map(([k, v]) => [k, Number(v.toFixed(1))])),
);
console.log(
  JSON.stringify({ shadowPixels: covered, shadowOf: f.w * f.h,
    yaw,
    pitch,
    size: [f.w, f.h],
    tris: scene.tris.length,
    colliders: scene.colliders.length,
    lights: scene.lights.length + room.rig.points.length,
    file: `screenshots/gl-yaw${yaw}-p${pitch}.png`,
  }),
);

