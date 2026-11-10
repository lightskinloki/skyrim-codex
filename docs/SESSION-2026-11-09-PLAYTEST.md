# The Sleeping Men — first live table, 9 Nov 2026

A five-player improvised one-shot run from the app. This is the debrief, written
the morning after, so the next session starts from the failures rather than from
memory. Where this file and an older spec disagree about what to build next,
**this file wins**; the rules themselves are still `TABLE-SYNC-DECISIONS.md`.

The adventure itself ships with this note: `data/sleepingMenModule.ts` and the
five enemy templates under "The Sleeping Men" in `data/enemies.ts`.

## What worked

- **The room.** Players scanned the QR, opened the link, typed nothing and were
  at the table. Nobody was told to install anything. This is the part that
  changed the session, and it is not to be redesigned.
- New players who had never played a tabletop game tracked their own sheet
  without being taught: HP, FP, spells and equipment were all where they looked.
- The GM's fight list read the characters that joined, not characters saved on
  the GM's machine. That is the correct behaviour and stays.

## What broke, in the order it cost the table

### 1. The sheet is only half-synced

The player's device pushes its sheet to the GM (`hello` on every change), but
nothing travels the other way and the GM has no card to look at. So:

- the GM cannot see a player's HP without walking around the table,
- damage the GM applies on the GM screen never reaches the player's sheet,
- two numbers claim to be the same number.

`docs/TABLE-SYNC-DECISIONS.md` already says there is no "real" copy and both
stay equal. That is not true yet.

### 2. Start Combat does not pull the table

The GM clicked Start Combat with five players joined and the fight began with
whatever enemies had been added. Every player had to be added one at a time
from the Enemies tab, and some were missed. Players were also never told a fight
had started, so they found out by being asked why they weren't in Combat Mode.

### 3. Combat Mode is a place players fall out of

The mode is a full-screen overlay with an X. Players closed it to read a spell
list or their inventory, and then could not find their way back — the toggle is
buried on the dashboard. The mode is *more* useful than the dashboard during a
fight, so leaving it is always a mistake, but the app treats it as neutral.

Also: the actions that get used every turn (attack, move, brace, end turn) are
behind a full-screen action picker, while the things that get read (spell text)
are behind the exit.

### 4. Brace is not a real action

`actionUtils` offers "Brace (Shield)" only when a shield is equipped, and it
does nothing but mark the slot used. It never computes the DR, never shows it,
and never tells the GM it is pending. Mid-fight the GM had to remember that an
ordinary shield braces for 2 and a heavy shield for 3.

The rulebook is narrower than the table remembered: **Brace is shield-only.**
`players guide` line 823: "If you have a shield, you can use your Minor Action
to brace"; line 824: "Reduce the damage of the next attack that hits you by an
additional 2 points." `Gear, Consumables, and the forge` gives each shield a
Bracing Bonus (hide/iron +1, steel/elven +2, dwarven/orcish +3, ebony +4,
daedric/dragon +5). There is no weapon-parry DR and no bare-arm brace anywhere
in the books.

### 5. No target

Combat Mode has attacks and spells but no notion of who they are aimed at. The
GM ran every target out loud. This is the seam where the battlemap eventually
lands, so the choice made here matters more than it looks.

### 6. The GM cannot conceal an enemy

Everything the GM adds is known to be there. An ambush has to be kept in the
GM's head, which is exactly the thing the app exists to stop.

### 7. Casting tells you nothing

Tapping a spell spends FP and marks the slot used. It does not prompt for the
d20, does not say whether that was a success, a complication or a critical, and
does not state the damage. The player then reads the spell text aloud, does the
arithmetic, and the GM subtracts it on another screen. This was the single
biggest source of "wait, how much?" and of scrolling.

### 8. Skills are text at creation

The skill step asks a new player to commit one Adept and two Apprentice ranks
from thirteen names and a paragraph of perks. A player who has never seen the
system has no idea what "Alteration" buys them. Pictures at this step are not
decoration; they are the explanation.

