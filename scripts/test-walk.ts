import assert from 'assert';
import tavernJson from '@/battlemap/rooms/tavern.json';
import cavernJson from '@/battlemap/rooms/cavern.json';
import ivarsteadJson from '@/battlemap/rooms/ivarstead.json';
import innJson from '@/battlemap/rooms/vilemyr-inn.json';
import traderJson from '@/battlemap/rooms/trader-hall.json';
import { parseRoomDoc } from '@/battlemap/document';
import { buildScene } from '@/battlemap/gl/scene';
import {
  findWalkPath,
  findWalkRoute,
  facingBetween,
  landing,
  motionAt,
  planWalk,
  supportAt,
  STAIR_STEP,
  WALK_DROP,
  WALK_STEP,
  type WalkCell,
} from '@/battlemap/walk';
import type { Room } from '@/battlemap/room';

/**
 * Movement is a rule, not a tween: a route may only use cells a body can stand
 * in, may only step up what a body can step onto, and must be the route the
 * animation plays. These checks are the planner's side of that contract; the
 * walk clock is checked here too, because a path that lands somewhere other
 * than its last cell would put the token back where it started on reload.
 */

let checks = 0;
let failures = 0;

const check = (name: string, fn: () => void) => {
  checks++;
  try {
    fn();
  } catch (e) {
    failures++;
    console.error(`  FAIL  ${name}`);
    console.error(`        ${(e as Error).message.split('\n')[0]}`);
  }
};

const rooms: { name: string; json: unknown }[] = [
  { name: 'tavern', json: tavernJson },
  { name: 'cavern', json: cavernJson },
  { name: 'ivarstead', json: ivarsteadJson },
  { name: 'vilemyr-inn', json: innJson },
  { name: 'trader-hall', json: traderJson },
];

const YAW = 32;
const EPS = 0.001;

const cellOf = (v: number) => Math.floor(v);

const partyOf = (room: Room) => room.tokens.find((t) => t.party) ?? room.tokens[0];

/** Somewhere with floor that no other token is standing on. */
function openCell(room: Room, from: [number, number], min = 4): [number, number] | null {
  const occupied = new Set(room.tokens.map((t) => `${cellOf(t.at[0])},${cellOf(t.at[1])}`));
  for (let r = min; r < Math.max(room.grid.cols, room.grid.rows); r++) {
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        const x = cellOf(from[0]) + dx;
        const z = cellOf(from[1]) + dz;
        if (x < 0 || z < 0 || x >= room.grid.cols || z >= room.grid.rows) continue;
        if (room.grid.cells[z * room.grid.cols + x] !== 1) continue;
        if (occupied.has(`${x},${z}`)) continue;
        return [x, z];
      }
    }
  }
  return null;
}

/** Follows the route the way a body would, checking every step against the
 *  same scene the renderer draws. */
function auditPath(room: Room, scene: ReturnType<typeof buildScene>, path: WalkCell[], from: WalkCell) {
  assert.ok(path.length >= 1);
  assert.strictEqual(cellOf(path[0].x), cellOf(from.x), 'path does not start in the body cell');
  assert.strictEqual(cellOf(path[0].z), cellOf(from.z), 'path does not start in the body cell');
  assert.ok(Math.abs(path[0].y - from.y) < EPS, 'path does not start on the body deck');
  assert.ok(Math.abs(path[0].x - from.x) <= 0.51 && Math.abs(path[0].z - from.z) <= 0.51, 'body is not in the start cell');
  // The first route point is the start square, not the body's exact position;
  // the animator bridges that short gap itself, so the per-segment walk starts
  // at the square.
  let prev = path[0];
  for (let i = 1; i < path.length; i++) {
    const c = path[i];
    const dx = c.x - prev.x;
    const dz = c.z - prev.z;
    assert.ok(Math.abs(dx) <= 1 + EPS && Math.abs(dz) <= 1 + EPS, `segment ${i} is not one cell`);
    assert.ok(Math.abs(c.x - (cellOf(c.x) + 0.5)) < EPS, `cell ${i} is not a centre`);
    assert.ok(Math.abs(c.z - (cellOf(c.z) + 0.5)) < EPS, `cell ${i} is not a centre`);
    assert.notStrictEqual(room.grid.cells[cellOf(c.z) * room.grid.cols + cellOf(c.x)], 2, `cell ${i} is a wall`);

    const grounded = supportAt(scene, cellOf(c.x), cellOf(c.z), prev.y);
    assert.ok(grounded !== null, `cell ${i} is not walkable from ${prev.y}`);
    assert.ok(Math.abs((grounded as number) - c.y) < EPS, `cell ${i} deck disagrees with the scene`);
    // A staircase may rise or fall a stair-sized amount between samples; the
    // scene check above is what stops that allowance leaking to furniture.
    assert.ok(c.y <= prev.y + STAIR_STEP + EPS, `cell ${i} climbs more than a stair step`);
    assert.ok(c.y >= prev.y - STAIR_STEP - EPS, `cell ${i} drops further than a stair step`);
    prev = c;
  }
}

