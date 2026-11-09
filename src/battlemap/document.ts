import type { RoomGrid } from './paint';
import type { PropRule } from './props';
import type { LightRig, PointLight } from './light';
import type { DoorState, Facing, GroundKind, Room, RoomDoor, Tier, TokenPlacement } from './room';
import { GROUND_KINDS } from './room';
import { CELL } from './paint';
import {
  BEARDS,
  BUILDS,
  CLOTHS,
  HAIR_COLOURS,
  HAIR_STYLES,
  LEGS,
  PRESETS,
  RACES,
  SKIN_TONES,
  TORSOS,
  WEAPONS,
  type CharacterSpec,
} from '@/characters/spec';

/**
 * A room as a **document** rather than a function. See BATTLEMAP-SPEC §18.
 *
 * `makeDemoRoom()` is a recipe: it runs `rect()` calls and array literals and
 * the room exists only for as long as that function's result is in memory.
 * Nothing can be saved, opened, sent to a player, diffed, or produced by an
 * importer, because there is no file.
 *
 * This module is that file. Anything `Board3D` can draw is expressible here and
 * nothing else is: terrain, props, tokens, the move path, the light rig, upper
 * storeys. `parseRoomDoc` is the only way in, so every room — shipped, saved,
 * imported, or eventually cut from an SVC — crosses the same trust boundary and
 * comes out clamped, de-duplicated and renderable.
 */

export const ROOM_FORMAT = 'skyrim-codex.room';
export const ROOM_VERSION = 1;

/** A guard rail, not a design target. Past this the renderer stops being a map. */
const MAX_SIDE = 160;
const MAX_CELLS = 160 * 160;

export type DocView = { yaw: number; pitch: number; zoom: number };

export type PropDoc = PropRule & { id: string };

export type RoomDoc = {
  format: typeof ROOM_FORMAT;
  version: number;
  id: string;
  name: string;
  /**
   * One string per row, north to south, west to east: `"2*4,1*20,2*4"`.
   * A run is `value`, or `value*count`. The width is implied by row 0, so a
   * document cannot disagree with itself about how wide the room is.
   */
  terrain: string[];
  /** One run-length row per grid row, values index `GROUND_KINDS`. Omit for
   *  all-stone, which is every room built before the village existed. */
  ground?: string[];
  seed: number;
  props: PropDoc[];
  tokens: TokenPlacement[];
  doors?: RoomDoor[];
  path: [number, number][];
  rig: LightRig;
  tiers?: Tier[];
  wallHeight?: number;
  /** An optional opening camera. Not part of the room; a hint for the table. */
  view?: DocView;
};

export type RoomProblem = { path: string; message: string };

// A string discriminant, not a boolean: this project compiles with
// `strictNullChecks: false`, where `if (!r.ok)` does not narrow a union.
export type ParseResult =
  | { status: 'ok'; doc: RoomDoc; room: Room; warnings: RoomProblem[] }
  | { status: 'bad'; errors: RoomProblem[] };

export type RoomMeta = { id: string; name: string };

/* ------------------------------------------------------------------ scalar */
const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Canonical number: three decimals is 1/32 of a pixel, and it keeps -0 out. */
export const q = (n: number): number => {
  const v = Math.round(n * 1000) / 1000;
  return v === 0 ? 0 : v;
};

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

const oneOf = <T extends string>(v: unknown, list: readonly T[]): T | null =>
  typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : null;

const slug = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 44) || 'room';

/* ----------------------------------------------------------------- terrain */
const encodeRow = (cells: Uint8Array, offset: number, cols: number): string => {
  const parts: string[] = [];
  let start = 0;
  for (let x = 1; x <= cols; x++) {
    if (x === cols || cells[offset + x] !== cells[offset + start]) {
      const n = x - start;
      const v = cells[offset + start];
      parts.push(n === 1 ? `${v}` : `${v}*${n}`);
      start = x;
    }
  }
  return parts.join(',');
};

/**
 * Decode `"2*4,1*20"` into one row. Returns null on anything it cannot read:
 * a typo in terrain is a broken room, not something to guess at.
 */
