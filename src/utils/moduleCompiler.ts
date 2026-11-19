// Markdown → CampaignModule compiler (the Forge's "Import (veteran)" path).
//
// Parses a GM's markdown runsheet into structured SceneNodes using the campaign's
// existing session-sheet vocabulary (see Frogs-5-skyrim/Toryggs legacy/SESSION
// SHEET FORMAT and docs/LOREWEB-PORT-SPEC.md). It also harvests inline `@web:`
// edges so authoring a runsheet grows the lore web as a byproduct.
//
// v2 note: this still parses into the old flat buckets (readAloud, gmNotes,
// bullets, npcs, checks, findables) — the shape markdown naturally has no
// paragraph-order concept for — then hands the result to sceneBlocks'
// legacyToBlocks()/migrateScene() to fold into ordered v2 blocks. The wizard
// is the priority authoring path; this compiler exists for veterans of the
// old markdown format and stays intentionally simple.
//
// Recognized markers:
//   # / ## / ###  Title      → scene boundary + title
//   ---                       → scene boundary
//   SUBTITLE: ... | *italic*  → the grey "what this is" line (subtitle)
//   >> READ ALOUD             → read-aloud block (following lines, until blank)
//   >> HANDOUT -- Title       → a findable carrying the full in-world text
//   GM: ...                   → GM note
//   FIND -- Title / FIND: ... → a findable (following bullets describe it)
//   **NAME:** "line"          → an NPC beat (spoken line)
//   REACTION (Name): ...      → an NPC reaction
//   - / * / •  beat           → bullet
//   EXIT -> desc [-> target]  → exit
//   ENEMIES: id1, id2         → EnemyTemplate ids to deploy
//   **Hard Guile (-4)**       → a check (inline, anywhere)
//   @web: src | type | dst | why → harvested lore-web edge
//
// Unrecognized prose lines become bullets; bare ALL-CAPS section labels are
// treated as visual dividers and dropped. Coverage is pragmatic v1 — the GM
// refines in the wizard; the linter flags gaps.

import {
  SceneNode, SceneCheck, Findable, SceneNpc, ExitLink,
  WebEdge, Difficulty, CheckStat, DIFFICULTY_PENALTY,
  CampaignModule, CAMPAIGN_SCHEMA_VERSION,
} from '@/types/campaign';
import { migrateScene, legacyToBlocks, lintModuleV2, uid } from './sceneBlocks';

export interface CompileResult {
  module: CampaignModule;
  inlineEdges: WebEdge[];
  warnings: string[];
}

const DIFFICULTIES: Difficulty[] = [
  'Very Easy', 'Very Hard', 'Nearly Impossible', 'Impossible', 'Mythic', 'Easy', 'Standard', 'Hard',
];
// longest-first alternation so "Very Hard" wins over "Hard"
const CHECK_RE = new RegExp(
  `\\*\\*\\s*(${DIFFICULTIES.join('|')})` +
  `\\s*(Might|Agility|Magic|Guile)?\\s*(?:\\(([+-]?\\d+)\\))?\\s*\\*\\*`,
  'gi',
);
const INLINE_EDGE_RE =
  /^[ \t]*@web:\s*([\w-]+)\s*\|\s*([^|]+?)\s*\|\s*([\w-]+)\s*\|\s*(.+)$/;
