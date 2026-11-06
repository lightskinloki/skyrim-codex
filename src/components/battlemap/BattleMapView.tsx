import { useCallback, useEffect, useRef, useState } from 'react';
import { BoardRenderer, DebugView, buildSheet } from '@/battlemap/renderer';
import { MOODS, makeDemoRoom } from '@/battlemap/room';
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
import { RotateCcw, RotateCw, ZoomIn, ZoomOut, Flame, Eye, RefreshCw } from 'lucide-react';

const MODES: { id: DebugView; label: string }[] = [
  { id: 'lit', label: 'Lit' },
  { id: 'normals', label: 'Normals' },
  { id: 'height', label: 'Height' },
  { id: 'spec', label: 'Specular' },
  { id: 'materials', label: 'Materials' },
];

export function BattleMapView() {
  const room = useRef(makeDemoRoom()).current;
  const rendererRef = useRef<BoardRenderer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLCanvasElement | null>(null);

  const [tab, setTab] = useState<'room' | 'sheet'>('room');
  const [rig, setRig] = useState<LightRig>(() => JSON.parse(JSON.stringify(room.rig)));
  const [mood, setMood] = useState('noon');
  const [angle, setAngle] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [view, setView] = useState<DebugView>('lit');
  const [showPath, setShowPath] = useState(true);
  const [torches, setTorches] = useState<{ x: number; y: number }[]>([]);
  const [fit, setFit] = useState(1);
  const [fps, setFps] = useState(0);

  // Latest values for the animation loop, without re-creating it.
  const live = useRef({ rig, view, showPath, angle, zoom, pan, fit, tab });
  live.current = { rig, view, showPath, angle, zoom, pan, fit, tab };

  /* ---------------------------------------------------------------- setup */
  useEffect(() => {
    const r = new BoardRenderer(room);
    rendererRef.current = r;

    // Paint one frame now rather than waiting for the loop's first tick. A tab
    // that is unfocused or throttled never runs requestAnimationFrame at all,
    // and a blank canvas is indistinguishable from a broken renderer.
    const paintOnce = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      r.render({ rig: room.rig, time: 0, showPath: true, selectedToken: 'pc-1' });
      r.present(canvas, 1, 0, 0, 0);
    };
    paintOnce();

    const observer = new ResizeObserver(() => {
      const el = wrapRef.current;
      if (!el) return;
      const q = ((live.current.angle % 4) + 4) % 4;
      const cw = q % 2 === 1 ? r.height : r.width;
      const ch = q % 2 === 1 ? r.width : r.height;
      // Integer scaling above 1 keeps the art crisp. Below 1 there is no integer
      // left, and overflowing the viewport would make a phone unusable — so the
      // overview zoom is fractional and lands on whole pixels only when it can.
      const exact = Math.min(el.clientWidth / cw, el.clientHeight / ch);
      const next = exact >= 1 ? Math.floor(exact) : Math.max(0.25, exact);
      setFit(next);
      // The observer can fire before the loop ever runs, so rescale here too.
      const canvas = canvasRef.current;
      if (canvas) r.present(canvas, next, live.current.angle, live.current.pan.x, live.current.pan.y);
    });
    if (wrapRef.current) observer.observe(wrapRef.current);
    return () => observer.disconnect();
  }, [room]);

  /* ------------------------------------------------------------ animation */
  useEffect(() => {
    let raf = 0;
    let last = 0;
    let frames = 0;
    let fpsAt = 0;
    const start = performance.now();

    // Nothing here needs 60 Hz: the only thing that moves between commits is
    // firelight. So the gate is whatever the machine can afford — 30 fps when
    // there is headroom, 15 when there is not — rather than a fixed 24 that a
    // slow phone would miss every frame anyway.
    let gate = 33;
    let cost = 16;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (live.current.tab !== 'room') return;
      if (now - last < gate) return;
      last = now;
      const r = rendererRef.current;
      const canvas = canvasRef.current;
      if (!r || !canvas) return;
      const t = (now - start) / 1000;
      const t0 = performance.now();
      r.render({ rig: live.current.rig, time: t, showPath: live.current.showPath, selectedToken: 'pc-1' });
      if (live.current.view !== 'lit') r.debug(live.current.view);
      const scale = live.current.fit * live.current.zoom;
      r.present(canvas, scale, live.current.angle, live.current.pan.x, live.current.pan.y);

      cost = cost * 0.85 + (performance.now() - t0) * 0.15;
      gate = cost > 30 ? 66 : cost < 18 ? 26 : 33;

      frames++;
      if (now - fpsAt > 1000) {
        setFps(Math.round((frames * 1000) / (now - fpsAt)));
        frames = 0;
        fpsAt = now;
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ---------------------------------------------------------------- sheet */
  useEffect(() => {
    if (tab !== 'sheet') return;
    const canvas = sheetRef.current;
    if (!canvas) return;
    const { w, h, col } = buildSheet(room.grid.seed);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const bytes = new Uint8ClampedArray(col.buffer, col.byteOffset, col.length * 4);
    ctx.putImageData(new ImageData(bytes, w, h), 0, 0);
    canvas.style.width = `${Math.min(w, 1000)}px`;
    canvas.style.height = `${(h * Math.min(w, 1000)) / w}px`;
  }, [tab, room.grid.seed]);

  /* ------------------------------------------------------------- controls */
  const applyMood = useCallback(
    (id: string) => {
      const m = MOODS.find((x) => x.id === id);
      if (!m) return;
      setMood(id);
      setRig((r) => ({ ...r, ambient: m.rig.ambient, sun: { ...m.rig.sun } }));
    },
    [],
  );

  const addTorch = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      const r = rendererRef.current;
      if (!canvas || !r) return;
      const rect = canvas.getBoundingClientRect();
      const q = ((angle % 4) + 4) % 4;
      const scale = fit * zoom;
      const cw = q % 2 === 1 ? r.height : r.width;
      const ch = q % 2 === 1 ? r.width : r.height;

      // Screen -> canvas CSS px -> transform space -> board space.
      let vx = (clientX - rect.left - (cw * scale) / 2 + pan.x) / scale;
      let vy = (clientY - rect.top - (ch * scale) / 2 + pan.y) / scale;
      const th = (q * Math.PI) / 2;
      const cos = Math.cos(-th);
      const sin = Math.sin(-th);
      const rx = vx * cos - vy * sin;
      const ry = vx * sin + vy * cos;
      const bx = rx + r.width / 2;
      const by = ry + r.height / 2;
      if (bx < 0 || by < 0 || bx > r.width || by > r.height) return;

      const cellX = Math.floor(bx / CELL);
      const cellY = Math.floor(by / CELL);
      const cell = room.grid.cells[cellY * room.grid.cols + cellX];
      if (cell !== 1) return;

      const point = { x: bx, y: by };
      setTorches((t) => [...t, point]);
      setRig((rg) => ({
        ...rg,
        points: [
          ...rg.points,
          { id: `torch-${rg.points.length}`, x: point.x, y: point.y, radius: 3.6 * CELL, intensity: 1.15, flicker: 0.55 },
        ],
      }));
    },
    [angle, fit, zoom, pan.x, pan.y, room.grid],
  );

  /* ----------------------------------------------------------------- drag */
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    if (d.moved) {
      drag.current = { x: e.clientX, y: e.clientY, moved: true };
      setPan((p) => ({ x: p.x - dx, y: p.y - dy }));
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) addTorch(e.clientX, e.clientY);
  };

  const reset = () => {
    setAngle(0);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="flex h-screen w-full flex-col bg-[#0a090e] text-neutral-200">
      <header className="flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs font-semibold tracking-wide text-amber-300">
            BATTLEMAP
          </span>
          <span className="text-xs text-neutral-400">the four-buffer renderer · E1 / E2 gate</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant={tab === 'room' ? 'secondary' : 'ghost'}
            onClick={() => setTab('room')}
          >
            Room
          </Button>
          <Button
            size="sm"
            variant={tab === 'sheet' ? 'secondary' : 'ghost'}
            onClick={() => setTab('sheet')}
          >
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
          >
            <canvas
              ref={canvasRef}
              className="touch-none select-none"
              style={{ imageRendering: 'pixelated' }}
            />
            <div className="pointer-events-none absolute bottom-2 left-3 text-[11px] text-neutral-500">
              drag to pan · click the floor to place a torch · {fps} fps · {fit * zoom}×
            </div>
          </div>

          <aside className="w-72 shrink-0 space-y-5 border-l border-white/10 p-4 text-sm">
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
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">View</h3>
              <Select value={view} onValueChange={(v) => setView(v as DebugView)}>
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
                    setTorches([]);
                    setRig(JSON.parse(JSON.stringify(room.rig)));
                    setMood('noon');
                  }}
                  title="Reset lights"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Camera</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setZoom((z) => Math.max(1, z - 1))}>
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setZoom((z) => Math.min(4, z + 1))}>
                  <ZoomIn className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setAngle((a) => a + 3)}>
                  <RotateCcw className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setAngle((a) => a + 1)}>
                  <RotateCw className="h-3 w-3" />
                </Button>
              </div>
              <Button size="sm" variant="ghost" className="w-full" onClick={reset}>
                Reset view
              </Button>
            </section>

            <section className="space-y-1 border-t border-white/10 pt-3 text-[11px] leading-relaxed text-neutral-500">
              <p className="flex items-center gap-1">
                <Flame className="h-3 w-3" /> {torches.length} placed torch{torches.length === 1 ? '' : 'es'}
              </p>
              <p>Sun sweep is the E2 gate: sweep elevation to 13° and the caps should rake.</p>
            </section>
          </aside>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto p-4">
          <p className="mb-3 max-w-3xl text-xs leading-relaxed text-neutral-400">
            Top: every material's ramp, nine steps each. Below: one field built from a{' '}
            <span className="text-neutral-200">single</span> floor tile with offset, flips and hashed decals,
            rendered at four sun azimuths. If the field reads as a pattern rather than as a floor, E1 fails; if
            the relief does not change across the four, E2 fails.
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
