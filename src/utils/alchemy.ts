import { findIngredient } from '@/data/alchemy';
import {
  BrewEffect,
  BrewEntry,
  Essence,
  EssenceTier,
  ExpressedEssence,
  Ingredient,
  OPPOSITION_PAIRS,
  OppositionFinding,
  Quality,
  Tier,
} from '@/types/alchemy';

/**
 * The Essence engine. Deterministic on purpose — every ruling here is a lookup
 * or a comparison from "Alchemy GM Reference". Nothing in this file guesses,
 * and nothing asks the GM what the player intended: ingredients with more than
 * one expression produce more than one reading, and the mix decides which
 * reading is live.
 */

const TIER_STRENGTH: Record<Tier, number> = { P: 3, S: 2, T: 1, Q: 0 };

const TIER_NAME: Record<Tier, string> = {
  P: 'Primary',
  S: 'Secondary',
  T: 'Tertiary',
  Q: 'Quaternary',
};

/**
 * Section 3, "HOW TO DETERMINE NEGATION TIER": read down to the first match.
 * Both primary collapses; otherwise the weaker of the two tiers sets the severity.
 */
export function negationSeverity(a: Tier, b: Tier): 'primary' | 'secondary' | 'tertiary' {
  const weakest = Math.min(TIER_STRENGTH[a], TIER_STRENGTH[b]);
  if (weakest >= 3) return 'primary';
  if (weakest === 2) return 'secondary';
  return 'tertiary';
}

