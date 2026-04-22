# Skyrim Codex — Claude Context File

**This file is maintained by Claude instances across sessions. Update the "Current State" and "Next Steps" sections at the end of every work session so the next instance can orient immediately.**

---

## Quick Orientation

This is a React/TypeScript/Vite/Tailwind web app — a TTRPG character manager and GM tool for a custom Skyrim tabletop RPG system. It has two modes: Player (character sheet, combat portal) and GM (combat tracker, campaign tools). There is no backend, no database, no API — everything is local state and localStorage. Read `README.md` for the full product vision before making any decisions.

**Live URL:** https://skyrim-codex.frankbrown8810.workers.dev/
**Runtime:** Bun (not Node). Dev server: `bun run dev`. Build: `bun run build`.
**Type check:** `node node_modules\typescript\bin\tsc --noEmit` (node/npx not in PATH — use this exact command on Windows).

---

## Design Principles (Non-Negotiable)

These govern every feature decision. Read `README.md` for full detail.

1. **Player Vision** — A player can play an entire campaign without ever opening the rulebook.
2. **GM Vision** — The GM's only job at the table is to decide what happens. The app handles everything else.
3. **Mirror Principle** — Every AI feature has an excellent non-AI equivalent built first. AI is opt-in enhancement, never a requirement.
4. **Privacy by Design** — All AI runs locally in-browser (WebLLM/Transformers.js). No data ever leaves the device. No API keys. This is architectural, not a policy promise.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite + `@vitejs/plugin-react-swc` |
| Styling | Tailwind CSS + shadcn/ui components |
| Routing | react-router-dom v6 |
| Forms | react-hook-form + zod |
| State | Local React state only (no Redux/Zustand) — all character state lives in `Index.tsx`, passed via props |
| Storage | localStorage via `characterStorage.ts` |
| Runtime | Bun |

**Path alias:** `@/` maps to `src/`

---

## Architecture Map

### Entry & Routing
```
src/pages/Index.tsx          — App root. Holds all top-level state (appMode, currentCharacter).
                               Renders ModeSelector → CharacterDashboard or GMDashboard.
src/App.tsx                  — Just wraps Index with router/providers.
```

### Player Side
```
src/components/character/
  CharacterDashboard.tsx     — Main player shell. Header, all tabs, modals.
                               All character state flows through here via onUpdateCharacter prop.
  AbilityTracker.tsx         — Tracks limited-use abilities (per-combat / per-adventure)
  CustomAbilityManager.tsx   — CRUD for player-defined abilities
  AdvancementModal.tsx        — Spend AP to advance skills/stats
  EquipmentManager.tsx        — Add/edit/remove equipment with enchantment support

src/components/combat/player/
  PlayerCombatPortal.tsx     — The "Command Center" 4-column action picker.
                               Reads character.usedAbilities for limited-use enforcement.
                               IMPORTANT: merge all onUpdateCharacter calls into ONE to avoid race conditions.
```

### GM Side
```
src/components/gm/
  GMDashboard.tsx            — GM shell. Holds combatState. Renders tracker + tabs + log.
  GMCombatTracker.tsx        — Card-based combatant view (left panel)
  TacticalTable.tsx          — Dense table + inspector (alternative view, currently not wired in)
  EnemyManager.tsx           — Add enemies: templates, custom form, load saved players
  EffectApplicator.tsx       — Apply status effects to multiple targets
  InitiativeEditor.tsx       — Roll/sort/edit initiative
  CombatLog.tsx              — Round-grouped combat event log with undo
```

### Data (all static TypeScript, no server)
```
src/data/
  spells.ts                  — All 81 spells, 5 schools, Novice–Master. FP costs CORRECT.
  skills.ts                  — 15 skills, all perk tiers with FP costs and descriptions.
  equipment.ts               — All armor, shields, weapons. Damage values CORRECT (v1.4 patch).
                               IMPORTANT: shield `dr` field = bracing bonus, NOT worn DR.
  enemies.ts                 — Enemy templates + summon stat blocks. Values CORRECT (v1.4 patch).
  races.ts                   — 10 races with stat bonuses and racial abilities.
  standingStones.ts          — 13 standing stones with stat arrays and abilities.
```

### Types
```
src/types/
  character.ts               — Character interface. CustomAbility has `limitation?: 'per combat' | 'per adventure'`.
  combat.ts                  — Combatant, CombatState, StatusEffectInstance, CombatLogEntry.
  spell.ts                   — Spell interface.
```

### Utilities
```
src/utils/
  combatManager.ts           — All combat state mutations (initializeCombat, nextTurn, applyDamage, etc.)
  characterCalculations.ts   — performLongRest (clears ALL usedAbilities), calculateDerivedStats, etc.
  characterStorage.ts        — localStorage read/write for saved characters.
  actionUtils.ts             — getBonusActions, getValidMajorActions, getPerCombatAbilityIds.
                               IMPORTANT: per-combat ability IDs are stone-{id}, racial-{raceId},
                               perk-{skillId}-{perkName}, custom-{id}. Always use getPerCombatAbilityIds(),
                               never hand-roll string matching.
```

---

## Key Patterns & Conventions

### State updates — the single-call rule
**Never call `onUpdateCharacter` more than once in the same handler.** Multiple calls from the same stale `character` prop cause race conditions where the last call wins and earlier changes are lost. Always merge all changes into one object and make one call:
```typescript
// ✅ correct
const updated = { ...character, resources: newResources, usedAbilities: newUsed };
onUpdateCharacter(updated);

// ❌ wrong — second call overwrites first
onUpdateCharacter({ ...character, resources: newResources });
onUpdateCharacter({ ...character, usedAbilities: newUsed });
```

