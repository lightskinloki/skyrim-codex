import { Spell } from "@/types/spell";

export const spells: Spell[] = [
  // DESTRUCTION - NOVICE
  { 
    name: "Flames", 
    school: "Destruction", 
    tier: "Novice", 
    fpCost: 1, 
    description: "Project a stream of fire dealing 1 fire damage to a single target in melee range. The target starts Burning for 1 damage at the start of their next turn." 
  },
  { 
    name: "Frostbite", 
    school: "Destruction", 
    tier: "Novice", 
    fpCost: 1, 
    description: "Project a jet of freezing cold dealing 1 frost damage and draining 1 FP from a single target in melee range." 
  },
  { 
    name: "Sparks", 
    school: "Destruction", 
    tier: "Novice", 
    fpCost: 1, 
    description: "Project a torrent of lightning draining 2 FP from a single target in melee range." 
  },

  // DESTRUCTION - APPRENTICE
  { 
    name: "Firebolt", 
    school: "Destruction", 
    tier: "Apprentice", 
    fpCost: 2, 
    description: "Launch a bolt of fire dealing 3 fire damage. Targets hit start Burning for 1 damage per turn for 2 turns." 
  },
  { 
    name: "Ice Spike", 
    school: "Destruction", 
    tier: "Apprentice", 
    fpCost: 2, 
    description: "Launch a deadly shard of ice dealing 2 frost damage and 2 FP damage." 
  },
  { 
    name: "Lightning Bolt", 
    school: "Destruction", 
    tier: "Apprentice", 
    fpCost: 2, 
    description: "Launch a bolt of lightning dealing 1 shock damage and 5 FP damage." 
  },
  { 
    name: "Fire Rune", 
    school: "Destruction", 
    tier: "Apprentice", 
    fpCost: 3, 
    description: "Place a magical trap on a nearby surface. The next creature to approach triggers an explosion dealing 4 fire damage and Burning for 1 damage per turn for 2 turns." 
  },
  { 
    name: "Frost Rune", 
    school: "Destruction", 
    tier: "Apprentice", 
    fpCost: 3, 
    description: "Place a chilling trap. The next creature to approach triggers an explosion dealing 3 frost damage and becoming Slowed (cannot use Minor Action for movement) for their next turn." 
  },
  { 
    name: "Lightning Rune", 
    school: "Destruction", 
    tier: "Apprentice", 
    fpCost: 3, 
    description: "Place a shocking trap. The next creature to approach triggers an explosion dealing 2 shock damage and draining 6 FP." 
  },

  // DESTRUCTION - ADEPT
  { 
    name: "Fireball", 
    school: "Destruction", 
    tier: "Adept", 
    fpCost: 4, 
    description: "A fiery explosion deals 5 fire damage to your target and 3 fire damage to anyone within 20 feet. All targets hit start Burning for 1 damage per turn for 3 turns." 
  },
  { 
    name: "Ice Storm", 
    school: "Destruction", 
    tier: "Adept", 
    fpCost: 4, 
    description: "A swirling vortex of ice moves forward in a line, dealing 3 frost damage and 3 FP damage per turn to all in its path. All targets hit are Slowed." 
  },
  { 
    name: "Chain Lightning", 
    school: "Destruction", 
    tier: "Adept", 
    fpCost: 4, 
    description: "A bolt of lightning strikes your primary target for 3 shock damage and drains 5 FP, then leaps to one additional target for full effect." 
  },
  { 
    name: "Flame Cloak", 
    school: "Destruction", 
    tier: "Adept", 
    fpCost: 4, 
    description: "For 2 rounds, you are wreathed in fire. Any enemy that hits you with a melee attack or stands next to you takes 2 fire damage and Burns for 1 round." 
  },
  { 
    name: "Frost Cloak", 
    school: "Destruction", 
    tier: "Adept", 
    fpCost: 4, 
    description: "For 2 rounds, you are surrounded by biting frost. Any enemy that hits you or stands next to you takes 2 frost damage and 2 FP damage." 
  },
  { 
    name: "Lightning Cloak", 
    school: "Destruction", 
    tier: "Adept", 
    fpCost: 4, 
    description: "For 2 rounds, you are shrouded in arcing electricity. Any enemy that hits you or stands next to you takes 1 shock damage and loses 4 FP." 
  },

  // DESTRUCTION - EXPERT
  { 
    name: "Incinerate", 
    school: "Destruction", 
    tier: "Expert", 
    fpCost: 5, 
    description: "Launch an immense blast of fire dealing 8 fire damage. Targets hit are guaranteed to start Burning for 2 damage per turn for 3 turns." 
  },
  { 
    name: "Icy Spear", 
    school: "Destruction", 
    tier: "Expert", 
    fpCost: 5, 
    description: "Launch a massive spear of ice dealing 6 frost damage and 6 FP damage. Targets hit are Slowed for two turns." 
  },
  { 
    name: "Thunderbolt", 
    school: "Destruction", 
    tier: "Expert", 
    fpCost: 5, 
    description: "Launch a powerful bolt of lightning dealing 4 shock damage and draining 8 FP. If this kills a non-boss enemy, they disintegrate into ash." 
  },
  { 
    name: "Wall of Flames", 
    school: "Destruction", 
    tier: "Expert", 
    fpCost: 5, 
    description: "Create a wall of fire on the ground in a designated area for 1 round. Enemies entering or standing in the wall take 3 fire damage per turn." 
  },
  { 
    name: "Wall of Frost", 
    school: "Destruction", 
    tier: "Expert", 
    fpCost: 5, 
    description: "Create a wall of biting frost for 1 round. Enemies entering or standing in it take 2 frost damage and 2 FP damage per turn and are Slowed." 
  },
  { 
    name: "Wall of Storms", 
    school: "Destruction", 
    tier: "Expert", 
    fpCost: 5, 
    description: "Create a wall of electrical energy for 1 round. Enemies entering or standing in it take 1 shock damage and lose 5 FP per turn." 
  },

  // DESTRUCTION - MASTER
  { 
    name: "Fire Storm", 
    school: "Destruction", 
    tier: "Master", 
    fpCost: 8, 
    description: "Once per encounter. After concentrating for a full turn (using both your Major and Minor action), unleash a massive explosion centered on yourself. All creatures within 30 feet (excluding you) take 16 fire damage. Those within 50 feet take half damage. All targets Burn for 2 damage for 2 rounds." 
  },
  { 
    name: "Blizzard", 
    school: "Destruction", 
    tier: "Master", 
    fpCost: 8, 
    description: "Once per encounter. Create a raging blizzard in a 40 foot area for 2 rounds. All creatures within it (excluding you) take 10 frost damage at the start of their turn and are Slowed. Visibility is heavily obscured." 
  },
  { 
    name: "Lightning Storm", 
    school: "Destruction", 
    tier: "Master", 
    fpCost: 8, 
    description: "Once per encounter. Channel a continuous beam of lightning at one target dealing 8 shock damage and draining 15 FP. You can sustain the beam on subsequent turns by spending 8 FP and your Major Action. You cannot move while channeling." 
  },

  // RESTORATION - NOVICE
  { 
    name: "Healing", 
    school: "Restoration", 
    tier: "Novice", 
    fpCost: 2, 
    description: "Channel restorative energy, healing yourself or a creature you touch for 2 HP." 
  },
  { 
    name: "Lesser Ward", 
    school: "Restoration", 
    tier: "Novice", 
    fpCost: 2, 
    description: "As a Minor Action, create a magical field. Until the start of your next turn, you gain Damage Reduction 3 against spells. You can hold the ward on subsequent turns by spending 1 FP and your Minor Action." 
  },

  // RESTORATION - APPRENTICE
  { 
    name: "Fast Healing", 
    school: "Restoration", 
    tier: "Apprentice", 
    fpCost: 3, 
    description: "A burst of healing energy restores 5 HP to yourself." 
  },
  { 
    name: "Heal Other", 
    school: "Restoration", 
    tier: "Apprentice", 
    fpCost: 3, 
    description: "Project a ray of light at a target within sight, restoring 4 HP." 
  },
  { 
    name: "Sun Fire", 
    school: "Restoration", 
    tier: "Apprentice", 
    fpCost: 2, 
    description: "A bolt of pure sunlight strikes a target, dealing 3 damage. This damage is doubled against undead targets." 
  },
  { 
    name: "Turn Lesser Undead", 
    school: "Restoration", 
    tier: "Apprentice", 
    fpCost: 3, 
    description: "Release a wave of holy energy. A single undead creature (e.g., Draugr, Skeleton) must succeed on a Guile roll or be terrified, losing its next turn." 
  },

  // RESTORATION - ADEPT
  { 
    name: "Healing Hands", 
    school: "Restoration", 
    tier: "Adept", 
    fpCost: 4, 
    description: "Channel a continuous stream of healing energy into an ally you are touching, restoring 6 HP for each turn you maintain the spell (costs 4 FP per turn)." 
  },
  { 
    name: "Steadfast Ward", 
    school: "Restoration", 
    tier: "Adept", 
    fpCost: 3, 
    description: "As a Minor Action, create a superior magical field. Until the start of your next turn, you gain Damage Reduction 5 against spells." 
  },
  { 
    name: "Vampire's Bane", 
    school: "Restoration", 
    tier: "Adept", 
    fpCost: 4, 
    description: "A solar explosion erupts around a target, dealing 5 damage to them and 2 damage to anyone nearby. This damage is doubled against undead targets." 
  },
  { 
    name: "Turn Undead", 
    school: "Restoration", 
    tier: "Adept", 
    fpCost: 4, 
    description: "Release a wave of holy energy. Up to two undead creatures are terrified for 2 rounds on a failed Guile roll." 
  },

  // RESTORATION - EXPERT
  { 
    name: "Grand Healing", 
    school: "Restoration", 
    tier: "Expert", 
    fpCost: 5, 
    description: "Release a powerful wave of healing energy, restoring 8 HP to yourself and all allies within 20 feet." 
  },
  { 
    name: "Greater Ward", 
    school: "Restoration", 
    tier: "Expert", 
    fpCost: 4, 
    description: "As a Minor Action, create a master's ward, granting Damage Reduction 8 against spells until your next turn." 
  },
  { 
    name: "Stendarr's Aura", 
    school: "Restoration", 
    tier: "Expert", 
    fpCost: 5, 
    description: "For 2 rounds, you are surrounded by a holy aura. Any undead that hits you with a melee attack or stands next to you takes 3 holy damage." 
  },
  { 
    name: "Circle of Protection", 
    school: "Restoration", 
    tier: "Expert", 
    fpCost: 5, 
    description: "Create a circle on the ground that lasts for 2 rounds. Any undead that attempts to enter it is automatically turned and must flee. Living allies standing in the circle have Advantage on rolls to resist fear." 
  },

  // RESTORATION - MASTER
  { 
    name: "Guardian Circle", 
    school: "Restoration", 
    tier: "Master", 
    fpCost: 8, 
    description: "Once per encounter. Create a large circle on the ground that lasts for 3 rounds. Undead cannot enter it, and any allies standing within it regain 5 HP at the start of their turn." 
  },
  { 
    name: "Bane of the Undead", 
    school: "Restoration", 
    tier: "Master", 
    fpCost: 8, 
    description: "Once per encounter. Release a wave of pure sunlight. All undead in a very large area around you are set ablaze, taking 5 holy damage at the start of their turn for the next 3 rounds." 
  },

  // ALTERATION - NOVICE
  { 
    name: "Oakflesh", 
    school: "Alteration", 
    tier: "Novice", 
    fpCost: 2, 
    description: "Magically harden your skin to the toughness of oak. For the rest of the encounter, if you are not wearing armor, you gain Damage Reduction 2." 
  },
  { 
    name: "Magelight", 
    school: "Alteration", 
    tier: "Novice", 
    fpCost: 1, 
    description: "Create a floating ball of light that sticks to whatever surface it strikes or hovers in place. It illuminates a 30-foot area and lasts for the rest of the scene." 
  },

  // ALTERATION - APPRENTICE
  { 
    name: "Stoneflesh", 
    school: "Alteration", 
    tier: "Apprentice", 
    fpCost: 3, 
    description: "A stronger version of Oakflesh that grants Damage Reduction 4 for the encounter (if unarmored)." 
  },
  { 
    name: "Ash Shell", 
    school: "Alteration", 
    tier: "Apprentice", 
    fpCost: 3, 
    description: "Hurl a ball of ash at a target. They must succeed on a Might roll or be encased in hardened ash for 2 rounds. An encased target is immune to all damage but cannot take any actions." 
  },
  { 
    name: "Detect Life", 
    school: "Alteration", 
    tier: "Apprentice", 
    fpCost: 2, 
    description: "For the rest of the scene, you can perceive the life force of living creatures through walls and obstacles. While this spell is active, you cannot be surprised by living enemies." 
  },

  // ALTERATION - ADEPT
  { 
    name: "Ironflesh", 
    school: "Alteration", 
    tier: "Adept", 
    fpCost: 4, 
    description: "A powerful flesh spell that grants Damage Reduction 6 for the encounter (if unarmored)." 
  },
  { 
    name: "Waterbreathing", 
    school: "Alteration", 
    tier: "Adept", 
    fpCost: 3, 
    description: "A target you touch can breathe underwater for the rest of the scene." 
  },
  { 
    name: "Telekinesis", 
    school: "Alteration", 
    tier: "Adept", 
    fpCost: 3, 
    description: "Magically lift and move one unattended object (no larger than yourself) within 30 feet. You can hold it for up to 3 rounds, moving it with your mind as a Minor Action." 
  },
  { 
    name: "Detect Dead", 
    school: "Alteration", 
    tier: "Adept", 
    fpCost: 3, 
    description: "For the rest of the scene, you can perceive the lingering energy of undead creatures through walls and obstacles. While this spell is active, you cannot be surprised by undead enemies." 
  },

  // ALTERATION - EXPERT
  { 
    name: "Ebonyflesh", 
    school: "Alteration", 
    tier: "Expert", 
    fpCost: 5, 
    description: "The strongest non-master flesh spell, granting Damage Reduction 8 for the encounter (if unarmored)." 
  },
  { 
    name: "Ash Rune", 
    school: "Alteration", 
    tier: "Expert", 
    fpCost: 4, 
    description: "Place an ash rune on a nearby surface. The next enemy to approach it triggers the rune, and must succeed on a Might roll or be encased in hardened ash for 2 rounds (as Ash Shell)." 
  },
  { 
    name: "Paralyze", 
    school: "Alteration", 
    tier: "Expert", 
    fpCost: 5, 
    description: "Send a wave of magical force at a single target. They must succeed on a Might roll or be completely paralyzed, losing their next turn." 
  },

  // ALTERATION - MASTER
  { 
    name: "Dragonhide", 
    school: "Alteration", 
    tier: "Master", 
    fpCost: 8, 
    description: "Once per encounter. You are infused with the resilience of a dragon. For 3 rounds, you gain Damage Reduction 10. This DR replaces any DR from worn armor; it does stack with flesh spells." 
  },
  { 
    name: "Mass Paralysis", 
    school: "Alteration", 
    tier: "Master", 
    fpCost: 8, 
    description: "Once per encounter. Unleash a wave of paralyzing energy. All non-boss enemies in a 30 foot area must succeed on a Might roll or be completely paralyzed, losing their next 3 turns." 
  },

  // ILLUSION - NOVICE
  { 
    name: "Fury", 
    school: "Illusion", 
    tier: "Novice", 
    fpCost: 2, 
    description: "Magically provoke a single non-boss enemy. On a failed Guile roll, their next turn they will attack the nearest creature, whether friend or foe." 
  },
  { 
    name: "Courage", 
    school: "Illusion", 
    tier: "Novice", 
    fpCost: 2, 
    description: "Bolster the spirit of a single ally. For the next 3 rounds, they are immune to fear effects and gain a +1 bonus to their Guile Target Number on rolls to resist intimidation." 
  },
  { 
    name: "Clairvoyance", 
    school: "Illusion", 
    tier: "Novice", 
    fpCost: 1, 
    description: "A faint magical line appears before you, showing you the most direct path to your current, declared objective." 
  },

  // ILLUSION - APPRENTICE
  { 
    name: "Fear", 
    school: "Illusion", 
    tier: "Apprentice", 
    fpCost: 3, 
    description: "Instill magical terror in a single non-boss enemy. They must succeed on a Guile roll or spend their next turn moving away from you by the safest route possible." 
  },
  { 
    name: "Calm", 
    school: "Illusion", 
    tier: "Apprentice", 
    fpCost: 3, 
    description: "Magically soothe a single non-boss enemy. They must succeed on a Guile roll or become non-hostile for 2 rounds. They will not fight unless they are attacked." 
  },
  { 
    name: "Muffle", 
    school: "Illusion", 
    tier: "Apprentice", 
    fpCost: 2, 
    description: "For the rest of the scene, your footsteps are completely silent. You have Advantage on all Sneak rolls related to movement." 
  },

  // ILLUSION - ADEPT
  { 
    name: "Frenzy", 
    school: "Illusion", 
    tier: "Adept", 
    fpCost: 4, 
    description: "As Fury, but it affects all non-boss enemies in a 20-foot radius." 
  },
  { 
    name: "Rally", 
    school: "Illusion", 
    tier: "Adept", 
    fpCost: 4, 
    description: "Inspire a single ally to heroism. For the next 3 rounds, they gain a +1 bonus to all damage rolls and are immune to fear." 
  },
  { 
    name: "Invisibility", 
    school: "Illusion", 
    tier: "Adept", 
    fpCost: 4, 
    description: "Become completely invisible. The effect lasts for 3 rounds or until you attack, cast another spell, or interact with an object." 
  },

  // ILLUSION - EXPERT
  { 
    name: "Rout", 
    school: "Illusion", 
    tier: "Expert", 
    fpCost: 5, 
    description: "As Fear, but it affects all non-boss enemies in a 30-foot radius." 
  },
  { 
    name: "Pacify", 
    school: "Illusion", 
    tier: "Expert", 
    fpCost: 5, 
    description: "As Calm, but it affects all non-boss enemies in a 30-foot radius." 
  },
  { 
    name: "Call to Arms", 
    school: "Illusion", 
    tier: "Expert", 
    fpCost: 5, 
    description: "Inspire all allies within a 30-foot radius. For the next 3 rounds, their damage rolls are increased by +2." 
  },

  // ILLUSION - MASTER
  { 
    name: "Harmony", 
    school: "Illusion", 
    tier: "Master", 
    fpCost: 8, 
    description: "Once per encounter. Project an overwhelming aura of peace. All non-boss enemies able to see you become non-hostile for the rest of the scene or until they are attacked. This effectively ends the current combat." 
  },
  { 
    name: "Mayhem", 
    school: "Illusion", 
    tier: "Master", 
    fpCost: 8, 
    description: "Once per encounter. Project an overwhelming aura of rage. All non-boss enemies able to see you are thrown into a homicidal rage for 3 rounds, attacking the nearest creature, regardless of allegiance." 
  },
  { 
    name: "Hysteria", 
    school: "Illusion", 
    tier: "Master", 
    fpCost: 8, 
    description: "Once per encounter. Project an overwhelming aura of terror. All enemies able to see you must succeed on a Guile roll or become terrified, fleeing from you for 3 rounds." 
  },

  // CONJURATION - NOVICE
  { 
    name: "Conjure Familiar", 
    school: "Conjuration", 
    tier: "Novice", 
    fpCost: 2, 
    description: "Summon a spectral wolf (Familiar) to fight by your side for the duration of the encounter." 
  },
  { 
    name: "Raise Zombie", 
    school: "Conjuration", 
    tier: "Novice", 
    fpCost: 3, 
    description: "Reanimate a weak, dead humanoid/creature (Zombie) to serve you for the duration of the encounter." 
  },
  { 
    name: "Bound Dagger", 
    school: "Conjuration", 
    tier: "Novice", 
    fpCost: 1, 
    description: "Summon a Daedric dagger into your hand. It uses the One-Handed skill and has Damage 3 with the Assassin's Blade property." 
  },

  // CONJURATION - APPRENTICE
  { 
    name: "Conjure Flame Atronach", 
    school: "Conjuration", 
    tier: "Apprentice", 
    fpCost: 3, 
    description: "Summon a Flame Atronach, a being of fire and spite that hurls firebolts at your enemies for the duration of the encounter." 
  },
  { 
    name: "Bound Sword", 
    school: "Conjuration", 
    tier: "Apprentice", 
    fpCost: 2, 
    description: "Summon a Daedric sword into your hand. It uses the One-Handed skill and has Damage 4 with the Finesse property." 
  },
  { 
    name: "Reanimate Corpse", 
    school: "Conjuration", 
    tier: "Apprentice", 
    fpCost: 4, 
    description: "Reanimate a moderately powerful dead humanoid/creature (Reanimated Corpse) for the duration of the encounter." 
  },
  { 
    name: "Soul Trap", 
    school: "Conjuration", 
    tier: "Apprentice", 
    fpCost: 2, 
    description: "Cast a curse on a living target. If that target dies within the next 2 rounds, their soul is trapped in the smallest empty soul gem you possess." 
  },

  // CONJURATION - ADEPT
  { 
    name: "Conjure Frost Atronach", 
    school: "Conjuration", 
    tier: "Adept", 
    fpCost: 4, 
    description: "Summon a Frost Atronach, a hulking behemoth of ice and rage that pounds foes into submission for the duration of the encounter." 
  },
  { 
    name: "Bound Battleaxe", 
    school: "Conjuration", 
    tier: "Adept", 
    fpCost: 3, 
    description: "Summon a Daedric battleaxe into your hands. It uses the Two-Handed skill and has Damage 6 with the Deep Wounds property." 
  },
  { 
    name: "Revenant", 
    school: "Conjuration", 
    tier: "Adept", 
    fpCost: 5, 
    description: "Reanimate a powerful dead humanoid/creature (Revenant) for the duration of the encounter. When reduced to 0 HP, it rises again with half Max HP." 
  },
  { 
    name: "Banish Daedra", 
    school: "Conjuration", 
    tier: "Adept", 
    fpCost: 4, 
    description: "Attempt to send a summoned Daedra or undead back to Oblivion. The enemy summoner must succeed on a Magic roll, or their creature is instantly unsummoned." 
  },

  // CONJURATION - EXPERT
  { 
    name: "Conjure Storm Atronach", 
    school: "Conjuration", 
    tier: "Expert", 
    fpCost: 5, 
    description: "Summon a Storm Atronach, a whirlwind of rock and lightning that attacks with powerful chain lightning spells for the duration of the encounter." 
  },
  { 
    name: "Bound Bow", 
    school: "Conjuration", 
    tier: "Expert", 
    fpCost: 4, 
    description: "Summon a Daedric bow and 100 magical arrows. It uses the Archery skill, has Damage 7, and has the Quick Draw and Soul Trap properties built-in." 
  },
  { 
    name: "Dread Zombie", 
    school: "Conjuration", 
    tier: "Expert", 
    fpCost: 6, 
    description: "Reanimate a very powerful dead humanoid (Dread Zombie) for the duration of the encounter. On hit, may inflict Fear (target must succeed on Guile roll or flee)." 
  },
  { 
    name: "Command Daedra", 
    school: "Conjuration", 
    tier: "Expert", 
    fpCost: 6, 
    description: "Attempt to wrest control of a summoned Daedra. The enemy summoner must succeed on a Magic roll, or their creature fights for you until it would return to Oblivion." 
  },

  // CONJURATION - MASTER
  { 
    name: "Flame Thrall", 
    school: "Conjuration", 
    tier: "Master", 
    fpCost: 8, 
    description: "Summon a Flame Atronach that serves you until it is destroyed. You can only have one Thrall of any kind active at a time." 
  },
  { 
    name: "Frost Thrall", 
    school: "Conjuration", 
    tier: "Master", 
    fpCost: 8, 
    description: "Summon a Frost Atronach that serves you until it is destroyed. You can only have one Thrall of any kind active at a time." 
  },
  { 
    name: "Storm Thrall", 
    school: "Conjuration", 
    tier: "Master", 
    fpCost: 8, 
    description: "Summon a Storm Atronach that serves you until it is destroyed. You can only have one Thrall of any kind active at a time." 
  },
  { 
    name: "Dead Thrall", 
    school: "Conjuration", 
    tier: "Master", 
    fpCost: 8, 
    description: "Reanimate a powerful dead humanoid that serves you until it is destroyed. You may equip your Thrall with any armor or weapons you give it. You can only have one Thrall of any kind active at a time." 
  },
  { 
    name: "Conjure Dremora Lord", 
    school: "Conjuration", 
    tier: "Master", 
    fpCost: 10, 
    description: "Once per encounter. Summon a mighty Dremora Lord clad in Daedric armor. It wields a flaming greatsword and exists only to destroy your enemies. It lasts for 3 rounds. While the Dremora Lord is active, all other friendly summoned creatures deal +1 damage." 
  }
];
