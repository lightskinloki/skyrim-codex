# Table sync — decisions (31 Oct 2026)

The GM's answers, recorded so they survive a lost session. Where this file
and `COMBAT-SYNC-SPEC.md` disagree, **this file wins.** Nothing here is a
proposal; every line is a decision the GM made.

## The shape of it

- The app is only ever run from the hosted site
  (`skyrim-codex.frankbrown8810.workers.dev`), later a purchased on-machine app.
  The GM never runs a local server, a .bat file, or anything from the repo.
- **The GM's browser is the host.** Devices connect to each other directly
  (WebRTC). The Cloudflare worker only introduces devices; game data goes
  device to device. This keeps Privacy-by-Design and lets a future on-machine
  build work with no internet. Direct is preferred; the worker relay is the
  fallback (below).
- **Room code:** a new code every time the GM opens GM mode. Only a reload of
  that same page mid-session keeps it; leaving GM mode or closing the tab ends
  it.
- **Any network:** if devices can't reach each other directly (guest Wi-Fi,
  mobile data), table messages go through the worker instead — the join code
  works anywhere, like Jackbox. The worker stores nothing.
- Goal: zero friction for players, near-zero for the GM.
- **Release:** the site rebuilds from a push to `main`. Nothing is pushed until
  the whole feature is confirmed working locally — then one push. Half
  implementations never reach players.
- The worker is still needed for the first handshake between devices; fine
  until the standalone app exists.

## The room (whole session, not just combat)

- Session starts → players join the room: a code **and a QR/link** on the GM's
  screen. The QR opens the site and joins the room directly.
- A player joins with the character on their device. Load/import already
  exist; nothing new to pick.
- The GM sees every joined player's **live, real character sheet** (the same
  sheet component, reused) at any time: stats, HP/FP, items, rolls, everything.
- The GM can add, remove or change **anything** on a player's sheet, and it
  changes on their device.
- A GM edit is marked on the player's sheet by a subtle indicator (e.g. an
  asterisk / brief highlight on the changed field) — **no popup, no banner**.
  Everyone is at the same table; the GM says it out loud.
- Players see no other player's sheet. In combat they see names and turn order
  only.

## Roll cards

- Purpose: the GM gets the **outcome**, not a raw number ("12 on Guile" is
  meaningless without knowing her Guile).
- The player picks the outcome they got: crit, success, success with
  complication, fail, crit fail. No number entry, no difficulty picker — the GM
  says the modifier out loud ("Guile, −4"), the player rolls, does the math, taps
  the outcome.
- Using the in-app digital dice selects the outcome automatically.
- Available always (not only in combat). Never a separate modal the player has
  to open and close. On the main dashboard as a card; in Combat Mode however
  fits best. Revisit in the redesign.
- The GM has a running log of every player's roll outcomes for the session.

## Combat

- The GM adds players to a fight with the existing Add list in the Combat tab;
  that list shows **players who joined the room**, not characters saved on the
  GM's device. No auto-adding the whole party (several fights can run).
- Only the players in a fight get its combat-mode notification.
- The notification is **tap to open** the player's existing Combat Mode. Never
  yank a player's screen.
- Initiative: player or GM enters the roll; it goes into turn order
  automatically; the GM can edit the order. **Tied actors reroll** — the app
  flags the tie and waits for rerolls. (Agility as a tiebreaker may come later;
  if so it would be higher Agility, an inversion of the rest of the system.)
- Players see **whose turn it is and how many turns until theirs. Nothing more.**
- Enemies show to players only as "Enemy turn" / "Villain action", never by
  name, unless the GM reveals that enemy's name (per-enemy reveal).
- A player's action slots reset automatically when their turn starts — without
  re-upping per-adventure or per-encounter abilities.
- Players end their own turn by default; the GM can also advance.
- Several fights at once: tabs or a selector in the Combat tab, each with its
  own initiative and GM turn. A player is in at most one fight. Get one working
  first.
- Forge combat blocks connect to the tracker: Deploy puts the block's enemies in
  the tracker, the block's HP bars are the boss's HP, damage from either screen
  updates both, phases/thresholds fire off the tracker HP.
- Villain actions come from the Forge combat blocks and fire automatically per
  that villain's rules.

## Damage and resources — everything auto-applies, instantly, with Undo

- Damage is formula-driven (preset damage, flats, additive multipliers, DR).
  No damage rolls.
- Player attack: pick the attack (existing Combat Mode), pick the target, roll,
  tap the outcome. Success applies the attack's damage; crit adds one x2 step;
  fail applies nothing. DR in the tracker.
- Success with complication: a **complication flag for the GM**; damage waits
  on the GM's card (it does not always apply, or apply in full).
- Multipliers and modifiers are applied by the **player's own actions**: using a
  perk/potion/ability applies it, and statuses it grants (Hidden, Invisible…) are
  set by the app and their multipliers apply automatically. The app already
  only offers what the character can use.
- Enemy attacks on a player: the GM's enemy card shows that enemy's attacks
  (all of them, if several); GM picks the attack and the player, taps the
  outcome; damage lands on the player's sheet.
- Area spells: the GM rolls every enemy's resist; a player rolls their own
  resist against an enemy's area spell. Failed resists take the damage.
- HP, FP, action use, status effects, enchantment charges, potion stacks, ammo:
  all synced both ways, all the time. There is no "real" copy — both stay equal.
- Block is **not** a reaction: brace is taken on the player's own turn
  (check the rules before building any reaction handling).
- Prone shows on the player's Combat Mode with its rule text and a "Stand up
  (Minor)" action.
- Spell damage values exist in the rules and must be added to the app's spell
  data (players always ask). Compare the players guide and GM guide spell lists;
  any number that differs goes to the GM case by case.

## Death clock

- At 0 HP: show the down state and the deadline.
- Intent: there is always a full round of turns for others to act before death.
  Any healing item applied counts as first aid / stabilisation to the next turn,
  even if it doesn't bring them up.
- The app enforces it; propose clearer rule wording to the GM.

## Summons and companions

- Shown on the GM tracker under their owner, no turn of their own (act on the
  owner's turn). Existing auto-add into Combat Mode stays.
