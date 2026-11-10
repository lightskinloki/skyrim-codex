import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Board3D, buildSheet, type TokenMotion } from '@/battlemap/gl/render';
import { MOODS, makeDemoRoom, type Room } from '@/battlemap/room';
import { LightRig } from '@/battlemap/light';
import { CELL } from '@/battlemap/paint';
import { docToJson, newRoomId, parseRoomDoc, toDoc } from '@/battlemap/document';
import { deleteSave, lastRoomId, listLibrary, rememberRoom, saveDoc, type RoomEntry } from '@/battlemap/library';
import type { PropRule } from '@/battlemap/props';
import type { GroundKind, RoomDoor } from '@/battlemap/room';
import {
  findWalkPath,
  findWalkRoute,
  landing,
  motionAt,
  planWalk,
  type WalkCell,
  type WalkPlan,
} from '@/battlemap/walk';
import { specFromCharacter } from '@/characters/live';
import { characterStorage } from '@/utils/characterStorage';
import {
  applyPlay,
  arrivalCell,
  decodeMask,
  encodeMask,
  FOG_RADIUS_CELLS,
  loadPlay,
  mergeExplored,
  moveParty,
  savePlay,
  sourceCells,
  visibility,
  type PlayFile,
  type RoomPlay,
} from '@/battlemap/play';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Brush, DoorOpen, RotateCcw, ZoomIn, ZoomOut, Flame, Eye, EyeOff, RefreshCw, Move3d, Save, Download, Upload, Trash2, Eraser, Undo2, Footprints } from 'lucide-react';

type View = 'lit' | 'depth' | 'materials';

const MODES: { id: View; label: string }[] = [
  { id: 'lit', label: 'Lit' },
  { id: 'depth', label: 'Depth' },
  { id: 'materials', label: 'Materials' },
];

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

type Tool = 'look' | 'floor' | 'wall' | 'grass' | 'dirt' | 'water' | 'wood' | 'prop' | 'door' | 'erase' | 'torch';

const GROUND_TOOLS: { id: Tool; label: string; ground: GroundKind }[] = [
  { id: 'grass', label: 'Grass', ground: 'grass' },
  { id: 'dirt', label: 'Dirt', ground: 'dirt' },
  { id: 'water', label: 'Water', ground: 'water' },
  { id: 'wood', label: 'Deck', ground: 'wood' },
  { id: 'floor', label: 'Stone', ground: 'stone' },
];

const PROP_CHOICES: { id: PropRule['rule']; label: string }[] = [
  { id: 'house', label: 'House' },
  { id: 'tree', label: 'Tree' },
  { id: 'table', label: 'Table' },
  { id: 'bench', label: 'Bench' },
  { id: 'crate', label: 'Crate' },
  { id: 'barrel', label: 'Barrel' },
  { id: 'shelf', label: 'Shelf' },
  { id: 'chest', label: 'Chest' },
  { id: 'brazier', label: 'Brazier' },
  { id: 'rug', label: 'Rug' },
  { id: 'column', label: 'Column' },
  { id: 'stairs', label: 'Stairs' },
  { id: 'rubble', label: 'Rubble' },
];

const tokenPositions = (room: Room): NonNullable<RoomPlay['tokenAt']> => {
  const out: NonNullable<RoomPlay['tokenAt']> = {};
  for (const t of room.tokens) out[t.id] = { at: [t.at[0], t.at[1]], facing: t.facing };
  return out;
};

/** Rough footprint test: enough for an eraser, not for collision. */
const propCovers = (p: PropRule, x: number, z: number): boolean => {
  const x0 = p.at[0];
  const z0 = p.at[1];
  let w = 1;
  let h = 1;
  if (p.rule === 'table' || p.rule === 'bench' || p.rule === 'chest' || p.rule === 'shelf') {
    w = p.w ?? 1;
    h = 0.75;
  } else if (p.rule === 'rug') {
    w = p.w ?? 2;
    h = p.h ?? 2;
  } else if (p.rule === 'house') {
    w = p.w ?? 4;
    h = p.h ?? 3;
  } else if (p.rule === 'stairs') {
    w = p.w ?? 1.6;
    h = p.run ?? 2;
  }
  return x >= Math.floor(x0) && x < Math.ceil(x0 + w) && z >= Math.floor(z0) && z < Math.ceil(z0 + h);
};

const makeProp = (rule: PropRule['rule'], cx: number, cz: number): PropRule => {
  const at: [number, number] = [cx, cz];
  switch (rule) {
    case 'house':
      return { rule, at, w: 4, h: 3, roof: 'thatch', door: 's' };
    case 'tree':
      return { rule, at, size: 2, autumn: true };
    case 'stairs':
      return { rule, at, rise: 2, run: 1.4, along: 'z', dir: 1 };
    case 'column':
      return { rule, at, h: 0.94 };
    case 'brazier':
      return { rule, at, lit: true };
    default:
      return { rule, at } as PropRule;
  }
};

