// Checks for bracing: the shield's number, the riders, and the fact that a
// shield is not also passive armour.
// Run: npm run test:brace
import { braceProfile, braceSummary } from '@/utils/brace';
import { calculateTotalDR } from '@/utils/characterCalculations';
import { officialEquipment } from '@/data/equipment';
import { Character, Equipment, StandingStone } from '@/types/character';
import { combatManager } from '@/lib/combatManager';

let passed = 0;
const failures: string[] = [];

function check(label: string, condition: boolean, detail = '') {
  if (condition) passed++;
  else failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
}

const item = (name: string, type: Equipment['type'], dr?: number): Equipment => {
  const found = officialEquipment.find((e) => e.name === name);
  return { id: name, name, type, dr: dr ?? (found as { dr?: number } | undefined)?.dr, description: found?.description };
};

const stone = (id: string): StandingStone =>
  ({ id, name: id, archetype: 'test', baseStats: { might: 10, agility: 10, magic: 10, guile: 10 }, benefitName: '', benefitDescription: '' });

const character = (equipment: Equipment[]): Character =>
  ({
    id: 'test', name: 'Test', ap: 0, totalAp: 0,
    race: { id: 'nord', name: 'Nord', bonus: 'might', abilityName: '', abilityDescription: '', image: '' },
    standingStone: stone('warrior'),
    stats: { might: 10, agility: 10, magic: 10, guile: 10 },
    resources: { hp: { current: 20, max: 20 }, fp: { current: 10, max: 10 } },
    skills: [], equipment, inventory: { gold: 0, items: [] },
    progression: { combatProwessUnlocked: { adept: false, expert: false, master: false }, arcaneStudiesUnlocked: { adept: false, expert: false, master: false } },
  }) as Character;

// --- no shield -------------------------------------------------------------
{
  const p = braceProfile(character([item('Steel Plate Armor', 'armor')]));
  check('no shield means no brace', p.shield === null && p.bonus === 0);
  check('the card says why', /shield only/i.test(braceSummary(p)), braceSummary(p));
  check('a sword does not become a parry', braceProfile(character([item('Iron Sword', 'weapon', 3)])).bonus === 0);
}

// --- real shields ----------------------------------------------------------
{
  const steel = braceProfile(character([item('Steel Shield', 'shield')]));
  check('steel shield braces for 2', steel.bonus === 2, String(steel.bonus));
  check('steel shield has no rider', steel.riders.length === 0, steel.riders.join('|'));

  const dwarven = braceProfile(character([item('Dwarven Shield', 'shield')]));
  check('dwarven shield braces for 3', dwarven.bonus === 3, String(dwarven.bonus));
  check('dwarven rider survives', dwarven.riders.some((r) => /minor action/i.test(r)), dwarven.riders.join('|'));

  const dragon = braceProfile(character([item('Dragon Shield', 'shield')]));
  check('dragon shield braces for 5', dragon.bonus === 5, String(dragon.bonus));
  check('dragon rider names dragons', dragon.riders.some((r) => /dragon/i.test(r)));
}

// --- a shield is not passive DR -------------------------------------------
{
  const dr = calculateTotalDR(
    [item('Steel Plate Armor', 'armor'), item('Steel Shield', 'shield')],
    stone('warrior'),
  );
  check('armour 4 + shield 2 gives DR 4 while unbraced', dr === 4, String(dr));
  const lord = calculateTotalDR([item('Steel Plate Armor', 'armor')], stone('lord'));
  check('the Lord stone still adds 1', lord === 5, String(lord));
}

// --- a brace is spent by the next hit -------------------------------------
{
  let state = combatManager.initializeCombat();
  let c = combatManager.createCustomCombatant({
    name: 'Holder', type: 'player', hp: 40, dr: 4,
    stats: { might: 10, agility: 10, magic: 10, guile: 10 },
  });
  state = combatManager.addCombatant(state, c);
  state = combatManager.addStatusEffect(state, c.id, 'bracing', 1, 'Brace', undefined, 3);
  const armed = state.combatants[0];
  check('the brace rides as a status with its number', armed.statusEffects.some((e) => e.bonusValue === 3));

  state = combatManager.applyDamage(state, c.id, 9, 'Test');
  check('DR 4 + brace 3 leaves 2 through', state.combatants[0].hp.current === 38, String(state.combatants[0].hp.current));
  check('the brace is spent', state.combatants[0].statusEffects.every((e) => e.type !== 'bracing'));

  state = combatManager.applyDamage(state, c.id, 9, 'Test');
  check('the second hit gets armour only', state.combatants[0].hp.current === 33, String(state.combatants[0].hp.current));
}

console.log(`\nbrace: ${passed} checks passed, ${failures.length} failed`);
for (const failure of failures) console.log(`  FAIL ${failure}`);
if (failures.length > 0) process.exit(1);
