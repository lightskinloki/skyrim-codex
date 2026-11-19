import type { Facing } from './room';
import type { Scene } from './gl/scene';

/**
 * Walking a body across the board.
 *
 * A move is a path, never a teleport: the route is what decides which cells were
 * crossed, and the same route is what the animation plays and what the board
 * records. That is the part the combat rules depend on — an opportunity attack
 * is a fact about a path — so the planner and the animation must not disagree
 * about where the body went.
 *
 * The planner works on the scene, not on the picture. Walls, tier sides, tables
 * and crates are all colliders with a height, so a walk routes around them and
 * a step up is a real step; no separate collision map exists to drift from the
 * geometry the renderer draws.
 */

/** A point on a walk, in cell units. `x` and `z` are world coordinates — cell
 *  12.5 is the middle of cell 12 — and `y` is the deck stood on, in cells. */
export type WalkCell = { x: number; y: number; z: number };

/** The height a walker can step up in one cell. Stairs are a run of colliders
 *  that each rise less than this, which is why a path can climb without the
 *  planner knowing what a stair is. */
export const WALK_STEP = 0.45;
/** The height a walker will step down without it becoming a fall. A table or a
 *  low ledge is a step; a ten-foot drop is not, and has to be a deliberate move. */
export const WALK_DROP = 1.15;
/** A staircase is a run of steps, not a wall. One cell of it can rise more than
 *  a single step and still be climbed, which is why the stair colliders carry a
 *  `climb` mark: the allowance is for ramps, never for furniture. */
export const STAIR_STEP = 1.2;
/** What the body needs above its feet to pass under a thing — a doorway head, a
 *  gallery deck, a bridge. */
export const WALK_CLEAR = 0.62;

/** Milliseconds for one cell of travel. A move is one action however long the
 *  path is, so this is a presentation speed, not a rules budget. */
export const WALK_MS_PER_CELL = 200;
/** A pose every 100 ms: four poses a cycle, two cycles a second. */
export const WALK_POSE_MS = 100;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const round = (v: number) => Math.round(v * 1000) / 1000;

/** The authored facing that looks along a step. Ties go to the horizontal,
 *  which is the axis the sprites read most clearly on. */
export const facingBetween = (ax: number, az: number, bx: number, bz: number): Facing => {
  const dx = bx - ax;
  const dz = bz - az;
  if (Math.abs(dx) >= Math.abs(dz)) return dx >= 0 ? 3 : 2;
  return dz >= 0 ? 0 : 1;
};

/**
 * The deck a walker coming from `fromY` stands on in a cell, or null when the
 * cell is not walkable. This is stricter than `surfaceAt`: a surface is not a
 * step. A crate is a surface at 0.47, but 0.47 is too tall to step onto and too
 * short to walk under, so the cell is an obstacle rather than a step.
 */
export function supportAt(
  scene: Scene,
  cx: number,
  cz: number,
  fromY: number,
  stepUp = WALK_STEP,
): number | null {
  if (cx < 0 || cz < 0 || cx >= scene.cols || cz >= scene.rows) return null;
  if (scene.grid[cz * scene.cols + cx] !== 1) return null;

  const x = cx + 0.5;
  const z = cz + 0.5;
  let best = 0; // the floor under every walkable cell
  let bestClimb = false;

  for (let i = 0; i < scene.colliders.length; i++) {
    const c = scene.colliders[i];
    if (x < c.x0 || x > c.x1 || z < c.z0 || z > c.z1) continue;
    // Overhead: a doorway head, a gallery, the underside of a bridge. It is
    // above the body, so it is not in the way.
    if (c.base >= fromY + WALK_CLEAR) continue;
    if (c.climb) {
      if (c.top <= fromY + STAIR_STEP + 1e-6) {
        if (c.top > best) {
          best = c.top;
          bestClimb = true;
        }
        continue;
      }
      return null;
    }
    if (c.top <= fromY + stepUp + 1e-6) {
      if (c.top > best) best = c.top;
      continue;
    }
    // Taller than a step and not overhead: a wall, a table, a barrel, a tree.
    return null;
  }

  // A drop is not a step. Walking off a table is fine; walking off a cliff is a
  // different move (and, eventually, a fall), so the route refuses it rather
  // than silently teleporting the body downwards. A staircase is the exception:
  // its treads are spaced like its risers, so leaving one is a stair-sized drop.
  if (best < fromY - (bestClimb ? STAIR_STEP : WALK_DROP) - 1e-6) return null;
  return best;
}

