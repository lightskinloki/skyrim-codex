import type { PropRule } from './props';
import type { Facing, GroundKind, Room, RoomDoor, Tier, TokenPlacement } from './room';
import { CELL, type RoomGrid } from './paint';
import type { PointLight } from './light';
import { preset, type CharacterSpec } from '@/characters/spec';

/**
 * Korvanjund, as played in "Race for the Crown" (Frogs-5-skyrim, Toryggs legacy,
 * choice gate 1, module 7): the interior from the Main Causeway to the Throne
 * Room, eight rooms linked by doors in play order.
 *
 * No map of Korvanjund exists in either repo, so every layout here is derived
 * from the module's own terrain notes — the 10-ft ledge and 60-ft void of the
 * Silent Shaft, the 20-ft radius of the lift, the crypt's three levels 10 and 20
 * ft apart — at 5 ft to a cell and 5 ft to a cell of height. Where the module
 * names a thing (a pedestal, two chains, a drill on the vault relief, four
 * sarcophagi at the corners) it is placed; where it is silent, nothing is
 * invented beyond furniture.
 *
 * Tokens are placeholders. A monster is drawn from a character spec because the
 * board has no other kind of body yet; its `name` says what it stands in for.
 * The party is the one shared party token every room carries.
 *
 * Authoring source only: `rooms:export` writes the JSON the app loads.
 */

type Builder = {
  cols: number;
  rows: number;
  g: RoomGrid;
  props: PropRule[];
  doors: RoomDoor[];
  tokens: TokenPlacement[];
  tiers: Tier[];
  points: PointLight[];
};

const GROUND: GroundKind[] = ['stone', 'grass', 'dirt', 'water', 'wood'];

const makeBuilder = (cols: number, rows: number, seed: number): Builder => {
  const g: RoomGrid = { cols, rows, seed, cells: new Uint8Array(cols * rows) };
  g.cells.fill(2);
  g.ground = new Uint8Array(cols * rows);
  return { cols, rows, g, props: [], doors: [], tokens: [], tiers: [], points: [] };
};

const cell = (b: Builder, x: number, z: number, v: number) => {
  if (x < 0 || z < 0 || x >= b.cols || z >= b.rows) return;
  b.g.cells[z * b.cols + x] = v;
};

const rect = (b: Builder, x: number, z: number, w: number, h: number, v: number) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) cell(b, x + i, z + j, v);
};

const ground = (b: Builder, x: number, z: number, w: number, h: number, kind: GroundKind) => {
  const id = GROUND.indexOf(kind);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const cx = x + i;
      const cz = z + j;
      if (cx < 0 || cz < 0 || cx >= b.cols || cz >= b.rows) continue;
      if (b.g.cells[cz * b.cols + cx] !== 1) continue;
      b.g.ground![cz * b.cols + cx] = id;
    }
  }
};

const door = (b: Builder, id: string, x: number, z: number, to: { room: string; door: string }, label: string, state?: 'open' | 'closed') => {
  const d: RoomDoor = { id, at: [x, z], label, to };
  if (state) d.state = state;
  b.doors.push(d);
};

const lamp = (b: Builder, id: string, x: number, z: number, radius: number, intensity: number, flicker = 0) => {
  b.points.push({ id, x: x * CELL, y: z * CELL, radius: radius * CELL, intensity, flicker });
};

const finish = (b: Builder, rig: Room['rig'], wallHeight: number): Room => {
  const room: Room = { grid: b.g, props: b.props, tokens: b.tokens, doors: b.doors, path: [], rig };
  if (b.tiers.length) room.tiers = b.tiers;
  room.wallHeight = wallHeight;
  return room;
};

/* ------------------------------------------------------------------ bodies */
const body = (
  id: string,
  name: string,
  race: CharacterSpec['race'],
  build: CharacterSpec['build'],
  skinTone: CharacterSpec['skinTone'],
  hair: CharacterSpec['hair'],
  hairStyle: CharacterSpec['hairStyle'],
  beard: CharacterSpec['beard'],
  garment: CharacterSpec['garment'],
  weapon: CharacterSpec['weapon'],
): CharacterSpec => ({ id, name, race, build, skinTone, hair, hairStyle, beard, garment, weapon });

