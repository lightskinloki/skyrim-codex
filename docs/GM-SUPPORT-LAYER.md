# The support layer

A design principle, written 30 Oct 2026, after the giant fight and the Pondsmith
study.

## The principle

**The GM is the world. The app is the rules.**

Anything a screen can answer must never be answered by a person. Every rules
question routed through the GM costs the table twice: once in the seconds it
takes, and again in what it does to the room — the GM stops being the world and
becomes a help desk, and players stop tracking anything because they know they
can just ask.

That second cost is the one that actually matters. A table that asks is a table
that waits.

## The evidence

These are the GM lines the transcriber caught in the 26 October session. Every
one of them is rules work wearing the costume of conversation.

| Said at the table | Should have been answered by |
|---|---|
| "what's your total HP?" | The player's own card |
| "roll agility" | The block's condition, on the player's screen |
| "it lasts three rounds, it's once per long" | The effect's own text, where it was applied |
| "you were not already knocked prone in your…" | The condition list, visible to the player |
| "how much damage does it do?" | The weapon row |
| "that's what it was last time, it was minus six" | The ruling record, not memory |
| "your turn" ×5 | The turn strip |
| "I'm not letting you apply one handed abilities" | The weapon's property line |

Eight questions. Not one of them needed a human.

## What has to be true

Three surfaces, and all three face the players, not the GM:

1. **Your card.** Your attack, its die, its damage, its cost, its properties.
   Written once in prep, read at the moment of the swing.
2. **The fight.** Whose turn it is, who is up, what the boss is on — bar, phase,
   and the one ability it is about to use. Shared, so nobody has to be told.
3. **Your state.** Conditions, and what they cost to clear. Prone is a minor
   action to stand; the player should know that without asking.

The GM's screen should show only what the players cannot: what the creature does
next, what just changed in the world, and the consequence. If it appears on the
GM's screen and could have appeared on a player's, it is in the wrong place.

## A note on hiding

Sharing the boss's bars changes the feel of a fight. Some tables want the number,
some want the dread. That is a toggle — *show bars / hide bars* — not a rule. The
turn strip should be shared either way; knowing whose turn it is is never a
spoiler.

## The round is a beat, not six seconds

The old instinct was to chase D&D's simultaneity: everything in a round happens
in the same six seconds, so the GM has to hold the whole picture in their head
and narrate it as if it were all now.

A round here is a unit of **attention**, not a slice of time. A turn is a beat.
The fiction is allowed to stretch a slow moment and compress a fast one, and
nothing has to be reconciled afterwards. This is a permission, and it should be
written into the session guide, because the alternative — trying to keep a
five-player fight all happening at once — is what turns the GM into a
simultaneity engine with no attention left for the world.

## The test

After a session, count the questions the GM answered that a screen could have
answered. The target is zero. Not because the app should be in charge, but
because that is the only way the GM gets to be.

## Where this lands in the app

The order is in `APP_BACKLOG.md`:

1. Combat mode, one fight, two screens — the shared state above.
2. Reach as time — so "where are you standing" stops being a question.
3. Persisted state — so the shared state can be trusted.
4. Authored complications — so the *world's* answer is pre-written and the GM
   never has to invent under pressure.
5. Live table log — so the rules work is recorded once, at the moment, and never
   reconstructed afterwards.
