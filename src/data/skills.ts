import { Skill } from "@/types/character";

export const skills: Skill[] = [
  {
    id: "one-handed",
    name: "One-Handed",
    type: "Combat",
    perks: [
      {
        rank: "Apprentice",
        name: "Fighting Stance",
        description: "Once per combat, you may spend 1 FP to make an additional attack with your one-handed weapon as a Minor Action.",
        fpCost: 1
      },
      {
        rank: "Adept",
        name: "Savage Strike",
        description: "When you spend FP to make a Power Attack with a one-handed weapon, it deals +2 damage instead of +1."
      }
    ]
  },
  {
    id: "two-handed",
    name: "Two-Handed",
    type: "Combat",
    perks: [
      {
        rank: "Apprentice",
        name: "Cleave",
        description: "When you successfully hit an enemy, you can spend 1 FP to deal 1 damage to another enemy standing directly next to your target.",
        fpCost: 1
      },
      {
        rank: "Adept",
        name: "Devastating Charge",
        description: "As a Major Action, you may also expend your Minor Action to make a single, focused attack with +2 bonus to your Might score and +2 damage."
      }
    ]
  },
  {
    id: "archery",
    name: "Archery",
    type: "Combat",
    perks: [
      {
        rank: "Apprentice",
        name: "Eagle Eye",
        description: "You can spend 1 FP to aim as a Minor Action. Your next bow attack this turn is made with a +2 bonus to your Agility score.",
        fpCost: 1
      },
      {
        rank: "Adept",
        name: "Power Shot",
        description: "You can spend 1 FP when you hit with a bow to stagger your target, causing them to lose their next Minor Action.",
        fpCost: 1
      }
    ]
  },
  {
    id: "heavy-armor",
    name: "Heavy Armor",
    type: "Armor",
    perks: [
      {
        rank: "Apprentice",
        name: "Well Fitted",
        description: "The weight and bulk of your armor are like a second skin. You gain +2 maximum HP."
      },
      {
        rank: "Adept",
        name: "Tower of Strength",
        description: "Once per combat, you can choose to automatically succeed on a roll to resist being staggered or knocked down."
      }
    ]
  },
  {
    id: "light-armor",
    name: "Light Armor",
    type: "Armor",
    perks: [
      {
        rank: "Apprentice",
        name: "Unhindered",
        description: "You are used to moving in your armor. You gain +2 maximum FP."
      },
      {
        rank: "Adept",
        name: "Wind Walker",
        description: "Your stamina (FP) regenerates faster. Once per combat, you can regain 1 FP as a free action.",
        fpCost: 0
      }
    ]
  },
  {
    id: "destruction",
    name: "Destruction",
    type: "Magic",
    perks: [
      {
        rank: "Apprentice",
        name: "Impact",
        description: "When you cast a Destruction spell, you can spend 1 additional FP to stagger the target, making them lose their next Minor Action.",
        fpCost: 1
      },
      {
        rank: "Adept",
        name: "Augmented Elements",
        description: "All of your Destruction spells deal +1 damage."
      }
    ]
  },
  {
    id: "restoration",
    name: "Restoration",
    type: "Magic",
    perks: [
      {
        rank: "Apprentice",
        name: "Respite",
        description: "When one of your Restoration spells restores HP to a target (including yourself), it also restores 1 FP to them."
      },
      {
        rank: "Adept",
        name: "Necromage",
        description: "All of your spells are more effective against undead. They deal +2 damage (if harmful) or heal/turn for a greater effect."
      }
    ]
  },
  {
    id: "alteration",
    name: "Alteration",
    type: "Magic",
    perks: [
      {
        rank: "Apprentice",
        name: "Mage Armor",
        description: "Your 'flesh' spells are twice as effective if you are not wearing any physical armor."
      },
      {
        rank: "Adept",
        name: "Magic Resistance",
        description: "You have learned to alter your own form to resist magic. You gain a permanent +1 Damage Reduction against all spells."
      }
    ]
  },
  {
    id: "illusion",
    name: "Illusion",
    type: "Magic",
    perks: [
      {
        rank: "Apprentice",
        name: "Animage",
        description: "Your mind-affecting spells now work on animal-type enemies more effectively, with Advantage when casting on an animal."
      },
      {
        rank: "Adept",
        name: "Kindred Mage",
        description: "Your mind-affecting spells are more potent against people. Humanoid enemies have a -2 penalty to resist your Illusion spells."
      }
    ]
  },
  {
    id: "conjuration",
    name: "Conjuration",
    type: "Magic",
    perks: [
      {
        rank: "Apprentice",
        name: "Mystic Binding",
        description: "Your Bound Weapon spells are enhanced. The weapons they create deal an additional +1 damage."
      },
      {
        rank: "Adept",
        name: "Soul Stealer",
        description: "Your Bound Weapons are enchanted with a devouring spirit. When you kill an enemy with a Bound Weapon, you automatically cast Soul Trap on them for 0 FP."
      }
    ]
  },
  {
    id: "sneak",
    name: "Sneak",
    type: "Utility",
    perks: [
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
      }
    ]
  },
  {
    id: "lockpicking",
    name: "Lockpicking",
    type: "Utility",
    perks: [
      {
        rank: "Apprentice",
        name: "Quick Hands",
        description: "You are adept at your craft. You may re-roll a single failed Lockpicking attempt."
      },
      {
        rank: "Adept",
        name: "Wax Key",
        description: "You can create a copy of a key you have seen. Once per adventure, if you have successfully picked a lock, you can create a key for it."
      }
    ]
  },
  {
    id: "speech",
    name: "Speech",
    type: "Utility",
    perks: [
      {
        rank: "Apprentice",
        name: "Persuasion",
        description: "Once per social encounter, you can choose to make your Guile roll with a +2 bonus to your Target Number, making success more likely."
      },
      {
        rank: "Adept",
        name: "Intimidation",
        description: "You can use your Major Action in combat to make a Guile roll against a weak-willed enemy. If successful, they are terrified and lose their next Major Action."
      }
    ]
  },
];