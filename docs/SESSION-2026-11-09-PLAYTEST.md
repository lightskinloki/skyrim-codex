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
- **No new image assets.** Skill art is procedural, like the tokens and the
  board, for the same reason: a rule is smaller than a sprite and stays
  consistent when the palette changes.

## Work order

### S1 — one sheet, both screens

Full-sheet messages on the existing table channel, in both directions, with a
revision number so an in-flight frame cannot resurrect older HP. The GM gets a
live card per joined player: HP, FP, DR, conditions, and damage/heal/FP buttons
that write to the player's sheet.

*Done when:* a −5 on either screen moves the other within a frame, and both
numbers are equal afterwards.

### S2 — Start Combat pulls the table

Start Combat adds every joined player who is not already in the fight, from
their live sheet, at their current HP and FP. No duplicates. A player who joins
mid-fight can still be added once. Players receive a fight-started message that
opens Combat Mode (tap to open, never a hijacked screen).

*Done when:* five joined players produce five combatants and five prompts.

### S3 — Combat Mode cannot be fallen out of

A permanent quick bar: Attack, Cast, Move, Brace, Dodge, End Turn. Closing the
mode asks first, and a "Return to combat" control stays on the dashboard while
a fight is live.

*Done when:* reading a spell list costs one deliberate tap and one deliberate
tap to come back, and the fight is never lost.

### S4 — Brace computes

Always offered as a Minor. Shows the equipped shield's bracing bonus, the
riders its enchantment adds (Elven +1 DR vs spells, Orcish 1 damage back,
Ebony +1 FP on a spell hit, Daedric half elemental, Dragon +2 vs dragons), and
an explicit "no shield — the book gives no brace" when there is none. The
pending DR is visible to both screens until the next hit consumes it.

*Done when:* the card states the number before the player commits, and the GM
can see it is pending.

### S5 — a target on the card

The player names a target from the enemies the GM has revealed. It travels with
the roll card. It does not yet move a token; the battlemap will read it.

### S6 — conceal

A per-enemy concealed flag on the GM tracker. Concealed enemies are dimmed for
the GM and omitted from every player-facing surface until revealed.

### S7 — an outcome, not arithmetic

Tapping an attack or spell opens the roll: d20 entry (or the app's roller), then
the five tiers, then the damage that tier produces, computed from the action and
the additive-multiplier law (a crit is one x2 step; fail is nothing). Sending it
puts a card on the GM's screen with actor, action, tier, target and damage, and
one tap applies it. Complication holds the damage for the GM's call.

*Done when:* a crit on Firebolt says "12 (6 ×2)" without anyone reaching for
the book.

### S8 — skills with faces

Thirteen procedural icons, one per skill, in the creator's skill step and the
summary. Each card answers three questions in order: what this is, what the
stat is, what the next rank buys.

## Still open

1. **Weapon parry.** The book has no brace with a weapon. If the table wants
   one, it is a house rule and needs a number before it is built.
2. **Concealment depth.** Should a concealed enemy be absent from the GM's turn
   summary too, or only from player surfaces?
3. **Rolls outside a fight.** Exploration rolls have no encounter to attach to.
   Same card, or a session log card?
4. **Targets before the map.** Pick from the GM's revealed list, or free text
   until the board can answer it?

## Verification for this checkpoint

- `node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit` — clean.
  (`npx tsc` resolves to the bun shim in this checkout and must not be trusted.)
- `npm run test:rooms`, `test:walk`, `test:props`, `test:encounter` — all pass.
- The bundled one-shot loads: `BUNDLED_MODULES` starts with `sleeping-men:module`
  and the five templates are in `enemyTemplates`.
