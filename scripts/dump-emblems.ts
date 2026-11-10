/** Dump the HUD glyphs at 6× for inspection. Diagnostic only. */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { SKILL_EMBLEM_IDS, skillEmblemPixels } from '@/characters/skillEmblem';

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (buf: Buffer): number => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type: string, data: Buffer): Buffer => {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
};
function writePng(path: string, w: number, h: number, col: Uint32Array) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = col[y * w + x];
      const o = y * (w * 4 + 1) + 1 + x * 4;
      raw[o] = c & 255;
      raw[o + 1] = (c >>> 8) & 255;
      raw[o + 2] = (c >>> 16) & 255;
      raw[o + 3] = (c >>> 24) & 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  writeFileSync(
    path,
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  );
}

const s = 6;
const gap = 8;
const w = 32 * s;
const cols = 4;
const rows = Math.ceil(SKILL_EMBLEM_IDS.length / cols);
const W = cols * (w + gap) + gap;
const H = rows * (w + gap) + gap;
const out = new Uint32Array(W * H).fill(0xff1a1720);
SKILL_EMBLEM_IDS.forEach((id, i) => {
  const px = skillEmblemPixels(id);
  const ox = gap + (i % cols) * (w + gap);
  const oy = gap + Math.floor(i / cols) * (w + gap);
  for (let y = 0; y < 32 * s; y++) {
    for (let x = 0; x < 32 * s; x++) {
      const c = px[Math.floor(y / s) * 32 + Math.floor(x / s)];
      if ((c >>> 24) === 0) continue;
      out[(oy + y) * W + ox + x] = c;
    }
  }
});
mkdirSync('node_modules/art', { recursive: true });
writePng('node_modules/art/glyphs.png', W, H, out);
console.log(`glyphs: ${W}x${H}`);
