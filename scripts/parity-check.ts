// Throwaway parity harness: run the TS LoreWebParser against the real campaign
// corpus and diff against the committed web/web.json (the Python output).
// Run: bun scripts/parity-check.ts
import * as fs from 'node:fs';
import * as path from 'node:path';
import { buildWeb, SCAN_DIRS, SCAN_FILES, SKIP_EXT, SKIP_DIRS } from '../src/utils/LoreWebParser';

// Point this at a campaign repo that has web/registry.json, web/annotations.json,
// and web/web.json (the Python-built reference). Override with FROGS_ROOT.
const ROOT = process.env.FROGS_ROOT || path.resolve(process.cwd(), '../Frogs-5-skyrim');
const read = (p: string) => fs.readFileSync(p, 'utf8');

function walk(dir: string, prefix: string, out: { relPath: string; text: string }[]) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      walk(full, `${prefix}/${name}`, out);
    } else {
      const dot = name.lastIndexOf('.');
      const ext = dot >= 0 ? name.slice(dot).toLowerCase() : '';
      if (SKIP_EXT.has(ext)) continue;
      out.push({ relPath: `${prefix}/${name}`, text: read(full) });
    }
  }
}
function gather() {
  const out: { relPath: string; text: string }[] = [];
  for (const d of SCAN_DIRS) {
    const base = path.join(ROOT, d);
    if (fs.existsSync(base) && fs.statSync(base).isDirectory()) walk(base, d, out);
  }
  for (const f of SCAN_FILES) {
    const p = path.join(ROOT, f);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) out.push({ relPath: f, text: read(p) });
  }
  return out;
}

const registry = JSON.parse(read(path.join(ROOT, 'web/registry.json'))).entities;
const annotations = JSON.parse(read(path.join(ROOT, 'web/annotations.json')));
const corpus = gather();
const mine = buildWeb(registry, annotations, corpus);
const py = JSON.parse(read(path.join(ROOT, 'web/web.json')));

console.log(`corpus files scanned: ${corpus.length}`);
console.log(`py built date: ${py.built}`);
const row = (label: string, a: number, b: number) =>
  console.log(`${a === b ? 'OK ' : 'XX '} ${label.padEnd(14)} TS=${a}  PY=${b}`);
row('entities', mine.entities.length, py.entities.length);
row('edges', mine.edges.length, py.edges.length);
row('cooc', mine.cooc.length, py.cooc.length);
row('candidates', mine.candidates.length, py.candidates.length);

// candidate-level parity (keyed by a|b), ignoring array order
const ck = (c: any) => `${c.a}|${c.b}`;
const myC = new Map(mine.candidates.map((c: any) => [ck(c), c]));
const pyC = new Map(py.candidates.map((c: any) => [ck(c), c]));
let scoreMismatch = 0, tagMismatch = 0, coocMismatch = 0, onlyPy = 0, onlyTs = 0;
for (const [k, p] of pyC) {
  const m = myC.get(k);
  if (!m) { onlyPy++; continue; }
  if (Math.abs(m.score - p.score) > 0.05) scoreMismatch++;
  if (m.cooc !== p.cooc) coocMismatch++;
  if (JSON.stringify(m.sharedTags) !== JSON.stringify(p.sharedTags)) tagMismatch++;
}
for (const k of myC.keys()) if (!pyC.has(k)) onlyTs++;
// Airtight scoring-logic proof: a score should ONLY differ when cooc differs.
// If this is 0, the scoring formula is identical and all deltas are input drift.
let scoreDiffWithSameCooc = 0;
for (const [k, p] of pyC) {
  const m = myC.get(k);
  if (m && m.cooc === p.cooc && Math.abs(m.score - p.score) > 0.05) scoreDiffWithSameCooc++;
}
console.log(`\n>>> score-differs-but-cooc-identical: ${scoreDiffWithSameCooc} (must be 0 for scoring parity)`);
console.log('\n--- candidate parity ---');
console.log(`matched pairs: ${[...pyC.keys()].filter((k) => myC.has(k)).length}`);
console.log(`only in PY: ${onlyPy}   only in TS: ${onlyTs}`);
console.log(`score mismatches: ${scoreMismatch}`);
console.log(`cooc mismatches:  ${coocMismatch}`);
console.log(`sharedTag mismatches: ${tagMismatch}`);

// cooc weight parity (keyed by a|b)
const wk = (e: any) => `${e.a}|${e.b}`;
const myW = new Map(mine.cooc.map((e: any) => [wk(e), e.w]));
const pyW = new Map(py.cooc.map((e: any) => [wk(e), e.w]));
let wMismatch = 0, wOnlyPy = 0, wOnlyTs = 0;
for (const [k, w] of pyW) { if (!myW.has(k)) wOnlyPy++; else if (myW.get(k) !== w) wMismatch++; }
for (const k of myW.keys()) if (!pyW.has(k)) wOnlyTs++;
console.log('\n--- cooc parity ---');
console.log(`weight mismatches: ${wMismatch}   only in PY: ${wOnlyPy}   only in TS: ${wOnlyTs}`);

// show a few sample mismatches for diagnosis
if (scoreMismatch || onlyPy || onlyTs) {
  console.log('\n--- sample candidate diffs (up to 8) ---');
  let shown = 0;
  for (const [k, p] of pyC) {
    const m = myC.get(k);
    if (!m) { console.log(`onlyPY ${k}  score=${p.score} tags=${JSON.stringify(p.sharedTags)}`); shown++; }
    else if (Math.abs(m.score - p.score) > 0.05) { console.log(`score  ${k}  TS=${m.score} PY=${p.score}`); shown++; }
    if (shown >= 8) break;
  }
}
