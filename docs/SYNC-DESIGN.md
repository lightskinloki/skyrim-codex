# Sync design — one encounter, four screens

Written and revised 30 Oct 2026. Companion to `GM-SUPPORT-LAYER.md`.

Revision notes: the first draft had the GM being the rules authority, treated the
player portal and GM tracker as duplicates, and argued against a battle map. All
three were wrong. This version has physical dice as the default, the combat-mode
declaration as the trigger, and a map.

**6 Nov 2026:** the board was re-specced. Movement has no distance budget, so the
map resolves a **3D path** rather than policing a drag. `BATTLEMAP-SPEC.md` is now
authoritative for the board; the map section below keeps only the rationale that
still holds.

## The switch

The adoption problem was never the software. It was that nobody opens a second
screen unless something *happens* to open it.

So the entry point is not an app feature, it is a sentence: the GM says **"open
combat mode."** That one act:

- creates the encounter on the host,
- pushes every connected player straight to their own turn view,
- opens the map for everyone at once,
- and puts the GM on the encounter tracker.

Nobody is told to open anything. Nobody types an IP. A player who is not
connected gets a join link and sees the fight the moment they tap it.

Ending combat mode returns everyone to the campaign view together.

That is the whole trick: a social declaration with a software consequence.

## Physical dice are the default

The dice ritual stays. What the app does is **tell you what to roll**, then take
the number.

The player's card shows the die, the modifier, and the total to beat — so the
question "what do I add?" stops existing. The player rolls their own d20, and
types or taps the result into a single field. The host applies it, both screens
see it, and the record marks it `source: physical`.

An in-app roller exists as the fallback for a lost die or a player on a phone who
prefers it, and the record marks those `source: app`. There is no adjudication
between the two, and no anti-fudge machinery: the app is a **record**, not a
referee. Trust is the default and should be visible in the design.

### The result is a tier, not a number

After the physical roll, the player taps one of five cards: **crit, success,
success with complication, fail, crit fail**. That is the whole input.

This is not a new mechanic — it is the `TierTable` the modules already carry.
`TierRange { min, max, label, effect }` renders directly as cards, which means
different actions can use different tables without the UI knowing anything about
the rules.

What it buys:

- The GM receives a structured outcome instead of a number to translate.
- "Success with complication" automatically surfaces that block's authored
  complication on the GM screen — the write-up stops being a note nobody reads
  mid-fight.
- "Crit fail" does the same for the authored critical failure.
- The log records the tier, so the pickup at the end of the session is already
  written.

It is a **reporting rail**, not a resolver. The five outcomes are the same for
every roll — attack, lockpick, persuasion — so they are written once in the
player view, with no per-module wiring and no rules knowledge in the app. The
app does not compute the target and does not verify the result.

A damage field sits beside the tier where damage is dice-based; where damage is
fixed per weapon, the card carries it.

The GM can report a tier too, for rolls the player shouldn't adjudicate.

## One encounter, three projections

There is exactly one `Encounter` object on the host. The three screens are
projections of it at different scopes, not separate copies:

| Screen | Shows | Can change |
|---|---|---|
| **Encounter** (GM) | order, every combatant, bars, conditions, resources, log | anything |
| **Turn** (player) | their own card, their reach right now, their conditions, the target's visible state | their own combatant only |
| **Space** (VTT) | the map, tokens, positions, reach | their own token, within movement |

This is the intended shape already — the player portal is scoped to one player,
the tracker is the whole encounter. What has been missing is the encounter they
both project from, which is why they have never fed each other.

## Transport: the LAN host

The GM's machine runs a small server that serves the app **and** the state.
Everyone else is a browser pointed at it.

- Intents in: plain `POST`.
- Truth out: `EventSource` (SSE) — it reconnects itself after a phone sleeps.
- Join: QR on the GM screen, four-letter claim code.
- State: full snapshot on connect; no delta protocol.

Serving the app from the host is not optional — it is how every phone runs the
same build as the GM.

Not WebRTC, not a mesh. One socket to one authority on a network that already
exists.

## The state

