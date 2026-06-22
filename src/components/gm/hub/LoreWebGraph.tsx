// Force-directed lore web — a React/canvas port of web/viewer_template.html,
// restyled to the app's theme (dark slate + Skyrim gold, Inter/Cinzel). Physics
// are the same settle-and-freeze model; colours are read from the app's CSS
// variables so the graph always matches the theme. The display controls, legend,
// and web-management (build / change folder / unmount / unload) live in the
// card's "Controls" tab.
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Link2, Pin, Crosshair, RefreshCw, FolderOpen, FolderSync, Unplug, Trash2, Network,
} from "lucide-react";

export interface GraphDatum {
  entities: { id: string; name: string; type: string; tags: string[] }[];
  edges: { src: string; type: string; dst: string; why: string }[];
  cooc: { a: string; b: string; w: number }[];
  candidates: { a: string; b: string; sharedTags: string[]; cooc: number; score: number }[];
  mentions?: Record<string, Record<string, number>>;
  built?: string;
}

export interface WebManagement {
  supported: boolean;
  mountedName: string | null;
  building: boolean;
  onBuild: () => void;
  onChangeFolder: () => void;
  onUnmount: () => void;
  onUnload: () => void;
}

interface SimNode { id: string; name: string; type: string; tags: string[]; x: number; y: number; vx: number; vy: number; pinned: boolean; }

// Type → HSL triple. pc/villain track theme vars; the rest are harmonised jewel
// tones tuned for the dark slate background.
const TYPE_TRIPLE: Record<string, string> = {
  npc: "150 45% 62%", god: "265 60% 74%", daedra: "265 60% 74%", aedra: "275 55% 78%",
  artifact: "200 72% 64%", faction: "28 82% 62%", location: "210 22% 64%",
  concept: "250 52% 76%", monster: "350 58% 62%", clock: "190 60% 60%", secret: "320 50% 66%",
};
const PIN_KEY = "webpins";
const loadPins = (): Record<string, [number, number]> => {
  try { return JSON.parse(localStorage.getItem(PIN_KEY) || "{}"); } catch { return {}; }
};
const readVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const hsla = (triple: string, a: number) => { const [h, s, l] = triple.split(/\s+/); return `hsla(${h}, ${s}, ${l}, ${a})`; };