export function BattleMapView() {
  // Every room the board can show comes from the library: the two shipped
  // documents, then the saves in this browser. Nothing is built by calling a
  // function at render time, which is what makes a room something you can own.
  const initial = useMemo(() => listLibrary(), []);
  const [library, setLibrary] = useState<RoomEntry[]>(initial);
  // The last room you were in wins, as long as it is still in the library (a
  // deleted save must not leave the board pointing at nothing).
  const [roomId, setRoomId] = useState<string>(() => {
    const last = lastRoomId();
    return initial.some((r) => r.id === last) ? (last as string) : initial[0]?.id ?? '';
  });
  const entry = library.find((r) => r.id === roomId) ?? library[0];
  const baseRoom = useMemo<Room>(() => entry?.room ?? makeDemoRoom(), [entry]);
  const boardRef = useRef<Board3D | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLCanvasElement | null>(null);
  const fitRef = useRef(1);

  const [tab, setTab] = useState<'room' | 'sheet'>('room');
  const [rig, setRig] = useState<LightRig>(() => JSON.parse(JSON.stringify(baseRoom.rig)));
  const [mood, setMood] = useState<string | null>('noon');
  const [cam, setCam] = useState({ yaw: 32, pitch: 55, zoom: 1 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [view, setView] = useState<View>('lit');
  const [showPath, setShowPath] = useState(true);
  const [fit, setFit] = useState(1);
  const [fps, setFps] = useState(0);
  const [nameDraft, setNameDraft] = useState(entry?.name ?? '');
  const [notice, setNotice] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  /* ----------------------------------------------------------- authoring */
  const [playFile, setPlayFile] = useState<PlayFile>(() => loadPlay());
  const [draft, setDraft] = useState<Room | null>(null);
  const [tool, setTool] = useState<Tool>('look');
  const [propRule, setPropRule] = useState<PropRule['rule']>('crate');
  const [fogOn, setFogOn] = useState(false);

  /* ---------------------------------------------------------------- walking */
  // The selected body, the route it would take to the cell under the pointer,
  // and the route it is taking now. A walk is a real path: the preview and the
  // commit are the same plan, so the dots under the cursor are the move.
  const [selected, setSelected] = useState<string | null>(null);
  const [route, setRoute] = useState<WalkCell[] | null>(null);
  const [walking, setWalking] = useState(false);
  const [walkSq, setWalkSq] = useState(0);
  // A planned move: the cells the table clicked, and the route through them.
  // The quick click still walks to one cell; planning is for the moves that
  // need a corner turned on purpose.
  const [drawing, setDrawing] = useState(false);
  const [waypoints, setWaypoints] = useState<[number, number][]>([]);
  const walk = useRef<WalkPlan | null>(null);
  const walkCommit = useRef<(plan: WalkPlan) => void>(() => {});
  const walkTimer = useRef<number | null>(null);
  const hoverCell = useRef('');

  /** The landing is a timer, not a side effect of the animation. rAF stops in a
   *  background tab, and a move that never lands leaves the body stuck mid-
   *  stride and its position unsaved; the clock is wall time, so the landing is
   *  too. The loop normally beats this by a frame and clears it. */
  const clearWalkTimer = useCallback(() => {
    if (walkTimer.current !== null) {
      window.clearTimeout(walkTimer.current);
      walkTimer.current = null;
    }
  }, []);

  const play = playFile[roomId];
  // An edit is a draft of the document, not a mutation of the library: Cancel
  // has to give the room back, and Save is the only thing that writes.
  const room = useMemo<Room>(() => {
    const base = draft ? draft : applyPlay(baseRoom, play);
    if (!base.tokens.some((t) => t.ref)) return base;
    const chars = characterStorage.getAllCharacters();
    if (!chars.length) return base;
    const byId = new Map(chars.map((c) => [c.id, c]));
    const out: Room = JSON.parse(JSON.stringify(base));
    for (const t of out.tokens) {
      const c = t.ref ? byId.get(t.ref) : undefined;
      if (c) t.spec = specFromCharacter(c);
    }
    return out;
  }, [draft, baseRoom, play]);
  const characters = useMemo(() => characterStorage.getAllCharacters(), [roomId]);

  /** The room the rig and camera were last reset for. Keyed by id, not by object:
   *  saving replaces the entry, and the board should not jump when it succeeds. */
  const loaded = useRef<string | null>(null);

  // Torches are in the rig, so the count derives from the rig. A separate
  // counter drifts the first time a room is saved or a save is opened.
  const torches = rig.points.filter((p) => p.id?.startsWith('torch-')).length;

  /* ------------------------------------------------------------------ fog */
  // Visibility is recomputed when the room changes, not per frame: a party
  // only moves on a transition, and 1,500 ray cells at 30 Hz would cost more
  // than the whole render.
  const fogData = useMemo(() => {
    const cells = room.grid.cols * room.grid.rows;
    const visible = visibility(room, sourceCells(room), FOG_RADIUS_CELLS);
    const seen = mergeExplored(decodeMask(play?.explored, cells), visible);
    return { cols: room.grid.cols, rows: room.grid.rows, visible, seen };
  }, [room, play?.explored]);

  // Latest values for the animation loop, without re-creating it.
  const live = useRef({
    rig,
    view,
    showPath,
    cam,
    pan,
    tab,
    fog: fogOn ? fogData : null,
    selected,
    route,
    tool,
    drawing,
    marks: [] as [number, number][],
  });
  live.current = {
    rig,
    view,
    showPath,
    cam,
    pan,
    tab,
    fog: fogOn ? fogData : null,
    selected,
    route,
    tool,
    drawing,
    marks: waypoints,
  };

  /* ---------------------------------------------------------------- paint */
  // Stable identity: the animation loop restarts whenever this changes, and a
  // restart resets the frame clock. The fit comes from a ref and is recomputed
  // only when the room or the panel changes, never per frame.
  const lastPaint = useRef(0);
  const paint = useCallback(() => {
    const b = boardRef.current;
    const canvas = canvasRef.current;
    const el = wrapRef.current;
    if (!b || !canvas || !el) return;
    const now = performance.now();
    lastPaint.current = now;
    const L = live.current;
    b.yaw = L.cam.yaw;
    b.pitch = L.cam.pitch;

    // A walk is an override on the cached scene: the room document still has
    // the body where it started, and the frame is drawn where the clock says it
    // is. The route is the same array that was planned, so the dots on screen
    // and the path walked cannot diverge.
    const plan = walk.current;
    let motion: Record<string, TokenMotion> | null = null;
    if (plan) {
      const m = motionAt(plan, now);
      motion = { [plan.id]: { x: m.x, y: m.y, z: m.z, facing: m.facing, step: m.step } };
    }
    const cells = L.route && L.route.length > 1 ? L.route : plan ? plan.cells : null;
    const dots: [number, number][] = cells
      ? cells.map((c) => [Math.floor(c.x), Math.floor(c.z)] as [number, number])
      : [];
    const decks: number[] | null = cells ? cells.map((c) => c.y) : null;

    b.render(L.rig, {
      showPath: L.showPath,
      selectedToken: L.selected,
      time: now / 1000,
      // The ink sweep reads the depth buffer, which is only stale while the
      // camera is actually moving. Skipping it mid-drag buys back a fifth of
      // the frame; the pointer-up frame puts the lines back.
      outline: !drag.current?.moved,
      fog: L.fog,
      motion,
      path: L.showPath ? dots : [],
      pathDecks: L.showPath ? decks : null,
      pathMarks: L.showPath && L.drawing ? L.marks : null,
    });
    if (L.view !== 'lit') b.debug(L.view);

    // 1× is the room fitting at every camera angle, so the scale can only
    // change when the room or the panel does — never while the camera turns.
    const scale = fitRef.current * L.cam.zoom;
    b.present(canvas, el.clientWidth, el.clientHeight, scale, L.pan.x, L.pan.y);
  }, []);

  /* ------------------------------------------------------------- play state */
  const writePlay = useCallback((id: string, patch: Partial<RoomPlay>) => {
    setPlayFile((prev) => {
      const next = { ...prev, [id]: { ...(prev[id] ?? {}), ...patch } };
      savePlay(next);
      return next;
    });
  }, []);

  const persistHere = useCallback(() => {
    if (!entry) return;
    writePlay(entry.id, {
      rig: JSON.parse(JSON.stringify(rig)),
      tokenAt: tokenPositions(room),
      explored: encodeMask(fogData.seen),
    });
  }, [entry, rig, room, fogData, writePlay]);

  /** One way to leave a room, whether you click the strip, the dropdown or a
   *  door: write what this room knows, then hand the board the next document. */
  const switchRoom = useCallback(
    (id: string) => {
      if (id === roomId) return;
      persistHere();
      // A body cannot keep walking through a load: the route belongs to the room
      // it was planned in, and the next room has no such cells.
      clearWalkTimer();
      walk.current = null;
      setWalking(false);
      setWalkSq(0);
      setRoute(null);
      setWaypoints([]);
      setDrawing(false);
      hoverCell.current = '';
      setRoomId(id);
    },
    [persistHere, roomId],
  );

  /* ---------------------------------------------------------------- walking */
  /** A route from the selected body to a point on the board. The start is the
   *  body's own position, not its cell's centre: a token authored off centre
   *  should rejoin the lattice on its first step, not jump onto it. */
  const pathTo = useCallback(
    (x: number, z: number): WalkCell[] | null => {
      const b = boardRef.current;
      if (!b || !selected) return null;
      const tok = b.scene.tokens.find((t) => t.id === selected);
      if (!tok) return null;
      // Two bodies cannot share a square. Walking *through* a body is not
      // modelled yet, but ending on one would bury the token underneath.
      const gx = Math.floor(x);
      const gz = Math.floor(z);
      const occupied = b.scene.tokens.some(
        (t) => t.id !== selected && Math.floor(t.x) === gx && Math.floor(t.z) === gz,
      );
      if (occupied) return null;
      return findWalkPath(b.scene, { x: tok.x, y: tok.y, z: tok.z }, { x, z });
    },
    [selected],
  );

  /** A route through every click, planned leg by leg on the same scene the
   *  quick move uses. Each leg starts where the last one finished, including
   *  its deck, so a waypoint up a stair is a real climb and not a teleport. */
  const planThrough = useCallback(
    (points: [number, number][]): WalkCell[] | null => {
      const b = boardRef.current;
      if (!b || !selected || !points.length) return null;
      const tok = b.scene.tokens.find((t) => t.id === selected);
      if (!tok) return null;
      for (const [cx, cz] of points) {
        // A waypoint is somewhere to stand, so another body cannot occupy it.
        // The leg itself may still pass through an occupied square.
        const occupied = b.scene.tokens.some(
          (t) => t.id !== selected && Math.floor(t.x) === cx && Math.floor(t.z) === cz,
        );
        if (occupied) return null;
      }
      return findWalkRoute(
        b.scene,
        { x: tok.x, y: tok.y, z: tok.z },
        points.map(([cx, cz]) => ({ x: cx + 0.5, z: cz + 0.5 })),
      );
    },
    [selected],
  );

  const startWalk = useCallback((id: string, path: WalkCell[]) => {
    if (path.length < 2) return;
    const tok = boardRef.current?.scene.tokens.find((t) => t.id === id);
    const start = tok ? { x: tok.x, y: tok.y, z: tok.z } : path[0];
    // The planner speaks in squares; the body may be authored off centre. One
    // short segment rejoins the lattice, and the distance clock keeps it short.
    const off = Math.abs(start.x - path[0].x) > 0.02 || Math.abs(start.z - path[0].z) > 0.02;
    const plan = planWalk(id, off ? [start, ...path] : path, performance.now());
    clearWalkTimer();
    walk.current = plan;
    walkTimer.current = window.setTimeout(() => {
      if (walk.current !== plan) return;
      walk.current = null;
      walkTimer.current = null;
      walkCommit.current(plan);
    }, Math.max(0, plan.endsAt - performance.now()) + 60);
    setWalking(true);
    setWalkSq(path.length - 1);
    setRoute(null);
    setWaypoints([]);
    setDrawing(false);
    hoverCell.current = '';
  }, [clearWalkTimer]);

  /** Take the plan that is drawn, not a hover that happens to be under the
   *  pointer when the button is pressed. */
  const commitRoute = () => {
    if (!selected || !waypoints.length) return;
    const path = planThrough(waypoints);
    if (!path || path.length < 2) {
      setNotice({ tone: 'err', text: 'No walkable route through that plan.' });
      return;
    }
    startWalk(selected, path);
  };

  // Where the body lands, written when the clock reaches the end. The room is
  // the session's copy, so this is a play-file write, never a document edit.
  walkCommit.current = (plan) => {
    const land = landing(plan);
    const tokenAt = tokenPositions(room);
    tokenAt[plan.id] = { at: land.at, facing: land.facing, y: land.y };
    writePlay(roomId, { tokenAt });
    setWalking(false);
    setWalkSq(0);
    // The walker was already selected to start the move. Selecting it again here
    // would steal the selection back if the table clicked another body mid-walk.
  };

  // A reload lands in the same environment. Written on switch, not on mount, so
  // a first visit is not immediately remembered as a choice the table made.
  useEffect(() => {
    if (roomId) rememberRoom(roomId);
  }, [roomId]);

  /** A door is a loading screen: persist this room, read the next one, and put
   *  the party on the floor beside the door they arrived at. */
  const goThroughDoor = (d: RoomDoor) => {
    if (!d.to) {
      setNotice({
        tone: 'err',
        text: d.state === 'locked' ? `${d.label ?? 'That door'} is locked.` : 'That door is not linked to another room yet.',
      });
      return;
    }
    const target = library.find((r) => r.id === d.to!.room) ?? listLibrary().find((r) => r.id === d.to!.room);
    if (!target) {
      setNotice({ tone: 'err', text: `That door leads to “${d.to.room}”, which is not in this library.` });
      return;
    }
    persistHere();
    const baseTarget = applyPlay(target.room, playFile[target.id]);
    const at = arrivalCell(baseTarget, d.to.door);
    if (!at) {
      setNotice({ tone: 'err', text: `${target.name} has no floor at door “${d.to.door}”.` });
      return;
    }
    const arrived = moveParty(baseTarget, at);
    writePlay(target.id, { tokenAt: tokenPositions(arrived) });
    setDraft(null);
    setTool('look');
    loaded.current = null;
    setRoomId(target.id);
    setNotice({ tone: 'ok', text: `Through to ${target.name}.` });
  };

  /* -------------------------------------------------------------- authoring */
  const applyTool = (x: number, z: number) => {
    const base = draft ?? room;
    const next: Room = JSON.parse(JSON.stringify(base));
    const cx = Math.floor(x);
    const cz = Math.floor(z);
    const { cols, rows } = next.grid;
    if (cx < 0 || cz < 0 || cx >= cols || cz >= rows) return;
    const i = cz * cols + cx;
    const cells = next.grid.cells;
    const ground = next.grid.ground ?? (next.grid.ground = new Uint8Array(cols * rows));

    if (tool === 'look') return;
    if (tool === 'floor') {
      cells[i] = 1;
      ground[i] = 0;
    } else if (tool === 'wall') {
      cells[i] = 2;
      ground[i] = 0;
    } else if (tool === 'erase') {
      cells[i] = 1;
      ground[i] = 0;
      next.props = next.props.filter((p) => !propCovers(p, cx, cz));
      next.doors = (next.doors ?? []).filter((d) => Math.round(d.at[0]) !== cx || Math.round(d.at[1]) !== cz);
    } else if (tool === 'door') {
      if (cells[i] === 0) {
        setNotice({ tone: 'err', text: 'A door needs a floor or a wall to stand in.' });
        return;
      }
      const taken = (next.doors ?? []).some((d) => Math.round(d.at[0]) === cx && Math.round(d.at[1]) === cz);
      if (!taken) {
        next.doors = [...(next.doors ?? []), { id: `door-${Date.now().toString(36)}`, at: [cx, cz], state: 'closed' }];
      }
    } else if (tool === 'prop') {
      if (cells[i] !== 1) {
        setNotice({ tone: 'err', text: 'Props stand on floor. Paint floor first.' });
        return;
      }
      next.props.push(makeProp(propRule, cx, cz));
    } else {
      const g = GROUND_TOOLS.find((t) => t.id === tool);
      if (!g) return;
      cells[i] = 1;
      ground[i] = ['stone', 'grass', 'dirt', 'water', 'wood'].indexOf(g.ground);
    }
    setDraft(next);
  };

  const setDoorLink = (doorId: string, toRoom: string, toDoor: string) => {
    const base = draft ?? room;
    const next: Room = JSON.parse(JSON.stringify(base));
    next.doors = (next.doors ?? []).map((d) => {
      if (d.id !== doorId) return d;
      const out: RoomDoor = { ...d };
      if (toRoom) out.to = { room: toRoom, door: toDoor };
      else delete out.to;
      return out;
    });
    setDraft(next);
  };

  const setTokenRef = (tokenId: string, ref: string) => {
    const next: Room = JSON.parse(JSON.stringify(draft ?? room));
    for (const t of next.tokens) {
      if (t.id !== tokenId) continue;
      if (ref) t.ref = ref;
      else delete t.ref;
    }
    setDraft(next);
  };

  const removeDoor = (doorId: string) => {
    const next: Room = JSON.parse(JSON.stringify(draft ?? room));
    next.doors = (next.doors ?? []).filter((d) => d.id !== doorId);
    setDraft(next);
  };

  const revealAll = () => {
    const all = new Uint8Array(room.grid.cols * room.grid.rows).fill(1);
    writePlay(roomId, { explored: encodeMask(all) });
    setFogOn(true);
  };

  const clearExplored = () => {
    writePlay(roomId, { explored: encodeMask(new Uint8Array(room.grid.cols * room.grid.rows)) });
  };

  /* ---------------------------------------------------------------- setup */
  // A new room brings its own rig, its own scale and its own places to stand.
  useEffect(() => {
    if (loaded.current === roomId) return;
    loaded.current = roomId;
    setDraft(null);
    setRig(JSON.parse(JSON.stringify(play?.rig ?? room.rig)));
    setMood(null);
    setPan({ x: 0, y: 0 });
    setNameDraft(entry?.name ?? '');
    clearWalkTimer();
    walk.current = null;
    setWalking(false);
    setWalkSq(0);
    setRoute(null);
    setWaypoints([]);
    setDrawing(false);
    hoverCell.current = '';
    // The party leads: the body a turn starts with is selected on arrival, so
    // the first click on the floor is a move and not a mystery.
    setSelected(room.tokens.find((t) => t.party)?.id ?? room.tokens[0]?.id ?? null);
    const v = entry?.doc.view;
    // 1x is fit: below it the board floats inside the panel with blank canvas
    // around it, which is never useful and is easy to mistake for a broken view.
    if (v) setCam({ yaw: v.yaw, pitch: v.pitch, zoom: Math.max(1, v.zoom) });
  }, [roomId, room, entry, play?.rig]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  // Navigating away mid-walk must not leave a timer holding the old room's
  // commit closure.
  useEffect(() => clearWalkTimer, [clearWalkTimer]);

  // Escape is the way out of a selection: with a body selected, a stray click
  // would walk it, so the board needs a plain "never mind". A plan is escaped
  // first — dropping the route is the smaller thing to lose.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (drawing || waypoints.length) {
        setDrawing(false);
        setWaypoints([]);
        setRoute(null);
        hoverCell.current = '';
        return;
      }
      setSelected(null);
      setRoute(null);
      hoverCell.current = '';
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawing, waypoints.length]);

  useEffect(() => {
    const b = new Board3D(room);
    boardRef.current = b;
    const refit = () => {
      const el = wrapRef.current;
      if (!el) return;
      const next = b.fitScale(el.clientWidth, el.clientHeight);
      if (Math.abs(next - fitRef.current) > 0.001) {
        fitRef.current = next;
        setFit(next);
      }
    };
    refit();
    paint();
    const observer = new ResizeObserver(() => {
      refit();
      paint();
    });
    if (wrapRef.current) observer.observe(wrapRef.current);
    return () => observer.disconnect();
  }, [paint, room]);

  // 1× means the room fits the panel, so a pan offset at that zoom is only
  // ever a way to lose the board. Zooming out to fit (or resetting) recentres,
  // which is the way back from a free pan; while zoomed in, pan is unlimited.
  useEffect(() => {
    if (cam.zoom === 1) setPan({ x: 0, y: 0 });
  }, [cam.zoom]);

  // rAF stops while the panel is backgrounded, and a camera change must still
  // land when it comes back: paint directly if the loop has gone quiet.
  useEffect(() => {
    if (performance.now() - lastPaint.current > 100) paint();
  }, [cam, pan, fit, paint]);

  /* ------------------------------------------------------------ animation */
  useEffect(() => {
    let raf = 0;
    let last = 0;
    let frames = 0;
    let fpsAt = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (live.current.tab === 'room') {
        // Idle, firelight is the only thing that moves and 30 Hz is plenty. A
        // walking body takes every frame the browser gives us, or the clock
        // would keep moving while the picture stutters.
        const moving = walk.current !== null;
        if (!moving && now - last < 26) return;
        last = now;
        paint();
        frames++;
        if (now - fpsAt > 1000) {
          setFps(Math.round((frames * 1000) / (now - fpsAt)));
          frames = 0;
          fpsAt = now;
        }
      }
      // Land the move after the final frame is drawn. Commit first and the next
      // paint would show the old position for a frame, which reads as a stumble
      // backwards at the end of every walk.
      const plan = walk.current;
      if (plan && now >= plan.endsAt) {
        walk.current = null;
        if (walkTimer.current !== null) {
          window.clearTimeout(walkTimer.current);
          walkTimer.current = null;
        }
        walkCommit.current(plan);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [paint]);

  /* ----------------------------------------------------------------- wheel */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0 && live.current.cam.zoom <= 1) {
        // Already at fit: the only useful thing zooming out can do is bring
        // the room back to the middle.
        setPan({ x: 0, y: 0 });
        return;
      }
      setCam((c) => ({ ...c, zoom: clamp(c.zoom * (e.deltaY > 0 ? 0.9 : 1.1), 1, 4) }));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [tab]);

  /* ----------------------------------------------------------------- sheet */
  useEffect(() => {
    if (tab !== 'sheet') return;
    const canvas = sheetRef.current;
    if (!canvas) return;
    const { w, h, col } = buildSheet(room);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const bytes = new Uint8ClampedArray(col.buffer, col.byteOffset, col.length * 4);
    ctx.putImageData(new ImageData(bytes, w, h), 0, 0);
    canvas.style.width = `${Math.min(w, 1100)}px`;
    canvas.style.height = `${(h * Math.min(w, 1100)) / w}px`;
  }, [tab, room]);

  /* ------------------------------------------------------------- controls */
  const applyMood = useCallback((id: string) => {
    const m = MOODS.find((x) => x.id === id);
    if (!m) return;
    setMood(id);
    setRig((r) => ({ ...r, ambient: m.rig.ambient, sun: { ...m.rig.sun } }));
  }, []);

  const addTorchAt = useCallback(
    (x: number, z: number, y: number) => {
      const b = boardRef.current;
      if (!b) return;
      // Colliders are real now: a torch cannot be placed inside a wall or a
      // table, because the scene knows where they are. The pick's height is the
      // surface under the cursor, so a torch on a gallery is tested against the
      // gallery and not against the ground beneath it.
      if (b.cellAt(x, z) !== 1 || b.solidAtCell(x, z, y)) {
        setNotice({ tone: 'err', text: 'A torch needs a clear patch of floor.' });
        return;
      }
      setRig((r) => ({
        ...r,
        points: [
          ...r.points,
          {
            // A timestamp, not the array length: torches are removable once the
            // room is a document, so two of them can share an index.
            id: `torch-${Date.now().toString(36)}`,
            x: x * CELL,
            y: z * CELL,
            radius: 3.6 * CELL,
            intensity: 1.5,
            flicker: 0.55,
          },
        ],
      }));
    },
    [],
  );

  /* --------------------------------------------------------------- library */
  const saveCurrent = useCallback(() => {
    if (!entry) return;
    const name = nameDraft.trim() || entry.name;
    // Saved in place, even for a built-in. A save shadows the shipped document
    // with the same id instead of forking it: every door link names a room id,
    // and a copy under a new id would break the graph it belongs to.
    const id = entry.id;
    const doc = toDoc(room, { id, name }, { rig, view: { yaw: cam.yaw, pitch: cam.pitch, zoom: cam.zoom } });
    const error = saveDoc(doc);
    if (error) {
      setNotice({ tone: 'err', text: error });
      return;
    }
    // The entry carries the saved rig, not the authored one, so reopening the
    // room puts the torches back where they were placed.
    const savedRoom: Room = { ...room, rig: JSON.parse(JSON.stringify(rig)) };
    const next: RoomEntry = { id, name, source: 'saved', doc, room: savedRoom, savedAt: Date.now() };
    setLibrary((lib) => {
      const i = lib.findIndex((r) => r.id === id);
      if (i < 0) return [...lib, next];
      const copy = lib.slice();
      copy[i] = next;
      return copy;
    });
    loaded.current = id;
    setDraft(null);
    setRoomId(id);
    setNotice({ tone: 'ok', text: `Saved “${name}” in this browser. It now shadows the shipped room of the same id.` });
  }, [cam.pitch, cam.yaw, cam.zoom, entry, nameDraft, rig, room]);

  const exportCurrent = useCallback(() => {
    if (!entry) return;
    const name = nameDraft.trim() || entry.name;
    const doc = toDoc(room, { id: entry.id, name }, { rig, view: { yaw: cam.yaw, pitch: cam.pitch, zoom: cam.zoom } });
    const blob = new Blob([docToJson(doc)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.id}.room.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setNotice({ tone: 'ok', text: `Exported ${doc.id}.room.json — the room is that file.` });
  }, [cam.pitch, cam.yaw, cam.zoom, entry, nameDraft, rig, room]);

  const importFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      let raw: unknown;
      try {
        raw = JSON.parse(await file.text());
      } catch {
        setNotice({ tone: 'err', text: `${file.name} is not JSON.` });
        return;
      }
      const res = parseRoomDoc(raw);
      if (res.status === 'bad') {
        const first = res.errors[0];
        setNotice({ tone: 'err', text: `${file.name}: ${first.path} ${first.message}` });
        return;
      }
      // An import arrives; it does not merge. A colliding id gets a fresh one.
      const taken = library.some((r) => r.id === res.doc.id);
      const id = taken ? newRoomId(res.doc.name) : res.doc.id;
      const doc = { ...res.doc, id };
      const error = saveDoc(doc);
      if (error) {
        setNotice({ tone: 'err', text: error });
        return;
      }
      setLibrary(listLibrary());
      loaded.current = null;
      setRoomId(id);
      const repairs = res.warnings.length;
      setNotice({
        tone: 'ok',
        text: repairs
          ? `Imported ${doc.name} with ${repairs} repair${repairs === 1 ? '' : 's'}.`
          : `Imported ${doc.name}.`,
      });
    },
    [library],
  );

  const removeCurrent = useCallback(() => {
    if (!entry || entry.source !== 'saved') return;
    if (!window.confirm(`Delete “${entry.name}” from this browser? An exported copy is not affected.`)) return;
    const at = library.findIndex((r) => r.id === entry.id);
    deleteSave(entry.id);
    const rest = listLibrary();
    setLibrary(rest);
    loaded.current = null;
    setRoomId(rest[Math.min(at, rest.length - 1)]?.id ?? '');
  }, [entry, library]);

  const drag = useRef<{ id: number; x: number; y: number; moved: boolean; mode: 'orbit' | 'pan' } | null>(null);
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Left orbits and right pans. A middle click is the browser's, not ours.
    if (e.button !== 0 && e.button !== 2) return;
    // A press always starts a new gesture. A stale drag can only survive here
    // if the previous release was lost outside the window, and refusing the
    // press is exactly the "sometimes it won't move" bug.
    drag.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      moved: false,
      mode: e.button === 2 || e.shiftKey ? 'pan' : 'orbit',
    };
    // Capture on the wrapper, which owns these handlers and is never re-created:
    // capturing on the canvas is how a release over the sidebar used to go missing.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // The pointer is already gone; the drag still ends on pointerup/cancel.
    }
  };
  /** While a body is selected, the floor under the pointer carries its route.
   *  The planner runs only when the pointer crosses a cell, not per event. */
  const updateHover = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const b = boardRef.current;
    if (!canvas || !b) return;
    if (tool !== 'look' || !selected || walk.current || drawing) {
      if (hoverCell.current) {
        hoverCell.current = '';
        setRoute(null);
      }
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const [bx, by] = b.frameAt(clientX - rect.left, clientY - rect.top);
    // A body under the pointer is a thing to select, not a place to stand.
    if (b.tokenAt(bx, by)) {
      if (hoverCell.current) {
        hoverCell.current = '';
        setRoute(null);
      }
      return;
    }
    const p = b.pickAt(bx, by);
    const key = p ? `${p.cell[0]},${p.cell[1]}` : '';
    if (key === hoverCell.current) return;
    hoverCell.current = key;
    setRoute(p ? pathTo(p.x, p.z) : null);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) {
      updateHover(e.clientX, e.clientY);
      return;
    }
    if (e.pointerId !== d.id) return;
    // A pointerup that never arrived (window blur, OS menu) leaves no buttons
    // down; drop the drag instead of orbiting on every later hover.
    if ((e.buttons & 3) === 0) {
      drag.current = null;
      return;
    }
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    if (!d.moved) return;
    d.x = e.clientX;
    d.y = e.clientY;
    if (d.mode === 'pan') {
      // The board follows the hand, with no artificial edge. Once the canvas
      // filled the panel there was nothing left to protect against: what a
      // free pan uncovers is the app's own background, not a transparent hole.
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    } else {
      setCam((c) => ({
        ...c,
        // Wrap, don't add 360: a fast flick can overshoot zero and a negative
        // yaw is not the same angle to the quarter-turn geometry.
        yaw: (((c.yaw + dx * 0.45) % 360) + 360) % 360,
        pitch: clamp(c.pitch - dy * 0.35, 20, 84),
      }));
    }
  };
  const endDrag = () => {
    drag.current = null;
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d || e.pointerId !== d.id) return;
    // Right-drag is a camera gesture only: it must never erase, place or light
    // anything, even when the hand barely moved.
    if (e.button !== 0) return;
    if (d.moved) return;

    const canvas = canvasRef.current;
    const b = boardRef.current;
    if (!canvas || !b) return;
    const rect = canvas.getBoundingClientRect();
    const [bx, by] = b.frameAt(e.clientX - rect.left, e.clientY - rect.top);

    if (tool === 'look') {
      // A body first: its card is taller than its cell, so clicking the head is
      // still a click on the body.
      const hit = b.tokenAt(bx, by);
      if (hit) {
        setSelected(hit);
        setWaypoints([]);
        setRoute(null);
        hoverCell.current = '';
        return;
      }
      // The depth buffer, not the floor plane: a click on a gallery has to
      // target the gallery.
      const p = b.pickAt(bx, by);
      if (!p) return;
      // Planning is clicks, not the shortest route to the last one: each click
      // appends a leg, and the whole plan is checked before it is kept.
      if (drawing) {
        if (!selected || walk.current) return;
        const [wx, wz] = p.cell;
        const last = waypoints[waypoints.length - 1];
        if (last && last[0] === wx && last[1] === wz) return;
        const next: [number, number][] = [...waypoints, [wx, wz]];
        const plan = planThrough(next);
        if (!plan || plan.length < 2) {
          setNotice({ tone: 'err', text: 'No walkable route to that cell. Another body, a wall or a drop is in the way.' });
          return;
        }
        setWaypoints(next);
        setRoute(plan);
        hoverCell.current = '';
        return;
      }
      // A door is a target in play mode and geometry in build mode. Clicking the
      // cell is the load; there is no walking animation across a threshold.
      const door = (room.doors ?? []).find(
        (dd) => Math.round(dd.at[0]) === p.cell[0] && Math.round(dd.at[1]) === p.cell[1],
      );
      if (door) {
        goThroughDoor(door);
        return;
      }
      if (!selected || walk.current) return;
      const path = pathTo(p.x, p.z);
      if (path && path.length > 1) {
        startWalk(selected, path);
      } else {
        setNotice({ tone: 'err', text: 'No walkable route to that cell.' });
      }
      return;
    }

    if (tool === 'torch') {
      const p = b.pickAt(bx, by);
      if (p) addTorchAt(p.x, p.z, p.y);
      return;
    }

    const [x, z] = b.worldAt(bx, by);
    applyTool(x, z);
  };

  const reset = () => {
    setCam({ yaw: 32, pitch: 55, zoom: 1 });
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="flex h-screen w-full flex-col bg-[#0a090e] text-neutral-200">
      <header className="flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs font-semibold tracking-wide text-amber-300">
            BATTLEMAP
          </span>
          <span className="text-xs text-neutral-400">a real 3D scene · depth buffer · colliders · storeys</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-neutral-400">{entry?.name ?? 'No room'}</span>
          <Button size="sm" variant={tab === 'room' ? 'secondary' : 'ghost'} onClick={() => setTab('room')}>
            Room
          </Button>
          <Button size="sm" variant={tab === 'sheet' ? 'secondary' : 'ghost'} onClick={() => setTab('sheet')}>
            Contact sheet
          </Button>
        </div>
      </header>

      {tab === 'room' ? (
        <>
          {/* Every environment in the library, one click away. The board is the
              same document format for a tavern, a village and a four-storey
              cavern, so switching is a load, not a different app. */}
          <nav
            aria-label="Environments"
            className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-white/10 bg-black/25 px-3 py-1.5"
          >
            <span className="mr-1 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Environments
            </span>
            {library.map((r) => {
              const active = r.id === entry?.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  title={r.source === 'saved' ? 'Saved in this browser' : 'Shipped room'}
                  onClick={() => switchRoom(r.id)}
                  className={
                    'shrink-0 rounded border px-2 py-0.5 text-[11px] leading-5 transition-colors ' +
                    (active
                      ? 'border-amber-400/45 bg-amber-400/15 text-amber-200'
                      : 'border-white/10 text-neutral-400 hover:border-white/25 hover:text-neutral-200')
                  }
                >
                  {r.name}
                  {r.source === 'saved' && (
                    <span className="ml-1 text-[9px] font-semibold uppercase tracking-wide text-emerald-400/80">
                      saved
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          <div className="flex min-h-0 flex-1">
          <div
            ref={wrapRef}
            className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={endDrag}
            onPointerLeave={() => {
              hoverCell.current = '';
              setRoute(null);
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <canvas ref={canvasRef} className="touch-none select-none" style={{ imageRendering: 'pixelated' }} />
            <div className="pointer-events-none absolute bottom-2 left-3 text-[11px] text-neutral-500">
              drag to orbit · right-drag or shift-drag to pan · scroll to zoom (fit recentres) · click a token to
              select · click a floor cell to walk · click a door to go through · {fps} fps ·{' '}
              {(fit * cam.zoom).toFixed(2)}×
            </div>
          </div>

          <aside className="w-72 shrink-0 space-y-5 overflow-y-auto border-l border-white/10 p-4 text-sm">
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Room</h3>
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Room name"
                spellCheck={false}
                className="h-8 w-full rounded-md border border-white/15 bg-transparent px-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-400/40"
              />
              <div className="grid grid-cols-4 gap-1">
                <Button size="sm" variant="outline" title="Save in this browser" aria-label="Save room in this browser" onClick={saveCurrent}>
                  <Save className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" title="Export .room.json" aria-label="Export room as JSON" onClick={exportCurrent}>
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  title="Import .room.json"
                  aria-label="Import a room JSON file"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  title="Delete this saved room"
                  aria-label="Delete this saved room"
                  disabled={entry?.source !== 'saved'}
                  onClick={removeCurrent}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={importFile}
              />
              {notice && (
                <p
                  className={
                    notice.tone === 'err'
                      ? 'text-[11px] leading-snug text-rose-400'
                      : 'text-[11px] leading-snug text-emerald-400'
                  }
                >
                  {notice.text}
                </p>
              )}
              <p className="text-[11px] leading-relaxed text-neutral-500">
                A room is a JSON document — terrain, props, tokens, lights and storeys. Saves live in this browser;
                export one to move it to another machine or hand it to a player.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                <Brush className="h-3 w-3" /> Build
              </h3>
              <div className="grid grid-cols-4 gap-1">
                <Button
                  size="sm"
                  variant={tool === 'look' ? 'secondary' : 'outline'}
                  onClick={() => setTool('look')}
                  title="Play: select a token and click the floor to walk, or click a door to go through"
                >
                  Look
                </Button>
                <Button
                  size="sm"
                  variant={tool === 'torch' ? 'secondary' : 'outline'}
                  onClick={() => setTool('torch')}
                  title="Place a torch light on the floor"
                >
                  <Flame className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant={tool === 'erase' ? 'secondary' : 'outline'}
                  onClick={() => setTool('erase')}
                  title="Remove props and doors, and put the floor back"
                >
                  <Eraser className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant={tool === 'door' ? 'secondary' : 'outline'}
                  onClick={() => setTool('door')}
                  title="Place a doorway on a floor or wall cell"
                >
                  <DoorOpen className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-[11px] text-neutral-500">Floor finish</p>
              <div className="grid grid-cols-5 gap-1">
                {GROUND_TOOLS.map((g) => (
                  <Button
                    key={g.id}
                    size="sm"
                    variant={tool === g.id ? 'secondary' : 'outline'}
                    className="px-0 text-[10px]"
                    onClick={() => setTool(g.id)}
                  >
                    {g.label}
                  </Button>
                ))}
              </div>
              <div className="flex gap-1">
                <select
                  value={propRule}
                  onChange={(e) => {
                    setPropRule(e.target.value as PropRule['rule']);
                    setTool('prop');
                  }}
                  className="h-8 min-w-0 flex-1 rounded-md border border-white/15 bg-[#14121a] px-1 text-xs"
                >
                  {PROP_CHOICES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant={tool === 'prop' ? 'secondary' : 'outline'}
                  onClick={() => setTool('prop')}
                >
                  Place
                </Button>
                <Button size="sm" variant="outline" title="Wall cell" onClick={() => setTool('wall')}>
                  Wall
                </Button>
              </div>
              {draft && (
                <div className="flex items-center gap-2 rounded border border-amber-400/30 bg-amber-400/5 p-2 text-[11px] text-amber-300">
                  <span className="flex-1">Unsaved map edits</span>
                  <Button size="sm" variant="ghost" className="h-6 px-1 text-[11px]" onClick={() => setDraft(null)}>
                    <Undo2 className="h-3 w-3" /> Revert
                  </Button>
                </div>
              )}
              <p className="text-[11px] leading-relaxed text-neutral-500">
                Click the board with a tool selected. Drag still orbits. Save writes the document.
              </p>
            </section>

            {(room.doors?.length ?? 0) > 0 && (
              <section className="space-y-2">
                <h3 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  <DoorOpen className="h-3 w-3" /> Doors
                </h3>
                {room.doors!.map((d) => {
                  const target = library.find((r) => r.id === d.to?.room);
                  return (
                    <div key={d.id} className="space-y-1 rounded border border-white/10 p-2">
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="flex-1 truncate text-neutral-300">{d.label ?? d.id}</span>
                        <span className="text-neutral-600">
                          {Math.round(d.at[0])},{Math.round(d.at[1])}
                        </span>
                        <button
                          className="text-neutral-500 hover:text-amber-300 disabled:opacity-30"
                          title={d.to ? 'Go through this door' : 'Not linked'}
                          disabled={!d.to}
                          onClick={() => goThroughDoor(d)}
                        >
                          <DoorOpen className="h-3 w-3" />
                        </button>
                        <button
                          className="text-neutral-500 hover:text-rose-400"
                          title="Remove door"
                          onClick={() => removeDoor(d.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <select
                        value={d.to?.room ?? ''}
                        onChange={(e) => {
                          const rid = e.target.value;
                          const next = rid ? library.find((r) => r.id === rid) : undefined;
                          setDoorLink(d.id, rid, next?.doc.doors?.[0]?.id ?? '');
                        }}
                        className="h-7 w-full rounded border border-white/15 bg-[#14121a] px-1 text-[11px]"
                      >
                        <option value="">Not linked</option>
                        {library
                          .filter((r) => r.id !== entry?.id)
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                      </select>
                      {target && (
                        <select
                          value={d.to?.door ?? ''}
                          onChange={(e) => setDoorLink(d.id, target.id, e.target.value)}
                          className="h-7 w-full rounded border border-white/15 bg-[#14121a] px-1 text-[11px]"
                        >
                          <option value="">Arrive at…</option>
                          {(target.doc.doors ?? []).map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.label ?? o.id}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })}
              </section>
            )}

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Tokens</h3>
              {room.tokens.map((t) => (
                <div
                  key={t.id}
                  className={
                    selected === t.id
                      ? 'flex items-center gap-1 rounded border border-amber-400/40 bg-amber-400/5 p-2'
                      : 'flex items-center gap-1 rounded border border-white/10 p-2'
                  }
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(t.id);
                      setWaypoints([]);
                      setRoute(null);
                    }}
                    title="Select this token"
                    className={
                      selected === t.id
                        ? 'w-16 shrink-0 truncate text-left text-[11px] font-semibold text-amber-200'
                        : 'w-16 shrink-0 truncate text-left text-[11px] text-neutral-300 hover:text-amber-200'
                    }
                  >
                    {t.spec.name}
                  </button>
                  <select
                    value={t.ref ?? ''}
                    onChange={(e) => setTokenRef(t.id, e.target.value)}
                    className="h-7 min-w-0 flex-1 rounded border border-white/15 bg-[#14121a] px-1 text-[11px]"
                  >
                    <option value="">Embedded copy</option>
                    {characters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <p className="text-[11px] leading-relaxed text-neutral-500">
                A linked token reads race, build, weapon and armour from the sheet every time the room loads.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                <Footprints className="h-3 w-3" /> Move
              </h3>
              {selected ? (
                <>
                  <div className="flex items-center gap-2 rounded border border-white/10 p-2 text-[11px]">
                    <span className="flex-1 truncate text-neutral-300">
                      {room.tokens.find((t) => t.id === selected)?.spec.name ?? selected}
                    </span>
                    <span className="tabular-nums text-neutral-500">
                      {walking
                        ? `walking · ${walkSq} sq`
                        : route && route.length > 1
                          ? `${route.length - 1} sq · ${(route.length - 1) * 5} ft`
                          : 'ready'}
                    </span>
                    <button
                      className="text-neutral-500 hover:text-amber-300"
                      title="Deselect (Esc)"
                      onClick={() => {
                        setSelected(null);
                        setRoute(null);
                      }}
                    >
                      <Undo2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={drawing ? 'secondary' : 'outline'}
                      className="h-7 flex-1 text-[11px]"
                      disabled={walking}
                      onClick={() => {
                        setDrawing((d) => !d);
                        setWaypoints([]);
                        setRoute(null);
                        hoverCell.current = '';
                      }}
                    >
                      {drawing ? 'Planning' : 'Plan route'}
                    </Button>
                    {drawing && waypoints.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px]"
                        onClick={() => {
                          const next = waypoints.slice(0, -1);
                          setWaypoints(next);
                          setRoute(next.length ? planThrough(next) : null);
                        }}
                      >
                        Undo
                      </Button>
                    )}
                    {drawing && (
                      <Button
                        size="sm"
                        className="h-7 flex-1 text-[11px]"
                        disabled={!waypoints.length}
                        onClick={commitRoute}
                      >
                        Walk
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed text-neutral-500">
                    {drawing
                      ? 'Click floor cells to add waypoints. Each leg is checked from the last one, and the whole route is walked as one move. Walk takes it; Undo removes the last click; Esc drops the plan.'
                      : 'Click a floor cell to walk there. The route is drawn before it is taken: it goes around walls and props, climbs stairs, and will not step off a drop.'}
                  </p>
                </>
              ) : (
                <p className="text-[11px] text-neutral-500">Click a token on the board to select it.</p>
              )}
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Mood</h3>
              <div className="grid grid-cols-2 gap-2">
                {MOODS.map((m) => (
                  <Button
                    key={m.id}
                    size="sm"
                    variant={mood === m.id ? 'secondary' : 'outline'}
                    className="justify-center"
                    onClick={() => applyMood(m.id)}
                  >
                    {m.label}
                  </Button>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <SliderRow
                label="Sun azimuth"
                value={rig.sun.azimuth}
                min={0}
                max={360}
                step={1}
                suffix="°"
                onChange={(v) => setRig((r) => ({ ...r, sun: { ...r.sun, azimuth: v } }))}
              />
              <SliderRow
                label="Sun elevation"
                value={rig.sun.elevation}
                min={-20}
                max={90}
                step={1}
                suffix="°"
                onChange={(v) => setRig((r) => ({ ...r, sun: { ...r.sun, elevation: v } }))}
              />
              <SliderRow
                label="Ambient"
                value={Math.round(rig.ambient * 100)}
                min={0}
                max={120}
                step={1}
                suffix="%"
                onChange={(v) => setRig((r) => ({ ...r, ambient: v / 100 }))}
              />
            </section>

            <section className="space-y-2">
              <h3 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                <Move3d className="h-3 w-3" /> Camera
              </h3>
              <SliderRow
                label="Orbit"
                value={Math.round(cam.yaw)}
                min={0}
                max={360}
                step={1}
                suffix="°"
                onChange={(v) => setCam((c) => ({ ...c, yaw: v }))}
              />
              <SliderRow
                label="Tilt"
                value={Math.round(cam.pitch)}
                min={20}
                max={84}
                step={1}
                suffix="°"
                onChange={(v) => setCam((c) => ({ ...c, pitch: v }))}
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setCam((c) => ({ ...c, zoom: Math.max(1, c.zoom - 0.25) }))}>
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setCam((c) => ({ ...c, zoom: Math.min(4, c.zoom + 0.25) }))}>
                  <ZoomIn className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" className="flex-1" title="Reset view" onClick={reset}>
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">View</h3>
              <Select value={view} onValueChange={(v) => setView(v as View)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODES.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowPath((p) => !p)}>
                  <Eye className="mr-1 h-3 w-3" /> {showPath ? 'Path on' : 'Path off'}
                </Button>
                <Button size="sm" variant={fogOn ? 'secondary' : 'outline'} onClick={() => setFogOn((f) => !f)}>
                  {fogOn ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setRig(JSON.parse(JSON.stringify(room.rig)));
                    setMood(null);
                  }}
                  title="Reset lights"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                {fogOn ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />} Fog of war
              </h3>
              <div className="grid grid-cols-2 gap-1">
                <Button size="sm" variant="outline" onClick={revealAll}>
                  Reveal all
                </Button>
                <Button size="sm" variant="outline" onClick={clearExplored}>
                  Forget
                </Button>
              </div>
              <p className="text-[11px] leading-relaxed text-neutral-500">
                Seen cells stay seen after the party leaves. A door saves this room before the next one loads.
              </p>
            </section>

            <section className="space-y-1 border-t border-white/10 pt-3 text-[11px] leading-relaxed text-neutral-500">
              <p className="flex items-center gap-1">
                <Flame className="h-3 w-3" /> {torches} placed torch{torches === 1 ? '' : 'es'}
              </p>
              <p>
                Orbit all the way round: a near wall is cut to a curb, and a cavern's near rock is cut away
                entirely, so the room stays legible from any angle.
              </p>
            </section>
          </aside>
          </div>
        </>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto p-4">
          <p className="mb-3 max-w-3xl text-xs leading-relaxed text-neutral-400">
            One 3D room, four suns — all four panels come from the same geometry, camera and light rig, with only the
            azimuth and elevation changed. If a panel's relief collapses, E2 fails; if the room stops reading as one
            place across the four, E1 fails.
          </p>
          <canvas ref={sheetRef} className="rounded border border-white/10" style={{ imageRendering: 'pixelated' }} />
        </div>
      )}
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-400">{label}</span>
        <span className="tabular-nums text-neutral-300">
          {value}
          {suffix}
        </span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}
