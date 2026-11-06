# Presentation — how a beat plays

**Authority:** this doc owns what a committed action *looks like* between commit
and settle — timing, camera, impact, HUD. Rules are
[BATTLEMAP-SPEC.md](BATTLEMAP-SPEC.md); how a thing is drawn is
[PIXEL-ART-SPEC.md](PIXEL-ART-SPEC.md). Nothing here changes a rule.

The bar is a tactics JRPG — Final Fantasy Tactics, Tactics Ogre, Triangle
Strategy. Worth being precise about what produces that feeling, because it is
**not** asset quality. Those games are low-resolution and small-palette. What they
have is choreography: they take the action away from you and play it.

## 1. Rules

**X1. The board is a software framebuffer, and the HUD is React.** Not "one big
canvas with draw calls" — a single `Uint32Array` holding packed RGBA, written
pixel by pixel, blitted once per frame. This is the technique the reference
diorama uses and it is the only way the art rules in PIXEL-ART can be enforced:
if the renderer is `ctx.fillRect`, the 1 px outline and the Bayer dither are not
renderable.

- **Buffers** = `cols × pxPerCell` by `rows × pxPerCell`, and there are four of
  them: `albedo`, `normal`, `spec` and `tag` (PIXEL-ART P11). A 26×19 board at
  32 px is 832×608 = 506k pixels, about 5 MB for all four. A whole-frame copy is
  2 MB; at 60 fps that is 120 MB/s of `memcpy`, which is nothing.
- **Build once**, at load or when `pxPerCell` / `quarterTurns` changes: floors,
  walls, props and decals into all four buffers, then the **static light rig**
  into `baseLit` (P14). Never per frame, never per mouse-move.
- **Per frame**: `fb.set(baseLit)` — one copy — then only the *moving* lights
  re-shade their own bounding boxes, then the dynamic passes in a fixed
  back-to-front order (zones, tokens, path, numbers, effects, weather). Pass
  order is data, so two clients cannot layer the same frame differently.
- **Present**: `putImageData` into a buffer-sized canvas, then `drawImage` onto
the display canvas at an **integer** scale with `imageSmoothingEnabled = false`.
Zoom picks the scale, so pixels stay square and never shimmer.
- **HUD stays React**: turn wheel, action bar, dialog box, log. Text, buttons and
  focus states are what DOM is for, and they must not be drawn into the buffer.

No new dependencies. `tailwindcss-animate` is already installed for HUD motion;
the board needs a hand-rolled clock of roughly 200 lines and nothing else.

**X2. Commit, then watch.** The defining difference between a VTT and a tactics
game: the game *takes the action away from you* and plays it out. The board locks
during a beat; input is queued, never applied mid-beat. Today the app mutates
state instantly and the whole feeling is lost in that instant. BATTLEMAP M10–M11
already put the commit and the preview through one resolver — the beat is simply
what happens after the commit lands.

**X3. Every action is a beat sheet.** Fixed phase names and default durations in
one table, not scattered constants:

| Beat | Phases (default ms) |
|---|---|
| move | `windup 80 → travel (cells ÷ 6 per s) → settle 60` |
| attack | `windup 140 → travel 120 → impact 90 → settle 160` |
| cast | `windup 220 → travel 160 → impact 140 → settle 200` |
| forced | `travel 140 → impact 90 → settle 120` (no windup — it wasn't its choice) |
| death | `impact 90 → collapse 400 → dwell` |

`impact` is a **hit-stop**: the board freezes 2–4 frames at contact. It is the
single cheapest thing that makes a hit feel heavy, and its absence is most of why
web combat feels weightless.

**X4. Impact grammar, in one order.** White flash 2 frames (tint the token, not
its alpha) → hit-stop → damage number → knockback → shake. Damage numbers rise
8 px over 420 ms in the pixel-font treatment: 1 px black outline, 1 px white inner
outline, no anti-aliasing. **Never all of them at once.** A normal hit is flash +
stop + number. A crit adds knockback and a 2–3 px shake for 120 ms. A miss is a
grey `MISS` and nothing else — no flash, no stop.

**X5. Camera direction, without syncing a camera.** BATTLEMAP M13 keeps the camera
local, so "punch in on the hit" cannot be shared state — and it does not need to
be. **The beat is a pure function of the committed event**, so every device
computes the same shots from the same input. Camera *positions* differ between the
GM and a phone; camera *timing* is identical. Four shots:

- `hold` — no movement, when the action is already on screen. The default.
- `follow` — track a travelling token, releasing at the destination.
- `punch` — zoom +0.2 toward the target over 120 ms, hold 300, release over 200.
- `reveal` — pan to something newly spawned.

The director picks `punch` only for damage to a PC or from a boss. The GM can
authorise a shot by authorising the beat; the GM still cannot move another
player's camera, and nothing here reintroduces synced view state.

**X6. Pacing budget — the one place copying a JRPG exactly would hurt.** FFT is
single-player and can spend four seconds on one attack. Five players cannot: the
fifth has nothing to do and stops watching. So **600 ms is the budget for a normal
beat and 1400 ms for a cinematic one**, with `scene.pacing: 'brisk' | 'cinematic'`
chosen by the GM. A beat that would exceed its budget is shortened or skipped,
never queued. A full round of five players stays under ~20 s of animation.

**X7. The turn wheel.** The most recognisable element in the genre, and it is pure
UI: the acting unit large, the next six as small portraits, `done` slots dimmed,
a tick as it advances. `order: TurnSlot[]` already carries the data. It renders
from `order` on every client — never from local state, so two players cannot
disagree about who is next.

**X8. Tile language, four states, fixed treatments.** There is no movement budget
and no pathfinding (BATTLEMAP §13), so there is no range tint to draw — the whole
map is reachable and shading it would shade everything. What the board draws
instead:

- **Path** — the route itself: a dotted chain with one arrowhead per cell and the
  final cell lifted. The path *is* the movement UI.
- **Band** — an enemy's reach volume in red, the M4a geometry hovering at that
  enemy's own `z`. Red means "ending here hands them a free attack", never
  "dangerous" in general.
- **Zone** — hazard and trigger in amber, water in blue, light in warm white, all
  from `Zone.kind`.
- **Target** — the destination cell: 1 px white outline, lifted 1 px, shadow
  2 px. The lift is what makes a tile feel pressable; a flat outline does not.

These four never change colour to mean something else.

**X9. Facing and idle.** Every token carries a facing, derived from its last move
or its attack target, and turns before it strikes. Idle is a 1 px bob at ~0.8 Hz
on two frames, phase-offset by `hash(id)` so a room of enemies does not pulse in
unison. Attacking leans 2 px toward the target. This is the cheapest life the
board can have and its absence reads as a spreadsheet.

**X10. Portraits are the one thing that cannot be generated.** The turn wheel and
the dialog box need 64×64 headshots. A 32 px token has about seven pixels of face;
a headshot is authored art — one per PC and **one per enemy type, not per enemy**.
This is the only genuine art dependency in the whole design and should be scoped
as such.

They are also the last thing built. Portraits are judged against the finished
palette and light, so they land with the cast at PIXEL-ART E5 — after the
environment has two moods to be judged against. Until then the wheel runs on
initials or silhouettes, which is enough to test its layout and ordering.

**X11. Death persists.** A killed token desaturates over 400 ms, collapses (fade
its top 8 px), and stays on the board beneath the living. Corpses are the fight's
narrative and they cost nothing: a modifier on the token rule (PIXEL-ART P8), not
a new asset.

**X12. Sound is half the feel.** Seven samples — cursor blip, confirm, hit, crit,
miss, death, turn start. The genre's entire UI is carried by them and this is the
highest payoff per byte on the list. Mute is per viewer, like the camera.

**X13. Undo versus playback.** A played beat cannot be un-played. Undo is allowed
until the next beat begins, and it restores the snapshot as a **cut**, not a
rewind — no reverse animation. Once the next beat starts, the action is history.
This keeps BATTLEMAP G8's "one restore" honest instead of turning the log into a
timeline.

## 2. Acceptance

A 30-second vertical slice: one token walks a path, one attacks, one dies, the
turn wheel advances. If that does not feel like a tactics game, nothing built
after it will, and every later feature inherits the problem.

## 3. References

Four sources were checked. Three hold up as described; the fourth is thin, and it
is the one that matters most, so the gap is stated rather than papered over.

- **PixelLoop** (`pixelloop-diorama.vercel.app`, "pure TypeScript, no engine"): a
  640×360 `Uint32Array` framebuffer, named palette ramps, a stateless integer
  hash, fbm noise, a precomputed 4×4 Bayer map, a tiny painter (`px`, `blend`,
  dithered `dblend`, `vgrad`, scanline `poly`, ASCII `sprite`), a static build into
  `base` + depth + surface tags, and a render that is `base.copy()` plus a fixed
  pass list. That is the architecture X1 adopts.
- **Pixel Art Lighter** (@moonfell_rpg): a tool that takes an albedo sprite and
  produces **normal maps and luminance masks** "designed to maintain the pixel art
  cleanly", with a lit preview. The author's stated reasons are the useful part:
  engine 2D lights are badly fitted to top-down games, so the light is computed
  from custom maps instead; and the luminance mask acts as a specular map. That is
  PIXEL-ART P11–P13. **The tweet and its replies describe the concept and show the
  result, not the algorithm** — the four buffers, the 1-px Sobel kernel, the
  integer height quantization and the ramp lookup are a reconstruction of how you
  get that output. The open-source repo was not linked from the post; if it turns
  up, the kernel is worth reading before we build it.
- **Zero-engine isometric world** (@zer0point_eth): zero asset files, procedural
  day/night lighting, weather, and a dynamic lighthouse beam. Taken as evidence
  that the light rig should be *animated scene data* (P15), not a baked filter.
- **Wang tiles** (@asynkimo, and the reply to it): Wang is for **edges**, and a
  finite tile set cannot hide interior repetition — the eye finds the period. What
  scales is one tile plus per-cell offset and flips. Refines PIXEL-ART P4 and P7.

What does **not** transfer: the diorama is a film — one fixed camera, no grid, no
interaction, 170 KB of hand-placed content. We take the rasteriser and the light,
not the scene.

## 4. State of the code

Nothing here is built. `package.json` has no renderer and no animation library,
there is no board component, and `Encounter` has no movement — only the 2D `pos`
that BATTLEMAP already flags as stale. Which means this spec is being written
before the first line, which is the cheapest possible time to write it.
