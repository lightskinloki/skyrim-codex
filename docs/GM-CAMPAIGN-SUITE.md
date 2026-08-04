# GM Campaign Suite — Design Doc (living)

Internal architecture/decisions doc for turning GM mode from a combat tracker into a
**bespoke campaign-management suite**. Not user-facing; this is where we record the
architecture and the decisions as we make them.

Status: **PLANNING → IMPLEMENTATION READY** (June 2026). Grounded against the current codebase.

---

## 0. Doc hierarchy (read first)

Three planning documents; each answers a different question:

| Doc | Location | Answers |
|---|---|---|
| **Product Vision** (`app-integration-plan.txt`) | `Frogs-5-skyrim/web/` | *Why* we're building this; monetization, Electron roadmap, DLC, networking scope, AI flywheel |
| **This doc** (`GM-CAMPAIGN-SUITE.md`) | `skyrim-codex/docs/` | *What* the campaign suite is architecturally; decisions, principles, schema, build order |
| **Blueprint** (`implementation_plan.md`) | `skyrim-codex/docs/` | *How* to build it; concrete files, TS types, component tree, verification plan |

`app-integration-plan.txt` is **upstream / parent** — don't contradict it, inherit its principles
(Mirror, Privacy-by-Architecture, System-Agnostic, Schema-versioning). The blueprint
(`implementation_plan.md`) operationalizes **this** doc; if they conflict, fix the blueprint.

---

## 1. The north star

Two visions from the README govern everything:

> **Player:** sit down for the first time and play a whole campaign using only the app,
> never opening a rulebook.
> **GM:** the GM's only job at the table is to decide *what happens*; the app handles
> everything else.

The player side already delivers its half (character manager + Combat Portal that
surfaces the right actions, linked to what's possible, right when needed). **The GM
side is the missing half.** This suite is the GM's equivalent of the Combat Portal:
surface *what's happening in this scene right now*, linked to *everything the GM might
reach for* — read-aloud, findable items, NPC lines, rolls, enemy stat blocks — one
action away, so the app disappears and the story breathes.

The product test: **a GM looks at this and pays for it because of how much easier it
makes running sessions.**

---

## 2. The core idea: the interactive runsheet

The GM uploads or builds an adventure module / runsheet; the app runs it.

- A **session timeline** the GM steps through (where am I in the session).
- At each beat, the dashboard shows the **scene**: its read-aloud front and center,
  the **findable items** (clickable → each shows its own read-aloud/detail), the
  **NPC beats** (clickable → lines + reaction branches), the **possible checks**
  (as difficulties), the **enemies** (clickable → launch into the existing combat
  tracker), and the **exits** to the next scene(s).
- A **prep/authoring tool** to build modules *inside the app* — and the act of
  authoring **creates the nodes, links, and tags as a byproduct.**

### The killer feature: the web that builds itself
The lore/connection web is **not** something the GM authors directly (unlike Obsidian).
It is **generated as exhaust of using the convenience tool.** Build a scene, drop in an
NPC, link an enemy, mark a findable → the graph of tagged, linked nodes grows on its
own. This creates a virtuous loop: **the more you use the app, the easier the app is to
use** (more is linked, more surfaces automatically, less friction) → the more you want
to use it. That loop is the selling point, and the long-term moat.

This is Phase 5 + 5.5 in the product roadmap. Phase 6 (Electron) will wrap it; the
web/browser File System Access API is the correct bridge until then.

---

## 3. The one primitive: the tagged, linked node

Everything reference-shaped is the same shape: a node with `name`, `type`, `tags`,
`content/payload`, and `edges` (links to other nodes). The app's separate features then
become **views over one graph**:

| Feature | = |
|---|---|
| Compendium | the **core** nodes |
| Lore Web | **campaign** nodes + the edges between them |
| Campaign upload | importing campaign nodes (+ edges) |
| Custom encounters | campaign nodes that **link to** core enemy nodes |
| Keyword surfacing | searching the tag/name index across **all** nodes |
| Graph view | a visualization of the edges |
| Interactive runsheet | the node graph **walked along a timeline** |

So "the web" stops being a feature and becomes the **connective tissue** of the app.

---

## 4. Two scopes, one model

- **CORE (at source):** universal rules — spells, perks, enemies, conditions, action
  economy. Ships with the app, read-only, identical for every campaign. The "never
  check a rule" half (the rulebook, in-app).
- **CAMPAIGN (local/uploaded):** *this* world — NPCs, lore, locations, scenes, modules,
  custom encounters, the edges. Lives in the campaign file (localStorage + import/export,
  same pattern Characters already use → fits Privacy-by-Design). The "never leave the app
  for world info" half.
- **Edges cross the line:** a campaign NPC node links to a core spell node
  ("Ismara → knows → Frostbite"); a custom encounter (campaign) pulls in core enemy
  stat blocks. Two separately-sourced layers, one interlinked graph. To the GM at the
  table it's one surface — type a name, the right card appears, rule or lore.

---

## 5. Grounded against the current codebase

What exists today (read June 2026):

- **Core content = flat typed arrays in `src/data/`** (`enemyTemplates: EnemyTemplate[]`,
  plus spells, skills, equipment, races, standing stones). `EnemyTemplate` = id, name,
  category, hp/fp/dr, stats, attacks, abilities, isBoss. **No tags, no edges yet.**
- **GM mode is combat-only.** `src/components/gm/GMDashboard.tsx` = combat tracker +
  `EnemyManager` + `EffectApplicator` + `InitiativeEditor` + `CombatLog`.
- **A `template → instance` pattern already exists:** `EnemyTemplate` (reusable) spawns
  a `Combatant` (`src/types/combat.ts`; `characterId?` links a combatant back to a saved
  PC). We **reuse this** for scene→play.
- **Everything is local state** (useState; characters persist via localStorage +
  import/export). No backend. Privacy-by-Design is already real.

### Design implications (so we build WITH the grain)
1. **Do not rewrite the rules data.** Keep `src/data` as-is (core, read-only). Add a
   **thin index layer** on top: `node = { id, type, name, tags, payloadRef }`; core
   content is *indexed*, campaign content is *authored*. Edges use the proven `web.json`
   shape (`{ src, type, dst, why }`).
2. **Campaign store** = a new local store (localStorage + import/export, mirroring the
   character store) holding campaign nodes (NPCs, lore, scenes, modules, encounters) +
   edges + tags.
3. **Scene-node = the session-sheet format, as data** (see §6). A **module = an ordered,
   branching graph of scene-nodes** = the timeline.
4. **Prep tool** authors scenes/nodes/links → the web builds itself.
5. **Play dashboard** walks the timeline; the existing combat `GMDashboard` becomes a
   **sub-view launched from a scene's enemy node** (the `EnemyTemplate → Combatant` path
   already exists — we trigger it from the runsheet instead of the standalone manager).

