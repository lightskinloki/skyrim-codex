# Skyrim TTRPG Character Manager

Welcome to the official Character Manager for the Skyrim TTRPG! This web application is designed to be a comprehensive, digital character sheet that automates character creation, tracks progression, and serves as an active gameplay aid for our custom tabletop role-playing game.

This tool is currently in active development. test it here! https://68bdcaebdb0fe9f65cc0750a--resilient-kashata-c15b4e.netlify.app/


---

## Current Features

*   **Full Character Creator:** A step-by-step guided process to create a new, rules-compliant character.
*   **Dynamic Character Dashboard:** A real-time view of your character's stats, resources, skills, and gear.
*   **Character Advancement:** A fully functional "Advancement Mode" for spending AP and unlocking new abilities.
*   **Data Portability:** A robust import/export system to save and transfer character data as `.json` files.
*   **Basic Gameplay Aids:** Interactive tools for resting, simple Gold/DR adjustment, and a persistent "Session Notes" feature.

---

## Development Roadmap

This project is being built in phases. Here is our plan for upcoming features and improvements.

### **Phase 1: Core Functionality (Complete)**
*   [x] Build the core data structures for all game rules.
*   [x] Implement the guided Character Creator.
*   [x] Build the dynamic Character Dashboard.
*   [x] Implement the full Character Advancement system.
*   [x] Deploy the application to a live, shareable URL.
*   [x] Implement a "Session Notes" feature.
*   [x] Implement basic Gold and Armor DR management.
*   [x] Implement a Character Import/Export system.

### **Phase 2: Advanced Gameplay Interactivity (Current Priority)**
*   **[ ] Advanced Gold Management:** Upgrade the current `+/-` buttons to a more sophisticated modal that allows for typed input of any amount to be added or subtracted.
*   **[ ] Dynamic Item & Equipment Management:** Implement contextual `Add`/`Edit`/`Delete` controls within the Inventory and Equipment panels. This includes building the "Smart Add Equipment" modal with autocomplete for official items and manual entry for custom gear.
*   **[ ] Dynamic Summon Display:** Create a new dashboard panel that appears when a summoning spell is cast, displaying the creature's stat block for easy reference.
*   **[ ] Active Effects Tracker:** Implement a new dashboard panel to track the duration of temporary effects (e.g., `Berserker Rage`), managed by a single "End Turn" button.
*   [x] Limited-Use Ability Tracker:** Add a simple checkbox system to track the usage of "per combat" and "per adventure" abilities.

### **Phase 3: Visual & Immersive Upgrades (Future)**
*   **[ ] Character & Standing Stone Art:** Integrate custom art assets into the Character Creator to enhance the visual experience.
*   **[ ] Character Portrait Upload:** Add a feature to the main dashboard allowing users to upload a custom image for their character's portrait.

### **Phase 4: "Keystone" & Roleplaying Features (Long-Term Goals)**
*   **[ ] "Ambition" System:** Add a new, optional step to the Character Creator for defining and tracking a long-term character goal.
*   **[ ] The "Master's Form" Creator:** Implement the final, complex UI for designing and saving custom martial techniques.
*   **[ ] Complete All Data Entry:** Finalize the full perk and spell lists for all tiers and create a master equipment list to power the autocomplete feature.

---

## Known Bugs & Temporary Issues

This section lists any known bugs in the current live version of the application.

*   **"Punished for Progress" AP Bug:**
    *   **Description:** A character's "Tier of Play" (which determines Khajiit claw damage) is calculated based on their *unspent* AP pool, not their *total AP earned*.
    *   **Workaround:** The GM will manually track the correct claw damage based on total AP.
    *   **Status:** **Awaiting a major architectural refactor.** This is the highest priority fix for the next development cycle.

*   **Armor DR Repair Bug:**
    *   **Description:** Armor that has its DR reduced to 0 cannot currently be repaired back above 0 using the `+` button.
    *   **Workaround:** Use the "Edit Equipment" feature (once implemented) to manually restore the `baseDr`.
    *   **Status:** Awaiting a fix in the "Smart Add Equipment" feature update.
 
    **AP BUG:**
    *   **Description:** AP value can not be manually reduced if the add button is hit too many times
    *   **workaround** allow user to bank AP and spend it when it would have been earned by manually tracking.
    *   **Status:** Awaiting fix in GOLDMODAL update.






























## Project info

**URL**: https://lovable.dev/projects/4dae0457-e739-4105-8db5-048106cba4a2

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/4dae0457-e739-4105-8db5-048106cba4a2) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/4dae0457-e739-4105-8db5-048106cba4a2) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
