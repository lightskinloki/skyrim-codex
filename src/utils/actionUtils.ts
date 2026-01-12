// Action utilities for combat action economy
import { Character, CharacterSkill, Equipment } from "@/types/character";
import { Spell } from "@/types/spell";
import { spells as allSpells } from "@/data/spells";
import { skills as allSkills } from "@/data/skills";

// Bonus action ability definition
export interface BonusActionAbility {
  id: string;
  name: string;
  source: string; // e.g., "One-Handed (Apprentice)" or "Standing Stone"
  fpCost: number;
  description: string;
  limitation?: 'per combat' | 'per adventure';
}

// Major action option
export interface MajorActionOption {
  id: string;
  name: string;
  type: 'attack' | 'spell' | 'ability' | 'standard';
  fpCost?: number;
  damage?: number;
  description: string;
  source?: string;
}

// Minor action option  
export interface MinorActionOption {
  id: string;
  name: string;
  type: 'movement' | 'defensive' | 'item' | 'ability' | 'attack';
  fpCost?: number;
  description: string;
  requiresShield?: boolean;
  source?: string;
}

/**
 * Get all available bonus actions for a character based on their skills/perks
 */
export function getBonusActions(character: Character): BonusActionAbility[] {
  const bonusActions: BonusActionAbility[] = [];
  
  // Helper to get rank value
  const getRankValue = (rank: string): number => {
    const ranks: Record<string, number> = { 'Novice': 1, 'Apprentice': 2, 'Adept': 3, 'Expert': 4, 'Master': 5 };
    return ranks[rank] || 0;
  };

  // Light Armor: Wind Walker (Adept) - Regain FP (Free Action)
  for (const charSkill of character.skills) {
    if (charSkill.skillId === 'light-armor' && getRankValue(charSkill.rank) >= 3) {
      bonusActions.push({
        id: 'wind-walker',
        name: 'Wind Walker',
        source: `Light Armor`,
        fpCost: 0,
        description: 'Regain 6 FP as a free action.',
        limitation: 'per combat',
      });
    }
  }
  
  // Standing Stone bonus actions
  if (character.standingStone.id === 'warrior') {
    bonusActions.push({
      id: 'fighters-rush',
      name: "Fighter's Rush",
      source: 'The Warrior',
      fpCost: 0,
      description: 'Once per combat, after taking damage, gain 3 FP.',
      limitation: 'per combat',
    });
  }
  
  // Thief Stone: Fleet Footed (Explicitly says "Does not use Minor Action")
  if (character.standingStone.id === 'thief') {
    bonusActions.push({
      id: 'fleet-footed',
      name: 'Fleet Footed',
      source: 'The Thief',
      fpCost: 1, 
      description: 'Impose disadvantage on one enemy attacking you.',
    });
  }

  // Redguard: Adrenaline Rush (Free Action)
  if (character.race.id === 'redguard') {
    bonusActions.push({
      id: 'adrenaline-rush',
      name: 'Adrenaline Rush',
      source: 'Redguard',
      fpCost: 0,
      description: 'Immediately regain 10 FP.',
      limitation: 'per adventure',
    });
  }
  
  return bonusActions;
}

/**
 * Get all valid major actions for a character
 */
