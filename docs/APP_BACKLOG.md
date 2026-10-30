# App backlog

Written 30 Oct 2026, out of the Sahloknir/giants sessions and the Pondsmith
study. Ranked by what has actually bitten at the table.

**Standing decisions.** Damage and HP are not changing — the party can make the
numbers the system assumes. Long fights are fixed by removing overhead, not by
shrinking pools.

## Open

### 1. Combat mode: one fight, two screens

**Problem.** The GM and the players each hold their own copy of the fight. The GM
asks "what's your total HP", the player says a number, the GM subtracts it on
another device.

**Sketch.** A shared encounter state both portals read: whose turn, who is up,
each PC's HP and resources, the boss's bars. The player rolls on their card and
the total lands already applied on the GM screen. Nothing is typed twice.

### 2. Reach as time in the VTT

**Problem.** Theatre of the mind is fast until a fight becomes spatially
contested; from then on every turn opens with "where are you standing?"

**Sketch.** Token-to-token reads "in reach / this turn / next turn", derived from
the mover's speed. The GM reads the answer instead of computing it.

### 3. Combat state that survives a reload

**Problem.** `CombatManagerView` holds HP, round, status fields, fired triggers
and the log in `useState`. A refresh, or an unmount from switching tabs, puts
every bar back to full.

**Sketch.** Persist per (moduleId, sceneId, blockId) to localStorage, with an
explicit "reset encounter" control so the reset is a choice.

### 4. "Continue" vs "Deploy" on an encounter

**Problem.** The red Deploy Encounter button builds a combatant from the enemy
template — full HP, phase one. On a half-spent boss it duplicates the enemy or
silently restarts the fight.

**Sketch.** When the enemy already exists on the tracker, or the block's trackers
are partly spent, Deploy becomes: *Continue the fight in progress* / *Deploy a
fresh one*. Default to continue.

### 5. Encounters that resume mid-fight

**Problem.** A combat block always begins at full bars. This encounter is on its
third session and the first of its two 300 HP bars is already spent.

**Sketch.** A tracker target gets an optional `startHp` / `spent` field, and the
block an optional starting phase. Initialise from those instead of `maxHp`, and
suppress the entry trigger for a phase already played.

### 6. Authored complications on a combat block

**Problem.** Fail-forward is a foundation of the system, but the *specific*
consequence has to be invented under pressure.

**Sketch.** Optional fields per block for a critical failure and a
success-at-a-cost. Authored in prep, read in the moment. Not required, not on
every block.

### 7. Turn clock and round counter

**Problem.** Nothing on screen says how long a turn is taking, so pace slips
unmeasured.

**Sketch.** Per-turn countdown (default 60s), round counter, quiet log of actual
turn durations. No penalties. Export a per-encounter summary.

### 8. A live table log that writes the next pickup

**Problem.** Reconstructing session state after 26 Oct took reading the whole
transcript by hand: HP, positions, spent ammunition, who died.

**Sketch.** One-tap entries during play — *bar broke*, *PC down*, *resource
spent*, *ruling made* — timestamped against the current scene. At session end,
emit a draft pickup block from the log for the GM to edit.

### 9. Freshness check on import

**Problem.** A bundled adventure can be edited at source after import, leaving the
table playing last week's text.

**Sketch.** Store the source hash at import; warn on mismatch and offer a diff or
re-import. Never overwrite a live campaign.

### 10. Standing stone portraits — independent

**State.** Character creation has race art; the standing stones have none.

**Why now-adjacent.** It is asset work on a screen that does not touch combat, so
it neither blocks nor is blocked by the sync work. Ship it whenever there is a
gap.

### 11. Summoned creatures — after sync Phase 2

**Wanted.** Cast a conjuration spell, and the thing arrives on the sheet and in
the fight with its stats and actions, and leaves when its duration does.

**Already supported by the model.** `kind: 'summon'`, `actsOn`, `expiresAtRound`
— see `COMBAT-SYNC-SPEC.md` R4, R5, R15. That is deliberate: the encounter is
being built so this is an addition, not a rewrite.

**Still needed.** Spell → template link and a duration on the spell data, a sum-
mon template file, the card on the player's turn, a token on the map.

### 12. Companions — after 11

**Wanted.** Persistent NPCs attached to a PC, visible on the dashboard and in
combat, acting on the owner's turn with the same readable action rows the player
uses for themselves.

**Same shape as summons** (`kind: 'companion'`, no expiry). Needs an attach and
manage UI on the dashboard, persistence with the character, and a token.

**One caution.** Every attached NPC adds a second actor to a turn. Present it as
a single line that expands, never as a second full card, or the turn length
problem comes straight back.

## Rejected — with the reason, so it doesn't come back

- **Pre-roll bank.** Invites fudging at these tables, and a GM rolling for a
  player doesn't feel fair.
- **Resolution lines added to attack cards.** The system is deliberately thinner
  than that; the extra surface would cost more time than it saves.
- **Pre-staged encounters / pawn boxes.** Play is theatre of the mind. Nobody is
  placing anything.
- **Retuning damage or HP.** Settled 30 Oct 2026.

## Settled

- **Multipliers are additive.** Every stacking multiplier adds its bonus; they do
  not compound. Applies going forward.
- **FP costs and HP values** were audited against the reference tables.
- **Item values are automatic** through the item picker.
- **Alchemy GM tool** is built: ingredients in, legality and expression out.
