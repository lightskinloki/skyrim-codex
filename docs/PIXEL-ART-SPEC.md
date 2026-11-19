# Pixel art — rules, not assets

**Authority:** this doc owns *how a placed thing is drawn*. Placement belongs
to the scene, which has already decided where the pillar is. Geometry and the
movement model are [BATTLEMAP-SPEC.md](BATTLEMAP-SPEC.md); the wire format is
[COMBAT-SYNC-SPEC.md](COMBAT-SYNC-SPEC.md).

The reference is the *Dungeon Crawler* pack at
`C:\Users\fbrown\Downloads\Dungeon Crawler Assets` — a 512×512 atlas, 32 px
cells, 16×16 slots, 21 files, 38 KB total. It is a visual reference, **not a
dependency**, and it is not vendored into the repo. It is also **not** an autotile
set. It is a library of *objects* (a rug is one sprite, a 3-cell table is one
sprite, a door is 32×34) packed on a grid for shipping. That distinction decides
the whole design: the thing to reproduce is a **library of parametric object
rules**, not a tile generator.

## 1. What the reference actually is, measured

| Property | Value |
|---|---|
| Distinct visible colours | **61**, for the entire dungeon |
| Built palette (as implemented) | **80**: six 13-step ramps + ink + void |
| Most common colour | `#2c2630` — 14% of every visible pixel |
| Top four colours | 39% of the sheet |
| Outline | `#000000`, 1 px, outside the silhouette, on **every** object |
| Brightest *material* | `#666c87`, L = 109/255 |
| Brightest anything | `#ffffff`, 135 px — the candle flame only |
| A floor tile | **4 colours**: `#2c2630 #242028 #1d1b1e #151016` |
| A wall cap tile | **5 colours**: `#3a3544 #4f4d60 #2c2630 #000000 #1d1b1e` |
| Prop sizes | 32×24 (chest), 32×32 (bench), 32×34 (door), 64×24 (wide chest) |

Two facts follow, and both matter more than the byte count:

1. **This art is already almost a rule set.** Four colours on a floor, five on a
   wall, one outline colour, one light direction. Reproducing it procedurally is
   not an approximation of hand-drawn work — it is a transcription.
2. **The sheet is dark by design.** Nothing but a flame exceeds L = 138. There is
   no "high contrast so it reads across the room" mode in this art, and imposing
   one would have thrown the look away. (This replaces the withdrawn V8: a
   luminance-separation rule would have rejected the reference pack outright.)

## 2. The rules

**P1. The cell is 32 px, and it is the only fixed number.** There is no
pixels-per-foot constant and no required zoom. The renderer draws in **cells**;
the camera owns the transform, so `pxPerCell` is derived from the current zoom,
and every derived quantity — the `z` offset, shadows, reach-band thickness —
scales off that value rather than a constant. Crisp pixels want an integer
`pxPerCell`; free zoom wants continuous. That is a per-device camera setting, not
an authoring rule, and it does not get baked into the art.

**P2. Six ramps carry the entire look.** Measured off the reference, dark → light:

| Ramp | Reference steps |
|---|---|
| **Cold stone** (floors, walls, stairs, most furniture) | `#151016` `#191619` `#1d1b1e` `#242028` `#2c2630` `#3a3544` `#4f4d60` `#666c87` `#8985bf` |
| **Wood** (floors, walls, tables, benches, chests) | `#23150a` `#261b15` `#4c2f1e` `#593625` `#7a5c49` |
| **Wool red** (rugs, beds, banners) | `#260000` `#300000` `#380505` `#6b0000` `#870000` |
| **Navy** (beds, cloth, arcane) | `#110921` `#0d1433` `#06233f` `#0b3d66` `#0d5087` |
| **Emissive** (flame, lamp, rune) | `#84741a` `#ff680a` `#e57614` `#fff200` `#ffffff` |
| **Marker** (status pips, not terrain) | `#016d00` `#527f0f` `#03d100` `#82f94a`, plus `#cc0000` / `#0d5087` |