```ts
type Encounter = {
  id: string;
  sceneId: string;
  round: number;
  seq: number;                       // every mutation increments
  order: TurnSlot[];                 // computed from initiative, not typed
  combatants: Record<string, Combatant>;
  bars: BossBar[];
  log: LogEntry[];
  map: MapState;                     // floors, blocks, zones — BATTLEMAP-SPEC §4
};

// Attack = { id, name, reachFt, rangeFt?, damage } — COMBAT-SYNC-SPEC §4
type Combatant = {
  id: string;
  name: string;
  kind: 'pc' | 'npc' | 'boss';
  ownerId?: string;                  // claimed player
  hp: number;
  maxHp: number;
  dr: number;
  conditions: Condition[];
  pos: Vec3;                         // squares; z in feet
  modes: MoveMode[];                 // walk | climb | fly | swim | jump
  attacks: Attack[];                 // reachFt lives here, not on the creature
  bodyReachFt?: number;              // band for a threat with no attack row
  actionsLeft: { major: number; minor: number };   // no movement budget
};
```

**Intents** (client → host): `tier.report` (tier id + `source`), optional
`roll.result` for tables that need the margin, `damage`, `heal`, `condition.add`,
`condition.clear`, `resource.spend`, `move` (mode, shape, anchors, `suppress?` —
the anchors travel, the host resamples), `turn.end`.
**Truth** (host → all): `snapshot`, then `patch` carrying `seq`.
**World** (GM only): `boss.action`, `scene.advance`, `complication`.

The host rejects an intent against a combatant the sender doesn't own, except
the GM acting for NPCs.

## Reconnect

The common failure at a real table is a phone locking mid-fight.

- Connect and reconnect both get a full snapshot.
- A client that sees a `seq` gap discards and re-requests rather than guessing.
- A dropped client shows a dim "reconnecting" strip; the fight continues on the
  host regardless.

Never block the table on a phone.

## The map (rewritten 6 Nov 2026)

The earlier version of this section said "drag-with-budget" and described the
readout as *when*, not *how far*. Both assumed a squares-per-turn stat that does
not exist. One Minor moves any distance, so the map's job is not to bound the
move — it is to **price the route**.

- **In:** one map image per scene, square grid, tokens with name, HP ring,
  condition dots and an elevation chip, authored floors/blocks/zones, a drawn
  path (straight, polyline or arc) resolved before it commits, reach as a
  volume drawn at the enemy's own height, per-viewer camera, hide/reveal.
- **Out:** line of sight, vision cones, lighting, cover maths, terrain cost
  (there is nothing to charge), templates, tilt, pathfinding.

The rationale that survives from this version: the readout is the product, not
the map. It is a different sentence now — not *when*, not *how far*, but **what
it costs to pass through here**.

Rules, geometry and acceptance: `BATTLEMAP-SPEC.md`. The empty
`src/components/table/` directory is still the obvious home for it.

## Build order

**Phase 0 — the encounter.** A reducer with the shape above, still local, plus
persistence. No visible change except that a reload stops erasing the fight.
*Proves: the state is complete enough to survive a refresh.*

**Phase 1 — the switch, on one machine.** `BroadcastChannel`, a `/player` route,
"open combat mode" moving both tabs, turn strip and boss bar on each.
*Proves: the trigger and the projections work, before any networking.*

**Phase 2 — the room.** Host server, QR join, roster claim, SSE.
*Proves: phones at the table, one build, nobody asking how to open it.*

**Phase 3 — the map.** Board, paths, reach, elevation, hazards, sync — cut into
3a–3e in `BATTLEMAP-SPEC.md` §12.
*Proves: the spatial questions stop being asked out loud.*

**Phase 4 — the world's answers.** Authored complications and a beat line on the
GM's turn prompt so the GM screen is fiction and consequence, not numbers.

## Decisions still open

1. **Roster on the host, or characters imported per player?** Recommended: host,
   with claim codes; JSON import stays as the offline path.
2. **Boss bars visible to players by default?** Recommended: yes, with a
   per-encounter hide toggle.
3. **Map images: bundled with the module, or uploaded by the GM?** Recommended:
   both — a default per scene, overridable.

## Risks, plainly

- This is the largest piece of work in the app. Phases 0–1 are days; Phase 2 is
  the week; the map is its own project after that.
- Two open host instances on the same network is a state fork. Only one host per
  encounter, enforced in the join flow, not by hope.
- Players will still ask things. The target is that the answer is already on
  their screen when they ask, so the GM can point at it and keep narrating.
