import { COLOUR_OF, M_FIRE, Surface, TAG } from './surface';
import { CELL } from './paint';

/**
 * The path overlay. Tokens themselves are characters now — see
 * `src/characters/body.ts` and docs/PIXEL-ART-SPEC.md §3.
 *
 * The chain is an annotation of the *floor*, so it only ever lands on floor
 * pixels: a route that crosses a table or a wall does not get drawn over the
 * furniture, which is what made a committed path look like it was hovering.
 */

/** A dotted path chain with one arrowhead on the final cell (PRESENTATION X8). */
export function drawPath(s: Surface, path: [number, number][], margin = 0) {
  const dot = COLOUR_OF[(M_FIRE << 4) + 5];
  const head = COLOUR_OF[(M_FIRE << 4) + 10];
  const put = (x: number, y: number, c: number) => {
    if (x < 0 || y < 0 || x >= s.w || y >= s.h) return;
    const k = y * s.w + x;
    if (s.tag[k] !== TAG.FLOOR) return;
    s.col[k] = c;
  };

  for (let n = 0; n < path.length; n++) {
    const [cx, cy] = path[n];
    const x0 = cx * CELL;
    const y0 = margin + cy * CELL;
    for (let j = 10; j < 24; j += 4) {
      for (let i = 10; i < 24; i += 4) {
        if (((i >> 2) + (j >> 2)) % 2 === 0) continue;
        put(x0 + i, y0 + j, dot);
      }
    }
    if (n === path.length - 1) {
      for (let k = 0; k < 5; k++) {
        const x = x0 + 15 + k;
        for (let r = -k; r <= k; r += 2) put(x, y0 + 17 + r, head);
      }
    }
  }
}
