// Conjured creatures — the Conjuration school's actual stat blocks.
//
// Transcribed from the players guide's "Summoned & Reanimated Creature Stats
// Blocks" section (pp. 96-106), which is also where the art plates came from.
// Every number here — HP, DR, the four Stat Scores, the attack's damage and the
// Target Number it rolls against — is the guide's, not invented, because these
// creatures act on their own turn and the table needs to resolve them without
// the GM adjudicating from memory.
//
// These are templates, not live cards: `spawnSummon()` in utils/summoning.ts
// clones one, resets its HP, and stamps it with who called it.

import { Companion } from '@/types/companion';

/** Every attack here uses the creature's own Stat Score as the Target Number, per the guide. */
const attack = (name: string, stat: 'Might' | 'Agility' | 'Magic', tn: number, damage: number, flavour: string) => ({
  // Stable per-creature id — the card keys its ability list on this.
  id: `atk_${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  name,
  actionSlot: 'major' as const,
  cost: { type: 'free' as const },
  description: `${damage} damage. Rolls vs. ${stat} ${tn}. ${flavour}`.trim(),
  resetsOn: 'never' as const,
});

export const summonTemplates: Companion[] = [
  {
    id: 'summon_familiar',
    name: 'Familiar',
    kind: 'summon',
    tier: 'Fast Skirmisher',
    highConcept: 'A basic but loyal spectral wolf.',
    stats: { might: 10, agility: 12, magic: 6, guile: 8 },
    resources: { hp: { current: 8, max: 8 }, dr: 0 },
    abilities: [attack('Bite', 'Agility', 12, 4, 'It fights beside you for the duration of the encounter.')],
    equipment: [],
    image: 'familiar.jpg',
    duration: 'Duration of the encounter',
    notes: 'Summoned by Conjure Familiar (Novice).',
  },

  {
    id: 'summon_zombie',
    name: 'Zombie',
    kind: 'summon',
    tier: 'Mindless Brute',
    highConcept: 'Slow and shambling.',
    stats: { might: 12, agility: 6, magic: 6, guile: 6 },
    resources: { hp: { current: 12, max: 12 }, dr: 2 },
    abilities: [
      attack('Slam', 'Might', 12, 4, ''),
      {
        id: 'zombie_mindless', name: 'Mindless', actionSlot: 'passive',
        cost: { type: 'free' },
        description: 'Immune to fear and mind-affecting spells.',
        resetsOn: 'passive',
      },
    ],
    equipment: [],
    image: 'zombie.jpg',
    duration: 'Duration of the encounter',
    notes: 'Summoned by Raise Zombie (Novice).',
  },

  {
    id: 'summon_flame_atronach',
    name: 'Flame Atronach',
    kind: 'summon',
    tier: 'Ranged Magical Damage',
    highConcept: 'A being of fire and spite that hurls firebolts at your enemies.',
    stats: { might: 6, agility: 12, magic: 14, guile: 10 },
    resources: { hp: { current: 20, max: 20 }, dr: 2 },
    abilities: [
      attack('Firebolt', 'Magic', 14, 6, ''),
      {
        id: 'flame_atronach_fire_immune', name: 'Born of Fire', actionSlot: 'passive',
        cost: { type: 'free' },
        description: 'Immune to fire; vulnerable to frost (takes double damage from frost sources).',
        resetsOn: 'passive',
      },
    ],
    equipment: [],
    image: 'flame-atronach.jpg',
    duration: 'Duration of the encounter',
    notes: 'Summoned by Conjure Flame Atronach (Apprentice).',
  },

  {
    id: 'summon_reanimated_corpse',
    name: 'Reanimated Corpse',
    kind: 'summon',
    tier: 'Undead Soldier',
    highConcept: 'A durable undead servant.',
    stats: { might: 14, agility: 8, magic: 6, guile: 8 },
    resources: { hp: { current: 25, max: 25 }, dr: 4 },
    abilities: [
      attack('Weapon', 'Might', 14, 6, ''),
      {
        id: 'corpse_mindless', name: 'Mindless', actionSlot: 'passive',
        cost: { type: 'free' },
        description: 'Immune to fear and mind-affecting spells. Its DR of 4 comes from tattered armor.',
        resetsOn: 'passive',
      },
    ],
    equipment: [],
    image: 'reanimated-corpse.jpg',
    duration: 'Duration of the encounter',
    notes: 'Summoned by Reanimate Corpse (Apprentice).',
  },

  {
    id: 'summon_frost_atronach',
    name: 'Frost Atronach',
    kind: 'summon',
    tier: 'Magical Tank',
    highConcept: 'A hulking behemoth of ice that pounds foes into submission.',
    stats: { might: 16, agility: 6, magic: 12, guile: 10 },
    resources: { hp: { current: 40, max: 40 }, dr: 6 },
    abilities: [
      attack('Slam', 'Might', 16, 8, 'Frostbite Slam: on a hit the target is Slowed (no Minor-Action movement) for their next turn.'),
      {
        id: 'frost_atronach_ice_immune', name: 'Solid Ice', actionSlot: 'passive',
        cost: { type: 'free' },
        description: 'Immune to frost; vulnerable to fire (takes double damage from fire sources).',
        resetsOn: 'passive',
      },
    ],
    equipment: [],
    image: 'frost-atronach.jpg',
    duration: 'Duration of the encounter',
    notes: 'Summoned by Conjure Frost Atronach (Adept).',
  },

  {
    id: 'summon_revenant',
    name: 'Revenant (Full Strength)',
    kind: 'summon',
    tier: 'Elite Undead Warrior',
    highConcept: 'A powerful and resilient undead warrior.',
    stats: { might: 15, agility: 10, magic: 8, guile: 10 },
    resources: { hp: { current: 35, max: 35 }, dr: 8 },
    abilities: [
      attack('Weapon', 'Might', 15, 12, ''),
      {
        id: 'revenant_rises', name: 'Rises Again', actionSlot: 'passive',
        cost: { type: 'free' },
        description: "When this creature's HP reaches 0 it does not die: at the start of its next turn it rises as a Revenant (Risen). Once per combat.",
        maxUses: 1, usesRemaining: 1, resetsOn: 'per-combat',
      },
    ],
    equipment: [],
    image: 'revenant.jpg',
    duration: 'Duration of the encounter',
    // It does not die at 0 HP: it comes back as the Risen form next turn.
    risesAs: 'summon_revenant_risen',
    notes: 'Summoned by Revenant (Adept). At 0 HP it rises as Revenant (Risen) at the start of its next turn.',
  },

  {
    id: 'summon_revenant_risen',
    name: 'Revenant (Risen)',
    kind: 'summon',
    tier: 'Broken Undead',
    highConcept: 'A shambling, broken mockery of its former power.',
    stats: { might: 7, agility: 5, magic: 4, guile: 5 },
    resources: { hp: { current: 17, max: 17 }, dr: 4 },
    abilities: [attack('Shattered Weapon', 'Might', 7, 6, 'Its DR of 4 comes from broken armor.')],
    equipment: [],
    image: 'revenant-risen.jpg',
    duration: 'Until destroyed (this form does not rise again)',
    notes: 'The second form of a defeated Revenant. Does not rise a second time.',
  },

  {
    id: 'summon_storm_atronach',
    name: 'Storm Atronach',
    kind: 'summon',
    tier: 'Ranged Magical Artillery',
    highConcept: 'A whirlwind of rock and lightning.',
    stats: { might: 10, agility: 8, magic: 17, guile: 12 },
    resources: { hp: { current: 30, max: 30 }, dr: 6 },
    abilities: [
      attack('Chain Lightning', 'Magic', 17, 12, 'Energy Drain: also drains 2 FP from each target it hits.'),
      {
        id: 'storm_atronach_shock_immune', name: 'Storm-Born', actionSlot: 'passive',
        cost: { type: 'free' },
        description: 'Immune to shock. Its rocky hide gives it DR 6.',
        resetsOn: 'passive',
      },
    ],
    equipment: [],
    image: 'storm-atronach.jpg',
    duration: 'Duration of the encounter',
    notes: 'Summoned by Conjure Storm Atronach (Expert).',
  },

  {
    id: 'summon_dread_zombie',
    name: 'Dread Zombie',
    kind: 'summon',
    tier: 'Apex Undead Controller',
    highConcept: 'A truly terrifying undead minion.',
    stats: { might: 17, agility: 10, magic: 12, guile: 10 },
    resources: { hp: { current: 50, max: 50 }, dr: 10 },
    abilities: [
      attack('Weapon', 'Might', 17, 16, ''),
      {
        id: 'dread_zombie_terrifying', name: 'Terrifying Presence', actionSlot: 'passive',
        cost: { type: 'free' },
        description: 'On a successful hit it makes a Magic roll (TN 12). If that succeeds the target is afflicted with Fear and must succeed on a Guile roll or spend its next turn moving away by the safest possible route.',
        resetsOn: 'passive',
      },
    ],
    equipment: [],
    image: 'dread-zombie.jpg',
    duration: 'Duration of the encounter',
    notes: 'Summoned by Dread Zombie (Expert). DR 10 comes from heavy armor.',
  },

  {
    id: 'summon_dremora_lord',
    name: 'Dremora Lord',
    kind: 'summon',
    tier: 'Elite Commander',
    highConcept: 'Clad in Daedric armor, wielding a flaming greatsword — it exists only to destroy your enemies.',
    stats: { might: 18, agility: 12, magic: 14, guile: 16 },
    resources: { hp: { current: 60, max: 60 }, dr: 12 },
    abilities: [
      attack('Greatsword', 'Might', 18, 16, ''),
      {
        id: 'dremora_fiery_presence', name: 'Fiery Presence', actionSlot: 'passive',
        cost: { type: 'free' },
        description: 'Wreathed in supernatural fire: any enemy that ends its turn adjacent takes 2 fire damage and is set ablaze, taking 3 more fire damage at the start of its next two turns.',
        resetsOn: 'passive',
      },
      {
        id: 'dremora_daedric_commander', name: 'Daedric Commander', actionSlot: 'passive',
        cost: { type: 'free' },
        description: 'While the Dremora Lord is on the battlefield, all other friendly summoned creatures deal +1 damage with their attacks.',
        resetsOn: 'passive',
      },
    ],
    equipment: [
      { name: 'Daedric Armor', dr: 12 },
      { name: 'Flaming Greatsword', damage: 16 },
    ],
    image: 'dremora-lord.jpg',
    duration: '3 rounds',
    notes: 'Summoned by Conjure Dremora Lord (Master). Once per encounter.',
  },
];

export const getSummonTemplate = (id: string): Companion | undefined =>
  summonTemplates.find((t) => t.id === id);
