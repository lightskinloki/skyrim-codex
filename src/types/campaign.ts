// Campaign & lore-graph types for the GM Campaign Suite.
//
// Versioned from day one — these shapes are consumed by export/import
// (Privacy-by-Design), and later by the AI layer, DLC ingestion, and the
// Electron build. Bump CAMPAIGN_SCHEMA_VERSION and add a migration when a
// persisted shape changes.
//
// See docs/GM-CAMPAIGN-SUITE.md (§3 the one primitive, §6 scene schema) and
// docs/LOREWEB-PORT-SPEC.md (web.json shapes).

// v2 (2026-09-29): scenes carry ordered `blocks`; the v1 buckets (readAloud,
// gmNotes, bullets, npcs, checks, findables) are folded in by migrateScene().
export const CAMPAIGN_SCHEMA_VERSION = 2;

/* ============================================================
 * The one primitive: the tagged, linked node
 * ============================================================ */

export type NodeScope = 'core' | 'campaign';

/** Known node kinds. Free strings tolerated for forward-compat. */
export type NodeType =
  | 'pc' | 'npc' | 'location' | 'faction' | 'item' | 'concept'
  | 'artifact' | 'clock' | 'secret' | 'scene' | 'module'
  | 'enemy' | 'spell' | 'equipment' | 'standing-stone' | 'race' | 'skill'
  | (string & {});

export interface GraphNode {
  id: string;
  scope: NodeScope;
  type: NodeType;
  name: string;
  aliases?: string[];
  tags: string[];
  /** Type-specific data for campaign nodes. */
  payload?: Record<string, unknown>;
  /** For CORE nodes: pointer to the source data (e.g. "enemies:bandit"). */
  payloadRef?: string;
  schemaVersion: number;
}

export interface GraphEdge {
  id: string;
  src: string;   // GraphNode id (or the literal "party")
  type: string;  // free string; the viewer colours by class (matches web.json)
  dst: string;   // GraphNode id (or the literal "party")
  why: string;
  /** Provenance: the file/scene the edge was authored or harvested from. */
  from?: string;
  schemaVersion: number;
}

/* ============================================================
 * Lore-web build (port of _build_web.py) — see LOREWEB-PORT-SPEC.md
 * ============================================================ */

export interface RegistryEntity {
  id: string;
  name: string;
  type: string;
  aliases: string[];
  tags: string[];
}

export interface WebEdge {
  src: string;
  type: string;
  dst: string;
  why: string;
  from?: string;
}

/** annotations.json secrets are free-form; keep permissive. */
export type Secret = Record<string, unknown>;

export interface CoocEdge { a: string; b: string; w: number; }

export interface Candidate {
  a: string;
  b: string;
  sharedTags: string[];
  cooc: number;
  score: number;
}

export interface LoreWebData {
  built: string;
  readme_for_ai: string;
  entities: RegistryEntity[];
  edges: WebEdge[];
  secrets: Secret[];
  mentions: Record<string, Record<string, number>>;
  snippets: Record<string, Record<string, string>>;
  cooc: CoocEdge[];
  candidates: Candidate[];
}

export interface AnnotationsFile {
  edges: WebEdge[];
  secrets: Secret[];
}

/* ============================================================
 * Scene-node schema (§6) — the session-sheet format, as data
 * ============================================================ */

export type SceneType = 'set-piece' | 'character' | 'social' | 'combat' | 'interlude';

// THE unified difficulty ladder (July 2026 rules consolidation): the GM sets a
// DIFFICULTY, never a fixed target number. Very Easy +4 / Easy +2 / Standard 0 /
// Hard -4 / Very Hard -6 / Nearly Impossible -8 / Impossible -14 / Mythic -20.
// Mythic (-20) is the HARD CEILING for task difficulty; only the Contest
// Level-Gap Penalty (will-vs-will power gaps) may exceed it.
export type Difficulty =
  | 'Very Easy' | 'Easy' | 'Standard' | 'Hard' | 'Very Hard' | 'Nearly Impossible'
  | 'Impossible' | 'Mythic';

export const DIFFICULTY_PENALTY: Record<Difficulty, number> = {
  'Very Easy': 4,
  'Easy': 2,
  'Standard': 0,
  'Hard': -4,
  'Very Hard': -6,
  'Nearly Impossible': -8,
  'Impossible': -14,
  'Mythic': -20,
};