const decodeRow = (row: string, maxValue = 2): number[] | null => {
  const out: number[] = [];
  for (const run of row.split(',')) {
    const m = /^\s*(\d+)(?:\s*\*\s*(\d+))?\s*$/.exec(run);
    if (!m) return null;
    const v = Number(m[1]);
    const n = m[2] === undefined ? 1 : Number(m[2]);
    if (v > maxValue || n < 1 || n > MAX_CELLS) return null;
    for (let i = 0; i < n; i++) out.push(v);
  }
  return out.length ? out : null;
};

const encodeTerrain = (g: RoomGrid): string[] => {
  const rows: string[] = [];
  for (let z = 0; z < g.rows; z++) rows.push(encodeRow(g.cells, z * g.cols, g.cols));
  return rows;
};

/** The same run-length form for the ground layer, which has more values. */
const encodeGround = (g: Uint8Array, cols: number, rows: number): string[] => {
  const out: string[] = [];
  for (let z = 0; z < rows; z++) out.push(encodeRow(g, z * cols, cols));
  return out;
};

/* -------------------------------------------------------------------- props */
/**
 * The fields each rule actually reads. Anything else is dropped, which is what
 * makes the output canonical: two saves of the same room are the same bytes,
 * so a diff means someone changed the room.
 */
const PROP_FIELDS: Record<PropRule['rule'], readonly string[]> = {
  table: ['w'],
  bench: ['w'],
  chest: ['w', 'bands'],
  crate: [],
  barrel: [],
  shelf: ['w'],
  rubble: ['size'],
  brazier: ['lit'],
  rug: ['w', 'h', 'navy'],
  column: ['h'],
  stairs: ['w', 'rise', 'run', 'along', 'dir'],
  house: ['w', 'h', 'roof', 'door'],
  tree: ['size', 'autumn'],
};

const isRule = (v: unknown): v is PropRule['rule'] =>
  typeof v === 'string' && Object.prototype.hasOwnProperty.call(PROP_FIELDS, v);

const LIMITS: Record<string, [number, number]> = {
  w: [0.25, 8],
  h: [0.25, 8],
  size: [1, 5],
  bands: [1, 3],
  rise: [0.2, 8],
  run: [1, 12],
};

type AnyProp = Record<string, unknown>;

/** Copy only the fields this rule owns, in a fixed order. */
const canonicalProp = (p: PropRule & { id?: string }, id: string): PropDoc => {
  const out: AnyProp = { id, rule: p.rule, at: [q(p.at[0]), q(p.at[1])] };
  if (p.y !== undefined) out.y = q(p.y);
  for (const key of PROP_FIELDS[p.rule]) {
    const v = (p as unknown as AnyProp)[key];
    if (v === undefined) continue;
    out[key] = typeof v === 'number' ? q(v) : v;
  }
  return out as PropDoc;
};

const parseProp = (raw: unknown, index: number, problems: RoomProblem[]): PropDoc | null => {
  const where = `props[${index}]`;
  if (!isObj(raw)) {
    problems.push({ path: where, message: 'is not an object' });
    return null;
  }
  if (!isRule(raw.rule)) {
    problems.push({ path: where, message: `unknown rule "${String(raw.rule)}"; dropped` });
    return null;
  }
  const at = raw.at;
  if (!Array.isArray(at) || at.length < 2 || !finite(at[0]) || !finite(at[1])) {
    problems.push({ path: where, message: 'has no usable `at` cell position; dropped' });
    return null;
  }

  const prop: AnyProp = { rule: raw.rule, at: [clamp(at[0], -4, MAX_SIDE + 4), clamp(at[1], -4, MAX_SIDE + 4)] };
  if (finite(raw.y)) prop.y = clamp(raw.y, 0, 64);

  for (const key of PROP_FIELDS[raw.rule]) {
    const v = raw[key];
    if (v === undefined) continue;
    if (key === 'lit' || key === 'navy' || key === 'autumn') {
      if (typeof v === 'boolean') prop[key] = v;
      continue;
    }
    if (key === 'along') {
      if (v === 'x' || v === 'z') prop[key] = v;
      continue;
    }
    if (key === 'dir') {
      if (v === -1 || v === 1) prop[key] = v;
      continue;
    }
    if (key === 'roof') {
      if (v === 'thatch' || v === 'wood') prop[key] = v;
      continue;
    }
    if (key === 'door') {
      if (v === 'n' || v === 's' || v === 'e' || v === 'w') prop[key] = v;
      continue;
    }
    if (!finite(v)) continue;
    const lim = LIMITS[key];
    prop[key] = lim ? clamp(v, lim[0], lim[1]) : v;
  }

  // `rise` is the one field a rule cannot work without: it says how tall the
  // staircase is, and there is no sensible default for a flight of steps.
  if (raw.rule === 'stairs' && prop.rise === undefined) {
    problems.push({ path: where, message: 'is a staircase with no `rise`; dropped' });
    return null;
  }

  return prop as PropDoc;
};

