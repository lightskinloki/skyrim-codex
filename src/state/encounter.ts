// The encounter: one fight, one state object.
//
// Phase 0 of the combat sync work (docs/COMBAT-SYNC-SPEC.md). Everything a live
// fight needs to remember lives here so it can be persisted, projected onto more
// than one screen, and eventually hosted.
//
// Two kinds of state share this object on purpose:
//   - `combatants` — the spec'd model (PCs, NPCs, bosses, summons, companions).
//   - `trackers` / `fields` / `tierRoll` / `log` — the runsheet's existing combat
//     block state, which is what the GM screen actually reads today.
// The second is a projection the first will replace once the player views land.

export type Outcome =
  | 'crit'
  | 'success'
  | 'success_complication'
  | 'fail'
  | 'crit_fail';

export type CombatantKind = 'pc' | 'npc' | 'boss' | 'summon' | 'companion';

export interface Condition {
  id: string;
  label: string;
  rounds?: number;
}

export interface Combatant {
  id: string;
  name: string;
  kind: CombatantKind;
  /** The player who controls this combatant, once claimed. */
  ownerId?: string;
  /** Whose turn this resolves on. Attached combatants never get a turn slot. */
  actsOn?: string;
  /** Last round this summon exists (inclusive); absent means it persists. */
  expiresAtRound?: number;
  controller?: 'player' | 'gm';
  hp: number;
  maxHp: number;
  dr: number;
  /** Rolled at the start of the fight; only unattached combatants need one. */
  initiative?: number;
  /** Tie-breaker for initiative. */
  agility?: number;
  conditions: Condition[];
  pos: { x: number; y: number };
  move: number;
  actions: { major: number; minor: number };
  hidden?: boolean;
}

export interface TurnSlot {
  combatantId: string;
  initiative: number;
  done: boolean;
}

export interface LogEntry {
  id: string;
  at: number;
  kind: 'outcome' | 'damage' | 'condition' | 'turn' | 'world' | 'note';
  combatantId?: string;
  outcome?: Outcome;
  source?: 'physical' | 'app' | 'gm';
  text: string;
}

/** HP for one target inside a runsheet objective tracker. */
export interface TrackerState {
  hp: Record<string, number>;
  down: Record<string, boolean>;
}

export interface TierRoll {
  roll: number;
  label: string;
  effect?: string;
}

export interface EncounterState {
  version: 1;
  id: string;
  moduleId?: string;
  sceneId?: string;
  /** The combat block this encounter was opened from. */
  blockId: string;
  round: number;
  /** Increments on every applied mutation; used to detect gaps across a wire. */
  seq: number;
  ended: boolean;

  combatants: Record<string, Combatant>;
  order: TurnSlot[];
  activeIndex: number;

  trackers: Record<string, TrackerState>;
  fields: Record<string, string>;
  firedTriggers: string[];
  tierRoll: TierRoll | null;
  log: string;
  entries: LogEntry[];
}

export interface EncounterInit {
  blockId: string;
  moduleId?: string;
  sceneId?: string;
  round?: number;
  trackers?: Record<string, TrackerState>;
  fields?: Record<string, string>;
}

export function createEncounter(init: EncounterInit): EncounterState {
  return {
    version: 1,
    id: init.blockId,
    moduleId: init.moduleId,
    sceneId: init.sceneId,
    blockId: init.blockId,
    round: init.round ?? 1,
    seq: 0,
    ended: false,
    combatants: {},
    order: [],
    activeIndex: 0,
    trackers: init.trackers ?? {},
    fields: init.fields ?? {},
    firedTriggers: [],
    tierRoll: null,
    log: '',
    entries: [],
  };
}

// ---------------------------------------------------------------- selectors

/** Turn order: unattached combatants only, highest initiative first. */
export function computeOrder(combatants: Record<string, Combatant>): TurnSlot[] {
  return Object.values(combatants)
    .filter((c) => !c.actsOn)
    .sort((a, b) => {
      const ai = initiativeOf(a);
      const bi = initiativeOf(b);
      if (bi !== ai) return bi - ai;
      const aa = agilityOf(a);
      const ba = agilityOf(b);
      if (ba !== aa) return ba - aa;
      return a.name.localeCompare(b.name);
    })
    .map((c) => ({ combatantId: c.id, initiative: initiativeOf(c), done: false }));
}