/** Is this cell a stair tread at this height? A body standing on a staircase
 *  may take a stair-sized step off it; a body on the floor beside the same
 *  shelf may not. That is the whole difference between climbing stairs and
 *  climbing a wall. */
function onStair(scene: Scene, cx: number, cz: number, y: number): boolean {
  const x = cx + 0.5;
  const z = cz + 0.5;
  for (let i = 0; i < scene.colliders.length; i++) {
    const c = scene.colliders[i];
    if (!c.climb) continue;
    if (x < c.x0 || x > c.x1 || z < c.z0 || z > c.z1) continue;
    if (Math.abs(c.top - y) < 0.01) return true;
  }
  return false;
}

/* ----------------------------------------------------------------- planner */

type HeapNode = { i: number; f: number };

class Heap {
  private items: HeapNode[] = [];

  get size() {
    return this.items.length;
  }

  push(node: HeapNode) {
    const a = this.items;
    a.push(node);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].f <= a[i].f) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }

  pop(): HeapNode | undefined {
    const a = this.items;
    if (!a.length) return undefined;
    const top = a[0];
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l].f < a[m].f) m = l;
        if (r < a.length && a[r].f < a[m].f) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}

const neighbours: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

/**
 * A route from `from` to the cell containing `to`, as cell centres. Returns null
 * when there is no walkable route — a wall, a chasm, a drop the body will not
 * take. The start cell is included, so the route is a complete sequence of
 * squares; the animator prepends the body's exact position to rejoin it.
 */
export function findWalkPath(scene: Scene, from: WalkCell, to: { x: number; z: number }): WalkCell[] | null {
  const { cols, rows } = scene;
  const n = cols * rows;
  const sx = Math.floor(from.x);
  const sz = Math.floor(from.z);
  const gx = Math.floor(to.x);
  const gz = Math.floor(to.z);
  if (sx < 0 || sz < 0 || sx >= cols || sz >= rows) return null;
  if (gx < 0 || gz < 0 || gx >= cols || gz >= rows) return null;
  if (scene.grid[gz * cols + gx] !== 1) return null;

  const start = sz * cols + sx;
  const goal = gz * cols + gx;
  if (start === goal) return [{ x: from.x, y: from.y, z: from.z }];

  const cost = new Float32Array(n).fill(Infinity);
  const deck = new Float32Array(n);
  const stair = new Uint8Array(n);
  const parent = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const heap = new Heap();

  const heur = (x: number, z: number) => Math.max(Math.abs(gx - x), Math.abs(gz - z));

  cost[start] = 0;
  deck[start] = from.y;
  stair[start] = onStair(scene, sx, sz, from.y) ? 1 : 0;
  heap.push({ i: start, f: heur(sx, sz) });

  let found = false;
  while (heap.size) {
    const node = heap.pop()!;
    const i = node.i;
    if (closed[i]) continue;
    if (i === goal) {
      found = true;
      break;
    }
    closed[i] = 1;
    const x = i % cols;
    const z = (i / cols) | 0;
    const y = deck[i];
    // While on a tread, one cell may rise the rest of a staircase; on the
    // floor, it may only rise one ordinary step.
    const stepUp = stair[i] ? STAIR_STEP : WALK_STEP;

    for (const [dx, dz] of neighbours) {
      const nx = x + dx;
      const nz = z + dz;
      if (nx < 0 || nz < 0 || nx >= cols || nz >= rows) continue;
      const ni = nz * cols + nx;
      if (closed[ni]) continue;

      const ny = supportAt(scene, nx, nz, y, stepUp);
      if (ny === null) continue;
      // A diagonal may not cut the corner of a wall or a table. Both orthogonal
      // cells have to be standable from the same deck, or the body would pass
      // through the corner of a solid.
      if (dx !== 0 && dz !== 0) {
        if (supportAt(scene, nx, z, y, stepUp) === null || supportAt(scene, x, nz, y, stepUp) === null) continue;
      }

      const next = cost[i] + 1;
      if (next >= cost[ni]) continue;
      cost[ni] = next;
      deck[ni] = ny;
      stair[ni] = onStair(scene, nx, nz, ny) ? 1 : 0;
      parent[ni] = i;
      heap.push({ i: ni, f: next + heur(nx, nz) });
    }
  }

  if (!found) return null;

  const chain: WalkCell[] = [];
  for (let i = goal; i !== -1; i = parent[i]) {
    chain.push({ x: (i % cols) + 0.5, y: round(deck[i]), z: ((i / cols) | 0) + 0.5 });
    if (i === start) break;
  }
  chain.reverse();
  // The route speaks in squares, so the first point is the centre of the cell
  // the body occupies. Its exact (possibly off-centre) position is the
  // animator's business: it prepends one point and glides onto the lattice.
  chain[0] = { x: sx + 0.5, y: from.y, z: sz + 0.5 };
  return chain;
}

