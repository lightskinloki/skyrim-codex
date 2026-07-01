// Campaign & lore-graph types for the GM Campaign Suite.
//
// Versioned from day one — these shapes are consumed by export/import
// (Privacy-by-Design), and later by the AI layer, DLC ingestion, and the
// Electron build. Bump CAMPAIGN_SCHEMA_VERSION and add a migration when a
// persisted shape changes.
//
// See docs/GM-CAMPAIGN-SUITE.md (§3 the one primitive, §6 scene schema) and
// docs/LOREWEB-PORT-SPEC.md (web.json shapes).

export const CAMPAIGN_SCHEMA_VERSION = 1;

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

export interface SceneNode {
  id: string;
  moduleId?: string;
  title: string;
  subtitle?: string;
  type: SceneType;
  readAloud: string[];   // paragraphs (the blue player-facing block)
  gmNotes: string[];
  bullets: string[];
  findables: Findable[];
  npcs: SceneNpc[];
  checks: SceneCheck[];
  enemies: string[];     // EnemyTemplate ids → launch combat
  exits: ExitLink[];
  tags: string[];
  combatStateSnapshot?: unknown; // saved combat state if the scene was left mid-fight
  schemaVersion: number;
}

export interface CampaignModule {
  id: string;
  name: string;
  description?: string;
  scenes: SceneNode[];   // ordered; branches expressed via exits[].targetSceneId
  sourcePath?: string;   // markdown file it was compiled from (if any)
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
    readAloud: [],
    gmNotes: [],
    bullets: [],
    findables: [],
    npcs: [],
    checks: [],
    enemies: [],
    exits: [],
    tags: [],
    schemaVersion: CAMPAIGN_SCHEMA_VERSION,
    ...partial,
  };
}
