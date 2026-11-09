/** Dump each camera view at 1:1 for pixel-level inspection. Diagnostic only. */
import { writeFileSync } from 'fs';
import { makeDemoRoom } from '@/battlemap/room';
import { placeProp, drawPlaced, PlacedProp, PropRule } from '@/battlemap/props';
import { rotateGrid } from '@/battlemap/camera';
import { buildNormals } from '@/battlemap/normals';
import { makeLightCache, shade } from '@/battlemap/light';
import { BOTTOM_MARGIN, CELL, RIGHT_MARGIN, TOP_MARGIN, paintRoom } from '@/battlemap/paint';
import { Surface } from '@/battlemap/surface';

const room = makeDemoRoom();

for (const yaw of [0, 1, 2, 3]) {
  const g = rotateGrid(room.grid, yaw);
  const w = g.cols * CELL + RIGHT_MARGIN;
  const h = g.rows * CELL + TOP_MARGIN + BOTTOM_MARGIN;
  const s = new Surface(w, h);
  paintRoom(s, g, TOP_MARGIN);

  const placed: PlacedProp[] = room.props
    .map((p: PropRule) => placeProp(p, g.seed, TOP_MARGIN, yaw, room.grid.cols, room.grid.rows))
    .sort((a, b) => a.front - b.front);
  for (const q of placed) drawPlaced(s, q, g.seed);

  const n = buildNormals(s, 0.62);
  shade(s, n, room.rig, s.col, 0, makeLightCache(w, h));

  const bytes = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const c = s.col[i];
    bytes[i * 4 + 0] = c & 255;
    bytes[i * 4 + 1] = (c >>> 8) & 255;
    bytes[i * 4 + 2] = (c >>> 16) & 255;
    bytes[i * 4 + 3] = 255;
  }
  writeFileSync(`node_modules/board-${yaw}.rgba`, bytes);
  console.log(`yaw ${yaw}: ${w}x${h}`);
}

// Where every prop actually lands, so a crop can be reasoned about.
for (const yaw of [0, 1, 2, 3]) {
  const rows = room.props.map((p) => {
    const q = placeProp(p, room.grid.seed, TOP_MARGIN, yaw, room.grid.cols, room.grid.rows);
    return {
      rule: p.rule,
      at: p.at,
      screen: [q.sx, q.sy],
      foot: q.front,
      size: [q.cellsX, q.cellsY],
    };
  });
  writeFileSync(`node_modules/board-${yaw}.json`, JSON.stringify(rows, null, 1));
}