## Decisions settled in the debrief

- **Brace stays shield-only**, because that is the written rule and inventing
  weapon DR would quietly change every monster's damage. The app computes the
  shield's bonus and says so; it does not offer a number the book does not have.
- **Damage on a complication waits for the GM.** It is a flag on the GM's card,
  not an automatic application (`TABLE-SYNC-DECISIONS.md`, "Damage and
  resources").
- **A concealed enemy is concealed from players, not from the GM.** The GM's
  tracker dims it and keeps it usable; anything player-facing omits it.
- **Combat Mode is the fight's home.** Closing it is allowed but must be a
  decision, not a stray click.
- **The board stays procedural; the creator is painted.** The board, tokens and
  in-game glyphs are still rules, so a re-colour is one table and nothing at the
  table depends on a shipped raster. The creator's showcase plates are authored
  images, because that screen is selling a fantasy and a 32 px pictogram cannot
  do it. The split is in `docs/CREATOR-ART-BRIEF.md`.

## Work order

### S1 — one sheet, both screens ✅ landed

Full-sheet messages on the existing table channel, in both directions, with a
revision number so an in-flight frame cannot resurrect older HP. The GM gets a
live card per joined player: HP, FP, DR, conditions, and damage/heal/FP buttons
that write to the player's sheet.

*Done when:* a −5 on either screen moves the other within a frame, and both
numbers are equal afterwards.

### S2 — Start Combat pulls the table ✅ landed

Start Combat adds every joined player who is not already in the fight, from
their live sheet, at their current HP and FP. No duplicates. A player who joins
mid-fight can still be added once. Players receive a fight-started message that
opens Combat Mode (tap to open, never a hijacked screen).

*Done when:* five joined players produce five combatants and five prompts.

### S3 — Combat Mode cannot be fallen out of ✅ landed

A permanent quick bar: Attack, Cast, Move, Brace, Dodge, End Turn. Closing the
mode asks first, and a "Return to combat" control stays on the dashboard while
a fight is live.

*Done when:* reading a spell list costs one deliberate tap and one deliberate
tap to come back, and the fight is never lost.

### S4 — Brace computes ✅ landed

Always offered as a Minor. Shows the equipped shield's bracing bonus, the
riders its enchantment adds (Elven +1 DR vs spells, Orcish 1 damage back,
Ebony +1 FP on a spell hit, Daedric half elemental, Dragon +2 vs dragons), and
an explicit "no shield — the book gives no brace" when there is none. The
pending DR is visible to both screens until the next hit consumes it.

*Done when:* the card states the number before the player commits, and the GM
can see it is pending.

### S5 — a target on the card ✅ landed

The player names a target from the enemies the GM has revealed. It travels with
the roll card. It does not yet move a token; the battlemap will read it.

### S6 — conceal ✅ landed

A per-enemy concealed flag on the GM tracker. Concealed enemies are dimmed for
the GM and omitted from every player-facing surface until revealed.

### S7 — an outcome, not arithmetic ✅ landed

Tapping an attack or spell opens the roll: d20 entry (or the app's roller), then
the five tiers, then the damage that tier produces, computed from the action and
the additive-multiplier law (a crit is one x2 step; fail is nothing). Sending it
puts a card on the GM's screen with actor, action, tier, target and damage, and
one tap applies it. Complication holds the damage for the GM's call.

*Done when:* a crit on Firebolt says "12 (6 ×2)" without anyone reaching for
the book.

### S8 — skills with faces ✅ landed

Thirteen procedural icons, one per skill, in the creator's skill step and the
summary. Each card answers three questions in order: what this is, what the
stat is, what the next rank buys.

## How each step was built (the morning after)

**S1 — one sheet, both screens.** `net/table.ts` now carries `SheetMessage` in
both directions, and every sheet has a `rev`. The host keeps the newest frame it
has seen and answers an older `hello` with its own sheet instead of accepting it,
so a reconnect cannot resurrect stale HP. A player adopting a GM sheet records it
as `lastRemote` and does not echo it, so the two copies settle instead of
ping-ponging. `GMDashboard` writes tracker HP/FP back to the sheet, and reads the
sheet into the combatant on every change — one number, two screens. The GM's
`PlayerCards` renders each seat live: HP, FP, DR, conditions, brace, and
damage/heal/FP buttons that go through `editCharacter`.

**S2 — Start Combat pulls the table.** `CombatView` diffs the joined seats
against the combatants' `characterId`s and adds everyone missing from their live
sheet before starting, so HP and FP arrive at the values the player currently
has. The button reads `Start Combat (+n)` and says what it will add. The host
sends `fight: start`, each seat raises a dismissible "fight started" prompt, not
a hijacked screen, and a `Return to combat` button stays on the dashboard until
`fight: end`.

**S3 — Combat Mode cannot be fallen out of.** A permanent bar above the scroll
holds Attack (the best weapon, with its damage on the button), Cast/Actions,
Move, Brace, Dodge and End turn, plus Major/Minor/DR status underneath. The X now
asks first, and minimising (which was already allowed) is the quiet option.

**S4 — Brace computes.** `utils/brace.ts` is the one place the number lives: the
equipped shield's bracing bonus from `data/equipment.ts` (hide/iron 1, steel/elven
2, dwarven/orcish 3, ebony 4, daedric/dragon 5) plus the shield's riders, with an
explicit "no shield — the book gives no brace" path. Taking a brace marks the
Minor (unless Dwarven Shield's Shield Wall says otherwise), shows `Bracing +n` in
the header, and reports it to the GM as a status effect so their damage path
subtracts it once. A hit — from either screen — spends it.

**S5 — a target on the card.** The roll prompt lists the enemies the GM has
revealed; the chosen target rides on the `RollCard`. Nothing moves on a board
yet; when the battlemap reads it, it will already be there.

**S6 — conceal.** `Combatant.concealed` is a GM-only flag, dimmed on the tracker
and filtered out of `roster` before it is published. A seat that joins mid-fight
is sent the current roster on `hello`, so the list is never stale or half-known.

**S7 — an outcome, not arithmetic.** `utils/roll.ts` owns the d20 → tier → damage
law (crit is one ×2 step, fail is nothing, a complication holds the damage for
the GM). `RollPrompt` walks die → tier → target and sends a card; `RollFeed` shows
it on the GM's screen with the arithmetic already done and one Apply button.
Casting or attacking opens the prompt; summoning still opens its body picker
first, because that is a choice, not a roll.

**S8 — skills with faces.** `characters/skillEmblem.ts` draws thirteen 32 × 32
glyphs from rules, in the same palette as the board (sword, greatsword, bow,
shield, cuirass, flame, sun, rings, eye, summoning circle, footprint, key, coin).
Each skill gained a one-line `summary`. `npm run test:emblems` checks coverage,
transparency, the ink edge, that a glyph actually fills the square, and that no
two skills share a picture.

**S9 — the glyphs moved, and the creator got a frame for real art.** The 32 px
glyphs were doing showcase duty in the creator, which is the wrong job twice
over: a pictogram cannot sell a character choice, and the game surface had no
icons at all. They now appear beside each skill on the character sheet
(`SkillsDisplay`), on transparency, with no plaque; the creator's emoji type
headers are gone with them. The creator's skill and kit steps now reserve a
16:9 plate per card, loaded from `public/images/skills/<id>.jpg` and
`public/images/kits/<id>.jpg`. A missing file collapses the frame rather than
showing a placeholder — the artwork itself is authored outside the app.
`docs/CREATOR-ART-BRIEF.md` is the handoff: nineteen prompts, exact filenames,
the house style, and the crop rules. `npm run test:creator` guards the contract
(19 unique paths) and the kits against the printed equipment table.

**S10 — six kits, and the printed numbers corrected.** The three printed kits
are unchanged in wording; their damage now matches the gear table (Steel
Greatsword 9, Steel Sword 6, Long Bow 4, daggers 4/3) instead of the older
low values they shipped with. Three house kits use only printed gear so a hybrid
has somewhere legal to start: Spellsword (sword + robes + both potions),
Nightblade (dagger + leather + poison + magicka + picks), Ranger (bow + axe +
hide + arrows + healing). They carry `house` and the card says so; the printed
three remain canon.

**S11 — the plates are painted, and the sheet wears them.** All thirteen skill
plates were authored outside the app and dropped in by id: the creator's skill
step is now full-bleed art, and expanding a skill on the character sheet opens
its plate above the perk list. `test:creator` also fails if a skill file goes
missing (118 checks). The six kit plates are the only empty frames left.

## Still open

1. **Weapon parry.** The book has no brace with a weapon. If the table wants
   one, it is a house rule and needs a number before it is built.
2. **Concealment depth.** Concealment hides an enemy from player surfaces only;
   the GM's tracker dims it and keeps it usable. Decided, but the GM turn
   summary has not been checked for leaks yet.
3. **Rolls outside a fight.** Exploration rolls have no encounter to attach to.
   Same card, or a session log card? Not decided.
4. **Targets on the board.** Picking from the revealed roster works. The tie to
   an actual token (and to the battlemap) is the next session's seam.
5. **Two sheets, one writer.** The revision rule resolves the common cases, but
   a simultaneous edit on both screens is last-write-wins. Acceptable at a
   table; worth a note if the GM starts editing mid-turn as a habit.
6. **The six kit plates.** The thirteen skill plates are painted and installed.
   The kits still have their slots and their prompts but no images; a missing
   plate collapses, so the step works, but it only reaches the race/stone
   standard once the files land in `public/images/kits`.

## Where the board stands, and what comes next

Nothing in this checkpoint touched the battlemap. It is where the last one left
it: rooms are documents (`rooms/*.json`), doors are loading screens with a saved
rig/token/seen layer, fog is 2D line of sight with a GM toggle, and there is a
draft editor and one-switch environment strip. `BATTLEMAP-SPEC.md` §18–20 are the
record; the open list at the end of §19 is still open (no multi-storey village,
no token dragging, fog is a floor-plane mask).

The session's pain points point at the board for two things, in this order:

1. **A fight on the board.** Launch an encounter from the room the party is
   standing in, with the room's props and tiers as the fight's ground and each
   combatant on its own token. The join between `combatManager`'s combatants and
   `RoomDoc` tokens is the actual work; the renderer already draws what a fight
   needs.
2. **A camera per player.** Today the board is one GM view. The table wants each
   seat to pan, zoom and turn its own view, with that seat's fog revealed by its
   own line of sight. `FogView` is per-view already; the missing piece is a
   per-seat camera and seen mask travelling over the table channel.

After that, the $64k question from the design conversation stands: a dungeon is
a graph of rooms the party explores and where the GM launches encounters, and the
board should hold the whole graph (doors as loading screens) rather than one
static map per fight.

## Verification for this checkpoint

- `npm run check:types` (`node node_modules/typescript/bin/tsc -p
  tsconfig.app.json --noEmit`) — clean. Never use `npx tsc` here: it resolves to
  the bun shim in this checkout and tests the wrong package.
- `npm run test:brace` (15), `test:damage`, `test:encounter` (43), `test:props`,
  `test:rooms` (112), `test:walk` (39), `test:alchemy`, `test:emblems` (133),
  `test:creator` (118) — all pass.
- `npm run build` — clean.
- The bundled one-shot still loads: `BUNDLED_MODULES` starts with
  `sleeping-men:module` and the five templates are in `enemyTemplates`.

**Not verified in a browser this checkpoint:** the two-screen loop was exercised
by code and types, not by two devices. The first thing to do at the next session
is a two-tab join, damage on one tab, and read the other.
