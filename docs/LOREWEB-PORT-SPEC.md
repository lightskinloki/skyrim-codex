# LoreWebParser — Port Spec (parity-critical)

The blueprint (`implementation_plan.md`) describes `src/utils/LoreWebParser.ts` as a port
of the campaign's `_build_web.py`. **The blueprint's paraphrase is NOT sufficient for
parity.** Port from the real algorithm captured here. The verification plan's "Parser
Parity Test" must reproduce `web.json` exactly — these constants are why.

## Source of truth (sibling repo)
The campaign repo lives at `C:\Users\fbrown\Projects\Frogs-5-skyrim`. The implementer
must read these directly (or have them mounted via `FileSystemManager`):

| File | Path (note the root vs web/ split) | Role |
|---|---|---|
| Builder | `_build_web.py` (**repo ROOT**, not `web/`) | the algorithm to port |
| Registry | `web/registry.json` | `{ entities: [{ id, name, type, aliases[], tags[] }] }` |
| Annotations | `web/annotations.json` | `{ edges: [{ src, type, dst, why }], secrets: [...] }` |
| Viewer template | `web/viewer_template.html` | HTML shell; replace token `/*__DATA__*/` |
| Outputs | `web/web.json`, `web/web.html` | parser writes these |

> The earlier blueprint said `_build_web.py` lives in `web/`. It does not — it's at the
> repo root. `registry.json`, `annotations.json`, `viewer_template.html` ARE in `web/`.

## Corpus scan (must match exactly)
```
SCAN_DIRS  = ["Toryggs legacy", "Lore Books", "GM Guide", "campaign advice"]
SCAN_FILES = ["campaign_status_update.md", "Spell list", "Location Reference",
              "Gear, Consumables, and the forge", "players guide"]
SKIP_EXT   = {.rtf .docx .svg .py .json .html .png .jpg}
SKIP_DIRS  = {.git, web, __pycache__}
```
Walk SCAN_DIRS recursively (pruning SKIP_DIRS), skip files by extension, then add the
explicit SCAN_FILES. Relative paths use forward slashes.

## Alias matching (parity-critical)
- `CS_ALIASES = { "gear": "GEAR" }` — matched **case-SENSITIVELY** as `\bGEAR\b`.
- `NOISY = { "grant" }` — alias skipped entirely.
- All other aliases: `\b<escaped alias>\b` with IGNORECASE.
- Per (entity, file): count all matches → `mentions[eid][rel] += len(matches)`.
- First match per file → snippet = `text[max(0,i-90) : i+110]`, newlines→spaces, wrapped `"..." + s + "..."`.

## Inline `@web:` edges (parity-critical regex)
```
^\s*@web:\s*([\w-]+)\s*\|\s*([^|]+?)\s*\|\s*([\w-]+)\s*\|\s*(.+)$   (MULTILINE)
```
→ `{ src, type, dst, why(trimmed), from: relpath }`. Only kept if both `src` and `dst`
are known entity ids (else warn). Merge into `edges`, deduping on `(src, type, dst)`
against `annotations.json` edges.

## Co-occurrence
- For each file, all entities mentioned in it form pairs; `cooc[(a,b)] += min(countA, countB)`.
- Keep top **8** per node by weight (`per_node` → sorted desc → first 8 → `keep` set).
- `cooc_edges = [{ a, b, w }]` over the kept set.

## Candidates (the discovery engine — parity-critical)
```
GENERIC = {party, cart, location, concept, artifact, faction, villain, monster,
           clock, plague, daedra, aedra, riften, dead, child, witness}
authored = set of sorted (src,dst) over merged edges
tag_freq[t] = count of entities carrying tag t
for each unordered entity pair NOT in authored:
    shared = (tagsA & tagsB) - GENERIC
    w      = cooc.get(pair, 0)
    rarity = sum( 40.0 / max(tag_freq[t], 2)  for t in shared )
    score  = rarity + min(w, 30)
    keep if (shared non-empty) OR (w >= 12)
    → { a, b, sharedTags: sorted(shared), cooc: w, score: round(score,1) }
```
Then: **tagged candidates (sharedTags non-empty) are NEVER capped**; cooc-only candidates
(no shared tags) are capped at **40**. Final list = `sorted(tagged + cooc_only[:40], by -score)`.

## Output `web.json` shape
```
{ built, readme_for_ai, entities, edges, secrets,
  mentions: { eid: top-6 {rel:count} },
  snippets: { eid: top-3 {rel:snippet} },
  cooc:     sorted by -w,
  candidates }
```
`web.html` = `viewer_template.html` with `/*__DATA__*/` replaced by
`const DATA = <web.json>;`.

---

# Markdown marker grammar (the Forge / module parser)

The module-builder parser recognizes the campaign's existing session-sheet conventions.
**Canonical reference: `Frogs-5-skyrim/Toryggs legacy/SESSION SHEET FORMAT`** and
`_build_session_rtf.py` (the existing RTF builder using the same markers). Confirmed in
live module files (`honor hall orphanage`, `RUNSHEET - riften finale and gate 3 choice`,
`The Hound and the Wolf`, etc.). Markers:

- `>> READ ALOUD` — player-facing read-aloud block (blue box in Live Play).
- `GM:` — GM-only note line.
- `**Hard Guile (-4)**` (and `Easy / Standard / Very Hard / Nearly Impossible`) — checks;
  difficulty word + stat + penalty.
- `@web: src | type | dst | why` — authored edge (same as parser above; web self-builds).
- Scene dividers: `---` or `# Scene Title`.

The `_build_session_rtf.py` → `.rtf` pipeline is **legacy/offline fallback**; in-app
markdown authoring is the forward path. They share these markers, so they stay compatible.
Read `_build_session_rtf.py` for the exact helper semantics (scene/readaloud/handout/gm/
bullet/statcard/exit) before building the parser.
