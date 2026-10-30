/**
 * Validates the Formula of Pain against the worked examples printed in
 * "Toryggs legacy/legendary difficulty" and "GM Guide/Reference tables".
 * Run: npm run test:damage
 */
import {
  CRIT_MULTIPLE,
  VULNERABILITY_MULTIPLE,
  auditReportedDamage,
  baseHit,
  describeStack,
  peakDamage,
  readDamage,
  totalMultiplier,
} from '@/utils/damage';

let failures = 0;

function check(label: string, condition: boolean, detail = '') {
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${label}${detail ? ` --- ${detail}` : ''}`);
  }
}

function section(title: string) {
  console.log(`\n${title}`);
}

// ── The law itself ────────────────────────────────────────────────────────
section('The additive multiplier law');
check('a x2 on a x2 is a x3', totalMultiplier([{ label: 'a', multiple: 2 }, { label: 'b', multiple: 2 }]) === 3);
check('a x3 with a x2 is a x4', totalMultiplier([{ label: 'a', multiple: 3 }, { label: 'b', multiple: 2 }]) === 4);
check('no multipliers is x1', totalMultiplier([]) === 1);
check('an x1 contributes no step', totalMultiplier([{ label: 'a', multiple: 1 }]) === 1);
check(
  'three x2s add to x4, never x8',
  totalMultiplier([
    { label: 'a', multiple: 2 },
    { label: 'b', multiple: 2 },
    { label: 'c', multiple: 2 },
  ]) === 4,
);
check('base hit sums the flats', baseHit([{ label: 'Claws', value: 14 }, { label: 'Fire', value: 2 }]) === 16);
check('crit is a x2 step', CRIT_MULTIPLE === 2);
check('vulnerability is a x2 step', VULNERABILITY_MULTIPLE === 2);

// ── Example: the Nova Strike (Titan Gloves + Crit) ────────────────────────
section('Nova Strike — Claws 14 + Fire 2, x2 item, x2 crit');
{
  const parts = [{ label: 'Claws', value: 14 }, { label: 'Fire', value: 2 }];
  const mults = [
    { label: 'Titan Gloves', multiple: 2 },
    { label: 'Critical Hit', multiple: 2 },
  ];
  const r = readDamage(parts, mults);
  check('base hit is 16', r.baseHit === 16);
  check('total multiplier is x3', r.totalMultiplier === 3);
  check('total damage is 48', r.totalDamage === 48, `got ${r.totalDamage}`);
  check('it is not 64 (the exponential error)', r.totalDamage !== 64);
}

// ── Example: the Assassin's Burst (Sneak x3 + Crit x2) ────────────────────
section("Assassin's Burst — Daedric Bow 9 + arrow 2, Sneak x3, Crit x2");
{
  const parts = [{ label: 'Daedric Bow', value: 9 }, { label: 'Ebony Arrow', value: 2 }];
  const mults = [
    { label: "Assassin's Blade (Sneak)", multiple: 3 },
    { label: 'Critical Hit', multiple: 2 },
  ];
  const r = readDamage(parts, mults);
  check('base hit is 11', r.baseHit === 11);
  check('total multiplier is x4', r.totalMultiplier === 4);
  check('total damage is 44', r.totalDamage === 44, `got ${r.totalDamage}`);
  check('it is not 66', r.totalDamage !== 66);
}

// ── Vulnerability is a step, never a multiplier on the total ──────────────
section('Vulnerability — a fire crit on a fire-vulnerable creature is x3, not x4');
{
  const parts = [{ label: 'Firebolt', value: 10 }];
  const mults = [
    { label: 'Critical Hit', multiple: CRIT_MULTIPLE },
    { label: 'Fire vulnerability', multiple: VULNERABILITY_MULTIPLE },
  ];
  const r = readDamage(parts, mults);
  check('total multiplier is x3', r.totalMultiplier === 3, `got ${r.totalMultiplier}`);
  check('total damage is 30', r.totalDamage === 30);
  check('it is not 40', r.totalDamage !== 40);
}

// ── Power attacks and augments are flats, not multipliers ────────────────
section('Flats before multipliers');
{
  const parts = [
    { label: 'Weapon', value: 7 },
    { label: 'Power Attack', value: 2 },
    { label: 'Amplify Augment', value: 3 },
  ];
  const r = readDamage(parts, [{ label: 'Critical Hit', multiple: 2 }]);
  check('augment joins the base hit', r.baseHit === 12);
  check('the crit doubles the whole base hit', r.totalDamage === 24);
}

// ── The report audit — the thing that would have caught Kyboh ────────────
section('Auditing a reported number');
{
  const parts = [{ label: 'Claws', value: 14 }];
  const mults = [
    { label: 'Titan Gloves', multiple: 2 },
    { label: 'Critical Hit', multiple: 2 },
  ];

  const capped = auditReportedDamage(parts, mults, 42);
  check('a number at the ceiling is legal', capped.ok === true);
  check('it reports the ceiling', capped.legalMax === 42, `got ${capped.legalMax}`);
  check('nothing is over', capped.over === 0);

  const under = auditReportedDamage(parts, mults, 30);
  check('a number under the ceiling is legal (DR, half, a forgotten step)', under.ok === true);

  const absurd = auditReportedDamage(parts, mults, 330);
  check('330 off base 14 with two x2s is illegal', absurd.ok === false);
  check('the legal ceiling is 42', absurd.legalMax === 42);
  check('it is 288 over', absurd.over === 288, `got ${absurd.over}`);
  check('the implied multiplier is ~x24', absurd.impliedMultiplier === 23.57, `got ${absurd.impliedMultiplier}`);
  check('the explanation names the ceiling', absurd.detail.includes('42'));

  const compounded = auditReportedDamage(parts, mults, 56);
  check('56 (the compounding result) is rejected', compounded.ok === false);
  check('because the additive ceiling is 42', compounded.legalMax === 42);
}

// ── No base hit at all ────────────────────────────────────────────────────
section('Edge cases');
{
  const empty = readDamage([], [{ label: 'Critical Hit', multiple: 2 }]);
  check('no flats gives zero damage', empty.totalDamage === 0);
  check('auditing against a zero base rejects anything positive', auditReportedDamage([], [], 10).ok === false);
  check('auditing zero against zero is legal', auditReportedDamage([], [], 0).ok === true);

  const ignored = readDamage([{ label: 'Weapon', value: 10 }], [{ label: 'Half damage', multiple: 0.5 }]);
  check('a sub-x2 value is not a damage step', ignored.totalMultiplier === 1);
  check('it is reported as ignored', ignored.ignored.length === 1);

  const negative = readDamage([{ label: 'Weapon', value: 5 }, { label: 'Curse', value: -8 }]);
  check('a base hit never goes below zero', negative.baseHit === 0);

  check('peak damage matches the readout', peakDamage(16, [{ label: 'a', multiple: 2 }, { label: 'b', multiple: 2 }]) === 48);

  const line = describeStack([{ label: 'Claws', value: 14 }, { label: 'Fire', value: 2 }], [
    { label: 'Titan Gloves', multiple: 2 },
    { label: 'Critical Hit', multiple: 2 },
  ]);
  check('the log line shows the sum, not a product', line.includes('16') && line.includes('x3') && line.includes('48'), line);
}

console.log(`\n${failures === 0 ? 'All checks passed.' : `${failures} check(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);