const THRALL = body('draugr-thrall', 'Draugr Thrall', 'nord', 'average', 'pale', 'grey', 'long', 'full',
  { torso: 'tunic', torsoCloth: 'grey', legs: 'trousers', legsCloth: 'grey' }, 'sword');
const SCOURGE = body('draugr-scourge', 'Draugr Scourge', 'nord', 'slim', 'pale', 'grey', 'long', 'long',
  { torso: 'vest', torsoCloth: 'leather', legs: 'trousers', legsCloth: 'grey' }, 'bow');
/** The lift's archers drop their bows for greatswords (Section 2 finale). */
const SCOURGE_BLADE = { ...SCOURGE, id: 'draugr-scourge-sword', weapon: 'sword' as const };
const WIGHT = body('draugr-wight', 'Draugr Wight', 'nord', 'burly', 'pale', 'grey', 'long', 'long',
  { torso: 'plate', torsoCloth: 'metal', legs: 'greaves', legsCloth: 'metal' }, 'hammer');
const DEATHLORD = body('draugr-deathlord', 'Draugr Deathlord', 'nord', 'burly', 'pale', 'grey', 'braid', 'long',
  { torso: 'plate', torsoCloth: 'metal', legs: 'greaves', legsCloth: 'metal' }, 'sword');
const BATTLEMAGE = body('cult-battlemage', 'Dragon Cult Battlemage', 'breton', 'slim', 'fair', 'black', 'short', 'none',
  { torso: 'tunic', torsoCloth: 'grey', legs: 'skirt', legsCloth: 'grey' }, 'none');
const GALMAR = body('galmar', 'Galmar Stone-Fist', 'nord', 'burly', 'fair', 'brown', 'long', 'full',
  { torso: 'vest', torsoCloth: 'skin', legs: 'trousers', legsCloth: 'leather' }, 'hammer');
const HROKI = body('hroki', 'Hroki', 'nord', 'average', 'fair', 'brown', 'short', 'stubble',
  { torso: 'tunic', torsoCloth: 'navy', legs: 'trousers', legsCloth: 'leather' }, 'sword');
const STORMCLOAK = body('stormcloak', 'Stormcloak Veteran', 'nord', 'average', 'fair', 'brown', 'short', 'full',
  { torso: 'tunic', torsoCloth: 'navy', legs: 'trousers', legsCloth: 'leather' }, 'sword');
const ULAG = body('ulag', 'Ulag the Breaker', 'orc', 'burly', 'tan', 'black', 'bald', 'none',
  { torso: 'plate', torsoCloth: 'metal', legs: 'greaves', legsCloth: 'metal' }, 'hammer');

const party = (b: Builder, x: number, z: number, facing: Facing) =>
  b.tokens.push({ id: 'pc-1', spec: preset('knight'), at: [x, z], facing, party: true });

const npc = (b: Builder, id: string, spec: CharacterSpec, x: number, z: number, facing: Facing, y?: number) => {
  const t: TokenPlacement = { id, spec, at: [x, z], facing };
  if (y !== undefined) t.y = y;
  b.tokens.push(t);
};

const DUSK_RIG = (ambient: number, intensity: number, points: PointLight[]): Room['rig'] => ({
  ambient,
  sun: { azimuth: 210, elevation: 50, intensity },
  points,
});

/* --------------------------------------------------- 1. the main causeway */
/**
 * Section 1, Beat 2 (Alt): "A massive stone staircase rising to the temple
 * doors." The stair climbs 12 ft from the siege mud to a landing; two
 * Deathlords hold the iron doors; the battlemages fire from the balconies over
 * them.
 */
