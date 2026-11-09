# The board — movement, paths and elevation

Status: draft for approval, 6 Nov 2026. Authoritative for anything on the map.
`COMBAT-SYNC-SPEC.md` remains authoritative for sync, authority and turn order;
where this file and that one disagree about the board, this file wins.

Every line below is either the GM's ruling, already written into the module
text, or explicitly marked **DECISION** where a call had to be made.

---

## 0. What the board is for

One test: **it answers the questions the rules actually ask, before the player
commits the move.** Those questions are:

1. Who is in reach of me where I land, and who am I leaving?
2. What does the route pass through — a reach band, a rune, fire, ice, a pit?
3. How high am I, and does that put me out of someone's reach or radius?
4. Can I stand there at all?
5. What does it cost me — my Minor, my Major and a check, or nothing?

It is not a wargame and it has no distance budget to spend. The grid survives
because every range in the book is measured in feet and squares are the only
representation a whole table reads at a glance.

---

## 1. The rule as written

From `wtgg:ridge:b26` (the giant at the standing stones):

> One Major and one Minor each turn… **One Minor moves to any location on the
> field (no distance cap); melee reach 5 feet. Leaving engagement permits an
> enemy free attack.** Spend a Major on Standard Might shove / Agility slip /
> Guile feint, then a Minor to move: success avoids the attack; failure still
> moves but permits it.

Three things follow directly, and the rest of this document is their
consequences:

- **A move costs the Minor.** Not a number of squares. One Minor, any distance.
  There is therefore no `move` stat, no squares-per-turn, and nothing for
  difficult terrain to charge.
- **You get one, because you have one Minor.** "Run over, act, run back" is two
  movements and costs a Minor you do not have.
- **Leaving engagement is the priced part.** Distance is free; exposure is not.

---

## 2. Trajectory is not economy

| Displacement | Path resolved | Spends | Can provoke |
|---|---|---|---|
| Walk | yes | Minor | yes |
| Dash | yes (straight only) | Minor | yes |
| Flight / levitation | yes (3D) | Minor | yes |
| Swim | yes | Minor | yes |
| Jump | yes (arc) | Minor | yes |
| Climb | yes (along a face) | Major + check | yes |
| Shove, throw, telekinesis | yes | nothing | **no** |
| Air burst, knockback | yes (arc) | nothing | **no** |
| Fall | yes (vertical) | nothing | **no** |

**M1.** Every displacement resolves a path through space. Only deliberate
movement spends actions, and only deliberate movement can provoke.

**M2.** A deliberate movement spends the Minor, once, regardless of distance,
direction or elevation. There is no movement counter and no budget field; adding
one would be re-introducing a rule this system does not have.

This is why the path is required rather than optional: a body that crosses a
reach band, a rune or a burning beam at 8 ft has done so whether or not a player
chose it. The geometry does not care who caused the movement. Only the economy
and the opportunity attack do.

---

## 3. Coordinates

**M3.** The plane is in squares; `z` is in **feet** above datum 0. Squares are
5 ft (`MapState.squareFeet`), and `z` is never a "level" integer — the book's
numbers are 5-ft reach, 20-ft area, 20-ft fall threshold and 15 ft of climb per
success, so feet means the resolver's arithmetic is the book's arithmetic.

**M4.** Adjacency is Chebyshev: eight neighbours, all 5 ft, diagonals included.
One reading, everywhere.

Two distance rules, because they answer different questions:

- **Reach** is a **volume around the token** — a box, not a sphere: every
  square within one step horizontally (eight neighbours, diagonals included,
  per M4) and within the reach vertically. A token 15 ft above the floor is
  outside a 5-ft reach; a diagonal neighbour is inside it. The number is not a
  property of the creature but of the thing doing the reaching — `reachFt` on
  the attack row — and the band the board draws is derived from the rows the
  creature can currently use (M4b).
- **"Within N feet"** — the book's phrasing for areas (Groundbreaker 5 ft,
  Grief-Quake 20 ft) — is a **horizontal radius of N feet across a bounded height
  band**, not a ball of radius N. The band is the effect's own origin
  ± `areaHeightFt` (default 10 ft). A flier 30 ft overhead is outside a ground
  shockwave, and so is one 30 ft away across the floor; a flier 4 ft up is
  inside it. An effect whose own text states a vertical extent is resolved as a
  ball in three dimensions instead.

> **DECISION — M4a.** Two rulings sit here, and the second is what keeps the
> first coherent. (1) Areas are flat, not domes: a ground effect does not follow
> you upward. (2) But "flat" needs a **finite band** — a pure horizontal radius
> with no height limit catches a flier directly overhead at any altitude, which
> is worse than a dome and is not what anyone means by a shockwave. Default band
> 10 ft, one number per effect to change it.

> **DECISION — M4b.** Reach is authored on the **attack row**, and the
> creature's band is derived from it. Authored, because a creature with a pike
> and a dagger genuinely has two reaches, and because a free attack has to name
> the weapon that fired. Derived, because the band must be able to disappear
> without the sheet changing: a prone, stunned or unconscious token still has
> `reachFt: 10` written on its pike and takes no free attacks, and a stored
> `reachBandFt` would have to be mutated out and back to say so.
>
> `reachBandFt = max(reachFt)` over usable attacks, falling back to
> `bodyReachFt` for a threat that is not an attack (a trap's trigger, a burning
> body, a grapple aura). `rangeFt` on a spell is a different field measuring a
> different geometry — 60 ft of firebolt never becomes a melee reach. The row
> type is `Attack` in `COMBAT-SYNC-SPEC.md` §4; "usable" means the creature is
> conscious and able to react, not that the weapon is drawn.

---

## 4. Geometry

```ts
type Pt = { x: number; y: number };

type Floor = { id: string; polygon: Pt[]; z: number; label?: string };
type Block = { id: string; polygon: Pt[]; zBottom: number; zTop: number; climbable?: boolean };
type Zone  = { id: string; kind: 'hazard' | 'trigger' | 'water' | 'light';
               polygon: Pt[]; zBottom: number; zTop: number; label?: string; once?: boolean };
```

**M5. Support.** A token is supported when a `Floor` polygon contains its
`(x, y)` at exactly its `z`. If `floors` is empty the whole grid is floor at
z = 0, so an uploaded image with no authoring is immediately playable.