**P2a. The built ramps are longer, and their hue drifts.** The reference is a
five-to-nine-step palette measured under one light. A board that has to survive
dawn and midnight needs room above and below the authored value, so each ramp is
**13 steps** and each step warms as it rises: shadow falls toward violet, light
toward sand. That hue drift is what makes a lit wall read as lit rather than as a
lighter swatch, and it is why one ramp carries the whole day/night cycle without
a second palette. See `src/battlemap/palette.ts` for the table.

A material names a ramp and an index into it. Nothing invents a colour outside
these six; a biome that needs a new hue gets a new *ramp*, not a new material.

**P3. Five drawing rules, and they are the whole style.**

1. **Black outline, 1 px**, outside the silhouette. Not dark-grey, not shaded.
2. **Light from the top.** Every up-facing edge gets 1 px of the ramp's
   second-brightest step.
3. **Cap on every wall.** The north edge of a wall is `#4f4d60`→`#666c87`; the
   wall body is one step down (`#3a3544`); it sits on floor `#2c2630`.
4. **Shadow straight down, 2 px**, same silhouette, no blur, no horizontal
   offset. It is a shape, not a blur.
5. **3–5 colours per object.** If a rule needs a sixth, the ramp is wrong.

**P4. Floors are four colours and a mask.** Base `#2c2630`, shade `#242028`,
groove `#1d1b1e`, deepest `#151016` — and that is the entire floor tile. So a
floor rule is `ramp[4]` + `seam` (a 1 px groove on the cell boundary) + `grain`
(a hash-scattered 1-px speckle at 2–4% density) + `edge` (a 2-px darker strip
where it meets a wall). No noise texture, no blending.

`edge` is the **only** place autotiling belongs. Wang sets exist to solve which
material wins at a boundary — wall base, floor lip, water's edge — and they are
not a repetition fix for open ground (P7).

**P5. Props are parametric objects, not stamped sprites.** The pack ships a 2-cell
table and a 3-cell table because someone drew both. A rule takes the length:

```ts
type PropRule =
  | { kind: 'table';    w: number; ramp: Ramp; legs?: 2 | 4 }
  | { kind: 'bench';    w: number; ramp: Ramp }
  | { kind: 'chest';    w: 1 | 2; bands: 0 | 1 | 2; metal: Ramp }
  | { kind: 'bed';      w: number; ramp: Ramp; made: boolean }
  | { kind: 'shelf';    h: number; ramp: Ramp; fill: number }
  | { kind: 'rubble';   size: number; ramp: Ramp }          // the pack ships 12 graduations
  | { kind: 'stairs';   run: number; width: number; ramp: Ramp }
  | { kind: 'brazier';  lit: boolean }
  | { kind: 'rug';      w: number; h: number; ramp: Ramp };
```

`w` in cells, `h` in cells, and the sprite **may exceed its cell**: doors are
32×34, chests 32×24. The anchor is the cell, not the sprite box, so the renderer
must not clip to the cell.

**P6. Placement is data. The renderer never composes.** The scene has already put
the pillars, the light sources, the debris and the doorways where they belong,
and it did that by hand. The rule engine reads a placement graph and paints it.
It does not decide that a room needs a prop cluster at the wall base, does not
scatter rubble near a doorway, and does not choose where a light pools — those
are authored, and re-deciding them at runtime would fight the map's author. The
procedural layer exists to **paint placed things**, and to repaint them when the
state changes.

**P6a. Coarse placement in, deterministic refinement out.** The scene supplies
placement at *authoring* precision — a prop anchored to a room region or a rough
point in the vector layout, not to an exact cell. A build step resolves it: snap to
the nearest legal cell, face away from the nearest wall, cluster around the
authored anchors, fill gaps at the authored density. Everything hashed from the
scene seed, so every client resolves the same room and a reconnect shows the same
furniture.

This is what makes P6 practical. The *decision* stays authored — a human said
"rubble here, a table against this wall" — and the rule only settles the sub-cell
arithmetic. Refinement is a pure function of the scene, run at build, never a
runtime negotiation.

**P7. Variation is offset and flip, not a bigger variant set.** The pack has 6
floor variants, so a 30×30 room repeats every 6 cells and reads as wallpaper. The
obvious fix — generate 64 variants — is the weak one, because a finite set still
has a period and the eye finds it. What actually scales costs nothing:

- **offset** — sample a 32×32 floor source at a `hash(seed, x, y)` origin, so no
  two cells show the same crop;
- **flip** — 4 orientations (H, V, both) from the same hash;
- **decals** — a sparse independent layer (crack, stain, pebble, seam) at 8–12%
  density, hashed separately, drawn over the floor.

Variants survive only for authored features. And keep the honest accounting: **the
gain over a PNG is variation and state-driven repaint, not bytes.** The reference
pack is 38 KB; a rule set that reproduces it is not smaller. It is *unbounded*.

**P8. Dynamic is a modifier on the same rule, never new art.** The "dynamic
elements" are state changes, and each one is a hook on a rule that already exists:

| State | How it renders |
|---|---|
| brazier `lit` | swap the emissive ramp in, add a 1-frame flame flicker at 6 fps, cast a light pool |
| chest `open` | lid rotates 1 px, interior goes `#151016`, contents sprite on top |
| zone `triggered` | scorch: swap the floor ramp for `#1d1b1e`/`#151016` + ash speckle |
| bloodied | 2–3 px of `#380505`/`#6b0000` clustered at the attacker's side |
| wet / snow | grain density up, ramp shifted one step toward `#666c87` / `#8985bf` |
| rubble | `rubble.size` grows; the wall's cap step is removed where it broke |

Light pools are the cheapest vivid win here and cost no art at all: every
`emissive` prop emits its own distance-falloff pool into the composite pass, so
the same corridor is a different place lit and unlit.

**P9. A biome is a ramp table.** Six ramps become a Falkreath cellar, a
Winterhold ice hall, a Dwemer bronze vault and a Falmer nest by swapping four
rows. The object grammar, the outline, the light and the shadow offset never
change — which is exactly why the six biomes still look like one game.

**P10. Tokens stay authored — as parts.** Every pixel of a character is authored,
but characters themselves are assembled (§3). At a 32 px cell there are about
seven pixels of face, and a generator that draws a convincing Nordsman from
nothing is a research project, not a feature. The turn wheel and dialog box need
**64×64 portraits** on top of that, one per character and per enemy *type* — the
only genuine art dependency in the design (PRESENTATION X10).

**P11. Every rule writes four buffers, not one.** Colour alone is a flat picture;
relief is what takes light. While drawing, each pixel also writes:

- `height` — int8 relief in art pixels: `0` flat, `-1` groove, `+1` lip. The seam
  between two floor tiles is exactly `-1`.
- `spec` — a 0–255 luminance mask: metal and water high, flame max, stone low.
  This is what a normal-map tool calls the luminance mask, and it behaves as a
  specular map.
- `tag` — surface id (floor, wall, prop, void), so a light knows what it may
  touch.

All four come from the same rule that drew the pixel, so none of them is extra
authoring. At 832×608 that is 2 MB albedo + 2 MB normal + 0.5 MB spec + 0.5 MB
tag ≈ 5 MB.

**P12. Normals come from the height buffer, with a pixel-art kernel.** Sobel over
3×3, but the style lives in the kernel, not the maths: **a 1 px groove must produce
1 px of normal change**, not a gradient smear. That is precisely why a normal-map
tool exists for pixel art — a normal map derived naively from brightness looks
stamped on, and a sprite lit by one looks like a photograph with a filter on it.
So: integer-quantized heights, a Sobel divisor of the cell size in art pixels, and
no smoothing pass.

A consequence worth noticing — the wall cap (P3 rule 3) is a 1 px lip, so its
normal points up. A low sun rakes it and a midnight ambient darkens it with no
extra work at all.

**P13. Light is a ramp lookup with dithered edges.** Per light: `d = max(0, N·L)`,
falloff over distance, then pick the ramp index by `d` — a lookup into the steps
the material already has. Two things follow, and both were measured in the
build rather than assumed:

- **The dither is confined to a quarter step.** A 4×4 Bayer threshold applied
  across the whole range turns every mid-tone into a 1 px chequer, and a chequer
  at 32 px per cell reads as woven cloth, not stone. Comparing against
  `0.375 + bayer × 0.25` instead leaves flat fields everywhere and a 1–2 px
  dithered seam exactly at a band edge. Measured: mean neighbour difference on
  the floor fell 18.9 → 12.1 / 255.