export function makeCauseway(): Room {
  const b = makeBuilder(20, 26, 0x6c0a_5e01);
  rect(b, 3, 1, 14, 24, 1);
  rect(b, 2, 15, 16, 10, 1);
  cell(b, 9, 0, 1);
  ground(b, 2, 14, 16, 11, 'dirt');

  // The landing and the doorway on it, then the balconies over both flanks.
  b.tiers.push({ y: 2.4, deck: 'stone', rects: [[3, 1, 14, 8], [9, 0, 1, 1]] });
  b.tiers.push({ y: 5.6, deck: 'stone', rects: [[3, 1, 3, 3], [14, 1, 3, 3]] });
  b.props.push({ rule: 'stairs', at: [6, 9], w: 8, rise: 2.4, run: 5, dir: -1 });

  door(b, 'gate', 9, 0, { room: 'korvanjund-shaft', door: 'entrance' }, 'Korvanjund — the iron doors', 'closed');

  // The Stormcloak line at the foot of the stair: a fallen slab, logs and crates.
  b.props.push({ rule: 'sprite', sprite: 'log', at: [5, 17], rot: 0 });
  b.props.push({ rule: 'sprite', sprite: 'log', at: [12, 17.2], rot: 10 });
  b.props.push({ rule: 'crate', at: [8, 18] });
  b.props.push({ rule: 'crate', at: [8.75, 18.25] });
  b.props.push({ rule: 'rubble', at: [3, 21], size: 3 });
  b.props.push({ rule: 'rubble', at: [15, 22], size: 2 });
  b.props.push({ rule: 'sprite', sprite: 'boulder', at: [14.5, 15.5] });
  b.props.push({ rule: 'sprite', sprite: 'rocks', at: [3.5, 16] });
  b.props.push({ rule: 'column', at: [3, 4], h: 2.2 });
  b.props.push({ rule: 'column', at: [16, 4], h: 2.2 });
  b.props.push({ rule: 'brazier', at: [4.2, 7], lit: true });
  b.props.push({ rule: 'brazier', at: [15.2, 7], lit: true });

  npc(b, 'deathlord-1', DEATHLORD, 8.5, 1.4, 0);
  npc(b, 'deathlord-2', DEATHLORD, 10.5, 1.4, 0);
  npc(b, 'battlemage-1', BATTLEMAGE, 4, 2, 0);
  npc(b, 'battlemage-2', BATTLEMAGE, 14.5, 1.6, 0);
  npc(b, 'battlemage-3', BATTLEMAGE, 15.5, 2.6, 0);
  npc(b, 'galmar', GALMAR, 9.4, 15.6, 1);
  npc(b, 'stormcloak-1', STORMCLOAK, 7.6, 16.2, 1);
  npc(b, 'stormcloak-2', STORMCLOAK, 11.2, 16.2, 1);
  npc(b, 'stormcloak-3', STORMCLOAK, 6.4, 19.4, 1);
  npc(b, 'stormcloak-4', STORMCLOAK, 12.6, 19.6, 1);
  party(b, 9.4, 21.4, 1);

  return finish(b, { ambient: 0.32, sun: { azimuth: 200, elevation: 34, intensity: 0.82 }, points: b.points }, 7);
}

/* ------------------------------------------------------ 2. the silent shaft */
/**
 * Section 2, Beat 1: a 10-ft ledge along the near wall, a cylindrical void
 * where the floor should be, and a far ledge 60 ft across where four Scourge
 * archers stand among pillars. The pedestal is at the centre of the near
 * ledge; its two tension chains run into the walls, left to the Armory, right
 * to the Embalming Hall.
 */
export function makeShaft(): Room {
  const b = makeBuilder(24, 21, 0x5aa_f701);
  const cx = 12;
  const cz = 9.5;
  for (let z = 1; z < 18; z++) {
    for (let x = 1; x < 23; x++) {
      const d = Math.hypot(x + 0.5 - cx, z + 0.5 - cz);
      if (z <= 3 && x >= 4 && x <= 19) cell(b, x, z, 1);
      else if (z >= 16 && x >= 3 && x <= 20) cell(b, x, z, 1);
      // The void: 60 ft across, wall to wall, so no ledge runs round the sides.
      else if (d < 6.6) cell(b, x, z, 0);
      // The ledges curve with the shaft as they meet it.
      else if (d < 8.4 && (z >= 13 || z <= 5) && x >= 3 && x <= 20) cell(b, x, z, 1);
    }
  }

  cell(b, 8, 18, 1);
  door(b, 'entrance', 8, 18, { room: 'korvanjund-causeway', door: 'gate' }, 'The Main Causeway');
  cell(b, 2, 16, 1);
  door(b, 'armory-door', 2, 16, { room: 'korvanjund-armory', door: 'hub-door' }, 'The Armory (left chain)');
  cell(b, 21, 16, 1);
  door(b, 'embalming-door', 21, 16, { room: 'korvanjund-embalming', door: 'hub-door' }, 'The Embalming Hall (right chain)');
  // The lift is out of reach at the bottom of the shaft until both chains are
  // fixed; the lip of the ledge is where the table steps onto it.
  door(b, 'lift', 12, 16, { room: 'korvanjund-descent', door: 'from-shaft' }, 'The lift — down the shaft', 'open');

  b.props.push({ rule: 'lever', at: [11.1, 17.1] });
  b.props.push({ rule: 'chain', at: [3, 17], w: 8, along: 'x', h: 0.85 });
  b.props.push({ rule: 'chain', at: [11.9, 17], w: 8, along: 'x', h: 0.85 });
  b.props.push({ rule: 'chain', at: [19.9, 17], w: 1.1, along: 'x', h: 0.85 });

  for (const x of [5, 9, 14, 18]) b.props.push({ rule: 'column', at: [x, 1], h: 3 });
  b.props.push({ rule: 'brazier', at: [7, 2.2], lit: true });
  b.props.push({ rule: 'brazier', at: [16.4, 2.2], lit: true });
  b.props.push({ rule: 'rubble', at: [4.2, 17], size: 1 });

  npc(b, 'scourge-1', SCOURGE, 6, 2.4, 0);
  npc(b, 'scourge-2', SCOURGE, 10, 2.4, 0);
  npc(b, 'scourge-3', SCOURGE, 13, 2.4, 0);
  npc(b, 'scourge-4', SCOURGE, 17, 2.4, 0);
  npc(b, 'galmar', GALMAR, 13.4, 16.2, 1);
  party(b, 8.4, 17.2, 1);

  lamp(b, 'far-ledge', 11.5, 2, 9, 0.6);
  return finish(b, DUSK_RIG(0.16, 0.28, b.points), 3.4);
}

