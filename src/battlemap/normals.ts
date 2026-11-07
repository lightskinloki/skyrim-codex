import { FACE, Surface } from './surface';
import { clamp } from './rng';

/**
 * Normals from the height buffer, with a pixel-art kernel (PIXEL-ART P12).
 *
 * The style is in the kernel, not the maths: a 1 px groove must produce 1 px of
 * normal change and nothing else. No smoothing pass, no blur — that is what
 * separates this from "height from brightness", which looks stamped on.
 *
 * Packed as (nx+128, ny+128, nz+128) in RGBA so the buffer can be viewed
 * directly as a debug image.
 */
export function buildNormals(s: Surface, relief = 0.6): Uint32Array {
  const { w, h, height } = s;
  const out = new Uint32Array(w * h);
  const H = (x: number, y: number): number => {
    if (x < 0) x = 0;
    else if (x >= w) x = w - 1;
    if (y < 0) y = 0;
    else if (y >= h) y = h - 1;
    return height[y * w + x];
  };
  const pack = (nx: number, ny: number, nz: number) =>
    ((255 << 24) |
      (((clamp(Math.round(nz * 127 + 128), 0, 255) & 255) << 16) |
        ((clamp(Math.round(ny * 127 + 128), 0, 255) & 255) << 8) |
        (clamp(Math.round(nx * 127 + 128), 0, 255) & 255))) >>>
    0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      // An authored vertical face wins over the height-field normal: a wall is
      // vertical, and no 3×3 height kernel can say so.
      const f = s.face[i];
      if (f !== FACE.NONE) {
        const nx = f === FACE.WEST ? -1 : f === FACE.EAST ? 1 : 0;
        const ny = f === FACE.NORTH ? -1 : f === FACE.SOUTH ? 1 : 0;
        out[i] = pack(nx, ny, 0);
        continue;
      }

      const gx =
        H(x + 1, y - 1) + 2 * H(x + 1, y) + H(x + 1, y + 1) -
        (H(x - 1, y - 1) + 2 * H(x - 1, y) + H(x - 1, y + 1));
      const gy =
        H(x - 1, y + 1) + 2 * H(x, y + 1) + H(x + 1, y + 1) -
        (H(x - 1, y - 1) + 2 * H(x, y - 1) + H(x + 1, y - 1));
      let nx = -gx * relief;
      let ny = -gy * relief;
      let nz = 8;
      const inv = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx *= inv;
      ny *= inv;
      nz *= inv;
      out[i] = pack(nx, ny, nz);
    }
  }
  return out;
}
