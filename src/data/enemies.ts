// Enemy templates for Skyrim TTRPG GM Dashboard
//
// CALIBRATED July 2026 against the consolidated rules (GM Guide/Reference tables:
// SCALED MONSTER STATISTICS). Every template is snapped to a Tier/TL slot from that
// table — the slot is noted on each entry as [Tier TL#]. HP values carry the
// Legendary-scaling multipliers (Minions x2 / Elites x2.5 / Bosses x3) BAKED IN,
// exactly like the master table. Named weapons use Gear-list damages; cast spells
// use Spell List damages. The GM scales freely from these baselines.
// Canonical tier bands: Novice 0-3 AP / Apprentice 3-6 / Adept 6-9 / Expert 9-15 /
// Master 15-25 / Mythic 25+ (Mythic entries are FLOORS — minimums, never targets).
//
// SUMMONS are deliberately NOT table-calibrated: they are player assets balanced
// against Conjuration spell tiers, not enemies.

export type EnemyCategory = 'humanoid' | 'beast' | 'undead' | 'daedra' | 'dragon' | 'construct' | 'summon';

export interface EnemyTemplate {
  id: string;
  name: string;
  category: EnemyCategory;
  hp: number;
  fp?: number;           // Optional, defaults to 0
  dr: number;
  stats: { might: number; agility: number; magic: number; guile: number };
  attacks: { name: string; damage: number; stat: string; properties?: string }[];
  abilities?: string[];
  isBoss?: boolean;      // Pre-flagged bosses
}