export function getValidMajorActions(character: Character): MajorActionOption[] {
  const actions: MajorActionOption[] = [];
  
  // Standard actions available to everyone
  
  // Tactical Withdrawal
  actions.push({
    id: 'tactical-withdrawal',
    name: 'Tactical Withdrawal',
    type: 'standard',
    description: 'Roll Might (Shove), Agility (Slip), or Guile (Feint) to escape melee without taking a hit.',
  });
  
  // Add equipped weapon attacks
  for (const equip of character.equipment) {
    if (equip.type === 'weapon' && equip.damage) {
      actions.push({
        id: `attack-${equip.id}`,
        name: `Attack (${equip.name})`,
        type: 'attack',
        damage: equip.damage,
        description: equip.description || `Attack with ${equip.name} for ${equip.damage} damage.`,
        source: equip.name,
      });

      // Power Attack Logic
      let powerAttackBonus = 2; // Default rule: +2 Damage
      
      // Check for Savage Strike Perk (One-Handed Adept)
      const oneHanded = character.skills.find(s => s.skillId === 'one-handed');
      const isTwoHanded = equip.name.toLowerCase().includes('great') || 
                          equip.name.toLowerCase().includes('hammer') || 
                          equip.name.toLowerCase().includes('battleaxe') ||
                          equip.name.toLowerCase().includes('bow') || 
                          equip.name.toLowerCase().includes('crossbow');

      // If One-Handed Adept AND using a One-Handed weapon
      if (oneHanded && getRankValue(oneHanded.rank) >= 3 && !isTwoHanded) {
         powerAttackBonus = 3; // +2 Base + 1 Perk Bonus
      }

      actions.push({
        id: `power-attack-${equip.id}`,
        name: `Power Attack (${equip.name})`,
        type: 'attack',
        fpCost: 3,
        damage: equip.damage + powerAttackBonus,
        description: `Spend 3 FP. Deal +${powerAttackBonus} Damage.`,
        source: equip.name,
      });
     }
  }
  
  // Add Khajiit claws if applicable
  if (character.race.id === 'khajiit') {
    actions.push({
      id: 'attack-claws',
      name: 'Attack (Khajiit Claws)',
      type: 'attack',
      damage: 2, // Base, scales with tier
      description: 'Natural weapons that scale with character tier.',
      source: 'Racial',
    });
  }
  
  // Add known spells based on magic skills
  const knownSpells = getKnownSpells(character);
  for (const spell of knownSpells) {
    actions.push({
      id: `spell-${(spell.name || 'unknown').toLowerCase().replace(/\s+/g, '-')}`,
      name: spell.name,
      type: 'spell',
      fpCost: spell.fpCost,
      description: spell.description,
      source: spell.school,
    });
  }
  
  // Add special skill abilities that use Major Action
  for (const charSkill of character.skills) {
    // Two-Handed: Devastating Charge (Adept)
    if (charSkill.skillId === 'two-handed' && getRankValue(charSkill.rank) >= getRankValue('Adept')) {
      actions.push({
        id: 'devastating-charge',
        name: 'Devastating Charge',
        type: 'ability',
        description: 'Make a focused attack with +2 to Might roll and +2 damage. Uses both Major and Minor Action.',
        source: `Two-Handed (${charSkill.rank})`,
      });
    }
    
    // Speech: Intimidation (Adept)
    if (charSkill.skillId === 'speech' && getRankValue(charSkill.rank) >= getRankValue('Adept')) {
      actions.push({
        id: 'intimidate',
        name: 'Intimidate',
        type: 'ability',
        description: 'Make a Guile roll to terrify a weak-willed enemy, causing them to lose their next Major Action.',
        source: `Speech (${charSkill.rank})`,
      });
    }
  }
  
  return actions;
}

/**
 * Get all valid minor actions for a character
 */
