import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { bustColourCount, renderBust } from '@/characters/bust';
import { renderBody } from '@/characters/body';
import {
  PRESETS,
  RACE_LABEL,
  type Beard,
  type Build,
  type CharacterSpec,
  type Cloth,
  type HairColour,
  type HairStyle,
  type Race,
  type SkinTone,
} from '@/characters/spec';
import { RACE_NOTE, RACE_SHAPE } from '@/characters/race';
import { loadRoster, newId, remove, upsert } from '@/characters/roster';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Facing } from '@/battlemap/room';

const RACES: Race[] = [
  'nord',
  'breton',
  'imperial',
  'redguard',
  'high-elf',
  'wood-elf',
  'dark-elf',
  'orc',
  'khajiit',
  'argonian',
];
const HAIRS: HairColour[] = ['grey', 'ginger', 'brown', 'black'];
const STYLES: HairStyle[] = ['bald', 'short', 'long', 'braid'];
const BEARDS: Beard[] = ['none', 'stubble', 'full', 'long'];
const TONES: SkinTone[] = ['deep', 'brown', 'tan', 'fair', 'pale'];
const BUILDS: Build[] = ['slim', 'average', 'burly'];
const TORSOS = ['tank', 'tunic', 'vest', 'plate'] as const;
const LEGS = ['trousers', 'skirt', 'greaves'] as const;
const CLOTHS: Cloth[] = ['grey', 'olive', 'wool', 'navy', 'leather', 'metal'];
const WEAPONS = ['none', 'hammer', 'sword', 'bow'] as const;

const FACING_LABEL = ['front', 'back', 'left', 'right'];

const NAMES = [
  'Alvar', 'Runa', 'Corvus', 'Sigrid', 'Drevis', 'Yrsa', 'Kjeld', 'Mira',
  'Torvald', 'Elske', 'Hadvar', 'Nilsine', 'Brandr', 'Astrid', 'Fenrir', 'Solveig',
];

function paint(canvas: HTMLCanvasElement | null, src: { w: number; h: number; col: Uint32Array }) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  if (canvas.width !== src.w) canvas.width = src.w;
  if (canvas.height !== src.h) canvas.height = src.h;
  const bytes = new Uint8ClampedArray(src.col.buffer, src.col.byteOffset, src.col.length * 4);
  ctx.putImageData(new ImageData(bytes, src.w, src.h), 0, 0);
}

const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];

function randomSpec(id: string): CharacterSpec {
  return {
    id,
    name: pick(NAMES),
    race: pick(RACES),
    build: pick(BUILDS),
    skinTone: pick(TONES),
    hair: pick(HAIRS),
    hairStyle: pick(STYLES),
    beard: pick(BEARDS),
    garment: {
      torso: pick(TORSOS),
      torsoCloth: pick(CLOTHS),
      legs: pick(LEGS),
      legsCloth: pick(CLOTHS),
    },
    weapon: pick(WEAPONS),
  };
}

