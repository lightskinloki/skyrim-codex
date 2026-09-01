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

  // ---- FIRE B: THE ROAD & THE BLEEDING STAIR ----
  // Adventure modules/choice gate 3/FIRE B - THE ROAD & THE BLEEDING STAIR (redraft).rtf
  {
    id: 'dagonite_cultist',
    name: 'Dagonite Cultist', // razor-scarred, ash-grey robes — RTF:734
    category: 'humanoid',
    hp: 100,
    dr: 11,
    stats: { might: 17, agility: 15, magic: 13, guile: 8 },
    attacks: [{ name: 'Jagged Glass-Steel Blade', damage: 20, stat: 'might' }],
    abilities: [
      'Tide-shard graft (sternum): CHOOSES its Tempo result instead of rolling, until the shard is destroyed',
      'Counter: Called Shot (Very Hard, -6) or Sunder aimed at the shard, or the bearer’s death, shatters it and the cultist rolls Tempo normally',
      'Fights to the end — retreat is not in the liturgy',
    ],
  },
  {
    id: 'shard_zealot',
    name: 'Shard Zealot', // the graft has spread up the throat; voice doubles — RTF:734
    category: 'humanoid',
    hp: 250,
    fp: 4,
    dr: 17,
    stats: { might: 18, agility: 16, magic: 13, guile: 8 },
    attacks: [
      { name: 'Blade-work', damage: 31, stat: 'might' },
      { name: 'Ash Shell', damage: 0, stat: 'magic', properties: '4 FP, encases a target' },
      { name: 'Firebolt', damage: 6, stat: 'magic', properties: '3 FP' },
    ],
    abilities: [
      'Cheats Tempo (tide-shard graft, same counter as Dagonite Cultist)',
      'On death the shard bursts: 5 damage to all within 5 ft',
    ],
    isBoss: true,
  },
  {
    id: 'scamp_wild_crossed',
    name: 'Scamp, Wild-Crossed', // TL1 Harassment tier, weaker than a Guardian-tier enemy — RTF:931
    category: 'daedra',
    hp: 30,
    dr: 1,
    stats: { might: 8, agility: 15, magic: 12, guile: 9 },
    attacks: [
      { name: 'Claws', damage: 6, stat: 'agility' },
      { name: 'Weak Firebolt', damage: 5, stat: 'magic', properties: '2 FP, in place of a claw attack' },
    ],
    abilities: ['No tide-shard — rolls Tempo like everyone else', 'Cowardly alone: flees below half HP if it has anywhere to flee to'],
  },
  {
    id: 'frost_troll_dagon_warped',
    name: 'Frost Troll, Dagon-Warped', // TL3 BOSS, Expert tier, party AP~12 — RTF:998-1027
    category: 'beast',
    hp: 900,
    dr: 22,
    stats: { might: 19, agility: 17, magic: 13, guile: 8 },
    attacks: [{ name: 'Grab and Maul', damage: 41, stat: 'might' }],
    abilities: [
      'THREE PHASE BARS of 300 (900 total); damage does NOT carry between bars',
      'Fire damage is DOUBLED in every bar; immune to frost',
      'Villain Action: one extra action at the end of every second player turn',
      'Does not regenerate turn-by-turn — its healing IS the phase transition',
      'Bar 1 (900→601, "The Troll"): ONE attack/turn, DR 22',
      'Bar 2 (600→301, "Too Much Arm"): TWO attacks/turn, DR drops to 14 (new limbs unhided)',
      'Bar 3 (300→1, "The Loop That Will Not Stop Running"): THREE attacks/turn, DR 10, all other resistances gone; roll d20 per attack — 11+ hits its target, 6-10 hits a random other creature in reach, 1-5 strikes rock/snow/itself; no wounded state or morale; no facing (flanking does not apply)',
      'GM lethality dial: if the party’s DR spread cannot absorb three Bar-3 attacks/turn, drop it to two and keep everything else',
    ],
    isBoss: true,
  },
  {
    id: 'yolshulnir',
    name: 'Yolshulnir', // fire dragon (APEX), hatched with Strunbahnir — RTF:286, 340
    category: 'dragon',
    hp: 900,
    dr: 22,
    stats: { might: 20, agility: 17, magic: 15, guile: 13 },
    attacks: [
      { name: 'Inferno Breath', damage: 40, stat: 'agility', properties: 'Major, 40ft cone, -6 Agi (40 fire fail / 20 success)' },
      { name: 'Bite', damage: 45, stat: 'might', properties: 'Major, melee, Prone + Grapple' },
      { name: 'Wildfire Claws', damage: 30, stat: 'might', properties: 'Major, melee, ignites the ground beneath the target' },
    ],
    abilities: [
      'TWO PHASE BARS of 450 (900 total); damage does NOT carry between bars',
      'Immune: Fear, Poison, Disease, Fire',
      'Terrain Ignition (automatic): Inferno Breath, Wildfire Claws, or a Fanned Inferno ignites dry ground — standing fire hazard, 5 fire/round, no check required',
      'Growing Hunger (passive): regains 10 HP at the start of his turn if any fire is burning anywhere on the field, his own or Strunbahnir’s',
      'Fanned Inferno (paired w/ Strunbahnir): either of her lightning attacks landing on his ignited ground doubles that fire zone’s damage this round and expands its area 10ft',
      'Each dragon rolls its own initiative — NOT a shared enemy slot',
    ],
    isBoss: true,
  },
  {
    id: 'strunbahnir',
    name: 'Strunbahnir', // storm dragon (APEX), hatched with Yolshulnir — RTF:286, 341
    category: 'dragon',
    hp: 900,
    dr: 22,
    stats: { might: 20, agility: 17, magic: 15, guile: 13 },
    attacks: [
      { name: 'Storm Call', damage: 40, stat: 'agility', properties: 'Major, ranged 60ft, -6 Agi (40 shock fail / 20 success), ignores half DR from metal armor, usable at full altitude' },
      { name: 'Storm Fracture', damage: 15, stat: 'agility', properties: 'Major, ranged 60ft anchor bolt at full Storm Call force, then 15 shock/-2 Agi to everyone else within 30ft' },
      { name: 'Bite', damage: 45, stat: 'might', properties: 'Major, melee, Prone + Grapple (only if grounded)' },
      { name: 'Gale Slam', damage: 15, stat: 'might', properties: 'Major, 20ft radius downdraft, -4 Might, push 15ft, snuffs small fires in radius' },
    ],
    abilities: [
      'TWO PHASE BARS of 450 (900 total); damage does NOT carry between bars',
      'Immune: Fear, Poison, Disease, Shock',
      'Storm Gathering (automatic): every Storm Call/Storm Fracture used ionizes the air; at 3 uses a real storm forms overhead and stays — from the round after, regains 10 HP at start of her turn',
      'Passive: Advantage resisting Prone/stagger',
      'Each dragon rolls its own initiative — NOT a shared enemy slot',
    ],
    isBoss: true,
  },
  {
    id: 'gaelen_root_twister',
    name: 'Gaelen the Root-Twister', // Apex Villain — full sheet: Npcs/new mythic dawn leader — RTF:1161
    category: 'humanoid',
    hp: 40,
    fp: 35,
    dr: 22,
    stats: { might: 8, agility: 17, magic: 21, guile: 15 },
    attacks: [],
    abilities: [
      'Magic 21: cannot fail a Magic roll',
      'DR 23 vs spells; Paradise Mantle regenerates (outheal or shut off)',
      'Mythic Dawn chitin skin; Daedric graft-arm acts on its own initiative',
      'HE IS NOT HERE TO DIE: at disruption (3 of 5 anchors down) he PHASES away — falls back to the Eldergleam plan',
      'These stats are for escape only — he never initiates an attack this encounter',
    ],
    isBoss: true,
  },
  {
    id: 'jasper_avalon',
    name: 'Jasper Avalon', // lieutenant, ~AP 10, Dunmer mage, The Atronach — RTF:1161
    category: 'humanoid',
    hp: 9,
    fp: 16,
    dr: 8,
    stats: { might: 4, agility: 6, magic: 19, guile: 12 },
    attacks: [
      { name: 'Incinerate', damage: 12, stat: 'magic', properties: '9 FP' },
      { name: 'Ash Shell', damage: 0, stat: 'magic', properties: '4 FP, Might roll or encased 2 rounds' },
      { name: 'Lightning Bolt', damage: 0, stat: 'magic', properties: '3 FP' },
    ],
    abilities: [
      'Spell Absorption (Atronach Stone): once per combat, negates a hostile spell and regains its FP cost',
      "Ancestor's Wrath (Dunmer): 1/adventure fire aura",
      'Ash Rune: 10 FP',
      'Tide-shard graft: cheats Tempo',
      'Fights to the end defending the ritual space — dies here, one-and-done',
    ],
    isBoss: true,
  },
  {
    id: 'valerius_caelus_man_form',
    name: 'Valerius Caelus (Man Form)', // Mythic Tier, TL3 Boss, Controller — RTF:520-521
    category: 'daedra',
    hp: 800,
    fp: 90,
    dr: 60,
    stats: { might: 20, agility: 18, magic: 26, guile: 24 },
    attacks: [{ name: 'Vampiric Drain', damage: 220, stat: 'magic' }],
    abilities: [
      'BAR 1 of 3 (total pool 2400; damage does NOT carry between bars) — courteous, fights as long as he believes he is winning',
      'Dominate Will (Major): forces a resisted Guile check at the Contest Level-Gap Penalty (-20 to -25 TN)',
      'Mist Form (Minor, 2 FP): incorporeal for 1 round, immune to non-magical attacks',
      'Summon Death Hounds (Major): summons 1d4 Death Hounds',
      'Empowered Casting (once/combat): declare one spell an automatic critical',
      'Villain Action: one extra action at the end of every second player turn',
      'Weakness: naming his wife Livia or son Marcus aloud costs him his next Villain Action — both forms, does not stop working',
      'Weakness: daylight — breaks off and leaves at dawn regardless of how the fight is going',
      'Breaking this bar transforms him into Lord Form (see valerius_caelus_lord_form) — GM DOES NOT initiate this fight; it exists so the wall is real if the players walk into it',
    ],
    isBoss: true,
  },
  {
    id: 'valerius_caelus_lord_form',
    name: 'Valerius Caelus (Lord Form)', // Mythic Tier, TL3 Boss, Controller/Brute — RTF:527-529
    category: 'daedra',
    hp: 800,
    dr: 75,
    stats: { might: 28, agility: 26, magic: 26, guile: 24 },
    attacks: [
      { name: 'Claws', damage: 260, stat: 'might' },
      { name: 'Vampiric Drain', damage: 260, stat: 'magic', properties: 'heals him half of what he deals, into the current bar only' },
    ],
    abilities: [
      'BARS 2 AND 3 — 800 each; damage does NOT carry between bars',
      'Flight: full aerial mobility; melee cannot reach him without reach, a climb, a grapple, or something that grounds him',
      'Immune: Fear, Poison, Disease. Constrained by daylight',
      'Vampiric Grip (Major): telekinetically lifts one target, contested Might at the Contest Level-Gap Penalty; held targets take 40/round and drop what’s in their hands',
      'Summon Gargoyles (Major, once/bar): two stone guardians, DR 40, no Frost Breath, statline as Death Hounds otherwise',
      'Corpse Curse (Major): every corpse on the field stands up under his control',
      'Detect Life (passive): always knows where everything living on the field is — hiding, invisibility, cover do not work on him',
      'Same two weaknesses as Man Form (his wife/son’s name; daylight)',
      'Villain Action: one extra action at the end of every second player turn',
    ],
    isBoss: true,
  },
  {
    id: 'death_hound',
    name: 'Death Hound', // Mythic Tier, TL1 Minion, Skirmisher — RTF:534
    category: 'beast',
    hp: 300,
    dr: 25,
    stats: { might: 20, agility: 22, magic: 16, guile: 18 },
    attacks: [{ name: 'Icy Bite', damage: 35, stat: 'agility' }],
    abilities: [
      'Frost Breath (Minor): +5 frost damage, can Slow target',
      'Roughly shoulder-height to a horse, eight feet at the shoulder, jaws built to fit around a grown man’s ribcage',
    ],
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