export type CheckStat = 'might' | 'agility' | 'magic' | 'guile' | 'none';

export interface SceneCheck {
  id: string;
  stat: CheckStat;
  difficulty: Difficulty;
  penalty: number;       // e.g. -4 for Hard
  label?: string;        // raw text, e.g. "Hard Guile (-4) to spot the ledger"
}

export interface Findable {
  id: string;
  name: string;
  description: string;
  readAloud?: string;
  resolved: boolean;
  nodeId?: string;       // resolves to a GraphNode (item) when authored as such
}

export interface NpcReaction { action: string; response: string; }

export interface SceneNpc {
  id: string;
  name: string;
  nodeId?: string;       // resolves to a GraphNode (npc)
  line?: string;
  reactions?: NpcReaction[];
}

export interface ExitLink {
  id: string;
  description: string;
  targetSceneId?: string; // may be empty/dangling until authored
  branchLabel?: string;   // e.g. "Gate-3 fires" / "if discovered"
}

/* ------------------------------------------------------------
 * v2: ordered scene blocks — the runsheet format as data.
 *
 * Modeled one-to-one on the HTML console runsheet that ran Fire B on
 * 2026-09-28 (FIRE_B_SESSION_RUNSHEET.html + GAELEN_CONVERSATION_DIRECTOR.html):
 * a scene is an ORDERED list of blocks, so a spoken line sits between the two
 * read-aloud paragraphs it belongs between (congress synthesis step 6). Text
 * fields accept light inline markup: **bold** and *italic*.
 * ------------------------------------------------------------ */

/** Wizard template a scene was built from. Drives which questions the Forge asks. */
export type SceneKind = 'opening' | 'scene' | 'conversation' | 'combat' | 'endings' | 'resolution';

export type BranchTone = 'red' | 'green' | 'gold' | 'blue' | 'neutral';

export interface BlockBase { id: string; }

/** Blue serif block, spoken cold at the table. `tone: 'danger'` = red edge (failure read-alouds). */
export interface ReadAloudBlock extends BlockBase { kind: 'readAloud'; tag?: string; paragraphs: string[]; tone?: 'danger'; }
/** Maroon GM-only note. `tag` replaces the default "GM:" label (e.g. "DO NOT AUTOMATE THE PARTY:"). */
export interface GmNoteBlock extends BlockBase { kind: 'gmNote'; tag?: string; text: string; items?: string[]; }
/** Red GM alert (START HERE / OPEN THE TABLE / SCENE SHAPE / OBJECTIVE ...). */
export interface GmAlertBlock extends BlockBase { kind: 'gmAlert'; tag?: string; text: string; items?: string[]; }
/** Full-width red banner: "GM: STOP. Turn to Saijah's player..." */
export interface StopBlock extends BlockBase { kind: 'stop'; text: string; }
/** Gold spoken NPC line. `direction` = the parenthetical stage direction after the name. */
export interface SpokenBlock extends BlockBase { kind: 'spoken'; speaker: string; direction?: string; line: string; tone?: BranchTone; }
/** In-world document / handout text (brown edge). */
export interface HandoutBlock extends BlockBase { kind: 'handout'; title: string; text: string; }
export interface ListBlock extends BlockBase { kind: 'list'; title?: string; items: string[]; ordered?: boolean; }
/** Plain paragraph; `small` = the grey source/citation line. */
export interface TextBlock extends BlockBase { kind: 'text'; text: string; small?: boolean; }
/** Sub-heading inside a scene or branch (the numbered "1. THE CRASH & THE DROP:" heads). */
export interface HeadingBlock extends BlockBase { kind: 'heading'; text: string; tone?: BranchTone; }
/** Gold-edged exact quotes (journal text, voice lines to read verbatim). */
export interface QuoteBlock extends BlockBase { kind: 'quote'; lines: string[]; }
/** Collapsible reference card (the vault-bridge "state cards"). */
export interface CardBlock extends BlockBase { kind: 'card'; title: string; open?: boolean; items: string[]; quotes?: string[]; note?: string; }
/** Always-visible branch box (=== BRANCH A: ... ===) with nested content. */
export interface BranchBlock extends BlockBase { kind: 'branch'; title: string; tag?: string; tone: BranchTone; blocks: SceneBlock[]; }
/** Button row → one panel open at a time. `variant: 'endings'` = the "pick the ending they reached" selector. */
export interface ChoicesBlock extends BlockBase { kind: 'choices'; prompt?: string; variant?: 'choices' | 'endings'; options: ChoiceOption[]; }
export interface ChoiceOption {
  id: string;
  label: string;           // button text: "They approach the doors" / "A. Three anchors down"
  heading?: string;        // panel heading (defaults to label)
  planned?: boolean;       // endings: PLANNED (sourced) vs improvised
  source?: string;         // endings: "module 1943-1954"
  blocks: SceneBlock[];
}
/** A roll the GM calls for: a DIFFICULTY applied to the player's own stat, never a target number. */
export interface CheckBlock extends BlockBase { kind: 'check'; stat: CheckStat; difficulty: Difficulty; penalty: number; label?: string; }
export interface FindableBlock extends BlockBase { kind: 'findable'; name: string; description: string; readAloud?: string; nodeId?: string; }
/** Inline jump (inside a choice or ending panel) to another scene. */
export interface ExitBlock extends BlockBase { kind: 'exit'; description: string; targetSceneId?: string; label?: string; }
export interface DirectorBlock extends BlockBase { kind: 'director'; director: ConversationDirector; }
export interface CombatBlock extends BlockBase { kind: 'combat'; combat: CombatManager; }

