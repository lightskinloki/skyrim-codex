# Skyrim TTRPG Character Manager

Welcome to the official Character Manager for the Skyrim TTRPG! This web application is a comprehensive digital companion for both players and GMs — built to let everyone at the table stay immersed in the story instead of hunting through rulebooks.

**This tool is in active development. Test it here!** [Skyrim Codex Live](https://skyrim-codex.frankbrown8810.workers.dev/)

---

## Design Principles

These principles govern every feature decision on both sides of the app.

### Player Vision
> *A player can sit down at the table for the first time and, using only this app, play through an entire campaign without ever opening the rulebook or looking up a rule.*

Every player-side feature is evaluated against this. If it makes the player more self-sufficient and keeps their brain in the story rather than in the rules, it belongs. If it makes them look somewhere else, it doesn't.

### GM Vision
> *The GM's only job at the table is to decide what happens. The app handles everything else.*

The GM side is a campaign-aware session co-pilot — not just a combat tracker. It knows the rules, the enemies, the story progress, and the session history. Everything the GM needs is one action away during play. The app disappears so the story can breathe.

### The Mirror Principle
> *Every AI feature must have a non-AI equivalent that is excellent in its own right — not a degraded fallback, but a fully-realized tool that a skeptical user would choose to use.*

AI tools in this app are opt-in enhancements layered on top of solid manual foundations. The non-AI version is always built first and always works independently. AI is a speed multiplier, never the thing itself. Users who never enable AI features receive a complete, excellent product.

### Privacy by Design
> *The app is structurally incapable of collecting user data — not by policy, but by architecture.*

All AI features use small models that run entirely inside the browser via WebGPU/WebAssembly. Nothing is ever sent to a server. No API keys. No cloud inference. No training data. Campaign notes, character data, and session recordings never leave the device — even the developer cannot access them. This is not a promise. It is a property of how the system is built.

---

## Current Features

- **Full Character Creator:** A step-by-step guided process to create a new, rules-compliant character.
- **Dynamic Character Dashboard:** A real-time view of your character's stats, resources, skills, perks, equipment, and inventory.
- **Complete Data Set:** Powered by the full official data for all Races, Standing Stones, Skills, Perks, Spells, and Equipment — all corrected to match the current rulebook values.
- **Character Advancement:** A fully functional Advancement Mode for spending AP and unlocking new abilities.
- **Data Portability:** A robust import/export system to save and transfer character data as `.json` files.
- **Gameplay Aids:** Interactive tools for resting, Gold/Armor DR management, and persistent Session Notes.
- **Player Combat Portal — Command Center:** A 4-column action picker (Weapons, Tactics, Magic, Items) with collapsible magic school dropdowns, an Improvise Action sandbox, and dedicated Enchantment slots.
- **Custom Abilities:** Create and save named abilities (Major/Minor, FP/HP cost, per-combat or per-adventure limit) that automatically appear in the Combat Portal every session.
- **Equipment Enchantments:** Attach charge-based active enchantments to any equipment item. Charges track and deplete on use; recharge with soul gems.
- **Limited-Use Ability Tracking:** Per-combat and per-adventure abilities (racial, stone, perk, custom) are tracked end-to-end from the Combat Portal through to the AbilityTracker. Turn resets preserve used-this-combat state. Long Rest clears everything.
- **Session Exit Workflow:** Canonical End Session button with export prompt, persistent export status badge, and non-blocking export reminders at Long Rest and AP milestones.
- **GM Mode:** Combat tracker with initiative management, status effect applicator, enemy templates, custom enemy creation, and full combat log with undo.

---

## Development Roadmap

### Phase 1: Core Functionality & Data Integrity ✅ Complete
- [x] Core data structures for all game rules
- [x] Guided Character Creator
- [x] Dynamic Character Dashboard & gameplay aids
- [x] Full Character Advancement system
- [x] Data Portability (Import/Export)
- [x] Complete data entry for all skills, perks, spells, and equipment
- [x] Stable Version 1.0 deployed to live URL

### Phase 2: Stability & Bug Fixes ✅ Complete
- [x] Fix "Punished for Progress" AP Bug
- [x] Fix Session Notes Export Bug
- [x] Fix Armor DR Repair Bug
- [x] Fix AP Subtract Bug
- [x] Fix Novice Spell Auto-Grant

### Phase 3: Combat Portal & Active Gameplay ✅ Complete
- [x] Command Center Redesign (4-column dialog: Weapons / Tactics / Magic / Items)
- [x] Magic School Navigation (collapsible school dropdowns)
- [x] Improvise Action Console (full sandbox delta grid)
- [x] Custom Abilities System with per-combat/per-adventure limits
- [x] Equipment Enchantment System (charge-based, recharge via soul gems)
- [x] Session Exit Workflow with export status badge
- [x] Mode Selection System (Player / GM)
- [x] Smart Add Equipment (autocomplete from official item database)
- [x] Limited-Use Ability Tracking (Portal → usedAbilities → AbilityTracker → resets)
- [x] All Racial & Stone Abilities surfaced in Combat Portal with correct slot types

### Phase 4: Data Accuracy ✅ Complete
- [x] All weapon damage values corrected to match current rulebook tiers
- [x] Shield bracing DR values corrected; Dragon Shield added
- [x] Summon stat blocks corrected (Familiar, Zombie, Revenant, Dremora Lord, Frost/Storm Atronach)
- [x] Missing summons added (Reanimated Corpse, Dread Zombie)
- [x] Clothing descriptions corrected (Novice Robes +2 FP, Expert Robes +3 damage)

---

### Phase 5: GM Campaign Foundation *(Next Priority)*

**Vision:** Transform the GM mode from a combat tracker into a full campaign co-pilot. Every tool here is non-AI, works completely offline, and is excellent as a standalone product. This is the foundation that the optional AI layer (Phase 6) is built on top of.

#### 5A — Universal Compendium
The single most important GM tool. A slide-out reference panel accessible from anywhere in the GM Dashboard with a single keystroke.

- [ ] Searchable index of all game content: spells, perks, enemies, items, races, standing stones, status effects, action economy rules, condition definitions
- [ ] Keyboard-driven search (Ctrl+K / /) with instant results as you type
- [ ] Pinnable/favorited entries for quick access to commonly used references
- [ ] Recently viewed history (persists per session)
- [ ] Inline display that doesn't navigate away from the combat view
- [ ] Dedicated rule cards for action economy, skill checks, advancement costs, and smithing tables

#### 5B — Encounter Composer
Pre-build, save, and launch entire encounters before or during a session.

- [ ] **Scaled Enemy Builder:** Select Party Tier (Novice–Master) + Threat Level (1/2/3) + Archetype (Brute/Caster/Skirmisher/Tank) → stat block auto-fills from the Scaled Monster Creation Table. Name it, add flavor attacks, done.
- [ ] Encounter balance indicator: shows total Threat Level vs. party count with color-coded feedback
- [ ] Save named encounter presets to a persistent GM library (stored in localStorage)
- [ ] One-click "Launch Encounter" loads all enemies directly into the combat tracker
- [ ] Custom enemy JSON export/import: save any custom enemy as a `.json` file; import from file to populate the add-enemy form
- [ ] Enemy library browser: view, edit, duplicate, and delete all saved custom enemies

#### 5C — Campaign Dashboard
A top-level overview of the campaign that the GM sees when they're not in an active session.

- [ ] **Party overview:** All imported player characters with current HP/FP, tier, and active status displayed at a glance
- [ ] **Session history:** Chronological list of past sessions with date, duration, and summary. Click to expand full notes.
- [ ] **Story Beat Tracker:** GM defines campaign chapters and beats. Click to mark current position. Notes per beat. Visual progress bar across the arc.
- [ ] **Campaign stats panel:** Total sessions run, total AP awarded, time played

#### 5D — Session Management
Structured tools for capturing what happens during a session.

- [ ] Start/end session with automatic timestamps
- [ ] **Structured Notes Editor:** Type-tagged note entries during play: `Combat`, `NPC`, `Story`, `Loot`, `Player`, `Misc`. Each entry is timestamped and persists.
- [ ] Note templates for common events (combat outcome, NPC met, item found)
- [ ] End-of-session export: full notes as formatted `.txt` or `.md` file
- [ ] Notes automatically linked to the correct session in campaign history

#### 5E — NPC Manager
- [ ] Create named NPCs with stats (if combatant), disposition (Friendly/Neutral/Hostile), faction, and location
- [ ] Notes field per NPC for relationship history, dialogue hooks, and secrets
- [ ] Quick-access NPC panel during session: search and view any NPC card without leaving the active screen
- [ ] Add NPC directly to combat from their card

#### 5F — Combat Tracker Improvements
- [ ] **Multi-target damage/healing:** Select multiple combatants via checkboxes, enter a value, apply to all selected simultaneously — essential for AoE spells
- [ ] **Direct HP input:** Click a combatant's HP to type an exact value, not just increment/decrement
- [ ] **Save to library:** Promote any enemy currently in combat to the permanent GM library with one click
- [ ] **Combatant notes:** Per-combatant text field for tracking special conditions, lair actions, or narrative state

---

### Phase 6: Optional AI Layer *(Opt-In, Local, Privacy-First)*

**All features in this phase are disabled by default.** Users who never enable them receive the complete Phase 5 product. AI features carry a consistent visual badge so they are always identifiable. A single setting hides all AI UI elements for users who prefer a fully AI-free interface.

**Technical approach:** All inference runs locally in the browser. Two separate models cover two separate problems:
- **Whisper** (via `@huggingface/transformers`, WASM) — speech-to-text. ~290MB, one-time download, no WebGPU required.
- **Small generation model** (Gemma 4 2B / Phi-4-mini, via WebLLM, WebGPU) — session note generation. ~1–2GB, one-time download, cached permanently in browser storage.
- **Real-time keyword surfacing** uses pattern matching against the compendium index — zero AI, zero download, works immediately.

#### 6A — AI Setup & Onboarding
- [ ] Clear onboarding explaining: local inference, no data leaving device, one-time downloads
- [ ] Per-model download manager with progress indicators
- [ ] AI master toggle in settings (disables all AI features app-wide)
- [ ] "Hide AI UI" option that removes all AI elements from the interface entirely
- [ ] Graceful fallback: if a model is unavailable or WebGPU is unsupported, the manual equivalent appears with no error state or degraded messaging

#### 6B — Real-Time Keyword Surfacing *(Pattern Matching — no model required)*
- [ ] As the GM types into notes or (if mic enabled) speech is transcribed, the compendium index is scanned for recognized keywords
- [ ] Matching entries surface as floating cards at the edge of the screen: spell names → spell card, enemy names → stat block, status effects → condition definition
- [ ] Cards dismiss automatically or on click
- [ ] Can be enabled independently of the generation model (requires only compendium index, not Whisper or LLM)

#### 6C — Live Speech Transcription *(Whisper — ~290MB download)*
- [ ] Opt-in microphone capture with a persistent on/off indicator always visible
- [ ] Real-time transcript display in a collapsible panel
- [ ] Transcript feeds keyword surfacing (6B) automatically when enabled
- [ ] Transcript saved with session data for end-of-session note generation

#### 6D — AI Session Notes *(Generation model — ~1–2GB download)*
- [ ] End-of-session trigger: "Generate Notes from Transcript" button appears when session ends and transcript exists
- [ ] Structured output: Combat Events / NPC Interactions / Story Beats / Loot Awarded / Notable Player Moments
- [ ] Fully editable before saving — AI output is a starting draft, not a final document
- [ ] If transcript is unavailable, button does not appear; manual notes editor remains the default path

#### 6E — Story Beat Detection *(Generation model)*
- [ ] Model analyzes transcript periodically and suggests advancing the story beat tracker
- [ ] GM receives a non-blocking prompt: "It sounds like [beat name] was completed. Mark as done?" — always one click to dismiss
- [ ] Never auto-advances without GM confirmation

---

### Phase 7: Technical Debt & Polish
- [ ] **Mobile Layout:** Fix formatting on iPhone/Android; ensure Combat Portal scrolls correctly on small screens
- [ ] **Combatant Type Migration:** Fully migrate all `createCombatant` functions to use the `actions` object and `sunderCount`
- [ ] **Hardcoded Rules Extraction:** Move hardcoded rules (e.g. "Power Attack = +2 Dmg") into a `rules.ts` config file for easier balance updates

### Phase 8: Networked Combat *(Planned — Next Campaign Hiatus)*
- [ ] **PeerJS Networking Foundation:** Peer-to-peer networking for real-time combat synchronization
- [ ] **GM Combat Tracker Integration:** Wire up the `TacticalTable` component
- [ ] **Combat State Synchronization:** Real-time sync of HP, FP, status effects, and turn order between GM and all players
- [ ] **Enemy Library:** Pre-made enemy templates with official stats
- [ ] **Combat Log System:** Shared combat history viewable by GM and players
- [ ] **Status Effect Automation:** Auto-tick durations, auto-apply bleed damage, visual status badges

*Note: Networked combat will be a major update deployed during the next campaign hiatus to avoid disrupting active gameplay.*

### Phase 9: Character Portrait & AI Art Generator *(Planned)*
The goal is a cohesive, consistent art style for every character in the campaign.

- [ ] `characterArt?: string` field on Character type — reserved now so existing exports stay compatible
- [ ] Portrait slot on Character Card with placeholder and Generate button
- [ ] **Guided Appearance Form:** Build/body type, hair, eyes, distinguishing features, demeanor, additional flavor
- [ ] **Auto-Prompt Builder:** Combines form inputs with character sheet data into a structured prompt. Fixed style suffix appended to every generation for visual consistency across all characters.
- [ ] **Live Prompt Preview:** Full constructed prompt shown and editable before generation
- [ ] **Pollinations.ai Integration:** Free, no-API-key image generation via `https://image.pollinations.ai/prompt/{encoded_prompt}`
- [ ] Portrait persists on export — generated URL saved to character JSON and survives import/export cycles

---

## Known Bugs & Temporary Issues

- **Mobile Display Format:** App doesn't format correctly on iPhone; Android users must enable desktop mode. Workaround: use desktop mode on mobile, or access from a laptop/desktop. Slated for Phase 7 polish.

---

## Recent Updates

### Version 1.4 (Current)
- ✅ **Data Accuracy Patch** — All weapon damage values corrected to match current rulebook tiers. Shield bracing DR values corrected. Summon stat blocks corrected (Familiar, Zombie, Revenant, Atronachs, Dremora Lord). Missing summons added (Reanimated Corpse, Dread Zombie). Clothing descriptions corrected.
- ✅ **Limited-Use Abilities Connected** — Per-combat and per-adventure abilities tracked end-to-end. Using a racial, stone, perk, or custom limited ability in the Combat Portal writes to `character.usedAbilities` immediately. AbilityTracker reflects state in real time. Turn reset preserves used-this-combat abilities. Long Rest clears everything.
- ✅ **All Racial & Stone Abilities in Combat Portal** — Every race and standing stone ability now surfaces as the correct slot type with the correct limitation tag.
- ✅ **Custom Ability Limitations** — Custom abilities can be tagged `/combat` or `/adventure`. They appear in AbilityTracker and are enforced in the Portal like any other limited ability.
- ✅ **Fixed Per-Combat Reset Bug** — `handleCombatModeToggle` now uses `getPerCombatAbilityIds()` for accurate resets.
- ✅ **Fixed Long Rest Reset** — `performLongRest` correctly clears all `usedAbilities` on full rest.
- ✅ **Fixed Action Update Race Condition** — FP deduction and `usedAbilities` write merged into single `onUpdateCharacter` call.
- ✅ **Header Layout** — Compacted to two rows. Combat controls inline with AP display.

### Version 1.3
- ✅ Command Center — Rebuilt Player Combat Portal as 4-column Command Center
- ✅ Improvise Action — Full sandbox console inside Command Center
- ✅ Custom Abilities — Create and save named abilities; appear in Combat Portal automatically
- ✅ Equipment Enchantments — Charge-based, recharge via soul gem, surface in Portal
- ✅ Session Exit Workflow — End Session button, export-first dialog, persistent status badge
- ✅ Fixed Armor DR Repair
- ✅ Fixed AP Subtract
- ✅ Fixed Novice Spell Auto-Grant

### Versions 1.1 — 1.2
- ✅ Fixed "Punished for Progress" AP bug
- ✅ Fixed Session Notes export bug
- ✅ Updated Standing Stones with correct FP costs
- ✅ Updated all skill FP costs to match balanced rulebook values
- ✅ Updated Redguard racial ability (3 FP → 10 FP)

---

## Feedback & Bug Reports

If you encounter any bugs or have suggestions for improvements, please let the GM know. This tool is continuously evolving to better serve our campaign.
