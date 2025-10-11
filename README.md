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

This project is being built in phases. We have successfully completed the core functionality and data integration, achieving a stable Version 1.0. The next phase focuses on eliminating all known bugs before proceeding with new feature development.

### **Phase 1: Core Functionality & Data Integrity (Complete)**
*   [x] Build the core data structures for all game rules.
*   [x] Implement the guided Character Creator.
*   [x] Build the dynamic Character Dashboard & gameplay aids.
*   [x] Implement the full Character Advancement system.
*   [x] Implement Data Portability (Import/Export).
*   [x] Complete all core data entry for skills, perks, and spells.
*   [x] Deploy a stable Version 1.0 to a live, shareable URL.

### **Phase 2: Stability & Bug Fixes (Current Priority)**
*   **[ ] Fix "Punished for Progress" AP Bug:** Refactor the `ap` system into `apCurrent` and `apTotal` to ensure character tier is calculated based on total AP earned, not the current unspent pool.
*   **[ ] Fix Armor DR Repair Bug:** Correctly implement the `baseDr` logic to prevent armor from being repaired beyond its original value.
*   **[ ] Fix AP Granting Bug:** Add a "Subtract AP" functionality to the `GrantAPModal` to allow for easy correction of mistakes.

### **Phase 3: Advanced Gameplay Logic**
*   **[ ] The "Master's Form" Creator:** Implement the complex UI for designing and saving custom martial techniques.
*   **[ ] Dynamic Summon Display:** Create a new dashboard panel that displays the stat block of a currently active summoned creature.
*   **[%] Limited-Use Ability Tracker:** Add a checkbox system for tracking "per combat" and "per adventure" abilities.

### **Phase 4: Visual & Immersive Upgrades**
*   **[ ] "Smart Add Equipment" with Autocomplete:** Implement the advanced inventory feature that suggests official items as the user types.
*   **[%] Character & Standing Stone Art:** Integrate custom art assets into the Character Creator.
*   **[ ] Character Portrait Upload:** Add a feature to upload a custom character portrait.

### **Phase 5: "Keystone" & Roleplaying Features**
*   **[ ] "Ambition" System:** Add an optional step in the creator for defining and tracking a long-term character goal.
*   **[ ] Active Effects Tracker:** Implement the dashboard panel for tracking temporary effect durations, managed by an "End Turn" button.

---

## Known Bugs & Temporary Issues

This section lists any known bugs in the current live version of the application.

*   **"Punished for Progress" AP Bug:**
    *   **Description:** A character's "Tier of Play" (which determines Khajiit claw damage) is calculated based on their *unspent* AP pool, not their *total AP earned*.
    *   **Workaround:** For this session, the GM will manually track the correct claw damage if this specific situation occurs.
    *   **Status:** **Top priority for Phase 2.**

*   **Armor DR Repair Bug:**
    *   **Description:** Armor that has had its DR reduced to 0 cannot currently be repaired back above 0 using the `+` button.
    *   **Workaround:** Use the "Edit Equipment" feature (to be implemented) or ask the GM to manually edit the character file.
    *   **Status:** Slated for a fix in Phase 2.

*   **AP Granting Bug:**
    *   **Description:** The AP value cannot be manually reduced if the add button is hit too many times.
    *   **Workaround:** The GM will be careful when granting AP. Any excess will be noted and spent later.
    *   **Status:** Slated for a fix in Phase 2.