/* --------------------------------------------------------- 3. the armory */
/**
 * Path A: a long hall of weapon racks. The left chain runs into a wall of
 * bronze gears at the back; an Ebony greatsword is driven between the teeth of
 * the main drive cog, a rack of oil pots hangs above it, and a boots-shelf sits
 * high behind the mechanism. Three Wights guard it.
 *
 * The gears are authored jammed (`speed: 0`): the module has them murdered,
 * not turning, until the blade is pulled. Clear the speeds to set them going.
 */
export function makeArmory(): Room {
  const b = makeBuilder(21, 11, 0xa2_0e17);
  rect(b, 1, 1, 19, 9, 1);
  cell(b, 20, 5, 1);
  door(b, 'hub-door', 20, 5, { room: 'korvanjund-shaft', door: 'armory-door' }, 'The Silent Shaft');

  // The drive train on the west wall, and the chain that feeds it.
  b.props.push({ rule: 'gear', at: [1, 2], r: 1.8, along: 'x', speed: 0 });
  b.props.push({ rule: 'gear', at: [1, 5.7], r: 1, along: 'x', h: 2.6, speed: 0 });
  b.props.push({ rule: 'gear', at: [1.35, 0.6], r: 0.7, along: 'x', h: 3.1, speed: 0 });
  b.props.push({ rule: 'gear', at: [1, 7.3], r: 0.75, along: 'x', speed: 0 });
  b.props.push({ rule: 'blade', at: [2, 2.6], along: 'x', dir: -1, h: 3.05 });
  b.props.push({ rule: 'chain', at: [2.4, 3.3], w: 8, along: 'x', h: 1.84 });
  b.props.push({ rule: 'chain', at: [10.4, 3.3], w: 8, along: 'x', h: 1.84 });
  b.props.push({ rule: 'chain', at: [18.4, 3.3], w: 1.6, along: 'x', h: 1.84 });

  // The oil pots over the gears, and the high shelf behind them.
  b.props.push({ rule: 'shelf', at: [1.05, 0.5], w: 1.1, y: 3.7 });
  b.props.push({ rule: 'sprite', sprite: 'urn', at: [1.1, 0.55], y: 3.72, scale: 0.55 });
  b.props.push({ rule: 'sprite', sprite: 'urn', at: [1.6, 0.6], y: 3.72, scale: 0.5 });
  b.props.push({ rule: 'shelf', at: [1.05, 9.2], w: 1.2, y: 2.4 });

  // Weapon racks down both long walls.
  for (const x of [5, 8.5, 12, 15.5]) {
    b.props.push({ rule: 'shelf', at: [x, 1.05], w: 2 });
    b.props.push({ rule: 'shelf', at: [x, 9.45], w: 2 });
  }
  b.props.push({ rule: 'sprite', sprite: 'anvil', at: [13.5, 6.2] });
  b.props.push({ rule: 'crate', at: [18.6, 1.2] });
  b.props.push({ rule: 'barrel', at: [18.7, 8.6] });
  b.props.push({ rule: 'brazier', at: [7, 7.6], lit: true });
  b.props.push({ rule: 'brazier', at: [16, 2.2], lit: true });

  npc(b, 'wight-1', WIGHT, 4.4, 4.4, 3);
  npc(b, 'wight-2', WIGHT, 5.4, 7, 3);
  npc(b, 'wight-3', WIGHT, 6, 2.4, 3);
  party(b, 18.6, 5, 2);

  return finish(b, DUSK_RIG(0.2, 0.3, b.points), 4.2);
}

