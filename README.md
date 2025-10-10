# Skyrim TTRPG Character Manager

Welcome to the official Character Manager for the Skyrim TTRPG! This web application is designed to be a comprehensive, digital character sheet that automates character creation, tracks progression, and serves as an active gameplay aid for our custom tabletop role-playing game.

**This tool is in active development. Test it here!** [https://resilient-kashata-c15b4e.netlify.app/](https://resilient-kashata-c15b4e.netlify.app/)

---

## Current Features

*   **Full Character Creator:** A step-by-step guided process to create a new, rules-compliant character.
*   **Dynamic Character Dashboard:** A real-time view of your character's stats, resources, skills, perks, and abilities.
*   **Character Advancement:** A fully functional "Advancement Mode" for spending AP and unlocking new abilities.
*   **Data Portability:** A robust import/export system to save and transfer character data as `.json` files.
*   **Full Gameplay Integration:** A complete suite of interactive tools, including:
    *   Dynamic management of Gold, Inventory Items, and Equipment.
    *   In-place editing of Armor DR to track combat damage (Sundering).
    *   A persistent "Session Notes" feature for tracking temporary changes.

---

## Development Roadmap

This project is being built in phases. We have successfully completed the core functionality and are now moving on to advanced gameplay enhancements.

### **Phase 1: Core Functionality (Complete)**
*   [x] Build the core data structures for all game rules.
*   [x] Implement the guided Character Creator.
*   [x] Build the dynamic Character Dashboard.
*   [x] Implement the full Character Advancement system.
*   [x] Deploy the application to a live, shareable URL.
*   [x] Implement a "Session Notes" feature.
*   [x] Implement dynamic Gold, Item, and Equipment management.
*   [x] Implement a Character Import/Export system.

### **Phase 2: Advanced Gameplay Logic (Current Priority)**
*   **[ ] Dynamic Summon Display:** Create a new dashboard panel that appears when a summoning spell is cast, displaying the creature's stat block for easy reference.
*   **[ ] Active Effects Tracker:** Implement a new dashboard panel to track the duration of temporary effects (e.g., `Berserker Rage`), managed by a single "End Turn" button.
*   **[ ] Limited-Use Ability Tracker:** Add a simple checkbox system to track the usage of "per combat" and "per adventure" abilities.
*   **[ ] "Smart Add" with Autocomplete:** Implement the final, deluxe inventory feature that suggests official items as the user types.

### **Phase 3: Visual & Immersive Upgrades (Future)**
*   **[ ] Character & Standing Stone Art:** Integrate custom art assets into the Character Creator to enhance the visual experience.
*   **[ ] Character Portrait Upload:** Add a feature to the main dashboard allowing users to upload a custom image for their character's portrait.

### **Phase 4: "Keystone" & Roleplaying Features (Long-Term Goals)**
*   **[ ] "Ambition" System:** Add a new, optional step to the Character Creator for defining and tracking a long-term character goal.
*   **[ ] The "Master's Form" Creator:** Implement the final, complex UI for designing and saving custom martial techniques.
*   **[ ] Complete All Data Entry:** Finalize the full perk and spell lists for all tiers.

---

## Known Bugs & Temporary Issues

This section lists any known bugs in the current live version of the application.

*   **"Punished for Progress" AP Bug:**
    *   **Description:** A character's "Tier of Play" (which determines Khajiit claw damage) is calculated based on their *unspent* AP pool, not their *total AP earned*.
    *   **Workaround:** The GM will manually track the correct claw damage based on total AP.
    *   **Status:** **Awaiting a major architectural refactor.** This is the highest priority fix for the next development cycle.

*   **Armor DR Repair Bug:**
    *   **Description:** Armor that has had its DR reduced to 0 cannot currently be repaired back above 0 using the `+` button.
    *   **Workaround:** Use the "Edit Equipment" feature (to be implemented) to manually restore the `baseDr`.
    *   **Status:** Awaiting a fix in the "Smart Add Equipment" feature update.

*   **AP Bug:**
    *   **Description:** The AP value cannot be manually reduced if the add button is hit too many times.
    *   **Workaround:** The user must bank excess AP and spend it when it would have been earned, with manual tracking.
    *   **Status:** Awaiting a fix in the AP update.
