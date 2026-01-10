# Skyrim TTRPG Character Manager

Welcome to the official Character Manager for the Skyrim TTRPG! This web application is designed to be a comprehensive, digital character sheet that automates character creation, tracks progression, and serves as an active gameplay aid for our custom tabletop role-playing game.

**This tool is in active development. Test it here!** [https://resilient-kashata-c15b4e.netlify.app/](https://resilient-kashata-c15b4e.netlify.app/)

---

## Current Features

*   **Full Character Creator:** A step-by-step guided process to create a new, rules-compliant character.
*   **Dynamic Character Dashboard:** A real-time view of your character's stats, resources, skills, perks, equipment, and inventory.
*   **Complete Data Set:** The application is powered by the full, official data for all Races, Standing Stones, Skills (all tiers), Perks, and Spells.
*   **Character Advancement:** A fully functional "Advancement Mode" for spending AP and unlocking new abilities.
*   **Data Portability:** A robust import/export system to save and transfer character data as `.json` files.
*   **Gameplay Aids:** Interactive tools for resting, dynamic Gold/Armor DR management, and a persistent "Session Notes" feature.

---

## Development Roadmap

This project is being built in phases. We have successfully completed the core functionality and data integration, achieving a stable Version 1.0. The current phase focuses on eliminating all known bugs and adding small quality-of-life improvements before proceeding with major new feature development.

### **Phase 1: Core Functionality & Data Integrity (Complete)**
*   [x] Build the core data structures for all game rules.
*   [x] Implement the guided Character Creator.
*   [x] Build the dynamic Character Dashboard & gameplay aids.
*   [x] Implement the full Character Advancement system.
*   [x] Implement Data Portability (Import/Export).
*   [x] Complete all core data entry for skills, perks, and spells.
*   [x] Deploy a stable Version 1.0 to a live, shareable URL.

### Technical Debt & Refactoring
- [ ] **Combatant Type Migration:** Fully migrate all `createCombatant` functions to use the new `actions` object (Major/Minor/Bonus slots) and `sunderCount`.
- [ ] **Hardcoded Rules Extraction:** Move hardcoded rules (like "Power Attack = +2 Dmg") out of UI components and into a `rules.ts` config file for easier balancing updates.
- [ ] **Mobile Layout Polish:** Ensure the new `PlayerCombatPortal` action stack scrolls correctly on small screens without hiding the "End Turn" button.

### **Phase 2: Stability & Bug Fixes (Current Priority)**
*   [x] **Fix "Punished for Progress" AP Bug:** Refactored the `ap` system into `apCurrent` and `apTotal` to ensure character tier is calculated based on total AP earned, not the current unspent pool.
*   [x] **Fix Session Notes Export Bug:** Session notes now properly save to the character object and are included in exports.
*   **[ ] Fix Armor DR Repair Bug:** Correctly implement the `baseDr` logic to prevent armor from being repaired beyond its original value.
*   **[ ] Fix AP Granting Bug:** Add a "Subtract AP" functionality to the `GrantAPModal` to allow for easy correction of mistakes.
*   **[ ] Mobile Display Format:** Fix formatting issues on iPhone systems and improve Android mobile display.

### Phase 3: Advanced Gameplay Logic & GM Tools (Next Priority)
- [ ] **Smart Encounter Parser (No-AI):** Implement a Regex-based text parser (`src/utils/textParser.ts`) that allows GMs to paste stat blocks from PDFs/Text and automatically convert them into playable Enemy Combatants.
    - *Logic:* Detects `HP: XX`, `Stats: XX/XX/XX/XX`, and `Attacks:` patterns.
- [ ] **The "Omni-Compendium":** A slide-out sidebar for the GM Dashboard that aggregates Spells, Items, Perks, and Rules into a single searchable reference tool.
- [ ] **Contextual Loot Generator:** A tool linked to the Encounter Builder that generates theme-appropriate rewards (Gold/Items) based on Enemy Tier (Novice-Master) and Category (Humanoid/Beast/Undead).
- [ ] **The "Master's Form" Creator:** Implement the UI for designing custom martial techniques (cost/effect trade-off system).
- [ ] **Dynamic Summon Display:** Dashboard panel displaying stat blocks for active summoned creatures.
- [%] **Limited-Use Ability Tracker:** Add checkbox system for tracking "per combat" abilities (Partially complete in Player Portal).

### **Phase 4: Visual & Immersive Upgrades**
*   **[ ] "Smart Add Equipment" with Autocomplete:** Implement the advanced inventory feature that suggests official items as the user types.
*   **[%] Character & Standing Stone Art:** Integrate custom art assets into the Character Creator.
*   **[ ] Character Portrait Upload:** Add a feature to upload a custom character portrait.

### **Phase 5: "Keystone" & Roleplaying Features**
*   **[ ] "Ambition" System:** Add an optional step in the creator for defining and tracking a long-term character goal.
*   **[ ] Active Effects Tracker:** Implement the dashboard panel for tracking temporary effect durations, managed by an "End Turn" button.

### Phase 6: Networked Combat Tracker (Planned for Next Hiatus)
- [ ] **PeerJS Integration:** Connect the existing `CombatManager` state to a PeerJS data stream.
- [x] **Player Combat Portal:** (UI Complete) The full-screen overlay is built. Next step: Wire "End Turn" button to broadcast state to GM.
- [x] **GM Tactical Table:** (UI Complete) The high-density tracker is built. Next step: Wire "Sunder" and "Damage" actions to broadcast to Player Portals.
- [ ] **Combat State Synchronization:** Ensure `combatState` object is identical on all connected clients.
- [ ] **Connection Recovery:** Robust handling for mobile devices waking from sleep (auto-reconnect to room).

**Note:** The networked combat tracker will be a major update deployed during the next campaign hiatus to avoid disrupting active gameplay. It will be built as an additive feature that does not modify existing character management functionality.

---

## Known Bugs & Temporary Issues

This section lists any known bugs in the current live version of the application.

*   **Armor DR Repair Bug:**
    *   **Description:** Armor that has had its DR reduced to 0 cannot currently be repaired back above 0 using the `+` button.
    *   **Workaround:** Use the "Edit Equipment" feature or ask the GM to manually edit the character file.
    *   **Status:** Slated for a fix in Phase 2.

*   **AP Granting Bug:**
    *   **Description:** The AP value cannot be manually reduced if the add button is hit too many times.
    *   **Workaround:** The GM will be careful when granting AP. Any excess will be noted and spent later.
    *   **Status:** Slated for a fix in Phase 2.

*   **Mobile Display Format:**
    *   **Description:** App doesn't format correctly on iPhone systems and Android must display in desktop mode to work properly.
    *   **Workaround:** Use desktop mode on mobile devices or access from a laptop/desktop computer.
    *   **Status:** Slated for investigation and fix in Phase 2.

---

## Recent Updates

### Version 1.1 (Current)
*   ✅ Fixed "Punished for Progress" AP bug - Character tier now correctly based on total AP earned
*   ✅ Fixed Session Notes export bug - Notes now properly saved with character data
*   ✅ Updated Standing Stones with correct FP costs and abilities
*   ✅ Updated all skill FP costs to match balanced rulebook values
*   ✅ Updated Redguard racial ability (3 FP → 10 FP)

---

## Feedback & Bug Reports

If you encounter any bugs or have suggestions for improvements, please let the GM know! This tool is continuously evolving to better serve our campaign.