/* ------------------------------------------------------------------- tokens */
const FALLBACK_SPEC = PRESETS[0];

const parseSpec = (raw: unknown, where: string, problems: RoomProblem[]): CharacterSpec => {
  if (!isObj(raw)) {
    problems.push({ path: where, message: 'has no character spec; used the first preset' });
    return JSON.parse(JSON.stringify(FALLBACK_SPEC));
  }
  const garment = isObj(raw.garment) ? raw.garment : {};
  const bad: string[] = [];
  const choose = <T extends string>(v: unknown, list: readonly T[], fallback: T, field: string): T => {
    const got = oneOf(v, list);
    if (!got) bad.push(field);
    return got ?? fallback;
  };

  const spec: CharacterSpec = {
    id: typeof raw.id === 'string' && raw.id ? raw.id : FALLBACK_SPEC.id,
    name: typeof raw.name === 'string' && raw.name ? raw.name : FALLBACK_SPEC.name,
    race: choose(raw.race, RACES, FALLBACK_SPEC.race, 'race'),
    build: choose(raw.build, BUILDS, FALLBACK_SPEC.build, 'build'),
    skinTone: choose(raw.skinTone, SKIN_TONES, FALLBACK_SPEC.skinTone, 'skinTone'),
    hair: choose(raw.hair, HAIR_COLOURS, FALLBACK_SPEC.hair, 'hair'),
    hairStyle: choose(raw.hairStyle, HAIR_STYLES, FALLBACK_SPEC.hairStyle, 'hairStyle'),
    beard: choose(raw.beard, BEARDS, FALLBACK_SPEC.beard, 'beard'),
    garment: garmentOf(garment, bad),
    weapon: choose(raw.weapon, WEAPONS, FALLBACK_SPEC.weapon, 'weapon'),
  };

  if (bad.length) {
    problems.push({ path: where, message: `unknown ${bad.join(', ')}; repaired from the first preset` });
  }
  return spec;
};

const garmentOf = (raw: Record<string, unknown>, bad: string[]): CharacterSpec['garment'] => {
  const pick = <T extends string>(v: unknown, list: readonly T[], fallback: T, field: string): T => {
    const got = oneOf(v, list);
    if (!got) bad.push(field);
    return got ?? fallback;
  };
  const f = FALLBACK_SPEC.garment;
  return {
    torso: pick(raw.torso, TORSOS, f.torso, 'garment.torso'),
    torsoCloth: pick(raw.torsoCloth, CLOTHS, f.torsoCloth, 'garment.torsoCloth'),
    legs: pick(raw.legs, LEGS, f.legs, 'garment.legs'),
    legsCloth: pick(raw.legsCloth, CLOTHS, f.legsCloth, 'garment.legsCloth'),
  };
};

const parseFacing = (v: unknown): Facing => {
  if (!finite(v)) return 0;
  const n = Math.round(v);
  return (n < 0 || n > 3 ? 0 : n) as Facing;
};

