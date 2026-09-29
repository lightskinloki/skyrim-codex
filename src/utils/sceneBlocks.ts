// Scene blocks: factories, the v1 → v2 migration, the Forge wizard's per-kind
// scene templates, and the preflight linter.
//
// The templates are the 9/28 Fire B runsheet's scene shapes, emptied out:
//   opening       = FIRE_B_SESSION_RUNSHEET.html #scene-vault-bridge
//   conversation  = #scene-boss-appendix + GAELEN_CONVERSATION_DIRECTOR.html
//   combat        = #jasper-combat-manager
//   endings       = #scene-endings
//   resolution    = #scene-23
// so a GM who fills the wizard in ends up with that same runsheet.

import {
  SceneNode, SceneBlock, SceneKind, SceneType, ChoiceOption, ConversationDirector,
  DirectorNode, CombatManager, ObjectiveTracker, TierTable, CampaignModule,
  DIFFICULTY_PENALTY, CAMPAIGN_SCHEMA_VERSION, createScene, BlockBase,
} from '@/types/campaign';

export const uid = () => crypto.randomUUID();

type NewBlock<K extends SceneBlock['kind']> = Omit<Extract<SceneBlock, { kind: K }>, 'id' | 'kind'>;

export function block<K extends SceneBlock['kind']>(kind: K, data: NewBlock<K>): Extract<SceneBlock, { kind: K }> {
  return { id: uid(), kind, ...data } as unknown as Extract<SceneBlock, { kind: K }>;
}

/* ------------------------------------------------------------------ *
 * Human labels for every block kind (wizard "+ Add" menu, previews)
 * ------------------------------------------------------------------ */

export const BLOCK_META: Record<SceneBlock['kind'], { label: string; hint: string }> = {
  readAloud: { label: 'Read-aloud', hint: 'Spoken cold at the table. What is physically there, in order. No PC feelings or conclusions.' },
  gmNote: { label: 'GM note', hint: 'GM-only truth, adjudication, what this establishes. Tag replaces "GM:".' },
  gmAlert: { label: 'GM alert (red)', hint: 'Must-not-miss instruction: START HERE, OPEN THE TABLE, SCENE SHAPE, OBJECTIVE.' },
  stop: { label: 'STOP banner', hint: 'Full-width stop: "GM: STOP. Turn to Saijah\'s player..."' },
  spoken: { label: 'Spoken line', hint: 'An NPC line in their own voice. What does the SPEAKER get from saying it?' },
  handout: { label: 'Handout / in-world text', hint: 'The exact text of a letter, journal, inscription.' },
  list: { label: 'List', hint: 'Rewards, seeds, consequences, options. One item per line.' },
  text: { label: 'Paragraph / source line', hint: 'Plain text. "Small" = grey source citation.' },
  heading: { label: 'Sub-heading', hint: 'Numbered steps inside a scene or branch.' },
  quote: { label: 'Exact quotes', hint: 'Lines to read verbatim (journal text, locked voice lines).' },
  card: { label: 'Reference card (collapsible)', hint: 'State cards: who is present and how they are, what was found, exact texts.' },
  branch: { label: 'Branch box', hint: 'Always-visible branch: === BRANCH A: SHE REFUSES ===' },
  choices: { label: 'Choice buttons', hint: 'What might the players do? One button per option, one panel open at a time.' },
  check: { label: 'Check', hint: 'A difficulty on the player\'s OWN stat. Never a target number.' },
  findable: { label: 'Findable / loot', hint: 'Something they can pick up or discover, with its own read-aloud.' },
  exit: { label: 'Jump to scene', hint: 'An inline "go to" (inside a choice or ending).' },
  director: { label: 'Conversation director', hint: 'The NPC flowchart: what did the players do → what the NPC has.' },
  combat: { label: 'Combat manager', hint: 'Objectives with HP + threshold trigger, round/Tempo, combatant priorities, trigger cards.' },
};

/** Block kinds the wizard offers inside a choice / branch / trigger panel (no nested widgets). */
export const NESTED_KINDS: SceneBlock['kind'][] = [
  'readAloud', 'gmNote', 'gmAlert', 'stop', 'spoken', 'list', 'text', 'heading', 'quote', 'check', 'handout', 'exit', 'branch', 'choices',
];

/* ------------------------------------------------------------------ *
 * v1 → v2 migration: fold the old buckets into ordered blocks
 * ------------------------------------------------------------------ */

