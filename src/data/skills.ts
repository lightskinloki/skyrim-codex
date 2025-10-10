import { Skill } from "@/types/character";

export const skills: Skill[] = [
  // COMBAT SKILLS
  {
    id: "one-handed",
    name: "One-Handed",
    type: "Combat",
    governingStat: "Might",
    perks: [
      {
        rank: "Novice",
        name: "One-Handed Proficiency",
        description: "You can effectively fight with daggers, swords, maces, and war axes."
      },
      {
        rank: "Apprentice",
        name: "Fighting Stance",
        description: "Once per combat, you may spend 1 FP to make an additional attack with your one-handed weapon as a Minor Action.",
        fpCost: 1,
        limitation: 'per combat'
      },
      {
        rank: "Adept",
        name: "Savage Strike",
        description: "When you spend FP to make a Power Attack with a one-handed weapon, it deals +2 damage instead of +1."
      },
      {
        rank: "Expert",
        name: "Dual Flurry",
        description: "While wielding two one-handed weapons, the FP cost of your Fighting Stance perk is reduced to 0."
      },
      {
        rank: "Master",
        name: "Paralyzing Strike",
        description: "Once per combat, when you hit with a one-handed Power Attack, you can spend 4 FP to perform a paralyzing strike. If the target is a non-boss enemy, they are paralyzed and cannot act on their next turn.",
        fpCost: 4,
        limitation: 'per combat'
      }
    ]
  },
  {
    id: "two-handed",
    name: "Two-Handed",
    type: "Combat",
    governingStat: "Might",
    perks: [
      {
        rank: "Novice",
        name: "Two-Handed Proficiency",
        description: "You can effectively fight with greatswords, battleaxes, and warhammers."
      },
      {
        rank: "Apprentice",
        name: "Cleave",
        description: "When you successfully hit an enemy, you can spend 1 FP to deal 1 damage to another enemy standing directly next to your target.",
        fpCost: 1
      },
      {
        rank: "Adept",
        name: "Devastating Charge",
        description: "As a Major Action, you may also expend your Minor Action to make a single, focused attack. This attack is made with a +2 bonus to your Might score for the roll and deals +2 damage on a successful hit. You cannot move during a turn in which you use this ability."
      },
      {
        rank: "Expert",
        name: "Devastating Blow",
        description: "Your two-handed Power Attacks are unstoppable. They now deal +3 damage instead of +1, and after you make a two-handed Power Attack, you become an anchor on the battlefield; you cannot be staggered or knocked prone until the start of your next turn."
      },
      {
        rank: "Master",
        name: "Sweep",
        description: "Once per combat, you may spend 4 FP to make a single attack roll against ALL enemies in melee range in front of you.",
        fpCost: 4,
        limitation: 'per combat'
      }
    ]
  },
  {
    id: "archery",
    name: "Archery",
    type: "Combat",
    governingStat: "Agility",
    perks: [
      {
        rank: "Novice",
        name: "Archery Proficiency",
        description: "You can effectively use bows and crossbows."
      },
      {
        rank: "Apprentice",
        name: "Eagle Eye",
        description: "You can spend 1 FP to aim as a Minor Action. Your next bow attack this turn is made with a +2 bonus to your Agility score for that roll only.",
        fpCost: 1
      },
      {
        rank: "Adept",
        name: "Power Shot",
        description: "You can spend 1 FP when you hit with a bow to slow your target, causing them to lose their next Minor Action.",
        fpCost: 1
      },
      {
        rank: "Expert",
        name: "Quick Shot",
        description: "You can draw and fire your bow 30% faster. You can now make a Power Shot (spending 1 FP for +1 damage) as a Minor Action.",
        fpCost: 1
      },
      {
        rank: "Master",
        name: "Bullseye",
        description: "Once per combat, you can spend 4 FP to aim for a vital point. On a successful hit, your arrow deals double damage.",
        fpCost: 4,
        limitation: 'per combat'
      }
    ]
  },

  // ARMOR SKILLS
  {
    id: "heavy-armor",
    name: "Heavy Armor",
    type: "Armor",
    governingStat: "Might",
    perks: [
      {
        rank: "Novice",
        name: "Heavy Armor Proficiency",
        description: "You are proficient with Iron, Steel, and other heavy armors, gaining their full Damage Reduction bonus."
      },
      {
        rank: "Apprentice",
        name: "Well Fitted",
        description: "The weight and bulk of your armor are like a second skin. You gain +2 maximum HP."
      },
      {
        rank: "Adept",
        name: "Tower of Strength",
        description: "Once per combat, you can choose to automatically resist being staggered or knocked down.",
        limitation: 'per combat'
      },
      {
        rank: "Expert",
        name: "Conditioning",
        description: "Your body is accustomed to the weight and rigidity of heavy armor. Your total Damage Reduction from armor is increased by 1."
      },
      {
        rank: "Master",
        name: "Reflect Blows",
        description: "Once per adventure, when a non-boss enemy hits you with a melee attack, you can declare you are reflecting the blow. You take no damage, and the enemy takes the damage it would have dealt.",
        limitation: 'per adventure'
      }
    ]
  },
  {
    id: "light-armor",
    name: "Light Armor",
    type: "Armor",
    governingStat: "Agility",
    perks: [
      {
        rank: "Novice",
        name: "Light Armor Proficiency",
        description: "You are proficient with Hide, Leather, and other light armors, gaining their full Damage Reduction bonus."
      },
      {
        rank: "Apprentice",
        name: "Unhindered",
        description: "You are used to moving in your armor. You gain +2 maximum FP."
      },
      {
        rank: "Adept",
        name: "Wind Walker",
        description: "Your stamina (FP) regenerates faster. Once per combat, you can regain 1 FP as a free action.",
        limitation: 'per combat'
      },
      {
        rank: "Expert",
        name: "Agile Defender",
        description: "You have learned to turn a solid hit into a glancing blow. For 2 FP, when you are hit by a physical attack, you may take only half damage.",
        fpCost: 2
      },
      {
        rank: "Master",
        name: "Deft Movement",
        description: "Once per combat, you can spend 3 FP to effortlessly dodge all incoming physical attacks for one round. You take no damage from melee or ranged attacks until your next turn.",
        fpCost: 3,
        limitation: 'per combat'
      }
    ]
  },

  // MAGIC SKILLS
  {
    id: "destruction",
    name: "Destruction",
    type: "Magic",
    governingStat: "Magic",
    perks: [
      {
        rank: "Novice",
        name: "Novice Destruction",
        description: "You can cast Novice Destruction spells (e.g., Flames, Sparks)."
      },
      {
        rank: "Apprentice",
        name: "Impact",
        description: "You can cast Apprentice Destruction spells (e.g., Firebolt). When you cast a Destruction spell, you can spend 1 additional FP to slow the target, making them lose their next Minor Action.",
        fpCost: 1
      },
      {
        rank: "Adept",
        name: "Augmented Elements",
        description: "You can cast Adept Destruction spells (e.g., Fireball). All of your Destruction spells deal +1 damage."
      },
      {
        rank: "Expert",
        name: "Expert Destruction",
        description: "You can cast Expert Destruction spells (e.g., Incinerate). The FP cost of all your Destruction spells is reduced by 1."
      },
      {
        rank: "Master",
        name: "Master of the Elements",
        description: "You can cast Master Destruction spells (e.g., Fire Storm). These have powerful, adventure-altering effects. Once per adventure, for 1 round, all your Destruction spells cost 0 FP to cast.",
        limitation: 'per adventure'
      }
    ]
  },
  {
    id: "restoration",
    name: "Restoration",
    type: "Magic",
    governingStat: "Magic",
    perks: [
      {
        rank: "Novice",
        name: "Novice Restoration",
        description: "You can cast Novice spells (Lesser Ward, Healing)."
      },
      {
        rank: "Apprentice",
        name: "Respite",
        description: "You can cast Apprentice Restoration spells. When one of your Restoration spells restores HP to a target (including yourself), it also restores 1 FP to them."
      },
      {
        rank: "Adept",
        name: "Necromage",
        description: "You can cast Adept Restoration spells (Heal Other, Steadfast Ward). All of your spells are more effective against undead. They deal +2 damage (if harmful) or heal/turn for a greater effect."
      },
      {
        rank: "Expert",
        name: "Avoid Death",
        description: "You can cast Expert Restoration spells. The first time your HP would be reduced to 0 in an adventure, you automatically cast a healing spell on yourself, restoring 5 HP and remaining conscious. This does not cost FP.",
        limitation: 'per adventure'
      },
      {
        rank: "Master",
        name: "Guardian's Ward",
        description: "Once per adventure, for 0 FP, you can create a large 30-foot circle on the ground that lasts for 5 rounds. While within the circle: Allies who receive healing from any Restoration spell or effect regain an additional 2 HP, and Undead creatures take an additional 2 damage from any source.",
        limitation: 'per adventure'
      }
    ]
  },
  {
    id: "alteration",
    name: "Alteration",
    type: "Magic",
    governingStat: "Magic",
    perks: [
      {
        rank: "Novice",
        name: "Novice Alteration",
        description: "You can cast Novice Alteration spells (e.g., Oakflesh, Magelight)."
      },
      {
        rank: "Apprentice",
        name: "Mage Armor",
        description: "You can cast Apprentice Alteration spells (e.g., Stoneflesh, Detect Life). Your 'flesh' spells (Oakflesh, Stoneflesh, etc.) are twice as effective if you are not wearing any physical armor (e.g., Oakflesh now provides DR 4 instead of DR 2)."
      },
      {
        rank: "Adept",
        name: "Magic Resistance",
        description: "You can cast Adept Alteration spells (e.g., Ironflesh, Waterbreathing). You have learned to alter your own form to resist magic. You gain a permanent +1 Damage Reduction against all spells."
      },
      {
        rank: "Expert",
        name: "Stability",
        description: "You can cast Expert Alteration spells (e.g., Ebonyflesh, Paralyze). Your mastery over the physical world is potent. Enemies have Disadvantage on their rolls to resist your Alteration spells."
      },
      {
        rank: "Master",
        name: "Atronach",
        description: "You can cast Master Alteration spells (e.g., Dragonhide, Mass Paralysis). You can twist reality to absorb incoming spells. Once per encounter, when targeted by a hostile spell, you can make a reaction to do a Magic roll. On a success, you negate the spell's effects and regain FP equal to its base cost.",
        limitation: 'per combat'
      }
    ]
  },
  {
    id: "illusion",
    name: "Illusion",
    type: "Magic",
    governingStat: "Magic",
    perks: [
      {
        rank: "Novice",
        name: "Novice Illusion",
        description: "You can cast Novice Illusion spells (e.g., Fury, Courage)."
      },
      {
        rank: "Apprentice",
        name: "Animage",
        description: "You can cast Apprentice Illusion spells (e.g., Fear, Muffle). Your mind-affecting spells (Fury, Calm, Fear, etc.) now work on animal-type enemies more effectively, with Advantage when casting on an animal."
      },
      {
        rank: "Adept",
        name: "Kindred Mage",
        description: "You can cast Adept Illusion spells (e.g., Frenzy, Invisibility). Your mind-affecting spells are more potent against people. Humanoid enemies have a -2 penalty to their Guile Target Number to resist your Illusion spells."
      },
      {
        rank: "Expert",
        name: "Quiet Casting",
        description: "You can cast Expert Illusion spells (e.g., Rout, Pacify). Your mastery of subtlety is unmatched. All spells you cast, from any school of magic, are completely silent and do not risk breaking stealth."
      },
      {
        rank: "Master",
        name: "Master of the Mind",
        description: "You can cast Master Illusion spells (e.g., Harmony, Mayhem). Your power now touches all consciousness. Your Illusion spells now work on all types of enemies, including undead, Daedra, and automatons."
      }
    ]
  },
  {
    id: "conjuration",
    name: "Conjuration",
    type: "Magic",
    governingStat: "Magic",
    perks: [
      {
        rank: "Novice",
        name: "Novice Conjuration",
        description: "You can cast Novice Conjuration spells (e.g., Conjure Familiar, Bound Dagger)."
      },
      {
        rank: "Apprentice",
        name: "Mystic Binding",
        description: "You can cast Apprentice Conjuration spells (e.g., Conjure Flame Atronach, Soul Trap). Your Bound Weapon spells are enhanced. The weapons they create deal an additional +1 damage."
      },
      {
        rank: "Adept",
        name: "Soul Stealer",
        description: "You can cast Adept Conjuration spells (e.g., Conjure Frost Atronach, Bound Battleaxe). Your Bound Weapons are enchanted with a devouring spirit. When you kill an enemy with a Bound Weapon, you automatically cast Soul Trap on them for 0 FP."
      },
      {
        rank: "Expert",
        name: "Twin Souls",
        description: "You can cast Expert Conjuration spells (e.g., Conjure Storm Atronach, Dread Zombie). You have mastered the art of summoning. You may have two summoned or reanimated creatures active at the same time."
      },
      {
        rank: "Master",
        name: "Elemental Potency",
        description: "You can cast Master Conjuration spells (e.g., Flame Thrall, Dremora Lord). Your summoned Atronachs (Flame, Frost, Storm) are significantly more powerful, appearing larger and more menacing. All of their attacks and abilities deal +2 damage and they gain +2 DR."
      }
    ]
  },

  // UTILITY SKILLS
  {
    id: "sneak",
    name: "Sneak",
    type: "Utility",
    governingStat: "Agility",
    perks: [
      {
        rank: "Novice",
        name: "Stealth",
        description: "You can attempt to move silently and remain unseen by making an Agility roll."
      },
      {
        rank: "Apprentice",
        name: "Silent Roll",
        description: "As a Minor Action, you can spend 1 FP to move to a new location while making an Agility roll to remain hidden.",
        fpCost: 1
      },
      {
        rank: "Adept",
        name: "Deadly Aim",
        description: "Your first attack with a bow or dagger from stealth in a combat automatically deals double damage on a successful hit."
      },
      {
        rank: "Expert",
        name: "Shadow Warrior",
        description: "In dim light or shadow, you can spend 2 FP to automatically succeed on a roll to hide or remain hidden.",
        fpCost: 2
      },
      {
        rank: "Master",
        name: "Invisibility",
        description: "Once per combat, you can spend 4 FP to become completely invisible as a Minor Action. You remain invisible for 3 rounds or until you attack or cast a spell.",
        fpCost: 4,
        limitation: 'per combat'
      }
    ]
  },
  {
    id: "lockpicking",
    name: "Lockpicking",
    type: "Utility",
    governingStat: "Guile",
    perks: [
      {
        rank: "Novice",
        name: "Basic Lockpicking",
        description: "You can attempt to pick Novice and Apprentice level locks."
      },
      {
        rank: "Apprentice",
        name: "Quick Hands",
        description: "You are adept at your craft. You may re-roll a single failed Lockpicking attempt."
      },
      {
        rank: "Adept",
        name: "Wax Key",
        description: "You can create a copy of a key you have seen. Once per adventure, if you have successfully picked a lock, you can create a key for it, allowing you to bypass it automatically later.",
        limitation: 'per adventure'
      },
      {
        rank: "Expert",
        name: "Treasure Hunter",
        description: "Your keen eye finds more. Whenever the GM determines loot, you find 50% more gold or an extra minor item."
      },
      {
        rank: "Master",
        name: "Unbreakable",
        description: "Your skill is legendary. You no longer need lockpicks. You may attempt to open any non-magical lock with just your hands and a bit of wire."
      }
    ]
  },
  {
    id: "speech",
    name: "Speech",
    type: "Utility",
    governingStat: "Guile",
    perks: [
      {
        rank: "Novice",
        name: "Basic Speech",
        description: "You can engage in conversations and basic bartering."
      },
      {
        rank: "Apprentice",
        name: "Persuasion",
        description: "Once per social encounter, you can choose to make your Guile roll with a +2 bonus to your Target Number, making success more likely."
      },
      {
        rank: "Adept",
        name: "Intimidation",
        description: "You can use your Major Action in combat to make a Guile roll against a weak-willed enemy. If successful, they are terrified and lose their next Major Action."
      },
      {
        rank: "Expert",
        name: "Bribery",
        description: "You know who to talk to and how much coin to spread. You can bribe guards to ignore crimes you have committed, with the cost determined by the GM."
      },
      {
        rank: "Master",
        name: "Investor",
        description: "You can invest 500 gold in a shop. For the rest of the adventure (and any subsequent ones), you get a permanent discount and a better relationship with that merchant, as well as a chance for a 'return on investment' bonus when that merchant is visited."
      }
    ]
  }
];