---

## 6. The scene-node schema

The campaign's session-sheet format specifies what a beat contains; that *is* the schema.
The blueprint's `SceneNode` interface (`src/types/campaign.ts`) is the concrete TS
implementation. Key decisions baked in here:

```
Scene {
  id, moduleId, title
  type: "set-piece" | "character" | "social" | "combat"
  readAloud: string[]            // player-facing moment (blue block); array = paragraphs
  gmNotes: string[]              // GM-only truth/adjudication
  findables: NodeRef[]           // items/clues; each resolves to a full node with its OWN readAloud
  npcBeats: NodeRef[]            // NPC nodes; each carries lines + reaction branches
  checks: Check[]                // difficulty-only (Standard / Hard -4 / etc.), never fixed TN
  enemies: string[]              // EnemyTemplate IDs → launch combat (reuse existing tracker)
  exits: ExitLink[]              // links to next scene(s); supports branches
  tags: string[]
}
```

**Design decision — NPCs and findables as graph nodes (not inline-only):**
Scene NPCs and findables are `NodeRef[]` (references), not raw inline strings. Each NPC
and findable has its own full node in the campaign graph (name, description, dialogue,
reaction branches, its own read-aloud). The scene *links to* those nodes; clicking an NPC
card in Live Play slides out the full node card. This is what makes the graph self-build:
authoring a scene edge to an NPC node IS the lore web edge.

