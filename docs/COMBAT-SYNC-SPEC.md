# Combat sync — specification

Status: draft for approval, 30 Oct 2026.
Companions: `GM-SUPPORT-LAYER.md` (why), `SYNC-DESIGN.md` (the shape), this
document (what is being built, exactly, and what is not).

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
4. A battle map with tokens, drag movement, and a reach readout.
5. Persistence and reconnection that survive a phone locking mid-fight.
6. A session log that can produce the next session's pickup.

### Out — deliberately, for this build

- **The summon and companion features.** The combatant model supports them
  (section 4) because retrofitting it later would mean rebuilding the encounter.
  The spell automation, the cards and the dashboard UI are a separate build and
  are not part of these phases.

- Walls, line of sight, vision cones, lighting, terrain cost, templates.
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
- **Player client** — a view scoped to one claimed combatant. Sends intents.

**R1.** Only the host mutates state. Clients never write their own copy.
**R2.** A player intent against a combatant they do not own is rejected and
logged; the GM acting for an NPC is allowed.
**R3.** The host refuses a second instance for the same encounter id
(`409 already hosted`) rather than forking state.

---

## 4. Data model

```ts
type Outcome = 'crit' | 'success' | 'success_complication' | 'fail' | 'crit_fail';

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
  pos: { x: number; y: number };
  move: number;               // squares per turn
  actions: { major: number; minor: number };
  hidden?: boolean;           // GM-only visibility on the map
};

type BossBar = { id: string; label: string; hp: number; maxHp: number; visible: boolean };

type MapState = {
  imageId?: string;
  cols: number;
  rows: number;
  squareFeet: number;         // for reach phrasing only
};

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

**R4.** Turn order is computed, never typed: sort by `initiative` descending, ties
broken by Agility then by GM choice. **Only combatants with no `actsOn` receive a
turn slot** — summons and companions resolve inside their owner's turn and never
appear in the order.
**R5.** `move` is per turn and resets on `turn.advance`. An attached combatant
has its own `move` and `actions`; they are not taken from the owner's budget.
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
| `move` | `combatantId`, `to` | validated against `move` |
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
- Their remaining actions and their own token's movement.
- The target's visible state (bar visible or hidden per 6.1).

**R10.** The rail never computes a target, never verifies a result, and never
requires a rule to be understood. It reports.
**R11.** Tapping a rail button records an `Outcome` against that character and
broadcasts the chip immediately.

### 6.3 Space — VTT

- Map image, square grid, tokens with name, HP ring, condition dots.
- GM drags any token; a player drags only their own, within `move`.
- Hide/reveal is GM-only.
- Reach readout: selecting a token shows which others are "in reach now" and
  "reachable next turn".

**R12.** Reach is derived from grid distance and the mover's `move`; it is never
entered by hand.

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

### 7.3 Player joins

1. QR or link → claim list.
2. Player picks a character and holds a four-letter claim code for the encounter.
3. Claim is exclusive; a second claim on the same character requires GM release.

### 7.4 Turn cycle

1. Active player reads their card, rolls physical dice, taps an outcome.
2. Damage, if any, is applied to the selected target.
3. Player moves their token if they choose, then `turn.end`.
4. Host advances `activeIndex`, resets `move` and `actions` for the next.

**R14.** The GM never has to prompt whose turn it is; the strip shows it on every
screen.

---

## 8. Edge cases

| Case | Behaviour |
|---|---|
| Player phone locks | Dim "reconnecting" strip; full snapshot on return |
| Two tabs, same player | Second claim is read-only until the first releases |
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
Host server (app + state), QR join, roster claim, SSE.
*Accept:* a phone joins from the LAN and sees the live fight; airplane mode for
60 s then reconnect restores the correct state; the phone runs the same build as
the host.

**Phase 3 — The map.**
Grid, image, tokens, drag, hide/reveal, reach readout.
*Accept:* drag respects `move` for players and not for the GM; reach reads "next
turn" at exactly `move + 1` squares; hidden tokens are absent from player views.

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
- **D2.** The host holds a working copy of the roster for the encounter; the GM's
  browser library remains the master. **No write-back to player devices in this
  build** — that is a sync problem of its own and is out of scope.
- **D3.** Map images come from `public/maps/` by default, with GM upload on the
  host for a one-off scene.

## 12. Open questions

- Does "success with complication" require the GM to accept the complication
  before damage lands, or is it recorded and narrated after? *(Current spec: recorded,
  then narrated.)*
- Should the rail be available when it is not the player's turn (reactions)? *(Current
  spec: no, GM only.)*