const NPC_LINE_RE = /^\*\*([A-Z][A-Za-z' .]+?):\*\*\s*(.*)$/;
const REACTION_RE = /^REACTION\s*\(([^)]+)\):\s*(.+)$/i;

function canonDifficulty(raw: string): Difficulty {
  const lower = raw.toLowerCase();
  for (const d of ['Very Easy', 'Very Hard', 'Nearly Impossible', 'Impossible', 'Mythic', 'Easy', 'Standard', 'Hard'] as Difficulty[]) {
    if (d.toLowerCase() === lower) return d;
  }
  return 'Standard';
}

function extractChecks(text: string): SceneCheck[] {
  const out: SceneCheck[] = [];
  let m: RegExpExecArray | null;
  CHECK_RE.lastIndex = 0;
  while ((m = CHECK_RE.exec(text)) !== null) {
    const difficulty = canonDifficulty(m[1]);
    const stat = (m[2]?.toLowerCase() as CheckStat) || 'none';
    const penalty = m[3] !== undefined ? parseInt(m[3], 10) : DIFFICULTY_PENALTY[difficulty];
    out.push({
      id: uid(),
      stat,
      difficulty,
      penalty,
      label: m[0].replace(/\*\*/g, '').trim(),
    });
  }
  return out;
}

function stripQuote(s: string): string {
  return s.replace(/^>+\s?/, '').replace(/^["“]/, '').replace(/["”]$/, '').trim();
}

function isAllCapsLabel(line: string): boolean {
  const t = line.trim();
  return t.length > 0 && t.length <= 60 && /^[A-Z0-9][A-Z0-9 '/\-—():.,&]+$/.test(t) && /[A-Z]/.test(t);
}

function splitScenes(md: string): { title: string; body: string[] }[] {
  const lines = md.split(/\r?\n/);
  const scenes: { title: string; body: string[] }[] = [];
  let current: { title: string; body: string[] } | null = null;
  const start = (title: string) => { current = { title: title.trim() || 'Untitled Scene', body: [] }; scenes.push(current); };

  for (const line of lines) {
    const heading = line.match(/^#{1,3}\s+(.+?)\s*#*\s*$/);
    if (heading) { start(heading[1]); continue; }
    if (/^\s*-{3,}\s*$/.test(line)) {
      if (current && current.body.some((l) => l.trim())) start('');
      continue;
    }
    if (!current) start('');
    current.body.push(line);
  }
  return scenes.filter((s) => s.title || s.body.some((l) => l.trim()));
}

/** Flat v1-shaped intermediate — parsing has no paragraph-order concept, so
 * we fill these buckets, then legacyToBlocks() folds them into ordered v2
 * blocks in a fixed, sensible sequence (read-aloud, then notes, then bullets,
 * then NPCs, then checks, then findables). */
interface RawScene {
  title: string;
  subtitle?: string;
  type: SceneNode['type'];
  readAloud: string[];
  gmNotes: string[];
  bullets: string[];
  findables: Findable[];
  npcs: SceneNpc[];
  checks: SceneCheck[];
  enemies: string[];
  exits: ExitLink[];
}

function newRawScene(title: string): RawScene {
  return {
    title: title || 'Untitled Scene', type: 'set-piece',
    readAloud: [], gmNotes: [], bullets: [], findables: [], npcs: [], checks: [], enemies: [], exits: [],
  };
}

function compileScene(raw: { title: string; body: string[] }, inlineEdges: WebEdge[]): RawScene {
  const scene = newRawScene(raw.title);
  let mode: 'none' | 'readaloud' | 'handout' = 'none';
  let handout: Findable | null = null;
  let findSection: Findable | null = null;
  let subtitleSet = false;

  const npcByName = new Map<string, SceneNpc>();
  const addNpc = (name: string, line?: string): SceneNpc => {
    const key = name.toUpperCase();
    let npc = npcByName.get(key);
    if (!npc) {
      npc = { id: uid(), name };
      npcByName.set(key, npc);
      scene.npcs.push(npc);
    }
    if (line && !npc.line) npc.line = line;
    return npc;
  };

  for (let i = 0; i < raw.body.length; i++) {
    const rl = raw.body[i];
    const line = rl.trim();

    // inline lore-web edges (harvest, don't render)
    const em = rl.match(INLINE_EDGE_RE);
    if (em) {
      inlineEdges.push({ src: em[1], type: em[2].trim(), dst: em[3], why: em[4].trim() });
      continue;
    }

    if (!line) { mode = 'none'; findSection = null; continue; }

    // checks are inline anywhere — collect, then keep processing the line's role
    scene.checks.push(...extractChecks(line));

    // block markers
    if (/^>>?\s*read\s*aloud/i.test(line)) { mode = 'readaloud'; continue; }
    const ho = line.match(/^>>?\s*handout\s*[-–—:]+\s*(.+)$/i);
    if (ho) {
      handout = { id: uid(), name: ho[1].trim(), description: '', readAloud: '', resolved: false };
      scene.findables.push(handout);
      mode = 'handout';
      continue;
    }
    if (/^gm:/i.test(line)) { scene.gmNotes.push(line.replace(/^gm:\s*/i, '')); mode = 'none'; continue; }

    const find = line.match(/^find\b[ \-–—:]*(.*)$/i);
    if (find) {
      findSection = { id: uid(), name: (find[1] || 'Findable').trim(), description: '', resolved: false };
      scene.findables.push(findSection);
      mode = 'none';
      continue;
    }

    const exit = line.match(/^exit\s*[-–—]*>?\s*(.+)$/i);
    if (exit) {
      const parts = exit[1].split(/\s*->\s*|\s{2,}->\s*/);
      const link: ExitLink = { id: uid(), description: parts[0].trim() };
      if (parts[1]) link.branchLabel = parts[1].trim();
      scene.exits.push(link);
      mode = 'none';
      continue;
    }

    const enemies = line.match(/^enemies:\s*(.+)$/i);
    if (enemies) {
      scene.enemies.push(...enemies[1].split(',').map((s) => s.trim()).filter(Boolean));
      mode = 'none';
      continue;
    }

    const reaction = line.match(REACTION_RE);
    if (reaction) {
      const npc = addNpc(reaction[1].trim());
      (npc.reactions ||= []).push({ action: 'reaction', response: reaction[2].trim() });
      continue;
    }

    const npcLine = line.match(NPC_LINE_RE);
    if (npcLine) { addNpc(npcLine[1].trim(), npcLine[2].trim() || undefined); mode = 'none'; continue; }

    const subtitle = line.match(/^subtitle:\s*(.+)$/i);
    if (subtitle) { scene.subtitle = subtitle[1].trim(); subtitleSet = true; continue; }

    // accumulate block content
    if (mode === 'readaloud') { scene.readAloud.push(stripQuote(line)); continue; }
    if (mode === 'handout' && handout) {
      handout.readAloud = handout.readAloud ? `${handout.readAloud}\n\n${stripQuote(line)}` : stripQuote(line);
      continue;
    }

    const bullet = line.match(/^[-*•]\s+(.+)$/);
    if (bullet) {
      if (findSection) {
        findSection.description = findSection.description ? `${findSection.description}\n${bullet[1].trim()}` : bullet[1].trim();
      } else {
        scene.bullets.push(bullet[1].trim());
      }
      continue;
    }

    // a lone italic line right under the header → subtitle
    const italic = line.match(/^\*([^*]+)\*$/);
    if (italic && !subtitleSet && scene.readAloud.length === 0 && scene.bullets.length === 0) {
      scene.subtitle = italic[1].trim();
      subtitleSet = true;
      continue;
    }

    if (isAllCapsLabel(line)) continue; // visual divider — drop

    // unrecognized prose → a bullet (keeps it visible at the table)
    scene.bullets.push(line);
  }

  // classify scene type
  if (/combat|initiative|fight|battle/i.test(scene.title)) scene.type = 'combat';
  else if (scene.npcs.length > 0 && /camp|farewell|debrief|meeting/i.test(scene.title)) scene.type = 'character';

  return scene;
}

// normalize a title/label for fuzzy exit-target matching: lowercase, strip
// punctuation, collapse whitespace. Scene titles in a session sheet often
// carry a number/letter prefix and a colon-subtitle ("3B -- THE WIND TUNNEL:
// the thing that cannot finish") that a hand-written EXIT branch label won't
// always repeat verbatim, so match is exact-first, then substring-fallback.
function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Resolve EXIT branch labels (scene-title text) into real targetSceneId links. */
function resolveExitTargets(scenes: { title: string; exits: ExitLink[] }[]): void {
  const norm = scenes.map((s) => normalizeTitle(s.title));
  scenes.forEach((s) => {
    s.exits.forEach((ex) => {
      if (ex.targetSceneId || !ex.branchLabel) return;
      const label = normalizeTitle(ex.branchLabel);
      if (!label) return;
      let idx = norm.findIndex((t) => t === label);
      if (idx === -1) idx = norm.findIndex((t) => t.includes(label) || label.includes(t));
      if (idx !== -1) ex.targetSceneId = (scenes[idx] as unknown as { id: string }).id;
    });
  });
}

export function compileModule(markdown: string, name = 'Untitled Module', sourcePath?: string): CompileResult {
  const inlineEdges: WebEdge[] = [];
  const rawScenes = splitScenes(markdown);
  const moduleId = uid();
  const raws = rawScenes.map((rs) => compileScene(rs, inlineEdges));

  const withIds = raws.map((r) => ({ ...r, id: uid() }));
  resolveExitTargets(withIds);

  const scenes: SceneNode[] = withIds.map((r) =>
    migrateScene({
      id: r.id, moduleId, title: r.title, subtitle: r.subtitle, type: r.type,
      blocks: legacyToBlocks(r), enemies: r.enemies, exits: r.exits, tags: [],
    })
  );

  const module: CampaignModule = {
    id: moduleId, name, scenes, sourcePath, tierTables: [], schemaVersion: CAMPAIGN_SCHEMA_VERSION,
  };
  return { module, inlineEdges, warnings: lintModuleV2(module) };
}

/** Preflight linter — kept for callers that only have loose SceneNode[]
 * (rare after v2; prefer lintModuleV2 on a full CampaignModule). */
export function lintModule(scenes: SceneNode[]): string[] {
  return lintModuleV2({ id: '', name: '', scenes, tierTables: [], schemaVersion: CAMPAIGN_SCHEMA_VERSION });
}

/* ------------------------------------------------------------------ *
 * Dual-format export: SceneNodes → human-readable session-sheet
 * markdown. Round-trips the original v1 vocabulary faithfully for the
 * block kinds that map onto it (read-aloud, GM notes, lists, spoken NPC
 * lines, checks, findables/handouts, exits, enemies); every other v2
 * block kind (branch/choices/card/director/combat/etc.) is dumped as
 * readable prose under a labeled marker so nothing is silently lost —
 * it will re-import as a bullet rather than reconstruct the original
 * widget, which is the known limit of the markdown veteran path.
 * ------------------------------------------------------------------ */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function blocksToMarkdown(blocks: SceneNode['blocks'], titleById: Map<string, string>, lines: string[], indent = ''): void {
  for (const b of blocks) {
    switch (b.kind) {
      case 'readAloud':
        lines.push(`${indent}>> READ ALOUD${b.tag ? ` — ${b.tag}` : ''}`);
        b.paragraphs.forEach((p, j) => { lines.push(indent + p); if (j < b.paragraphs.length - 1) lines.push(''); });
        lines.push('');
        break;
      case 'gmNote':
      case 'gmAlert':
        lines.push(`${indent}GM: ${b.tag ? `[${b.tag}] ` : ''}${b.text}`);
        b.items?.forEach((it) => lines.push(`${indent}- ${it}`));
        lines.push('');
        break;
      case 'stop':
        lines.push(`${indent}GM: STOP. ${b.text}`, '');
        break;
      case 'spoken':
        lines.push(`${indent}**${b.speaker.toUpperCase()}:** "${b.line}"`, '');
        break;
      case 'handout':
        lines.push(`${indent}FIND -- ${b.title}`, `${indent}>> HANDOUT -- ${b.title}`, indent + b.text, '');
        break;
      case 'list':
        if (b.title) lines.push(`${indent}${b.title}`);
        b.items.forEach((it, i) => lines.push(`${indent}${b.ordered ? `${i + 1}.` : '-'} ${it}`));
        lines.push('');
        break;
      case 'text':
        lines.push(indent + b.text, '');
        break;
      case 'heading':
        lines.push(`${indent}### ${b.text}`, '');
        break;
      case 'quote':
        b.lines.forEach((l) => lines.push(`${indent}> "${l}"`));
        lines.push('');
        break;
      case 'card':
        lines.push(`${indent}CARD -- ${b.title}`);
        b.items.forEach((it) => lines.push(`${indent}- ${it}`));
        b.quotes?.forEach((q) => lines.push(`${indent}> "${q}"`));
        if (b.note) lines.push(indent + b.note);
        lines.push('');
        break;
      case 'check':
        lines.push(`${indent}- **${b.difficulty}${b.stat !== 'none' ? ` ${cap(b.stat)}` : ''}${b.penalty ? ` (${b.penalty > 0 ? '+' : ''}${b.penalty})` : ''}**${b.label ? ` — ${b.label}` : ''}`, '');
        break;
      case 'findable':
        lines.push(`${indent}FIND -- ${b.name}`);
        if (b.description) lines.push(`${indent}- ${b.description}`);
        if (b.readAloud) lines.push(`${indent}>> HANDOUT -- ${b.name}`, indent + b.readAloud);
        lines.push('');
        break;
      case 'exit': {
        const tgt = b.targetSceneId ? titleById.get(b.targetSceneId) : undefined;
        lines.push(`${indent}EXIT -> ${b.description}${tgt ? ` -> ${tgt}` : ''}`, '');
        break;
      }
      case 'branch':
        lines.push(`${indent}BRANCH -- ${b.title}${b.tag ? ` [${b.tag}]` : ''}`);
        blocksToMarkdown(b.blocks, titleById, lines, indent + '  ');
        break;
      case 'choices':
        lines.push(`${indent}CHOICES${b.prompt ? ` -- ${b.prompt}` : ''}`);
        b.options.forEach((o) => {
          lines.push(`${indent}OPTION -- ${o.label}`);
          blocksToMarkdown(o.blocks, titleById, lines, indent + '  ');
        });
        lines.push('');
        break;
      case 'director':
        lines.push(`${indent}[Conversation director: ${b.director.npc} — ${b.director.nodes.length} nodes. Edit in the Forge wizard; not represented in markdown.]`, '');
        break;
      case 'combat':
        lines.push(`${indent}[Combat manager: ${b.combat.title} — ${b.combat.trackers.length} trackers, ${b.combat.triggers.length} triggers. Edit in the Forge wizard; not represented in markdown.]`, '');
        break;
    }
  }
}

export function moduleToMarkdown(module: CampaignModule): string {
  const titleById = new Map(module.scenes.map((s) => [s.id, s.title]));
  const lines: string[] = [];

  module.scenes.forEach((s, i) => {
    lines.push(`# ${i + 1}  ${s.title}`);
    if (s.subtitle) lines.push(`SUBTITLE: ${s.subtitle}`);
    lines.push('');

    blocksToMarkdown(s.blocks, titleById, lines);

    if (s.enemies.length) { lines.push(`ENEMIES: ${s.enemies.join(', ')}`); lines.push(''); }
    s.exits.forEach((ex) => {
      const tgt = ex.targetSceneId ? titleById.get(ex.targetSceneId) : ex.branchLabel;
      lines.push(`EXIT -> ${ex.description}${tgt ? ` -> ${tgt}` : ''}`);
    });
    lines.push('');
  });

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