Inline `npcs: { name, line?, reactions? }[]` (as in the blueprint's `SceneNode`) is the
**serialized form** — the data shape for the parser. At runtime, names resolve against the
campaign node index to surface the full card. Both are true simultaneously.

**Design decision — markdown-first authoring replaces the python→RTF pipeline:**
The prep tool authors in markdown (the Forge). The app parses markdown → `SceneNode[]`
(the blueprint's Preflight compile). The **session-sheet conventions carry over** as
markdown markers: `>> READ ALOUD` blocks, `GM:` notes, `**Hard Guile (-4)**` checks,
`@web: src | type | dst | why` edge declarations. The `.rtf` output from
`_build_session_rtf.py` is **legacy/fallback** (still works for offline WordPad use),
but in-app authoring is the forward path. The two pipelines share the same marker
conventions — they are compatible, not competing.

Authoring a scene in the Forge = creating the Scene node + NodeRef edges to NPCs/items/enemies + tags. That authoring act is the web-building byproduct.

---

## 7. File System Access API (bridge to Electron)

**Decision:** Use the Web File System Access API (`showDirectoryPicker()`) for the
web/dev phase. The GM mounts the `Frogs-5-skyrim` campaign folder once per session;
the app gets read/write access to `.md` files, `web/registry.json`,
`web/annotations.json`, `web/web.json`.

This is:
- Correct for Phase 5/5.5 (browser app)
- Consistent with Privacy-by-Architecture (no server, files stay local)
- A natural migration path: when Phase 6 wraps in Electron, replace
  `showDirectoryPicker()` with Node.js `fs` — same `FileSystemManager` interface, swap
  the implementation

`LoreWebParser.ts` ports `_build_web.py` to TypeScript, running in-browser. This gives
100% parity with the existing python pipeline and means the Forge can live-preview the
web graph as the GM authors.

---

## 8. The 4-pillar dashboard

The blueprint's 4-pillar structure directly implements the interactive runsheet vision:

| Pillar | Component | Role |
|---|---|---|
| **Hub** | `CampaignHub.tsx` | Active clocks, party status, lore web force-graph |
| **Forge** | `ModuleBuilder.tsx` | Markdown editor + live parser + candidate linker (web builds here) |
| **Live Play** | `LivePlay.tsx` | Timeline nav → scene dashboard → launch combat |
| **Archives** | `UniversalCompendium.tsx` | Ctrl+K search across all nodes (core + campaign) |

The existing `GMDashboard.tsx` combat tracker becomes the **combat sub-view** launched
from Live Play's "Deploy Encounter" button. It is not replaced; it is wrapped.

---

## 9. Principles this must honor

- **Mirror Principle:** the whole suite is **non-AI and excellent on its own.** The prep
  tool, the runsheet dashboard, the compendium, the self-building web — all work with zero
  AI. AI (Phase 7) can later *help draft* a read-aloud or surface keywords, never the
  foundation.
- **Privacy-by-Architecture:** campaign data lives on-device (localStorage + export/import
  + mounted local folder). Nothing leaves the machine.
- **Schema versioning:** version every persisted shape (node, edge, scene, module,
  campaign-file) from day one — Phase 6 (Electron), Phase 7 (AI), Phase 9 (DLC ingestion)
  all consume these. Version fields freeze at v1 before anything ships.
- **System-agnostic core:** FROGS 5 / Skyrim is reference content, not hardcoded
  assumptions in the suite's structure (long-term IP plan per the product vision).

---

## 10. Open questions (remaining)

- [ ] **Node/edge index shape:** exact `{ id, type, name, tags, payloadRef }` node shape;
      how `src/data` core content gets indexed at build time (static generation script?).
- [ ] **Edge type vocab:** controlled enum vs. free strings. Campaign currently uses free
      strings (`web.json`); app may want a controlled set for filtering.
- [ ] **Campaign file format:** single JSON blob vs. folder of files; relationship to
      existing character exports; can the campaign's `web.json` import as a seed graph?
- [ ] **Preflight linter rules:** what exactly triggers a warning (missing exit,
      unresolved alias, non-standard difficulty keyword).
- [ ] **Pins persistence:** blueprint proposes localStorage for graph pin positions
      (mirroring `webpins`); confirm this survives the Electron migration.

---

## 11. Build order

1. **`src/types/campaign.ts`** — freeze the schema (SceneNode, CampaignModule, CampaignState,
   clocks, beats, exits). This unblocks everything else.
2. **`src/utils/FileSystemManager.ts`** — mount + read/write. Verify against the live
   `Frogs-5-skyrim` folder.
3. **`src/utils/LoreWebParser.ts`** — port `_build_web.py`. Verify parity against
   python-generated `web.json`.
4. **4-pillar `GMDashboard` shell** — tabs only, no content yet; existing combat tracker
   moves into the Live Play tab's combat sub-view.
5. **`UniversalCompendium`** (Archives) — first concrete slice of the node model: index
   existing `src/data` arrays, add Ctrl+K search. Delivers immediate value.
6. **`CampaignHub`** — clocks, party status, lore web canvas.
7. **`ModuleBuilder`** (Forge) — markdown editor + live parser + candidate panel.
   **This is where the web-builds-itself loop goes live.**
8. **`LivePlay`** — timeline + scene dashboard + Deploy Encounter → combat.
9. Phase 6: Electron wrap (swap `FileSystemManager` internals, keep interface).

---

## 12. Product onboarding — entities without JSON (the front door)

**The gap:** the current lore-web build relies on a hand-authored `registry.json`
(entities + aliases + tags) and `annotations.json` (edges). That is a *coder's*
artifact. A non-technical GM will never write JSON — if they start fresh they hit
"No entities to map," and the web is empty. The registry/annotations files must be
demoted to a **power-user / migration path and an export**, never a prerequisite.

**The reframe:** the app *owns* the entity graph (the campaign store); notes are
optional *input*. A GM acquires a rich web through two doors, neither involving JSON:

### Door A — author in the app (greenfield)
Creating an NPC, location, item, or scene creates nodes. The GM is prepping a game,
not "building a registry"; the graph fills in as a byproduct (the §2 loop). Needs a
simple **node/entity editor** (name, type dropdown, tags, a few aliases) and a
**drag-to-connect** gesture on the graph for edges.

### Door B — import existing notes (migration; the "wow")
Most GMs already keep notes in Obsidian / Notion exports / a folder of Markdown or
Word files. The app points at that folder and *proposes* the entities, then the GM
confirms. We read the conventions they already use, in priority order:
1. **Folder-as-type / file-as-entity** — `NPCs/Mila.md` → node *Mila*, type *npc*.
2. **Frontmatter & inline tags** — `type:`, `tags:`, `aliases:`, `#tag`.
3. **`[[Wikilinks]]`** — every wikilink is an authored edge (and `[[Mila|the kid]]`
   yields an alias). Non-coders produce edges naturally without knowing it.
4. **Headings & recurring proper nouns** — surfaced as *candidates*, not auto-added.

Then an **Entity Review studio** replaces hand-editing JSON: "found 47 characters,
12 locations, 30 loose names — review?" → accept / reject / merge / retype in bulk.
Output lands in the campaign store; the GM never touches a file again.

### Mirror Principle
All of the above is non-AI and offline. A **local LLM (Phase 6)** can later propose
entities/relationships from unstructured prose — an optional accelerator over the
heuristic baseline, never a requirement.

### Edges without JSON
`[[wikilinks]]`, authoring a **scene** (its NPCs/items/enemies are edges), the
**co-mention candidates** the parser already surfaces (the "Author" button), and
**drag-to-connect**. Optional AI suggests typed relationships for review.

### Where the JSON files go
`registry.json` / `annotations.json` become (a) an **import path** for power users /
migration, and (b) an **export** the app can write — an output, never a prerequisite.
The browser folder-mount is a dev-phase UX; the **Electron wrap (Phase 6)** makes file
access feel native (dialogs, remembered folders, optional watching).

### Build order for the front door
1. **In-app node editor + drag-to-connect** — the app stops needing any file.
2. **Folder import v1** — folder-as-type + frontmatter + `[[wikilinks]]` → the Entity
   Review studio → campaign store (covers the whole Obsidian/Markdown population).
3. **Export** `registry.json` / `annotations.json` (demotes JSON to optional).
4. **Proper-noun extraction + dedupe** in the review studio (unstructured prose).
5. **Phase 6**: local-AI extraction as the optional booster; Electron for native files.

---

## 13. Session Recording & Transcription

**Origin:** a live session was captured via one phone's on-device dictation (Notes app).
It had no speaker separation, mangled campaign-specific proper nouns badly (generic
dictionaries don't know "Ivarstead" or "Ismara"), and interleaved in-character lines with
table banter with no boundary marker. Reconstructing the session afterward required
manually cross-referencing that transcript against GM notes and in-document comments —
workable once, not something to depend on every session.

**Design decision — this is two features, not one, split by the Mirror Principle:**
a multi-track recorder (non-AI, real value on its own) and speech transcription (AI,
opt-in). They must not be blurred into a single "transcription feature," because
transcription itself cannot be made to work well without a neural model — see §13.5 —
and folding it into the non-AI core would either misrepresent that or ship a bad tool
to make the label technically true.

### 13.1 Non-AI core — Multi-Track Session Recorder

Every device at the table is already running the app (character sheets, Combat Portal).
Any device can opt into **Session Recorder**:

- Captures its own local audio only. Nothing leaves the device automatically.
- Records a running **volume/amplitude trace** alongside the audio — cheap signal
  processing (RMS over time), not a model.
- After the session (or live, via a lightweight sync primitive — see below), tracks from
  every participating device merge into one **synced multi-track archive**, aligned by
  timestamp.
- A **Playback/Compare UI**: scrub the merged timeline; each track's volume curve is a
  visual cue for who was probably talking (closer mic → louder signal, even though every
  device hears the whole room); jump between tracks to catch a word one mic missed that
  another caught; take notes inline.

This stands alone. A GM who never touches an AI feature gets multiple synced recordings
of their own table instead of one ambient phone track, and a tool to cross-reference them
by ear — a real improvement for hand-writing session notes or a narrative record, with
zero models, zero downloads, matching Privacy-by-Architecture (§9) exactly as everything
else in this suite does.

**Why not full acoustic diarization instead of volume comparison?** Automatic
speaker-ID from audio alone is itself a trained model (speaker-embedding clustering,
e.g. pyannote) — another AI dependency, and an unreliable one in a same-room,
every-mic-hears-everyone setup. Volume-across-devices is deterministic signal math that
exploits physical mic placement instead, and needs no model at all.

**Why not just tag the loudest device as "the speaker" live?** Considered and rejected —
in a shared room every device hears every speaker, so origin-device alone isn't a valid
speaker label. Cross-track comparison (multiple witnesses, not one vote) is the
correction; a segment where two tracks disagree is a real signal, not noise to discard.

**Sync mechanism (open question, sized small deliberately):** does not require Phase 8's
full networked-combat build (HP/FP/status sync). Only needs a much thinner slice: devices
join a session by code, stream small timestamped metadata (volume trace, later transcript
text) to a host device, host merges. Audio itself can even stay fully local and be merged
from local files after the session, no networking required for a first version.

### 13.2 What "AI" actually means here — three tiers, not a binary

Earlier drafts of this section called Vosk "non-neural." That was wrong and got corrected
mid-design; worth stating precisely since a technical reader would catch a sloppy claim
here immediately, and getting it right is what makes §13.3's argument to skeptical users
actually hold up:

| Tier | Tech | Architecture | Generates content? | Scale |
|---|---|---|---|---|
| **1 — Recorder** (13.1) | none | — | no | zero model |
| **2 — Vosk** | Kaldi | HMM sequence structure + a small TDNN neural net for acoustic classification | no — constrained decoding against a known vocabulary, not open-ended generation | ~50MB/language |
| **3 — Whisper** | transformer | same architectural family as an LLM, encoder-decoder | yes — token-by-token generation, which is why it can hallucinate on silence/noise | hundreds of MB |

Tier 2 is not literally "zero AI" — it contains a small neural net. What's true and does
matter: it's not a transformer, it doesn't do open-ended generation, and it has no
hallucination failure mode the way Tier 3 does, because it's decoding against a
constrained vocabulary rather than freely predicting. "Non-AI" is the wrong label for it;
"small, non-generative, offline, not an LLM" is the accurate one.

**Training data, checked rather than assumed:** the specific "AI scraping" objection —
non-consensual harvesting of copyrighted creative work to train a model that then
substitutes for that work — is aimed at generative models trained on opportunistic web
scrapes (art platforms, books, articles). Vosk's models are trained on purpose-built
speech corpora (LibriSpeech — volunteer LibriVox readings of public-domain text, CC BY
4.0 — plus Common Voice, Tuda, and similar academic corpora): people read text aloud
specifically so it could be used this way. That's a genuinely different provenance story,
confirmed by checking it, not assumed because the model is smaller.

### 13.3 Speech Transcription — Tier 2 (Vosk), the default

- **Vocabulary/grammar constraint:** Vosk supports constraining recognition to a defined
  vocabulary or grammar, improving accuracy on domain terms at the source. The campaign's
  entity graph (§3/§12) already has every proper noun tagged as exhaust of normal use —
  Ivarstead, Ismara, Klimmek — feed that list into Vosk's constraint mechanism for free.
  Whisper has no equivalent hard lever, only soft prompt-based hinting.
- **Per-table enrollment, scoped to what's actually mature:** Kaldi has real speaker-
  adaptation techniques (fMLLR, i-vectors), but Kaldi's own maintainers describe acoustic
  fine-tuning as unfinished tooling ("not designed for finetuning... scripts are not easy
  to set up"). Don't build on that. Instead: each player reads a fixed reference passage
  (phonetically varied, and written to include the campaign's own proper nouns). Because
  the passage's real text is known, diffing Vosk's transcription of it against the truth
  surfaces that player's actual, confirmed errors — accent-driven or otherwise, not
  limited to campaign vocabulary. Every consistent mismatch becomes a correction rule keyed
  to that player's device, applied automatically to future transcripts from the same
  device. This uses only mature, documented capabilities (transcribe + text diff) and
  never touches the acoustic model.
- **Why corrections work better here than they might elsewhere:** Vosk's constrained
  decoding tends to fail the same way on the same word repeatedly, which is what makes a
  fixed correction table effective. (Noted as reasoned inference, not independently
  verified: if Whisper's freer generation turns out to be just as consistent in its
  mistakes, this specific advantage narrows.)
- **Portability caveat:** the enrollment/correction mechanism itself isn't Vosk-exclusive
  — it could sit on top of Whisper's output too. What's genuinely Vosk-specific is the
  vocabulary-constraint mechanism and the multi-device resource footprint (~50MB models,
  no WebGPU requirement, cheap to run five-at-once across a table of phones/laptops).

### 13.4 Speech Transcription — Tier 3 (Whisper), still open

Whisper's real advantage is baseline generalization to speech it's never adapted for —
new players, guest sessions, a table that's never run the enrollment flow, or (per the
product's actual scope — `app-integration-plan.txt`: paid GM app, DLC ecosystem,
system-agnostic, "any ruleset and any setting") a different GM's different table
entirely, whose voices and vocabulary this table's tuning never touched. Tier 2's
advantages (vocabulary constraint, enrollment) are per-campaign and don't transfer to a
stranger's install; Tier 3's strength is exactly that it doesn't need to.

**Not yet decided whether to build it at all.** Depends on how far Tier 2 actually gets
on real audio — see 13.6, first step, still not executed as of this writing — and how
much "works out of the box for a customer we'll never meet" matters versus "works
excellently for the tables that use it." Revisit after the empirical test, not before.

### 13.5 Open questions
- [ ] Merged archive format (audio + volume trace + transcript + correction table,
      versioned per §9).
- [ ] Reconciliation algorithm specifics if/when Tier 3 ships and multiple transcripts of
      the same segment need comparing.
- [ ] Compare/Playback UI — where it lives in the 4-pillar dashboard (§8), or a session's
      post-game view.
- [ ] Whether Tier 3 (Whisper) gets built at all — see 13.4.

### 13.6 Build order

1. **Empirical spike (throwaway script, not product code):** run real table audio through
   `vosk-python` locally — not the browser WASM port yet. Measure actual word-error-rate,
   specifically on proper nouns and this table's voices, before investing further. This is
   the test that's been proposed several times in this design process and not yet run;
   nothing past this point should be built on an unverified assumption about accuracy.
2. **Single-device local capture + transcription, in-app, zero networking:** Web Audio API
   capture, local volume trace (13.1), Vosk transcribing on one device. Delivers real
   standalone value already — a GM could use one device as a session recorder before any
   other device joins.
3. **Enrollment + correction-table pipeline, still single-device:** reference-passage UI,
   diff against known text, per-player correction rules, applied to that device's own
   future transcripts (13.3). Fully buildable and testable alone.
4. **Vocabulary biasing wire-up:** feed the campaign entity graph into Vosk's constraint
   mechanism for that device.
5. **Thin networking primitive — deliberately last, not first:** join-by-code session
   pairing; each device streams small timestamped metadata (volume trace, transcript text
   — not raw audio) to a host, which merges into one timeline. This is the point where
   pulling a thin slice of Phase 8's PeerJS foundation forward actually makes sense —
   *after* steps 2-4 exist and their data shapes are known, not before. Designing the
   transport before the payload exists risks building the wrong interface.
6. **Merged multi-track Playback/Compare UI**, consuming the synced timeline from step 5.
7. **Revisit Tier 3 (Whisper)** using step 1's actual results, not the assumption that
   drove this design conversation.
