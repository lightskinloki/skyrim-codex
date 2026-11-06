// Checks for the encounter state module (Phase 0 of combat sync).
// Run: npm run test:encounter
import {
  Combatant,
  EncounterState,
  createEncounter,
  encounterReducer,
  activeCombatant,
  attachedTo,
  initiativeTies,
} from '@/state/encounter';

let passed = 0;
const failures: string[] = [];

function check(label: string, condition: boolean, detail = '') {
  if (condition) {
    passed++;
  } else {
    failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
  }
}

const pc = (id: string, initiative: number, agility = 10): Combatant => ({
  id, name: id, kind: 'pc', hp: 40, maxHp: 40, dr: 2, initiative, agility,
  conditions: [], pos: { x: 0, y: 0 }, move: 6, actions: { major: 1, minor: 1 },
});

const summon = (id: string, actsOn: string, expiresAtRound: number): Combatant => ({
  id, name: id, kind: 'summon', hp: 20, maxHp: 20, dr: 0, actsOn, expiresAtRound,
  conditions: [], pos: { x: 0, y: 0 }, move: 6, actions: { major: 1, minor: 1 },
});

function seed(): EncounterState {
  let s = createEncounter({
    blockId: 'test-block',
    trackers: { bar: { hp: { one: 300, two: 300 }, down: { one: false, two: false } } },
    fields: { phase: 'Bar one' },
  });
  s = encounterReducer(s, { type: 'combatant.add', combatant: pc('saijah', 18, 14) });
  s = encounterReducer(s, { type: 'combatant.add', combatant: pc('orion', 11, 9) });
  s = encounterReducer(s, { type: 'combatant.add', combatant: pc('krusp', 14, 10) });
  return s;
}

// --- trackers -------------------------------------------------------------
{
  let s = seed();
  const before = s.seq;
  s = encounterReducer(s, { type: 'tracker.damage', trackerId: 'bar', targetId: 'one', amount: 26 });
  check('damage reduces HP', s.trackers.bar.hp.one === 274, `got ${s.trackers.bar.hp.one}`);
  check('damage bumps seq', s.seq === before + 1);

  s = encounterReducer(s, { type: 'tracker.damage', trackerId: 'bar', targetId: 'one', amount: 500 });
  check('HP clamps at zero', s.trackers.bar.hp.one === 0);
  check('zero HP marks the target down', s.trackers.bar.down.one === true);

  s = encounterReducer(s, { type: 'tracker.setHp', trackerId: 'bar', targetId: 'one', hp: 120 });
  check('typed HP clears the down flag', s.trackers.bar.down.one === false);

  s = encounterReducer(s, { type: 'tracker.setDown', trackerId: 'bar', targetId: 'two', down: true, maxHp: 300 });
  check('Down zeroes the target', s.trackers.bar.hp.two === 0);
  s = encounterReducer(s, { type: 'tracker.setDown', trackerId: 'bar', targetId: 'two', down: false, maxHp: 300 });
  check('Restore returns it to max', s.trackers.bar.hp.two === 300);

  const unknown = encounterReducer(s, { type: 'tracker.damage', trackerId: 'nope', targetId: 'x', amount: 5 });
  check('unknown tracker is ignored', unknown === s);
}

// --- order ----------------------------------------------------------------
{
  let s = seed();
  check('order is lowest initiative first',
    s.order.map((o) => o.combatantId).join(',') === 'orion,krusp,saijah',
    s.order.map((o) => o.combatantId).join(','));
  check('active combatant is the first slot', activeCombatant(s)?.id === 'orion');

  s = encounterReducer(s, { type: 'combatant.add', combatant: summon('flame-atronach', 'saijah', 3) });
  check('an attached summon gets no turn slot', s.order.length === 3);
  check('the summon resolves on its owner', attachedTo(s, 'saijah').map((c) => c.id).join(',') === 'flame-atronach');
  check('the summon is still a combatant', !!s.combatants['flame-atronach']);
}

// --- initiative ties ------------------------------------------------------
// This system rerolls a tie; the app reports it and leaves order alone.
{
  let s = createEncounter({ blockId: 'test-ties' });
  s = encounterReducer(s, { type: 'combatant.add', combatant: pc('saijah', 12, 18) });
  s = encounterReducer(s, { type: 'combatant.add', combatant: pc('orion', 12, 6) });
  s = encounterReducer(s, { type: 'combatant.add', combatant: pc('krusp', 7, 10) });

  check('a tie keeps the order they were added in, not Agility',
    s.order.map((o) => o.combatantId).join(',') === 'krusp,saijah,orion',
    s.order.map((o) => o.combatantId).join(','));
  const ties = initiativeTies(s.combatants);
  check('the tie is reported', ties.length === 1 && ties[0].initiative === 12, JSON.stringify(ties));
  check('the tie names both combatants', ties[0]?.combatantIds.join(',') === 'saijah,orion');

  s = encounterReducer(s, { type: 'combatant.setInitiative', id: 'saijah', initiative: 20 });
  check('rerolling clears the tie', initiativeTies(s.combatants).length === 0);
  check('the reroll re-sorts the order',
    s.order.map((o) => o.combatantId).join(',') === 'krusp,orion,saijah',
    s.order.map((o) => o.combatantId).join(','));

  const unrolled = createEncounter({ blockId: 'test-unrolled' });
  const noRoll = encounterReducer(unrolled, { type: 'combatant.add', combatant: { ...pc('ghost', 0, 10), initiative: undefined } });
  check('a combatant with no roll is not a tie', initiativeTies(noRoll.combatants).length === 0);

  // Same initiative as its owner, but attached combatants never take a turn.
  s = encounterReducer(s, { type: 'combatant.add', combatant: { ...summon('wolf', 'krusp', 2), initiative: 7 } });
  check('an attached summon never joins a tie', initiativeTies(s.combatants).every((t) => !t.combatantIds.includes('wolf')));
}

