# Combat sync — specification

Status: draft for approval, 30 Oct 2026. Movement and the map re-specced
6 Nov 2026.
Companions: `GM-SUPPORT-LAYER.md` (why), `SYNC-DESIGN.md` (the shape),
**`BATTLEMAP-SPEC.md` (the board: movement, paths, elevation)** — authoritative
for anything on the map, this document for everything else.

Everything below is either already agreed in the design discussion or explicitly
marked **DECISION** where a call had to be made. Anything not listed here is out
of scope by default; adding it needs a new line in this document, not a line of
code.

---

## 1. The test this has to pass

A player at the table never has to ask the GM a question that a screen could have
answered, and the GM never has to touch a number during someone else's turn.

If a feature does not move either of those, it does not go in this build.

---

## 2. Scope

### In

1. One encounter, shared live between the GM and every connected player.
2. A declaration — **Open Combat** — that brings every screen to the fight.
3. Physical dice as the default, with an outcome **reporting rail**.
4. A battle map where movement is drawn as a **path through 3D space**, with
   elevation, walls that block it, zones that fire when it crosses them, and a
   readout that prices the move before it is committed (`BATTLEMAP-SPEC.md`).
5. Persistence and reconnection that survive a phone locking mid-fight.
6. A session log that can produce the next session's pickup.

### Out — deliberately, for this build

- **The summon and companion features.** The combatant model supports them
  (section 4) because retrofitting it later would mean rebuilding the encounter.
  The spell automation, the cards and the dashboard UI are a separate build and
  are not part of these phases.

- **Line of sight, vision cones, lighting and cover maths.** Wall geometry
  exists in this build because paths have to be blocked by it; whether a wall
  blocks a *sight line* is the GM's call at the table. A later pass can use the
  same data.
- **Terrain as a cost.** With no distance budget there is nothing for difficult
  terrain to charge, so a region can only be a trigger (`BATTLEMAP-SPEC.md` M7).
- **Spell templates painted as shapes.** Areas are resistance rolls the GM
  adjudicates; the board says who is inside a stated radius, it does not draw
  the circle for you.
- Fog of war beyond per-token hide/reveal.
- Cloud hosting, accounts, login, remote play over the internet.
- Voice, video, text chat — the table already has these.
- In-app dice as anything but a fallback.
- Character-sheet editing during combat outside the intent list.
- Automatic rules arbitration beyond damage-through-DR and condition timers.
- Any change to damage numbers, HP pools or the multiplier rule.

---

## 3. Roles and authority

- **Host** — the GM's machine. Runs the server, owns the `Encounter`, applies
  every mutation. There is exactly one host per encounter.
- **GM client** — a view of the host with world powers (NPC actions, scene
  changes, hide/reveal, override).
- **Player client** — a view scoped to the one character already on that
  device. Sends intents.

**R1.** Only the host mutates state. Clients never write their own copy.
**R2.** A player intent against a combatant they do not own is rejected and
logged; the GM acting for an NPC is allowed.
**R3.** The host refuses a second instance for the same encounter id
(`409 already hosted`) rather than forking state.

---

## 4. Data model