const parseToken = (
  raw: unknown,
  index: number,
  cols: number,
  rows: number,
  problems: RoomProblem[],
): TokenPlacement | null => {
  const where = `tokens[${index}]`;
  if (!isObj(raw)) {
    problems.push({ path: where, message: 'is not an object' });
    return null;
  }
  const at = raw.at;
  if (!Array.isArray(at) || at.length < 2 || !finite(at[0]) || !finite(at[1])) {
    problems.push({ path: where, message: 'has no usable `at` cell position; dropped' });
    return null;
  }
  const id = typeof raw.id === 'string' && raw.id ? raw.id : `token-${index + 1}`;
  const token: TokenPlacement = {
    id,
    spec: parseSpec(raw.spec, `${where}.spec`, problems),
    at: [q(clamp(at[0], 0, cols)), q(clamp(at[1], 0, rows))],
    facing: parseFacing(raw.facing),
  };
  if (finite(raw.y)) token.y = q(clamp(raw.y, 0, 64));
  if (raw.party === true) token.party = true;
  if (typeof raw.ref === 'string' && raw.ref) token.ref = raw.ref;
  return token;
};

/* -------------------------------------------------------------------- storeys */
const parseTiers = (raw: unknown, cols: number, rows: number, problems: RoomProblem[]): Tier[] => {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) {
    problems.push({ path: 'tiers', message: 'is not an array; ignored' });
    return [];
  }
  const tiers: Tier[] = [];
  raw.forEach((t, i) => {
    const where = `tiers[${i}]`;
    if (!isObj(t) || !finite(t.y) || !Array.isArray(t.rects)) {
      problems.push({ path: where, message: 'needs a numeric `y` and a `rects` array; dropped' });
      return;
    }
    const rects: [number, number, number, number][] = [];
    t.rects.forEach((r, j) => {
      if (!Array.isArray(r) || r.length < 4 || !r.slice(0, 4).every(finite)) {
        problems.push({ path: `${where}.rects[${j}]`, message: 'is not [x, z, w, h]; dropped' });
        return;
      }
      const [x, z, w, h] = r as [number, number, number, number];
      if (w <= 0 || h <= 0) {
        problems.push({ path: `${where}.rects[${j}]`, message: 'has no area; dropped' });
        return;
      }
      // Clip to the room rather than rejecting: a gallery that pokes one cell
      // outside the grid is authoring slop, not a corrupt file.
      const x0 = Math.max(0, Math.floor(x));
      const z0 = Math.max(0, Math.floor(z));
      const x1 = Math.min(cols, Math.ceil(x + w));
      const z1 = Math.min(rows, Math.ceil(z + h));
      if (x1 <= x0 || z1 <= z0) {
        problems.push({ path: `${where}.rects[${j}]`, message: 'lies outside the grid; dropped' });
        return;
      }
      rects.push([x0, z0, x1 - x0, z1 - z0]);
    });
    if (!rects.length) return;
    // Built in the same key order `toDoc` emits: `deck` is optional, and if it
    // landed after `rects` a parsed storey would serialise differently from the
    // one it came from, so a save would not be a fixed point.
    const tier: Tier = {
      y: q(clamp(t.y, 0, 64)),
      ...(t.deck === 'stone' || t.deck === 'wood' ? { deck: t.deck } : {}),
      rects,
    };
    tiers.push(tier);
  });
  return tiers;
};

/* ---------------------------------------------------------------------- rig */
const DEFAULT_RIG: LightRig = {
  ambient: 0.3,
  sun: { azimuth: 225, elevation: 58, intensity: 1 },
  points: [],
};