/* ------------------------------------------------- 4. the embalming hall */
/**
 * Path B: a wide, low chamber of stone slab tables, linen and canopic jars. The
 * right chain lies in a heap, unhooked from the wall-mounted tension spool, and
 * the floor around it is greased with embalming oil. Two Scourges wait among
 * the tables.
 *
 * The ground layer has no oil, so the greased strip is drawn as dirt: it marks
 * the cells, it is not a claim about what the floor is.
 */
export function makeEmbalming(): Room {
  const b = makeBuilder(18, 12, 0xe3b_a1d);
  rect(b, 1, 1, 16, 10, 1);
  cell(b, 0, 6, 1);
  door(b, 'hub-door', 0, 6, { room: 'korvanjund-shaft', door: 'embalming-door' }, 'The Silent Shaft');
  ground(b, 9, 4, 7, 5, 'dirt');

  // The spool on the east wall, jammed with nothing on it, and the chain heap.
  b.props.push({ rule: 'gear', at: [16.55, 4.6], r: 0.9, along: 'x', h: 1.2, speed: 0 });
  b.props.push({ rule: 'chain', at: [10, 5], w: 5.5, along: 'x', h: 0.07 });
  b.props.push({ rule: 'chain', at: [11, 4.4], w: 2.6, along: 'z', h: 0.07 });
  b.props.push({ rule: 'chain', at: [9.6, 6.2], w: 4, along: 'x', h: 0.07 });
  b.props.push({ rule: 'chain', at: [13.2, 5.6], w: 2.2, along: 'z', h: 0.07 });

  // Slab tables in two rows, with jars on them.
  for (const [x, z] of [[2.5, 2], [6, 2], [2.5, 8.6], [6, 8.6], [2.5, 5.3]] as [number, number][]) {
    b.props.push({ rule: 'table', at: [x, z], w: 2.2, stone: true });
  }
  b.props.push({ rule: 'sprite', sprite: 'urn', at: [3, 2], y: 0.5, scale: 0.45 });
  b.props.push({ rule: 'sprite', sprite: 'urn', at: [6.9, 2.05], y: 0.5, scale: 0.4 });
  b.props.push({ rule: 'sprite', sprite: 'urn', at: [3.4, 8.65], y: 0.5, scale: 0.45 });
  b.props.push({ rule: 'sprite', sprite: 'urn', at: [7.3, 8.6], y: 0.5, scale: 0.42 });
  b.props.push({ rule: 'shelf', at: [10, 1.05], w: 3 });
  b.props.push({ rule: 'shelf', at: [10, 10.45], w: 3 });
  b.props.push({ rule: 'brazier', at: [8.6, 1.2], lit: true });
  b.props.push({ rule: 'brazier', at: [14.6, 9.8], lit: true });

  npc(b, 'scourge-1', SCOURGE, 5.2, 4.2, 2);
  npc(b, 'scourge-2', SCOURGE, 12, 9, 2);
  party(b, 1.4, 6, 3);

  return finish(b, DUSK_RIG(0.2, 0.25, b.points), 1.7);
}

/* ------------------------------------------------------------ 5. the lift */
/**
 * Section 2 finale: a 20-ft radius platform falling through the shaft with the
 * four archers on it, past rows of burial alcoves from which four more
 * Scourges leap. The gap between the platform and the shaft wall is the
 * grinding edge.
 */