export const enemyTemplates: EnemyTemplate[] = [
  // Basic Humanoids
  {
    id: 'bandit',
    name: 'Bandit', // [Novice TL1]
    category: 'humanoid',
    hp: 20,
    dr: 2,
    stats: { might: 14, agility: 12, magic: 8, guile: 10 },
    attacks: [{ name: 'Iron Sword', damage: 4, stat: 'might', properties: 'Finesse' }],
  },
  {
    id: 'bandit_chief',
    name: 'Bandit Chief', // [Novice TL2 Elite]
    category: 'humanoid',
    hp: 63,
    fp: 10,
    dr: 3,
    stats: { might: 15, agility: 13, magic: 8, guile: 10 },
    attacks: [{ name: 'Steel Greatsword', damage: 9, stat: 'might', properties: 'Finesse' }],
    abilities: ['Power Attack (+2 damage for 3 FP)'],
    isBoss: true,
  },
  {
    id: 'forsworn',
    name: 'Forsworn', // [Novice TL1]
    category: 'humanoid',
    hp: 20,
    fp: 8,
    dr: 2,
    stats: { might: 12, agility: 14, magic: 10, guile: 8 },
    attacks: [{ name: 'Forsworn Sword', damage: 5, stat: 'might' }],
    abilities: ['Can cast Flames (1 FP, 3 fire damage + Burning 1 for 2 turns)'],
  },
  {
    id: 'forsworn_briarheart',
    name: 'Forsworn Briarheart', // [Apprentice TL2 Elite]
    category: 'humanoid',
    hp: 113,
    fp: 20,
    dr: 6,
    stats: { might: 14, agility: 16, magic: 14, guile: 11 },
    attacks: [
      { name: 'Forsworn Sword', damage: 12, stat: 'might' },
      { name: 'Firebolt', damage: 6, stat: 'magic', properties: 'Ranged, Burning 2 for 2 turns' }
    ],
    abilities: ['Can cast Firebolt (3 FP)', 'Can cast Oakflesh (3 FP, +2 DR)'],
    isBoss: true,
  },

  // Undead
  {
    id: 'skeleton',
    name: 'Skeleton', // [Novice TL1]
    category: 'undead',
    hp: 20,
    dr: 2,
    stats: { might: 14, agility: 12, magic: 8, guile: 10 },
    attacks: [{ name: 'Ancient Sword', damage: 5, stat: 'might' }],
    abilities: ['Immune to fear', 'Immune to poison'],
  },
  {
    id: 'draugr',
    name: 'Draugr', // [Apprentice TL1]
    category: 'undead',
    hp: 40,
    dr: 4,
    stats: { might: 15, agility: 11, magic: 8, guile: 13 },
    attacks: [{ name: 'Ancient Nord Blade', damage: 8, stat: 'might' }],
    abilities: ['Immune to fear', 'Immune to mind-affecting spells'],
  },
  {
    id: 'draugr_deathlord',
    name: 'Draugr Deathlord', // [Adept TL2 Elite]
    category: 'undead',
    hp: 175,
    fp: 20,
    dr: 11,
    stats: { might: 17, agility: 12, magic: 15, guile: 8 },
    attacks: [
      { name: 'Ebony Battleaxe', damage: 17, stat: 'might', properties: 'Deep Wounds (Power Attack: 2 Bleed)' },
      { name: 'Unrelenting Force', damage: 10, stat: 'magic', properties: 'Knockback, costs 5 FP' }
    ],
    abilities: ['Immune to fear', 'Shout: Unrelenting Force', 'Shout: Disarm'],
    isBoss: true,
  },
  {
    id: 'vampire',
    name: 'Vampire', // [Apprentice TL2 Elite]
    category: 'undead',
    hp: 113,
    fp: 20,
    dr: 6,
    stats: { might: 14, agility: 16, magic: 14, guile: 11 },
    attacks: [{ name: 'Drain Life', damage: 12, stat: 'magic', properties: 'Heals vampire for damage dealt' }],
    abilities: ['Lifesteal on melee', 'Vampiric Drain spell', 'Weakness to fire (+2 damage)'],
    isBoss: true,
  },

  // Beasts
  {
    id: 'wolf',
    name: 'Wolf', // [Novice TL1]
    category: 'beast',
    hp: 20,
    dr: 2,
    stats: { might: 12, agility: 14, magic: 8, guile: 10 },
    attacks: [{ name: 'Bite', damage: 5, stat: 'agility' }],
    abilities: ['Pack Tactics: +1 damage if ally adjacent to target'],
  },
  {
    id: 'ice_wolf',
    name: 'Ice Wolf', // [Novice TL1]
    category: 'beast',
    hp: 20,
    dr: 2,
    stats: { might: 12, agility: 14, magic: 10, guile: 8 },
    attacks: [{ name: 'Freezing Bite', damage: 5, stat: 'agility', properties: 'May apply Slowed' }],
    abilities: ['Pack Tactics', 'Frost Resistance'],
  },
  {
    id: 'frostbite_spider',
    name: 'Frostbite Spider', // [Novice TL1]
    category: 'beast',
    hp: 20,
    dr: 2,
    stats: { might: 14, agility: 12, magic: 8, guile: 10 },
    attacks: [{ name: 'Bite', damage: 5, stat: 'might', properties: 'Poison: 1 damage/round for 2 rounds' }],
    abilities: ['Poison bite', 'Web spit (immobilize)'],
  },
  {
    id: 'giant_frostbite_spider',
    name: 'Giant Frostbite Spider', // [Novice TL2 Elite]
    category: 'beast',
    hp: 63,
    dr: 3,
    stats: { might: 15, agility: 13, magic: 8, guile: 10 },
    attacks: [{ name: 'Venomous Bite', damage: 8, stat: 'might', properties: 'Poison: 2 damage/round for 3 rounds' }],
    abilities: ['Strong poison', 'Web spit (immobilize)', 'Can climb walls'],
    isBoss: true,
  },
  {
    id: 'bear',
    name: 'Bear', // [Novice TL2 Elite]
    category: 'beast',
    hp: 63,
    dr: 3,
    stats: { might: 15, agility: 13, magic: 8, guile: 10 },
    attacks: [{ name: 'Claw', damage: 8, stat: 'might' }],
    abilities: ['Powerful charge'],
  },
  {
    id: 'sabre_cat',
    name: 'Sabre Cat', // [Novice TL2 Elite]
    category: 'beast',
    hp: 63,
    dr: 3,
    stats: { might: 13, agility: 15, magic: 8, guile: 10 },
    attacks: [{ name: 'Pounce', damage: 8, stat: 'agility', properties: 'Can attack twice if first hits' }],
    abilities: ['Pounce attack', 'Fast movement'],
  },
  {
    id: 'troll',
    name: 'Troll', // [Apprentice TL2 Elite]
    category: 'beast',
    hp: 113,
    dr: 6,
    stats: { might: 16, agility: 14, magic: 8, guile: 11 },
    attacks: [{ name: 'Claw', damage: 12, stat: 'might' }],
    abilities: ['Regeneration: Heals 4 HP at start of turn', 'Weakness to fire (stops regen for 1 round)'],
    isBoss: true,
  },
  {
    id: 'frost_troll',
    name: 'Frost Troll', // [Adept TL2 Elite]
    category: 'beast',
    hp: 175,
    dr: 11,
    stats: { might: 17, agility: 15, magic: 8, guile: 12 },
    attacks: [{ name: 'Freezing Claw', damage: 20, stat: 'might', properties: 'May apply Slowed' }],
    abilities: ['Regeneration: Heals 6 HP at start of turn', 'Weakness to fire', 'Frost Resistance'],
    isBoss: true,
  },
  {
    id: 'giant',
    name: 'Giant', // [Adept TL2 Elite]
    category: 'beast',
    hp: 175,
    dr: 11,
    stats: { might: 17, agility: 12, magic: 8, guile: 15 },
    attacks: [{ name: 'Club', damage: 20, stat: 'might', properties: 'Staggering Force' }],
    abilities: ['Massive: Cannot be staggered or knocked prone', 'Ground Slam AoE'],
    isBoss: true,
  },
  {
    id: 'mammoth',
    name: 'Mammoth', // [Adept TL2 Elite]
    category: 'beast',
    hp: 175,
    dr: 11,
    stats: { might: 17, agility: 12, magic: 8, guile: 15 },
    attacks: [
      { name: 'Tusks', damage: 20, stat: 'might' },
      { name: 'Stomp', damage: 13, stat: 'might', properties: 'AoE, hits all adjacent' }
    ],
    abilities: ['Massive', 'Trample charge'],
    isBoss: true,
  },

  // Daedra/Atronachs
  {
    id: 'flame_atronach',
    name: 'Flame Atronach', // [Apprentice TL1]
    category: 'daedra',
    hp: 40,
    dr: 4,
    stats: { might: 8, agility: 13, magic: 15, guile: 11 },
    attacks: [{ name: 'Firebolt', damage: 8, stat: 'magic', properties: 'Ranged, may cause Burning' }],
    abilities: ['Immune to fire', 'Vulnerable to frost (double damage)', 'Explodes on death (4 fire damage to adjacent)'],
  },
  {
    id: 'frost_atronach',
    name: 'Frost Atronach', // [Apprentice TL2 Elite]
    category: 'daedra',
    hp: 113,
    dr: 6,
    stats: { might: 16, agility: 11, magic: 14, guile: 8 },
    attacks: [{ name: 'Slam', damage: 12, stat: 'might', properties: 'Frostbite Slam: target is Slowed' }],
    abilities: ['Immune to frost', 'Vulnerable to fire (double damage)', 'Frostbite Slam: target is Slowed on hit'],
    isBoss: true,
  },
  {
    id: 'storm_atronach',
    name: 'Storm Atronach', // [Adept TL2 Elite]
    category: 'daedra',
    hp: 175,
    dr: 11,
    stats: { might: 12, agility: 8, magic: 17, guile: 15 },
    attacks: [{ name: 'Chain Lightning', damage: 20, stat: 'magic', properties: 'Jumps to 1 additional target, drains 4 FP each' }],
    abilities: ['Immune to shock', 'Energy Drain: Chain Lightning drains FP from each target hit'],
    isBoss: true,
  },
  {
    id: 'dremora',
    name: 'Dremora', // [Adept TL2 Elite]
    category: 'daedra',
    hp: 175,
    fp: 20,
    dr: 11,
    stats: { might: 17, agility: 12, magic: 15, guile: 8 },
    attacks: [{ name: 'Daedric Greatsword', damage: 20, stat: 'might', properties: 'Finesse, fire damage' }],
    abilities: ['Fire enchanted weapons', 'Immune to fear', 'Can cast Firebolt (3 FP, 6 fire damage)'],
    isBoss: true,
  },

  // Constructs
  {
    id: 'dwarven_spider',
    name: 'Dwarven Spider', // [Novice TL1]
    category: 'construct',
    hp: 20,
    dr: 2,
    stats: { might: 10, agility: 14, magic: 12, guile: 8 },
    attacks: [{ name: 'Shock Bolt', damage: 5, stat: 'magic', properties: 'Drains 2 FP' }],
    abilities: ['Immune to poison', 'Immune to mind-affecting', 'Self-destructs on death'],
  },
  {
    id: 'dwarven_sphere',
    name: 'Dwarven Sphere', // [Apprentice TL1]
    category: 'construct',
    hp: 40,
    dr: 4,
    stats: { might: 15, agility: 13, magic: 8, guile: 11 },
    attacks: [
      { name: 'Blade', damage: 8, stat: 'might' },
      { name: 'Integrated Crossbow', damage: 8, stat: 'agility', properties: 'Piercing Bolt (ignores 1 DR)' }
    ],
    abilities: ['Immune to poison', 'Immune to mind-affecting', 'Resistant to frost'],
  },
  {
    id: 'dwarven_centurion',
    name: 'Dwarven Centurion', // [Adept TL3 BOSS]
    category: 'construct',
    hp: 540,
    dr: 14,
    stats: { might: 18, agility: 12, magic: 16, guile: 8 },
    attacks: [
      { name: 'Hammer Arm', damage: 26, stat: 'might', properties: 'Staggering' },
      { name: 'Steam Breath', damage: 16, stat: 'magic', properties: 'Cone AoE' }
    ],
    abilities: ['Immune to poison', 'Immune to mind-affecting', 'Steam attack', 'Massive', 'Boss: Villain Actions + Phase Bars (see Reference tables)'],
    isBoss: true,
  },

  // Spellcasters
  {
    id: 'necromancer',
    name: 'Necromancer', // [Novice TL2 Elite]
    category: 'humanoid',
    hp: 63,
    fp: 20,
    dr: 3,
    stats: { might: 8, agility: 10, magic: 15, guile: 13 },
    attacks: [
      { name: 'Ice Spike', damage: 4, stat: 'magic', properties: 'Ranged, 2 FP drain (3 FP to cast)' },
      { name: 'Iron Dagger', damage: 3, stat: 'agility', properties: 'Assassin\'s Blade' }
    ],
    abilities: ['Raise Zombie (3 FP)', 'Ice Spike (3 FP)', 'Lightning Bolt (3 FP)'],
  },
  {
    id: 'hagraven',
    name: 'Hagraven', // [Apprentice TL2 Elite]
    category: 'humanoid',
    hp: 113,
    fp: 25,
    dr: 6,
    stats: { might: 11, agility: 14, magic: 16, guile: 14 },
    attacks: [
      { name: 'Claws', damage: 12, stat: 'might' },
      { name: 'Fireball', damage: 9, stat: 'magic', properties: 'AoE (4 splash within 20ft), costs 6 FP' }
    ],
    abilities: ['Can cast Fireball (6 FP)', 'Can cast Fear (3 FP)', 'Fly short distances'],
    isBoss: true,
  },
  {
    id: 'dragon_priest',
    name: 'Dragon Priest', // [Expert TL3 BOSS]
    category: 'undead',
    hp: 900,
    fp: 60,
    dr: 22,
    stats: { might: 13, agility: 17, magic: 19, guile: 17 },
    attacks: [
      { name: 'Staff Blast', damage: 41, stat: 'magic' },
      { name: 'Wall of Flames', damage: 8, stat: 'magic', properties: 'AoE zone per turn, 10 FP' }
    ],
    abilities: ['Levitation', 'Can cast Expert-level spells', 'Immune to fear', 'Mask grants special power', 'Boss: Villain Actions + Phase Bars'],
    isBoss: true,
  },

  // Dragons (Dragon Kill AP: regular = 2 AP killing blow / 1 AP participants;
  // elder = 4 AP killing blow / 2 AP participants)
  {
    id: 'dragon',
    name: 'Dragon', // [Expert TL3 BOSS]
    category: 'dragon',
    hp: 900,
    fp: 40,
    dr: 22,
    stats: { might: 19, agility: 15, magic: 17, guile: 13 },
    attacks: [
      { name: 'Bite', damage: 41, stat: 'might' },
      { name: 'Tail Sweep', damage: 26, stat: 'might', properties: 'Hits all adjacent enemies' },
      { name: 'Fire Breath', damage: 41, stat: 'magic', properties: 'Cone AoE, causes Burning 2' }
    ],
    abilities: ['Flight', 'Immune to fear', 'Fire Breath', 'Boss: Villain Actions + Phase Bars', 'Kill AP: 2 killing blow / 1 participant'],
    isBoss: true,
  },
  {
    id: 'frost_dragon',
    name: 'Frost Dragon', // [Expert TL3 BOSS]
    category: 'dragon',
    hp: 950,
    fp: 40,
    dr: 22,
    stats: { might: 19, agility: 13, magic: 17, guile: 15 },
    attacks: [
      { name: 'Bite', damage: 41, stat: 'might' },
      { name: 'Wing Buffet', damage: 26, stat: 'might', properties: 'Knockback' },
      { name: 'Frost Breath', damage: 35, stat: 'magic', properties: 'Cone AoE, causes Slowed, FP drain' }
    ],
    abilities: ['Flight', 'Immune to fear', 'Immune to frost', 'Frost Breath', 'Boss: Villain Actions + Phase Bars', 'Kill AP: 2 killing blow / 1 participant'],
    isBoss: true,
  },
  {
    id: 'elder_dragon',
    name: 'Elder Dragon', // [MYTHIC TL3 — FLOOR values; scale UP to the party, never down]
    category: 'dragon',
    hp: 2000,
    fp: 80,
    dr: 50,
    stats: { might: 22, agility: 18, magic: 20, guile: 16 },
    attacks: [
      { name: 'Bite', damage: 190, stat: 'might' },
      { name: 'Tail Sweep', damage: 95, stat: 'might', properties: 'Hits all adjacent' },
      { name: 'Cataclysm Breath', damage: 190, stat: 'magic', properties: 'Cone AoE, Burning 5' }
    ],
    abilities: ['Flight', 'Immune to fear', 'MYTHIC FLOOR: every stat here is a minimum — GM scales up freely', 'Boss: Villain Actions + Phase Bars', 'Kill AP: 4 killing blow / 2 participants'],
    isBoss: true,
  },

  // Summons (from Conjuration spells) — NOT table-calibrated on purpose:
  // these are player assets balanced against spell tiers, not enemies.
  {
    id: 'familiar',
    name: 'Familiar',
    category: 'summon',
    hp: 8,
    dr: 0,
    stats: { might: 10, agility: 12, magic: 6, guile: 8 },
    attacks: [{ name: 'Bite', damage: 4, stat: 'agility' }],
    abilities: ['A basic but loyal spectral wolf'],
  },
  {
    id: 'zombie',
    name: 'Zombie',
    category: 'summon',
    hp: 12,
    dr: 2,
    stats: { might: 12, agility: 6, magic: 6, guile: 6 },
    attacks: [{ name: 'Slam', damage: 4, stat: 'might' }],
    abilities: ['Slow and shambling', 'Immune to fear and mind-affecting spells'],
  },
  {
    id: 'reanimated_corpse',
    name: 'Reanimated Corpse',
    category: 'summon',
    hp: 25,
    dr: 4,
    stats: { might: 14, agility: 8, magic: 6, guile: 8 },
    attacks: [{ name: 'Weapon Strike', damage: 6, stat: 'might' }],
    abilities: ['A durable undead servant', 'Immune to fear and mind-affecting spells'],
  },
  {
    id: 'revenant',
    name: 'Revenant',
    category: 'summon',
    hp: 35,
    dr: 8,
    stats: { might: 15, agility: 10, magic: 8, guile: 10 },
    attacks: [{ name: 'Weapon Strike', damage: 12, stat: 'might' }],
    abilities: ['Revenant: When reduced to 0 HP, rises again as Revenant (Risen) with HP 17, DR 4, Attack 6 — once per combat'],
    isBoss: true,
  },
  {
    id: 'dread_zombie',
    name: 'Dread Zombie',
    category: 'summon',
    hp: 50,
    dr: 10,
    stats: { might: 17, agility: 10, magic: 12, guile: 10 },
    attacks: [{ name: 'Weapon Strike', damage: 16, stat: 'might' }],
    abilities: ['Terrifying Presence: On hit, Magic roll TN 12 — success causes Fear (target must flee on next turn)'],
    isBoss: true,
  },
  {
    id: 'dremora_lord',
    name: 'Dremora Lord',
    category: 'summon',
    hp: 60,
    dr: 12,
    stats: { might: 18, agility: 12, magic: 14, guile: 16 },
    attacks: [{ name: 'Daedric Greatsword', damage: 16, stat: 'might', properties: 'Fire damage' }],
    abilities: [
      'Fiery Presence: Adjacent enemies take 2 fire damage + Burning 3 at start of their next 2 turns',
      'Daedric Commander: All other friendly summoned creatures deal +1 damage',
    ],
    isBoss: true,
  },
];

// Helper to get enemies by category
export function getEnemiesByCategory(category: EnemyCategory): EnemyTemplate[] {
  return enemyTemplates.filter(e => e.category === category);
}

// All categories for UI
export const ENEMY_CATEGORIES: { id: EnemyCategory; label: string }[] = [
  { id: 'humanoid', label: 'Humanoid' },
  { id: 'beast', label: 'Beast' },
  { id: 'undead', label: 'Undead' },
  { id: 'daedra', label: 'Daedra' },
  { id: 'dragon', label: 'Dragon' },
  { id: 'construct', label: 'Construct' },
  { id: 'summon', label: 'Summon' },
];
