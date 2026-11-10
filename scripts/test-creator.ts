// Checks for the creator's data and its artwork contract.
// Run: npm run test:creator
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { skills } from '@/data/skills';
import { kits } from '@/data/kits';
import { officialEquipment } from '@/data/equipment';
import { kitArtPath, skillArtPath } from '@/characters/creatorArt';

let passed = 0;
const failures: string[] = [];

function check(label: string, condition: boolean, detail = '') {
  if (condition) passed++;
  else failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
}

// --- the six kits ---------------------------------------------------------
{
  check('six starting kits', kits.length === 6, `${kits.length} kits`);

  const ids = new Set(kits.map((k) => k.id));
  check('kit ids are unique', ids.size === kits.length);

  const house = kits.filter((k) => k.house);
  check('three printed kits', kits.length - house.length === 3, `${house.length} house kits`);
  check('three house kits', house.length === 3, `${house.length} house kits`);

  for (const kit of kits) {
    check(`${kit.id} is named`, kit.name.length > 4);
    check(`${kit.id} says what it is for`, kit.description.length > 30);
    check(`${kit.id} has a weapon`, kit.equipment.some((e) => e.type === 'weapon'));
    check(`${kit.id} has armour`, kit.equipment.some((e) => e.type === 'armor' || e.type === 'shield'));
    check(`${kit.id} starts with gold`, kit.gold > 0, `${kit.gold}`);
    check(`${kit.id} has a pack`, kit.items.length > 0);

    for (const item of kit.equipment) {
      const official = officialEquipment.find((e) => e.name === item.name);
      check(`${kit.id} / ${item.name} is printed gear`, Boolean(official));
      if (!official) continue;
      // A kit has three wearable slots; the table also has `clothing`, and a
      // robe is worn in the armour slot. That is a mapping, not a mismatch.
      const matchesType = official.type === item.type || (official.type === 'clothing' && item.type === 'armor');
      check(`${kit.id} / ${item.name} type matches the table`, matchesType, `${item.type} vs ${official.type}`);
      check(
        `${kit.id} / ${item.name} numbers match the table`,
        official.damage === item.damage && official.dr === item.dr,
        `kit ${item.damage ?? `DR ${item.dr}`} vs table ${official.damage ?? `DR ${official.dr}`}`,
      );
    }
  }
}

// --- the artwork contract -------------------------------------------------
{
  const skillPaths = skills.map((s) => skillArtPath(s.id));
  const kitPaths = kits.map((k) => kitArtPath(k.id));

  check('one skill plate per skill', new Set(skillPaths).size === skills.length);
  check('one kit plate per kit', new Set(kitPaths).size === kits.length);
  check(
    'skill and kit filenames do not collide',
    new Set([...skillPaths, ...kitPaths]).size === skillPaths.length + kitPaths.length,
  );

  for (const path of [...skillPaths, ...kitPaths]) {
    check(`${path} is a jpg under images/`, /^\/images\/(skills|kits)\/[a-z-]+\.jpg$/.test(path), path);
  }

  // The ids in the brief and the ids in the data have to be the same list.
  const documented = new Set([...skillPaths, ...kitPaths]);
  check('nineteen plates in total', documented.size === 19, `${documented.size}`);

  // All thirteen skill plates are painted and shipped, and both the creator
  // and the character sheet bake the path in — so a rename has to fail here
  // rather than show up as an empty frame on a screen. The kits are still
  // being drawn, so they are deliberately not checked for existence.
  for (const path of skillPaths) {
    check(`${path} exists on disk`, existsSync(join(process.cwd(), 'public', path)), path);
  }
}

if (failures.length) {
  console.error(`\n${failures.length} failed, ${passed} passed\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`creator: ${passed} checks passed`);