export type SceneBlock =
  | ReadAloudBlock | GmNoteBlock | GmAlertBlock | StopBlock | SpokenBlock | HandoutBlock
  | ListBlock | TextBlock | HeadingBlock | QuoteBlock | CardBlock | BranchBlock | ChoicesBlock
  | CheckBlock | FindableBlock | ExitBlock | DirectorBlock | CombatBlock;

export type SceneBlockKind = SceneBlock['kind'];

/* ---------- Conversation director (the NPC flowchart) ---------- */

export interface VoiceAnchor {
  text: string;
  /** SOURCE = quoted from a canon doc (cite `ref`); DRAFT = written for this scene. */
  source: 'SOURCE' | 'DRAFT';
  ref?: string;
}

export interface DirectorReply { say: string; ans: string; }

export interface DirectorNode {
  id: string;
  group: string;            // DirectorGroup id
  title: string;            // the TYPE of thing the players did, never a verbatim phrase
  intent?: string;          // what it looks like at the table
  aim?: string;             // "<NPC>'s aim"
  must?: string[];          // must-say / must-do at this node
  anchors?: VoiceAnchor[];  // how they sound
  info?: string[];          // what's true / what they know
  perf?: string[];          // performance
  replies?: DirectorReply[];// "If they say... → what they have"
  room?: string;            // room reacts
  points?: string[];        // coverage checklist ("Covered this run")
  next: string[];           // node ids
}

export interface DirectorGroup { id: string; label: string; exit?: boolean; }

export interface ConversationDirector {
  npc: string;              // "Gaelen"
  title?: string;           // header, defaults to "<npc> — Conversation Director"
  mustSay: string[];        // the red banner: the only exact lines
  mustSayNote?: string;     // "Everything else: your own words. ..."
  always: string[];         // constant performance rules (footer)
  beatsLabel?: string;      // "Ritual beat"
  beats: string[];          // pick-one-per-exchange menu
  groups: DirectorGroup[];
  startNodeId: string;
  hubNodeId: string;
  nodes: DirectorNode[];    // ordered
}

/* ---------- Combat manager ---------- */

export interface StatusField { id: string; label: string; initial: string; }

export interface TrackerTarget { id: string; label: string; maxHp: number; }

/** HP objectives with a threshold trigger (Fire B: five anchors, three down disrupts). */
export interface ObjectiveTracker {
  id: string;
  title: string;
  description?: string;
  targets: TrackerTarget[];
  quickDamage: number[];       // one-click damage buttons, e.g. [10, 100]
  threshold?: number;          // how many down fires the trigger
  thresholdText?: string;      // banner shown when the threshold is reached
  triggerBlocks: SceneBlock[]; // what to run at threshold (the escape read-aloud)
}

