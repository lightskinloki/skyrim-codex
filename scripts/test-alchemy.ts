/**
 * Validates the Essence engine against the four worked examples printed in
 * "Alchemy GM Reference" Section 8, plus the paralysis threshold from Section 9.
 * Run: node scripts/.test-alchemy.cjs  (bundled from this file with esbuild)
 */
import { readBrew, negationSeverity } from '@/utils/alchemy';
import { INGREDIENTS, findIngredient } from '@/data/alchemy';

let failures = 0;

function check(label: string, condition: boolean, detail = '') {
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function section(title: string) {
  console.log(`\n${title}`);
}

// ── Negation tier ladder (Section 3, read down to first match) ────────────
section('Negation severity');
check('both primary collapses', negationSeverity('P', 'P') === 'primary');
check('secondary vs primary is secondary', negationSeverity('S', 'P') === 'secondary');
check('primary vs secondary is secondary', negationSeverity('P', 'S') === 'secondary');
check('tertiary vs primary is tertiary', negationSeverity('T', 'P') === 'tertiary');
check('secondary vs tertiary is tertiary', negationSeverity('S', 'T') === 'tertiary');

// ── Catalogue integrity ───────────────────────────────────────────────────
section('Catalogue');
check('catalogue loaded', INGREDIENTS.length > 150, `got ${INGREDIENTS.length}`);
check('no duplicate names', new Set(INGREDIENTS.map(i => i.name.toLowerCase())).size === INGREDIENTS.length);
check('every ingredient has a primary essence', INGREDIENTS.every(i => i.essences.some(([, t]) => t === 'P')));
check('Imp Stool found by name', findIngredient('imp stool')?.name === 'Imp Stool');
check("apostrophe names resolve", findIngredient('giants toe')?.name === "Giant's Toe");

// ── Example 1: the basic healing potion ───────────────────────────────────
section('Example 1 — Blue Mountain Flower + Wheat');
{
  const [reading] = readBrew([{ name: 'Blue Mountain Flower' }, { name: 'Wheat' }]);
  check('one pair checked', reading.pairCount === 1);
  check('no negation', reading.findings.length === 0, JSON.stringify(reading.findings));
  check('does not collapse', reading.collapsed === false);
  const vitalis = reading.expressed.find(e => e.essence === 'VITALIS');
  check('VITALIS expresses', Boolean(vitalis));
  check('VITALIS is amplified (two sources)', vitalis?.amplified === true);
  check('VITALIS is primary', vitalis?.tier === 'P');
  check('reads as 4 HP at Standard', reading.effects.some(e => e.value.includes('4 HP')));
}

// ── Example 2: the poison blade ──────────────────────────────────────────
section('Example 2 — Deathbell + Skeever Tail');
{
  const [reading] = readBrew([{ name: 'Deathbell' }, { name: 'Skeever Tail' }]);
  check('one pair checked', reading.pairCount === 1);
  check('exactly one opposition', reading.findings.length === 1);
  check('tertiary negation only', reading.findings[0]?.severity === 'tertiary');
  const pair = [reading.findings[0]?.essenceA, reading.findings[0]?.essenceB].sort().join('/');
  check('GRAVITAS vs AGILITAS', pair === 'AGILITAS/GRAVITAS', pair);
  check('does not collapse', reading.collapsed === false);
  check('VENITAS amplified', reading.expressed.find(e => e.essence === 'VENITAS')?.amplified === true);
}

// ── Example 3: fire resistance ───────────────────────────────────────────
section('Example 3 — Snowberries + Fire Salts + Nordic Barnacle');
{
  const readings = readBrew([{ name: 'Snowberries' }, { name: 'Fire Salts' }, { name: 'Nordic Barnacle' }]);
  const reading = readings.find(r => r.mostApplicable) ?? readings[0];
  check('three pairs checked', reading.pairCount === 3);
  check('does not collapse', reading.collapsed === false);
  const fortitas = reading.expressed.find(e => e.essence === 'FORTITAS');
  check('FORTITAS triple-sourced', fortitas?.sources.length === 3, JSON.stringify(fortitas?.sources));
  const secondary = reading.findings.filter(f => f.severity === 'secondary');
  const glaciesIgnis = secondary.some(
    f =>
      (f.essenceA === 'GLACIES' && f.essenceB === 'IGNIS') ||
      (f.essenceA === 'IGNIS' && f.essenceB === 'GLACIES'),
  );
  check('GLACIES vs IGNIS secondary negation present', glaciesIgnis);
  check('reads as resistance, not damage', reading.flags.some(f => f.kind === 'resistance'));
  check('primary reading is the documented one (base Fire Salts)', !reading.label.includes('resistance'), reading.label);
}

// ── Example 4: the disastrous brew ───────────────────────────────────────
section('Example 4 — Blue Mountain Flower + Imp Stool');
{
  const readings = readBrew([{ name: 'Blue Mountain Flower' }, { name: 'Imp Stool' }]);
  const reading = readings[0];
  check('collapses', reading.collapsed === true);
  check('collapse is flagged', reading.flags.some(f => f.kind === 'collapse'));
  check('primary negation found', reading.findings.some(f => f.severity === 'primary'));
  check('no effects produced', reading.effects.length === 0);
}

// ── Internal opposition (the reference's per-ingredient GM notes) ─────────
section('Internal opposition');
{
  const [root] = readBrew([{ name: 'Canis Root' }, { name: 'Lavender' }]);
  const internal = root.findings.filter(f => f.internal);
  check('Canis Root carries one internal finding', internal.length === 1, JSON.stringify(internal));
  check('internal finding is secondary negation', internal[0]?.severity === 'secondary');
  const pair = [internal[0]?.essenceA, internal[0]?.essenceB].sort().join('/');
  check('it is AGILITAS vs GRAVITAS', pair === 'AGILITAS/GRAVITAS', pair);
  check(
    "Canis Root's own GRAVITAS is significantly weakened",
    root.expressed.find(e => e.essence === 'GRAVITAS')?.weakened === 'significantly',
  );
  check(
    'no slow effect from a self-cancelled GRAVITAS',
    !root.effects.some(e => e.essence === 'GRAVITAS'),
  );
  check('the conflict is flagged for the GM', root.flags.some(f => f.kind === 'internal-conflict'));
  check('the internal conflict does not collapse the brew', root.collapsed === false);

  const [spadetail] = readBrew([{ name: 'Cyrodilic Spadetail' }, { name: 'Lavender' }]);
  check(
    "Cyrodilic Spadetail's own conflict weakens both Essences",
    spadetail.expressed.find(e => e.essence === 'GRAVITAS')?.weakened === 'significantly' &&
      spadetail.expressed.find(e => e.essence === 'AGILITAS')?.weakened === 'significantly',
  );

  const [voidSalts] = readBrew([{ name: 'Void Salts' }, { name: 'Glowing Mushroom' }]);
  check(
    "Void Salts' own FULGUR[P] weakens its CAECITAS",
    voidSalts.expressed.find(e => e.essence === 'CAECITAS')?.weakened === 'significantly',
  );
  check(
    'no invisibility read from Void Salts',
    !voidSalts.effects.some(e => e.essence === 'CAECITAS'),
  );

  const [giantsToe] = readBrew([{ name: "Giant's Toe" }, { name: 'Lavender' }]);
  check(
    "Giant's Toe's own ANIMA[P] weakens its FORTITAS",
    giantsToe.expressed.find(e => e.essence === 'FORTITAS')?.weakened === 'significantly',
  );

  const [clean] = readBrew([{ name: 'Blue Mountain Flower' }, { name: 'Wheat' }]);
  check('clean ingredients raise no internal finding', clean.findings.every(f => !f.internal));
}

// ── Multiple expressions: every reading offered, one marked live ──────────
section('Multiple expressions');
{
  const readings = readBrew([{ name: 'Thistle Branch' }, { name: 'Frost Salts' }]);
  check('both Thistle Branch and Frost Salts expressions are offered', readings.length === 4, `got ${readings.length}`);
  check('every reading has its own label', new Set(readings.map(r => r.label)).size === readings.length);
  const live = readings.filter(r => r.mostApplicable);
  check('exactly one reading is marked live', live.length === 1, `got ${live.length}`);
  check(
    'the cold expression of Thistle Branch is the supported one',
    live[0]?.label.includes('Resisting cold') ?? false,
    live[0]?.label,
  );

  const clash = readBrew([{ name: 'Thistle Branch' }, { name: 'Canis Root' }]);
  check('two expressions, two readings', clash.length === 2, `got ${clash.length}`);
  const slowReading = clash.find(r => r.label === 'Thistle Branch + Canis Root');
  check('reading it as a slow collapses the brew', slowReading?.collapsed === true);
  const clashLive = clash.filter(r => r.mostApplicable);
  check('exactly one reading survives', clashLive.length === 1, `got ${clashLive.length}`);
  check(
    'the cold expression is the one that works',
    clashLive[0]?.label.includes('Resisting cold') ?? false,
    clashLive[0]?.label,
  );
  check('the surviving reading does not collapse', clashLive[0]?.collapsed === false);
  check(
    'its GRAVITAS is significantly weakened',
    clashLive[0]?.expressed.find(e => e.essence === 'GRAVITAS')?.weakened === 'significantly',
  );
}

// ── Paralysis threshold (Section 9 + GM ruling: 3 unopposed stacks) ──────
section('Paralysis');
{
  const [clean] = readBrew([{ name: 'Spriggan Sap' }, { name: 'Juniper Berries' }]);
  check('two AGILITAS[P] sources is paralysis', clean.flags.some(f => f.kind === 'paralysis'));

  const [selfCancelled] = readBrew([{ name: 'Canis Root' }, { name: 'Juniper Berries' }]);
  check(
    "Canis Root cannot dilute with a GRAVITAS its own AGILITAS cancels",
    selfCancelled.flags.some(f => f.kind === 'paralysis'),
  );
  check('it is not reported as diluted', !selfCancelled.flags.some(f => f.kind === 'diluted'));
  check(
    'a paralysing compound does not also fortify Agility',
    !selfCancelled.effects.some(e => e.essence === 'AGILITAS'),
  );

  const [diluted] = readBrew([
    { name: 'Canis Root' },
    { name: 'Juniper Berries' },
    { name: 'Deathbell' },
  ]);
  check('a real GRAVITAS[S] source dilutes the stack', diluted.flags.some(f => f.kind === 'diluted'));
  check('diluted brew is not called paralysis', !diluted.flags.some(f => f.kind === 'paralysis'));
}

// ── Single ingredient and unknown ingredient ──────────────────────────────
section('Edge cases');
{
  const [single] = readBrew([{ name: 'Blue Mountain Flower' }]);
  check('single ingredient releases primary only', single.expressed.every(e => e.tier === 'P'));
  check('single ingredient is flagged', single.flags.some(f => f.kind === 'single-ingredient'));
  check('single ingredient checks no pairs', single.pairCount === 0);

  const [unknown] = readBrew([{ name: 'Sload Teeth' }]);
  check('unknown ingredient is flagged, not guessed', unknown.flags.some(f => f.kind === 'unknown'));

  const [sapient] = readBrew([{ name: 'Human Heart' }, { name: 'Lavender' }]);
  check('sapient ingredient is flagged', sapient.flags.some(f => f.kind === 'sapient'));
}

// ── Effect text against the plain rules handout ──────────────────────────
// "Ismara's Note One -- Mechanics Companion" is the table-facing version of
// the rules. FORTITAS has two readings there: flat DR on its own, half damage
// from the element once an elemental Essence is in the pot.
section('Effect text (Mechanics Companion)');
{
  const [plain] = readBrew([{ name: 'Nordic Barnacle' }, { name: 'Scaly Pholiota' }]);
  check(
    'FORTITAS alone is flat DR, not resistance',
    plain.effects.find(e => e.essence === 'FORTITAS')?.value === '+1 DR, 3 rounds',
    plain.effects.find(e => e.essence === 'FORTITAS')?.value,
  );

  const [potentPlain] = readBrew([{ name: 'Nordic Barnacle' }, { name: 'Scaly Pholiota' }], { quality: 'Potent' });
  check(
    'Potent FORTITAS alone is +2 DR for 3 rounds',
    potentPlain.effects.find(e => e.essence === 'FORTITAS')?.value === '+2 DR, 3 rounds',
    potentPlain.effects.find(e => e.essence === 'FORTITAS')?.value,
  );

  const resistance = readBrew([{ name: 'Snowberries' }, { name: 'Fire Salts' }]);
  const fireReading = resistance.find(r => r.mostApplicable) ?? resistance[0];
  check(
    'FORTITAS beside an elemental reads as half damage',
    fireReading.effects.find(e => e.essence === 'FORTITAS')?.value.includes('half damage') ?? false,
    fireReading.effects.find(e => e.essence === 'FORTITAS')?.value,
  );

  const [shock] = readBrew([{ name: 'Glowing Mushroom' }, { name: 'Nordic Barnacle' }]);
  check(
    'FULGUR carries its disadvantage rider',
    shock.effects.find(e => e.essence === 'FULGUR')?.value.includes('disadvantage') ?? false,
    shock.effects.find(e => e.essence === 'FULGUR')?.value,
  );
}

// ── Quality ladder ────────────────────────────────────────────────────────
section('Quality ladder');
{
  const [standard] = readBrew([{ name: 'Blue Mountain Flower' }, { name: 'Wheat' }], { quality: 'Standard' });
  const [potent] = readBrew([{ name: 'Blue Mountain Flower' }, { name: 'Wheat' }], { quality: 'Potent' });
  const [exceptional] = readBrew([{ name: 'Blue Mountain Flower' }, { name: 'Wheat' }], { quality: 'Exceptional' });
  check('Standard is 4 HP', standard.effects.some(e => e.value.includes('4 HP')));
  check('Potent is 8 HP', potent.effects.some(e => e.value.includes('8 HP')));
  check('Exceptional is 12 HP', exceptional.effects.some(e => e.value.includes('12 HP')));
}

console.log(`\n${failures === 0 ? 'All checks passed.' : `${failures} check(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);
