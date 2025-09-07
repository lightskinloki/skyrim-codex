# Skyrim TTRPG Character Manager

Welcome to the official Character Manager for the Skyrim TTRPG! This web application is designed to be a comprehensive, digital character sheet that automates character creation, tracks progression, and serves as an active gameplay aid for our custom tabletop role-playing game.

This tool is currently in active development.

---

## Current Features

*   **Full Character Creator:** A step-by-step guided process to create a new character from scratch, compliant with all official TTRPG rules.
*   **Dynamic Character Dashboard:** A complete, at-a-glance view of your character's stats, resources, skills, perks, equipment, and inventory.
*   **Character Advancement:** A fully functional "Advancement Mode" that allows you to spend Advancement Points (AP) on upgrades and automatically applies special progression benefits.
*   **Data Portability:** A robust import/export system that allows you to save your character as a `.json` file for backups or for transferring between devices.
*   **Gameplay Aids:** Interactive tools for resting, tracking gold and sundered armor DR, and a "Session Notes" feature for tracking temporary changes.

---

## Development Roadmap

This project is being built in phases. Here is our plan for upcoming features and improvements.

### **Phase 1: Core Functionality (Complete)**
*   [x] Build the core data structures for all game rules.
*   [x] Implement the guided Character Creator.
*   [x] Build the dynamic Character Dashboard.
*   [x] Implement the full Character Advancement system.
*   [x] Deploy the application to a live, shareable URL.

### **Phase 2: Gameplay & Quality of Life (In Progress)**
*   [x] Implement a "Session Notes" feature.
*   [x] Implement dynamic Gold and Armor DR management.
*   [x] Implement a Character Import/Export system.
*   **[ ] Implement "Smart Add Equipment" with Autocomplete:** The final, deluxe inventory feature. This will allow for the effortless addition of official items and the creation of custom homebrew gear.
*   **[ ] Implement "Active Effects" Tracker:** A new dashboard panel to track the duration of temporary effects like `Berserker Rage` with an "End Turn" button to manage them.
*   **[ ] Implement "Limited-Use" Ability Tracker:** A simple checkbox system to track the usage of "per combat" and "per adventure" abilities.

### **Phase 3: Final Polish (Future)**
*   **[ ] Complete All Data Entry:** Fill out the full perk and spell lists for all tiers.
*   **[ ] Create a Master Equipment List:** To power the autocomplete feature.
*   **[ ] User Interface & Experience Refinements:** Ongoing improvements to the look and feel of the application based on player feedback.

---

## Known Bugs & Temporary Issues

This section lists any known bugs in the current live version of the application.

*   **"Punished for Progress" AP Bug:**
    *   **Description:** A character's "Tier of Play" (which determines Khajiit claw damage and other scaling effects) is currently calculated based on their *unspent* AP pool, not their *total AP earned*. This can cause a character's tier to temporarily decrease after they spend AP on an upgrade.
    *   **Workaround:** As the GM, I am aware of this. If it affects your character, we will use your total AP earned to determine the correct effects.
    *   **Status:** **Awaiting a major architectural refactor.** This is the highest priority fix for the next development cycle.

*   **Armor DR Repair Bug:**
    *   **Description:** Armor that has had its DR reduced to 0 via the `+/-` buttons cannot currently be repaired back above 0.
    *   **Workaround:** If your armor is at 0 DR, ask the GM to manually edit the item to restore its `baseDr`.
    *   **Status:** Awaiting a fix in the "Smart Add Equipment" feature update.

































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
