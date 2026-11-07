import { useCallback, useEffect, useRef, useState } from 'react';
import { Board3D, buildSheet } from '@/battlemap/gl/render';
import { MOODS, makeDemoRoom, type Room } from '@/battlemap/room';
import { makeCaveRoom } from '@/battlemap/cave';
import { LightRig } from '@/battlemap/light';
import { CELL } from '@/battlemap/paint';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RotateCcw, ZoomIn, ZoomOut, Flame, Eye, RefreshCw, Move3d } from 'lucide-react';

type View = 'lit' | 'depth' | 'materials';

const MODES: { id: View; label: string }[] = [
  { id: 'lit', label: 'Lit' },
  { id: 'depth', label: 'Depth' },
  { id: 'materials', label: 'Materials' },
];

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

const ROOMS: { id: string; label: string; make: () => Room }[] = [
  { id: 'tavern', label: 'Tavern', make: makeDemoRoom },
  { id: 'cavern', label: 'Cavern', make: makeCaveRoom },
];

export function BattleMapView() {
  const rooms = useRef<Record<string, Room>>(
    Object.fromEntries(ROOMS.map((r) => [r.id, r.make()])),
  ).current;
  const [roomId, setRoomId] = useState(ROOMS[0].id);
  const room = rooms[roomId];
  const boardRef = useRef<Board3D | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLCanvasElement | null>(null);
  const fitRef = useRef(1);

  const [tab, setTab] = useState<'room' | 'sheet'>('room');
  const [rig, setRig] = useState<LightRig>(() => JSON.parse(JSON.stringify(room.rig)));
  const [mood, setMood] = useState<string | null>('noon');
  const [cam, setCam] = useState({ yaw: 32, pitch: 55, zoom: 1 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [view, setView] = useState<View>('lit');
  const [showPath, setShowPath] = useState(true);
  const [torches, setTorches] = useState(0);
  const [fit, setFit] = useState(1);
  const [fps, setFps] = useState(0);

  // Latest values for the animation loop, without re-creating it.
  const live = useRef({ rig, view, showPath, cam, pan, tab });
  live.current = { rig, view, showPath, cam, pan, tab };

  /* ---------------------------------------------------------------- paint */
  // Stable identity: the animation loop restarts whenever this changes, and a
  // restart resets the frame clock. Reading `fit` from a ref keeps the loop
  // alive across the per-frame bounds changes an orbit produces.
  const paint = useCallback(() => {
    const b = boardRef.current;
    const canvas = canvasRef.current;
    const el = wrapRef.current;
    if (!b || !canvas || !el) return;
    const L = live.current;
    b.yaw = L.cam.yaw;
    b.pitch = L.cam.pitch;
    b.render(L.rig, {
      showPath: L.showPath,
      selectedToken: 'pc-1',
      time: performance.now() / 1000,
      // The ink sweep reads the depth buffer, which is only stale while the
      // camera is actually moving. Skipping it mid-drag buys back a fifth of
      // the frame; the pointer-up frame puts the lines back.
      outline: !drag.current?.moved,
    });
    if (L.view !== 'lit') b.debug(L.view);

    // The board's buffer changes shape as the camera orbits, so the fit is a
    // per-frame consequence of the projection rather than a one-time setup.
    const exact = Math.min(el.clientWidth / b.width, el.clientHeight / b.height);
    const next = exact >= 1 ? Math.floor(exact) : Math.max(0.2, exact);
    if (Math.abs(next - fitRef.current) > 0.001) {
      fitRef.current = next;
      setFit(next);
    }

    b.present(canvas, next * L.cam.zoom, L.pan.x, L.pan.y);
  }, []);

  /* ---------------------------------------------------------------- setup */
  // A new room brings its own rig, its own scale and its own places to stand.
  useEffect(() => {
    setRig(JSON.parse(JSON.stringify(room.rig)));
    setMood(null);
    setTorches(0);
    setPan({ x: 0, y: 0 });
  }, [room]);

  useEffect(() => {
    boardRef.current = new Board3D(room);
    paint();
    const observer = new ResizeObserver(() => paint());
    if (wrapRef.current) observer.observe(wrapRef.current);
    return () => observer.disconnect();
  }, [paint, room]);

  /* ------------------------------------------------------------ animation */
  useEffect(() => {
    let raf = 0;
    let last = 0;
    let frames = 0;
    let fpsAt = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (live.current.tab !== 'room') return;
      // Firelight is the only thing that moves between commits, and 30 Hz is
      // plenty for it.
      if (now - last < 26) return;
      last = now;
      paint();
      frames++;
      if (now - fpsAt > 1000) {
        setFps(Math.round((frames * 1000) / (now - fpsAt)));
        frames = 0;
        fpsAt = now;
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
      setCam((c) => ({ ...c, zoom: clamp(c.zoom * (e.deltaY > 0 ? 0.9 : 1.1), 0.4, 4) }));
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

  const addTorch = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      const b = boardRef.current;
      if (!canvas || !b) return;
      const rect = canvas.getBoundingClientRect();
      const scale = fitRef.current * live.current.cam.zoom;
      const bx = (clientX - rect.left + live.current.pan.x) / scale;
      const by = (clientY - rect.top + live.current.pan.y) / scale;
      const [x, z] = b.worldAt(bx, by);
      // Colliders are real now: a torch cannot be placed inside a wall or a
      // table, because the scene knows where they are.
      if (b.cellAt(x, z) !== 1 || b.solidAtCell(x, z)) return;
      setTorches((n) => n + 1);
      setRig((r) => ({
        ...r,
        points: [
          ...r.points,
          {
            id: `torch-${r.points.length}`,
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

  const drag = useRef<{ x: number; y: number; moved: boolean; mode: 'orbit' | 'pan' } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      moved: false,
      mode: e.button === 2 || e.shiftKey ? 'pan' : 'orbit',
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    if (!d.moved) return;
    drag.current = { x: e.clientX, y: e.clientY, moved: true, mode: d.mode };
    if (d.mode === 'pan') {
      setPan((p) => ({ x: p.x - dx, y: p.y - dy }));
    } else {
      setCam((c) => ({
        ...c,
        yaw: (c.yaw + dx * 0.45 + 360) % 360,
        pitch: clamp(c.pitch - dy * 0.35, 20, 84),
      }));
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) addTorch(e.clientX, e.clientY);
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
          <div className="flex items-center gap-1 rounded-md border border-white/10 p-0.5">
            {ROOMS.map((r) => (
              <Button
                key={r.id}
                size="sm"
                variant={roomId === r.id ? 'secondary' : 'ghost'}
                onClick={() => setRoomId(r.id)}
              >
                {r.label}
              </Button>
            ))}
          </div>
          <Button size="sm" variant={tab === 'room' ? 'secondary' : 'ghost'} onClick={() => setTab('room')}>
            Room
          </Button>
          <Button size="sm" variant={tab === 'sheet' ? 'secondary' : 'ghost'} onClick={() => setTab('sheet')}>
            Contact sheet
          </Button>
        </div>
      </header>

      {tab === 'room' ? (
        <div className="flex min-h-0 flex-1">
          <div
            ref={wrapRef}
            className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onContextMenu={(e) => e.preventDefault()}
          >
            <canvas ref={canvasRef} className="touch-none select-none" style={{ imageRendering: 'pixelated' }} />
            <div className="pointer-events-none absolute bottom-2 left-3 text-[11px] text-neutral-500">
              drag to orbit · shift-drag to pan · scroll to zoom · click the floor to place a torch · {fps} fps ·{' '}
              {(fit * cam.zoom).toFixed(2)}×
            </div>
          </div>

          <aside className="w-72 shrink-0 space-y-5 overflow-y-auto border-l border-white/10 p-4 text-sm">
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
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setCam((c) => ({ ...c, zoom: Math.max(0.4, c.zoom - 0.25) }))}>
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTorches(0);
                    setRig(JSON.parse(JSON.stringify(room.rig)));
                    setMood('noon');
                  }}
                  title="Reset lights"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
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
