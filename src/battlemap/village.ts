import type { PropRule } from './props';
import type { GroundKind, Room, RoomDoor, Tier, TokenPlacement } from './room';
import { CELL, type RoomGrid } from './paint';
import type { PointLight } from './light';
import { preset, PRESETS, type CharacterSpec } from '@/characters/spec';

/**
 * Ivarstead, as three rooms: the village green, the inn, and the trading hall.
 *
 * The village is the first board that is not an interior. It is the same
 * document format — terrain, ground, props, doors, lights — with a river in it
 * and houses that are real volumes. The two interiors exist to prove the thing
 * the dungeon needs: a door is a link to another document, and the party walks
 * through a loading screen, not a hole in a wall.
 *
 * This is an authoring source, not a runtime builder: `rooms:export` writes the
 * three JSON documents beside the tavern and the cavern.
 */

type Builder = {
  cols: number;
  rows: number;
  seed: number;
  g: RoomGrid;
  props: PropRule[];
  doors: RoomDoor[];
  tokens: TokenPlacement[];
  tiers: Tier[];
  points: PointLight[];
};

const makeBuilder = (cols: number, rows: number, seed: number, walled = true): Builder => {
  const g: RoomGrid = { cols, rows, seed, cells: new Uint8Array(cols * rows) };
  if (walled) {
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        const edge = x === 0 || z === 0 || x === cols - 1 || z === rows - 1;
        g.cells[z * cols + x] = edge ? 2 : 1;
      }
    }
  } else {
    g.cells.fill(1);
  }
  g.ground = new Uint8Array(cols * rows);
  return { cols, rows, seed, g, props: [], doors: [], tokens: [], tiers: [], points: [] };
};

const at = (b: Builder, x: number, z: number): number => {
  if (x < 0 || z < 0 || x >= b.cols || z >= b.rows) return 0;
  return b.g.cells[z * b.cols + x];
};

const cell = (b: Builder, x: number, z: number, v: number) => {
  if (x < 0 || z < 0 || x >= b.cols || z >= b.rows) return;
  b.g.cells[z * b.cols + x] = v;
};

const rect = (b: Builder, x: number, z: number, w: number, h: number, v: number) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) cell(b, x + i, z + j, v);
};

/** Ground only lands on walkable cells: under a wall it would be a lie. */
const ground = (b: Builder, x: number, z: number, w: number, h: number, kind: GroundKind) => {
  const id = GROUND.indexOf(kind);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const cx = x + i;
      const cz = z + j;
      if (at(b, cx, cz) !== 1) continue;
      b.g.ground![cz * b.cols + cx] = id;
    }
  }
};

const GROUND: GroundKind[] = ['stone', 'grass', 'dirt', 'water', 'wood'];

const house = (
  b: Builder,
  x: number,
  z: number,
  w: number,
  h: number,
  opts: { roof?: 'thatch' | 'wood'; door?: 'n' | 's' | 'e' | 'w' } = {},
) => {
  b.props.push({ rule: 'house', at: [x, z], w, h, roof: 'thatch', door: 's', ...opts });
};

const tree = (b: Builder, x: number, z: number, size = 2, autumn = true) => {
  b.props.push({ rule: 'tree', at: [x, z], size, autumn });
};

const door = (b: Builder, id: string, x: number, z: number, to?: { room: string; door: string }, label?: string, state?: 'open' | 'closed' | 'locked') => {
  const d: RoomDoor = { id, at: [x, z] };
  if (label) d.label = label;
  if (state) d.state = state;
  if (to) d.to = to;
  b.doors.push(d);
};

const finish = (
  b: Builder,
  meta: { rig: Room['rig']; wallHeight?: number; path?: [number, number][] },
): Room => {
  const room: Room = {
    grid: b.g,
    props: b.props,
    tokens: b.tokens,
    doors: b.doors,
    path: meta.path ?? [],
    rig: meta.rig,
  };
  if (b.tiers.length) room.tiers = b.tiers;
  if (meta.wallHeight !== undefined) room.wallHeight = meta.wallHeight;
  return room;
};