```ts
type Outcome = 'crit' | 'success' | 'success_complication' | 'fail' | 'crit_fail';

type Vec3 = { x: number; y: number; z: number };  // squares; z in feet above datum 0
type Pt = { x: number; y: number };
type MoveMode = 'walk' | 'climb' | 'fly' | 'swim' | 'jump';

type Attack = {
  id: string;
  name: string;               // 'Iron pike' — named on the free-attack card
  reachFt: number;            // authored: dagger 5, pike 10, giant's arm 15
  rangeFt?: number;           // ranged/spell range — never the same field
  damage: string;             // '1d10+3'
};

type Encounter = {
  id: string;                 // one per combat, stable for its duration
  moduleId: string;
  sceneId: string;
  title: string;
  phase: 'active' | 'ended';
  round: number;
  seq: number;                // increments on every applied mutation
  order: TurnSlot[];
  activeIndex: number;
  combatants: Record<string, Combatant>;
  bars: BossBar[];
  map: MapState;
  log: LogEntry[];
};

type TurnSlot = { combatantId: string; initiative: number; done: boolean };

type Combatant = {
  id: string;
  name: string;
  kind: 'pc' | 'npc' | 'boss' | 'summon' | 'companion';
  ownerId?: string;           // claimed player client
  actsOn?: string;            // combatantId whose turn this one resolves on
  expiresAtRound?: number;    // summons only; absent = persists
  controller?: 'player' | 'gm';
  hp: number;
  maxHp: number;
  dr: number;
  conditions: { id: string; label: string; rounds?: number }[];
  pos: Vec3;                  // z is feet above datum, not a "level"
  modes: MoveMode[];          // how this token can travel; default ['walk']
  attacks: Attack[];          // reach lives on the row that does the reaching
  bodyReachFt?: number;       // band for threats with no attack row
  actions: { major: number; minor: number };   // no movement budget exists
  hidden?: boolean;           // GM-only visibility on the map
};

// `reachBandFt` is computed, never stored: max(reachFt) over the attacks the
// creature can use right now, else `bodyReachFt`. Nothing about the weapons
// changes when it is prone — the band does (D11).

type BossBar = { id: string; label: string; hp: number; maxHp: number; visible: boolean };

type MapState = {
  surface: { seed: number; rulesVersion: number; biome: string };  // §15
  traceImageId?: string;      // authoring aid only; never painted for players
  cols: number;
  rows: number;
  squareFeet: number;         // 5, the unit every range in the book is in
  floors: Floor[];            // walkable support surfaces, each at its own z
  blocks: Block[];            // solid volumes: walls, pillars, rubble
  zones: Zone[];              // non-solid volumes: hazards, water, light
  props: PlacedProp[];        // authored placement; PIXEL-ART P6
  light: LightRig;            // identical on every client; PIXEL-ART P15
};

// The light rig is scene data, not per-client surface state: two players must
// see the same brazier. Changing it is a patch, never a rules change.
type LightRig = {
  sun: { azimuth: number; colour: string; intensity: number };
  ambient: string;            // ramp id
  points: { cell: [number, number]; z?: number; radius: number;
            colour: string; intensity: number; flicker?: number }[];
};

// A placed object is data, never a decision. `rule` names a PropRule in the
// catalogue (PIXEL-ART P5) and `state` carries its modifiers — lit, open,
// burnt, bloodied (P8). `at` is in cells and may be fractional: coarse
// placement is legal, and the build snaps it deterministically (PIXEL-ART P6a).
type PlacedProp = { id: string; rule: string; at: [number, number]; z?: number;
                    state?: Record<string, number | boolean> };

type Floor = { id: string; polygon: Pt[]; z: number; label?: string };
type Block = { id: string; polygon: Pt[]; zBottom: number; zTop: number; climbable?: boolean };
type Zone  = { id: string; kind: 'hazard' | 'trigger' | 'water' | 'light';
               polygon: Pt[]; zBottom: number; zTop: number; label?: string; once?: boolean };

// Empty `floors` means the whole grid is floor at z = 0, so a bare uploaded
// image is immediately playable.

type LogEntry = {
  id: string;
  at: number;
  kind: 'outcome' | 'damage' | 'condition' | 'turn' | 'world' | 'note';
  combatantId?: string;
  outcome?: Outcome;
  source?: 'physical' | 'app' | 'gm';
  text: string;
};
```

