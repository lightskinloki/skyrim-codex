# Tutorial Design Plan: "Learn by Building The Pale Lady's Tomb"

## Overview

This document outlines the comprehensive tutorial system for the Skyrim TTRPG GM Campaign Suite. The tutorial teaches GMs how to use the app by building and running the canonical tutorial adventure "The Pale Lady's Tomb," which perfectly demonstrates every core mechanic of the system.

**Core Philosophy**: The tutorial **is** the first adventure. GMs build the module in the Forge, then run it in Live Play — learning every pillar by doing. The adventure follows the canonical 5-section structure (Tavern → Journey → 5-Section Dungeon → Resolution), making it the ideal teaching vehicle.

---

## 1. Tutorial Architecture

### 1.1 State Machine

The tutorial progresses through 20 distinct steps across 3 phases:

```typescript
// Phase 1: Setup (3 steps)
type TutorialPhase = 
  | 'setup'           // Campaign creation, clocks, party, web build
  | 'forge'           // Building 7 scenes in ModuleBuilder
  | 'play'            // Running scenes in LivePlay
  | 'complete';       // Graduation

type TutorialStep = 
  // SETUP
  | 'welcome'         // "Skip tutorial?" modal
  | 'hub-clocks'      // Add "Pale Lady's Curse" clock (6 segments)
  | 'hub-party'       // Show party or create placeholder PCs
  | 'hub-web'         // Mount folder → build web → see Pale Lady nodes
  // FORGE (7 steps)
  | 'forge-1-hearth'  // Frozen Hearth Inn (Social)
  | 'forge-2-journey' // Journey: Travel + Ice Wraiths + Refugees
  | 'forge-3-entrance'// Entrance: Frost-Bound Spirits + Clues
  | 'forge-4-riddles' // Hall of Riddles (Puzzle)
  | 'forge-5-tunnel'  // Collapsed Tunnel (Setback)
  | 'forge-6-throne'  // Throne Room (Boss + Phase Transition)
  | 'forge-7-treasure'// Treasure Chamber (Reward + Journal)
  | 'forge-preflight' // Run preflight, fix warnings
  | 'forge-save'      // Save module → appears in Live Play
  // PLAY (7 steps)
  | 'play-1-hearth'   // Run Scene 1: Read-aloud, NPC dialogue, exit
  | 'play-2-wraiths'  // Run Scene 2: Deploy Encounter → Combat → return
  | 'play-2-refugees' // Run Scene 2b: Skill checks, consequences
  | 'play-3-entrance' // Run Scene 3: Clues, investigation rolls
  | 'play-4-riddles'  // Run Scene 4: Puzzle UI with graduated hints
  | 'play-5-tunnel'   // Run Scene 5: Exploration, creative solutions
  | 'play-6-throne'   // Run Scene 6: Boss, phase transition, roleplay choice
  | 'play-7-treasure' // Run Scene 7: Loot distribution, journal, epilogue
  | 'graduate';       // "You're ready!" + campaign saved
```

**Persistence**: Stored in `campaign.tutorialProgress: TutorialStep[]` + `campaign.tutorialPhase: TutorialPhase` — resumable, skippable, redoable per campaign.

### 1.2 Data Structure

**Tutorial Content** (`src/data/tutorial/paleLadysTomb.ts`):
- Embedded JSON matching the adventure's 7 scenes exactly
- Step-specific field locking (only relevant fields editable per step)
- Progressive unlocking: Step 1 unlocks read-aloud/NPCs/exits; Step 2 unlocks checks/enemies; etc.

**State Management** (`src/utils/tutorialState.ts`):
- Current step tracking
- Tutorial phase tracking
- Skip/redo flags
- Placeholder party creation
- Validation helpers

---

## 2. UI Components

### 2.1 Tutorial Overlay (`src/components/gm/tutorial/TutorialOverlay.tsx`)

**Visual Design**:
- Collapsible sidebar (left, 320px) with progress bar (20 steps)
- Current step card: Title, "Why this matters" callout, step-specific instructions
- Action buttons: [Next] [Skip Step] [Skip All] [Restart]
- Spotlight system: CSS `::before` overlay on `[data-tutorial-target]` elements