export function LoreWebGraph({ data, onAuthorEdge, management }: { data: GraphDatum; onAuthorEdge?: (a: string, b: string) => void; management?: WebManagement }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  const nodesRef = useRef<SimNode[]>([]);
  const niRef = useRef<Record<string, number>>({});
  const edgesRef = useRef<GraphDatum["edges"]>([]);
  const coocRef = useRef<GraphDatum["cooc"]>([]);
  const candRef = useRef<GraphDatum["candidates"]>([]);
  const degRef = useRef<Record<string, number>>({});
  const pinsRef = useRef<Record<string, [number, number]>>(loadPins());

  const cam = useRef({ x: 0, y: 0, z: 0.7 });
  const alpha = useRef(1);
  const W = useRef(0), H = useRef(0);
  const drag = useRef<SimNode | null>(null);
  const dragMoved = useRef(false);
  const panning = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const hover = useRef<SimNode | null>(null);
  const hoverEdge = useRef<GraphDatum["edges"][number] | null>(null);

  const [selId, setSelId] = useState<string | null>(null);
  const selRef = useRef<string | null>(null);
  const [tab, setTab] = useState("inspect");
  const [show, setShow] = useState({ cooc: true, cand: false, labels: true });
  const showRef = useRef(show);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const hiddenRef = useRef(hidden);
  useEffect(() => { showRef.current = show; }, [show]);
  useEffect(() => { hiddenRef.current = hidden; }, [hidden]);
  useEffect(() => { selRef.current = selId; }, [selId]);

  // theme-derived palette (read once; this app has a single static theme)
  const palette = useMemo(() => {
    const primary = readVar("--primary") || "45 93% 67%";
    const destructive = readVar("--destructive") || "0 84% 60%";
    const foreground = readVar("--foreground") || "45 29% 97%";
    const mutedFg = readVar("--muted-foreground") || "45 15% 70%";
    const nodeTriple = (t: string) => (t === "pc" ? primary : t === "villain" ? destructive : TYPE_TRIPLE[t] || mutedFg);
    return { primary, destructive, foreground, mutedFg, nodeTriple, nodeColor: (t: string) => `hsl(${nodeTriple(t)})` };
  }, []);
  const paletteRef = useRef(palette);
  useEffect(() => { paletteRef.current = palette; }, [palette]);

  const byId = useMemo(() => {
    const m: Record<string, GraphDatum["entities"][number]> = {};
    data.entities.forEach((e) => (m[e.id] = e));
    return m;
  }, [data.entities]);
  const typesPresent = useMemo(() => Array.from(new Set(data.entities.map((e) => e.type))).sort(), [data.entities]);

  // (re)build the simulation when data changes, preserving existing positions
  useEffect(() => {
    const prev = nodesRef.current;
    const prevById: Record<string, SimNode> = {};
    prev.forEach((n) => (prevById[n.id] = n));
    const pins = pinsRef.current;
    const N: SimNode[] = data.entities.map((e, i) => {
      const p = prevById[e.id];
      if (p) return { ...e, x: p.x, y: p.y, vx: p.vx, vy: p.vy, pinned: p.pinned };
      const base = { ...e, x: Math.cos(i * 2.4) * (120 + i * 3), y: Math.sin(i * 2.4) * (120 + i * 3), vx: 0, vy: 0, pinned: false };
      if (pins[e.id]) { base.x = pins[e.id][0]; base.y = pins[e.id][1]; base.pinned = true; }
      return base;
    });
    const NI: Record<string, number> = {};
    N.forEach((n, i) => (NI[n.id] = i));
    nodesRef.current = N; niRef.current = NI;
    edgesRef.current = data.edges.filter((e) => NI[e.src] != null && NI[e.dst] != null);
    coocRef.current = data.cooc.filter((e) => NI[e.a] != null && NI[e.b] != null);
    candRef.current = data.candidates.filter((e) => NI[e.a] != null && NI[e.b] != null);
    const deg: Record<string, number> = {};
    edgesRef.current.forEach((e) => { deg[e.src] = (deg[e.src] || 0) + 1; deg[e.dst] = (deg[e.dst] || 0) + 1; });
    degRef.current = deg;
    alpha.current = prev.length ? Math.max(alpha.current, 0.25) : 1;
  }, [data]);

  // animation loop + interaction (mounts once)
  useEffect(() => {
    const cv = canvasRef.current!, ctx = cv.getContext("2d")!;
    const wrap = wrapRef.current!;
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      W.current = wrap.clientWidth; H.current = wrap.clientHeight;
      cv.width = W.current * dpr; cv.height = H.current * dpr;
      cv.style.width = W.current + "px"; cv.style.height = H.current + "px";
    };
    const ro = new ResizeObserver(resize); ro.observe(wrap); resize();

    const world = (mx: number, my: number) => ({ x: (mx - W.current / 2) / cam.current.z - cam.current.x, y: (my - H.current / 2) / cam.current.z - cam.current.y });
    const visible = (n: SimNode) => !hiddenRef.current.has(n.type);
    const neighborhood = (id: string) => {
      const s = new Set([id]);
      edgesRef.current.forEach((e) => { if (e.src === id) s.add(e.dst); if (e.dst === id) s.add(e.src); });
      return s;
    };

    function step() {
      const N = nodesRef.current;
      if (alpha.current < 0.005) return;
      alpha.current *= 0.996;
      const NI = niRef.current;
      const L: [number, number, number, number][] = [];
      edgesRef.current.forEach((e) => L.push([NI[e.src], NI[e.dst], 110, 0.012]));
      if (showRef.current.cooc) coocRef.current.forEach((e) => L.push([NI[e.a], NI[e.b], 180, 0.0018 * Math.min(e.w, 20) / 10]));
      for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) {
        const a = N[i], b = N[j]; let dx = a.x - b.x, dy = a.y - b.y; const d2 = dx * dx + dy * dy + 40, f = 2600 / d2;
        dx *= f; dy *= f; a.vx += dx; a.vy += dy; b.vx -= dx; b.vy -= dy;
      }
      L.forEach(([i, j, len, k]) => {
        const a = N[i], b = N[j]; const dx = b.x - a.x, dy = b.y - a.y; const d = Math.sqrt(dx * dx + dy * dy) || 1, f = (d - len) * k;
        a.vx += dx / d * f; a.vy += dy / d * f; b.vx -= dx / d * f; b.vy -= dy / d * f;
      });
      N.forEach((n) => {
        n.vx *= 0.82; n.vy *= 0.82;
        if (n.pinned || n === drag.current) { n.vx = 0; n.vy = 0; return; }
        n.x += n.vx * alpha.current; n.y += n.vy * alpha.current;
      });
    }

    function draw() {
      const N = nodesRef.current, NI = niRef.current, deg = degRef.current, pal = paletteRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W.current, H.current); ctx.save();
      ctx.translate(W.current / 2, H.current / 2); ctx.scale(cam.current.z, cam.current.z); ctx.translate(cam.current.x, cam.current.y);
      const hi = selRef.current ? neighborhood(selRef.current) : null;

      if (showRef.current.cooc) {
        ctx.lineWidth = 0.6;
        coocRef.current.forEach((e) => {
          const a = N[NI[e.a]], b = N[NI[e.b]]; if (!visible(a) || !visible(b)) return;
          ctx.strokeStyle = hsla(pal.mutedFg, hi && !(hi.has(e.a) && hi.has(e.b)) ? 0.04 : 0.12);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        });
      }
      if (showRef.current.cand) {
        ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
        candRef.current.forEach((e) => {
          const a = N[NI[e.a]], b = N[NI[e.b]]; if (!visible(a) || !visible(b)) return;
          ctx.strokeStyle = hsla(pal.destructive, 0.45);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        });
        ctx.setLineDash([]);
      }
      edgesRef.current.forEach((e) => {
        const a = N[NI[e.src]], b = N[NI[e.dst]]; if (!visible(a) || !visible(b)) return;
        const on = !hi || (hi.has(e.src) && hi.has(e.dst));
        ctx.lineWidth = e === hoverEdge.current ? 2.6 : 1.4;
        ctx.strokeStyle = e === hoverEdge.current ? hsla(pal.primary, 0.95) : hsla(pal.primary, on ? 0.5 : 0.06);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });
      N.forEach((n) => {
        if (!visible(n)) return;
        const r = 5 + Math.min(deg[n.id] || 0, 12) * 0.9;
        const dimmed = hi && !hi.has(n.id);
        ctx.globalAlpha = dimmed ? 0.18 : 1;
        // soft glow
        ctx.shadowColor = pal.nodeColor(n.type); ctx.shadowBlur = n.id === selRef.current ? 16 : 6;
        ctx.fillStyle = pal.nodeColor(n.type);
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 7); ctx.fill();
        ctx.shadowBlur = 0;
        if (n.pinned) { ctx.strokeStyle = hsla(pal.primary, 0.85); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(n.x, n.y, r + 3, 0, 7); ctx.stroke(); }
        if (n.id === selRef.current || n === hover.current) { ctx.strokeStyle = hsla(pal.foreground, 0.95); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 7); ctx.stroke(); }
        if (showRef.current.labels && (n.type === "pc" || cam.current.z > 0.55 || n.id === selRef.current || n === hover.current || (deg[n.id] || 0) > 4)) {
          ctx.fillStyle = hsla(pal.foreground, dimmed ? 0.25 : 0.92);
          ctx.font = (n.type === "pc" ? "600 " : "") + "11px Inter, system-ui, sans-serif";
          ctx.fillText(n.name, n.x + r + 4, n.y + 4);
        }
        ctx.globalAlpha = 1;
      });
      ctx.restore();
    }

    const pick = (w: { x: number; y: number }) => {
      let best: SimNode | null = null, bd = 14;
      nodesRef.current.forEach((n) => { if (!visible(n)) return; const d = Math.hypot(n.x - w.x, n.y - w.y); if (d < bd) { bd = d; best = n; } });
      return best;
    };
    const nearestEdge = (w: { x: number; y: number }) => {
      const N = nodesRef.current, NI = niRef.current; let best: GraphDatum["edges"][number] | null = null, bd = 7 / cam.current.z;
      edgesRef.current.forEach((e) => {
        const a = N[NI[e.src]], b = N[NI[e.dst]]; if (!visible(a) || !visible(b)) return;
        const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1;
        let t = ((w.x - a.x) * dx + (w.y - a.y) * dy) / L2; t = Math.max(0.08, Math.min(0.92, t));
        const d = Math.hypot(w.x - (a.x + t * dx), w.y - (a.y + t * dy)); if (d < bd) { bd = d; best = e; }
      });
      return best;
    };

    const onDown = (ev: MouseEvent) => {
      const w = world(ev.offsetX, ev.offsetY); const n = pick(w);
      if (n) { drag.current = n; dragMoved.current = false; } else panning.current = true;
      last.current = { x: ev.offsetX, y: ev.offsetY };
    };
    const onMove = (ev: MouseEvent) => {
      const rect = cv.getBoundingClientRect();
      const ox = ev.clientX - rect.left, oy = ev.clientY - rect.top;
      const w = world(ox, oy);
      if (drag.current) {
        if (Math.abs(ox - last.current.x) > 3 || Math.abs(oy - last.current.y) > 3) dragMoved.current = true;
        if (dragMoved.current) { drag.current.x = w.x; drag.current.y = w.y; drag.current.vx = drag.current.vy = 0; alpha.current = Math.max(alpha.current, 0.35); }
      } else if (panning.current) {
        cam.current.x += (ox - last.current.x) / cam.current.z; cam.current.y += (oy - last.current.y) / cam.current.z;
        last.current = { x: ox, y: oy };
      } else {
        hover.current = pick(w);
        hoverEdge.current = hover.current ? null : nearestEdge(w);
        const tip = tipRef.current!;
        if (hoverEdge.current) {
          const e = hoverEdge.current;
          tip.innerHTML = `<b>${byId[e.src]?.name ?? e.src}</b> <i style="color:hsl(${paletteRef.current.primary})">${e.type}</i> <b>${byId[e.dst]?.name ?? e.dst}</b><br><span style="opacity:.7">${e.why}</span>`;
          tip.style.display = "block";
          tip.style.left = Math.min(ox + 16, W.current - 340) + "px";
          tip.style.top = oy + 14 + "px";
        } else tip.style.display = "none";
      }
    };
    const onUp = () => {
      if (drag.current) {
        if (dragMoved.current) {
          pinsRef.current[drag.current.id] = [Math.round(drag.current.x), Math.round(drag.current.y)];
          drag.current.pinned = true; localStorage.setItem(PIN_KEY, JSON.stringify(pinsRef.current)); alpha.current = Math.max(alpha.current, 0.35);
        } else {
          setSelId(drag.current.id); setTab("inspect");
        }
        drag.current = null;
      }
      panning.current = false;
    };
    const onWheel = (ev: WheelEvent) => { ev.preventDefault(); cam.current.z *= ev.deltaY < 0 ? 1.12 : 0.89; cam.current.z = Math.max(0.15, Math.min(4, cam.current.z)); };

    cv.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    cv.addEventListener("wheel", onWheel, { passive: false });

    const loop = () => { step(); draw(); raf = requestAnimationFrame(loop); };
    loop();
    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      cv.removeEventListener("mousedown", onDown); window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp); cv.removeEventListener("wheel", onWheel);
    };
  }, [byId]);

  function toggleType(t: string) {
    setHidden((prev) => { const next = new Set(prev); next.has(t) ? next.delete(t) : next.add(t); return next; });
  }
  function unpin(id: string) {
    delete pinsRef.current[id];
    const n = nodesRef.current.find((x) => x.id === id); if (n) n.pinned = false;
    localStorage.setItem(PIN_KEY, JSON.stringify(pinsRef.current));
    alpha.current = Math.max(alpha.current, 0.3); setSelId((s) => s);
  }
  function flyTo(id: string) {
    const n = nodesRef.current.find((x) => x.id === id); if (!n) return;
    cam.current.x = -n.x; cam.current.y = -n.y; if (cam.current.z < 0.9) cam.current.z = 0.9;
  }

  const sel = selId ? byId[selId] : null;
  const selEdges = selId ? edgesRef.current.filter((e) => e.src === selId || e.dst === selId) : [];
  const selCands = selId ? candRef.current.filter((c) => c.a === selId || c.b === selId) : [];
  const selMentions = selId && data.mentions ? data.mentions[selId] : undefined;
  const empty = data.entities.length === 0;

  return (
    <div className="flex flex-col lg:flex-row gap-3 h-[620px]">
      {/* Graph stage */}
      <div
        ref={wrapRef}
        className="relative flex-1 rounded-lg border border-border overflow-hidden min-h-[320px]"
        style={{ background: "radial-gradient(circle at 50% 35%, hsl(var(--card)), hsl(var(--background)))" }}
      >
        <canvas ref={canvasRef} className="block cursor-grab active:cursor-grabbing" />
        <div ref={tipRef} className="absolute hidden max-w-[340px] bg-popover/95 border border-primary/60 rounded-md px-3 py-2 text-xs text-popover-foreground pointer-events-none z-10 leading-snug shadow-lg" />
        {empty ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-3 px-6">
            <Network className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground max-w-sm">
              No web loaded. Mount your campaign folder and build it — entities become nodes, authored
              canon becomes gold links, and unauthored “loose threads” appear as red dashes you can adopt.
            </p>
            {management && (
              <Button size="sm" disabled={management.building} onClick={management.onBuild}>
                {management.building ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <FolderOpen className="h-4 w-4 mr-1" />}
                Mount folder & build
              </Button>
            )}
          </div>
        ) : (
          <div className="absolute right-3 top-3 text-[11px] text-muted-foreground/70 pointer-events-none">
            drag node = pin · scroll = zoom · drag bg = pan
          </div>
        )}
      </div>

      {/* Panel: Inspect / Controls */}
      <div className="w-full lg:w-80 shrink-0 rounded-lg border border-border bg-card flex flex-col">
        <Tabs value={tab} onValueChange={setTab} className="flex flex-col h-full min-h-0">
          <TabsList className="grid grid-cols-2 m-2 mb-0">
            <TabsTrigger value="inspect">Inspect</TabsTrigger>
            <TabsTrigger value="controls">Controls</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-3 min-h-0">
            <TabsContent value="inspect" className="mt-0">
              {!sel ? (
                <p className="text-sm text-muted-foreground">
                  Click a node to inspect it. Gold lines are authored canon; faint lines are co-occurrence;
                  red dashes (toggle in Controls) are unauthored connections you can adopt.
                </p>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-cinzel text-lg font-bold">{sel.name}</h4>
                      <Badge variant="outline" style={{ color: palette.nodeColor(sel.type), borderColor: palette.nodeColor(sel.type) }} className="text-xs">{sel.type}</Badge>
                    </div>
                    <div className="flex gap-1 mt-1">
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => flyTo(sel.id)}><Crosshair className="h-3 w-3 mr-1" /> Center</Button>
                      {nodesRef.current.find((n) => n.id === sel.id)?.pinned && (
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => unpin(sel.id)}><Pin className="h-3 w-3 mr-1" /> Unpin</Button>
                      )}
                    </div>
                  </div>
                  {sel.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">{sel.tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}</div>
                  )}
                  {selEdges.length > 0 && (
                    <div>
                      <h5 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Authored edges</h5>
                      <div className="space-y-1">
                        {selEdges.map((e, i) => (
                          <button key={i} className="w-full text-left text-xs border-l-2 border-primary/60 pl-2 py-1 hover:bg-accent/10 rounded-r"
                            onClick={() => { const other = e.src === sel.id ? e.dst : e.src; setSelId(other); flyTo(other); }}>
                            <span className="font-medium">{byId[e.src]?.name ?? e.src}</span> <span className="text-primary italic">{e.type}</span> <span className="font-medium">{byId[e.dst]?.name ?? e.dst}</span>
                            <span className="block text-muted-foreground">{e.why}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {selCands.length > 0 && (
                    <div>
                      <h5 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Loose threads</h5>
                      <div className="space-y-1">
                        {selCands.map((c, i) => {
                          const other = c.a === sel.id ? c.b : c.a;
                          return (
                            <div key={i} className="flex items-center gap-1 text-xs border-l-2 border-destructive/60 pl-2 py-1">
                              <span>{byId[other]?.name ?? other}</span>
                              {c.sharedTags.length > 0 && <span className="text-muted-foreground truncate">· {c.sharedTags.join(", ")}</span>}
                              {onAuthorEdge && (
                                <Button size="sm" variant="ghost" className="h-6 px-2 ml-auto text-xs" onClick={() => onAuthorEdge(c.a, c.b)}>
                                  <Link2 className="h-3 w-3 mr-1" /> Author
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {selMentions && (
                    <div>
                      <h5 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Where it lives</h5>
                      {Object.entries(selMentions).map(([f, c]) => <div key={f} className="text-[11px] text-muted-foreground">{f} ×{c}</div>)}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="controls" className="mt-0 space-y-5">
              {management && (
                <div className="space-y-2">
                  <h5 className="text-xs uppercase tracking-wide text-muted-foreground">Campaign folder</h5>
                  <div className="text-xs text-muted-foreground">
                    {management.mountedName ? <>Mounted: <span className="text-foreground font-medium">{management.mountedName}</span></> : "No folder mounted."}
                    {!management.supported && <div className="text-destructive mt-1">File access needs Chrome, Edge, or Opera.</div>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" disabled={management.building} onClick={management.onBuild}>
                      {management.building ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <FolderOpen className="h-4 w-4 mr-1" />}
                      {management.mountedName ? "Rebuild" : "Mount + Build"}
                    </Button>
                    <Button size="sm" variant="outline" disabled={management.building} onClick={management.onChangeFolder}>
                      <FolderSync className="h-4 w-4 mr-1" /> Change folder
                    </Button>
                    <Button size="sm" variant="outline" disabled={!management.mountedName} onClick={management.onUnmount}>
                      <Unplug className="h-4 w-4 mr-1" /> Unmount
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={management.onUnload}>
                      <Trash2 className="h-4 w-4 mr-1" /> Unload web
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h5 className="text-xs uppercase tracking-wide text-muted-foreground">Display</h5>
                {([["cooc", "Co-occurrence lines"], ["cand", "Candidate links"], ["labels", "Labels"]] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between text-sm cursor-pointer">
                    <span>{label}</span>
                    <Switch checked={show[key]} onCheckedChange={(v) => setShow((s) => ({ ...s, [key]: v }))} />
                  </label>
                ))}
              </div>

              {typesPresent.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs uppercase tracking-wide text-muted-foreground">Legend — click to filter</h5>
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                    {typesPresent.map((t) => (
                      <button key={t} onClick={() => toggleType(t)} className={`flex items-center gap-1.5 text-xs ${hidden.has(t) ? "opacity-30 line-through" : ""}`}>
                        <i className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: palette.nodeColor(t) }} />{t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