**M6. Blocks are solid volumes.** A path segment is blocked when it passes
through a block between that block's `zBottom` and `zTop`. A 10-ft wall stops a
walk but not a flight at 15 ft; a 20-ft wall stops both. Walls are authored as
thin polygons (the editor's wall tool draws the polygon for you), so there is
one obstruction type rather than two.

**M7. Zones are triggers, never costs.** A zone fires an event when a path
enters it between `zBottom` and `zTop`. It cannot slow a move, because there is
no budget to slow. `once: true` marks a single-use trigger (a rune) that the
host records as spent; a continuous hazard (fire, ice, water) has no `once`.

**M8. Endings.** A path may end unsupported only in a mode that can hold the
token there (`fly`). Anything else produces a fall (§8).

---

## 5. Paths and how they are drawn

```ts
type Shape = 'polyline' | 'straight' | 'arc';
type MoveMode = 'walk' | 'climb' | 'fly' | 'swim' | 'jump';
```

| Shape | Edited as | Used for |
|---|---|---|
| `polyline` | click waypoints, drag to insert | walking, climbing, swimming, routing around a hazard |
| `straight` | drag from square to square | dashes, and the default for a quick move |
| `arc` | two endpoints plus an apex height | throws, air bursts, leaps, knockback |

**M9. Authoring and sampling.** A drag produces `straight`; waypoints produce
`polyline`; the throw tool produces `arc` from endpoints and apex. All three are
sampled to **1 ft** before resolution (a parabola from an apex is exact, a
polyline is segment-wise), capped at **512 samples** per path — a 100-ft dash is
100 samples, well inside a single patch frame.

The arc exists so hand-drawing is never required for a body in flight. Picking a
landing point and an apex is two clicks; twenty waypoints through the air is not
a move anyone will make at a table.

---

## 6. The resolver

```ts
type MoveEvent =
  | { kind: 'engage.enter'; enemyId: string; at: Vec3 }
  | { kind: 'engage.leave'; enemyId: string; at: Vec3; attackId?: string;
      /* the weapon that fires: longest usable reach at that moment (M4b);
         absent when the band is a body/aura threat and nothing rolls */ }
  | { kind: 'zone';        zoneId: string;  at: Vec3; once: boolean }
  | { kind: 'blocked';     at: Vec3; blockId: string }
  | { kind: 'fall';        from: number; to: number };

resolvePath(map, combatants, moverId, {
  intent:
    | { kind: 'move'; mode: MoveMode; suppress?: string }   // deliberate: spends, provokes
    | { kind: 'forced'; cause: 'shove' | 'throw' | 'burst' | 'telekinesis' | 'fall' },
  shape: Shape,
  path: Vec3[],          // P0 = current position; Pn = destination
}): { legal: boolean; events: MoveEvent[]; cost: 'none' | 'minor' | 'major'; blockedAt?: Vec3 }
```

Order of work, and it is the same order in the preview and in the commit:

1. **Continuity** — each straddle is ≤ 1 square horizontally and ≤ 5 ft
   vertically, or the path is `blocked` at that point.
2. **Blocks** — sample the path; the first sample inside a block that the mode
   cannot pass reports `blocked` with that block's id.
3. **Support** — the last sample must be supported, or the mode must be `fly`
   (M8).
4. **Zones** — every entry into a zone volume emits one event; `once` zones
   emit at most one and are marked spent on commit.
5. **Engagement** — per enemy, compute its derived band (M4b), find every
   crossing of that volume, and reduce it to `enter`/`leave` events (§7).
6. **Cost** — `none` for a `forced` intent; otherwise `minor`, except `climb`,
   which is `major` plus the check the book already specifies. Deliberate-ness is
   read from `intent.kind`, never from a flag that could contradict it.
7. **Fall chain** — if step 3 failed and the mode cannot hold, append a fall
   (§8).

**M10. One resolver, two callers.** The pointer-move preview and the committed
mutation call the same function with the same inputs. The preview is advisory
only in *authority* — the host's result is the one that lands — never in
*rules*. If preview and commit could disagree, the resolver is wrong.

**M11. Host authority.** A client may draw any path it likes; the host resolves
it, applies the cost, emits the events, and broadcasts the position and the log
entry. The client never applies its own move. A rejected path returns to the
sender only (COMBAT-SYNC R9).

> **DECISION — M10a.** The resolver's input is the **cause**, never the
> consequence. `cost` and `provokes` are outputs; neither is a field a caller
> may set. A `provokes` boolean would be unvalidatable — nothing about a walk
> path makes `false` wrong — so a client could send `false` and skip every
> opportunity attack, and the preview could then disagree with the commit, which
> is exactly what M10 forbids. To say a displacement does not provoke you have
> to say it was not a move, and then it also spends nothing and was nobody's
> action. If a GM override is ever wanted it comes back as
> `override: { provokes: boolean; reason: string }`, written into the log entry,
> never as a silent key.

---

## 7. Opportunity attacks

> **DECISION — D6, GM 6 Nov 2026.** Entering a reach band and then leaving it
> provokes. The book's "leaving engagement" is extended: it is not only the
> enemy you started beside, it is every band the route used as a corridor.

| Case | Provokes |
|---|---|
| Start outside, end outside, never enters | no |
| Start outside, enter, **end inside** (a charge) | no |
| Start inside, end outside (the book's case) | yes |
| Start outside, enter, **leave**, end outside | **yes** |
| Start inside, leave, re-enter, end inside | yes |

- **One per enemy per move**, however many times the path crosses the boundary.
  Otherwise a player wiggling across the edge of a band eats five free attacks
  for a two-square move and the tool punishes them for using it.
- **The free attack names its weapon.** The band is derived (M4b), so the event
  carries `attackId`: the longest reach the enemy can use at that moment. The GM
  card shows it as *"Bjorn's iron pike, 1d10+3"* and can change the row before
  it lands. A band with no attack behind it — a trap, a burning body, an aura —
  reports no `attackId` and rolls nothing.
- **Forced displacement never provokes.** A shove, a throw, a burst, a fall:
  no opportunity attack, no matter which bands it crosses. The target did not
  choose it. `provokes` is therefore never an input to the resolver — it is
  derived from *why* the body moved (§2), so there is no boolean a client can
  set wrongly.
- **The disengage check buys off one enemy.** The book's procedure — Major on
  Might / Agility / Guile, then the Minor to move — suppresses the free attack
  **all** free attacks from the one enemy named in `suppress`, not one weapon
  row, because the check is the creature deciding not to swing. Every other
  band left still fires. This is what makes being surrounded expensive, which is
  the whole point of reach once distance is free.
- **Consequence for play:** with no distance budget, a token's 5-ft reach is a
  15-ft bubble you do not cross for free. That bubble, not travel time, is what
  controls space. It is why this rule is load-bearing rather than decorative.

---

## 8. Falls

**M12.** A fall is a chained displacement: `shape: 'straight'`, vertical,
forced, so it spends nothing and provokes nothing, resolved by the same
resolver.

- If a path ends unsupported and the mode cannot hold it, the chain runs to the
  nearest supported floor below.
- The book's rule applies at the end: **over 20 ft, 5 damage and Prone**, DR
  applies (`wtgg:c-standoff:b11`).
- Losing flight mid-air — Prone, Paralyzed, dead, or a condition that removes
  flying — drops the token by the same chain. Altitude is a stake, not a chip.

---

## 9. Camera

**M13.** The camera is per viewer and **never synced**. `{ x, y, pxPerCell,
quarterTurns, freeAngle? }` lives on the device (optionally remembered in
`localStorage`), never in `Encounter`, never in a patch. This is a feature: the GM framing a fight
does not drag five phones with them.

- Pan, integer zoom, and **snapped 90° rotate** as the played-on view: four
  orientations, a reindex rather than a resample, so it is free and perfectly
  crisp. That is also what the genre offers — FFT and Tactics Ogre snap, Fire
  Emblem does not rotate at all.
- A **free-look** angle is available for reading an awkward map: any angle, drawn
  by sampling a 2× supersampled viewport and re-quantising to the palette
  afterwards. It is a viewing mode, not the play view — see below.
- Drag input goes through the **inverse camera transform** before it becomes a
  square, or every drag lands somewhere else the moment someone zooms.
- Token labels and HP rings **counter-rotate** the view, or a player who spins
  the board reads their own name upside down. With four orientations that is
  four angles, not a continuous function.
- **No tilt.** Tilt is the isometric projection that was rejected: same shear,
  same broken grid, same re-authored art. Height is carried by §10 instead.
- **As built.** A snapped turn *rebuilds* the board in the camera's frame rather
  than rotating the finished raster: the cell map is reindexed, walls are
  repainted in depth order, props are rotated on whole pixels about their
  footprint, and tokens and point lights are moved with them. The sun keeps its
  world azimuth (the camera's yaw is subtracted from it), so a face that was lit
  is still lit from the same side of the room. Turning to the north wall
therefore *reveals* the room behind it, which is the only reason to offer a
  turn at all — spinning a finished image would leave every face pointed the
  wrong way.

A **shot** — punch, follow, reveal — is local too. The beat is a pure function of
the committed event, so every device computes the same camera moves from the same
input while the camera itself stays per-viewer. Synced view state never comes back
in through the door marked "cinematic" (PRESENTATION X5).

**Free rotation, precisely.** What fails is rotating the board *in place*: the
screen grid and the art grid stop being aligned, so tile edges stair-step and a
1 px outline is no longer 1 px. Two steps fix it, and neither is expensive:

1. **Supersample the viewport, not the board.** The board is built once at
   `pxPerCell`; free-look samples it through a 2× rotated transform into a
   viewport-sized buffer (a 1200×800 view is 2400×1600 = 15 MB, one pass) and
   downsamples.
2. **Quantise to the palette after filtering, then dither.** Snapping every output
   pixel back to one of the 61 colours is what re-imposes the style after
   resampling; filtering without it is what makes a rotated board look like a
   photograph of pixel art. Dither goes after quantisation, at screen resolution,
   or the rotated Bayer pattern moirés.

So a free camera costs one extra pass over the viewport and softens edges slightly.
The reason it is not the default is not that it is impossible — a board you are
reading a 20-ft reach band off is worse when its outlines are soft.

---

## 10. Drawing height

With no tilt, height has to be legible in a top-down view. Three cheap devices,
in order of importance:

1. **Vertical offset.** A token's screen position is its ground square, moved up
   by `z × pxPerFt`, where `pxPerFt = pxPerCell / 5` is read from the **current
   camera zoom**, not from a constant (PIXEL-ART P1). There is no fixed
   pixels-per-foot value to fall out of sync with the camera.
2. **Shadow stays on the floor.** The drop shadow is drawn at the token's ground
   square and scaled down as `z` rises, so the gap between the two reads as
   height without any perspective maths.
3. **A chip.** `15 ft` beside the name, shown only when `z ≠ 0`.

Floor polygons above z = 0 render as offset, semi-transparent layers with their
own shadow — a cutaway stack rather than a projection. This is available because
the maps are vector already; a raster floor would have to be re-authored per
level.

Reach bands are drawn the same way: an ellipse offset to the enemy's own `z`,
not a ring painted on the floor. A ring on the floor claims a 15-ft flier is in
reach when nothing on the ground can touch them.

**Occlusion is a front buffer, not a z-buffer.** Every pixel a wall or a prop
paints records the screen y of that object's own foot (`Surface.front`, §11 in
PIXEL-ART). A body is then tested per pixel: if the standing surface's front is
nearer than the body's feet, the surface wins the pixel. That is why a barrel
behind a wall is cut off by it and one in front paints over its face, with no
sort list, no second pass and no object ever knowing what drew it. Flat props
(rugs, decals) write zero, so anything may stand on them. Depth is the prop's
*footprint*, not its artwork: a low shelf in the cell south of a wall is in
front of that wall even though its sprite is drawn high in its own cell.

---

## 11. What the board shows before commit

The pre-commit readout is the feature; everything above exists to feed it.

- Every enemy's reach band, at its own height.
- The path as drawn, with crossings marked: red where it leaves a band, amber
  where it enters one and ends inside.
- A plain-sentence list of what is about to happen:
  *"Leaves Bjorn's reach — free attack. Crosses the rune at C4 — 6 shock. Ends
  15 ft up, out of melee reach of both draugr. Costs your Minor."*
- Blocked samples marked where they fail, before the move is attempted.
- Whether it ends supported, and the fall if it does not.

The list is prose on purpose. The test in COMBAT-SYNC §1 is that a player never
has to ask the GM a question the screen could have answered, and the answer has
to be in words, not in a colour the player has to decode.

---

## 12. Build phases and acceptance

### 3a — Board and tokens

`MapState` rendering (image, grid, floors defaulting to the whole grid), tokens
at `pos`, per-viewer camera, GM moves any token, a player moves only their own
and only with a Minor left. A drag is a straight path resolved on drop.

*Accept:* a token cannot be dropped inside a block or in mid-air without `fly`;
camera state never appears in any patch; two devices show independent cameras
on the same fight; a player's move of another player's token is refused; a
token with no Minor cannot commit a move.

### 3b — Paths and reach

Polyline waypoints, 1-ft sampling, reach as a cube drawn at the enemy's `z`,
the full pre-commit readout, cost spent on commit.

*Accept:* a path that enters and leaves a band shows the free attack **before**
commit; two crossings still charge one attack; a token at 15 ft draws no
ground-reach band and is not in any ground token's reach; a path that ends
inside a band shows no free attack; an enemy carrying a 10-ft pike and a 5-ft
dagger draws one band at 10 ft and the free attack names the pike; prone clears
the band without clearing either weapon.

### 3c — Elevation and walls

`z` chip, offset rendering and shadow, authored floors and blocks, climb mode
along a `climbable` block, flight over a block below its `zTop`.

*Accept:* a fly path at 15 ft clears a 10-ft wall and is stopped by a 20-ft one;
ending over open air with no floor drops the token and applies fall damage over
20 ft; a mezzanine authored as a floor polygon reports `z` equal to its height;
a climb path that does not follow a climbable face is `blocked`.

### 3d — Zones and forced displacement

Hazard and trigger zones, `once` semantics, `forced` paths (burst, throw,
telekinesis, fall), the fall chain, `suppress` on the disengage check.

*Accept:* a rune marked `once` fires on the first crossing and never again; an
arc burst that passes through a burning zone at 8 ft fires it and the same arc
at 25 ft does not; a forced displacement spends no Minor and provokes nothing;
a climb that leaves a band provokes and the disengage check suppresses exactly
the named enemy.

### 3e — Sync

Paths in the `move` intent, seq discipline, reconnect mid-move.

*Accept:* a committed path appears at the same squares on every client; a client
that reconnects during a move shows the final position, not a replay; a
512-sample path fits one patch frame; a rejected path leaves the token where it
was and tells only the sender.

### 4 — Presentation

The beat sheet, hit-stop, damage numbers, turn wheel and camera shots
([PRESENTATION-SPEC.md](PRESENTATION-SPEC.md)). This is the phase that decides
whether the app feels like a tactics game rather than a tidy map.

*Accept:* the 30-second slice in PRESENTATION §2 plays — one token walks a path,
one attacks, one dies, the wheel advances — and a normal beat finishes inside
600 ms with a full round under ~20 s of animation.

The **surface track** runs alongside 3a–3e and is gated separately
([PIXEL-ART-SPEC.md](PIXEL-ART-SPEC.md) §5, E1–E4). Phase 4 is judged on real
surfaces, not on a grey grid: a beat cannot be assessed against a placeholder
board, and a board cannot be judged before the sun sweep passes.

---

## 13. Non-goals

- **Pathfinding.** The player draws the route. There is no A*, no cost function,
  no reachable-square shading — with an unlimited budget, shading where you
  *could* go would be shading the whole map.
- **A movement budget**, in any form.
- **Line of sight, lighting, vision cones, cover maths.** The geometry exists
  and can support them later; this build does not compute them.
- **Spell templates** painted as shapes.
- **Tilt or an isometric camera.**
- **Door state** — a door is a block the GM deletes or edges aside, not a
  toggled object in this build.
- **Automatic floor detection from the art.** Layers are authored, never
  inferred from pixels.

---

## 14. Not yet specified

The movement model above is closed: one resolver, one opportunity-attack rule,
every number in feet, and no contradiction left between this file,
`COMBAT-SYNC-SPEC.md` and `SYNC-DESIGN.md`. The gaps below are about everything
*around* the token, and the first five block Phase 3 from starting.

### Blocks 3a — a fight cannot be set up

**G1. Starting positions.** COMBAT-SYNC §7.1 seeds "starting positions from the
block", but a combat block carries enemy ids and no coordinates. *Default:* a
setup step — GM drags tokens onto the map before the first turn, players' tokens
placed from their `pos` if one exists, otherwise auto-laid along the near edge.

**G2. Where the map lives, and how it is made.** `Encounter.map` means the
walls die when combat ends and the GM re-authors them every fight. And §4 says
"the editor's wall tool" as though one exists. With §15 there is no image to
fall back on at all: an empty `floors` gives 3a a floor, and 3c needs authored
polygons from somewhere. *Default:* `Scene.map`, authored once in the builder
with a floor/wall/zone polygon tool, copied into the encounter when combat
opens. The authoring UI is a feature of its own and should be sized before 3c is
promised.

### Blocks correctness — the rules would be wrong

**G3. Token footprint.** `pos` is a point, but the giant at the standing stones
is not: a 10-ft creature occupies 2×2 squares, blocks the square it stands in,
and measures reach from its edge. *Default:* `sizeSquares` (1 for almost
everyone, 2 for giants) with `pos` as the anchor square, and every containment
test inflated by the radius.

**G4. Occupancy.** Nothing forbids two tokens on one square, and every charge
ends on the target's square. *Default:* a deliberate move may not **end** on an
occupied square; the path may cross one; the preview says "stops short" rather
than silently nudging the token.

### Blocks 3e — the wire

**G5. What travels.** The intent carries `path`, and 512 sampled `Vec3` points
is ~30 KB of JSON per move — more than a patch, and pointless. *Default:* the
wire carries the **anchors** (`shape`, the clicked points, the apex); the host
resamples, and the host's samples are what the log records. `MapState` is sent
once with the snapshot and afterwards only as a deltas-by-`mapRev` patch, never
inside every positional patch — and with §15 the surface is not sent at all:
`{ seed, rulesVersion, biome }` rides with the map, and each client paints its
own pixels from it.

### Will bite on the first session

**G6. Touch gestures.** The player portal is a phone, and move / pan / spin are
all drags. *Default:* one finger moves the token, two fingers pan and pinch,
two-finger twist rotates. The camera never takes a one-finger drag.

**G7. Disengage ordering.** The check is a **Major before the Minor**, so the
flow is declare → roll → draw, not draw → toggle a box. `suppress` is set by the
roll, never by the path editor.

**G8. Undo of a committed move.** TABLE-SYNC promises undo, and one move
mutates position, both action counters, any `once` zone it spent, and the log —
and a fall makes it two displacements. *Default:* the log entry stores the
pre-move combatant snapshot and the zone ids spent, so undo is one restore.

**G9. Hidden enemies.** `hidden` exists, and drawing its band leaks the ambush
while suppressing its opportunity attack makes the ambush toothless. *Default:*
an unresolved hidden enemy draws no band and still fires; the log entry is
withheld from players until the enemy is revealed.

---

## 15. Rendering: a rule surface, not an image

A scene is not a picture. It is a small amount of authored geometry, a seed, and
a catalogue of rules that turn both into pixels **on the device doing the
looking**. Nothing is downloaded per scene and nothing about the picture is
stored. This supersedes "map images from `public/maps/`" (COMBAT-SYNC D3); an
image survives only as an authoring trace.

**V1. Three layers, three owners.**

| Layer | Truth | Travels | May differ per client |
|---|---|---|---|
| **Geometry** — floors, blocks, zones, props, grid | authored `Scene.map` | polygons and placements, a few KB | no |
| **Surface** — what those polygons look like | `seed` + `rulesVersion` + `biome` | the seed only | yes, harmlessly |
| **State** — fire, blood, spent runes, damage, corpses | `Encounter` | events, as today | no |

Geometry is the only layer that decides a rule. The surface may differ between
the GM's phone and a player's laptop without anything being wrong — that is what
being derived buys, and it is why the GM can restyle a fight without moving a
wall.

**V2. Never read the picture.** A wall is a `Block` polygon. The renderer asks
which cells a block covers and draws stone there; it never infers a block from
stone-coloured pixels. Collision, support and reach stay in §4–§7 and never
consult the renderer. This is the line between a procedural *look* and a
procedural *rules engine*, and crossing it is how tables end up arguing with a
texture.

**V3. The rules are data, and versioned.** Roughly:

```ts
type Material = {
  id: string;                     // 'stone.floor', 'wall.face', 'ice.sheet'
  ramp: RampId;                   // one of the six ramps, PIXEL-ART P2
  pattern: 'flat' | 'speckle' | 'brick' | 'plank' | 'crack' | 'rubble' | 'water';
  params?: Record<string, number>;          // brick rows, crack density, wave height
  edges?: 'none' | 'wang4' | 'wang8';       // edge tiles are generated, not drawn
  variants?: number;                        // per-cell hash picks one; P7 wants ≥32 on floors
  animate?: { frames: number; fps: number; kind: 'scroll' | 'shimmer' };
};

type SurfaceRules = {
  version: number;                // bump when a generator changes its output
  ramps: Record<RampId, Ramp>;    // the six shared ramps, PIXEL-ART P2
  biomes: Record<string, Partial<Record<RampId, Ramp>>>;   // biome → ramp override
  materials: Material[];
};
```

A new material is a dozen lines, not forty-seven drawings: the Wang set, the
variants and the animation frames all come from the same generators at load. A
new biome is a palette table. `rulesVersion` travels with the scene, so a client
on an older build falls back to flat colours rather than silently drawing a
different map.

Materials paint **cells**. Placed objects — table, bench, chest, rubble, brazier,
rug, stairs — are a second rule kind, `PropRule`, and they arrive as data in the
scene's placement graph. Both are specified in [PIXEL-ART-SPEC.md](PIXEL-ART-SPEC.md),
which is the measured reference: a 61-colour atlas where a floor is four colours
and a wall is five.

**V4. No per-tile state.** Variation comes from `hash(seed, x, y, salt)`, so a
cell's variant, cracks and debris are recomputed rather than stored. A scene's
entire visual state is `{ seed, rulesVersion, biome }` — three fields, not a
bitmap.

**V5. Generate once, composite per frame.** The atlas is built at load; the
static layers (floor, walls) composite into one offscreen canvas per map and
redraw only when the camera changes; only the dynamic layers draw per frame.
Generating tiles per frame would be a CPU fire and is not the design.

> **DECISION — V5a. Where the win actually is, and where it is not.** Be precise,
> because memory is the weakest of the benefits. A 26×19 scene at a 32 px cell
> is 832×608 = 506k pixels = **2.0 MB** of RGBA whether a human drew it or a rule
> did; rules do not make pixels free. The reference atlas is **38 KB** — a rule
> set that reproduces it would be *larger*, not smaller. What procedural
genuinely buys is (a) **variation**: the atlas has six floor variants and repeats
> every six cells, while a hash gives sixty-four and never repeats; (b)
> **state-driven repaint**: a burning floor, a sundered wall, snow accumulating,
> water rising — permutations that cannot be pre-drawn but can be re-derived; and
> (c) **biomes are palette tables**, so six dungeons cost six ramp sets instead of
> six hand-drawn atlases. Sell (a) and (b), not bytes.

**V6. The cell is 32 px; no other pixel number is fixed.** 32 is the reference
atlas's cell and stays the authoring unit. Everything else is derived: the
renderer works in cells, and the camera supplies `pxPerCell`, so the `z` offset,
shadow offsets and band thickness all scale off the live zoom instead of a
constant. Integer `pxPerCell` is crisp and free zoom is smooth; that is a
per-device camera choice (PIXEL-ART P1), not an art rule, and it must not be
baked into a material or a prop.

**V7. Tokens are parts plus rules, not a generator.** Terrain, props and effects
fully procedural; characters as a small authored parts kit (body, head, weapon,
cloak, palette) composed by rule. A rules engine that draws a convincing
Nordsman from nothing is a research project, and a 32 px token has about seven
pixels of face. Eight bodies × six weapons × eight palettes from ~30 small
sprites gives the same *feeling* of variety at a fraction of the risk.

**V8. Cohesion comes from a shared grammar, not from separation.** What makes a
procedural scene read as hand-authored is that every object is drawn by the same
five rules: a 1 px black outline, light from the top, a cap on every wall, a 2 px
shadow straight down, and three to five colours from one of six ramps. Those are
measured from the reference and recorded as P3 in
[PIXEL-ART-SPEC.md](PIXEL-ART-SPEC.md); anything a rule draws outside them reads
as a different game.

> **WITHDRAWN — luminance separation.** The earlier draft required any two
> materials that could share an edge to differ by two steps of luminance, and
> rejected a biome that failed. It is wrong for this app. The reference atlas's
> brightest *material* is L = 109/255 and its floor sits at L = 40; a
> separation rule would have rejected the exact look being aimed at. The view is
> also per-player, on the phone or laptop they brought — there is no table, no
> room, no bad light to design around. Identity and immersion win; separation is
> not a constraint.

**V9. Placement is authored; the renderer only paints.** The scene has already
decided where the pillars, debris, doorways and light sources are, by hand. The
rule engine reads a placement graph and draws it. It does not cluster props at
wall bases, does not scatter rubble near doorways, and does not choose where a
light pools. Composing at runtime would fight the map's author and produce the
texture-not-place failure the composition rules were meant to fix. Geometry and
placement are data; the surface is rules.

What a committed action then *looks like* — beat sheet, hit-stop, damage numbers,
turn wheel, pacing budget — is [PRESENTATION-SPEC.md](PRESENTATION-SPEC.md).

---

## 16. Props are solids, and the camera is a projection

**R1. A prop is a footprint plus a height, never a sprite.**

```ts
type PlacedProp = {
  at: [number, number];   // the footprint's north-west corner, in cells
  cellsX: number; cellsY: number;   // footprint, in cells
  height: number;                   // px the solid stands above the floor
  top: Mask;                        // the floor silhouette, in ramp indices
};
```

Rendering it is a projection, in this order:

1. **Rotate the footprint rectangle** with the camera transform — the same
   transform that moves the cells, the tokens and the point lights. Both corners
   are transformed and the result normalised, so the rectangle the camera sees
   is the rectangle the room contains.
2. **Rotate the floor silhouette** to match, on whole pixels (`rotMask`).
3. **Extrude** it: the top plane is the silhouette lifted by `height` — the same
   oblique projection the walls use — and the vertical face is hung under each
   column of the silhouette from that column's own near edge.

Step 3 is what makes a barrel round and a table have legs with the floor visible
between them: a solid's face follows its own outline instead of being a box that
happens to be roughly the right size. A face pixel is annotated `FACE.SOUTH` so
the light pass treats it as vertical — a height field alone cannot say that, and
without it the sun shades a wall of a barrel as if it were a slope.

**R2. Why this cannot drift.** The footprint is the *only* input to placement.
There is no sprite offset, no rotation about a hand-picked origin, and no
post-rotation nudges, so there is nothing that can be applied twice or applied
from the wrong pivot. `at` is authored on an eighth of a cell (4 px), and a
quarter turn followed by `× CELL` stays on whole pixels, which is why the four
views are pixel-exact rather than resampled.

This is not a claim to assume: `npm run test:props` projects every prop at all
four yaws, inverts both corners of the projected rectangle, and fails if the room
rectangle, its size, or its pixel alignment changes. If a turn can move an object,
that test says so.

> **Rejected — rotating a drawn sprite about its own anchor.** The obvious cheap
> version of camera rotation: keep the sprite, turn the mask, translate it so the
> old anchor lands on the new cell. It was implemented, and it was wrong. A bench
> two cells long became a *vertical* bench, the sprite's pivot did not agree with
> the cell grid, and the result looked like the furniture was being rearranged
> every quarter turn. The lesson is the one R2 encodes: a position has to be
> derived from a rectangle in room space, not adjusted after the fact.

**R3. Lamps are carried by the object that burns.** A point light is not an
authored coordinate — it is the projected footprint centre of the brazier that
emits it. Author the lamp separately and it can be painted where the bowl is not,
which is exactly what an offset glow looks like: a light with nothing under it.

**R4. Depth is a foot line, not a paint order.** Every pixel a wall or a prop
paints records the screen row its foot stands on. A sprite drawn later is tested
against that per pixel: behind it loses those pixels, in front of it wins. Props
are laid down by their footprint's south edge, and tokens are tested the same
way, so a character behind a table is hidden by the table rather than painted
through it. The renderer never needs a per-object z-buffer, and the order props
happen to appear in the scene file is not a visual decision.

**R5. The vertical face is authored brighter than the top.** A south-facing face
loses roughly 2.4 ramp steps under a high sun before any detail is legible. Face
tones are therefore authored about three steps above the top plane; authored at
the same value, every solid becomes a dark hole with a lit lid.

**R6. Nothing is drawn outside its own kind.** The move path is an annotation of
the *floor*, so it only writes to floor pixels: a route crossing a table does not
get painted over the table. Contact shadows only darken floor. Both are one line
of guard, and both were visible bugs before they were rules.

---

## 17. As built: the board is a 3D scene

§16 describes the 2.5D projection the board used to have. It is kept because the
failure it documents — a sprite rotated about its own anchor, drifting off its
footprint — is the reason the renderer was replaced. **§17 is what ships.**

**R1. The room is geometry, and the camera is a projection.** Walls, floors,
steps, rugs and props are triangles in cell space (`src/battlemap/gl/scene.ts`).
A prop is a volume, not a picture of one: a barrel is a twelve-sided prism with
iron hoops, a bench is a slab on two end panels, a shelf is a back, two sides and
four boards. An orthographic camera turns them, `depthOf` gives every vertex a
depth, and the raster writes the nearest surface per pixel. There is no paint
order, no front buffer and no per-face sprite offsets, so there is nothing to get
wrong when the camera moves: a prop cannot slide, and a wall cannot be painted
behind a token.

**R1a. The only card in the scene is a body.** Walls, props, coals and flames are
all triangles. Tokens are the deliberate exception: a character has an authored
facing and a four-facing sprite sheet, and a billboard is how four facings become
one draw. Nothing else may be one, because a card has a position but no body.

**R2. One camera, free orbit.** Yaw is continuous (0–360°), tilt 20–84°, zoom
1–4×, pan in screen pixels. Left-drag orbits; right-drag or shift-drag pans; the
wheel zooms. 1× fits the room from *every* angle: the fit is sampled over yaw and
tilt once per room and panel size, so turning or tilting the camera never
rescales the board under the hand. The canvas fills the panel and the board is
drawn inside it, which is why pan can be free without uncovering blank pixels.
Pan is unbounded; 1× recentres the board, and scrolling out once already at fit
recentres too, so a free pan can never lose the room permanently. Right-drag is
a camera gesture only — no tool ever fires on the right button. The wall
cut-away is recomputed from the yaw
(`buildWalls`), so the near walls become curbs as they come between the camera
and the floor — that is a rule about occlusion, not a fixed four-view set.
Textures are cached by seed, so an orbit rebuilds geometry only.

**R3. Light is per face, not per pixel, and the palette is the only output.**
Each triangle carries a normal; the sun term is `exposure + (ndl − flat) · relief`
with a lower relief on verticals, so a box turns three distinct faces without any
of them reaching step 0. A vertical face at 58° sun lands around step 5 and a
sun-facing one around step 7, against a floor at 8: dark enough to read the turn,
light enough to keep the texture. The brazier's contribution is capped at +3.4
steps, because uncapped it walks the stone ramp to cream and the pool reads as a
hole.

**R4. Shadows are a projected mask per receiving plane, softened before they
land.** A caster carries the plane its shadow lands on (`castTo`), so a ledge
throws onto the storey below it instead of onto its own top; a floor quad does
not cast, or every tile would shadow itself. Each caster is projected along the
sun onto that plane and unioned into **that plane's** quarter-resolution mask.
The masks are screen-space, so a single shared buffer lets a shadow cast on the
pit floor also darken a shelf three cells above it — the deck then reads as a
see-through hole. Receivers are therefore keyed by height: the ground, the
bridge deck and every storey top each have their own mask, and a pixel can only
read the mask of the plane it stands on. Each mask is blurred into a 0–255
penumbra before use; a binary mask has a four-pixel staircase for an edge, which
reads as a hole at 1:1, and the blur gives the dither somewhere to feather.
Shadow subtraction is 3.2 steps, so the darkest floor is still stone.

**R4a. Contact darkening belongs to a plane too.** The baked wash is built once
per receiving plane, and a solid darkens a surface only when its top rises above
that surface. That one test is what stops a storey shading itself: a deck's own
collider tops out at the deck, so it is not a caster for that plane — but the
wall behind it, a crate standing on it, or a gallery overhead still is. A single
flat wash made every raised deck three steps darker than the floor it stood over,
which is the other half of the "transparent platform" read. All the planes are
filled in one walk of the colliders, so a five-storey room's rebuild stays near
the cost of a one-storey room's.

**R5. Firelight is a globe, not a pool on the floor plane.** A point light is
smaller than a cell, so corner-interpolated light averages it away; after the
solids, each lamp walks its own screen disc, recovers the world point of a pixel
from *that pixel's* depth, and shades it by the real 3D distance. A flagstone
keeps the oak tint it has always had, because firelight on stone is amber and the
dithered rim is what makes it read as light instead of as a hole; every other
surface is lifted inside its **own** ramp (the raster keeps material and step per
pixel), so a wall warms without turning into wood. That is what lets a brazier
light the wall it stands against, and a wall torch light the stone under it. A
lamp with no flicker still contributes this rim lift, but paints no amber pool —
that one is a shaft, not a fire. ~0.7 ms for three braziers.

**R6. Ink is a depth cliff, with a threshold that knows the difference between a
cliff and a slope.** The silhouette pass inks a pixel when its neighbour is more
than 0.28 deeper. At 0.055 a wall face's own perspective gradient inked whole
triangles black — the exact bug that made every box read as a hole. The threshold
is above any legitimate surface gradient in this scene and below a real wall edge.

**R7. Fire is geometry, not a sprite** (`src/battlemap/gl/flame.ts`). A painted
flame has a position but no body: from a low camera it thins to a line, and from
a high one it lies on the floor it is meant to burn above. Each brazier instead
gets a coal bed, three coals and a **composed** set of licks — core, main, two
sides, a back, three crowns and a low skirt — plus four rising embers. The
profile is authored, not hashed; the seed only jitters it and spins it per
brazier, so a fire has a silhouette instead of five random cones. The crowns and
skirt project past the bowl, which is what makes a top-down camera see fire
instead of a glowing disc. Every tongue is double-sided, because an open tube
seen from a high camera is a hole through the fire to the coals. Triangles like
every other prop, built for the current instant so they can flicker, and
depth-tested like anything else. Their vertices are **emissive**: a flame does
not take the sun, so it stays lit at midnight and does not take a bright step at
noon. The ink sweep runs before them on purpose — it reads depth only, and would
otherwise ink the seam between two overlapping tongues, which on a two-pixel
tongue is the whole tongue. ~0.9 ms for three braziers.

**R8. A contact shadow is a floor decal, not a screen sticker.** A sprite ellipse
is a circle pasted on the picture; at 84° it lies on a floor that has become a
sliver. Each token's shadow is walked in the floor plane the same way the fire
pool is, so the camera foreshortens it like the flagstones, and a crate standing
on it keeps its own pixels. Flagstones only: a rug is cloth under the feet, and a
stone shadow on cloth turns the weave into a hole.

**R9. A room is a stack of storeys, and a storey is a volume.** `Room.tiers` is a
list of `{ y, rects, deck }`. Every cell a tier covers gets a walking surface at
`y`, a collider whose top is `y`, and a cliff face wherever the cell beside it is
lower — and the face starts at the highest thing already under it, so a ledge
closes onto the floor or onto the storey below and nothing is a floating slab.
Tiers are built low to high, which is why a gallery over the pit and a mesa on a
shelf are the same code path. Stairs are a run of colliders, one per step, so
`surfaceAt` climbs them without knowing what a stair is; a prop is built from its
own deck up and lifted as one unit — vertices, collider, flame and lamp together.

Two bugs are worth recording, because both looked like renderer faults. A
prop's triangles share their corner arrays, so lifting a vertex per triangle
lifted it two or three times and a chest on a ledge became a fan; the lift now
walks a set of unique vertices. And rock must be cut as a **half-plane**: a
per-cell test of "which side of the chamber is this wall on" leaves single-cell
fins standing along the cut wherever two neighbours disagree.

**R10. A cavern is a chamber carved out of a mass.** `src/battlemap/cave.ts` is
four storeys — pit, shelf, gallery, high ledge — inside a block of rock that runs
to the grid edge, so the block's silhouette is straight. Everything on the
camera's side of the room is removed rather than lowered to a curb: a cave is
sliced open for the table, and what is left behind the cut is the chamber wall's
inner face. A one-cell shell reads as a ring of fins, so the mass is solid.

**Still being perfected.** The wall coping texture reads busier at 1:1 than the
flagstones. The cavern is a first pass: the model is right and the ledges are
real, but they are still rectangles and every wall cell draws its own face, so
the result reads as terraced rock rather than as a cave. Tokens remain flat
billboards by design (R1a): the character creator's spec is the source for their
four facings. Character faces are the other open item — see PIXEL-ART-SPEC §3.

**Budget.** 3.5k triangles for the tavern, 1082×880 at 32 px/cell, 41.6 ms a
frame; 5.7k triangles for the cavern, 1611×1433, 62–80 ms. Section costs are
recorded in `renderStats` and dumped by `scripts/dump-3d.ts`, which writes a 1:1
PNG and a steady-state frame time so tuning does not rely on a browser
screenshot. The next scaling step is not more geometry: it is rendering at a
lower pixel scale and upscaling inside the palette, which costs a fraction of a
frame and loses none of the art.

## 18. A room is a document

§17 made the room geometry. This makes it **data** — the difference between a
board that can only be whatever the code says today and one that can be saved,
shared, reopened, or eventually cut from an SVC.

**D1. The unit is `RoomDoc`.** `format`, `version`, `id`, `name`, `terrain`,
`seed`, `props`, `tokens`, `path`, `rig`, optional `tiers`, `wallHeight`, and an
optional `view` (the camera to open at — a hint, not part of the room). Anything
`Board3D` can draw is expressible in it.

**D2. Terrain is run-length rows.** One string per row, north to south:
`"2*4,1*20,2*4"` is four solid cells, twenty floor, four solid. The width is
implied by row 0, so a document cannot disagree with itself about how wide the
room is, and a ragged grid is a parse error rather than a half-drawn map. A
tavern is 5.4 kb; a four-storey cavern is 6.7 kb.

**D3. One way in.** `parseRoomDoc` is the only decoder, and every source —
shipped JSON, localStorage, an import — goes through it. It rejects what cannot
be drawn (a ragged row, a foreign format, a newer version, more than 160 cells a
side) and repairs what can (a prop with no id, duplicate ids, an unknown race, a
storey poking outside the grid), reporting every repair. It never throws and
never returns half a room.

**D4. Enum repair is not cosmetic.** A token's `race` indexes `RACE_SHAPE`; an
unknown string there is `undefined`, and reading a field of `undefined` takes the
token renderer down. So the enums in `characters/spec.ts` have runtime arrays and
the parser validates against those instead of trusting the file.

**D5. Output is canonical.** Props and specs are rebuilt field by field in a
fixed order, numbers quantised to three decimals, and `docToJson` is two-space
JSON with a trailing newline. Parse a file and write it back and the bytes are
identical, so a save is a fixed point and a diff means someone changed the room.
`test:rooms` asserts this, and asserts the shipped JSON still equals what its
builder produces — a stale export cannot pass.

**D6. Builders author; documents ship.** `makeDemoRoom()` and `makeCaveRoom()`
are recipes run by `npm run rooms:export`; the app loads `rooms/*.json`. Edit a
builder and re-export, or the drift check fails.

**D7. Ids are part of the schema.** Every prop and token carries one, because a
save, an editor and a sync message all have to point at a specific object. A prop
without one is given `p<n>` on the way in.

**D8. Saves are local; export is the wire.** Saves live in this browser under
`skyrim-codex.room.v1.<id>` as `{ doc, savedAt }`. The board can save, duplicate,
delete, export and import. Export is the same `RoomDoc` the shipped rooms use, so
a room that leaves one browser opens in another with no conversion.

**D9. Ground is a layer, not terrain.** `ground` is one run-length row per
terrain row, values indexing `GROUND_KINDS` (stone, grass, dirt, water, wood). It
is optional; absent means stone, so every room written before the village still
loads. Water is drawn a few centimetres below the bank and remains walkable: a
ford, not a wall.

**D10. A door is a cell plus an optional link.** `doors` is a list of
`{ id, at, state?, label?, to?: { room, door } }`. A door may stand on a floor
cell or on a wall cell; a wall cell with a door is skipped by the wall builder
and the frame fills the opening. The room document never resolves a link: the
room graph does, because a room cannot know which library it is in.

**D11. A token may be a reference.** `ref` is a character-sheet id. When the
board loads a room, a linked token's `spec` is rebuilt from the live sheet
(`characters/live.ts`) — race, build, weapon and armour follow the character.
The embedded spec remains the fallback for a sheet that is not in this browser.

## 19. A village, a graph, and a table

**V1. Three rooms, one place.** Ivarstead is `ivarstead.json` (34 × 44 cells,
grass and dirt over a river), `vilemyr-inn.json` and `trader-hall.json`. The two
interiors are reached through doors and back again. All three are ordinary
`RoomDoc`s: nothing about them is a special case in the renderer.

**V2. The river is ground, the bridge is a storey.** The Treva is water-ground on
walkable cells. The bridge is a wood-decked tier at 0.45 cells over the river,
with a stair at each bank, so the bridge has a volume and tokens stand on its
deck rather than on a decal.

**V3. Houses are volumes; the door is the target.** A `house` prop is a stone
plinth, limewashed walls, a pitched thatch or shingle roof, gable ends, a plank
door and lit windows. It is solid. Entering is a transition, not a wall-hack, and
the doorway frame is the affordance.

**V4. Doors are loading screens.** Clicking a linked door (or its row in the
Doors panel) persists the current room's rig, token positions and seen mask,
loads the target room, and places the party one cell inside the destination
door. Locked doors say so and do nothing.

**V5. The session is a separate layer.** `play.ts` stores, per room id in this
browser: the rig (including placed torches), token positions, and a base64 seen
mask. The document is the map; this is the game on top of it. Nothing here is
ever written into the shipped JSON.

**V6. Fog is 2D line of sight.** Each party token casts rays at quarter-cell
steps out to `FOG_RADIUS_CELLS`; walls block and are themselves marked seen when
they block. Seen cells stay seen. The renderer turns a floor pixel's cell into
black (unseen) or a two-step ink dither (seen, not currently visible). The GM can
turn fog off, reveal everything, or forget a room.

**V7. The editor is a draft.** Build tools paint floor finish, carve floor and
wall, place/erase props and place doors; the map is cloned into a draft and only
Save calls `toDoc`. Revert gives the library's room back untouched.

**V8. A save shadows a built-in of the same id.** Door links name room ids, so
one id must resolve to one room. Saving Ivarstead writes `skyrim-codex.room.v1.ivarstead`;
the library drops the shipped document of that id and shows the save. Delete the
save and the shipped room returns. Saving a built-in no longer forks it under a
new id, because a fork would break every door that points at it.

**V9. Every environment is one click away.** A strip above the canvas lists
every room in the library — the five shipped documents and any save in this
browser — with the current one lit. Clicking another persists the room you are
leaving (rig, token positions, seen mask) and loads the next, exactly as a door
does. The last room visited is remembered under `skyrim-codex.room.last`, so a
reload returns to the environment you were in rather than to the first entry in
the list; a remembered id that is no longer in the library (a deleted save)
falls back to the first room. The strip is the only switcher — the room panel's
dropdown was removed rather than left as a second control that could disagree.

**Open.** No multi-storey village yet (the bridge is the only tier), and no
token dragging. Fog is a floor-plane mask: a prop standing over a seen cell is
not separately occluded. The editor does not yet author `tiers`, `rig` points or
token links in-world — those still come from JSON or the roster.
