// Markdown → CampaignModule compiler (the Forge's "Preflight compile").
//
// Parses a GM's markdown runsheet into structured SceneNodes using the campaign's
// existing session-sheet vocabulary (see Frogs-5-skyrim/Toryggs legacy/SESSION
// SHEET FORMAT and docs/LOREWEB-PORT-SPEC.md). It also harvests inline `@web:`
// edges so authoring a runsheet grows the lore web as a byproduct.
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
// refines in the editor; the linter flags gaps.

import {
  CampaignModule, SceneNode, SceneCheck, Findable, SceneNpc, ExitLink,
  WebEdge, Difficulty, CheckStat, DIFFICULTY_PENALTY, createScene,
  CAMPAIGN_SCHEMA_VERSION,
} from '@/types/campaign';

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
      id: crypto.randomUUID(),
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

function compileScene(raw: { title: string; body: string[] }, inlineEdges: WebEdge[]): SceneNode {
  const scene = createScene({ title: raw.title || 'Untitled Scene' });
  let mode: 'none' | 'readaloud' | 'handout' = 'none';
  let handout: Findable | null = null;
  let findSection: Findable | null = null;
  let subtitleSet = false;

  const npcByName = new Map<string, SceneNpc>();
  const addNpc = (name: string, line?: string): SceneNpc => {
    const key = name.toUpperCase();
    let npc = npcByName.get(key);
    if (!npc) {
      npc = { id: crypto.randomUUID(), name };
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
      handout = { id: crypto.randomUUID(), name: ho[1].trim(), description: '', readAloud: '', resolved: false };
      scene.findables.push(handout);
      mode = 'handout';
      continue;
    }
    if (/^gm:/i.test(line)) { scene.gmNotes.push(line.replace(/^gm:\s*/i, '')); mode = 'none'; continue; }

    const find = line.match(/^find\b[ \-–—:]*(.*)$/i);
    if (find) {
      findSection = { id: crypto.randomUUID(), name: (find[1] || 'Findable').trim(), description: '', resolved: false };
      scene.findables.push(findSection);
      mode = 'none';
      continue;
    }

    const exit = line.match(/^exit\s*[-–—]*>?\s*(.+)$/i);
    if (exit) {
      const parts = exit[1].split(/\s*->\s*|\s{2,}->\s*/);
      const link: ExitLink = { id: crypto.randomUUID(), description: parts[0].trim() };
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
  else if (scene.npcs.length > 0 && scene.readAloud.length >= 0 && /camp|farewell|debrief|meeting/i.test(scene.title)) scene.type = 'character';

  return scene;
}

export function compileModule(markdown: string, name = 'Untitled Module', sourcePath?: string): CompileResult {
  const inlineEdges: WebEdge[] = [];
  const rawScenes = splitScenes(markdown);
  const moduleId = crypto.randomUUID();
  const scenes = rawScenes.map((rs) => {
    const s = compileScene(rs, inlineEdges);
    s.moduleId = moduleId;
    return s;
  });

  const warnings = lintModule(scenes);
  return {
    module: {
      id: moduleId,
      name,
      scenes,
      sourcePath,
      schemaVersion: CAMPAIGN_SCHEMA_VERSION,
    },
    inlineEdges,
    warnings,
  };
}

/** Preflight linter — flags the session-sheet build-checklist failures. */
export function lintModule(scenes: SceneNode[]): string[] {
  const warnings: string[] = [];
  if (scenes.length === 0) warnings.push('No scenes found. Use "# Title" or "---" to divide scenes.');
  scenes.forEach((s, i) => {
    const n = `Scene ${i + 1} "${s.title}"`;
    if (s.readAloud.length === 0) warnings.push(`${n}: no read-aloud block (every scene should open with one).`);
    if (s.exits.length === 0 && i < scenes.length - 1) warnings.push(`${n}: no EXIT — the reader won't know where it leads.`);
    if (s.type === 'character' && s.npcs.every((npc) => !npc.line)) {
      warnings.push(`${n}: a character scene where no NPC has a line (a beat is never a character sheet).`);
    }
  });
  return warnings;
}

/* ------------------------------------------------------------------ *
 * Dual-format export: SceneNodes → human-readable session-sheet
 * markdown. This is the fallback the GM can read/run with the app
 * closed, and it re-imports through compileModule (round-trip).
 * ------------------------------------------------------------------ */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function moduleToMarkdown(module: CampaignModule): string {
  const titleById = new Map(module.scenes.map((s) => [s.id, s.title]));
  const lines: string[] = [];

  module.scenes.forEach((s, i) => {
    lines.push(`# ${i + 1}  ${s.title}`);
    if (s.subtitle) lines.push(`SUBTITLE: ${s.subtitle}`);
    lines.push('');

    if (s.readAloud.length) {
      lines.push('>> READ ALOUD');
      s.readAloud.forEach((p, j) => { lines.push(p); if (j < s.readAloud.length - 1) lines.push(''); });
      lines.push('');
    }
    if (s.gmNotes.length) { s.gmNotes.forEach((n) => lines.push(`GM: ${n}`)); lines.push(''); }
    if (s.bullets.length) { s.bullets.forEach((b) => lines.push(`- ${b}`)); lines.push(''); }

    if (s.checks.length) {
      s.checks.forEach((c) => {
        const statTxt = c.stat && c.stat !== 'none' ? ` ${cap(c.stat)}` : '';
        const pen = c.penalty !== 0 ? ` (${c.penalty > 0 ? '+' : ''}${c.penalty})` : '';
        lines.push(`- **${c.difficulty}${statTxt}${pen}**${c.label ? ` — ${c.label}` : ''}`);
      });
      lines.push('');
    }
    if (s.npcs.length) {
      s.npcs.forEach((npc) => {
        lines.push(npc.line ? `**${npc.name.toUpperCase()}:** "${npc.line}"` : `**${npc.name.toUpperCase()}:**`);
        npc.reactions?.forEach((r) => lines.push(`REACTION (${npc.name}): ${r.response}`));
      });
      lines.push('');
    }
    s.findables.forEach((f) => {
      lines.push(`FIND -- ${f.name}`);
      if (f.description) f.description.split('\n').forEach((d) => lines.push(`- ${d}`));
      if (f.readAloud) { lines.push(`>> HANDOUT -- ${f.name}`); lines.push(f.readAloud); }
      lines.push('');
    });
    if (s.enemies.length) { lines.push(`ENEMIES: ${s.enemies.join(', ')}`); lines.push(''); }
    s.exits.forEach((ex) => {
      const tgt = ex.targetSceneId ? titleById.get(ex.targetSceneId) : ex.branchLabel;
      lines.push(`EXIT -> ${ex.description}${tgt ? ` -> ${tgt}` : ''}`);
    });
    lines.push('');
  });

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