- **Specular rides inside the light value**, not as a second threshold:
  `f += spec × 0.0032 × max(0, f − 2)`. One comparison per pixel instead of two,
  and the glint dithers with everything else instead of stamping a lone step.

**P13a. Two caches make it run.** The sun term (`exposure + (N·L − sin el) ×
relief`) depends only on the normals and the rig, so it is rebuilt when a slider
moves and never per frame. Point lights are sampled once per 4×4 px block into a
coarse field, because light is smooth and a 4 px sample is invisible at our tile
size. Without either, four braziers cost 66 ms a frame at 896×576; the pixel loop
is what is left.

Cast shadows stay exactly P3 rule 4 — hard, unblurred, 2 px. Dither is for light
falloff and for overlays (fog, rain, snow), never for contact shadow, which turns
to mud.

**P14. Bake the static rig; re-shade only what moves.** Two built buffers:
`base` (unlit, exactly as the colour rules drew it) and `baseLit` (after the
scene's fixed lighting — sun and static braziers). A frame starts as a copy of
`baseLit`, and a *moving* light recomputes only the pixels inside its bounding
box, reading `base` and re-lighting. A torch costs its pool area, not the board.

**P15. The light rig is scene data.**
`{ sun: { azimuth, colour, intensity }, ambient: RampId, points: PointLight[] }`
with `PointLight = { cell, z, radius, colour, intensity, flicker }`. A hall at
dawn and at midnight is the same geometry and the same seed with a different
azimuth and ambient ramp — that is the day/night cycle, and it needs no art. A
flicker is `intensity × fbm1(t, id)`. Emissive props (P8) are simply the point
lights attached to a sprite.

## 3. Characters: one spec, two renders

Two licensed packs close the character gap (§4 item 1), and measured together
they show the shape the creator has to take:

| Source | Cell | Figure | Colours |
|---|---|---|---|
| Dialogue avatars — 4 NPCs × 6 expressions (Aggression, Calm, Sadness, Smile, Special, Talk) | 128×128 bust | full-bleed | 21–26 |
| Knight sheets — 3 knights × 11 poses (idle 4, walk 8, attack 5/4/4, run 7, jump 6, dead 6, defend 5, hurt 2, protect 1) | 128×128 | **43×64, bottom-anchored** | 22–23 |

Both are 128 cells, bottom-anchored, and the blacksmith on the village sheet is
visibly avatar `NPC_1` — white hair, white beard, grey sleeveless tank, bare
shoulders. One character, two renders, no hand-matching. That is the target.

**C0. The portrait is the authored artifact; the body is a second render of the
same spec.** The obvious shortcut — upscale one into the other — is the one thing
that cannot work, for the reason the board refuses to upscale a wall: at 128 the
outline is 2 px and the eye is 3 px; at 64 the whole head is 12 px and the eye is
1 px. A resize turns the first into mush and the second into noise.

So `CharacterSpec` holds the parts — head shape, hair, beard, skin ramp, garment
slots, weapon — and two renderers read it:

```
bust(spec, 128)                    body(spec, facing, pose, 64)
```

Same rules, same ramps, different scale. An outfit applies to both for free
because it is one slot on one spec, not two sprites somebody remembered to keep
in sync. The battlemap already works this way: a wall and a contact-sheet field
are the same rules at two sizes.

**C0a. The packs are a target, not a dependency.** They set the cell sizes, the
colour counts, the anchor and the framing. The spec remains procedural, so a
player's character is a spec rather than a purchased sprite — and an enemy is the
same economy with different slots.

**C0b. The board token is deliberately more stylised than the reference.** The
packs draw a 5-head figure; the 24 × 40 token is about 3.5 heads, because at a
32 px cell a realistic proportion leaves a 3 px face. A big head is the price of
a readable expression on the board, and it is paid at the body, not at the bust —
the bust stays close to reference proportions. As built: `src/characters/spec.ts`,
`body.ts` (24 × 40, four facings), `bust.ts` (128 × 128), `race.ts` (attachments),
and `src/pages/Characters.tsx`, which drives both from one spec so the pairing
cannot drift.

**C0c. Seven landmarks fix the portrait, and two of its edges are functions.**
In a 128 px bust: crown 19 · hairline 30 · brow 44 · eye 55 · nose tip 75 ·
mouth 82 · chin 88. Every other feature is placed relative to those. The first
pass put the hairline at 40 — four pixels above the brow — and the face read as
a helmet, because a forehead is about a third of a face.

The hairline and the beard line are computed per column (`hairlineAt(x)`,
`beardTopAt(x)`), not drawn as ellipses. An ellipse has one hard edge and cannot
be ragged; a function can vary by a pixel for free, which is the entire
difference between hair and a swim cap. A beard also has to be cut *through* for
the mouth, or the lower face becomes a blank slab.

**C0d. Races are attachments, not heads.** `race.ts` adds ears, a muzzle, tusks
or a crest in two authored scales (bust and token), on top of shared body
sections. An Argonian reads from the olive ramp rather than the skin ramp and has
no hair; a Khajiit's fur is the skin ramp and is already the right colour. Ten
races therefore cost ten overlays, not ten heads.

The app already carries ten races (`src/data/races.ts`): nord, breton, imperial,
redguard, high-elf, wood-elf, dark-elf, orc, khajiit, argonian. There is no body
field yet. That decides the shape of the art: a character is not one sprite and
not a silhouette knob — it is **sections authored per race and per build**,
composed at draw time.

This is the last track in the build order (§5), so until E5 the board carries
**silhouettes**: real assembly, real facings, real part buffers, no faces.

**C1. A token is an assembly.** Parts with anchors and a per-facing draw order:

`cloak · far arm · far leg · torso · near leg · near arm · head · hair/helm ·
shoulders · weapon · shield`

The near/far pairs swap with facing. Nothing else changes order.

**C2. Parts resolve through a fallback chain,** most specific first:

1. `race/build/section`
2. `build/section` + the race's skin ramp
3. `default/section`

This is what keeps the matrix from exploding. A head has to be per race — an
Argonian snout and a Khajiit muzzle are not a recolour. A torso usually does not:
Nord, Breton and Imperial share a build and differ by ramp. Ears, horns, tails and
snout are race **attachments**, not body sections.

**C3. Heads are the only per-race must.** At 2 builds and 4 facings: 80 head
sprites if the head differs by build, 40 if it does not. Bodies: 3 builds × 2 × 4 =
24 sprites, recoloured ten ways by ramp. That is the whole cast before armour, and
it is the real budget item — no rule reduces it.

**C4. Four facings, mirrored to eight, and the camera folds in.** Facings and
camera orientation are both multiples of 90°, so `screenFacing = (facing −
cameraTurn) mod 4`. Four authored sprites cover all sixteen combinations, and
mirroring gives the left-hand variants of asymmetric detail for free. Eight
facings is possible at twice the head count if it ever matters.

**C5. Buffers live on parts, not on the assembled token.** Each part carries its
albedo, height and spec once; assembly copies them into the token's buffers at the
part anchors. The scene light pass then treats the token as ordinary surface, so a
cloak shades the arm beside it for free — the height buffer does not care what
drew it. That is what makes a generated character sit in the same light as the
floor instead of looking pasted on.

**C6. Animation is part transforms, not frames.** Six integer channels: `bob`
(idle, 1 px at ~0.8 Hz), `lean` (attack, 2 px toward the target), `recoil`
(hurt), `collapse` (death), `reach`, and `swing` on the weapon part. An attack is
a four-step sequence of offsets, not four drawings. This is how a ~110-part kit
animates without a frame budget.

**C7. Customisation is slots, not sprites.** Three colour slots per part —
`skin`, `primary`, `secondary` — each pointing at a ramp. Armour recolours without
new art; race skin is a ramp swap; a player's custom character is a choice of part
ids and ramp ids. Enemies get the same economy: a bandit is the human build with a
different cuirass id and a different `primary` ramp.

**C8. State applies per part.** Bloodied hits the torso and the weapon; burning
tints the cloak and emits; wet darkens the feet. Because parts are the unit, a
state change is a list of `(part, modifier)` — not a whole-sprite overlay that
would cover the silhouette.

**C9. The bust is a crop, not a pose.** One framing — head and shoulders, eyes at
roughly 40 % of the cell height — and expression is the only variable, which is
exactly what the avatar pack ships. A portrait that changes pose between lines
reads as a different person mid-conversation.

**C10. The colour count is the validator.** Three of the four avatars measure
21–26 colours. The fourth measures **88**, with near-identical skin tones
(`#efc0a1`, `#efc1a1`, `#f0c1a1`) — it was anti-aliased off the pixel grid, not
authored on it, and it is the one that will not sit beside the others. A
`distinctColours <= 32` check catches that class of error for free, and it is the
cheapest gate in the whole art pipeline.

## 4. What this stack does not cover

The reference pack and the four sources above close the *look*: palette, grammar,
rasteriser, relief, light, repetition control and an animated rig. They do not
close the game. Six gaps, in descending order of how much they hurt:

1. **Characters.** **Sourced, not yet built.** The terrain pack has no humanoid,
   and neither do the tweets — but the dialogue-avatar and knight packs (§3) give
   the cell sizes (128 bust, 128 cell / 64 figure), the colour budget (21–26) and
   the portrait-to-body relationship the creator is built against. They are a
   target, not art to ship: the ~110 parts behind §3 are still generated from
   rules.
2. **The kernel, numerically.** What exists is a tool and a result. How much
   relief a flagstone groove gets, how the Sobel divisor scales with the cell
   size, whether specular saturates on metal at noon — those are taste numbers,
   and empirical. The four-azimuth sun sweep is cheap enough to settle them.
3. **Performance at our size.** The reference is a 640×360 film: built once, one
   camera, no input. We are more pixels, four orientations, integer zoom with
   rebuilds, moving lights and five clients. Unmeasured — an afternoon of
   instrumentation, but a risk rather than a fact.
4. **Sound.** PRESENTATION X12 needs seven samples. No rendering technique
   produces them, and they have to be licensed or made.
5. **Composition authoring** — partly closed. The scene supplies rough placement
   and P6a refines it, but *something* still has to author the rough layer: which
   wall, which end of the room, how dense. That remains BATTLEMAP G2.
6. **Touch.** Drag a path, pan, zoom and rotate are four gestures on a phone.
   This is BATTLEMAP G6 and it is still open.

None of these say the look is wrong. They say a game needs things a rendering
technique cannot make.

## 5. Build order: environment, then cast

The background comes first. It is the palette and the light of record, so a
character authored before it is authored against a guess — and the guess is wrong
at both ends of the lighting range. The sharper form of the argument: a character
has to read under a torch **and** under a cold dawn, so the environment must be
locked to at least two moods before any character can be judged at all.

That does not mean the token *code* waits. It means the token **art** waits:
assembly, facing maths, draw order and part buffers are all exercised by
silhouettes — four facings per archetype, flat fill from a character ramp, one
simple height dome. Four sprites per archetype, drop-in replaceable. Deferring
the art is cheap; deferring the assembly turns "later" into "rewrite".

**E1. One material set.** Floor, wall and one prop through all four buffers, with
the real ramps. *Gate:* a 20×20 field built from **one** tile with P7's offset and
flips reads hand-authored rather than tiled.

**E2. The sun sweep.** The same field at four azimuths, including midnight, with
the normal pass on. *Gate:* the relief visibly changes across all four. If it does
not, the height buffer or the P12 kernel is wrong, and no colour work will fix it.

**E3. Props and boundaries.** Every `PropRule` a room needs, the boundary masks,
the decal layer. *Gate:* a room painted from a coarse placement graph resolves to
the same cells twice (P6a determinism).

**E4. Two moods, one room.** The same room at torchlight and at cold dawn.
*Gate:* both look intentional; neither is the other one with a filter on it.

**E5. The cast.** Only now — heads per race, builds, ramp slots, portraits (§3).
*Gate:* a character reads under both of E4's moods without being re-authored.

E1 and E2 are the whole risk. They are also two afternoons: the contact sheet is
one page, and the sweep is four renders of it. Everything after them is volume.
