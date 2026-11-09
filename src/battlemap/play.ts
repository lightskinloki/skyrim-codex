import type { Facing, Room, TokenPlacement } from './room';
import type { LightRig } from './light';
import { CELL } from './paint';

/**
 * What changes while a table is playing, as opposed to what an author wrote.
 *
 * A room document is the map. This is the session on top of it: where the party
 * is, where the torches were moved, and which cells have been seen. It is keyed
 * by room id and stored in this browser, so leaving a room through a door and
 * coming back finds it as you left it.
 */
export type RoomPlay = {
  rig?: LightRig;
  tokenAt?: Record<string, { at: [number, number]; facing?: Facing }>;
  /** Base64 bitmask over visible cells, one bit per cell. */
  explored?: string;
};

export type PlayFile = Record<string, RoomPlay>;

const KEY = 'skyrim-codex.play.v1';

const store = (): Storage | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

export function loadPlay(): PlayFile {
  const s = store();
  if (!s) return {};
  try {
    const raw = JSON.parse(s.getItem(KEY) ?? '{}') as PlayFile;
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

export function savePlay(file: PlayFile): void {
  const s = store();
  if (!s) return;
  try {
    s.setItem(KEY, JSON.stringify(file));
  } catch {
    /* a full quota is a save problem, not a render problem */
  }
}

/** Applies the session layer to a parsed room. Always returns a fresh room, so
 *  the library's copy is never mutated by a move. */
export function applyPlay(room: Room, play: RoomPlay | undefined): Room {
  const out: Room = JSON.parse(JSON.stringify(room));
  if (!play) return out;
  if (play.rig) out.rig = JSON.parse(JSON.stringify(play.rig));
  if (play.tokenAt) {
    for (const t of out.tokens) {
      const p = play.tokenAt[t.id];
      if (!p) continue;
      t.at = [p.at[0], p.at[1]];
      if (p.facing !== undefined) t.facing = p.facing;
    }
  }
  return out;
}

/** The party token. Older rooms predate the flag, so a token named `pc-…` is
 *  the fallback: a room with no party at all has no eyes for fog to use. */
export function partyOf(room: Room): TokenPlacement[] {
  const marked = room.tokens.filter((t) => t.party);
  if (marked.length) return marked;
  return room.tokens.filter((t) => t.id.startsWith('pc-'));
}

/**
 * Where a party arrives when it walks through a door: the first walkable cell
 * next to the door that is not another door, preferring the side toward the
 * middle of the room. Returns null when the door has no room around it.
 */
export function arrivalCell(room: Room, doorId: string): [number, number] | null {
  const door = (room.doors ?? []).find((d) => d.id === doorId);
  if (!door) return null;
  const [dx, dz] = door.at;
  const cx = (room.grid.cols - 1) / 2;
  const cz = (room.grid.rows - 1) / 2;
  // Never the door cell itself: a token standing in the threshold is behind the
  // near wall's curb and reads as having failed to arrive. One step in from the
  // door, toward the middle of the room, is where a party actually enters.
  const sx = dx < cx ? 1 : -1;
  const sz = dz < cz ? 1 : -1;
  const options: [number, number][] = [
    [dx + sx, dz],
    [dx, dz + sz],
    [dx + sx * 2, dz],
    [dx, dz + sz * 2],
    [dx - sx, dz],
    [dx, dz - sz],
  ];
  for (const [x, z] of options) {
    if (x < 0 || z < 0 || x >= room.grid.cols || z >= room.grid.rows) continue;
    if (room.grid.cells[z * room.grid.cols + x] !== 1) continue;
    return [x + 0.5, z + 0.5];
  }
  return null;
}

/** Moves every party token to the arrival cell, keeping the facing. */
export function moveParty(room: Room, at: [number, number]): Room {
  const out: Room = JSON.parse(JSON.stringify(room));
  for (const t of out.tokens) {
    if (!t.party) continue;
    t.at = [at[0], at[1]];
  }
  return out;
}

/* -------------------------------------------------------------------- fog */

const cellOf = (room: Room, x: number, z: number): number => {
  if (x < 0 || z < 0 || x >= room.grid.cols || z >= room.grid.rows) return 0;
  return room.grid.cells[z * room.grid.cols + x];
};

/**
 * Line of sight on the cell lattice. Walls block; a wall is itself visible when
 * it is the thing that stopped the line, which is why the far side of a room is
 * dark but its wall is not invisible.
 *
 * This is a 2D test on purpose: the board is a stack of storeys, but a doorway,
 * a crate and a wall all occlude a token at this scale, and a 3D ray per cell
 * would buy corners at ten times the cost.
 */
export function visibility(room: Room, sources: [number, number][], radiusCells: number): Uint8Array {
  const { cols, rows } = room.grid;
  const visible = new Uint8Array(cols * rows);
  const r2 = radiusCells * radiusCells;

  for (const [sx, sz] of sources) {
    const ox = Math.floor(sx);
    const oz = Math.floor(sz);
    const reach = Math.ceil(radiusCells);
    for (let dz = -reach; dz <= reach; dz++) {
      for (let dx = -reach; dx <= reach; dx++) {
        const x = ox + dx;
        const z = oz + dz;
        if (x < 0 || z < 0 || x >= cols || z >= rows) continue;
        if (dx * dx + dz * dz > r2) continue;

        // Sample the centre-to-centre line at a quarter cell. A wall is opaque,
        // but the cell you are standing in and the cell you are looking at are
        // not blockers themselves.
        const tx = x + 0.5;
        const tz = z + 0.5;
        const dist = Math.hypot(tx - sx, tz - sz);
        const steps = Math.max(1, Math.ceil(dist * 4));
        let blocked = false;
        for (let i = 1; i < steps; i++) {
          const f = i / steps;
          const px = sx + (tx - sx) * f;
          const pz = sz + (tz - sz) * f;
          const cx = Math.floor(px);
          const cz = Math.floor(pz);
          if (cx === x && cz === z) continue;
          if (cx === ox && cz === oz) continue;
          if (cellOf(room, cx, cz) === 2) {
            visible[cz * cols + cx] = 1;
            blocked = true;
            break;
          }
        }
        if (!blocked) visible[z * cols + x] = 1;
      }
    }
  }
  return visible;
}

/** The union of what the party can see now and what they have already seen. */
export function mergeExplored(explored: Uint8Array | null, visible: Uint8Array): Uint8Array {
  if (!explored || explored.length !== visible.length) return visible.slice();
  const out = explored.slice();
  for (let i = 0; i < out.length; i++) if (visible[i]) out[i] = 1;
  return out;
}

export function encodeMask(mask: Uint8Array): string {
  let s = '';
  for (let i = 0; i < mask.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) if (mask[i + j]) b |= 1 << j;
    s += String.fromCharCode(b);
  }
  try {
    return btoa(s);
  } catch {
    return '';
  }
}

export function decodeMask(encoded: string | undefined, cells: number): Uint8Array {
  const out = new Uint8Array(cells);
  if (!encoded) return out;
  try {
    const s = atob(encoded);
    for (let i = 0; i < cells; i++) {
      const byte = s.charCodeAt(i >> 3);
      if (byte & (1 << (i & 7))) out[i] = 1;
    }
  } catch {
    /* a corrupt mask is an empty mask */
  }
  return out;
}

/** Cells the party can see, in cell coordinates, for the renderer's mask pass. */
export const sourceCells = (room: Room): [number, number][] =>
  partyOf(room).map((t) => [Math.floor(t.at[0]), Math.floor(t.at[1])] as [number, number]);

export const FOG_RADIUS_CELLS = 11;

/** Converts the party's pixels back to cells far enough for the token to sit on
 *  a bridge: the renderer works in cell units as well, so this is only here to
 *  keep call sites from doing the divide twice. */
export const cellCentre = (x: number, z: number): [number, number, number] => [x + 0.5, 0, z + 0.5];

export const TOKEN_PX = CELL;