/* ------------------------------------------------------------- the village */

export function makeIvarstead(): Room {
  const b = makeBuilder(34, 44, 0x1a4_5d01, true);
  // The Treva runs down the west side, from the falls in the north to the
  // bridge. It is one continuous ribbon of water, because a river with gaps in
  // it reads as three ponds.
  for (let z = 1; z < 43; z++) {
    for (let x = 3; x <= 6; x++) cell(b, x, z, 1);
  }
  // Grass everywhere the village is not paved.
  ground(b, 1, 1, 32, 42, 'grass');
  ground(b, 3, 1, 4, 42, 'water');

  // The road in, the green, and the two approaches. Painted after the grass and
  // before anything stands on it, so a doorstep is always dirt.
  ground(b, 15, 24, 4, 19, 'dirt');
  ground(b, 8, 21, 23, 3, 'dirt');
  ground(b, 17, 17, 3, 5, 'dirt');
  ground(b, 25, 23, 3, 3, 'dirt');

  // A stone landing at each end of the bridge, so the ford does not look like a
  // path that forgot to stop.
  ground(b, 7, 21, 2, 3, 'stone');
  ground(b, 2, 21, 1, 3, 'stone');

  // The bridge is a storey, not a prop: a wood deck at knee height with real
  // faces down into the water, and steps at both banks.
  b.tiers.push({ y: 0.45, deck: 'wood', rects: [[3, 21, 5, 3]] });
  b.props.push({ rule: 'stairs', at: [8, 21], w: 3, rise: 0.45, run: 1.2, along: 'x', dir: -1 });
  b.props.push({ rule: 'stairs', at: [1.8, 21], w: 3, rise: 0.45, run: 1.2, along: 'x', dir: 1 });
  // Rails, as benches on the deck: the same rule, at bridge height.
  b.props.push({ rule: 'bench', at: [3.2, 21.03], w: 4.6, y: 0.45 });
  b.props.push({ rule: 'bench', at: [3.2, 23.4], w: 4.6, y: 0.45 });

  // Vilemyr Inn, facing the road.
  house(b, 16, 12, 7, 5, { roof: 'thatch', door: 's' });
  door(b, 'inn-door', 19, 18, { room: 'vilemyr-inn', door: 'inn-exit' }, 'Vilemyr Inn');

  // The trading hall on the east side of the green.
  house(b, 24, 17, 5, 4, { roof: 'wood', door: 's' });
  door(b, 'trader-door', 26, 22, { room: 'trader-hall', door: 'trader-exit' }, 'Ivarstead Traders');

  // Two houses that are only facades for now: a locked door is a promise that
  // the interior is a document someone has not written yet.
  house(b, 22, 7, 4, 4, { roof: 'thatch', door: 's' });
  door(b, 'hunt-door', 23, 12, undefined, "Hunter's cottage", 'locked');
  house(b, 9, 29, 5, 4, { roof: 'thatch', door: 's' });
  door(b, 'south-house-door', 11, 34, undefined, 'Cottage', 'locked');

  // A couple of outbuildings and a shed, so the skyline is not one row.
  house(b, 27, 28, 4, 3, { roof: 'wood', door: 'w' });
  door(b, 'shed-door', 26, 29, undefined, 'Storehouse', 'locked');
  house(b, 11, 5, 4, 3, { roof: 'thatch', door: 'e' });

  // Trees down both banks. Nothing on the road, nothing in a doorway.
  for (const [x, z, s, autumn] of [
    [8.4, 3.2, 3, true], [9.4, 4.6, 2, false], [13.2, 3.4, 3, true], [28.4, 5.2, 3, false],
    [30.2, 9.4, 2, true], [29.4, 13.2, 3, true], [30.4, 20.2, 2, false], [31.2, 25.4, 3, true],
    [29.6, 33.4, 2, false], [31.4, 37.2, 3, true], [24.4, 35.4, 3, true], [20.2, 38.2, 2, false],
    [8.4, 12.2, 2, false], [8.2, 17.4, 3, true], [1.4, 5.2, 2, false], [1.4, 12.4, 3, true],
    [1.6, 30.4, 2, true], [2.2, 39.2, 2, false], [13.4, 18.2, 2, true], [12.4, 25.2, 1, false],
  ] as [number, number, number, boolean][]) {
    tree(b, x, z, s, autumn);
  }

  // Yard clutter. Barrels by the inn door, crates by the trader, a bench on the
  // green, and a fire the guards stand around.
  b.props.push({ rule: 'barrel', at: [17.2, 18.1] });
  b.props.push({ rule: 'barrel', at: [17.9, 18.35] });
  b.props.push({ rule: 'crate', at: [28.6, 22.2] });
  b.props.push({ rule: 'crate', at: [28.7, 22.9] });
  b.props.push({ rule: 'bench', at: [21.2, 24.2], w: 2.4 });
  b.props.push({ rule: 'bench', at: [21.2, 24.8], w: 2.4 });
  b.props.push({ rule: 'brazier', at: [20.5, 22.3], lit: true });
  b.props.push({ rule: 'rubble', at: [7.4, 26.2], size: 2 });
  b.props.push({ rule: 'rubble', at: [27.3, 16.1], size: 1 });

  b.tokens.push(
    { id: 'pc-1', spec: preset('knight'), at: [16.4, 39.4], facing: 1, party: true },
    { id: 'guard-1', spec: PRESETS[2] as CharacterSpec, at: [7.4, 22.5], facing: 2 },
    { id: 'innkeeper-1', spec: PRESETS[1] as CharacterSpec, at: [18.4, 19.2], facing: 3 },
    { id: 'trader-1', spec: preset('smith'), at: [26.2, 22.2], facing: 0 },
  );

  b.points.push(
    { id: 'square-fire', x: 20.9 * CELL, y: 2.4 * CELL, radius: 4.2 * CELL, intensity: 1.25, flicker: 0.4 },
    { id: 'inn-lamp', x: 19.5 * CELL, y: 2 * CELL, radius: 3.4 * CELL, intensity: 0.85, flicker: 0.12 },
  );

  return finish(b, {
    wallHeight: 1.15,
    rig: {
      ambient: 0.36,
      sun: { azimuth: 232, elevation: 54, intensity: 1.04 },
      points: b.points,
    },
    path: [
      [16, 40], [16, 36], [17, 32], [17, 28], [16, 24], [14, 22],
      [12, 22], [10, 22], [8, 22], [6, 22], [4, 22], [2, 22],
    ],
  });
}