/** Attached NPCs (summons, companions) that resolve on this combatant's turn. */
export function attachedTo(
  state: EncounterState,
  combatantId: string,
): Combatant[] {
  return Object.values(state.combatants).filter((c) => c.actsOn === combatantId);
}

export function activeCombatant(state: EncounterState): Combatant | undefined {
  const slot = state.order[state.activeIndex];
  return slot ? state.combatants[slot.combatantId] : undefined;
}

function initiativeOf(c: Combatant): number {
  return c.initiative ?? 0;
}

function agilityOf(c: Combatant): number {
  return c.agility ?? 0;
}

// ------------------------------------------------------------------ actions

export type EncounterAction =
  | { type: 'tracker.seed'; trackers: Record<string, TrackerState> }
  | { type: 'tracker.setHp'; trackerId: string; targetId: string; hp: number }
  | { type: 'tracker.damage'; trackerId: string; targetId: string; amount: number }
  | { type: 'tracker.setDown'; trackerId: string; targetId: string; down: boolean; maxHp: number }
  | { type: 'field.set'; fieldId: string; value: string }
  | { type: 'trigger.toggle'; triggerId: string }
  | { type: 'tier.roll'; roll: number; label: string; effect?: string }
  | { type: 'round.advance' }
  | { type: 'log.set'; text: string }
  | { type: 'combatant.add'; combatant: Combatant }
  | { type: 'combatant.remove'; id: string }
  | { type: 'combatant.damage'; id: string; amount: number; bypassDr?: boolean }
  | { type: 'combatant.heal'; id: string; amount: number }
  | { type: 'condition.add'; id: string; label: string; rounds?: number }
  | { type: 'condition.clear'; id: string; label: string }
  | { type: 'outcome.report'; combatantId: string; outcome: Outcome; source: 'physical' | 'app' | 'gm'; text?: string }
  | { type: 'turn.end' }
  | { type: 'encounter.end' }
  | { type: 'encounter.reset'; init: EncounterInit };

const stamp = () => Date.now();
let logSeq = 0;
const nextLogId = () => `log-${stamp()}-${++logSeq}`;

function apply(state: EncounterState, patch: Partial<EncounterState>): EncounterState {
  return { ...state, ...patch, seq: state.seq + 1 };
}

function withEntry(state: EncounterState, entry: Omit<LogEntry, 'id' | 'at'>): LogEntry[] {
  return [...state.entries, { ...entry, id: nextLogId(), at: stamp() }];
}