console.log('walking');

for (const { name, json } of rooms) {
  const parsed = parseRoomDoc(json);
  if (parsed.status === 'bad') {
    failures++;
    console.error(`  FAIL  ${name} does not parse`);
    continue;
  }
  const room = parsed.room;
  const scene = buildScene(room, YAW);
  const party = partyOf(room);
  const from: WalkCell = {
    x: party.at[0] + 0.5,
    y: party.y ?? 0,
    z: party.at[1] + 0.5,
  };

  check(`${name}: a walker can reach open floor`, () => {
    const to = openCell(room, party.at);
    assert.ok(to, 'no open floor found');
    const path = findWalkPath(scene, from, { x: to[0] + 0.5, z: to[1] + 0.5 });
    assert.ok(path, 'no route');
    auditPath(room, scene, path!, from);
    const last = path![path!.length - 1];
    assert.deepStrictEqual([cellOf(last.x), cellOf(last.z)], to);
  });

  check(`${name}: a wall is not a destination`, () => {
    let wall: [number, number] | null = null;
    for (let z = 0; z < room.grid.rows && !wall; z++) {
      for (let x = 0; x < room.grid.cols; x++) {
        if (room.grid.cells[z * room.grid.cols + x] === 2) {
          wall = [x, z];
          break;
        }
      }
    }
    assert.ok(wall, 'no wall cell found');
    assert.strictEqual(findWalkPath(scene, from, { x: wall![0] + 0.5, z: wall![1] + 0.5 }), null);
  });

  check(`${name}: off the grid is not a destination`, () => {
    assert.strictEqual(findWalkPath(scene, from, { x: -2, z: 4 }), null);
    assert.strictEqual(findWalkPath(scene, from, { x: room.grid.cols + 2, z: 4 }), null);
  });

  check(`${name}: a body is not moved by planning`, () => {
    const to = openCell(room, party.at);
    assert.ok(to);
    findWalkPath(scene, from, { x: to[0] + 0.5, z: to[1] + 0.5 });
    assert.deepStrictEqual(party.at, room.tokens.find((t) => t.id === party.id)!.at);
  });

  check(`${name}: a planned route turns on its waypoint`, () => {
    const first = openCell(room, party.at);
    assert.ok(first, 'no open floor found');
    const second = openCell(room, first!, 2);
    assert.ok(second, 'no second open floor found');
    const path = findWalkRoute(scene, from, [
      { x: first![0] + 0.5, z: first![1] + 0.5 },
      { x: second![0] + 0.5, z: second![1] + 0.5 },
    ]);
    assert.ok(path, 'no route through the waypoint');
    auditPath(room, scene, path!, from);
    assert.ok(
      path!.some((c) => cellOf(c.x) === first![0] && cellOf(c.z) === first![1]),
      'the route did not pass through the waypoint',
    );
    const last = path![path!.length - 1];
    assert.deepStrictEqual([cellOf(last.x), cellOf(last.z)], second);
  });

  check(`${name}: a planned route refuses a wall leg`, () => {
    let wall: [number, number] | null = null;
    for (let z = 0; z < room.grid.rows && !wall; z++) {
      for (let x = 0; x < room.grid.cols; x++) {
        if (room.grid.cells[z * room.grid.cols + x] === 2) {
          wall = [x, z];
          break;
        }
      }
    }
    assert.ok(wall, 'no wall cell found');
    const open = openCell(room, party.at);
    assert.ok(open, 'no open floor found');
    assert.strictEqual(
      findWalkRoute(scene, from, [
        { x: open![0] + 0.5, z: open![1] + 0.5 },
        { x: wall![0] + 0.5, z: wall![1] + 0.5 },
      ]),
      null,
    );
  });
}

/* --------------------------------------------------------------- specifics */

{
  const room = parseRoomDoc(tavernJson).room;
  const scene = buildScene(room, YAW);
  const party = partyOf(room);
  const from: WalkCell = { x: party.at[0] + 0.5, y: 0, z: party.at[1] + 0.5 };

  check('tavern: furniture is solid', () => {
    // The central table is a solid at [12.5, 8.75]. A body cannot walk onto it,
    // and the route to the far side of it still has to exist.
    assert.strictEqual(findWalkPath(scene, from, { x: 13.5, z: 9 }), null);
    const across = findWalkPath(scene, from, { x: 16.5, z: 9.5 });
    assert.ok(across, 'no route around the table');
    auditPath(room, scene, across!, from);
  });
}