/* ----------------------------------------------------------------- the inn */

export function makeInn(): Room {
  const b = makeBuilder(18, 14, 0x1_51de, true);
  ground(b, 1, 1, 16, 12, 'wood');
  // A stone hearth corner, because the fire should not be on floorboards.
  ground(b, 14, 1, 3, 3, 'stone');

  // The doorway is a gap in the south wall, not a mat in front of one.
  cell(b, 9, 13, 1);
  ground(b, 9, 13, 1, 1, 'wood');
  door(b, 'inn-exit', 9, 13, { room: 'ivarstead', door: 'inn-door' }, 'Ivarstead');

  // The bar, back wall shelving, and the long tables.
  b.props.push({ rule: 'shelf', at: [2, 1.15], w: 5 });
  b.props.push({ rule: 'shelf', at: [2, 3.1], w: 5 });
  b.props.push({ rule: 'table', at: [2.2, 5.1], w: 5 });
  b.props.push({ rule: 'bench', at: [2.2, 6.2], w: 5 });
  b.props.push({ rule: 'bench', at: [2.2, 4.4], w: 5 });
  b.props.push({ rule: 'table', at: [10.5, 4.2], w: 2 });
  b.props.push({ rule: 'bench', at: [10.5, 5.2], w: 2 });
  b.props.push({ rule: 'bench', at: [10.5, 3.6], w: 2 });
  b.props.push({ rule: 'table', at: [10.5, 8.4], w: 2 });
  b.props.push({ rule: 'bench', at: [10.5, 9.4], w: 2 });
  b.props.push({ rule: 'rug', at: [9.8, 6.4], w: 3.4, h: 2.2, navy: true });

  // Hearth: brazier, a stack of barrels, and a chest that is the inn's till.
  b.props.push({ rule: 'brazier', at: [15.2, 1.4], lit: true });
  b.props.push({ rule: 'barrel', at: [13.6, 1.3] });
  b.props.push({ rule: 'barrel', at: [14.2, 2.0] });
  b.props.push({ rule: 'chest', at: [13.2, 9.4], w: 1.4, bands: 2 });
  b.props.push({ rule: 'crate', at: [15.8, 9.2] });
  b.props.push({ rule: 'crate', at: [15.8, 8.5] });
  b.props.push({ rule: 'rubble', at: [6.4, 12.2], size: 1 });

  b.tokens.push(
    { id: 'pc-1', spec: preset('knight'), at: [9.4, 12.4], facing: 1, party: true },
    { id: 'innkeeper-1', spec: PRESETS[1] as CharacterSpec, at: [4.2, 4.6], facing: 2 },
    { id: 'patron-1', spec: PRESETS[2] as CharacterSpec, at: [11.4, 5.4], facing: 1 },
  );

  b.points.push({ id: 'hearth', x: 15.8 * CELL, y: 2.2 * CELL, radius: 5 * CELL, intensity: 1.5, flicker: 0.45 });

  return finish(b, {
    wallHeight: 2.2,
    rig: { ambient: 0.22, sun: { azimuth: 190, elevation: 32, intensity: 0.6 }, points: b.points },
    path: [[9, 12], [9, 10], [9, 8]],
  });
}

