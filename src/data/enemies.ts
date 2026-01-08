// Enemy templates for Skyrim TTRPG GM Dashboard

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
    name: 'Bandit',
    category: 'humanoid',
    hp: 8,
    dr: 1,
    stats: { might: 12, agility: 10, magic: 4, guile: 10 },
    attacks: [{ name: 'Iron Sword', damage: 2, stat: 'might', properties: 'Finesse' }],
  },
  {
    id: 'bandit_chief',
    name: 'Bandit Chief',
    category: 'humanoid',
    hp: 15,
    fp: 6,
    dr: 3,
    stats: { might: 14, agility: 12, magic: 4, guile: 12 },
    attacks: [{ name: 'Steel Greatsword', damage: 5, stat: 'might', properties: 'Finesse' }],
    abilities: ['Power Attack (+3 damage for 3 FP)'],
    isBoss: true,
  },
  {
    id: 'forsworn',
    name: 'Forsworn',
    category: 'humanoid',
    hp: 10,
    fp: 6,
    dr: 1,
    stats: { might: 10, agility: 12, magic: 10, guile: 8 },
    attacks: [{ name: 'Forsworn Sword', damage: 2, stat: 'might' }],
    abilities: ['Can cast Flames (1 FP)'],
  },
  {
    id: 'forsworn_briarheart',
    name: 'Forsworn Briarheart',
    category: 'humanoid',
    hp: 18,
    fp: 12,
    dr: 2,
    stats: { might: 12, agility: 14, magic: 14, guile: 10 },
    attacks: [
      { name: 'Forsworn Sword', damage: 3, stat: 'might' },
      { name: 'Firebolt', damage: 3, stat: 'magic', properties: 'Ranged' }
    ],
    abilities: ['Can cast Firebolt (2 FP)', 'Can cast Oakflesh (2 FP)'],
    isBoss: true,
  },
  
  // Undead
  {
    id: 'skeleton',
    name: 'Skeleton',
    category: 'undead',
    hp: 6,
    dr: 1,
    stats: { might: 10, agility: 10, magic: 4, guile: 4 },
    attacks: [{ name: 'Ancient Sword', damage: 2, stat: 'might' }],
    abilities: ['Immune to fear', 'Immune to poison'],
  },
  {
    id: 'draugr',
    name: 'Draugr',
    category: 'undead',
    hp: 10,
    dr: 2,
    stats: { might: 14, agility: 8, magic: 6, guile: 6 },
    attacks: [{ name: 'Ancient Nord Blade', damage: 3, stat: 'might' }],
    abilities: ['Immune to fear', 'Immune to mind-affecting spells'],
  },
  {
    id: 'draugr_deathlord',
    name: 'Draugr Deathlord',
    category: 'undead',
    hp: 25,
    fp: 8,
    dr: 4,
    stats: { might: 16, agility: 10, magic: 12, guile: 8 },
    attacks: [
      { name: 'Ebony Battleaxe', damage: 6, stat: 'might', properties: 'Deep Wounds' },
      { name: 'Unrelenting Force', damage: 4, stat: 'magic', properties: 'Knockback, costs 3 FP' }
    ],
    abilities: ['Immune to fear', 'Shout: Unrelenting Force', 'Shout: Disarm'],
    isBoss: true,
  },
  {
    id: 'vampire',
    name: 'Vampire',
    category: 'undead',
    hp: 18,
    fp: 12,
    dr: 3,
    stats: { might: 14, agility: 14, magic: 14, guile: 14 },
    attacks: [{ name: 'Drain Life', damage: 4, stat: 'magic', properties: 'Heals vampire for damage dealt' }],
    abilities: ['Lifesteal on melee', 'Vampiric Drain spell', 'Weakness to fire (+2 damage)'],
    isBoss: true,
  },
  
  // Beasts
  {
    id: 'wolf',
    name: 'Wolf',
    category: 'beast',
    hp: 6,
    dr: 0,
    stats: { might: 10, agility: 14, magic: 4, guile: 8 },
    attacks: [{ name: 'Bite', damage: 2, stat: 'agility' }],
    abilities: ['Pack Tactics: +1 damage if ally adjacent to target'],
  },
  {
    id: 'ice_wolf',
    name: 'Ice Wolf',
    category: 'beast',
    hp: 10,
    dr: 1,
    stats: { might: 12, agility: 14, magic: 6, guile: 8 },
    attacks: [{ name: 'Freezing Bite', damage: 3, stat: 'agility', properties: 'May apply Slowed' }],
    abilities: ['Pack Tactics', 'Frost Resistance'],
  },
  {
    id: 'frostbite_spider',
    name: 'Frostbite Spider',
    category: 'beast',
    hp: 8,
    dr: 1,
    stats: { might: 12, agility: 10, magic: 4, guile: 6 },
    attacks: [{ name: 'Bite', damage: 2, stat: 'might', properties: 'Poison: 1 damage/round for 2 rounds' }],
    abilities: ['Poison bite', 'Web spit (immobilize)'],
  },
  {
    id: 'giant_frostbite_spider',
    name: 'Giant Frostbite Spider',
    category: 'beast',
    hp: 20,
    dr: 2,
    stats: { might: 16, agility: 8, magic: 4, guile: 6 },
    attacks: [{ name: 'Venomous Bite', damage: 4, stat: 'might', properties: 'Poison: 2 damage/round for 3 rounds' }],
    abilities: ['Strong poison', 'Web spit (immobilize)', 'Can climb walls'],
    isBoss: true,
  },
  {
    id: 'bear',
    name: 'Bear',
    category: 'beast',
    hp: 15,
    dr: 2,
    stats: { might: 16, agility: 8, magic: 4, guile: 6 },
    attacks: [{ name: 'Claw', damage: 4, stat: 'might' }],
    abilities: ['Powerful charge'],
  },
  {
    id: 'sabre_cat',
    name: 'Sabre Cat',
    category: 'beast',
    hp: 12,
    dr: 1,
    stats: { might: 14, agility: 16, magic: 4, guile: 8 },
    attacks: [{ name: 'Pounce', damage: 4, stat: 'agility', properties: 'Can attack twice if first hits' }],
    abilities: ['Pounce attack', 'Fast movement'],
  },
  {
    id: 'troll',
    name: 'Troll',
    category: 'beast',
    hp: 25,
    dr: 2,
    stats: { might: 16, agility: 8, magic: 4, guile: 6 },
    attacks: [{ name: 'Claw', damage: 5, stat: 'might' }],
    abilities: ['Regeneration: Heals 2 HP at start of turn', 'Weakness to fire (stops regen for 1 round)'],
    isBoss: true,
  },
  {
    id: 'frost_troll',
    name: 'Frost Troll',
    category: 'beast',
    hp: 30,
    dr: 3,
    stats: { might: 17, agility: 8, magic: 6, guile: 6 },
    attacks: [{ name: 'Freezing Claw', damage: 6, stat: 'might', properties: 'May apply Slowed' }],
    abilities: ['Regeneration: Heals 3 HP at start of turn', 'Weakness to fire', 'Frost Resistance'],
    isBoss: true,
  },
  {
    id: 'giant',
    name: 'Giant',
    category: 'beast',
    hp: 35,
    dr: 3,
    stats: { might: 18, agility: 6, magic: 4, guile: 6 },
    attacks: [{ name: 'Club', damage: 8, stat: 'might', properties: 'Staggering Force' }],
    abilities: ['Massive: Cannot be staggered or knocked prone', 'Ground Slam AoE'],
    isBoss: true,
  },
  {
    id: 'mammoth',
    name: 'Mammoth',
    category: 'beast',
    hp: 45,
    dr: 4,
    stats: { might: 18, agility: 4, magic: 4, guile: 4 },
    attacks: [
      { name: 'Tusks', damage: 7, stat: 'might' },
      { name: 'Stomp', damage: 5, stat: 'might', properties: 'AoE, hits all adjacent' }
    ],
    abilities: ['Massive', 'Trample charge'],
    isBoss: true,
  },
  
  // Daedra/Atronachs
  {
    id: 'flame_atronach',
    name: 'Flame Atronach',
    category: 'daedra',
    hp: 8,
    fp: 10,
    dr: 2,
    stats: { might: 6, agility: 12, magic: 14, guile: 10 },
    attacks: [{ name: 'Firebolt', damage: 3, stat: 'magic', properties: 'Ranged, may cause Burning' }],
    abilities: ['Immune to fire', 'Vulnerable to frost (+1 damage)', 'Explodes on death (2 fire damage to adjacent)'],
  },
  {
    id: 'frost_atronach',
    name: 'Frost Atronach',
    category: 'daedra',
    hp: 15,
    dr: 5,
    stats: { might: 16, agility: 6, magic: 12, guile: 10 },
    attacks: [{ name: 'Slam', damage: 5, stat: 'might', properties: 'Can apply Slowed' }],
    abilities: ['Immune to frost', 'Vulnerable to fire (+1 damage)', 'Frostbite Slam: Target is Slowed'],
  },
  {
    id: 'storm_atronach',
    name: 'Storm Atronach',
    category: 'daedra',
    hp: 12,
    fp: 15,
    dr: 4,
    stats: { might: 10, agility: 8, magic: 17, guile: 12 },
    attacks: [{ name: 'Chain Lightning', damage: 4, stat: 'magic', properties: 'Jumps to 1 additional target, drains 2 FP' }],
    abilities: ['Immune to shock', 'Levitation', 'FP drain on hit'],
    isBoss: true,
  },
  {
    id: 'dremora',
    name: 'Dremora',
    category: 'daedra',
    hp: 20,
    fp: 8,
    dr: 5,
    stats: { might: 16, agility: 12, magic: 12, guile: 14 },
    attacks: [{ name: 'Daedric Greatsword', damage: 7, stat: 'might', properties: 'Finesse, fire damage' }],
    abilities: ['Fire enchanted weapons', 'Immune to fear', 'Can cast Firebolt'],
    isBoss: true,
  },
  
  // Constructs
  {
    id: 'dwarven_spider',
    name: 'Dwarven Spider',
    category: 'construct',
    hp: 8,
    dr: 3,
    stats: { might: 10, agility: 12, magic: 8, guile: 6 },
    attacks: [{ name: 'Shock Bolt', damage: 2, stat: 'magic', properties: 'Drains 1 FP' }],
    abilities: ['Immune to poison', 'Immune to mind-affecting', 'Self-destructs on death'],
  },
  {
    id: 'dwarven_sphere',
    name: 'Dwarven Sphere',
    category: 'construct',
    hp: 15,
    dr: 4,
    stats: { might: 14, agility: 12, magic: 4, guile: 8 },
    attacks: [
      { name: 'Blade', damage: 4, stat: 'might' },
      { name: 'Crossbow', damage: 3, stat: 'agility' }
    ],
    abilities: ['Immune to poison', 'Immune to mind-affecting', 'Resistant to frost'],
  },
  {
    id: 'dwarven_centurion',
    name: 'Dwarven Centurion',
    category: 'construct',
    hp: 40,
    dr: 8,
    stats: { might: 18, agility: 6, magic: 8, guile: 6 },
    attacks: [
      { name: 'Hammer Arm', damage: 10, stat: 'might', properties: 'Staggering' },
      { name: 'Steam Breath', damage: 6, stat: 'magic', properties: 'Cone AoE' }
    ],
    abilities: ['Immune to poison', 'Immune to mind-affecting', 'Steam attack', 'Massive'],
    isBoss: true,
  },
  
  // Spellcasters
  {
    id: 'necromancer',
    name: 'Necromancer',
    category: 'humanoid',
    hp: 10,
    fp: 15,
    dr: 0,
    stats: { might: 6, agility: 10, magic: 15, guile: 12 },
    attacks: [
      { name: 'Ice Spike', damage: 2, stat: 'magic', properties: 'Ranged, 2 FP drain' },
      { name: 'Dagger', damage: 2, stat: 'agility' }
    ],
    abilities: ['Raise Zombie (3 FP)', 'Ice Spike (2 FP)', 'Lightning Bolt (2 FP)'],
  },
  {
    id: 'hagraven',
    name: 'Hagraven',
    category: 'humanoid',
    hp: 12,
    fp: 15,
    dr: 1,
    stats: { might: 8, agility: 10, magic: 16, guile: 12 },
    attacks: [
      { name: 'Claws', damage: 3, stat: 'might' },
      { name: 'Fireball', damage: 5, stat: 'magic', properties: 'AoE, costs 4 FP' }
    ],
    abilities: ['Can cast Fireball (4 FP)', 'Can cast Fear (3 FP)', 'Fly short distances'],
    isBoss: true,
  },
  {
    id: 'dragon_priest',
    name: 'Dragon Priest',
    category: 'undead',
    hp: 30,
    fp: 25,
    dr: 5,
    stats: { might: 10, agility: 12, magic: 18, guile: 16 },
    attacks: [
      { name: 'Staff Blast', damage: 6, stat: 'magic' },
      { name: 'Wall of Fire', damage: 3, stat: 'magic', properties: 'AoE zone, 4 FP' }
    ],
    abilities: ['Levitation', 'Can cast expert-level spells', 'Immune to fear', 'Mask grants special power'],
    isBoss: true,
  },
  
  // Dragons
  {
    id: 'dragon',
    name: 'Dragon',
    category: 'dragon',
    hp: 50,
    fp: 20,
    dr: 6,
    stats: { might: 18, agility: 14, magic: 16, guile: 14 },
    attacks: [
      { name: 'Bite', damage: 8, stat: 'might' },
      { name: 'Tail Sweep', damage: 5, stat: 'might', properties: 'Hits all adjacent enemies' },
      { name: 'Fire Breath', damage: 10, stat: 'magic', properties: 'Cone AoE, causes Burning 2' }
    ],
    abilities: ['Flight', 'Immune to fear', 'Fire Breath (recharges on 5-6 on d6)'],
    isBoss: true,
  },
  {
    id: 'frost_dragon',
    name: 'Frost Dragon',
    category: 'dragon',
    hp: 55,
    fp: 20,
    dr: 7,
    stats: { might: 18, agility: 12, magic: 16, guile: 14 },
    attacks: [
      { name: 'Bite', damage: 8, stat: 'might' },
      { name: 'Wing Buffet', damage: 4, stat: 'might', properties: 'Knockback' },
      { name: 'Frost Breath', damage: 8, stat: 'magic', properties: 'Cone AoE, causes Slowed, FP drain' }
    ],
    abilities: ['Flight', 'Immune to fear', 'Immune to frost', 'Frost Breath'],
    isBoss: true,
  },
  {
    id: 'elder_dragon',
    name: 'Elder Dragon',
    category: 'dragon',
    hp: 75,
    fp: 30,
    dr: 8,
    stats: { might: 18, agility: 14, magic: 18, guile: 16 },
    attacks: [
      { name: 'Bite', damage: 10, stat: 'might' },
      { name: 'Tail Sweep', damage: 6, stat: 'might', properties: 'Hits all adjacent' },
      { name: 'Fire Breath', damage: 12, stat: 'magic', properties: 'Cone AoE, causes Burning 3' }
    ],
    abilities: ['Flight', 'Immune to fear', 'Fire or Frost Breath', 'Shout: Unrelenting Force'],
    isBoss: true,
  },
  
  // Summons (from Conjuration spells)
  {
    id: 'familiar',
    name: 'Familiar',
    category: 'summon',
    hp: 5,
    dr: 1,
    stats: { might: 10, agility: 12, magic: 6, guile: 8 },
    attacks: [{ name: 'Bite', damage: 2, stat: 'agility' }],
  },
  {
    id: 'zombie',
    name: 'Zombie',
    category: 'summon',
    hp: 8,
    dr: 2,
    stats: { might: 12, agility: 6, magic: 6, guile: 6 },
    attacks: [{ name: 'Slam', damage: 3, stat: 'might' }],
    abilities: ['Slow', 'Immune to fear'],
  },
  {
    id: 'revenant',
    name: 'Revenant',
    category: 'summon',
    hp: 18,
    dr: 4,
    stats: { might: 15, agility: 10, magic: 8, guile: 10 },
    attacks: [{ name: 'Weapon Strike', damage: 6, stat: 'might' }],
    abilities: ['Revenant: When reduced to 0 HP, rises again with half HP once'],
  },
  {
    id: 'dremora_lord',
    name: 'Dremora Lord',
    category: 'summon',
    hp: 25,
    dr: 6,
    stats: { might: 18, agility: 12, magic: 14, guile: 16 },
    attacks: [{ name: 'Daedric Greatsword', damage: 8, stat: 'might', properties: 'Fire damage' }],
    abilities: ['Fiery Presence: Adjacent enemies take 2 fire damage', 'Daedric Commander: Allies deal +1 damage'],
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