export default function Characters() {
  const [spec, setSpec] = useState<CharacterSpec>(PRESETS[0]);
  const [roster, setRoster] = useState<CharacterSpec[]>(() => loadRoster());

  const bustRef = useRef<HTMLCanvasElement | null>(null);
  const bodyRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const rosterRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  const bust = useMemo(() => renderBust(spec), [spec]);
  const colours = useMemo(() => bustColourCount(spec), [spec]);
  const overBudget = colours > 32;

  useEffect(() => {
    paint(bustRef.current, bust);
  }, [bust]);

  useEffect(() => {
    for (let f = 0; f < 4; f++) paint(bodyRefs.current[f], renderBody(spec, f as Facing));
  }, [spec]);

  useEffect(() => {
    roster.forEach((s, i) => paint(rosterRefs.current[i], renderBody(s, 0)));
  }, [roster]);

  const set = (patch: Partial<CharacterSpec>) => setSpec((s) => ({ ...s, ...patch }));
  const setGarment = (patch: Partial<CharacterSpec['garment']>) =>
    setSpec((s) => ({ ...s, garment: { ...s.garment, ...patch } }));

  const onSave = () => {
    const named = { ...spec, name: spec.name.trim() || 'Unnamed' };
    setRoster(upsert(roster, named));
    setSpec(named);
    toast.success(`${named.name} saved to the roster`);
  };

  const onNew = () => {
    const next = randomSpec(newId());
    setSpec(next);
    toast(`${next.name} — ${RACE_LABEL[next.race]}`);
  };

  const onExport = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(spec, null, 2));
      toast.success('Spec copied — it is the whole character');
    } catch {
      toast.error('Clipboard is blocked in this tab');
    }
  };

  const shape = RACE_SHAPE[spec.race];

  return (
    <div className="min-h-screen bg-[#0a090e] text-neutral-200">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-white/10 bg-[#0a090e]/95 px-4 py-2 backdrop-blur">
        <Link to="/" className="text-xs text-neutral-500 underline decoration-dotted hover:text-primary">
          ← home
        </Link>
        <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs font-semibold tracking-wide text-amber-300">
          CHARACTER CREATOR
        </span>
        <span className="text-xs text-neutral-500">
          one spec · two renders · <span className={overBudget ? 'text-red-400' : 'text-neutral-400'}>{colours} colours</span>
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onNew}>
            New
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSpec({ ...randomSpec(spec.id) })}>
            Shuffle
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onExport}>
            Copy spec
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={onSave}>
            Save
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* Stage ------------------------------------------------------------ */}
        <section className="rounded-lg border border-white/10 bg-gradient-to-b from-[#171320] to-[#0d0b12] p-3">
          <div className="relative overflow-hidden rounded bg-[radial-gradient(ellipse_at_50%_30%,rgba(255,170,90,0.16),transparent_65%)]">
            <canvas
              ref={bustRef}
              className="mx-auto block"
              style={{ width: 352, height: 352, imageRendering: 'pixelated' }}
            />
          </div>

          <div className="mt-3 space-y-2">
            <Input
              value={spec.name}
              onChange={(e) => set({ name: e.target.value })}
              className="h-8 border-white/10 bg-black/30 text-sm"
              placeholder="Name"
              maxLength={28}
            />
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="text-neutral-400">
                {RACE_LABEL[spec.race]} · {spec.build} · {shape}
              </span>
              <span className="text-neutral-600">128 px</span>
            </div>
          </div>

          <p className="mt-3 border-t border-white/5 pt-2 text-[11px] leading-relaxed text-neutral-500">
            {RACE_NOTE[spec.race]}
          </p>
        </section>

        {/* Preview + roster -------------------------------------------------- */}
        <section className="flex min-w-0 flex-col gap-4">
          <div className="rounded-lg border border-white/10 bg-[#121017] p-3">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Token · 24 × 40 · four facings
              </h2>
              <span className="text-[11px] text-neutral-600">same spec</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3].map((f) => (
                <div key={f} className="rounded border border-white/10 bg-[#0b0a0f] p-2">
                  <canvas
                    ref={(el) => {
                      bodyRefs.current[f] = el;
                    }}
                    className="block"
                    style={{ width: 72, height: 120, imageRendering: 'pixelated' }}
                  />
                  <p className="mt-1 text-center text-[10px] uppercase tracking-wide text-neutral-600">
                    {FACING_LABEL[f]}
                  </p>
                </div>
              ))}
              <div className="flex flex-1 flex-col justify-center gap-1 rounded border border-dashed border-white/10 p-3">
                <p className="text-[11px] leading-relaxed text-neutral-400">
                  Both renders read the same object. Change the tunic and the portrait, the front, the back and the
                  silhouette all change at once — there is no second sprite to keep in sync.
                </p>

              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#121017] p-3">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Roster</h2>
              <span className="text-[11px] text-neutral-600">{roster.length} saved</span>
            </div>
            {roster.length === 0 ? (
              <p className="py-3 text-[11px] text-neutral-600">
                Nothing saved yet. Build someone and press Save — it stores the spec, not a sprite, so it costs about
                200 bytes.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {roster.map((s, i) => (
                  <div
                    key={s.id}
                    className={`group relative rounded border p-1 ${
                      s.id === spec.id ? 'border-amber-500/60 bg-amber-500/5' : 'border-white/10 bg-[#0b0a0f]'
                    }`}
                  >
                    <button
                      onClick={() => setSpec(s)}
                      className="block"
                      title={`Load ${s.name}`}
                    >
                      <canvas
                        ref={(el) => {
                          rosterRefs.current[i] = el;
                        }}
                        className="block"
                        style={{ width: 36, height: 60, imageRendering: 'pixelated' }}
                      />
                    </button>
                    <p className="mt-0.5 max-w-[64px] truncate text-center text-[9px] text-neutral-500">{s.name}</p>
                    <button
                      onClick={() => setRoster(remove(roster, s.id))}
                      className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500/80 text-[10px] text-white group-hover:flex"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-white/10 bg-[#121017] p-3">
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Presets</h2>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Chip key={p.id} active={p.id === spec.id} onClick={() => setSpec(p)}>
                  {p.name}
                </Chip>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Slots --------------------------------------------------------------- */}
      <div className="mx-auto max-w-7xl space-y-1.5 px-4 pb-16">
        <Group title="Identity">
          <Row label="Race">
            {RACES.map((r) => (
              <Chip key={r} active={spec.race === r} onClick={() => set({ race: r })}>
                {RACE_LABEL[r]}
              </Chip>
            ))}
          </Row>
          <Row label="Build">
            {BUILDS.map((b) => (
              <Chip key={b} active={spec.build === b} onClick={() => set({ build: b })}>
                {b}
              </Chip>
            ))}
          </Row>
          <Row label="Skin">
            {TONES.map((t) => (
              <Chip key={t} active={spec.skinTone === t} onClick={() => set({ skinTone: t })}>
                {t}
              </Chip>
            ))}
          </Row>
        </Group>

        <Group title="Face">
          <Row label="Hair">
            {HAIRS.map((h) => (
              <Chip key={h} active={spec.hair === h} onClick={() => set({ hair: h })}>
                {h}
              </Chip>
            ))}
          </Row>
          <Row label="Style">
            {STYLES.map((s) => (
              <Chip key={s} active={spec.hairStyle === s} onClick={() => set({ hairStyle: s })}>
                {s}
              </Chip>
            ))}
          </Row>
          <Row label="Beard">
            {BEARDS.map((b) => (
              <Chip key={b} active={spec.beard === b} onClick={() => set({ beard: b })}>
                {b}
              </Chip>
            ))}
          </Row>
        </Group>

        <Group title="Dress">
          <Row label="Torso">
            {TORSOS.map((t) => (
              <Chip key={t} active={spec.garment.torso === t} onClick={() => setGarment({ torso: t })}>
                {t}
              </Chip>
            ))}
          </Row>
          <Row label="Torso cloth">
            {CLOTHS.map((c) => (
              <Chip key={c} active={spec.garment.torsoCloth === c} onClick={() => setGarment({ torsoCloth: c })}>
                {c}
              </Chip>
            ))}
          </Row>
          <Row label="Legs">
            {LEGS.map((l) => (
              <Chip key={l} active={spec.garment.legs === l} onClick={() => setGarment({ legs: l })}>
                {l}
              </Chip>
            ))}
          </Row>
          <Row label="Legs cloth">
            {CLOTHS.map((c) => (
              <Chip key={c} active={spec.garment.legsCloth === c} onClick={() => setGarment({ legsCloth: c })}>
                {c}
              </Chip>
            ))}
          </Row>
        </Group>

        <Group title="Kit">
          <Row label="Weapon">
            {WEAPONS.map((w) => (
              <Chip key={w} active={spec.weapon === w} onClick={() => set({ weapon: w })}>
                {w}
              </Chip>
            ))}
          </Row>
        </Group>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#121017] p-3">
      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/70">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-24 shrink-0 text-[11px] uppercase tracking-wider text-neutral-500">{label}</span>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button
      size="sm"
      variant={active ? 'secondary' : 'ghost'}
      className={`h-7 rounded px-2 text-xs ${active ? 'ring-1 ring-amber-400/40' : 'text-neutral-400'}`}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