/* -------------------------------------------------------------- the trader */

export function makeTrader(): Room {
  const b = makeBuilder(14, 10, 0x7ade_5eed, true);
  ground(b, 1, 1, 12, 8, 'stone');

  cell(b, 7, 9, 1);
  ground(b, 7, 9, 1, 1, 'stone');
  door(b, 'trader-exit', 7, 9, { room: 'ivarstead', door: 'trader-door' }, 'Ivarstead');

  b.props.push({ rule: 'shelf', at: [2, 1.1], w: 4 });
  b.props.push({ rule: 'shelf', at: [10.2, 2.0], w: 2 });
  b.props.push({ rule: 'shelf', at: [10.2, 4.5], w: 2 });
  b.props.push({ rule: 'table', at: [3.2, 3.4], w: 4 });
  b.props.push({ rule: 'chest', at: [8.4, 2.2], w: 1.2, bands: 2 });
  b.props.push({ rule: 'crate', at: [2.2, 7.1] });
  b.props.push({ rule: 'crate', at: [2.9, 7.2] });
  b.props.push({ rule: 'crate', at: [2.6, 7.8] });
  b.props.push({ rule: 'barrel', at: [11.4, 7.1] });
  b.props.push({ rule: 'barrel', at: [10.6, 7.3] });
  b.props.push({ rule: 'rug', at: [5.2, 5.12], w: 3.2, h: 1.9, navy: false });
  b.props.push({ rule: 'brazier', at: [11.6, 1.2], lit: true });

  b.tokens.push(
    { id: 'pc-1', spec: preset('knight'), at: [7.4, 8.4], facing: 1, party: true },
    { id: 'trader-1', spec: preset('smith'), at: [4.2, 4.4], facing: 2 },
  );

  b.points.push({ id: 'counter-lamp', x: 7 * CELL, y: 2.1 * CELL, radius: 4 * CELL, intensity: 1.15, flicker: 0.2 });

  return finish(b, {
    wallHeight: 2.1,
    rig: { ambient: 0.24, sun: { azimuth: 210, elevation: 38, intensity: 0.62 }, points: b.points },
    path: [[7, 8], [7, 6], [6, 5]],
  });
}