**Spotlight Targets** (added to existing components):
```tsx
// CampaignHub
<div data-tutorial-target="hub-add-clock">Add Clock button</div>
<div data-tutorial-target="hub-build-web">Mount + Build button</div>

// ModuleBuilder
<button data-tutorial-target="forge-add-scene">Add Scene</button>
<select data-tutorial-target="forge-scene-type">Scene Type dropdown</select>
<textarea data-tutorial-target="forge-readaloud">Read-aloud field</textarea>
<input data-tutorial-target="forge-npc-name" list="campaign-entities" />
<button data-tutorial-target="forge-add-npc">Add NPC</button>
<select data-tutorial-target="forge-check-difficulty">Difficulty dropdown</select>
<select data-tutorial-target="forge-enemy-select">Add Enemy dropdown</select>
<button data-tutorial-target="forge-preflight-run">Preflight button</button>
<button data-tutorial-target="forge-save-module">Save Module</button>

// LivePlay
<button data-tutorial-target="play-timeline-scene-1">Scene 1 on timeline</button>
<div data-tutorial-target="play-readaloud-block">Read-aloud area</div>
<button data-tutorial-target="play-deploy-encounter">Deploy Encounter</button>
<button data-tutorial-target="play-npc-card">NPC card</button>
<button data-tutorial-target="play-findable-reveal">Findable reveal</button>
<div data-tutorial-target="play-puzzle-hints">Puzzle hint button</div>

// CombatView (when deployed)
<button data-tutorial-target="combat-start">Start Combat</button>
<button data-tutorial-target="combat-next-turn">Next Turn</button>
<button data-tutorial-target="combat-end">End Combat</button>
```

### 2.2 Context Provider (`src/components/gm/tutorial/TutorialContext.tsx`)

```tsx
export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [tutorialProgress, setTutorialProgress] = useState<TutorialStep[]>([]);
  const [tutorialPhase, setTutorialPhase] = useState<TutorialPhase>('setup');
  const [tutorialSkipped, setTutorialSkipped] = useState(false);
  
  // Tutorial state management functions
  // Step navigation with validation
  // Phase transitions
  // Persistence to CampaignContext
  
  return (
    <TutorialContext.Provider value={{ 
      tutorialProgress, setTutorialProgress,
      tutorialPhase, setTutorialPhase,
      tutorialSkipped, setTutorialSkipped,
      // Helper functions
      canAdvanceStep, skipStep, skipAll, restartTutorial
    }}>
      {children}
    </TutorialContext.Provider>
  );
}
```

---

## 3. Integration Points

### 3.1 Campaign Context (`src/components/gm/CampaignContext.tsx`)

Add tutorial fields to Campaign:
```typescript
interface Campaign {
  // ... existing fields
  tutorialProgress: TutorialStep[];
  tutorialPhase: TutorialPhase;
  tutorialSkipped: boolean;
}
```

### 3.2 GMDashboard (`src/components/gm/GMDashboard.tsx`)

Provide tutorial context:
```tsx
export function GMDashboard({ onExit }: GMDashboardProps) {
  return (
    <CampaignProvider>
      <TutorialProvider>
        <GMDashboardInner onExit={onExit} />
      </TutorialProvider>
    </CampaignProvider>
  );
}
```

### 3.3 Settings Modal (`src/components/ui/settings/SettingsModal.tsx`)

Add "Tutorial" tab:
```tsx
<Tab value="tutorial">
  <div className="space-y-4">
    <h3 className="font-cinzel font-bold">Tutorial</h3>
    
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        The tutorial teaches you how to use the GM Campaign Suite by building
        and running "The Pale Lady's Tomb." You can skip, resume, or restart
        at any time.
      </p>
    </div>
    
    <div className="flex gap-2">
      <Button 
        onClick={() => restartTutorial()} 
        variant="outline" 
        size="sm"
      >
        Restart Tutorial
      </Button>
      <Button 
        onClick={() => skipAllTutorial()} 
        variant="ghost" 
        size="sm"
      >
        Skip Tutorial
      </Button>
    </div>
    
    <div className="text-xs text-muted-foreground">
      Progress: {tutorialProgress.length}/20 steps
    </div>
  </div>
</Tab>
```

---

## 4. Implementation Order