const parseRig = (raw: unknown, cols: number, rows: number, problems: RoomProblem[]): LightRig => {
  if (!isObj(raw)) {
    problems.push({ path: 'rig', message: 'is missing; the default sun was used' });
    return JSON.parse(JSON.stringify(DEFAULT_RIG));
  }
  const sun = isObj(raw.sun) ? raw.sun : {};
  if (!isObj(raw.sun)) problems.push({ path: 'rig.sun', message: 'is missing; zenith default used' });

  const points: PointLight[] = [];
  if (Array.isArray(raw.points)) {
    raw.points.forEach((p, i) => {
      if (!isObj(p) || !finite(p.x) || !finite(p.y) || !finite(p.radius) || p.radius <= 0) {
        problems.push({ path: `rig.points[${i}]`, message: 'needs finite x, y and a positive radius; dropped' });
        return;
      }
      const light: PointLight = {
        x: q(clamp(p.x, 0, cols * CELL)),
        y: q(clamp(p.y, 0, rows * CELL)),
        radius: q(clamp(p.radius, 0.5, 48 * CELL)),
        intensity: q(clamp(finite(p.intensity) ? p.intensity : 1, 0, 8)),
      };
      if (typeof p.id === 'string' && p.id) light.id = p.id;
      if (finite(p.flicker)) light.flicker = q(clamp(p.flicker, 0, 1));
      points.push(light);
    });
  }

  return {
    ambient: q(clamp(finite(raw.ambient) ? raw.ambient : DEFAULT_RIG.ambient, 0, 1.5)),
    sun: {
      azimuth: q(clamp(finite(sun.azimuth) ? sun.azimuth : DEFAULT_RIG.sun.azimuth, 0, 360)),
      elevation: q(clamp(finite(sun.elevation) ? sun.elevation : DEFAULT_RIG.sun.elevation, -90, 90)),
      intensity: q(clamp(finite(sun.intensity) ? sun.intensity : DEFAULT_RIG.sun.intensity, 0, 2)),
    },
    points,
  };
};