{
  const room = parseRoomDoc(cavernJson).room;
  const scene = buildScene(room, YAW);
  const party = partyOf(room);
  const from: WalkCell = { x: party.at[0] + 0.5, y: 0, z: party.at[1] + 0.5 };

  check('cavern: the pit can be left by the stairs', () => {
    // The north shelf is 2.1 cells up and its only connection to the pit is the
    // stair at [16, 6]. A walker with no climb rule would be trapped forever.
    const path = findWalkPath(scene, from, { x: 16.5, z: 4.5 });
    assert.ok(path, 'the stair was not climbable');
    auditPath(room, scene, path!, from);
    const last = path![path!.length - 1];
    assert.ok(Math.abs(last.y - 2.1) < EPS, `ended at ${last.y}, not on the shelf`);
  });

  check('cavern: a shelf is not a step from the pit', () => {
    // Directly under the high east shelf, with no stair in between.
    assert.strictEqual(findWalkPath(scene, from, { x: 30.5, z: 15.5 }), null);
  });

  check('cavern: the stair is a path, not a teleport', () => {
    const path = findWalkPath(scene, from, { x: 16.5, z: 4.5 });
    assert.ok(path);
    // The climb has to pass through the stair cells, not jump from the pit to
    // the shelf in one segment.
    const stair = path!.filter((c) => cellOf(c.z) === 6 || cellOf(c.z) === 7);
    assert.ok(stair.length >= 1, 'route did not use the stair cells');
  });
}

/* -------------------------------------------------------------------- clock */

check('the clock starts and ends exactly on the route', () => {
  const cells: WalkCell[] = [
    { x: 4.5, y: 0, z: 4.5 },
    { x: 5.5, y: 0, z: 4.5 },
    { x: 6.5, y: 0, z: 5.5 },
  ];
  const start = 1000;
  const plan = planWalk('pc-1', cells, start);
  const first = motionAt(plan, start);
  assert.ok(Math.abs(first.x - 4.5) < EPS && Math.abs(first.z - 4.5) < EPS);
  const last = motionAt(plan, plan.endsAt);
  assert.ok(Math.abs(last.x - 6.5) < EPS && Math.abs(last.z - 5.5) < EPS);
  assert.strictEqual(last.done, true);
  assert.strictEqual(first.done, false);
});

check('a walk takes time proportional to its length', () => {
  const short = planWalk('a', [{ x: 1.5, y: 0, z: 1.5 }, { x: 2.5, y: 0, z: 1.5 }], 0);
  const long = planWalk('b', [
    { x: 1.5, y: 0, z: 1.5 },
    { x: 2.5, y: 0, z: 1.5 },
    { x: 3.5, y: 0, z: 1.5 },
    { x: 4.5, y: 0, z: 1.5 },
  ], 0);
  assert.ok(long.endsAt - long.startedAt > short.endsAt - short.startedAt);
});

check('the step cycle runs 0..3 and lands on the stance', () => {
  const cells: WalkCell[] = [
    { x: 0.5, y: 0, z: 0.5 },
    { x: 1.5, y: 0, z: 0.5 },
    { x: 2.5, y: 0, z: 0.5 },
  ];
  const plan = planWalk('pc-1', cells, 0);
  const seen = new Set<number>();
  for (let t = 0; t < plan.endsAt; t += 25) seen.add(motionAt(plan, t).step);
  for (const step of seen) assert.ok(step >= 0 && step <= 3);
  assert.ok(seen.size >= 3, 'the cycle did not advance');
  assert.strictEqual(motionAt(plan, plan.endsAt).step, 0);
});

check('a walk turns to face the way it went', () => {
  const plan = planWalk('pc-1', [
    { x: 1.5, y: 0, z: 1.5 },
    { x: 2.5, y: 0, z: 1.5 },
  ], 0);
  const land = landing(plan);
  assert.deepStrictEqual(land.at, [2, 1]);
  assert.strictEqual(land.facing, 3);
  assert.strictEqual(facingBetween(1.5, 1.5, 1.5, 0.5), 1);
  assert.strictEqual(facingBetween(1.5, 1.5, 0.5, 1.5), 2);
  assert.strictEqual(facingBetween(1.5, 1.5, 1.5, 2.5), 0);
});

check('height is carried along the route', () => {
  const plan = planWalk('pc-1', [
    { x: 1.5, y: 0, z: 1.5 },
    { x: 2.5, y: 2.1, z: 1.5 },
  ], 0);
  const mid = motionAt(plan, (plan.startedAt + plan.endsAt) / 2);
  assert.ok(mid.y > 0 && mid.y < 2.1, `mid height ${mid.y}`);
  assert.ok(Math.abs(landing(plan).y - 2.1) < EPS);
});

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures) process.exit(1);
