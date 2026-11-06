import { COLOUR_OF, M_FIRE, Surface } from './surface';
import { CELL } from './paint';

/**
 * The path overlay. Tokens themselves are characters now — see
 * `src/characters/body.ts` and docs/PIXEL-ART-SPEC.md §3.
 */

/** A dotted path chain with one arrowhead on the final cell (PRESENTATION X8). */
export function drawPath(s: Surface, path: [number, number][]) {
  const dot = COLOUR_OF[(M_FIRE << 4) + 5];
  const head = COLOUR_OF[(M_FIRE << 4) + 10];
  for (let n = 0; n < path.length; n++) {
    const [cx, cy] = path[n];
    const x0 = cx * CELL;
    const y0 = cy * CELL;
    for (let j = 10; j < 24; j += 4) {
      for (let i = 10; i < 24; i += 4) {
        if (((i >> 2) + (j >> 2)) % 2 === 0) continue;
        const x = x0 + i;
        const y = y0 + j;
        if (x < 0 || y < 0 || x >= s.w || y >= s.h) continue;
        s.col[y * s.w + x] = dot;
      }
    }
    if (n === path.length - 1) {
      for (let k = 0; k < 5; k++) {
        const x = x0 + 15 + k;
        for (let r = -k; r <= k; r += 2) {
          const y = y0 + 17 + r;
          if (x < 0 || y < 0 || x >= s.w || y >= s.h) continue;
          s.col[y * s.w + x] = head;
        }
      }
    }
  }
}