/* ------------------------------------------------------------------- decode */
export function parseRoomDoc(input: unknown): ParseResult {
  const errors: RoomProblem[] = [];
  const warnings: RoomProblem[] = [];
  const fail = (path: string, message: string): ParseResult => {
    errors.push({ path, message });
    return { status: 'bad', errors };
  };

  if (!isObj(input)) return fail('$', 'is not a room document (expected an object)');
  if (input.format !== ROOM_FORMAT) {
    return fail('format', `is "${String(input.format)}", not "${ROOM_FORMAT}"`);
  }
  if (!finite(input.version) || input.version < 1) return fail('version', 'is missing or not a number');
  if (input.version > ROOM_VERSION) {
    return fail('version', `is ${input.version}; this build reads up to ${ROOM_VERSION}`);
  }
  if (!Array.isArray(input.terrain)) return fail('terrain', 'is not an array of rows');

  const rows = input.terrain.length;
  if (rows === 0) return fail('terrain', 'has no rows');
  if (rows > MAX_SIDE) return fail('terrain', `has ${rows} rows; the limit is ${MAX_SIDE}`);

  let cols = -1;
  const cells = new Uint8Array(Math.min(MAX_CELLS, MAX_SIDE * MAX_SIDE));
  let used = 0;
  for (let z = 0; z < rows; z++) {
    const raw = input.terrain[z];
    if (typeof raw !== 'string') return fail(`terrain[${z}]`, 'is not a string');
    const row = decodeRow(raw);
    if (!row) return fail(`terrain[${z}]`, 'is not a run-length row like "2*4,1*20"');
    if (cols < 0) cols = row.length;
    else if (row.length !== cols) {
      return fail(`terrain[${z}]`, `is ${row.length} cells wide, but row 0 is ${cols}`);
    }
    if (cols > MAX_SIDE) return fail('terrain', `is ${cols} cells wide; the limit is ${MAX_SIDE}`);
    if (used + row.length > MAX_CELLS) return fail('terrain', `is larger than ${MAX_CELLS} cells`);
    for (let x = 0; x < row.length; x++) cells[used++] = row[x];
  }

  // Ground is a second, purely visual layer: what the floor is made of. It is
  // optional, and a row that disagrees with the terrain is a broken document
  // rather than something to guess around.
  let ground: Uint8Array | null = null;
  if (input.ground !== undefined) {
    if (!Array.isArray(input.ground)) return fail('ground', 'is not an array of rows');
    if (input.ground.length !== rows) return fail('ground', `has ${input.ground.length} rows; terrain has ${rows}`);
    ground = new Uint8Array(rows * cols);
    for (let z = 0; z < rows; z++) {
      const raw = input.ground[z];
      if (typeof raw !== 'string') return fail(`ground[${z}]`, 'is not a string');
      const row = decodeRow(raw, GROUND_KINDS.length - 1);
      if (!row) return fail(`ground[${z}]`, `is not a run-length row of 0..${GROUND_KINDS.length - 1}`);
      if (row.length !== cols) return fail(`ground[${z}]`, `is ${row.length} cells wide, but the room is ${cols}`);
      for (let x = 0; x < cols; x++) {
        // Ground under a wall is a lie the renderer would have to ignore, so it
        // is not stored: only walkable cells carry a surface.
        ground[z * cols + x] = cells[z * cols + x] === 1 ? row[x] : 0;
      }
    }
  }

  const id = typeof input.id === 'string' && input.id ? input.id : '';
  const name = typeof input.name === 'string' && input.name ? input.name : '';
  if (!id) warnings.push({ path: 'id', message: `is missing; derived from the name as "${slug(name || 'room')}"` });

  // Props, with ids that an editor or a sync message can address.
  const props: PropDoc[] = [];
  const seen = new Set<string>();
  const claim = (wanted: unknown, fallback: string): string => {
    let base = typeof wanted === 'string' && wanted ? wanted : fallback;
    let candidate = base;
    for (let n = 2; seen.has(candidate); n++) candidate = `${base}-${n}`;
    seen.add(candidate);
    return candidate;
  };

  if (input.props !== undefined && !Array.isArray(input.props)) {
    warnings.push({ path: 'props', message: 'is not an array; ignored' });
  } else if (Array.isArray(input.props)) {
    input.props.forEach((raw, i) => {
      const prop = parseProp(raw, i, warnings);
      if (!prop) return;
      const wanted = isObj(raw) ? raw.id : undefined;
      // Re-serialise through the same ordering as `toDoc`, so parsing a file and
      // writing it back is byte-identical.
      props.push(canonicalProp(prop as PropRule, claim(wanted, `p${i + 1}`)));
    });
  }

  const tokens: TokenPlacement[] = [];
  const tokenIds = new Set<string>();
  if (input.tokens !== undefined && !Array.isArray(input.tokens)) {
    warnings.push({ path: 'tokens', message: 'is not an array; ignored' });
  } else if (Array.isArray(input.tokens)) {
    input.tokens.forEach((raw, i) => {
      const token = parseToken(raw, i, cols, rows, warnings);
      if (!token) return;
      if (tokenIds.has(token.id)) {
        warnings.push({ path: `tokens[${i}].id`, message: `duplicate "${token.id}"; renamed` });
        token.id = `${token.id}-${i + 1}`;
      }
      tokenIds.add(token.id);
      tokens.push(token);
    });
  }

  // Doors: one per walkable cell, optionally linked to another room. A link is
  // a promise the room next door exists; the graph resolves it, not the room.
  const doors: RoomDoor[] = [];
  const doorCells = new Set<number>();
  const doorIds = new Set<string>();
  if (input.doors !== undefined && !Array.isArray(input.doors)) {
    warnings.push({ path: 'doors', message: 'is not an array; ignored' });
  } else if (Array.isArray(input.doors)) {
    input.doors.forEach((raw, i) => {
      if (!isObj(raw)) {
        warnings.push({ path: `doors[${i}]`, message: 'is not an object; dropped' });
        return;
      }
      const at = raw.at;
      if (!Array.isArray(at) || at.length < 2 || !finite(at[0]) || !finite(at[1])) {
        warnings.push({ path: `doors[${i}].at`, message: 'is not a cell; dropped' });
        return;
      }
      const x = Math.round(at[0]);
      const z = Math.round(at[1]);
      if (x < 0 || z < 0 || x >= cols || z >= rows || cells[z * cols + x] === 0) {
        warnings.push({ path: `doors[${i}].at`, message: 'is void; a door needs a floor or a wall to stand in' });
        return;
      }
      if (doorCells.has(z * cols + x)) {
        warnings.push({ path: `doors[${i}].at`, message: 'is a second door on the same cell; dropped' });
        return;
      }
      doorCells.add(z * cols + x);
      let doorId = typeof raw.id === 'string' && raw.id ? raw.id : `door-${doors.length + 1}`;
      while (doorIds.has(doorId)) doorId = `${doorId}-2`;
      doorIds.add(doorId);

      const door: RoomDoor = { id: doorId, at: [x, z] };
      if (typeof raw.label === 'string' && raw.label) door.label = raw.label.slice(0, 60);
      if (raw.state === 'open' || raw.state === 'closed' || raw.state === 'locked') door.state = raw.state;
      if (isObj(raw.to) && typeof raw.to.room === 'string' && raw.to.room && typeof raw.to.door === 'string' && raw.to.door) {
        door.to = { room: raw.to.room, door: raw.to.door };
      } else if (raw.to !== undefined) {
        warnings.push({ path: `doors[${i}].to`, message: 'is not { room, door }; unlinked' });
      }
      doors.push(door);
    });
  }

  const path: [number, number][] = [];
  if (Array.isArray(input.path)) {
    input.path.forEach((pt, i) => {
      if (!Array.isArray(pt) || pt.length < 2 || !finite(pt[0]) || !finite(pt[1])) {
        warnings.push({ path: `path[${i}]`, message: 'is not a cell point; dropped' });
        return;
      }
      // A path point outside the room cannot be walked, so it is not a path.
      if (pt[0] < 0 || pt[1] < 0 || pt[0] > cols || pt[1] > rows) {
        warnings.push({ path: `path[${i}]`, message: 'lies outside the grid; dropped' });
        return;
      }
      path.push([q(pt[0]), q(pt[1])]);
    });
  }

  const doc: RoomDoc = {
    format: ROOM_FORMAT,
    version: ROOM_VERSION,
    id: id || slug(name || 'room'),
    name: name || 'Untitled room',
    terrain: encodeTerrain({ cols, rows, cells: cells.subarray(0, used), seed: finite(input.seed) ? input.seed : 0 }),
    seed: finite(input.seed) ? q(input.seed) : 0,
    props,
    tokens,
    path,
    rig: parseRig(input.rig, cols, rows, warnings),
  };
  if (ground) doc.ground = encodeGround(ground, cols, rows);
  if (doors.length) doc.doors = doors;

  const tiers = parseTiers(input.tiers, cols, rows, warnings);
  if (tiers.length) doc.tiers = tiers;
  if (finite(input.wallHeight)) doc.wallHeight = q(clamp(input.wallHeight, 0, 24));
  if (isObj(input.view)) {
    const v = input.view;
    if (finite(v.yaw) && finite(v.pitch) && finite(v.zoom)) {
      doc.view = {
        yaw: q(clamp(v.yaw, 0, 360)),
        pitch: q(clamp(v.pitch, 20, 84)),
        zoom: q(clamp(v.zoom, 0.4, 4)),
      };
    } else {
      warnings.push({ path: 'view', message: 'needs yaw, pitch and zoom; ignored' });
    }
  }

  return { status: 'ok', doc, room: roomFromDoc(doc), warnings };
}