export function legacyToBlocks(s: Partial<SceneNode>): SceneBlock[] {
  const out: SceneBlock[] = [];
  if (s.readAloud?.length) out.push(block('readAloud', { paragraphs: s.readAloud }));
  s.gmNotes?.forEach((n) => out.push(block('gmNote', { text: n })));
  if (s.bullets?.length) out.push(block('list', { items: s.bullets }));
  s.npcs?.forEach((npc) => {
    if (npc.line) out.push(block('spoken', { speaker: npc.name, line: npc.line }));
    if (npc.reactions?.length) {
      out.push(block('choices', {
        prompt: `${npc.name}: how they take it`,
        options: npc.reactions.map((r) => ({
          id: uid(), label: r.action && r.action !== 'reaction' ? r.action : 'Reaction',
          blocks: [block('text', { text: r.response })],
        })),
      }));
    }
  });
  s.checks?.forEach((c) => out.push(block('check', { stat: c.stat, difficulty: c.difficulty, penalty: c.penalty, label: c.label })));
  s.findables?.forEach((f) => out.push(block('findable', { name: f.name, description: f.description, readAloud: f.readAloud, nodeId: f.nodeId })));
  return out;
}

/** Normalize any stored/imported scene (v1 or v2) to the v2 shape. */
export function migrateScene(raw: Partial<SceneNode>): SceneNode {
  const hasLegacy = !!(raw.readAloud?.length || raw.gmNotes?.length || raw.bullets?.length ||
    raw.npcs?.length || raw.checks?.length || raw.findables?.length);
  const blocks = raw.blocks && raw.blocks.length ? raw.blocks : hasLegacy ? legacyToBlocks(raw) : [];
  const scene = createScene({
    ...raw,
    blocks,
    enemies: raw.enemies ?? [],
    exits: raw.exits ?? [],
    tags: raw.tags ?? [],
    schemaVersion: CAMPAIGN_SCHEMA_VERSION,
  });
  delete scene.readAloud; delete scene.gmNotes; delete scene.bullets;
  delete scene.npcs; delete scene.checks; delete scene.findables;
  return scene;
}

export function migrateModule(raw: Partial<CampaignModule>): CampaignModule {
  return {
    id: raw.id ?? uid(),
    name: raw.name ?? 'Untitled Module',
    description: raw.description,
    badge: raw.badge,
    navTitle: raw.navTitle,
    tierTables: raw.tierTables ?? [],
    sourcePath: raw.sourcePath,
    scenes: (raw.scenes ?? []).map((s) => ({ ...migrateScene(s), moduleId: raw.id })),
    schemaVersion: CAMPAIGN_SCHEMA_VERSION,
  };
}

/* ------------------------------------------------------------------ *
 * Walk every block, including the ones nested in choices/branches/combat
 * ------------------------------------------------------------------ */

export function walkBlocks(blocks: SceneBlock[], fn: (b: SceneBlock) => void): void {
  for (const b of blocks) {
    fn(b);
    if (b.kind === 'branch') walkBlocks(b.blocks, fn);
    if (b.kind === 'choices') b.options.forEach((o) => walkBlocks(o.blocks, fn));
    if (b.kind === 'combat') {
      b.combat.trackers.forEach((t) => walkBlocks(t.triggerBlocks, fn));
      b.combat.triggers.forEach((t) => walkBlocks(t.blocks, fn));
    }
  }
}

/** Deep-clone a block tree with fresh ids (duplicate a block / reuse a read-aloud). */
export function cloneBlock<T extends SceneBlock>(b: T): T {
  const copy = JSON.parse(JSON.stringify(b)) as T;
  const reid = (x: BlockBase) => { x.id = uid(); };
  reid(copy);
  walkBlocks([copy], (inner) => { if (inner !== copy) reid(inner); });
  return copy;
}

/* ------------------------------------------------------------------ *
 * Conversation director defaults
 * ------------------------------------------------------------------ */

export const DIRECTOR_GROUPS = [
  { id: 'start', label: 'Start' },
  { id: 'talk', label: 'What the players said' },
  { id: 'person', label: 'Personal pressure points' },
  { id: 'exit', label: 'Exits', exit: true },
];

export function directorNode(partial: Partial<DirectorNode> & { title: string; group: string }): DirectorNode {
  return { id: uid(), next: [], points: [], ...partial };
}