function opposes(a: Essence, b: Essence): boolean {
  return OPPOSITION_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

export interface BrewFlag {
  kind:
    | 'collapse'
    | 'paralysis'
    | 'diluted'
    | 'unknown'
    | 'sapient'
    | 'special'
    | 'single-ingredient'
    | 'resistance'
    | 'legendary'
    | 'quaternary'
    | 'internal-conflict';
  text: string;
}

export interface ResolvedEntry {
  name: string;
  ingredient?: Ingredient;
  copies: number;
  reading: string;
  essences: readonly EssenceTier[];
}

export interface BrewReading {
  /** 'base' plus any variant labels applied, for display. */
  label: string;
  entries: ResolvedEntry[];
  unknownNames: string[];
  pairCount: number;
  findings: OppositionFinding[];
  collapsed: boolean;
  expressed: ExpressedEssence[];
  effects: BrewEffect[];
  flags: BrewFlag[];
  /** Higher is a better fit for the mix. Collapsed readings always score lowest. */
  applicability: number;
  mostApplicable: boolean;
}

function readingOptions(ingredient: Ingredient): { label: string; essences: readonly EssenceTier[] }[] {
  const options = [{ label: 'base', essences: ingredient.essences }];
  for (const variant of ingredient.variants ?? []) {
    options.push({ label: variant.label, essences: variant.essences });
  }
  return options;
}

function cartesian<T>(lists: T[][]): T[][] {
  return lists.reduce<T[][]>((acc, list) => acc.flatMap(prefix => list.map(item => [...prefix, item])), [[]]);
}

function countPairs(count: number): number {
  return (count * (count - 1)) / 2;
}

function effectsFor(
  essence: Essence,
  quality: Quality,
  options?: { hasElemental?: boolean },
): BrewEffect | null {
  const tier: 'standard' | 'potent' | 'exceptional' =
    quality === 'Potent' ? 'potent' : quality === 'Exceptional' ? 'exceptional' : 'standard';

  // FORTITAS has two readings. Alone it hardens: flat DR. Alongside an elemental
  // Essence it becomes resistance to that element and halves the damage instead.
  // Both come from "Ismara's Note One -- Mechanics Companion", the plain rules
  // handout; the GM Reference's Fire Salts / Frost Salts notes say the same thing.
  const fortitas: Record<typeof tier, string> = options?.hasElemental
    ? {
        standard: 'half damage from the source, 3 rounds',
        potent: 'half damage, 6 rounds',
        exceptional: 'immune to one hit, then half, 6 rounds',
      }
    : {
        standard: '+1 DR, 3 rounds',
        potent: '+2 DR, 3 rounds',
        exceptional: '+2 DR, 6 rounds',
      };

  const table: Record<Essence, Record<typeof tier, string>> = {
    VITALIS: { standard: '4 HP restored', potent: '8 HP restored', exceptional: '12 HP restored' },
    VENITAS: { standard: '2 damage', potent: '4 damage', exceptional: '6 damage' },
    GRAVITAS: { standard: 'loses next Minor Action (1 round)', potent: '2 rounds', exceptional: '3 rounds' },
    AGILITAS: { standard: '+2 Agility TN, 3 rounds', potent: '+2 Agility TN, 6 rounds', exceptional: '+4 Agility TN, 6 rounds' },
    CAECITAS: { standard: 'invisible 3 rounds', potent: 'invisible 6 rounds', exceptional: 'invisible 6 rounds, undetectable by magic' },
    FORTITAS: fortitas,
    ANIMA: { standard: '4 FP restored', potent: '8 FP restored', exceptional: '12 FP restored' },
    IGNIS: { standard: '3 fire damage', potent: '6 fire damage', exceptional: '9 fire damage' },
    GLACIES: { standard: '3 frost damage, no FP recovery (1 round)', potent: '6 frost damage, no FP recovery (2 rounds)', exceptional: '9 frost damage, no FP recovery (3 rounds)' },
    FULGUR: {
      standard: '3 shock damage, disadvantage on next action',
      potent: '6 shock damage, disadvantage on next action',
      exceptional: '9 shock damage, disadvantage on next action',
    },
  };

  const label = table[essence][tier];
  if (!label) return null;
  return { essence, label, value: label };
}

/** Builds every internally-consistent reading of one brew. */
export function readBrew(entries: readonly BrewEntry[], options?: { quality?: Quality }): BrewReading[] {
  const quality = options?.quality ?? 'Standard';
  const resolved = entries.map(entry => {
    const ingredient = findIngredient(entry.name);
    const copies = Math.max(1, Math.round(entry.copies ?? 1));
    return { entry, ingredient, copies };
  });

  // Expand variant choices. Ingredients without variants contribute a single option.
  const optionLists = resolved.map(item =>
    item.ingredient
      ? readingOptions(item.ingredient)
      : [{ label: 'unknown', essences: [] as readonly EssenceTier[] }],
  );

  const combinations = cartesian(optionLists).slice(0, 16);

  const readings = combinations.map(combo => {
    const combos = resolved.map((item, index) => ({ ...item, reading: combo[index] }));
    return buildReading(combos, quality);
  });

  const best = readings.reduce(
    (top, reading) => (reading.applicability > top.applicability ? reading : top),
    readings[0],
  );

  return readings.map(reading => ({ ...reading, mostApplicable: reading === best && !reading.collapsed }));
}

function buildReading(
  resolved: { entry: BrewEntry; ingredient?: Ingredient; copies: number; reading: { label: string; essences: readonly EssenceTier[] } }[],
  quality: Quality,
): BrewReading {
  const entries: ResolvedEntry[] = resolved.map(item => ({
    name: item.ingredient?.name ?? item.entry.name,
    ingredient: item.ingredient,
    copies: item.copies,
    reading: item.reading.label,
    essences: item.reading.essences,
  }));

  const unknownNames = entries.filter(e => !e.ingredient).map(e => e.name);
  const flags: BrewFlag[] = [];

  for (const name of unknownNames) {
    flags.push({
      kind: 'unknown',
      text: `${name} is not in the catalogue. Ask what it does in the world: dominant behaviour is Primary, the rest are Secondaries.`,
    });
  }

  const findings: OppositionFinding[] = [];

  // ── Internal opposition: conflicts the reference rules inside one ingredient
  // These are declared per ingredient (`internalWeakened`), never inferred: the
  // ladder in Section 3 is checked between ingredients, and an ingredient whose
  // own Essences oppose is called out by name in the catalogue. An Essence its
  // own ingredient cancels never reaches the pot, so it takes no part in the
  // cross-ingredient check either.
  const internalWeakenedAt = new Map<number, Set<Essence>>();
  entries.forEach((entry, index) => {
    const declared = entry.ingredient?.internalWeakened;
    if (!declared?.length) return;
    const seen = new Set<string>();
    for (const [essenceA, tierA] of entry.essences) {
      for (const [essenceB, tierB] of entry.essences) {
        if (!opposes(essenceA, essenceB)) continue;
        if (!declared.includes(essenceA) && !declared.includes(essenceB)) continue;
        const key = [essenceA, essenceB].sort().join('|');
        if (seen.has(key)) continue;
        seen.add(key);
        findings.push({
          a: entry.name,
          b: entry.name,
          essenceA,
          tierA,
          essenceB,
          tierB,
          severity: negationSeverity(tierA, tierB),
          internal: true,
        });
        const weakened = internalWeakenedAt.get(index) ?? new Set<Essence>();
        if (declared.includes(essenceA)) weakened.add(essenceA);
        if (declared.includes(essenceB)) weakened.add(essenceB);
        internalWeakenedAt.set(index, weakened);
      }
    }
  });

  // ── Opposition: every cross-ingredient pair, every opposing Essence ─────
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      const a = entries[i];
      const b = entries[j];
      for (const [essenceA, tierA] of a.essences) {
        if (internalWeakenedAt.get(i)?.has(essenceA)) continue;
        for (const [essenceB, tierB] of b.essences) {
          if (internalWeakenedAt.get(j)?.has(essenceB)) continue;
          if (!opposes(essenceA, essenceB)) continue;
          findings.push({
            a: a.name,
            b: b.name,
            essenceA,
            tierA,
            essenceB,
            tierB,
            severity: negationSeverity(tierA, tierB),
            internal: false,
          });
        }
      }
    }
  }

  const collapsed = findings.some(f => f.severity === 'primary');
  if (collapsed) {
    flags.push({
      kind: 'collapse',
      text: 'Primary Negation. The brew collapses — no product, ingredients wasted. This is a hard stop regardless of anything else in the pot.',
    });
  }

  // ── What survives into the compound ────────────────────────────────────
  // Only cross-ingredient findings weaken an Essence across the whole brew.
  // An internal conflict weakens that one ingredient's contribution, so it is
  // resolved per source below rather than smeared over every source of the Essence.
  const suppressed = new Map<Essence, 'significantly' | 'minor'>();
  for (const finding of findings) {
    if (finding.internal) continue;
    if (finding.severity === 'secondary') {
      suppressed.set(finding.essenceA, 'significantly');
      suppressed.set(finding.essenceB, 'significantly');
    } else if (finding.severity === 'tertiary') {
      if (!suppressed.has(finding.essenceA)) suppressed.set(finding.essenceA, 'minor');
      if (!suppressed.has(finding.essenceB)) suppressed.set(finding.essenceB, 'minor');
    }
  }

  const expressed: ExpressedEssence[] = [];
  if (!collapsed) {
    const byEssence = new Map<
      Essence,
      { tier: Tier; sources: string[]; copies: number; cleanCopies: number }
    >();

    entries.forEach((entry, index) => {
      // A single-ingredient compound releases the Primary only (Section 9).
      const usable =
        entries.length === 1 ? entry.essences.filter(([, tier]) => tier === 'P') : entry.essences;
      const conflicted = internalWeakenedAt.get(index);

      for (const [essence, tier] of usable) {
        const selfWeakened = conflicted?.has(essence) ?? false;
        const existing = byEssence.get(essence);
        if (!existing) {
          byEssence.set(essence, {
            tier,
            sources: [entry.name],
            copies: entry.copies,
            cleanCopies: selfWeakened ? 0 : entry.copies,
          });
          continue;
        }
        existing.sources.push(entry.name);
        existing.copies += entry.copies;
        if (!selfWeakened) existing.cleanCopies += entry.copies;
        if (TIER_STRENGTH[tier] > TIER_STRENGTH[existing.tier]) existing.tier = tier;
      }
    });

    for (const [essence, data] of byEssence) {
      const external = suppressed.get(essence);
      // An Essence every source of which contradicts itself is significantly weakened;
      // one clean source carrying the same Essence is enough to rescue it.
      const weakened: ExpressedEssence['weakened'] =
        external === 'significantly' || data.cleanCopies === 0
          ? 'significantly'
          : external === 'minor'
            ? 'minor'
            : 'none';

      expressed.push({
        essence,
        tier: data.tier,
        sources: data.sources,
        copies: data.copies,
        amplified: data.sources.length > 1 || data.copies > 1,
        weakened,
      });
    }

    expressed.sort((x, y) => TIER_STRENGTH[y.tier] - TIER_STRENGTH[x.tier] || x.essence.localeCompare(y.essence));
  }

  // ── Paralysis: extreme unopposed AGILITAS ──────────────────────────────
  // Counted from the ingredients themselves so one source cannot inflate its
  // own weight by being doubled in the pot.
  let agilitasPrimarySources = 0;
  let agilitasSources = 0;
  let gravitasDilution = 0;
  entries.forEach((entry, index) => {
    const conflicted = internalWeakenedAt.get(index);
    for (const [essence, tier] of entry.essences) {
      // A source that contradicts itself cannot carry concentration or dilute it.
      if (conflicted?.has(essence)) continue;
      if (essence === 'AGILITAS') {
        agilitasSources += entry.copies;
        if (tier === 'P') agilitasPrimarySources += entry.copies;
      }
      if (essence === 'GRAVITAS' && (tier === 'P' || tier === 'S')) {
        gravitasDilution += entry.copies;
      }
    }
  });

  const extremeAgilitas = agilitasPrimarySources >= 2 || agilitasSources >= 3;
  // Paralysis IS the AGILITAS expression, applied adversely (Section 4, Swamp Fungal Pod),
  // so a paralysing compound does not also fortify the drinker's Agility.
  const paralysisApplied = extremeAgilitas && gravitasDilution === 0;

  if (extremeAgilitas && gravitasDilution === 0) {
    flags.push({
      kind: 'paralysis',
      text: `AGILITAS is at extreme concentration (${agilitasSources} unopposed source${agilitasSources === 1 ? '' : 's'}) — this is a Paralysis compound. Standard: Might roll or Paralyzed. Potent: no save.`,
    });
  } else if (extremeAgilitas && gravitasDilution > 0) {
    flags.push({
      kind: 'diluted',
      text: `AGILITAS would hit paralysis, but ${gravitasDilution} GRAVITAS source${gravitasDilution === 1 ? '' : 's'} pulls it back. The mix is diluted — speed with drag, not paralysis.`,
    });
  }

  if (entries.length === 1 && !unknownNames.length) {
    flags.push({
      kind: 'single-ingredient',
      text: 'Single-ingredient compound: the Primary expresses, the rest stay locked. Coaxing a Secondary out needs a Hard Guile roll.',
    });
  }

  if (!collapsed) {
    for (const [index, essences] of internalWeakenedAt) {
      flags.push({
        kind: 'internal-conflict',
        text: `${entries[index].name} is internally conflicted: its own opposition significantly weakens ${[...essences].join(' and ')}. ${entries[index].name} cannot carry ${essences.size === 1 ? 'that Essence' : 'those Essences'} alone; another ingredient carrying it is what rescues the read.`,
      });
    }
  }

  for (const entry of entries) {
    if (entry.ingredient?.tags?.includes('sapient')) {
      flags.push({ kind: 'sapient', text: `${entry.name} is sapient-derived: its ANIMA reads one quality tier higher, and using it carries social consequences.` });
    }
    if (entry.ingredient?.tags?.includes('legendary')) {
      flags.push({ kind: 'legendary', text: `${entry.name} is relic-tier. There is no second one of these.` });
    }
    if (entry.ingredient?.tags?.includes('special')) {
      flags.push({ kind: 'special', text: `${entry.name} carries an expression outside the ten Essences — adjudicate that one yourself.` });
    }
    if (entry.essences.some(([, tier]) => tier === 'Q')) {
      flags.push({ kind: 'quaternary', text: `${entry.name} carries a Quaternary Essence. Reading it is a Master-only perception.` });
    }
  }

  const elemental = expressed.find(e => ['IGNIS', 'GLACIES', 'FULGUR'].includes(e.essence));
  const hardening = expressed.find(e => e.essence === 'FORTITAS');
  if (elemental && hardening && !collapsed) {
    flags.push({
      kind: 'resistance',
      text: `FORTITAS and ${elemental.essence} are both present — read this as resistance rather than damage.`,
    });
  }

  const effects = expressed
    .filter(e => e.weakened !== 'significantly')
    .filter(e => !(paralysisApplied && e.essence === 'AGILITAS'))
    .map(e => effectsFor(e.essence, quality, { hasElemental: Boolean(elemental) }))
    .filter((e): e is BrewEffect => Boolean(e));

  // Applicability: bind to the rest of the mix, avoid collisions, avoid collapse.
  let applicability = 0;
  if (collapsed) {
    applicability = -1000;
  } else {
    for (const entry of entries) {
      if (!entry.ingredient?.variants) continue;
      const shared = entry.essences.filter(([essence]) =>
        entries.some(other => other !== entry && other.essences.some(([otherEssence]) => otherEssence === essence)),
      );
      applicability += shared.length * 10;
    }
    const mixFindings = findings.filter(f => !f.internal);
    applicability -= mixFindings.filter(f => f.severity === 'secondary').length * 5;
    applicability -= mixFindings.filter(f => f.severity === 'tertiary').length;
  }

  const label =
    entries.length === 0
      ? 'Empty'
      : entries
          .map(e => (e.reading === 'base' ? e.name : `${e.name} (${e.reading})`))
          .join(' + ');

  return {
    label,
    entries,
    unknownNames,
    pairCount: countPairs(entries.length),
    findings,
    collapsed,
    expressed,
    effects,
    flags,
    applicability,
    mostApplicable: false,
  };
}

/** Human-readable one-liner for a finding, used by the GM panel. */
export function describeFinding(finding: OppositionFinding): string {
  const scope = finding.internal ? ' (inside the ingredient)' : '';
  return `${finding.a} ${finding.essenceA}[${finding.tierA}] vs ${finding.b} ${finding.essenceB}[${finding.tierB}]${scope} — ${finding.severity} negation`;
}

export function describeTier(tier: Tier): string {
  return TIER_NAME[tier];
}