export function makeDescent(): Room {
  const b = makeBuilder(18, 18, 0x1f7_d0e5);
  const cx = 9;
  const cz = 9;
  for (let z = 0; z < 18; z++) {
    for (let x = 0; x < 18; x++) {
      const d = Math.hypot(x + 0.5 - cx, z + 0.5 - cz);
      if (d < 4.1) cell(b, x, z, 1);
      else if (d < 5.4) cell(b, x, z, 0);
    }
  }
  // Four alcoves cut into the shaft wall, across the gap.
  const alcoves: [number, number][] = [[3, 3], [14, 3], [3, 14], [14, 14]];
  for (const [x, z] of alcoves) cell(b, x, z, 1);

  door(b, 'from-shaft', 9, 5, { room: 'korvanjund-shaft', door: 'lift' }, 'Up the shaft', 'open');
  door(b, 'to-landing', 9, 12, { room: 'korvanjund-landing', door: 'lift' }, 'The landing, four hundred feet down', 'open');

  b.props.push({ rule: 'rubble', at: [6.5, 7.5], size: 1 });
  b.props.push({ rule: 'rubble', at: [10.6, 10.4], size: 1 });

  npc(b, 'scourge-1', SCOURGE_BLADE, 7, 7, 0);
  npc(b, 'scourge-2', SCOURGE_BLADE, 10.6, 7.2, 2);
  npc(b, 'scourge-3', SCOURGE_BLADE, 6.6, 10.4, 3);
  npc(b, 'scourge-4', SCOURGE_BLADE, 11, 10.6, 1);
  alcoves.forEach(([x, z], i) => npc(b, `alcove-${i + 1}`, SCOURGE_BLADE, x, z, (x < 9 ? 3 : 2) as Facing));
  npc(b, 'galmar', GALMAR, 8.6, 8.8, 1);
  npc(b, 'hroki', HROKI, 9.6, 9.6, 1);
  party(b, 8.4, 10, 1);

  lamp(b, 'shaft-light', 9, 9, 5, 0.7);
  return finish(b, DUSK_RIG(0.14, 0.2, b.points), 4.6);
}

/* --------------------------------------------------------- 6. the landing */
/**
 * Section 3, Beat 1: a small enclosed antechamber at the bottom of the shaft,
 * thick with the dust of the impact. The lift lies where it slammed down;
 * heavy double doors lead on, unlocked. The rally point: wait for the First
 * Cohort or press on.
 */
export function makeLanding(): Room {
  const b = makeBuilder(13, 12, 0x1a4d_0001);
  rect(b, 1, 1, 11, 10, 1);
  cell(b, 6, 0, 1);
  door(b, 'crypt-doors', 6, 0, { room: 'korvanjund-crypt', door: 'entrance' }, 'The Great Crypt');
  cell(b, 6, 11, 1);
  door(b, 'lift', 6, 11, { room: 'korvanjund-descent', door: 'to-landing' }, 'The lift', 'open');

  // The platform, sunk a hand's breadth proud of the foundation it hit.
  b.tiers.push({ y: 0.15, deck: 'stone', rects: [[3, 5, 7, 5], [4, 4, 5, 1], [4, 10, 5, 1]] });
  b.props.push({ rule: 'rubble', at: [2, 2], size: 3 });
  b.props.push({ rule: 'rubble', at: [9.5, 3], size: 2 });
  b.props.push({ rule: 'rubble', at: [1.4, 8], size: 2 });
  b.props.push({ rule: 'rubble', at: [10.2, 9.2], size: 1 });
  b.props.push({ rule: 'sprite', sprite: 'rocks', at: [8.5, 1.4] });
  b.props.push({ rule: 'brazier', at: [1.4, 1.3], lit: true });

  npc(b, 'galmar', GALMAR, 1.5, 5, 3);
  npc(b, 'hroki', HROKI, 7, 9, 2);
  party(b, 5.5, 6.5, 1);

  return finish(b, DUSK_RIG(0.18, 0.2, b.points), 3);
}

/* ------------------------------------------------------ 7. the great crypt */
/**
 * Section 3, Beat 2: a cavernous rectangular hall on three levels. The Bone
 * Pits (waist-deep water, bones) are the floor; the Causeway is a wide stone
 * bridge 10 ft above them running to the Throne Room door; the Catwalks are
 * narrow walkways 20 ft above the bridge along both walls. Four sarcophagi
 * pulse at the corners, two in the pits and two on the catwalks. Two
 * Deathlords hold the far door.
 */