/**
 * A new director: welcome → hub → the four default player responses
 * (Agree / Disagree / Ask more / Attack). The GM adds more; every node
 * routes back to the hub. Titles name the TYPE of thing the players did,
 * never a phrase they must say (GM correction, 9/28).
 */
export function createDirector(npc = 'the NPC'): ConversationDirector {
  const welcome = directorNode({ group: 'start', title: 'Welcome (read-aloud)', intent: 'The party arrives.', aim: '', points: ['Opening read', 'Asked "What do you do?"'] });
  const hub = directorNode({ group: 'start', title: 'WHAT DID THE PLAYERS DO?', intent: 'The center of the chart. Every node returns here.', aim: 'Pick the node closest to what the player just said or did.', info: ['Loop: player acts -> open the closest node -> answer in your own words from it -> one beat -> back here.'] });
  const ask = directorNode({ group: 'talk', title: 'Asks for more (who / what / why)', intent: '"Who are you?" "What is this?" "Why?"', points: [] });
  const disagree = directorNode({ group: 'talk', title: 'Disagrees / objects', intent: 'They push back on what was said or asked.', points: [] });
  const agree = directorNode({ group: 'exit', title: `Agrees / sides with ${npc}`, intent: 'A player goes along with it.', points: ['Asked what they physically do'] });
  const attack = directorNode({ group: 'exit', title: `Attacks ${npc}`, intent: 'Someone draws steel or casts.', points: [] });
  welcome.next = [hub.id];
  hub.next = [ask.id, disagree.id, agree.id, attack.id];
  for (const n of [ask, disagree, agree, attack]) n.next = [hub.id];
  return {
    npc,
    mustSay: [],
    mustSayNote: 'Everything else: your own words.',
    always: [],
    beatsLabel: 'Scene beat',
    beats: [],
    groups: DIRECTOR_GROUPS.map((g) => ({ ...g })),
    startNodeId: welcome.id,
    hubNodeId: hub.id,
    nodes: [welcome, hub, ask, disagree, agree, attack],
  };
}

/* ------------------------------------------------------------------ *
 * Combat manager defaults
 * ------------------------------------------------------------------ */

export function createTracker(): ObjectiveTracker {
  return {
    id: uid(), title: 'Objective tracker', description: '',
    targets: ['A', 'B', 'C'].map((l) => ({ id: uid(), label: l, maxHp: 100 })),
    quickDamage: [10, 100], threshold: undefined, thresholdText: '', triggerBlocks: [],
  };
}

export function createCombat(): CombatManager {
  return {
    title: 'Combat Manager',
    objective: '',
    statusFields: [{ id: uid(), label: 'Zone', initial: '' }],
    trackers: [],
    tierTableId: undefined,
    cards: [],
    triggers: [],
    enemies: [],
  };
}

export function createTierTable(name = 'Roll table'): TierTable {
  return {
    id: uid(), name,
    tiers: [
      { min: 1, max: 4, label: '', effect: '' },
      { min: 5, max: 8, label: '', effect: '' },
      { min: 9, max: 12, label: '', effect: '' },
      { min: 13, max: 17, label: '', effect: '' },
      { min: 18, max: 20, label: '', effect: '' },
    ],
    critNote: '',
  };
}

/* ------------------------------------------------------------------ *
 * Wizard scene templates — the 9/28 runsheet shapes, emptied
 * ------------------------------------------------------------------ */

export const KIND_META: Record<SceneKind, { label: string; blurb: string; type: SceneType; accent?: 'gold' | 'red' }> = {
  opening: { label: 'Opening / resume', blurb: 'Where tonight starts: START HERE, the resume read-aloud, everyone\'s current state, what the party can do before moving on.', type: 'set-piece', accent: 'gold' },
  scene: { label: 'Scene', blurb: 'Read-aloud, GM truth, NPC lines, checks, findables, branches, exits.', type: 'set-piece' },
  conversation: { label: 'Conversation', blurb: 'An NPC the party talks to: arrival read-aloud, then the conversation director flowchart.', type: 'social', accent: 'gold' },
  combat: { label: 'Combat', blurb: 'The combat manager: objectives with HP and a threshold trigger, round and Tempo, who fights how, trigger cards.', type: 'combat', accent: 'red' },
  endings: { label: 'Endings', blurb: 'Pick the ending they reached: one button per outcome, each with what happens and where to go.', type: 'interlude', accent: 'red' },
  resolution: { label: 'Resolution', blurb: 'The curtain: read-aloud, rewards, seeds planted, the consequence ledger, the road to the next module.', type: 'interlude', accent: 'gold' },
};