/* -------------------------------------------------------------------- build */
export function roomFromDoc(doc: RoomDoc): Room {
  const cols = decodeRow(doc.terrain[0])?.length ?? 0;
  const rows = doc.terrain.length;
  const cells = new Uint8Array(cols * rows);
  for (let z = 0; z < rows; z++) {
    const row = decodeRow(doc.terrain[z]);
    if (!row || row.length !== cols) throw new Error(`room ${doc.id}: terrain row ${z} does not match`);
    cells.set(row, z * cols);
  }
  const grid: RoomGrid = { cols, rows, seed: doc.seed, cells };

  const room: Room = {
    grid,
    props: doc.props.map((p) => canonicalProp(p, p.id) as PropRule),
    tokens: doc.tokens.map((t) => ({
      ...t,
      spec: { ...t.spec, garment: { ...t.spec.garment } },
      at: [t.at[0], t.at[1]],
    })),
    path: doc.path.map((p) => [p[0], p[1]] as [number, number]),
    rig: JSON.parse(JSON.stringify(doc.rig)),
  };
  if (doc.ground) {
    const g = new Uint8Array(cols * rows);
    for (let z = 0; z < rows; z++) {
      const row = decodeRow(doc.ground[z], GROUND_KINDS.length - 1);
      if (!row || row.length !== cols) throw new Error(`room ${doc.id}: ground row ${z} does not match`);
      g.set(row, z * cols);
    }
    room.grid.ground = g;
  }
  if (doc.doors?.length) room.doors = JSON.parse(JSON.stringify(doc.doors));
  if (doc.tiers?.length) room.tiers = JSON.parse(JSON.stringify(doc.tiers));
  if (doc.wallHeight !== undefined) room.wallHeight = doc.wallHeight;
  return room;
}