export function makeCrypt(): Room {
  const b = makeBuilder(22, 34, 0xc2_7b70);
  rect(b, 1, 1, 20, 32, 1);
  cell(b, 10, 0, 1);
  cell(b, 10, 33, 1);
  ground(b, 1, 1, 20, 32, 'water');

  b.tiers.push({ y: 2, deck: 'stone', rects: [[8, 1, 6, 32], [10, 0, 1, 1], [10, 33, 1, 1]] });
  b.tiers.push({ y: 6, deck: 'stone', rects: [[1, 1, 2, 32], [19, 1, 2, 32]] });

  door(b, 'entrance', 10, 33, { room: 'korvanjund-landing', door: 'crypt-doors' }, 'The landing');
  door(b, 'throne-door', 10, 0, { room: 'korvanjund-throne', door: 'entrance' }, 'The Throne Room', 'closed');

  // The stairs down into the pits, one each side.
  b.props.push({ rule: 'stairs', at: [6, 14], w: 1.6, rise: 2, run: 2, along: 'x', dir: 1 });
  b.props.push({ rule: 'stairs', at: [14, 20], w: 1.6, rise: 2, run: 2, along: 'x', dir: -1 });

  // Sarcophagi at the corners: pits north-west and south-east, catwalks
  // north-west and south-east above them.
  b.props.push({ rule: 'sarcophagus', at: [4, 1], face: 's' });
  b.props.push({ rule: 'sarcophagus', at: [16, 32.35], face: 'n' });
  b.props.push({ rule: 'sarcophagus', at: [1.5, 1], face: 's' });
  b.props.push({ rule: 'sarcophagus', at: [19.5, 32.35], face: 'n' });

  // The roof is held up from the pits.
  for (const z of [6, 13, 20, 27]) {
    b.props.push({ rule: 'column', at: [5, z], h: 8 });
    b.props.push({ rule: 'column', at: [16, z], h: 8 });
  }
  // Bones in the water.
  for (const [x, z, s] of [[4, 9, 3], [6.5, 23, 2], [15, 10.5, 3], [17, 17, 2], [4, 29, 2], [14.5, 30, 1], [6, 4, 1]] as [number, number, number][]) {
    b.props.push({ rule: 'rubble', at: [x, z], size: s });
  }
  b.props.push({ rule: 'sprite', sprite: 'rocks', at: [3.5, 18] });
  b.props.push({ rule: 'sprite', sprite: 'rocks', at: [16.5, 24] });
  b.props.push({ rule: 'brazier', at: [8.2, 8], lit: true });
  b.props.push({ rule: 'brazier', at: [13.2, 8], lit: true });
  b.props.push({ rule: 'brazier', at: [8.2, 24], lit: true });
  b.props.push({ rule: 'brazier', at: [13.2, 24], lit: true });

  npc(b, 'deathlord-1', DEATHLORD, 9.2, 1.4, 0);
  npc(b, 'deathlord-2', DEATHLORD, 11.2, 1.4, 0);
  // The horde on the bridge, and more climbing out of the pits.
  const bridgeThralls: [number, number][] = [[9, 14], [11, 14.4], [12.4, 15.6], [8.6, 16.8], [10.4, 17.4], [12, 18.6]];
  bridgeThralls.forEach(([x, z], i) => npc(b, `thrall-${i + 1}`, THRALL, x, z, 0));
  const pitThralls: [number, number][] = [[6.4, 18.6], [14.6, 16], [4, 25], [16.4, 22]];
  pitThralls.forEach(([x, z], i) => npc(b, `pit-thrall-${i + 1}`, THRALL, x, z, (x < 10 ? 3 : 2) as Facing));
  npc(b, 'wight-1', WIGHT, 4.4, 3, 0);
  npc(b, 'wight-2', WIGHT, 16.4, 30.6, 1);
  const archers: [number, number][] = [[1.2, 9], [1.2, 20], [19.4, 12], [19.4, 25]];
  archers.forEach(([x, z], i) => npc(b, `scourge-${i + 1}`, SCOURGE, x, z, (x < 10 ? 3 : 2) as Facing));
  // Galmar's tortoise at the near end of the bridge.
  npc(b, 'galmar', GALMAR, 10.2, 27.6, 1);
  const shields: [number, number][] = [[8.6, 27.8], [11.8, 27.8], [8.6, 29.2], [11.8, 29.2], [9.4, 30.4], [11, 30.4]];
  shields.forEach(([x, z], i) => npc(b, `stormcloak-${i + 1}`, STORMCLOAK, x, z, 1));
  npc(b, 'hroki', HROKI, 10.2, 29.4, 1);
  party(b, 10.2, 31.6, 1);

  return finish(b, DUSK_RIG(0.16, 0.22, b.points), 8);
}

