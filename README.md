# Skyrim TTRPG Character Manager

Welcome to the official Character Manager for the Skyrim TTRPG! This web application is designed to be a comprehensive, digital character sheet that automates character creation, tracks progression, and serves as an active gameplay aid for our custom tabletop role-playing game.

**This tool is in active development. Test it here!** [Skyrim Codex Live](https://skyrim-codex.frankbrown8810.workers.dev/)

---

## Current Features

*   **Full Character Creator:** A step-by-step guided process to create a new, rules-compliant character.
*   **Dynamic Character Dashboard:** A real-time view of your character's stats, resources, skills, perks, equipment, and inventory.
*   **Complete Data Set:** The application is powered by the full, official data for all Races, Standing Stones, Skills (all tiers), Perks, and Spells.
*   **Character Advancement:** A fully functional "Advancement Mode" for spending AP and unlocking new abilities.
*   **Data Portability:** A robust import/export system to save and transfer character data as `.json` files.
*   **Gameplay Aids:** Interactive tools for resting, dynamic Gold/Armor DR management, and a persistent "Session Notes" feature.
*   **Player Combat Portal — Command Center:** A 4-column action picker (Weapons, Tactics, Magic, Items) with collapsible magic school dropdowns, an Improvise Action sandbox, and dedicated Enchantment slots.
*   **Custom Abilities:** Players can create and save named abilities (Major/Minor, FP/HP cost) that automatically appear in the Combat Portal every session.
*   **Equipment Enchantments:** Attach charge-based active enchantments to any equipment item. Charges track and deplete on use; recharge with soul gems. Enchantments surface as bonus/free action slots in the Combat Portal.
*   **Session Exit Workflow:** Canonical "End Session" button with export prompt, a persistent session export status badge, and non-blocking export reminders at key game milestones.

---

## Development Roadmap

### **Phase 1: Core Functionality & Data Integrity (Complete ✅)**
*   [x] Build the core data structures for all game rules.
*   [x] Implement the guided Character Creator.
*   [x] Build the dynamic Character Dashboard & gameplay aids.
*   [x] Implement the full Character Advancement system.
*   [x] Implement Data Portability (Import/Export).
*   [x] Complete all core data entry for skills, perks, and spells.
*   [x] Deploy a stable Version 1.0 to a live, shareable URL.

### **Phase 2: Stability & Bug Fixes (Complete ✅)**
*   [x] **Fix "Punished for Progress" AP Bug:** Character tier now correctly based on total AP earned, not unspent pool.
*   [x] **Fix Session Notes Export Bug:** Notes now properly save to the character object and are included in all exports.
*   [x] **Fix Armor DR Repair Bug:** Correctly stamps `baseDr` on first reduction; armor can now be fully repaired up to its original value and no further.
*   [x] **Fix AP Subtract Bug:** "Manage Advancement Points" modal now supports both granting and subtracting AP with validation.
*   [x] **Fix Novice Spell Auto-Grant:** All Novice spells from all 5 schools are now automatically available regardless of whether the skill appears in the character's skill list.

### **Phase 3: Combat Portal & Active Gameplay (Complete ✅)**
*   [x] **Command Center Redesign:** Replaced the flat "Scroll of Doom" action list with a 4-column Dialog (Weapons / Tactics / Magic / Items) that categorizes actions at a glance.
*   [x] **Magic School Navigation:** Collapsible school dropdowns inside the Magic column for clean, scrollable access to all known spells.
*   [x] **Improvise Action Console:** Full sandbox delta grid in the Command Center — adjust HP, FP, max resources, all four attributes, AP, and DR simultaneously for any unscripted in-game moment.
*   [x] **Custom Abilities System:** Create named abilities (Major/Minor, optional FP/HP cost) saved to the character sheet that auto-populate in the Combat Portal each session.
*   [x] **Equipment Enchantment System:** Attach charge-based active enchantments to equipment. Tracks current/max charges and charge cost per use. Recharge button for soul gem resupply. Enchantments surface as dedicated bonus or free action slots in the Combat Portal.
*   [x] **Session Exit Workflow:** "End Session" button → export dialog → returns to Mode Selector. Persistent ⚠/✓ export status badge in the header. Non-blocking export reminder toasts fire after Long Rest and AP milestone events.
*   [x] **Mode Selection System:** Player / GM mode selector at app startup.
*   [x] **Smart Add Equipment:** Equipment form suggests official items as the player types (autocomplete from full item database).

### **Phase 4: GM Tools & Advanced Gameplay (Next Priority)**
- [ ] **Smart Encounter Parser (No-AI):** A Regex-based text parser (`src/utils/textParser.ts`) that allows GMs to paste stat blocks and auto-convert them into playable Enemy Combatants.
    - *Logic:* Detects `HP: XX`, `Stats: XX/XX/XX/XX`, and `Attacks:` patterns.
- [ ] **The "Omni-Compendium":** A slide-out sidebar for the GM Dashboard aggregating Spells, Items, Perks, and Rules into a single searchable reference tool.
- [ ] **Contextual Loot Generator:** Generates theme-appropriate rewards (Gold/Items) based on Enemy Tier (Novice–Master) and Category (Humanoid/Beast/Undead).
- [ ] **The "Master's Form" Creator:** UI for designing custom martial techniques (cost/effect trade-off system).
- [ ] **Dynamic Summon Display:** Dashboard panel showing stat blocks for active summoned creatures.
- [ ] **Active Effects Tracker:** Dashboard panel for tracking temporary effect durations, managed by the End Turn button.
- [ ] **"Ambition" System:** Optional step in the creator for defining and tracking a long-term character goal.
- [ ] **Character Portrait & AI Art Generator:** Full character portrait system with guided AI image generation (see Phase 7 for full spec).

### **Phase 5: Technical Debt & Polish**
- [ ] **Mobile Layout Polish:** Fix formatting issues on iPhone / improve Android display; ensure Combat Portal scrolls correctly on small screens.
- [ ] **Combatant Type Migration:** Fully migrate all `createCombatant` functions to use the new `actions` object (Major/Minor/Bonus slots) and `sunderCount`.
- [ ] **Hardcoded Rules Extraction:** Move hardcoded rules (e.g., "Power Attack = +2 Dmg") into a `rules.ts` config file for easier balancing updates.

### **Phase 6: Networked Combat Tracker (Planned — Next Campaign Hiatus)**
- [ ] **PeerJS Networking Foundation:** Peer-to-peer networking for real-time combat synchronization.
- [ ] **GM Combat Tracker Integration:** Wire up the `TacticalTable` component in the GM Dashboard.
- [ ] **Combat State Synchronization:** Real-time sync of HP, FP, status effects, and turn order between GM and all players.
- [ ] **Enemy Library:** Pre-made enemy templates (Bandits, Draugr, Dragons, etc.) with official stats.
- [ ] **Combat Log System:** Shared combat history viewable by GM and all players.
- [ ] **Status Effect Automation:** Auto-tick durations, auto-apply bleeding damage, and visual status badges.

**Note:** The networked combat tracker will be a major update deployed during the next campaign hiatus to avoid disrupting active gameplay.

### **Phase 7: Character Portrait & AI Art Generator (Planned)**
The goal is a cohesive, consistent art style for every character in the campaign — not generic AI output, but portraits that actually look like the character the player imagined.

- [ ] **`characterArt` field on Character type:** Optional `characterArt?: string` URL field — reserved now so existing exports stay compatible when the feature ships.
- [ ] **Portrait slot on Character Card:** Displays the portrait if present; shows a placeholder with a "Generate Art" button if not. Supports manual URL entry as a fallback for players who have their own image.
- [ ] **Guided Appearance Form:** A structured input form that collects player-described details the system can't infer automatically:
  - Build / body type (e.g. "tall and wiry")
  - Hair (e.g. "long silver braids")
  - Eyes (e.g. "amber, sharp")
  - Distinguishing features (e.g. "scar across left cheek, wolf tattoo on neck")
  - Demeanor / expression (e.g. "cold and calculating")
  - Additional flavor (e.g. "cloak is worn and travel-stained")
- [ ] **Auto-Prompt Builder:** Combines form inputs with character sheet data (race, standing stone archetype, equipped weapon/armor type, dominant stat personality hint) into a single structured prompt. A fixed style suffix — `Skyrim TTRPG art style, dramatic fantasy portrait lighting, dark background, highly detailed` — is appended to every prompt to enforce a consistent look across all characters.
- [ ] **Live Prompt Preview:** The full constructed prompt is shown and editable before generation, so players can see exactly what's being sent and tweak if needed.
- [ ] **Pollinations.ai Integration:** Free, no-API-key image generation via `https://image.pollinations.ai/prompt/{encoded_prompt}`. Image is returned as a direct URL — no backend required.
- [ ] **Pixel Art Loading Animation:** A custom pixel art "scribe" gif (a Skyrim-themed figure painting at a canvas) displays while the image generates, replacing the generic spinner. Designed as a reusable loading asset for other slow operations in the app.
- [ ] **Portrait persists on export:** The generated URL is saved to the character JSON and survives export/import cycles. GM view (Phase 6+) can display all player portraits in the tactical table.

---

## Known Bugs & Temporary Issues

*   **Mobile Display Format:**
    *   **Description:** App doesn't format correctly on iPhone systems; Android users must enable desktop mode.
    *   **Workaround:** Use desktop mode on mobile, or access from a laptop/desktop.
    *   **Status:** Slated for Phase 5 polish.

---

## Recent Updates

### Version 1.4 (Current)
*   ✅ **Limited-Use Abilities Connected** — Per-combat and per-adventure abilities are now fully tracked end-to-end. Using a racial, stone, perk, or custom limited ability in the Combat Portal writes to `character.usedAbilities` immediately. AbilityTracker reflects the state in real time. Turn reset preserves used-this-combat abilities. Long Rest clears everything.
*   ✅ **All Racial & Stone Abilities in Combat Portal** — Every race and standing stone ability now surfaces as the correct slot type (bonus action, free action, or Major Action) with the correct limitation tag. Previously only 4 abilities (Warrior, Thief, Light Armor, Redguard) appeared; all 13+ are now present.
*   ✅ **Custom Ability Limitations** — Custom abilities can now be tagged as `/combat` or `/adventure` in the add form. They appear in AbilityTracker and are enforced in the Portal like any other limited ability.
*   ✅ **Fixed Per-Combat Reset Bug** — `handleCombatModeToggle` was matching wrong ID patterns and resetting nothing. Now uses `getPerCombatAbilityIds()` for accurate resets.
*   ✅ **Fixed Long Rest Reset** — `performLongRest` had fragile string matching that missed per-adventure perk abilities. Now correctly clears all `usedAbilities` on a full rest.
*   ✅ **Fixed Action Update Race Condition** — FP deduction and `usedAbilities` write are now merged into a single `onUpdateCharacter` call, preventing one from overwriting the other.
*   ✅ **Header Layout** — Compacted to two rows. Combat Mode, Short Rest, and Long Rest moved to the left side inline with the AP display. Management buttons (New Character, Advance, Equipment, Export, End Session) stay as a single row on the right.

### Version 1.3
*   ✅ **Command Center** — Rebuilt the Player Combat Portal as a 4-column Command Center Dialog. Weapons, Tactics, Magic, and Items are instantly accessible with collapsible magic school dropdowns.
*   ✅ **Improvise Action** — Full sandbox console inside the Command Center. Adjust any combination of HP, FP, max resources, attributes, AP, and DR in a single action.
*   ✅ **Custom Abilities** — Create and save named abilities on the character sheet (Major/Minor, FP/HP cost). They appear in the Combat Portal automatically every session.
*   ✅ **Equipment Enchantments** — Attach charge-based active enchantments to any item. Charges deplete on use, recharge via soul gem. Enchantments surface as bonus/free action slots in the Combat Portal.
*   ✅ **Session Exit Workflow** — "End Session" button with export-first dialog, a persistent ⚠/✓ export status badge, and smart export reminders after Long Rest and AP events.
*   ✅ **Fixed Armor DR Repair** — Armor can now be repaired back to its original DR value, but not above it.
*   ✅ **Fixed AP Subtract** — The Manage AP modal now supports subtracting AP to correct mistakes.
*   ✅ **Fixed Novice Spell Auto-Grant** — All Novice spells are now always available regardless of skill training status.

### Version 1.1 — 1.2
*   ✅ Fixed "Punished for Progress" AP bug — character tier now correctly based on total AP earned
*   ✅ Fixed Session Notes export bug — notes properly saved with character data
*   ✅ Updated Standing Stones with correct FP costs and abilities
*   ✅ Updated all skill FP costs to match balanced rulebook values
*   ✅ Updated Redguard racial ability (3 FP → 10 FP)

---

## Feedback & Bug Reports

If you encounter any bugs or have suggestions for improvements, please let the GM know! This tool is continuously evolving to better serve our campaign.