/* -------------------------------------------------------------------- write */
/**
 * The one serialiser. Props and specs are rebuilt field by field, so a saved
 * room has no accidental keys and the same room always has the same bytes.
 */
export function toDoc(
  room: Room,
  meta: RoomMeta,
  opts: { rig?: LightRig; view?: DocView } = {},
): RoomDoc {
  const { cols, rows } = room.grid;
  const seen = new Set<string>();
  const props: PropDoc[] = room.props.map((p, i) => {
    let id = p.id || `p${i + 1}`;
    let n = 2;
    while (seen.has(id)) id = `${p.id || `p${i + 1}`}-${n++}`;
    seen.add(id);
    return canonicalProp(p, id);
  });

  const tokenIds = new Set<string>();
  const tokens: TokenPlacement[] = room.tokens.map((t, i) => {
    let id = t.id || `token-${i + 1}`;
    let n = 2;
    while (tokenIds.has(id)) id = `${t.id || `token-${i + 1}`}-${n++}`;
    tokenIds.add(id);

    const spec = t.spec;
    const token: TokenPlacement = {
      id,
      spec: {
        id: spec.id,
        name: spec.name,
        race: spec.race,
        build: spec.build,
        skinTone: spec.skinTone,
        hair: spec.hair,
        hairStyle: spec.hairStyle,
        beard: spec.beard,
        garment: {
          torso: spec.garment.torso,
          torsoCloth: spec.garment.torsoCloth,
          legs: spec.garment.legs,
          legsCloth: spec.garment.legsCloth,
        },
        weapon: spec.weapon,
      },
      at: [q(t.at[0]), q(t.at[1])],
      facing: t.facing,
    };
    if (t.y !== undefined) token.y = q(t.y);
    if (t.party) token.party = true;
    if (t.ref) token.ref = t.ref;
    return token;
  });

  const rig = opts.rig ?? room.rig;
  const doc: RoomDoc = {
    format: ROOM_FORMAT,
    version: ROOM_VERSION,
    id: meta.id,
    name: meta.name,
    terrain: encodeTerrain(room.grid),
    seed: q(room.grid.seed),
    props,
    tokens,
    path: room.path.map((p) => [q(p[0]), q(p[1])] as [number, number]),
    rig: {
      ambient: q(rig.ambient),
      sun: {
        azimuth: q(rig.sun.azimuth),
        elevation: q(rig.sun.elevation),
        intensity: q(rig.sun.intensity),
      },
      points: rig.points.map((p) => {
        const light: PointLight = {
          x: q(p.x),
          y: q(p.y),
          radius: q(p.radius),
          intensity: q(p.intensity),
        };
        if (p.id) light.id = p.id;
        if (p.flicker !== undefined) light.flicker = q(p.flicker);
        return light;
      }),
    },
  };
  if (room.grid.ground) doc.ground = encodeGround(room.grid.ground, cols, rows);
  if (room.doors?.length) {
    doc.doors = room.doors.map((d) => {
      const door: RoomDoor = { id: d.id, at: [Math.round(d.at[0]), Math.round(d.at[1])] };
      if (d.label) door.label = d.label;
      if (d.state) door.state = d.state;
      if (d.to) door.to = { room: d.to.room, door: d.to.door };
      return door;
    });
  }
  if (room.tiers?.length) doc.tiers = JSON.parse(JSON.stringify(room.tiers));
  if (room.wallHeight !== undefined) doc.wallHeight = q(room.wallHeight);
  if (opts.view) {
    doc.view = { yaw: q(opts.view.yaw), pitch: q(opts.view.pitch), zoom: q(opts.view.zoom) };
  }
  return doc;
}

/** Two spaces and a trailing newline: a file a person can read and a diff can show. */
export const docToJson = (doc: RoomDoc): string => `${JSON.stringify(doc, null, 2)}\n`;

export const newRoomId = (name: string, now = Date.now()): string =>
  `${slug(name)}-${now.toString(36).slice(-5)}`;
