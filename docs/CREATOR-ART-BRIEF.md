# Character-creator artwork — the brief

The race and standing-stone steps are painted. All thirteen skill plates are
painted and installed too, the four redrawn ones and the last holdout included.
The six kit plates are still open.

Nothing here is code: drop the files in, reload, and the frames appear. Until a
file exists its frame does not render at all — a half-finished art pass looks
deliberate, not broken.

## The contract

| | |
|---|---|
| Count | **13 skills + 6 kits = 19 images** |
| Aspect | **16:9** |
| Size | **1024 × 576 minimum**; 2048 × 1152 if your tool allows |
| Format | JPG, sRGB, quality 85+ |
| Crop | Subject inside the **middle 80%**; the card uses `object-cover` and may trim the edges |
| Text | None. No borders, frames, logos or watermarks |

Skills live in `public/images/skills/<skill-id>.jpg`.
Kits live in `public/images/kits/<kit-id>.jpg`.

A PNG with the same name is also accepted (the card tries `.jpg`, then
`.png`), so a work-in-progress screenshot does not need converting first.

If you would rather crop or composite from the packs already on disk than
generate new plates, that is fine — the filename, 16:9 aspect and crop are the
only hard requirements. The prompts below are a starting point, not a mandate.

The ids are the ones in `src/data/skills.ts` and `src/data/kits.ts` — the table
below is the checklist.

## The look

The reference is the existing race and standing-stone art, not the pixel board:
**painterly digital concept art, Elder Scrolls-adjacent Nordic fantasy**. Muted
earth, iron, snow and cold blue; one strong light source; atmospheric depth;
visible brushwork. A plate should feel like a framed piece of the world, not an
icon with a background.

Two rules matter more than any others:

1. **One subject, one light.** A card is read at roughly 400 × 225 px in the
   dialog. If the eye has to hunt, the plate has failed.
2. **The thirteen skills are one set.** Vary the scene, not the palette. A
   destruction plate and a restoration plate should look like they were painted
   by the same hand on the same day.

**Shared style suffix** — append to every prompt:

> painterly digital concept art, Elder Scrolls-inspired Nordic fantasy, muted
> earth and cold blue palette, one dramatic light source, atmospheric depth,
> visible brushwork, cinematic composition, no text, 16:9

**Negative prompt** — use on every image:

> text, letters, logo, watermark, frame, border, UI, anime, cartoon, oversaturated,
> neon, modern clothing, modern weapons, deformed hands, extra limbs, extra fingers

## Skills

Each plate answers one question: **what do I do with this skill?** Not what it
unlocks — what the character is *doing* while it matters.

Archery is the benchmark, and the reason it works is that there is a body in it:
a figure at full draw, weight on the back foot, the arrow already gone. You can
name the skill before you read the label. A still life of a sword in the snow
cannot do that, and two still lifes of two swords certainly cannot.

Three rules follow from it:

1. **A figure in the act.** Draw the verb. Objects alone are allowed only when
the object *is* the action — Lockpicking works because the pick in the lock is
the verb.
2. **The outcome is visible.** The soldiers turning on each other, the lantern
light that does *not* find the thief, the summoned thing at the mage's shoulder.
If the plate needs the summary text to be understood, it is an icon, not a
scene.
3. **Different silhouettes.** No two plates may share a pose. One-Handed is one
blade and a shield, compact and closing. Two-Handed is both hands on one haft,
wide arc, mass. If swapping the backgrounds leaves the two plates reading the
same, they are the same plate.

| File | Skill | Prompt |
|---|---|---|
| `one-handed.jpg` | One-Handed | A fighter in worn leathers caught mid-step on a snowy forest track, a straight sword low in the right fist and a round shield braced on the left, body turned to close on an enemy just out of frame, snow kicked from the front boot, pale dawn behind the pines, cold blue light and one warm glint along the steel. |
| `two-handed.jpg` | Two-Handed | A broad warrior in a fur mantle mid-swing with a greatsword, both hands on the grip, the blade carving a wide arc through firelit dust in a stone hall, boots planted wide, grit and sparks thrown off the floor, a deep arch and a faded banner behind, low brazier light and one long hard shadow. |
| `archery.jpg` | Archery | A lone hooded archer at full draw on a snow ridge at sunset, arrow just loosed, a low sun behind the pine line, cold snow in the foreground and a warm sky behind. |
| `heavy-armor.jpg` | Heavy Armor | A full suit of steel plate armor on a stand in a dim armory, a fur mantle at the shoulders, a round shield and a spear behind, forge light from the left, embers in the air. |
| `light-armor.jpg` | Light Armor | A leather cuirass and bracers hanging from a pine branch in a sunlit forest hunting camp, a quiver leaning nearby, dusty shafts of light through the canopy, a few autumn leaves. |
| `destruction.jpg` | Destruction | A robed arm raised against a night sky, palm holding a roaring ball of fire, embers swirling upward, the snow ridge lit orange from below, the face never shown. |
| `restoration.jpg` | Restoration | A wounded warrior kneeling in a stone chapel inside a shaft of golden light from a tall window, a glowing sun sigil above, dust motes in the beam, quiet and reverent. |
| `alteration.jpg` | Alteration | A mage standing on a floating shard of rock at night, arms spread, a translucent dome of blue force around them, smaller stones orbiting, snow peaks far below. |
| `illusion.jpg` | Illusion | Two armored soldiers turning on each other in a torchlit corridor, one driving a blade at the other's throat, both faces slack and staring at nothing, while a hooded mage stands in the foreground with their back to camera and one hand raised, faint violet threads running from the fingers to the soldiers' temples; cold blue shadow, one warm torch. |
| `conjuration.jpg` | Conjuration | A mage on a ritual-scarred stone floor, a burning summoning circle at their feet and a towering flame atronach at their shoulder, both turned toward the same unseen threat, the atronach's body wet with living fire and its legs still half-dissolved into the circle; cold violet smoke, one strong orange light from the summoned thing. |
| `sneak.jpg` | Sneak | A hooded figure pressed into the shadow of a stone pillar, a dagger reversed in one hand, while a lantern-carrying guard walks past close enough that his light rakes the wall beside them; the guard stares straight ahead, the figure inside his blind spot with eyes on his back; cold moonlight from a high window, one warm pool on the flagstones. |
| `lockpicking.jpg` | Lockpicking | An extreme close-up of a lockpick and tension wrench in an iron lock on an old wooden door, a candle lantern at the left, a warm pool of light, deep shadow, rivets and wood grain. |
| `speech.jpg` | Speech | Two silhouetted figures leaning into a conversation across a tavern bar, a tankard, a coin pouch and scattered septims between them, shelves of bottles behind, warm amber candlelight. |

