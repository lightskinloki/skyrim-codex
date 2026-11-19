// Seed companion/summon roster.
//
// Sourced directly from the campaign's #npcs Discord channel (the GM's own
// source-of-truth sheets, pasted in full during the companion-cards design
// session) and cross-checked against Toryggs legacy/Npcs/ylva the cleaver
// where both exist. Nothing here is invented — where a sheet was incomplete
// (GEAR's full ability list was in a message.txt attachment not received),
// it's left out rather than guessed at; add it once the source is available.

import { Companion } from '@/types/companion';

export const defaultCompanions: Companion[] = [
  // ---- DANICA ----
  {
    id: 'companion_danica',
    name: 'Danica',
    kind: 'companion',
    tier: 'Adept',
    race: 'Nord',
    highConcept: 'A gentle healer, extremely fragile, avoids combat at all costs.',
    stats: { might: 5, agility: 8, magic: 16, guile: 12 },
    resources: { hp: { current: 9, max: 9 }, fp: { current: 14, max: 14 }, dr: 2 },
    abilities: [
      {
        id: 'danica_healing', name: 'Healing', actionSlot: 'major',
        cost: { type: 'fp', amount: 1 }, description: 'Restoration. Heal a target.',
        resetsOn: 'never',
      },
      {
        id: 'danica_heal_other', name: 'Heal Other', actionSlot: 'major',
        cost: { type: 'fp', amount: 2 }, description: 'Restoration. Her go-to on the most wounded party member.',
        resetsOn: 'never',
      },
      {
        id: 'danica_fast_healing', name: 'Fast Healing', actionSlot: 'major',
        cost: { type: 'fp', amount: 2 }, description: 'Restoration.',
        resetsOn: 'never',
      },
      {
        id: 'danica_grand_healing', name: 'Grand Healing', actionSlot: 'major',
        cost: { type: 'fp', amount: 5 }, description: 'Restoration, wide effect.',
        resetsOn: 'never',
      },
      {
        id: 'danica_lesser_ward', name: 'Lesser Ward', actionSlot: 'minor',
        cost: { type: 'fp', amount: 1 }, description: 'Restoration.',
        resetsOn: 'never',
      },
      {
        id: 'danica_greater_ward', name: 'Greater Ward', actionSlot: 'minor',
        cost: { type: 'fp', amount: 4 }, description: 'Restoration.',
        resetsOn: 'never',
      },
      {
        id: 'danica_steadfast_ward_staff', name: 'Staff of Steadfast Ward', actionSlot: 'minor',
        cost: { type: 'free' }, description: 'Creates a magical field: DR 5 against spells until the start of her next turn. 15 charges on the staff.',
        maxUses: 15, usesRemaining: 15, resetsOn: 'never',
      },
      {
        id: 'danica_sun_fire', name: 'Sun Fire', actionSlot: 'major',
        cost: { type: 'fp', amount: 1 }, description: 'Only used if cornered by undead — she never willingly engages a living opponent.',
        resetsOn: 'never',
      },
      {
        id: 'danica_turn_undead', name: 'Turn Undead / Turn Lesser Undead', actionSlot: 'major',
        cost: { type: 'fp', amount: 2 }, description: 'Restoration.',
        resetsOn: 'never',
      },
      {
        id: 'danica_flames', name: 'Flames', actionSlot: 'major',
        cost: { type: 'fp', amount: 1 }, description: 'Novice Destruction. She has almost no reason to use this.',
        resetsOn: 'never',
      },
      {
        id: 'danica_avoid_death', name: 'Avoid Death (Perk)', actionSlot: 'passive',
        cost: { type: 'free' }, description: 'The first time her HP would hit 0 in an adventure, she auto-casts a heal on herself for 5 HP and stays conscious — no FP cost.',
        maxUses: 1, usesRemaining: 1, resetsOn: 'per-adventure',
      },
      {
        id: 'danica_persuasion', name: 'Persuasion (Perk)', actionSlot: 'passive',
        cost: { type: 'free' }, description: 'Once per social encounter, make her Guile roll with +2 to her Target Number (14 instead of 12).',
        maxUses: 1, usesRemaining: 1, resetsOn: 'per-combat',
      },
    ],
    equipment: [
      { name: 'Iron Dagger', description: "Assassin's Blade property.", damage: 2 },
      { name: 'Staff of Steadfast Ward' },
      { name: 'Elven Armor', dr: 2, description: '+1 FP. (Sweet Peter, 9/28: confirmed she has Elven armor over the Apprentice Robes.)' },
    ],
    combatNote: "Avoids combat entirely — seeks cover, stays behind the party. Major Action: Heal Other on the most wounded. Minor Action: stay safe. Will use Sun Fire only if cornered by undead specifically. Never willingly engages a living opponent. Avoid Death makes her survive one fatal blow to keep supporting.",
    notes: 'Source: #npcs channel, 9/22/25.',
  },

  // ---- YLVA THE CLEAVER ----
  {
    id: 'companion_ylva',
    name: 'Ylva the Cleaver',
    kind: 'companion',
    tier: "Master Hero (6 AP Build)",
    race: 'Nord',
    highConcept: 'A boisterous, joyful werewolf warrior who treats combat and butchery as the greatest game in the world.',
    stats: { might: 19, agility: 14, magic: 5, guile: 7 },
    resources: { hp: { current: 18, max: 18 }, fp: { current: 13, max: 13 }, dr: 8 },
    abilities: [
      {
        id: 'ylva_standard_attack', name: 'Battleaxe Strike', actionSlot: 'major',
        cost: { type: 'free' }, description: '8 damage + Deep Wounds on a Power Attack (2 Bleed at start of target\'s next turn).',
        resetsOn: 'never',
      },
      {
        id: 'ylva_devastating_charge', name: 'Devastating Charge', actionSlot: 'major',
        cost: { type: 'free' }, description: 'Consumes Major + Minor. +2 Might, +2 damage on a single focused attack. Cannot move this turn.',
        resetsOn: 'never',
      },
      {
        id: 'ylva_devastating_blow', name: 'Devastating Blow (Perk)', actionSlot: 'passive',
        cost: { type: 'free' }, description: 'Her Power Attacks deal +3 damage instead of +1.',
        resetsOn: 'passive',
      },
      {
        id: 'ylva_cleave', name: "Cleave / The Butcher's Reach", actionSlot: 'minor',
        cost: { type: 'fp', amount: 1 }, description: 'On a hit, deal 1 damage to up to 3 adjacent enemies for the base 1 FP; further adjacent targets cost 3 FP each.',
        resetsOn: 'never',
      },
      {
        id: 'ylva_sweep', name: 'Sweep', actionSlot: 'major',
        cost: { type: 'fp', amount: 4 }, description: 'Once per combat: one attack roll against ALL enemies in melee range in front of her.',
        maxUses: 1, usesRemaining: 1, resetsOn: 'per-combat',
      },
      {
        id: 'ylva_tower_of_strength', name: 'Tower of Strength', actionSlot: 'passive',
        cost: { type: 'free' }, description: 'Once per combat: automatically resist being staggered or knocked down.',
        maxUses: 1, usesRemaining: 1, resetsOn: 'per-combat',
      },
      {
        id: 'ylva_persuasion', name: 'Persuasion (Perk)', actionSlot: 'passive',
        cost: { type: 'free' }, description: 'Once per social encounter, +2 to her Guile Target Number.',
        maxUses: 1, usesRemaining: 1, resetsOn: 'per-combat',
      },
      {
        id: 'ylva_transformation', name: "The Blood Moon Rises (Werewolf Transformation)", actionSlot: 'major',
        cost: { type: 'free' }, description: 'Once per adventure. Transforms into her werewolf form (Might 21 auto-success, Agility 18, Magic 8, Guile 2; HP 54 triple total; DR 10; unarmed Claws deal 12, Hack & Slash). Automatic instead of dying if reduced to 0 HP in human form with an unused transformation — she must hit 0 again in wolf form to actually die.',
        maxUses: 1, usesRemaining: 1, resetsOn: 'per-adventure',
      },
      {
        id: 'ylva_fearful_presence', name: 'Fearful Presence', actionSlot: 'passive',
        cost: { type: 'free' }, description: '(Wolf form) At the start of her first turn after transforming, enemies who see her make a Standard Guile roll or become Frightened for one round.',
        resetsOn: 'passive',
      },
      {
        id: 'ylva_savage_leap', name: 'Savage Leap', actionSlot: 'minor',
        cost: { type: 'free' }, description: '(Wolf form) Leap up to 30 feet, Agility roll to strike the landing point for half her normal claw damage.',
        resetsOn: 'never',
      },
      {
        id: 'ylva_merry_dance', name: "Hircine's Merry Dance (Master's Form)", actionSlot: 'major',
        cost: { type: 'fp', amount: 2 }, description: 'Total Commitment (consumes Major + Minor). Single Might-based attack roll (TN 19): on success hits ALL enemies in melee range (360°), +2 damage to all, pushes every target hit 5 feet. Disadvantage resisting Prone until her next turn.',
        resetsOn: 'never',
      },
    ],
    equipment: [
      { name: "The Butcher's Axe", description: 'Steel Battleaxe, Deep Wounds property.', damage: 8 },
      { name: 'Superior Steel Armor', dr: 8, description: '3 base + 3 forge upgrades + 2 custom reinforcement.' },
      { name: '5 Potions of Healing' },
      { name: "3 days' dried, spiced meat", description: 'Her preferred rations.' },
    ],
    combatNote: 'Enthusiastic shock trooper. Opens with a bellowing laugh and a Devastating Charge on the largest foe. Uses Sweep or Hircine\'s Merry Dance with a whoop of delight when surrounded. Vulnerable in wolf form: takes 4x damage from silver weapons.',
    notes: 'Source: Npcs/ylva the cleaver + #npcs channel, 12/15/25 & 4/13/26.',
  },

  // ---- NORA ASHVALE ----
  {
    id: 'companion_nora',
    name: 'Nora Ashvale',
    kind: 'companion',
    tier: 'Adept',
    race: 'Breton',
    highConcept: 'An immensely powerful, deeply traumatized College of Winterhold prodigy hiding her own talent.',
    stats: { might: 4, agility: 6, magic: 20, guile: 12 },
    resources: { hp: { current: 9, max: 9 }, fp: { current: 15, max: 15 }, dr: 1 },
    abilities: [
      {
        id: 'nora_kindred_mage', name: 'Kindred Mage (Perk)', actionSlot: 'passive',
        cost: { type: 'free' }, description: 'Humanoid enemies have a -2 penalty to their Guile TN to resist her Illusion spells.',
        resetsOn: 'passive',
      },
      {
        id: 'nora_quiet_casting', name: 'Quiet Casting (Perk)', actionSlot: 'passive',
        cost: { type: 'free' }, description: 'All spells she casts, any school, are completely silent.',
        resetsOn: 'passive',
      },
      {
        id: 'nora_magic_resistance', name: 'Magic Resistance (Perk)', actionSlot: 'passive',
        cost: { type: 'free' }, description: 'Permanent +1 DR against all spells (already folded into her DR above).',
        resetsOn: 'passive',
      },
      {
        id: 'nora_augmented_elements', name: 'Augmented Elements (Perk)', actionSlot: 'passive',
        cost: { type: 'free' }, description: 'All her Destruction spells deal +1 damage.',
        resetsOn: 'passive',
      },
      {
        id: 'nora_necromage', name: 'Necromage (Perk)', actionSlot: 'passive',
        cost: { type: 'free' }, description: 'All her spells are more effective against undead (+2 damage if harmful, enhanced effects otherwise).',
        resetsOn: 'passive',
      },
      {
        id: 'nora_mage_armor_perk', name: 'Mage Armor (Perk)', actionSlot: 'passive',
        cost: { type: 'free' }, description: "Her Alteration 'flesh' spells (below) are twice as effective while she wears no physical armor.",
        resetsOn: 'passive',
      },
      {
        id: 'nora_oakflesh', name: 'Oakflesh', actionSlot: 'major',
        cost: { type: 'fp', amount: 2 }, description: 'Grants DR 4 for the encounter (DR 8 with Mage Armor doubling, unarmored).',
        resetsOn: 'never',
      },
      {
        id: 'nora_stoneflesh', name: 'Stoneflesh', actionSlot: 'major',
        cost: { type: 'fp', amount: 3 }, description: 'Grants DR 8 for the encounter (DR 16 with Mage Armor doubling, unarmored).',
        resetsOn: 'never',
      },
      {
        id: 'nora_ironflesh', name: 'Ironflesh', actionSlot: 'major',
        cost: { type: 'fp', amount: 4 }, description: 'Grants DR 12 for the encounter (DR 24 with Mage Armor doubling, unarmored) — her strongest Alteration flesh spell.',
        resetsOn: 'never',
      },
      {
        id: 'nora_magelight', name: 'Magelight', actionSlot: 'major',
        cost: { type: 'fp', amount: 1 }, description: 'Creates a floating ball of light.',
        resetsOn: 'never',
      },
      {
        id: 'nora_ash_shell', name: 'Ash Shell', actionSlot: 'major',
        cost: { type: 'fp', amount: 3 }, description: 'Can encase a target in hardened ash for 2 rounds.',
        resetsOn: 'never',
      },
      {
        id: 'nora_detect_life', name: 'Detect Life', actionSlot: 'major',
        cost: { type: 'fp', amount: 2 }, description: 'Perceive living creatures through walls for the scene.',
        resetsOn: 'never',
      },
      {
        id: 'nora_detect_dead', name: 'Detect Dead', actionSlot: 'major',
        cost: { type: 'fp', amount: 3 }, description: 'Perceive undead creatures through walls for the scene.',
        resetsOn: 'never',
      },
      {
        id: 'nora_waterbreathing', name: 'Waterbreathing', actionSlot: 'major',
        cost: { type: 'fp', amount: 3 }, description: 'Allows a target to breathe underwater for the scene.',
        resetsOn: 'never',
      },
      {
        id: 'nora_telekinesis', name: 'Telekinesis', actionSlot: 'major',
        cost: { type: 'fp', amount: 3 }, description: 'Magically lift and move one object within 30 feet.',
        resetsOn: 'never',
      },
      {
        id: 'nora_fury', name: 'Fury', actionSlot: 'major',
        cost: { type: 'fp', amount: 2 }, description: 'Magically provokes a single non-boss enemy to attack the nearest creature. Silent (Quiet Casting).',
        resetsOn: 'never',
      },
      {
        id: 'nora_courage', name: 'Courage', actionSlot: 'major',
        cost: { type: 'fp', amount: 2 }, description: 'Bolsters a single ally, making them immune to fear for 3 rounds. Silent.',
        resetsOn: 'never',
      },
      {
        id: 'nora_clairvoyance', name: 'Clairvoyance', actionSlot: 'major',
        cost: { type: 'fp', amount: 1 }, description: 'Creates a magical line showing the path to her current objective. Silent.',
        resetsOn: 'never',
      },
      {
        id: 'nora_fear', name: 'Fear', actionSlot: 'major',
        cost: { type: 'fp', amount: 3 }, description: 'A single non-boss enemy flees for one turn on a failed Guile roll (Kindred Mage: -2 to their roll if humanoid). Silent.',
        resetsOn: 'never',
      },
      {
        id: 'nora_calm', name: 'Calm', actionSlot: 'major',
        cost: { type: 'fp', amount: 3 }, description: 'A single non-boss enemy becomes non-hostile for 2 rounds on a failed Guile roll (Kindred Mage: -2 to their roll if humanoid). Silent.',
        resetsOn: 'never',
      },
      {
        id: 'nora_muffle', name: 'Muffle', actionSlot: 'major',
        cost: { type: 'fp', amount: 2 }, description: 'Grants Advantage on all Sneak rolls related to movement for the scene. Silent.',
        resetsOn: 'never',
      },
      {
        id: 'nora_frenzy', name: 'Frenzy', actionSlot: 'major',
        cost: { type: 'fp', amount: 4 }, description: 'Area-of-effect version of Fury. Silent.',
        resetsOn: 'never',
      },
      {
        id: 'nora_rally', name: 'Rally', actionSlot: 'major',
        cost: { type: 'fp', amount: 4 }, description: 'Inspires a single ally: +1 to damage rolls and fear immunity for 3 rounds. Silent.',
        resetsOn: 'never',
      },
      {
        id: 'nora_invisibility', name: 'Invisibility', actionSlot: 'major',
        cost: { type: 'fp', amount: 4 }, description: 'Nora becomes invisible for 3 rounds or until she acts. Silent.',
        resetsOn: 'never',
      },
      {
        id: 'nora_rout', name: 'Rout', actionSlot: 'major',
        cost: { type: 'fp', amount: 5 }, description: 'Area-of-effect version of Fear. Silent.',
        resetsOn: 'never',
      },
      {
        id: 'nora_pacify', name: 'Pacify', actionSlot: 'major',
        cost: { type: 'fp', amount: 5 }, description: 'Area-of-effect version of Calm. Silent.',
        resetsOn: 'never',
      },
      {
        id: 'nora_call_to_arms', name: 'Call to Arms', actionSlot: 'major',
        cost: { type: 'fp', amount: 5 }, description: 'Inspires all allies in a 30-foot radius: +2 to damage rolls for 3 rounds. Silent.',
        resetsOn: 'never',
      },
      {
        id: 'nora_flames', name: 'Flames (Destruction, last resort)', actionSlot: 'major',
        cost: { type: 'fp', amount: 1 }, description: '1 fire damage to a target in melee range, sets them Burning for 1 damage. She is extremely reluctant to use Destruction; +1 from Augmented Elements.',
        resetsOn: 'never',
      },
      {
        id: 'nora_frostbite', name: 'Frostbite (Destruction, last resort)', actionSlot: 'major',
        cost: { type: 'fp', amount: 1 }, description: '1 frost damage and drains 1 FP from a target in melee range; +1 from Augmented Elements.',
        resetsOn: 'never',
      },
      {
        id: 'nora_sparks', name: 'Sparks (Destruction, last resort)', actionSlot: 'major',
        cost: { type: 'fp', amount: 1 }, description: 'Drains 2 FP from a target in melee range.',
        resetsOn: 'never',
      },
      {
        id: 'nora_healing', name: 'Healing (Restoration)', actionSlot: 'major',
        cost: { type: 'fp', amount: 2 }, description: 'Heals herself or a creature she touches for 2 HP. She finds Restoration difficult — Atronach nature resists it.',
        resetsOn: 'never',
      },
      {
        id: 'nora_lesser_ward', name: 'Lesser Ward (Restoration)', actionSlot: 'minor',
        cost: { type: 'fp', amount: 2 }, description: 'Creates a magical field granting DR 3 against spells for one round.',
        resetsOn: 'never',
      },
      {
        id: 'nora_conjuration_suppressed', name: 'Innate Conjuration (Suppressed — reference only, GM-triggered)', actionSlot: 'passive',
        cost: { type: 'free' },
        description: "NOT player-triggered — she is pathologically terrified of this school and will never cast these willingly; they only surface via the Trauma Response above, and the GM decides what manifests. Full innate list, for GM reference: Novice — Conjure Familiar (2 FP), Raise Zombie (3 FP), Bound Dagger (1 FP). Apprentice — Conjure Flame Atronach (3 FP), Bound Sword (2 FP), Reanimate Corpse (4 FP), Soul Trap (2 FP, the core of her trauma). Adept — Conjure Frost Atronach (4 FP), Bound Battleaxe (3 FP), Revenant (5 FP), Banish Daedra (4 FP). Expert — Conjure Storm Atronach (5 FP), Bound Bow (4 FP), Dread Zombie (6 FP), Command Daedra (6 FP). Master — Flame/Frost/Storm/Dead Thrall (8 FP each), Conjure Dremora Lord (10 FP, once per encounter — the spell that destroyed her family).",
        resetsOn: 'passive',
      },
      {
        id: 'nora_dragonskin', name: 'Dragonskin (Racial)', actionSlot: 'reaction',
        cost: { type: 'free' }, description: 'Once per adventure: when a hostile spell hits her, take only half damage from that one attack.',
        maxUses: 1, usesRemaining: 1, resetsOn: 'per-adventure',
      },
      {
        id: 'nora_atronachs_gift', name: "Atronach's Gift (Spell Absorption)", actionSlot: 'reaction',
        cost: { type: 'free' }, description: 'Three times per combat, if targeted by a hostile spell, negate it and regain FP equal to its cost. Drawback: does not regain FP during a Short Rest.',
        maxUses: 3, usesRemaining: 3, resetsOn: 'per-combat',
      },
      {
        id: 'nora_diadem', name: 'Diadem (Item)', actionSlot: 'passive',
        cost: { type: 'free' }, description: 'Regain 1 FP at the start of each of her turns in combat.',
        resetsOn: 'passive',
      },
      {
        id: 'nora_elemental_fusion', name: 'Elemental Fusion (Innate)', actionSlot: 'passive',
        cost: { type: 'free' }, description: 'Can seamlessly reflavor a Destruction spell\'s element (e.g. a Firebolt dealing Frost damage instead).',
        resetsOn: 'passive',
      },
      {
        id: 'nora_hp_as_fp', name: 'HP-as-FP Conversion', actionSlot: 'free',
        cost: { type: 'free' }, description: 'Can spend HP as FP at a rate of 2 HP per 1 FP. (#npcs, 4/21/26.)',
        resetsOn: 'never',
      },
      {
        id: 'nora_trauma_response', name: 'Trauma Response (The Uncontrolled Power)', actionSlot: 'passive',
        cost: { type: 'free' }, description: 'In moments of extreme stress (powerful Daedra, reminders of her past), her magic can lash out involuntarily. GM describes the effect — the player does not control this and may not know exactly what happened.',
        resetsOn: 'passive',
      },
    ],
    equipment: [
      { name: 'Elven Dagger', description: 'An heirloom she is terrified to use.' },
      { name: 'Expert Robes of Illusion', dr: 0, description: 'Potent Casting enchantment: her Illusion spells (Fear, Calm) last an extra round and are harder to resist.' },
      { name: 'The Two Soul Gems', description: "Two flawless black soul gems on leather cords — pulse near Daedra or soul-trapping magic. Intensely personal." },
    ],
    combatNote: 'Glass Cannon Controller. Casts Mage Armor turn one. Prefers silent Illusion spells to turn enemies against each other or remove them from the fight; avoids direct offense unless necessary.',
    notes: "Source: #npcs channel, 3/12/26 & 4/21/26; full spell list added 9/14/26 from Toryggs legacy/Npcs/Nora the haunted (\"Exhaustive List of Nora's Powers\"). FLAG: that doc's own \"Combat Approach\" prose says she opens with 'Mage Armor (Ebonyflesh for DR 8)', but Ebonyflesh isn't in her known-spell list at all (Expert-tier Alteration; she's only Adept) — her real known flesh spells top out at Ironflesh. Read as a doc inconsistency and not used here; the card uses the sourced Oakflesh/Stoneflesh/Ironflesh values instead. Flag for you to resolve if it matters at the table.",
  },

  // ---- VARON ("THE HUSK") ----
  {
    id: 'companion_varon',
    name: 'Varon',
    kind: 'companion',
    tier: 'Adept Companion (4 AP Equivalent)',
    race: 'Bosmer (surgically altered to appear Breton)',
    highConcept: 'A Shadowscale assassin, "The Husk" — pain-suppressed, near-silent, deadly at range.',
    stats: { might: 12, agility: 17, magic: 8, guile: 15 },
    resources: { hp: { current: 35, max: 35 }, fp: { current: 25, max: 25 }, dr: 4 },
    abilities: [
      {
        id: 'varon_shadow_warrior', name: 'Shadow Warrior (Perk)', actionSlot: 'passive',
        cost: { type: 'free' }, description: 'Can hide in plain sight by breaking line of sight for only a fraction of a second.',
        resetsOn: 'passive',
      },
      {
        id: 'varon_silence', name: 'Silence (Perk)', actionSlot: 'passive',
        cost: { type: 'free' }, description: 'Leaves no footprints, triggers no sound-based traps.',
        resetsOn: 'passive',
      },
      {
        id: 'varon_the_numbing', name: 'The Numbing', actionSlot: 'passive',
        cost: { type: 'free' }, description: 'Immune to stagger effects and all pain-related mechanical penalties. If reduced to 0 HP, takes one final Dying Action before collapsing instead of falling unconscious immediately.',
        resetsOn: 'passive',
      },
      {
        id: 'varon_vipers_strike', name: "Viper's Strike (Graht-Lash)", actionSlot: 'major',
        cost: { type: 'free' }, description: '18 damage. A standard reach attack at maximum extension (10-15ft optimal range, up to 15ft).',
        resetsOn: 'never',
      },
      {
        id: 'varon_marsh_snare', name: 'Marsh-Snare (Graht-Lash)', actionSlot: 'major',
        cost: { type: 'free' }, description: 'On a hit, can choose to deal 0 damage to force an Agility Save instead — on a failure, the target is Prone or Disarmed (Varon\'s choice).',
        resetsOn: 'never',
      },
      {
        id: 'varon_shield_breaker', name: 'Shield-Breaker (Passive)', actionSlot: 'passive',
        cost: { type: 'free' }, description: 'Whips the bone sickle around the edge of a shield to strike the defender behind it.',
        resetsOn: 'passive',
      },
      {
        id: 'varon_voids_anvil', name: "The Void's Anvil", actionSlot: 'passive',
        cost: { type: 'free' }, description: "The bog-iron weight grounds out Alteration 'flesh' spells (Ironflesh/Ebonyflesh etc.), flickering them so the bone sickle strikes true flesh beneath.",
        resetsOn: 'passive',
      },
      {
        id: 'varon_husk_blade', name: 'The Husk-Blade', actionSlot: 'major',
        cost: { type: 'free' }, description: '12 damage. A Daedric Dagger filed to look like rusty iron — assassinations and close-quarters emergencies. Ignores the Graht-Lash Dead Zone.',
        resetsOn: 'never',
      },
      {
        id: 'varon_hist_sap', name: 'Hist-Sap Toxin (Alchemical)', actionSlot: 'minor',
        cost: { type: 'free' }, description: 'Applied poison. Induces paralysis and hallucinations.',
        resetsOn: 'never',
      },
      {
        id: 'varon_grey_sleep', name: 'The Grey Sleep (Alchemical)', actionSlot: 'minor',
        cost: { type: 'free' }, description: 'Lethal ingestible poison — stops the heart several hours after consumption.',
        resetsOn: 'never',
      },
    ],
    equipment: [
      { name: 'The Graht-Lash', damage: 18, description: 'Kusarigama-style chain-blade: bog-iron counterweight, Wamasu bone sickle. 15ft reach. Dead Zone: Disadvantage on attacks and all signature moves disabled within 5ft.' },
      { name: 'The Husk-Blade', damage: 12, description: 'Filed-down Daedric Dagger disguised as rusty iron.' },
      { name: 'Armored Clothing', dr: 4, description: "Looks like unremarkable merchant garb." },
      { name: 'Alchemical Kit', description: 'Hist-Sap Toxin, The Grey Sleep.' },
    ],
    combatNote: "Fights at 10-15ft range with the Graht-Lash; loses all his signature moves and takes Disadvantage if an enemy closes inside 5ft — the Husk-Blade is his answer to that. Uncanny stillness; right hand twitches rhythmically when preparing to kill. Speaks Tamrielic in a flat monotone.",
    notes: "Source: #npcs channel, 3/23/26 & 5/4/26. Graht-Lash/Viper's Strike is GM-set at 18 damage (9/15/26, deliberate balance call so Varon competes with Saijah) — not from the character sheet like the Husk-Blade's 12 or Marsh-Snare's 0, but this one's an explicit design decision, not a placeholder.",
  },

  // ---- MILA ----
  {
    id: 'companion_mila',
    name: 'Mila, "The Warrens Survivor"',
    kind: 'companion',
    tier: 'Civilian (Apprentice sheet, unclaimed)',
    race: 'Nord',
    highConcept: 'An 8-year-old survivor of the Warrens — terrified, malnourished, watchful. Not a combatant.',
    // No Target Numbers in the source sheet at all — only HP/FP/DR are given. Left unset rather than guessed.
    resources: { hp: { current: 1, max: 1 }, fp: { current: 0, max: 0 }, dr: 0 },
    abilities: [
      {
        id: 'mila_sewer_rat', name: 'The Sewer Rat (Passive)', actionSlot: 'passive',
        cost: { type: 'free' }, description: 'When instructed to hide, automatically succeeds on Stealth checks against non-magical detection given any cover. Can fit into spaces adults cannot.',
        resetsOn: 'passive',
      },
      {
        id: 'mila_trauma_silence', name: 'Trauma Silence (Passive)', actionSlot: 'passive',
        cost: { type: 'free' }, description: "Does not scream when frightened — she freezes. Won't give away the party's position with noise.",
        resetsOn: 'passive',
      },
      {
        id: 'mila_meat_shield', name: 'The Meat Shield (Party Rule, Reaction)', actionSlot: 'reaction',
        cost: { type: 'free' }, description: 'If Mila is caught in an AoE or targeted, any party member within 10ft must use their Reaction to dive over her and take the damage themselves, or she instantly dies.',
        resetsOn: 'never',
      },
    ],
    equipment: [
      { name: 'Stitched Rags', dr: 0 },
    ],
    combatNote: '1 HP, 0 FP — a single hit kills her. She cannot fight. Protect her; do not put her in the line of fire.',
    notes: "Source: #npcs channel, 5/25/26. Growth depends entirely on whichever PC spends Long Rests mentoring her (the Apprentice System) — not modeled here yet.",
  },

  // ---- GEAR ----
  {
    id: 'companion_gear',
    name: 'GEAR',
    kind: 'companion',
    tier: 'Master Companion (Unique Construct)',
    highConcept: 'Geared Eidetetic Archive and Retrieval Unit — Tactical Analyst / Information Specialist / Support Combatant.',
    stats: { might: 17, agility: 9, magic: 5, guile: 18 },
    // GEAR has NO Health Points — his Aetherium Core (FP) is his combined life/power pool.
    // Damage after DR comes directly out of FP; 0 FP = Shutdown, not death (reactivate via core recharge).
    resources: { fp: { current: 120, max: 120 }, dr: 8 },
    abilities: [
      {
        id: 'gear_battery_rule', name: 'The Battery Rule', actionSlot: 'passive',
        cost: { type: 'free' },
        description: 'Every action (Major, Minor, or Reaction) costs a minimum of 3 FP. Specialized abilities below add their own specific costs to this base where the source states one; where it does not, the 3 FP base is the listed cost.',
        resetsOn: 'passive',
      },
      {
        id: 'gear_movement_cost', name: 'Movement Cost', actionSlot: 'minor',
        cost: { type: 'fp', amount: 3 },
        description: 'Each movement is a Minor Action costing 3 FP. GEAR may move multiple times in a turn if he keeps paying.',
        resetsOn: 'never',
      },
      {
        id: 'gear_logic_engine', name: 'Logic Engine Passives', actionSlot: 'passive',
        cost: { type: 'free' },
        description: 'Immune to poison, disease, fear, and all mind-altering spells (Illusion, Charm, etc.). Cannot be intimidated or manipulated through emotional appeals.',
        resetsOn: 'passive',
      },
      {
        id: 'gear_tonal_blade', name: 'Tonal Vibratory Blade', actionSlot: 'major',
        cost: { type: 'fp', amount: 3 },
        description: 'Retractable melee blade (right arm). 8 Slashing damage, ignores 2 points of physical DR.',
        resetsOn: 'never',
      },
      {
        id: 'gear_bolt_launcher', name: 'Repeating Bolt-Launcher', actionSlot: 'major',
        cost: { type: 'fp', amount: 5 },
        description: 'Right arm, 5 FP (3 base + 2 for weapon system). Fires three bolts in one action, 2 Piercing each (6 total), splittable between targets.',
        resetsOn: 'never',
      },
      {
        id: 'gear_eidetic_scanner', name: 'Eidetic Scanner', actionSlot: 'major',
        cost: { type: 'fp', amount: 6 },
        description: "Major Action, 6 FP (3 base + 3 for active scanning). Reveals a target's complete tactical profile: current HP, FP, DR, all Stat Scores, and most likely next action. The next ally to attack the scanned target gains Advantage.",
        resetsOn: 'never',
      },
      {
        id: 'gear_arcane_transfer', name: 'Arcane Transfer Protocol', actionSlot: 'major',
        cost: { type: 'fp', amount: 33 },
        description: "Major Action, 33 FP (3 base + 30 for massive power transfer). Opens chest panels to channel his own FP into a touched magic item, restoring 25% of its total max charges (rounds down, minimum 1). Cannot recharge his own systems.",
        resetsOn: 'never',
      },
      {
        id: 'gear_tonal_dampening', name: 'Tonal Dampening Field', actionSlot: 'reaction',
        cost: { type: 'fp', amount: 11 },
        description: "Geometric distortion disrupts incoming magic. On a successful Magic roll vs. the caster, the spell's effectiveness is halved.",
        resetsOn: 'never',
      },
      {
        id: 'gear_sphere_mode', name: 'Sphere Mode', actionSlot: 'minor',
        cost: { type: 'fp', amount: 3 },
        description: "(Action type not stated in the source — assumed Minor at the base 3 FP cost, confirm with GM.) Retracts torso into a bronze sphere: doubled movement speed, effective Agility 16 for dodging. Cannot use his melee blade or scanner while in this mode.",
        resetsOn: 'never',
      },
      {
        id: 'gear_kinetic_anchor', name: 'Kinetic Anchor', actionSlot: 'reaction',
        cost: { type: 'fp', amount: 3 },
        description: "Reaction/Free Action, 3 FP (base cost only, no ongoing cost). Mag-locks his feet to the surface: immune to knockback, prone effects, or being moved against his will.",
        resetsOn: 'never',
      },
      {
        id: 'gear_physical_interpose', name: 'Physical Interpose', actionSlot: 'reaction',
        cost: { type: 'fp', amount: 3 },
        description: 'Rolls into the path of an attack targeting an ally within 15 feet, taking the hit himself.',
        resetsOn: 'never',
      },
      {
        id: 'gear_parallel_processing', name: 'Parallel Processing', actionSlot: 'passive',
        cost: { type: 'free' },
        description: 'Can process multiple subroutines at once: unlimited actions per round as long as he can pay each one\'s FP cost.',
        resetsOn: 'passive',
      },
      {
        id: 'gear_overclock', name: "Archive's Overclock (Master's Form)", actionSlot: 'major',
        cost: { type: 'fp', amount: 15 },
        description: "Total Commitment (Major + Minor), 15 FP. Next turn: takes THREE Major Actions, all Automatic Successes (no roll to hit). Price: after that turn, Staggered and Slowed for 2 rounds, DR reduced by 2 as his plates vent steam.",
        maxUses: 1, usesRemaining: 1, resetsOn: 'per-adventure',
      },
      {
        id: 'gear_innate_skills', name: 'Innate Skills (Master Level)', actionSlot: 'passive',
        cost: { type: 'free' },
        description: 'Lore (Master): perfect recall of Dwemer history, engineering, tonal architecture. Analysis (Master): superhuman speed assessing tactical situations and structural vulnerabilities. Smithing/Enchanting (Expert, Theoretical): can diagnose any mechanical/magical problem and guide others to a solution, though his own hands limit him from doing the physical work himself.',
        resetsOn: 'passive',
      },
      {
        id: 'gear_hardware_damage', name: 'Hardware Damage & Maintenance', actionSlot: 'passive',
        cost: { type: 'free' },
        description: 'Reference only — these track off his DR, not something he activates: SUNDER EFFECT — if his armor is Sundered, DR -1 and Max FP -10 (pressure leak). CRITICAL LEAK — at DR 5 or below, loses 1 FP at the start of every turn until repaired. PROCESSING LAG — at DR 4 or below, rolls 1d6 at the start of his turn for malfunctions (Logic Loop = Staggered, Motor Servo Lag = -2 Agility). CATASTROPHIC FAILURE — Sundered to 0 DR: any further damage detonates the Aetherium Core, 20 Shock damage in a 30ft radius, and permanently erases GEAR.',
        resetsOn: 'passive',
      },
      {
        id: 'gear_recovery', name: 'Recovery Methods', actionSlot: 'passive',
        cost: { type: 'free' },
        description: 'Reference only: Recharging — passive stabilization restores 40 FP after a scene, 20 FP after an encounter; a Long Rest resets FP to current maximum. Soul Gem Interface — white souls (Petty-Common) restore 60 FP; Greater/Black souls restore to current max, and a Black Soul grants a second charge too: first charge restores to max, second grants Temporary FP equal to his whole pool (e.g. Max 120 → up to 240/120 overcharged). A natural 20 against him while overcharged triggers Soul Catastrophe. Shock Magic Jump-Start — a friendly Shock spell restores FP equal to half the damage it would have dealt. Physical Repair (Short Rest) — Adept Smithing + 1 Dwarven Metal Ingot per point of DR, restores 1 DR and 10 Max FP per success (Click assisting grants Advantage on the roll). Master\'s Touch (a City Master Smith) — ~500 gold per point of Sundered DR/Max FP, full restoration to 100%.',
        resetsOn: 'passive',
      },
    ],
    equipment: [
      { name: 'Dwarven Metal Plating', dr: 8 },
      { name: 'Tonal Vibratory Blade', damage: 8, description: 'Ignores 2 physical DR.' },
      { name: 'Repeating Bolt-Launcher', damage: 2, description: '3 bolts per action, 2 Piercing each (6 total).' },
    ],
    combatNote: 'Tactical support: scan first for the Advantage payoff, then blade/bolts as needed. Interpose or Dampening Field to protect an ally. Overclock only when a fight truly needs it — the Staggered/Slowed/DR-2 aftermath is real.',
    notes: "Source: #npcs channel, 3/23/26 & 5/25/26 (full sheet). CLICK, GEAR's Companion Unit, is its own card below — it does have a full stat block in the source (Toryggs legacy/Npcs/Gear, Section X), corrected from an earlier note here that wrongly claimed otherwise.",
  },

  // ---- CLICK (GEAR's spider companion) ----
  {
    id: 'companion_click',
    name: 'Click',
    kind: 'companion',
    tier: 'Minion-Class (Utility Construct)',
    highConcept: "A small Dwarven Spider Worker, purpose-built for repair and data recording — not a combatant. Follows GEAR everywhere, makes constant soft clicking and whirring sounds.",
    stats: { might: 4, agility: 8, magic: 0, guile: 2 },
    resources: { hp: { current: 10, max: 10 }, dr: 3 },
    abilities: [
      {
        id: 'click_mobile_toolkit', name: 'Mobile Tool Kit (Passive)', actionSlot: 'passive',
        cost: { type: 'free' }, description: "Integrated field-repair tools. Grants Advantage on Smithing rolls to repair GEAR when Click is active and undamaged.",
        resetsOn: 'passive',
      },
      {
        id: 'click_data_recording', name: 'Data Recording (Passive)', actionSlot: 'passive',
        cost: { type: 'free' }, description: 'Records conversations and events; playback through GEAR\'s systems.',
        resetsOn: 'passive',
      },
      {
        id: 'click_scout', name: 'Scout', actionSlot: 'minor',
        cost: { type: 'free' }, description: "Can be sent ahead into dangerous areas — GEAR sees through Click's eye.",
        resetsOn: 'never',
      },
    ],
    equipment: [],
    combatNote: "Not a combatant — no offensive capabilities. If attacked, flees to GEAR. If destroyed: GEAR emits a one-second high-frequency \"hardware moan\" (a rare, involuntary emotional malfunction) and states he will need time to build a replacement.",
    notes: 'Source: Toryggs legacy/Npcs/Gear, Section X.',
  },

  // ---- BJORN ("THE WAR-HOUND") ----
  // Was missing from the app entirely. Npcs/Bjorn (the full character doc) has no
  // stat block at all — the only numeric source is the untracked
  // Npcs/BJORN_COMBAT_SHEET.html. Ported directly from it.
  {
    id: 'companion_bjorn',
    name: 'Bjorn',
    kind: 'companion',
    tier: 'Companion (untiered in source) — the War-Hound, rejuvenated by 2 dragon souls',
    race: 'Nord',
    highConcept: 'The cart driver — warm grandfather by default, a terrifyingly precise ex-mercenary underneath. Secretly the Dragonborn; he does not know it.',
    stats: { might: 16, agility: 17, magic: 8, guile: 12 },
    resources: { hp: { current: 38, max: 38 }, fp: { current: 18, max: 18 }, dr: 4 },
    abilities: [
      {
        id: 'bjorn_steed_stone_stride', name: 'The Steed Stone Stride (Passive)', actionSlot: 'passive',
        cost: { type: 'free' }, description: '+1 Movement Action per turn. Sprints through deep snow, ice, and rock at full speed with no Agility roll and no terrain movement penalty.',
        resetsOn: 'passive',
      },
      {
        id: 'bjorn_dual_flurry', name: 'Dual Flurry (Expert Perk, Passive)', actionSlot: 'passive',
        cost: { type: 'free' }, description: 'The FP cost of his Fighting Stance and dual-weapon attacks is permanently reduced to 0 FP — sustains relentless multi-attack tempo every turn with no stamina loss.',
        resetsOn: 'passive',
      },
      {
        id: 'bjorn_knockdown_immune', name: 'Knockdown Immune (Passive)', actionSlot: 'passive',
        cost: { type: 'free' }, description: 'Cannot be knocked prone by non-boss enemies while braced.',
        resetsOn: 'passive',
      },
      {
        id: 'bjorn_unaged_throat', name: 'The Unaged Throat (Latent Surge)', actionSlot: 'passive',
        cost: { type: 'free' }, description: 'If reduced to 0 HP, does not collapse immediately — an unvoiced kinetic shockwave (Fus resonance) staggers adjacent enemies 10ft and grants one final dying turn to shield an ally.',
        maxUses: 1, usesRemaining: 1, resetsOn: 'per-adventure',
      },
      {
        id: 'bjorn_brawler_strike', name: 'Unarmed Brawler Strike', actionSlot: 'major',
        cost: { type: 'free' }, description: 'Roll Might (TN 16) or Agility (TN 17). 15 Blunt damage; Nat 1 crit deals 30. Dual Flurry follow-up: if it hits, an immediate off-hand jab as a Minor Action for 8 Blunt damage.',
        resetsOn: 'never',
      },
      {
        id: 'bjorn_running_shoulder', name: 'The Running Shoulder', actionSlot: 'major',
        cost: { type: 'fp', amount: 2 }, description: '30ft charge. Roll Might (TN 16). 10 Blunt damage; knocks man-sized targets prone, or staggers a Large target (cancels its next reaction) instead.',
        resetsOn: 'never',
      },
      {
        id: 'bjorn_vanguard_intercept', name: 'Vanguard Intercept', actionSlot: 'reaction',
        cost: { type: 'fp', amount: 2 }, description: "Trigger: an enemy targets an ally within 20ft (especially Saijah, Nora, or Mila). Crosses instantly to take the hit himself. Source note: the sheet's vitals list his base DR as 4, but this ability's own text says he takes the hit \"against his own DR 6\" — an unresolved inconsistency in the sheet itself, not resolved here.",
        resetsOn: 'never',
      },
      {
        id: 'bjorn_veterans_parry', name: "Veteran's Parry", actionSlot: 'reaction',
        cost: { type: 'fp', amount: 1 }, description: "Contested Agility (TN 17) vs. the attacker's Might/Agility. On success, deflects the strike entirely and gains Advantage on his next melee attack.",
        resetsOn: 'never',
      },
    ],
    equipment: [
      { name: 'Dragonbone Talisman', description: "A shard of Kyboh's dragonbone greatsword, carried in his coat pocket. Hums when he lands a heavy hit." },
    ],
    combatNote: "Default: warm, jovial, grandfatherly — not seeking fights. When Mila or someone he loves is threatened, the War-Hound surfaces: cold, precise, terrifyingly still. Intercepts attacks aimed at the party's vulnerable members on reflex.",
    notes: 'Source: Toryggs legacy/Npcs/BJORN_COMBAT_SHEET.html (the only numeric source — Npcs/Bjorn itself has no stat block). Ported 9/14/26; DR 4 vs. 6 inconsistency flagged above, not resolved.',
  },

  // ---- BALTHAZZAR ("THE BLACK MARE") ----
  // The source doc's own GM Notes state plainly: "She is a companion asset like
  // GEAR" — a real card, not a mount stat block. Was missing entirely; already
  // used by name in FIRE_B_module.md (module lines 45, 552, 647, 875) before this.
  {
    id: 'companion_balthazzar',
    name: 'Balthazzar, "The Black Mare"',
    kind: 'companion',
    tier: 'Novice-tier TL2 elite (calibration note in source) — Companion Warbeast',
    race: 'Horse',
    highConcept: "Bjorn's warhorse, bought for 12,000 gold in Riften (Ch.24) to replace the retiring Mable — \"the cart's fifth soldier.\" Fights unattended, on the cart's own initiative.",
    stats: { might: 16, agility: 14, magic: 4, guile: 12 },
    // No FP pool at all — an animal, source states her abilities are "limited per combat, not FP-fed."
    resources: { hp: { current: 60, max: 60 }, dr: 2 },
    abilities: [
      {
        id: 'balthazzar_kick', name: 'Iron-Shod Kick', actionSlot: 'major',
        cost: { type: 'free' }, description: '9 damage. As a Power-Attack-style all-out kick (once per combat), the target must make a Might roll or be knocked prone.',
        resetsOn: 'never',
      },
      {
        id: 'balthazzar_trample', name: 'Trample Charge', actionSlot: 'major',
        cost: { type: 'free' }, description: 'Must move at least 15ft in a straight line first. 12 damage; target makes a Might roll or is knocked prone. She may continue moving through the space.',
        resetsOn: 'never',
      },
      {
        id: 'balthazzar_fearless', name: 'Fearless (Passive)', actionSlot: 'passive',
        cost: { type: 'free' }, description: "Breeding and training, not magic — immune to Fear and Intimidation from ANY source, mundane or magical. Does not spook, does not bolt.",
        resetsOn: 'passive',
      },
      {
        id: 'balthazzar_fifth_soldier', name: 'The Fifth Soldier (Passive)', actionSlot: 'passive',
        cost: { type: 'free' }, description: "War-trained: acts on the cart's own initiative and needs no rider. Unattended, she defends the cart and its passengers on her own judgment.",
        resetsOn: 'passive',
      },
      {
        id: 'balthazzar_campaign_bred', name: 'Campaign-Bred (Passive)', actionSlot: 'passive',
        cost: { type: 'free' }, description: 'Conditioned for season-long campaigns: ignores forced-march penalties, out-marches and out-lasts any ordinary animal.',
        resetsOn: 'passive',
      },
      {
        id: 'balthazzar_handling', name: 'Handling (Reference)', actionSlot: 'passive',
        cost: { type: 'free' }, description: "Mila won her over fastest (Ch.24): Mila calms/leads her with an Easy (+2) Guile (Animal Handling) roll. Rest of the company: Standard. Strangers handling her against her judgment: Hard (-4).",
        resetsOn: 'passive',
      },
    ],
    equipment: [],
    combatNote: "Bjorn chose a warhorse on purpose — fights for the road, not just pulls it. GM note in source: a companion asset, resist letting her become combat cheese. Her calm is the story trait: when every other animal on the road panics, she stands still and watches — use that as the table's gauge of how bad a threat actually is.",
    notes: 'Source: Toryggs legacy/Npcs/the black mare. Barding is a future option (a smith can fit it, treated as armor with improvement slots) — not currently equipped, so not added.',
  },
];