**R4.** Turn order is computed, never typed: sort by `initiative` **ascending** —
this system counts low as good, so a natural 1 is the best roll. A tied
initiative is **rerolled**, never broken by Agility or by the app choosing a
side: the GM screen flags the tie and the order stands until it is rerolled
(`TABLE-SYNC-DECISIONS.md`). **Only combatants with no `actsOn` receive a turn
slot** — summons and companions resolve inside their owner's turn and never
appear in the order.
**R5.** There is no distance budget and no `move` field. One deliberate
movement spends the **Minor** however far it goes (`BATTLEMAP-SPEC.md` M2); a
climb spends a Major and a check. An attached combatant still has its own
`actions` and is not spent from the owner's budget.
**R15.** Attached combatants (`actsOn` set) are valid targets for damage and
conditions, are projected on the map as tokens like any other, and are removed
from the encounter when `expiresAtRound` is passed at `turn.advance`.
**R6.** `bars` exist only for bosses and are display-only projections of the boss
combatant's HP segments.

## 5. Protocol

Transport: `POST /intent` in, `GET /events` (SSE) out. JSON, one message per
event.

**Client → host**

| Intent | Payload | Notes |
|---|---|---|
| `outcome.report` | `combatantId`, `outcome`, `source`, `damage?` | the reporting rail |
| `damage.apply` | `targetId`, `amount`, `bypassDr?` | GM or owner |
| `heal.apply` | `targetId`, `amount` | |
| `condition.add` / `clear` | `targetId`, `conditionId`, `rounds?` | |
| `resource.spend` | `combatantId`, `field`, `amount` | FP, potions, ammo |
| `move` | `combatantId`, `mode`, `shape`, `path`, `suppress?` | resolved, not budget-checked (`BATTLEMAP-SPEC.md` M9) |
| `turn.end` | `combatantId` | |

**Host → all**

| Message | Payload |
|---|---|
| `snapshot` | full `Encounter` |
| `patch` | `seq`, changed slice |
| `combat.started` / `combat.ended` | `encounterId` |

**GM only**

| Intent | Payload |
|---|---|
| `world.action` | free text + optional `barId` |
| `scene.advance` | `sceneId` |
| `token.hide` / `token.reveal` | `combatantId` |
| `override` | any field, with reason |

**R7.** Every applied mutation increments `seq` and is broadcast as `patch`.
**R8.** A client receiving a `seq` gap discards local state and requests
`snapshot`. It never merges.
**R9.** An intent that fails validation returns an error to the sender only.

---

## 6. Screens

### 6.1 GM — Encounter

- Turn strip: order, who is up, round.
- Every combatant: HP, DR, conditions, actions remaining.
- Boss bars with a per-encounter **hide** toggle.
- Outcome chips beside each name (latest outcome, colour-coded) plus the feed.
- World actions: boss action, scene advance, complication, hide/reveal.
- One-tap `turn.end`, and the map.

### 6.2 Player — Turn

- Their own card: attack rows with die, modifier, damage, cost, properties.
- The **reporting rail**: five buttons — crit, success, success with
  complication, fail, crit fail — plus a damage field where damage is dice-based.
- Their conditions and the cost to clear them (prone = minor).
- Their remaining actions, and whether their movement is still unspent (one
  Minor, or none left).
- The target's visible state (bar visible or hidden per 6.1).

**R10.** The rail never computes a target, never verifies a result, and never
requires a rule to be understood. It reports.
**R11.** Tapping a rail button records an `Outcome` against that character and
broadcasts the chip immediately.

### 6.3 Space — VTT

Design authority: `BATTLEMAP-SPEC.md`. This is the summary; where the two
disagree, that document wins.

- Map image, square grid, tokens with name, HP ring, condition dots, and an
  elevation chip whenever `pos.z` is not zero.
- GM moves any token; a player moves only their own, and only while it has a
  Minor left.
- Hide/reveal is GM-only.
- Moving is drawing a **path**, not dropping a token. The route is what decides
  what the move crosses: a drag is a straight path, waypointing is a polyline,
  and a throw or burst is an arc.
- **Before commit the board prices the path**: which reach bands it enters and
  leaves, which zones it crosses, whether it ends somewhere the token can stand,
  and what that costs in actions. Nothing is priced after the fact.
