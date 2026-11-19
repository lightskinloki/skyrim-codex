/**
 * The one guarantee that matters for the board: a prop stands on its footprint.
 *
 * For every prop and every quarter turn, project it, invert both corners of the
 * projected rectangle, and check we get the original rectangle back. If this can
 * fail, an object can move when the camera turns — exactly the bug this model
 * replaced. (The camera rect's minimum corner is a different room corner after a
 * turn, so corners are compared as a set, not one at a time.)
 *
 * Run with `npm run test:props`.
 */
import { makeDemoRoom } from '@/battlemap/room';
import { placeProp } from '@/battlemap/props';
import { toWorld } from '@/battlemap/camera';
import { CELL, TOP_MARGIN } from '@/battlemap/paint';

const room = makeDemoRoom();
const { cols, rows } = room.grid;
let checks = 0;
let failures = 0;

const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
/** The rectangle a pair of opposite corners describes, normalised. An odd turn
 *  hands back the other diagonal, which is the same rectangle. */
const rectOf = (p: [number, number][]) => [
  Math.min(p[0][0], p[1][0]),
  Math.min(p[0][1], p[1][1]),
  Math.max(p[0][0], p[1][0]),
  Math.max(p[0][1], p[1][1]),
];
const sameRect = (a: [number, number][], b: [number, number][]) => rectOf(a).every((v, i) => near(v, rectOf(b)[i]));

for (const yaw of [0, 1, 2, 3]) {
  for (const p of room.props) {
    const q = placeProp(p, room.grid.seed, TOP_MARGIN, yaw, cols, rows);
    const art = q.art;

    // The top plane is lifted by `height`; undo the lift to get the footprint.
    const cam = [
      [q.sx / CELL, (q.sy + art.height - TOP_MARGIN) / CELL] as [number, number],
      [(q.sx + q.cellsX * CELL) / CELL, (q.sy + art.height + q.cellsY * CELL - TOP_MARGIN) / CELL] as [number, number],
    ];
    const back = cam.map(([x, y]) => toWorld(x, y, cols, rows, yaw)) as [number, number][];
    const want: [number, number][] = [
      [p.at[0], p.at[1]],
      [p.at[0] + art.cellsX, p.at[1] + art.cellsY],
    ];

    checks++;
    if (!sameRect(back, want)) {
      failures++;
      console.log(`MOVE  ${p.rule} yaw ${yaw}: ${JSON.stringify(back)} != ${JSON.stringify(want)}`);
      continue;
    }

    // A quarter turn swaps the footprint's sides.
    const wantW = yaw & 1 ? art.cellsY : art.cellsX;
    const wantH = yaw & 1 ? art.cellsX : art.cellsY;
    if (!near(q.cellsX, wantW) || !near(q.cellsY, wantH)) {
      failures++;
      console.log(`SHAPE ${p.rule} yaw ${yaw}: ${q.cellsX}x${q.cellsY} != ${wantW}x${wantH}`);
    }

    // Subpixel placement would soften the art and drift over repeated turns.
    if (!Number.isInteger(q.sx) || !Number.isInteger(q.sy)) {
      failures++;
      console.log(`SOFT  ${p.rule} yaw ${yaw}: ${q.sx}, ${q.sy} is not on a pixel boundary`);
    }
  }
}

console.log(`\n${checks} footprints x turns checked, ${failures} failure(s)`);
if (failures > 0) process.exit(1);