| Phase | Files | Description |
|-------|-------|-------------|
| **1. Data & State** | `tutorialState.ts`, `paleLadysTomb.ts` | Types, step definitions, content data, validation helpers |
| **2. Overlay UI** | `TutorialOverlay.tsx`, `TutorialContext.tsx` | Sidebar, progress, spotlight CSS, actions |
| **3. Hub Guided** | `CampaignHub.tsx` modifications | Clock creation flow, web build highlight, party display |
| **4. Forge Guided** | `ModuleBuilder.tsx` modifications | Pre-fill, field locking, callouts, step validation |
| **5. Play Guided** | `LivePlay.tsx` modifications | Coach marks, read-aloud prominence, Deploy pulse, Combat return, Puzzle hints |
| **6. Combat Guided** | `CombatView.tsx` modifications | Flow highlights, boss phase explanation |
| **7. Integration** | `GMDashboard.tsx`, `CampaignContext.tsx`, `SettingsModal` | Provider, persistence, entry points |
| **8. Polish** | Animations, copy refinement, edge cases (skip/resume/redo) | |

---

## 5. Key UX Decisions (To Confirm Before Implementation)

| Decision | Options | Recommendation |
|----------|---------|---------------|
| **Spotlight implementation** | CSS `::before` on `[data-tutorial-target]` vs React portal overlay | **CSS overlay** — lighter, no z-index wars, works with existing components |
| **Tutorial campaign** | Separate "Tutorial Campaign" vs inject into current campaign | **Inject into current** — user said "first part of whatever their campaign is" |
| **Placeholder party** | Auto-create 5 novice PCs if none exist vs require real PCs | **Auto-create** — lets solo GM test immediately |
| **Step validation** | Hard block (can't advance) vs soft warn (can advance with checklist) | **Soft warn** — don't frustrate, but show preflight-style checklist |
| **Skip granularity** | Skip entire tutorial vs skip per-step | **Per-step skip** — "Skip Step" button on each step, "Skip All" at welcome |
| **Replayability** | One-time only vs redoable from Settings | **Redoable** — "Restart Tutorial" in Settings, resets progress for current campaign |

---

## 6. Tutorial Content Mapping

| App Concept | Tutorial Step | Pale Lady's Tomb Example |
|-------------|---------------|---------------------------|
| **Campaign Clocks** | `hub-clocks` | "Pale Lady's Curse" — 6 segments, ticks daily |
| **Lore Web** | `hub-web` | Build web → see Pale Lady, Dagny, Jorik, Ismara as nodes |
| **Scene Types** | `forge-1` through `forge-7` | Social, Travel, Combat, Puzzle, Setback, Boss, Reward |
| **Read-Aloud** | `forge-1`, `play-1` | Blue-bordered player-facing text |
| **NPC Beats + Reactions** | `forge-1`, `play-1` | Dagny's dialogue tree |
| **Checks (Difficulty Ladder)** | `forge-2`, `play-2` | Standard Guile, Hard Might, Very Hard Magic |
| **Deploy Encounter** | `play-2` | Ice Wraiths → Combat tracker |
| **Findables + Reveal** | `forge-3`, `play-3` | Jorik's Journal, Runes, Drag Marks |
| **Puzzle UI** | `forge-4`, `play-4` | Hall of Riddles — graduated hints |
| **Setback/Exploration** | `forge-5`, `play-5` | Collapsed Tunnel — 3 solutions |
| **Boss + Phase Transition** | `forge-6`, `play-6` | Pale Lady at 20 HP → Ice Storm, tactics shift |
| **Roleplay Choice** | `play-6` | Mercy Kill / Seek Cure / Destroy |
| **Loot Distribution** | `play-7` | Frostbane Blade, Crown, Gold division |
| **Preflight Linter** | `forge-preflight` | "Scene 4: no exit", "Scene 1: no read-aloud" |
| **Compendium Search** | (embedded in steps) | Ctrl+K → "Frost Resistance", "Draugr", "Guile" |

---

## 7. Technical Implementation Notes

### 7.1 Step Validation Logic

```typescript
function canAdvanceStep(currentStep: TutorialStep): boolean {
  switch (currentStep) {
    case 'forge-1-hearth':
      // Must have at least one NPC with a line
      return module.scenes[0].npcs.some(npc => npc.line?.trim() !== '');
    case 'forge-2-journey':
      // Must have at least one check (from Ice Wraiths or Refugees)
      return module.scenes[1].checks.length > 0;
    // ... other validation rules
  }
}
```

### 7.2 Placeholder Party Creation

```typescript
function createPlaceholderParty(): Character[] {
  return [
    { name: 'Bjorn', race: 'Nord', class: 'Warrior', level: 'Novice', ap: 0 },
    { name: 'Elara', race: 'Altmer', class: 'Mage', level: 'Novice', ap: 0 },
    { name: 'Kjeld', race: 'Nord', class: 'Archer', level: 'Novice', ap: 0 },
    { name: 'Sigrid', race: 'Nord', class: 'Healer', level: 'Novice', ap: 0 },
    { name: 'Vignar', race: 'Nord', class: 'Rogue', level: 'Novice', ap: 0 },
  ];
}
```

### 7.3 Tutorial Spotlight CSS

```css
[data-tutorial-target] {
  position: relative;
}

[data-tutorial-target]::before {
  content: '';
  position: absolute;
  inset: -4px;
  border: 2px solid hsl(var(--primary));
  border-radius: 4px;
  box-shadow: 0 0 10px hsl(var(--primary) / 0.5);
  z-index: 1000;
  pointer-events: none;
  animation: tutorial-pulse 2s infinite;
}

@keyframes tutorial-pulse {
  0%, 100% { box-shadow: 0 0 10px hsl(var(--primary) / 0.5); }
  50% { box-shadow: 0 0 20px hsl(var(--primary) / 0.8); }
}
```

---

## 8. Testing & Verification

### 8.1 Tutorial Flow Tests

1. **Welcome Screen**: Verify skip/restart buttons work
2. **Step-by-step progression**: Each step should unlock appropriate fields
3. **Field locking**: Irrelevant fields should be disabled for current step
4. **Validation**: Cannot advance without completing required fields
5. **Persistence**: Tutorial state saved with campaign, survives page refresh
6. **Skip functionality**: Skip step/restart works correctly

### 8.2 Integration Tests

1. **Campaign creation**: New campaign starts tutorial at step 1
2. **Existing campaign**: Tutorial state preserved, can resume
3. **Settings integration**: Tutorial controls accessible
4. **Responsive design**: Tutorial works on desktop and mobile
5. **Accessibility**: Keyboard navigation, screen reader support

---

## 9. Documentation

### 9.1 User Guide

"Getting Started with the GM Campaign Suite"
- Overview of the tutorial system
- How to navigate through tutorial steps
- What each step teaches
- How to skip or restart the tutorial
- Common questions and troubleshooting

### 9.2 Developer Documentation

"Tutorial System Implementation"
- Architecture overview
- Component structure
- State management
- Customization points
- Testing strategies

---

## 10. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tutorial too long | User frustration | Break into smaller chunks, clear progress indicators |
| Field locking confusing | User confusion | Clear visual cues, help tooltips |
| Spotlight implementation | Performance issues | Use CSS animations, optimize for mobile |
| State persistence | Data loss | Comprehensive backup + localStorage fallback |
| Mobile compatibility | Layout issues | Responsive design, touch targets |

---

## 11. Future Enhancements

1. **Adaptive Difficulty**: Adjust tutorial based on user actions
2. **Progress Saving**: Auto-save tutorial state periodically
3. **Video Tutorials**: Integrate short video guides for complex steps
4. **Community Sharing**: Export tutorial progress as JSON
5. **Accessibility**: Voice-over support, high-contrast mode

---

## 12. Conclusion

The tutorial system provides a comprehensive, step-by-step learning experience that teaches GMs how to use the full power of the GM Campaign Suite. By building and running "The Pale Lady's Tomb," users gain hands-on experience with every pillar of the system, from campaign setup to combat management. The tutorial's progressive nature ensures users never feel overwhelmed while maintaining engagement through clear goals, visual feedback, and meaningful choices.

This design balances educational value with user experience, creating a smooth onboarding process that transforms complex mechanics into an engaging learning journey.

---

*Document created: 2026-06-23*
*Status: Planning Phase*
*Target Implementation: Phase 1-2 of development*

---

**Next Steps**: Confirm UX decisions, begin implementation of Phase 1 (data + state), create documentation files.

---

**Questions for the team**:

1. Should we implement the placeholder party feature now or wait until after initial testing?
2. What visual style should the tutorial overlay follow (current app theme vs. distinct tutorial theme)?
3. Should we add analytics tracking for tutorial completion rates?
4. Any specific concerns about the tutorial's length or complexity?

Please provide feedback on the design decisions to proceed with implementation.