### UI components
- All UI primitives come from `@/components/ui/` (shadcn/ui). Use existing Button, Dialog, Badge, Card, Tabs, etc. Never install new UI libraries.
- Headings use `font-cinzel` class for the Skyrim fantasy aesthetic.
- Primary accent color: `text-primary` / `border-primary` (golden amber tone from the CSS theme).
- Notifications: `useToast()` from `@/hooks/use-toast`. Import `ToastAction` from `@/components/ui/toast` for inline actions.
- Lucide icons only — already installed, consistent set.

### Data access
- Never fetch data. Everything is imported directly from `src/data/*.ts`.
- `allSkills` from skills.ts, `spells` from spells.ts, `officialEquipment` from equipment.ts, `enemyTemplates` from enemies.ts, etc.
- Character data persists via `characterStorage.saveCharacter(character)` and `characterStorage.getCharacters()`.

### Styling conventions
- Mobile-first responsive but desktop is primary (mobile polish is Phase 7).
- Dark theme throughout — `bg-background`, `text-foreground`, `border-border` from CSS variables.
- Combat status colors: player = blue, enemy = red, ally = green, dead = reduced opacity.

---

## Known Gotchas & Anti-Patterns

1. **Bun, not Node.** `node` and `npx` are not in PATH. Use `bun run dev` / `bun run build`. For TypeScript checks use `node node_modules\typescript\bin\tsc --noEmit` (node is available on Windows separately from bun in this setup — if that also fails, do a visual syntax check instead).

2. **Shield DR is bracing bonus.** `equipment.ts` shield entries have a `dr` field that means "bonus DR gained when using the Brace Minor Action", not base worn DR. Do not display it as armor DR.

3. **Race condition on character updates.** Described above in Key Patterns. This caused real bugs — stay vigilant.

4. **Per-combat ability ID format.** Always `stone-{stoneId}`, `racial-{raceId}`, `perk-{skillId}-{perkName}`, `custom-{abilityId}`. Use `getPerCombatAbilityIds(character)` from actionUtils.ts — never reconstruct these strings manually elsewhere.

5. **TacticalTable is orphaned.** `src/components/gm/TacticalTable.tsx` exists but is not currently wired into GMDashboard. It's a more feature-rich view than GMCombatTracker. Note for Phase 5F work.

6. **Don't touch the player side when working on GM.** These are independent modes. Changes to shared utilities (`characterCalculations.ts`, `characterStorage.ts`) need care, but the UI components are fully separate.

7. **combatState lives in GMDashboard, not Index.** Unlike character state (which lives in Index.tsx), all GM combat state is local to GMDashboard.tsx and managed via combatManager.ts.

---

## Current State

**Last worked on:** Roadmap planning + data patch (v1.4)

**Recently completed:**
- Data accuracy patch: all weapon damages, shield DR, summon stat blocks corrected to rulebook values
- New summons added: Reanimated Corpse, Dread Zombie
- README rewritten with full GM vision, Design Principles, and complete Phase 5–9 roadmap
- This CLAUDE.md file created

**Current phase:** Phase 4 complete. Starting Phase 5 (GM Campaign Foundation).

---

## Next Steps

Work through Phase 5 in this order:

### Immediate — Phase 5F: Combat Tracker Improvements
Smallest scope, existing infrastructure, immediate table value.
1. **Multi-target damage/healing** — Add checkboxes to combatant cards in GMCombatTracker, a "Deal Damage to Selected" / "Heal Selected" input + button. Essential for AoE spells. Modify `combatManager.ts` to support bulk damage application.
2. **Direct HP input** — Make HP values clickable to open an inline number input (type exact value, not just ±). Currently requires many clicks for large damage values.
3. **Combatant notes** — Per-combatant text field in the inspector panel for tracking special conditions.

### After 5F — Phase 5A: Universal Compendium
Most impactful GM tool. Build a slide-out panel (Sheet component from shadcn/ui) accessible via Ctrl+K keyboard shortcut from anywhere in the GM Dashboard.
- Index all data from spells.ts, skills.ts, equipment.ts, enemies.ts, races.ts, standingStones.ts into a flat searchable array
- Each entry has: name, category, tags, full description/stat block
- Fuzzy search on name + tags
- Recently viewed list (session-scoped)
- Pinnable entries
- Displays inline without navigating away from combat

### After 5A — Phase 5B: Encounter Composer
- Scaled Enemy Builder (select Party Tier + TL + Archetype → stats auto-fill from creation table)
- Encounter presets (save/load named encounters)
- Balance indicator
- Launch encounter into combat tracker
- JSON export/import for custom enemies

### Then — Phase 5C, 5D, 5E
Campaign Dashboard, Session Management, NPC Manager (in that order).

---

## Files Most Likely to Change Per Phase

| Phase | Primary Files |
|---|---|
| 5F Combat | `src/components/gm/GMCombatTracker.tsx`, `src/utils/combatManager.ts` |
| 5A Compendium | New: `src/components/gm/Compendium.tsx`, `src/utils/compendiumIndex.ts` |
| 5B Encounter | New: `src/components/gm/EncounterComposer.tsx`, update `src/components/gm/EnemyManager.tsx` |
| 5C Dashboard | New: `src/components/gm/CampaignDashboard.tsx`, update `src/components/gm/GMDashboard.tsx` |
| 5D Session | New: `src/components/gm/SessionManager.tsx`, `src/utils/sessionStorage.ts` |
| 5E NPC | New: `src/components/gm/NPCManager.tsx`, `src/utils/npcStorage.ts` |
| 6 AI Layer | New: `src/utils/compendiumIndex.ts` (keyword index), `src/components/gm/AISettings.tsx` |