export function encounterReducer(
  state: EncounterState,
  action: EncounterAction,
): EncounterState {
  switch (action.type) {
    case 'tracker.seed':
      return apply(state, { trackers: action.trackers });

    case 'tracker.setHp': {
      const t = state.trackers[action.trackerId];
      if (!t) return state;
      const hp = Math.max(0, action.hp);
      return apply(state, {
        trackers: {
          ...state.trackers,
          [action.trackerId]: { hp: { ...t.hp, [action.targetId]: hp }, down: { ...t.down, [action.targetId]: hp <= 0 } },
        },
      });
    }

    case 'tracker.damage': {
      const t = state.trackers[action.trackerId];
      if (!t) return state;
      const hp = Math.max(0, (t.hp[action.targetId] ?? 0) - action.amount);
      return apply(state, {
        trackers: {
          ...state.trackers,
          [action.trackerId]: { hp: { ...t.hp, [action.targetId]: hp }, down: { ...t.down, [action.targetId]: hp <= 0 } },
        },
      });
    }

    case 'tracker.setDown': {
      const t = state.trackers[action.trackerId];
      if (!t) return state;
      return apply(state, {
        trackers: {
          ...state.trackers,
          [action.trackerId]: {
            hp: { ...t.hp, [action.targetId]: action.down ? 0 : action.maxHp },
            down: { ...t.down, [action.targetId]: action.down },
          },
        },
      });
    }

    case 'field.set':
      return apply(state, { fields: { ...state.fields, [action.fieldId]: action.value } });

    case 'trigger.toggle':
      return apply(state, {
        firedTriggers: state.firedTriggers.includes(action.triggerId)
          ? state.firedTriggers.filter((id) => id !== action.triggerId)
          : [...state.firedTriggers, action.triggerId],
      });

    case 'tier.roll':
      return apply(state, { tierRoll: { roll: action.roll, label: action.label, effect: action.effect } });

    case 'log.set':
      return apply(state, { log: action.text });

    case 'round.advance': {
      const round = state.round + 1;
      const combatants: Record<string, Combatant> = {};
      for (const c of Object.values(state.combatants)) {
        if (c.expiresAtRound !== undefined && c.expiresAtRound < round) continue;
        combatants[c.id] = {
          ...c,
          move: (c as Combatant & { baseMove?: number }).baseMove ?? c.move,
          actions: { major: 1, minor: 1 },
        };
      }
      const order = state.order
        .filter((s) => combatants[s.combatantId])
        .map((s) => ({ ...s, done: false }));
      return apply(state, { round, combatants, order, activeIndex: 0 });
    }

    case 'combatant.add': {
      const c = action.combatant;
      const combatants = { ...state.combatants, [c.id]: c };
      const order = c.actsOn ? state.order : computeOrder(combatants);
      const entry = withEntry(state, {
        kind: 'note',
        combatantId: c.id,
        text: `${c.name} joins the encounter${c.actsOn ? ` (on ${state.combatants[c.actsOn]?.name ?? 'its owner'}'s turn)` : ''}.`,
      });
      return apply(state, { combatants, order, entries: entry });
    }

    case 'combatant.remove': {
      const gone = state.combatants[action.id];
      if (!gone) return state;
      const combatants = { ...state.combatants };
      delete combatants[action.id];
      const order = state.order.filter((s) => s.combatantId !== action.id);
      return apply(state, {
        combatants,
        order,
        activeIndex: Math.min(state.activeIndex, Math.max(0, order.length - 1)),
        entries: withEntry(state, { kind: 'note', combatantId: action.id, text: `${gone.name} leaves the encounter.` }),
      });
    }

    case 'combatant.damage': {
      const c = state.combatants[action.id];
      if (!c) return state;
      const dealt = Math.max(0, action.bypassDr ? action.amount : action.amount - c.dr);
      const hp = Math.max(0, c.hp - dealt);
      const note = action.bypassDr
        ? `${c.name} takes ${dealt}.`
        : `${c.name} takes ${action.amount} → ${dealt} after DR ${c.dr}.`;
      return apply(state, {
        combatants: { ...state.combatants, [action.id]: { ...c, hp } },
        entries: withEntry(state, { kind: 'damage', combatantId: action.id, text: note }),
      });
    }

    case 'combatant.heal': {
      const c = state.combatants[action.id];
      if (!c) return state;
      const hp = Math.min(c.maxHp, c.hp + action.amount);
      return apply(state, {
        combatants: { ...state.combatants, [action.id]: { ...c, hp } },
        entries: withEntry(state, { kind: 'damage', combatantId: action.id, text: `${c.name} heals ${hp - c.hp}.` }),
      });
    }

    case 'condition.add': {
      const c = state.combatants[action.id];
      if (!c) return state;
      const condition: Condition = { id: `${action.label}-${stamp()}`, label: action.label, rounds: action.rounds };
      return apply(state, {
        combatants: { ...state.combatants, [action.id]: { ...c, conditions: [...c.conditions, condition] } },
        entries: withEntry(state, { kind: 'condition', combatantId: action.id, text: `${c.name} is ${action.label}.` }),
      });
    }

    case 'condition.clear': {
      const c = state.combatants[action.id];
      if (!c) return state;
      return apply(state, {
        combatants: {
          ...state.combatants,
          [action.id]: { ...c, conditions: c.conditions.filter((x) => x.label !== action.label) },
        },
      });
    }

    case 'outcome.report': {
      const c = state.combatants[action.combatantId];
      if (!c) return state;
      return apply(state, {
        entries: withEntry(state, {
          kind: 'outcome',
          combatantId: action.combatantId,
          outcome: action.outcome,
          source: action.source,
          text: action.text ?? `${c.name}: ${action.outcome.replace('_', ' ')}`,
        }),
      });
    }

    case 'turn.end': {
      const order = state.order.map((s, i) => (i === state.activeIndex ? { ...s, done: true } : s));
      const next = order.findIndex((s, i) => !s.done && i > state.activeIndex);
      const wrap = order.findIndex((s) => !s.done);
      const activeIndex = next >= 0 ? next : wrap >= 0 ? wrap : state.activeIndex;
      return apply(state, { order, activeIndex });
    }

    case 'encounter.end':
      return apply(state, { ended: true });

    case 'encounter.reset':
      // Explicit, never implicit: the only way a live fight goes back to full.
      return { ...createEncounter(action.init), seq: state.seq + 1 };

    default:
      return state;
  }
}