**Painted and installed (thirteen, the complete set):** `one-handed`,
`two-handed`, `archery`, `heavy-armor`, `light-armor`, `destruction`,
`restoration`, `alteration`, `illusion`, `conjuration`, `sneak`, `lockpicking`,
`speech`.

**Open:** nothing on the skill side.

**Where they show.** The creator prints one per card at the skill step and one
per kit at the kit step. The character sheet prints a skill's plate at 16:9 above
its perk list when the row is expanded — the only place in play where a player
can see the art for a skill they own. Both go through `CreatorPlate`, which
renders nothing when the file is absent and retries as a `.png` of the same name,
and `test:creator` fails if any of the thirteen skill files goes missing.

**Redrawn and reinstalled:** `one-handed`, `two-handed`, `illusion` and
`conjuration`. The two weapon plates were still lifes — a sword in the snow, a
sword in a hall — and at card size read as the same skill; illusion was mood
with no mechanic in it; conjuration had a summoned thing and nobody summoning
it. All four are now figures in the act, and the prompts above are the ones
that produced the shipped plates. `archery` is the plate that proved the
approach on this set: a body, a verb, one light.

**Who is in the frame.** Six of the thirteen carry no readable subject:
`archery` and `illusion` keep the face deep-hooded or turned away,
`destruction` is a bare arm, and `heavy-armor`, `light-armor` and `lockpicking`
are objects. Of the seven with a face, three are women — `restoration`,
`conjuration` (the female-mage variant of the two generated) and `sneak` — and
four are men: `one-handed`, `two-handed`, `alteration` and the pair in `speech`.
That is close enough to an even split that nothing needs redrawing. If it is
ever worth nudging, the two free slots are `archery` and `illusion`: both are
hooded, and neither prompt fixes the sex of the figure. The kits carry no
people at all, so they never shift the count either way.

## Kits

A kit plate is a **still life, no people**: the gear laid out in the place that
kit belongs to. Class portraits belong to the skill step; this step is about
what the character carries.

| File | Kit | Prompt |
|---|---|---|
| `warrior.jpg` | The Warrior's Kit | A warrior's kit laid out in a longhouse: a steel greatsword standing point-down, a round shield, a steel helm resting on a crate, a folded fur cloak, firelight from the left, no people. |
| `skirmisher.jpg` | The Skirmisher's Kit | A skirmisher's kit on a forest stump at dusk: a longbow, a quiver of steel arrows, a steel dagger, a leather hood, lockpicks and a vial of poison, fireflies in the dark trees, no people. |
| `mage.jpg` | The Mage's Kit | A mage's kit in a tower room: a staff with a glowing crystal, an open spellbook on a desk, apprentice robes over a chair, candles and a blue potion, a moonlit window, no people. |
| `spellsword.jpg` | The Spellsword's Kit | A spellsword's kit on a training-yard bench at dawn: a steel sword, an open spellbook, a leather-and-mail gauntlet, a small brazier, warm and cold light meeting across the bench, no people. |
| `nightblade.jpg` | The Nightblade's Kit | A nightblade's kit on a rooftop parapet: a steel dagger stuck in the stone, a poison vial and a magicka vial, lockpicks, scattered coins, a dark hood and cloak over the edge, moon and city below, no people. |
| `ranger.jpg` | The Ranger's Kit | A ranger's kit at a dawn camp in the pines: a bow leaning on a log, a quiver, a hand axe buried in the log, a bedroll, a small campfire with a pot, mist between the trees, no people. |

## Checklist

- [x] Thirteen skill plates delivered, 16:9, named exactly as the ids
- [x] `one-handed` and `two-handed` redrawn as figures in the act
- [x] `illusion` and `conjuration` redrawn with the mechanic in frame
- [x] `sneak` — the last skill plate
- [ ] 6 kit plates, 16:9, named exactly as the ids
- [ ] Same painter, same palette family across all nineteen
- [ ] Subject readable at 400 px wide
- [ ] No text, borders or watermarks
- [ ] Drop into `public/images/skills/` and `public/images/kits/`

If one plate is not ready, ship the other eighteen. The missing frame simply
does not render.