/**
 * A route through several clicked points. Each leg is planned from where the
 * last one finished, so a waypoint up a stair is a climb and not a teleport;
 * the duplicate first cell of every leg after the first is dropped. The caller
 * owns the points, which means the preview, the commit and the test all use the
 * same concatenation.
 */
export function findWalkRoute(
  scene: Scene,
  from: WalkCell,
  points: { x: number; z: number }[],
): WalkCell[] | null {
  let at = from;
  let path: WalkCell[] | null = null;
  for (const point of points) {
    const leg = findWalkPath(scene, at, point);
    if (!leg) return null;
    path = path ? [...path, ...leg.slice(1)] : leg;
    at = leg[leg.length - 1];
  }
  return path;
}

/* -------------------------------------------------------------------- walk */

export type WalkPlan = {
  id: string;
  /** Where the body was, then every cell centre on the route. */
  cells: WalkCell[];
  /** Total distance in cells, which is what the speed is measured in. */
  length: number;
  startedAt: number;
  endsAt: number;
};

export type WalkMotion = {
  x: number;
  y: number;
  z: number;
  facing: Facing;
  /** 0..3, the step cycle. 0 and 2 are passing poses, 1 and 3 are strides. */
  step: number;
  done: boolean;
};

/** Turns a planned route into a clock. The first cell is the body's current
 *  position; every later one is a lattice step. The speed is per cell of
 *  distance, so a diagonal takes as long as it looks like it should, and the
 *  half-cell nudge onto the lattice does not cost a whole step. */
export function planWalk(id: string, cells: WalkCell[], now: number): WalkPlan {
  let length = 0;
  for (let i = 1; i < cells.length; i++) {
    length += Math.hypot(cells[i].x - cells[i - 1].x, cells[i].z - cells[i - 1].z);
  }
  const ms = Math.max(260, length * WALK_MS_PER_CELL);
  return { id, cells, length, startedAt: now, endsAt: now + ms };
}

export function motionAt(plan: WalkPlan, now: number): WalkMotion {
  const span = Math.max(1, plan.endsAt - plan.startedAt);
  const t = clamp((now - plan.startedAt) / span, 0, 1);
  const target = t * plan.length;
  let i = 0;
  let acc = 0;
  let seg = 0;
  for (; i < plan.cells.length - 2; i++) {
    seg = Math.hypot(plan.cells[i + 1].x - plan.cells[i].x, plan.cells[i + 1].z - plan.cells[i].z);
    if (target <= acc + seg) break;
    acc += seg;
  }
  const a = plan.cells[i];
  const b = plan.cells[i + 1] ?? a;
  seg = Math.hypot(b.x - a.x, b.z - a.z) || 1;
  const f = clamp((target - acc) / seg, 0, 1);

  const done = now >= plan.endsAt;
  // Standing still is pose 0. A walk cycles on the clock, not on distance, so a
  // long move does not blur and a one-cell step still takes a full stride.
  const step = done ? 0 : Math.floor(Math.max(0, now - plan.startedAt) / WALK_POSE_MS) % 4;

  return {
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
    z: a.z + (b.z - a.z) * f,
    facing: facingBetween(a.x, a.z, b.x, b.z),
    step,
    done,
  };
}

/** A finished walk becomes the token's new home. `at` is the lattice cell the
 *  body is standing in, which is what the document speaks in. */
export function landing(plan: WalkPlan): { at: [number, number]; facing: Facing; y: number } {
  const a = plan.cells[plan.cells.length - 2] ?? plan.cells[0];
  const b = plan.cells[plan.cells.length - 1];
  return {
    at: [round(b.x - 0.5), round(b.z - 0.5)],
    facing: facingBetween(a.x, a.z, b.x, b.z),
    y: round(b.y),
  };
}