export function getValidMinorActions(character: Character): MinorActionOption[] {
  const actions: MinorActionOption[] = [];
  
  // Standard minor actions
  actions.push({
    id: 'move',
    name: 'Move',
    type: 'movement',
    description: 'Move up to your normal movement speed.',
  });
  
  actions.push({
    id: 'draw-weapon',
    name: 'Draw/Stow Weapon',
    type: 'item',
    description: 'Draw or put away a weapon.',
  });
  
  actions.push({
    id: 'interact',
    name: 'Interact with Object',
    type: 'item',
    description: 'Open a door, pull a lever, pick up an item, etc.',
  });
  
  // Check for shield for Brace action
  const hasShield = character.equipment.some(e => e.type === 'shield');
  if (hasShield) {
    actions.push({
      id: 'brace',
      name: 'Brace (Shield)',
      type: 'defensive',
      description: 'Raise your shield. Reduce damage of next attack by your shield\'s DR bonus.',
      requiresShield: true,
    });
  }
  
 // Drink potion from inventory
  const potions = character.inventory.items.filter(item => 
    // FIXED: Added safe check (item.name?)
    item.name?.toLowerCase().includes('potion') && item.quantity > 0
  );
  for (const potion of potions) {
    // FIXED: Added fallback for ID generation
    const safeName = potion.name || 'unknown-potion';
    actions.push({
      id: `drink-${safeName.toLowerCase().replace(/\s+/g, '-')}`,
      name: `Drink ${safeName}`,
      type: 'item',
      description: `Consume one ${safeName} from your inventory.`,
    });
  }

  // POISONS (Rulebook: "Applying a poison is a Minor Action")
  const poisons = character.inventory.items.filter(item => 
    item.name?.toLowerCase().includes('poison') && item.quantity > 0
  );
  for (const poison of poisons) {
    const safeName = poison.name || 'Unknown Poison';
    actions.push({
      id: `apply-${safeName.toLowerCase().replace(/\s+/g, '-')}`,
      name: `Apply ${safeName}`,
      type: 'item',
      description: `Coat weapon with poison.`,
    });
  }
  
  // Dodge action (Thief Stone gets special version)
  actions.push({
    id: 'dodge',
    name: 'Dodge',
    type: 'defensive',
    fpCost: 1,
    description: 'Spend 1 FP. The next enemy that attacks you this round does so with Disadvantage.',
  });
  
  // Sneak: Hide (Novice+)
  const sneakSkill = character.skills.find(s => s.skillId === 'sneak');
  if (sneakSkill) {
    actions.push({
      id: 'hide',
      name: 'Hide',
      type: 'movement',
      description: 'Make an Agility roll to become Hidden.',
    });
  }
  
  // Lesser Ward / other wards as Minor Actions
  const restorationSkill = character.skills.find(s => s.skillId === 'restoration');
  if (restorationSkill) {
    if (getRankValue(restorationSkill.rank) >= getRankValue('Novice')) {
      actions.push({
        id: 'lesser-ward',
        name: 'Lesser Ward',
        type: 'defensive',
        fpCost: 2,
        description: 'Create a magical field granting DR 3 against spells until your next turn.',
      });
    }
    if (getRankValue(restorationSkill.rank) >= getRankValue('Adept')) {
      actions.push({
        id: 'steadfast-ward',
        name: 'Steadfast Ward',
        type: 'defensive',
        fpCost: 4,
        description: 'Create a superior ward granting DR 5 against spells until your next turn.',
      });
    }
    if (getRankValue(restorationSkill.rank) >= getRankValue('Expert')) {
      actions.push({
        id: 'greater-ward',
        name: 'Greater Ward',
        type: 'defensive',
        fpCost: 6,
        description: 'Create a master\'s ward granting DR 8 against spells until your next turn.',
      });
    }
  }
  
  // --- SKILL PERKS (Minor Actions) ---

  // Helper to get rank (re-defined here for scope)
  const getRankValue = (rank: string): number => {
    const ranks: Record<string, number> = { 'Novice': 1, 'Apprentice': 2, 'Adept': 3, 'Expert': 4, 'Master': 5 };
    return ranks[rank] || 0;
  };

  // One-Handed: Fighting Stance (Apprentice)
  const oneHanded = character.skills.find(s => s.skillId === 'one-handed');
  if (oneHanded && getRankValue(oneHanded.rank) >= 2) {
    const hasDualFlurry = getRankValue(oneHanded.rank) >= 4; // Expert
    actions.push({
      id: 'fighting-stance',
      name: 'Fighting Stance',
      type: 'ability',
      fpCost: hasDualFlurry ? 0 : 3,
      description: 'Make an additional attack with your one-handed weapon.',
      source: `One-Handed`,
    });
  }

  // Archery: Quick Shot (Expert)
  const archery = character.skills.find(s => s.skillId === 'archery');
  if (archery && getRankValue(archery.rank) >= 4) {
    actions.push({
      id: 'quick-shot',
      name: 'Quick Shot',
      type: 'ability',
      fpCost: 3,
      description: 'Make a Power Shot (Slow target) as a Minor Action.',
      source: `Archery`,
    });
  }

  // Sneak: Shadow Warrior (Expert) - Vanish
  if (sneakSkill && getRankValue(sneakSkill.rank) >= 4) {
    actions.push({
      id: 'shadow-warrior',
      name: 'Shadow Warrior',
      type: 'defensive',
      fpCost: 6,
      description: 'Become Hidden even while being observed.',
      source: `Sneak`,
    });
  }
  
  return actions;
}

/**
 * Get all spells the character can cast based on their magic skill ranks
 */
export function getKnownSpells(character: Character): Spell[] {
  const knownSpells: Spell[] = [];
  
  const magicSkills = ['destruction', 'restoration', 'alteration', 'illusion', 'conjuration'];
  
  for (const skillId of magicSkills) {
    const charSkill = character.skills.find(s => s.skillId === skillId);
    if (!charSkill) continue;
    
    const maxTier = charSkill.rank;
    const schoolName = skillId.charAt(0).toUpperCase() + skillId.slice(1);
    
    // Get all spells from this school up to the character's rank
    const schoolSpells = allSpells.filter(spell => 
      spell.school === schoolName && 
      getRankValue(spell.tier) <= getRankValue(maxTier)
    );
    
    knownSpells.push(...schoolSpells);
  }
  
  return knownSpells;
}

/**
 * Convert rank string to numeric value for comparison
 */
function getRankValue(rank: string): number {
  const ranks: Record<string, number> = {
    'Novice': 1,
    'Apprentice': 2,
    'Adept': 3,
    'Expert': 4,
    'Master': 5,
  };
  return ranks[rank] || 0;
}

/**
 * Calculate total DR from equipment
 */
export function calculateEquipmentDR(character: Character): number {
  let totalDR = 0;
  
  for (const equip of character.equipment) {
    if ((equip.type === 'armor' || equip.type === 'shield') && equip.dr) {
      totalDR += equip.dr;
    }
  }
  
  return totalDR;
}