- Reach is a **volume**, not a floor ring: one step horizontally and the reach
  vertically, so a flier at 15 ft is out of every ground token's reach, and the
  ring is drawn hovering at the enemy's own height.
- Each viewer has their own camera — pan, zoom, flat rotate — held locally and
  never synced. The GM cannot move a player's view.

**R12.** Everything positional is derived, never typed: reach from distance and
the attack rows, elevation from `pos.z`, the price of a route from the resolver.
A
player may draw a path across anything; the board's job is to say what that
costs, the host's job is to apply it.

---

## 7. Flows

### 7.1 Open Combat

1. GM selects the scene's combat block and taps **Open Combat**.
2. Host creates the `Encounter`, seeds combatants and starting positions from the
   block, computes order from initiative.
3. `combat.started` broadcasts; every connected client routes to 6.2 or 6.3.
4. Unconnected players get a join link/QR; joining mid-fight drops them on their
   own card with the current state.

**R13.** Starting a combat is one action for the GM. No other screen has to be
opened by anyone.

### 7.2 Ending

1. GM taps **End Combat**; host sets `phase: 'ended'`, broadcasts.
2. Every client returns to the campaign view.
3. The log is offered as a draft pickup block.

### 7.3 Player joins — the table (corrected 31 Oct 2026)

*An earlier draft of this section had players picking a character from a
claim list, with a code per encounter. That was wrong and is removed: no
player ever picks from a roster, because each player's device already holds
the one character they built.*

The room is the **table, for one session** — not a fight. The GM's machine
runs the host, so it is the room; it never "joins" anything.

1. Starting the host creates the session and a four-letter code, shown **only
   on the GM's screen**. The GM tells players the code in person.
2. A player types the code once. Their device sends the one character already
   on it (the whole Character). Nothing is picked and there is no list.
3. Identity is `character.id`, so a device that drops and rejoins resumes as
   the same player. Reconnecting means **retyping the code** — there is
   deliberately no stored identity or silent auto-rejoin.
4. When the GM opens a fight, every joined character becomes a PC combatant
   automatically; the GM removes anyone who shouldn't be in that fight.