export interface CombatCard {
  id: string;
  title: string;
  controller?: 'gm' | 'player';  // 'player' = a guest/player runs this combatant
  items: string[];
  ordered?: boolean;             // priorities list
  statLine?: string;
  quote?: string;
  fields?: StatusField[];        // per-station trackers
}

/** A condition card (Saijah hits 0 HP → Hircine's offer; Jasper's second 0 HP). */
export interface CombatTrigger { id: string; condition: string; blocks: SceneBlock[]; }

export interface CombatManager {
  title: string;
  objective?: string;
  handout?: { title: string; note?: string; items: string[] };
  statusFields: StatusField[];     // Round is built in
  trackers: ObjectiveTracker[];
  tierTableId?: string;            // per-turn table rolled on "Advance round"
  tierNote?: string;
  cards: CombatCard[];
  triggers: CombatTrigger[];
  enemies: string[];               // EnemyTemplate ids → Deploy to the combat tracker
}

/* ---------- Roll tables (d20 only) ---------- */

export interface TierRange { min: number; max: number; label: string; effect?: string; }

/** A module-specific d20 table (Zone 3 Tempo). FROGS is d20-only. */
export interface TierTable { id: string; name: string; tiers: TierRange[]; critNote?: string; }

export interface SceneNode {
  id: string;
  moduleId?: string;
  title: string;
  subtitle?: string;
  type: SceneType;
  kind?: SceneKind;
  label?: string;          // the small maroon line above the title ("Scene 22 — Live Dialogue Director")
  navNote?: string;        // sidebar second line (defaults to subtitle)
  accent?: 'gold' | 'red'; // top border
  blocks: SceneBlock[];    // v2: the ordered content
  enemies: string[];       // EnemyTemplate ids → launch combat
  exits: ExitLink[];       // the footer EXIT line(s)
  tags: string[];
  // v1 buckets: still read on import (markdown/JSON); migrateScene() folds them into blocks.
  readAloud?: string[];
  gmNotes?: string[];
  bullets?: string[];
  findables?: Findable[];
  npcs?: SceneNpc[];
  checks?: SceneCheck[];
  combatStateSnapshot?: unknown; // saved combat state if the scene was left mid-fight
  schemaVersion: number;
}

export interface CampaignModule {
  id: string;
  name: string;
  description?: string;    // masthead line ("Tonight's starting point: ...")
  badge?: string;          // masthead badge
  navTitle?: string;       // sidebar group title ("TONIGHT: VAULT → SCENE 22")
  tierTables?: TierTable[];
  scenes: SceneNode[];     // ordered; branches expressed via exits[].targetSceneId
  sourcePath?: string;     // markdown file it was compiled from (if any)
  schemaVersion: number;
}

/* ============================================================
 * Clocks & beats
 * ============================================================ */

export interface CampaignClock {
  id: string;
  name: string;
  maxSegments: number;
  currentSegments: number;
  color?: string;
  notes?: string;
}

export interface StoryBeat {
  id: string;
  title: string;
  completed: boolean;
  notes?: string;
}

/* ============================================================
 * Persisted campaign + runtime state
 * ============================================================ */

export interface Campaign {
  id: string;
  name: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  modules: CampaignModule[];
  clocks: CampaignClock[];
  storyBeats: StoryBeat[];
  secrets: Secret[];
  updatedAt: string;
  schemaVersion: number;
}

/** Ephemeral runtime state (not persisted with the campaign). */
export interface CampaignRuntimeState {
  folderMounted: boolean;
  activeModuleId: string | null;
  activeSceneIndex: number;
}

export function createEmptyCampaign(name = 'New Campaign'): Campaign {
  return {
    id: crypto.randomUUID(),
    name,
    nodes: [],
    edges: [],
    modules: [],
    clocks: [],
    storyBeats: [],
    secrets: [],
    updatedAt: new Date().toISOString(),
    schemaVersion: CAMPAIGN_SCHEMA_VERSION,
  };
}

export function createScene(partial: Partial<SceneNode> = {}): SceneNode {
  return {
    id: crypto.randomUUID(),
    title: 'Untitled Scene',
    type: 'set-piece',
    kind: 'scene',
    blocks: [],
    enemies: [],
    exits: [],
    tags: [],
    schemaVersion: CAMPAIGN_SCHEMA_VERSION,
    ...partial,
  };
}