function opt(label: string, heading?: string): ChoiceOption {
  return { id: uid(), label, heading, blocks: [] };
}

export function templateBlocks(kind: SceneKind, npc?: string): SceneBlock[] {
  switch (kind) {
    case 'opening':
      return [
        block('gmAlert', { tag: 'START HERE:', text: '' }),
        block('readAloud', { tag: 'RESUME', paragraphs: [''] }),
        block('gmAlert', { tag: 'OPEN THE TABLE:', text: 'Ask: **"What does everyone do before we move on?"** Then run the choices below as player-led scenes.' }),
        block('card', { title: 'Everyone present and their current state', open: true, items: [] }),
        block('card', { title: 'What the party found', items: [] }),
        block('card', { title: 'Exact text available to the players', items: [], quotes: [] }),
        block('card', { title: 'Available NPC beats', items: [] }),
        block('gmNote', { tag: 'DO NOT AUTOMATE THE PARTY:', text: 'Let the players choose. The next scene does not begin until they move.' }),
        block('choices', { options: [opt('They do one last thing'), opt('They revisit what they found'), opt('They approach the way forward'), opt('They go straight through')] }),
      ];
    case 'conversation': {
      const d = createDirector(npc || 'the NPC');
      return [
        block('gmAlert', { tag: 'SCENE SHAPE:', text: `${npc || 'The NPC'} speaks first. The players respond. Open the closest node in the director, answer from it, show one room reaction, then return to "What did the players do?"` }),
        block('readAloud', { tag: 'ARRIVAL', paragraphs: [''] }),
        block('gmNote', { text: 'Stop after the opening. Ask the table: **"What do you do?"** Do not begin a second speech until someone responds.' }),
        block('director', { director: d }),
      ];
    }
    case 'combat':
      return [
        block('combat', { combat: createCombat() }),
      ];
    case 'endings':
      return [
        block('choices', {
          variant: 'endings',
          prompt: 'Click the outcome. Each card says what happens and where to go next.',
          options: [opt('A. They succeed'), opt('B. Partial success'), opt('C. They fail / withdraw')],
        }),
      ];
    case 'resolution':
      return [
        block('readAloud', { paragraphs: [''] }),
        block('list', { title: 'GM -- REWARDS:', items: [] }),
        block('list', { title: 'GM -- SEEDS PLANTED (they finish growing after the module):', items: [] }),
        block('list', { title: 'GM -- CONSEQUENCE LEDGER (what the other threads did meanwhile):', items: [] }),
      ];
    default:
      return [
        block('readAloud', { paragraphs: [''] }),
        block('gmNote', { text: '' }),
      ];
  }
}

export function createSceneOfKind(kind: SceneKind, title: string, moduleId?: string, npc?: string): SceneNode {
  const meta = KIND_META[kind];
  return createScene({
    title, kind, moduleId, type: meta.type, accent: meta.accent,
    label: kind === 'endings' ? 'How it ends' : undefined,
    blocks: templateBlocks(kind, npc),
  });
}

/* ------------------------------------------------------------------ *
 * Tier-table roll
 * ------------------------------------------------------------------ */

export function rollD20(): number { return Math.floor(Math.random() * 20) + 1; }

export function tierFor(table: TierTable, roll: number) {
  return table.tiers.find((t) => roll >= t.min && roll <= t.max);
}

/* ------------------------------------------------------------------ *
 * Preflight linter — the runsheet build checklist
 * ------------------------------------------------------------------ */

const blank = (s?: string) => !s || !s.trim();