// --- turn cycle -----------------------------------------------------------
{
  let s = seed();
  s = encounterReducer(s, { type: 'turn.end' });
  check('turn.end moves to the next slot', s.activeIndex === 1, `index ${s.activeIndex}`);
  s = encounterReducer(s, { type: 'turn.end' });
  s = encounterReducer(s, { type: 'turn.end' });
  check('turn.end stops at the last slot until the round advances', s.activeIndex === 2, `index ${s.activeIndex}`);
  s = encounterReducer(s, { type: 'round.advance' });
  check('a new round starts at the top of the order', s.activeIndex === 0, `index ${s.activeIndex}`);
}

// --- rounds and expiry ----------------------------------------------------
{
  let s = seed();
  s = encounterReducer(s, { type: 'combatant.add', combatant: summon('wolf', 'orion', 2) });
  s = encounterReducer(s, { type: 'round.advance' });
  check('round advances to 2', s.round === 2);
  check('a summon lasting through round 2 is still here', !!s.combatants.wolf);
  s = encounterReducer(s, { type: 'round.advance' });
  check('the summon expires after its last round', !s.combatants.wolf);
  check('expiry leaves the order alone', s.order.length === 3);

  s = encounterReducer(s, { type: 'turn.end' });
  const doneAfter = s.order.filter((o) => o.done).length;
  s = encounterReducer(s, { type: 'round.advance' });
  check('a new round clears the done flags', s.order.every((o) => !o.done), `${doneAfter} were done`);
}

// --- damage through DR ----------------------------------------------------
{
  let s = seed();
  s = encounterReducer(s, { type: 'combatant.damage', id: 'saijah', amount: 26 });
  check('damage subtracts DR', s.combatants.saijah.hp === 16, `hp ${s.combatants.saijah.hp}`);
  check('the log states the arithmetic', s.entries.at(-1)?.text.includes('after DR 2') === true);

  s = encounterReducer(s, { type: 'combatant.damage', id: 'saijah', amount: 26, bypassDr: true });
  check('bypassDr skips the subtraction', Math.max(0, s.combatants.saijah.hp) === 0);
  check('HP never goes negative', s.combatants.saijah.hp === 0, `hp ${s.combatants.saijah.hp}`);

  s = encounterReducer(s, { type: 'combatant.heal', id: 'saijah', amount: 100 });
  check('healing caps at max HP', s.combatants.saijah.hp === 40);
}

// --- conditions and outcomes ---------------------------------------------
{
  let s = seed();
  s = encounterReducer(s, { type: 'condition.add', id: 'orion', label: 'prone' });
  check('a condition is added', s.combatants.orion.conditions.length === 1);
  s = encounterReducer(s, { type: 'condition.clear', id: 'orion', label: 'prone' });
  check('a condition is cleared', s.combatants.orion.conditions.length === 0);

  s = encounterReducer(s, { type: 'outcome.report', combatantId: 'krusp', outcome: 'success_complication', source: 'physical' });
  const entry = s.entries.at(-1);
  check('the outcome is logged against the character', entry?.combatantId === 'krusp');
  check('the outcome keeps its tier', entry?.outcome === 'success_complication');
  check('the outcome records that it came from a physical die', entry?.source === 'physical');
}

// --- reset ----------------------------------------------------------------
{
  let s = seed();
  s = encounterReducer(s, { type: 'tracker.damage', trackerId: 'bar', targetId: 'one', amount: 250 });
  s = encounterReducer(s, { type: 'round.advance' });
  s = encounterReducer(s, { type: 'log.set', text: 'mid-fight' });
  const seqBefore = s.seq;

  s = encounterReducer(s, {
    type: 'encounter.reset',
    init: {
      blockId: 'test-block',
      trackers: { bar: { hp: { one: 300, two: 300 }, down: { one: false, two: false } } },
      fields: { phase: 'Bar one' },
    },
  });
  check('reset restores the bars', s.trackers.bar.hp.one === 300);
  check('reset returns to round 1', s.round === 1);
  check('reset empties the log', s.log === '' && s.entries.length === 0);
  check('reset clears the combatants', Object.keys(s.combatants).length === 0);
  check('reset still bumps seq', s.seq === seqBefore + 1);
}

// --- report ---------------------------------------------------------------
console.log(`\nencounter: ${passed} checks passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.log(`  FAIL ${f}`);
  process.exit(1);
}