5. A joined device is notified by an in-page **banner** ("a fight has
   started — join"). It is not an OS push notification and does not reach a
   device that is switched off or out of the page.
6. One fight is the norm, but several may be open at once (a split party);
   each device is shown whichever open fight(s) its own character is in.
7. The GM's roster is a condensed card per player; the full sheet is one
   click away and never shown by default.

Any web-connected device works — a phone, tablet or laptop; the host serves
the app, so all devices run the same build.

### 7.4 Turn cycle

1. Active player reads their card, rolls physical dice, taps an outcome.
2. Damage, if any, is applied to the selected target.
3. Player draws and commits their move if they choose, then `turn.end`.
4. Host advances `activeIndex` and resets `actions` for the next combatant.

**R14.** The GM never has to prompt whose turn it is; the strip shows it on every
screen.

---

## 8. Edge cases

| Case | Behaviour |
|---|---|
| Player phone locks | Dim "reconnecting" strip; full snapshot on return |
| Two tabs, same player | Same character id, so the host sees one player; both tabs show the same state |
| Device reloads or rejoins | Retype the session code; identity is the character id, so the player resumes where they were |
| GM closes the host | Clients show "host disconnected"; state persists locally |
| Duplicate host instance | Second refuses the encounter (R3) |
| Player edits HP locally | Impossible: HP is host state |
| Sequence gap | Resnapshot (R8) |
| Intent while not your turn | Accepted only for GM; player intents queue to their turn |

---

## 9. Persistence

- Host writes the encounter to disk (`encounters/<id>.json`) on every mutation,
  debounced 500 ms.
- Reloading the host restores the encounter and continues the session with the
  same `id` and `seq`.
- `phase: 'ended'` encounters are retained for the pickup, then prunable.

---

## 10. Build phases and acceptance

**Phase 0 — Encounter state.**
`Encounter` reducer, persistence, GM can open and end a fight using existing
data.
*Accept:* reload keeps HP, round and order; no behaviour regressions in the
tracker; no networking.

**Phase 1 — The switch, one machine.**
`BroadcastChannel`, `/player` route, Open Combat moves both tabs, chip + feed.
*Accept:* a second tab lands on the player's card when combat opens; an outcome
reported there appears as a chip on the GM screen within a second; closing combat
returns both tabs.

**Phase 2 — The room.**
Host server (app + state), session code join (QR not built yet — the code is
read aloud from the GM's screen), SSE.
*Accept:* a phone joins from the LAN and sees the live fight; airplane mode for
60 s then reconnect restores the correct state; the phone runs the same build as
the host.

**Phase 3 — The map.**
Cut into 3a board and tokens, 3b paths and reach, 3c elevation and walls, 3d
hazards and forced displacement, 3e sync. Design, sequencing and acceptance
live in **`BATTLEMAP-SPEC.md` §12**. Phase 3 is complete when 3a and 3b pass;
3c–3e may land afterwards without blocking another phase.

**Phase 4 — The log and the pickup.**
Authored complications surface on `success_complication`; log exports a draft
pickup.
*Accept:* reporting a complication shows that block's authored text on the GM
screen without leaving it; ending combat produces a pickup draft containing the
session's outcomes, damage and deaths.

---

## 11. Decisions made in this document

- **D1.** Damage through DR is applied by the host when reported (`amount` minus
  `dr` unless `bypassDr`), shown as `26 → 12 after DR 14`, and overridable before
  it lands. This is the one place the app does arithmetic, because it is exactly
  the arithmetic the GM was doing mid-turn.
- **D2.** (Corrected.) Each player's device is the source of truth for its own
  character and sends the whole Character when it joins the table. The host
  keeps a working copy for the session. **No write-back to player devices in
  this build** — that is a sync problem of its own and is out of scope.
- **D3.** (Superseded — BATTLEMAP-SPEC §15, V1–V8.) A scene is rendered from
  authored geometry plus a seed, not from a map image. An image may still be
  uploaded, but only as an authoring trace that never reaches a player's screen.
- **D4.** Trajectory and economy are separate. Every displacement resolves a
  path through space; only deliberate movement spends actions.
- **D5.** Forced displacement never provokes. An opportunity attack is someone
  turning their back under their own power, not someone being thrown by a die
  roll.
- **D6.** Entering a reach band and then leaving it provokes; arriving and
  staying does not. One opportunity attack per enemy per move, however many
  times the path crosses the boundary.
- **D7.** Terrain is a trigger, never a cost.
- **D8.** `z` is stored in feet, because every number the book already uses —
  5-ft reach, 20-ft area, 20-ft fall, 15-ft climb — is in feet.
- **D9.** The camera is per viewer and never synced.
- **D10.** Diagonal adjacency is 5 ft (Chebyshev). One reading everywhere, so
  the board never argues with itself.
- **D11.** Reach is `reachFt` on the attack row, and the band the board tests
  is derived from the rows the creature can currently use (BATTLEMAP M4b).
  Authored, so a pike and a dagger can differ and a free attack can name its
  weapon; derived, so prone, stunned or unconscious clears the band without
  editing a weapon. `rangeFt` stays a separate field — a spell's range is not a
  melee reach.

## 12. Open questions

- Does "success with complication" require the GM to accept the complication
  before damage lands, or is it recorded and narrated after? *(Current spec: recorded,
  then narrated.)*
- Reach is settled (D11): on the attack row, band derived. What is not settled
  is whether `bodyReachFt` is needed at all in this build, or whether every
  non-attack threat can be expressed as a `Zone` instead.
- Should the rail be available when it is not the player's turn (reactions)? *(Current
  spec: no, GM only.)*