export function lintModuleV2(module: CampaignModule): string[] {
  const w: string[] = [];
  const scenes = module.scenes;
  if (scenes.length === 0) w.push('No scenes yet.');
  const ids = new Set(scenes.map((s) => s.id));

  (module.tierTables ?? []).forEach((t) => {
    const cover = new Array(21).fill(0);
    t.tiers.forEach((r) => { for (let i = Math.max(1, r.min); i <= Math.min(20, r.max); i++) cover[i]++; });
    const gaps = cover.slice(1).map((c, i) => (c === 0 ? i + 1 : 0)).filter(Boolean);
    const overlaps = cover.slice(1).map((c, i) => (c > 1 ? i + 1 : 0)).filter(Boolean);
    if (gaps.length) w.push(`Roll table "${t.name}": no result for ${gaps.join(', ')} on the d20.`);
    if (overlaps.length) w.push(`Roll table "${t.name}": ${overlaps.join(', ')} land in two tiers.`);
    if (t.tiers.some((r) => blank(r.label))) w.push(`Roll table "${t.name}": a tier has no name.`);
  });

  scenes.forEach((s, i) => {
    const n = `Scene ${i + 1} "${s.title}"`;
    const all: SceneBlock[] = [];
    walkBlocks(s.blocks, (b) => all.push(b));
    const kind = s.kind ?? 'scene';

    if (s.blocks.length === 0) w.push(`${n}: empty.`);
    if ((kind === 'scene' || kind === 'opening' || kind === 'resolution' || kind === 'conversation') &&
      !all.some((b) => b.kind === 'readAloud' && b.paragraphs.some((p) => !blank(p)))) {
      w.push(`${n}: no read-aloud (every scene opens with one).`);
    }
    if (s.exits.length === 0 && i < scenes.length - 1 && kind !== 'endings' && !all.some((b) => b.kind === 'exit')) {
      w.push(`${n}: no EXIT. The GM won't know where it leads.`);
    }
    s.exits.forEach((e) => { if (e.targetSceneId && !ids.has(e.targetSceneId)) w.push(`${n}: an exit points at a deleted scene.`); });

    all.forEach((b) => {
      switch (b.kind) {
        case 'readAloud': if (b.paragraphs.every(blank)) w.push(`${n}: an empty read-aloud.`); break;
        case 'gmAlert': case 'gmNote': if (blank(b.text) && !(b.items?.length)) w.push(`${n}: an empty ${b.kind === 'gmAlert' ? 'GM alert' : 'GM note'}${b.tag ? ` (${b.tag})` : ''}.`); break;
        case 'spoken': if (blank(b.line)) w.push(`${n}: ${b.speaker || 'an NPC'} has an empty spoken line.`); break;
        case 'card': if (b.items.length === 0 && !(b.quotes?.length) && blank(b.note)) w.push(`${n}: card "${b.title}" is empty.`); break;
        case 'check': if (DIFFICULTY_PENALTY[b.difficulty] !== b.penalty) w.push(`${n}: check "${b.label ?? b.difficulty}" has a modifier that doesn't match ${b.difficulty}.`); break;
        case 'exit': if (b.targetSceneId && !ids.has(b.targetSceneId)) w.push(`${n}: a jump points at a deleted scene.`); break;
        case 'choices':
          b.options.forEach((o) => { if (o.blocks.length === 0) w.push(`${n}: ${b.variant === 'endings' ? 'ending' : 'choice'} "${o.label}" has nothing in its panel.`); });
          break;
        case 'director': {
          const d = b.director; const nodeIds = new Set(d.nodes.map((x) => x.id));
          if (d.mustSay.length === 0) w.push(`${n}: ${d.npc}'s director has no must-say lines (the red banner). Fine if there truly are none.`);
          d.nodes.forEach((x) => {
            if (x.id === d.hubNodeId) return;
            if (blank(x.aim) && !(x.anchors?.length) && !(x.info?.length)) w.push(`${n}: director node "${x.title}" is empty.`);
            x.next.forEach((t) => { if (!nodeIds.has(t)) w.push(`${n}: director node "${x.title}" links to a deleted node.`); });
          });
          if (!nodeIds.has(d.hubNodeId)) w.push(`${n}: ${d.npc}'s director lost its hub node.`);
          break;
        }
        case 'combat': {
          const c = b.combat;
          if (c.tierTableId && !(module.tierTables ?? []).some((t) => t.id === c.tierTableId)) w.push(`${n}: combat uses a roll table that was deleted.`);
          c.trackers.forEach((t) => {
            if (t.threshold && t.threshold > t.targets.length) w.push(`${n}: "${t.title}" fires at ${t.threshold} down but has ${t.targets.length} targets.`);
            if (t.threshold && t.triggerBlocks.length === 0) w.push(`${n}: "${t.title}" has a threshold but nothing to run when it fires.`);
          });
          c.triggers.forEach((t) => { if (t.blocks.length === 0) w.push(`${n}: trigger "${t.condition}" has no content.`); });
          break;
        }
      }
    });
  });
  return w;
}