/* ------------------------------------------------------ 8. the throne room */
/**
 * Section 4, Beat 1: the Inner Sanctum. A boring machine is clamped onto the
 * relief of the High King's Vault on the far wall, its bit turning, its piston
 * hammering, its soul gems throbbing green. Ulag stands at the controls with
 * his two Deathlords; the central load-bearing pillar is the one he will bring
 * down.
 */
export function makeThrone(): Room {
  const b = makeBuilder(20, 17, 0x7b0_e5c0);
  rect(b, 1, 1, 18, 15, 1);
  cell(b, 10, 16, 1);
  door(b, 'entrance', 10, 16, { room: 'korvanjund-crypt', door: 'throne-door' }, 'The Great Crypt');

  b.props.push({ rule: 'drill', at: [9, 1], along: 'z', dir: -1 });
  // The vault relief either side of the bit.
  b.props.push({ rule: 'sprite', sprite: 'obelisk', at: [6.6, 1.1] });
  b.props.push({ rule: 'sprite', sprite: 'obelisk', at: [12.4, 1.1] });
  b.props.push({ rule: 'sprite', sprite: 'runestone', at: [5, 1.3] });
  b.props.push({ rule: 'sprite', sprite: 'runestone', at: [14.3, 1.3] });

  b.props.push({ rule: 'column', at: [9.5, 8.5], h: 4.5 });
  for (const [x, z] of [[4, 4], [15, 4], [4, 12], [15, 12]] as [number, number][]) {
    b.props.push({ rule: 'column', at: [x, z], h: 4.5 });
  }
  b.props.push({ rule: 'brazier', at: [2.2, 2], lit: true });
  b.props.push({ rule: 'brazier', at: [17.2, 2], lit: true });
  b.props.push({ rule: 'brazier', at: [2.2, 14.4], lit: true });
  b.props.push({ rule: 'brazier', at: [17.2, 14.4], lit: true });
  b.props.push({ rule: 'rubble', at: [8, 4.6], size: 2 });
  b.props.push({ rule: 'rubble', at: [11.4, 4.4], size: 1 });

  npc(b, 'ulag', ULAG, 11.6, 3, 2);
  npc(b, 'deathlord-1', DEATHLORD, 7.6, 6.4, 0);
  npc(b, 'deathlord-2', DEATHLORD, 12.4, 6.4, 0);
  npc(b, 'galmar', GALMAR, 9.4, 13.6, 1);
  npc(b, 'hroki', HROKI, 11.4, 14.2, 1);
  party(b, 10.2, 14.8, 1);

  return finish(b, DUSK_RIG(0.2, 0.25, b.points), 4.6);
}

/** Every room, in play order, with the id and name its document ships under. */
export const KORVANJUND: { id: string; name: string; file: string; build: () => Room }[] = [
  { id: 'korvanjund-causeway', name: 'Korvanjund: The Main Causeway', file: 'korvanjund-causeway.json', build: makeCauseway },
  { id: 'korvanjund-shaft', name: 'Korvanjund: The Silent Shaft', file: 'korvanjund-shaft.json', build: makeShaft },
  { id: 'korvanjund-armory', name: 'Korvanjund: The Armory', file: 'korvanjund-armory.json', build: makeArmory },
  { id: 'korvanjund-embalming', name: 'Korvanjund: The Embalming Hall', file: 'korvanjund-embalming.json', build: makeEmbalming },
  { id: 'korvanjund-descent', name: 'Korvanjund: The Lift', file: 'korvanjund-descent.json', build: makeDescent },
  { id: 'korvanjund-landing', name: 'Korvanjund: The Landing', file: 'korvanjund-landing.json', build: makeLanding },
  { id: 'korvanjund-crypt', name: 'Korvanjund: The Great Crypt', file: 'korvanjund-crypt.json', build: makeCrypt },
  { id: 'korvanjund-throne', name: 'Korvanjund: The Throne Room', file: 'korvanjund-throne.json', build: makeThrone },
];
