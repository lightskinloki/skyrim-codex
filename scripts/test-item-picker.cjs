// Adversarial checks for the item picker: rulebook fidelity, helper edge cases,
// resolver behaviour, and the real drill-down/add/drink flow in a browser.
// Uses an isolated browser profile and a scratch character library only.
const { chromium } = require('C:/Users/fbrown/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DOC_PATH = path.resolve(__dirname, '../../Frogs-5-skyrim/Gear, Consumables, and the forge');
const URL = process.env.APP_TEST_URL || 'http://127.0.0.1:8094';

const RARITIES = new Set([
  'Common', 'Uncommon', 'Rare', 'Super Rare',
  'Equipment', 'Material', 'Currency', 'Miscellaneous', 'Food',
]);

const SECTIONS = [
  { key: 'restorative', title: 'Potions (Restorative)', header: 'Potion Name' },
  { key: 'enhancement', title: 'Potions (Enhancement)', header: 'Potion Name' },
  { key: 'poison', title: 'Poisons', header: 'Poison Name' },
  { key: 'misc', title: 'Equipment & Miscellaneous', header: 'Item Name' },
];

function norm(text) {
  return (text ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\s*:\s*/g, ': ')
    .trim()
    .replace(/\.$/, '')
    .toLowerCase();
}

function parseDocTables(text) {
  const lines = text.split(/\r?\n/);
  const tables = {};
  for (const section of SECTIONS) {
    const titleIndex = lines.findIndex(line => line.trim() === section.title);
    assert.ok(titleIndex >= 0, `doc section missing: ${section.title}`);
    const headerIndex = lines.findIndex((line, index) => index > titleIndex && line.trim() === section.header);
    assert.ok(headerIndex >= 0, `doc header missing: ${section.header}`);

    const rows = [];
    let i = headerIndex + 3; // name, rarity/category, effect headers
    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line) break;
      if (!RARITIES.has((lines[i + 1] ?? '').trim())) {
        i += 1;
        continue;
      }
      const name = line;
      const rarity = lines[i + 1].trim();
      const effectLines = [];
      let j = i + 2;
      while (j < lines.length) {
        const candidate = lines[j].trim();
        if (!candidate) break;
        if (RARITIES.has((lines[j + 1] ?? '').trim())) break;
        effectLines.push(candidate);
        j += 1;
      }
      rows.push({ name, rarity, effect: effectLines.join(' ') });
      i = j;
    }
    tables[section.key] = rows;
  }
  return tables;
}

(async () => {
  const docTables = parseDocTables(fs.readFileSync(DOC_PATH, 'utf8'));
  // Guard against a parser change silently shrinking coverage.
  assert.equal(docTables.restorative.length, 12, 'restorative potion rows');
  assert.equal(docTables.enhancement.length, 6, 'enhancement potion rows');
  assert.equal(docTables.poison.length, 4, 'poison rows');
  assert.equal(docTables.misc.length, 10, 'miscellaneous rows');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  });

  try {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(URL);

    // ── Pass 1: data invariants + pure helper behaviour, in the app runtime ──
    const audit = await page.evaluate(async () => {
      const { itemTree, RESTORE_LADDER } = await import('/src/data/itemTree.ts');
      const { consumables } = await import('/src/data/items.ts');
      const picker = await import('/src/utils/itemPicker.ts');
      const lookup = await import('/src/utils/itemLookup.ts');

      const leaves = [];
      const customs = [];
      const groups = [];
      const ids = [];
      (function walk(nodes) {
        for (const node of nodes) {
          ids.push(node.id);
          if (node.type === 'group') {
            groups.push({ id: node.id, label: node.label, count: node.children.length });
            walk(node.children);
          } else if (node.type === 'item') {
            leaves.push(node);
          } else {
            customs.push(node);
          }
        }
      })(itemTree);

      const checks = [];
      const check = (name, pass, detail) => checks.push({ name, pass: !!pass, detail: detail ?? '' });

      const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
      check('every node id is unique', duplicateIds.length === 0, duplicateIds.join(', '));
      check('no empty groups', groups.every(group => group.count > 0),
        groups.filter(group => !group.count).map(group => group.id).join(', '));
      check('custom numeric effects carry {value}',
        customs.filter(node => node.numeric).every(node => node.effect.includes('{value}')),
        customs.filter(node => node.numeric && !node.effect.includes('{value}')).map(node => node.id).join(', '));
      check('custom numeric effects agree with their resource',
        customs.filter(node => node.numeric?.resource).every(node => {
          const unit = node.numeric.resource === 'hp' ? ' HP' : ' FP';
          return node.effect.includes(unit);
        }));
      check('leaf restore values agree with their text',
        leaves.every(leaf => {
          const match = leaf.values.effect.match(/restore (\d+) (HP|FP)/i);
          if (!match) return leaf.values.restoreHp === undefined && leaf.values.restoreFp === undefined;
          const expected = Number(match[1]);
          return match[2].toUpperCase() === 'HP'
            ? leaf.values.restoreHp === expected && leaf.values.restoreFp === undefined
            : leaf.values.restoreFp === expected && leaf.values.restoreHp === undefined;
        }),
        leaves.filter(leaf => {
          const match = leaf.values.effect.match(/restore (\d+) (HP|FP)/i);
          if (!match) return leaf.values.restoreHp !== undefined || leaf.values.restoreFp !== undefined;
          const expected = Number(match[1]);
          return match[2].toUpperCase() === 'HP' ? leaf.values.restoreHp !== expected : leaf.values.restoreFp !== expected;
        }).map(leaf => leaf.label).join(', '));
      check('no leaf carries both HP and FP restore',
        leaves.every(leaf => !(leaf.values.restoreHp !== undefined && leaf.values.restoreFp !== undefined)));
      check('restorative ladder is the printed one', RESTORE_LADDER.join(',') === '4,8,12,16,20');

      const byId = id => customs.find(node => node.id === id);
      const hpCustom = byId('custom-hp');
      const fpCustom = byId('custom-fp');
      const poisonCustom = byId('custom-poison');
      const miscCustom = byId('custom-item');
      const vigorous = leaves.find(leaf => leaf.values.name === 'Potion of Vigorous Healing');

      // Quantity / value coercion
      check('quantity clamps to 1..99',
        picker.toQuantity(-5) === 1 && picker.toQuantity(2.9) === 2 &&
        picker.toQuantity(NaN) === 1 && picker.toQuantity(1000) === 99);
      check('custom value rejects zero and negatives',
        picker.toCustomValue(0) === 1 && picker.toCustomValue(-9) === 1 && picker.toCustomValue(NaN) === 1);

      // Printed leaf payload
      const leafPayload = picker.buildLeafItem(vigorous, 3);
      check('printed leaf keeps its printed values',
        leafPayload.restoreHp === 16 && leafPayload.kind === 'potion' && leafPayload.quantity === 3 &&
        leafPayload.effect === 'Drink to immediately restore 16 HP.');

      // Custom payloads
      const blank = picker.buildCustomItem(hpCustom, { name: '   ', value: 8, effect: '', quantity: 1 });
      check('blank custom name is refused', blank === null);
      const hpItem = picker.buildCustomItem(hpCustom, { name: ' QA Bloodwine ', value: 14, effect: '', quantity: 1 });
      check('custom HP stores the edited value',
        hpItem && hpItem.name === 'QA Bloodwine' && hpItem.restoreHp === 14 && hpItem.restoreFp === undefined);
      check('custom HP effect has no leftover placeholder',
        hpItem && !hpItem.effect.includes('{value}') && hpItem.effect.includes('restore 14 HP'));
      check('custom items are tagged as player-made',
        hpItem && hpItem.homebrew === true);
      check('printed leaves are never tagged as player-made',
        leafPayload.homebrew === undefined);
      check('tag survives an older untagged stack',
        picker.isHomebrewItem({ name: 'QA Old Brew', quantity: 1, kind: 'potion', effect: 'Restores 3 HP.' }) === true);
      check('tag can be set explicitly even on a printed name',
        picker.isHomebrewItem({
          name: 'Potion of Healing', quantity: 1, kind: 'potion',
          effect: 'Drink to immediately restore 8 HP.', restoreHp: 8, homebrew: true,
        }) === true);
      check('printed catalog items stay untagged',
        picker.isHomebrewItem({
          name: 'Potion of Healing', quantity: 1, kind: 'potion',
          effect: 'Drink to immediately restore 8 HP.', restoreHp: 8,
        }) === false);
      const mergedTag = picker.mergeInventoryItem(
        [{ name: 'QA Old Brew', quantity: 1, kind: 'potion' }],
        { name: 'QA Old Brew', quantity: 1, kind: 'potion', homebrew: true }
      );
      check('merge keeps the player-made tag', mergedTag[0].homebrew === true);
      const negative = picker.buildCustomItem(hpCustom, { name: 'Nope', value: -40, effect: '', quantity: 1 });
      check('custom value floors at 1', negative && negative.restoreHp === 1);
      const huge = picker.buildCustomItem(hpCustom, { name: 'QA Nuke', value: 100000, effect: '', quantity: 1 });
      check('custom value stays editable above the printed ladder', huge && huge.restoreHp === 100000);
      const fpItem = picker.buildCustomItem(fpCustom, { name: 'QA Mana', value: 12, effect: '', quantity: 1 });
      check('custom FP sets only restoreFp', fpItem && fpItem.restoreFp === 12 && fpItem.restoreHp === undefined);
      const poisonItem = picker.buildCustomItem(poisonCustom, { name: 'QA Venom', value: 7, effect: '', quantity: 1 });
      check('custom poison never restores HP/FP',
        poisonItem && poisonItem.restoreHp === undefined && poisonItem.restoreFp === undefined &&
        poisonItem.effect.includes('additional 7 poison damage'));
      const miscItem = picker.buildCustomItem(miscCustom, {
        name: 'QA Token', value: 1, effect: '  Opens the sea gate.  ', quantity: 1,
      });
      check('non-numeric custom keeps edited text',
        miscItem && miscItem.effect === 'Opens the sea gate.' && miscItem.kind === 'misc');
      const emptyEffect = picker.buildCustomItem(miscItem ? miscCustom : miscCustom, {
        name: 'QA Silent', value: 1, effect: '   ', quantity: 1,
      });
      check('blank custom effect is omitted, not stored empty',
        emptyEffect && emptyEffect.effect === undefined);

      // Homebrew
      const homebrew = picker.buildHomebrewItem(hpItem);
      check('homebrew keeps the resolved values',
        homebrew && homebrew.name === 'QA Bloodwine' && homebrew.kind === 'potion' && homebrew.restoreHp === 14);
      check('homebrew refuses equipment kinds',
        picker.buildHomebrewItem({ name: 'QA Sword', quantity: 1, kind: 'weapon' }) === null);

      // Merging
      const mergedCase = picker.mergeInventoryItem(
        [{ name: 'Potion of Healing', quantity: 2, kind: 'potion', effect: 'x', restoreHp: 8 }],
        { name: 'potion of healing', quantity: 3, kind: 'potion' }
      );
      check('merge is case-insensitive and keeps printed values',
        mergedCase.length === 1 && mergedCase[0].quantity === 5 &&
        mergedCase[0].restoreHp === 8 && mergedCase[0].effect === 'x');
      const mergedKinds = picker.mergeInventoryItem(
        [{ name: 'Brew', quantity: 1, kind: 'potion' }],
        { name: 'Brew', quantity: 1, kind: 'poison' }
      );
      check('same name with a different kind stays a separate row', mergedKinds.length === 2);
      check('name keys ignore case and repeated whitespace',
        picker.nameKey('  Potion   of  Healing ') === picker.nameKey('potion of healing'));
      const mergedWhitespace = picker.mergeInventoryItem(
        [{ name: 'Potion  of Healing', quantity: 1, kind: 'potion' }],
        { name: 'potion of healing', quantity: 1, kind: 'potion' }
      );
      check('whitespace variants stack instead of duplicating', mergedWhitespace.length === 1);
      const mergedClamp = picker.mergeInventoryItem(
        [{ name: 'Arrows', quantity: 98, kind: 'misc' }],
        { name: 'Arrows', quantity: 5, kind: 'misc' }
      );
      check('merged quantity clamps at 99', mergedClamp[0].quantity === 99);
      const legacyMerge = picker.mergeInventoryItem(
        [{ name: 'Potion of Healing', quantity: 1 }],
        { name: 'Potion of Healing', quantity: 1, kind: 'potion', effect: 'Drink to immediately restore 8 HP.', restoreHp: 8 }
      );
      check('legacy rows adopt the catalog values on merge',
        legacyMerge.length === 1 && legacyMerge[0].restoreHp === 8 && legacyMerge[0].kind === 'potion');

      const homebrewOne = picker.mergeHomebrewEntry([], homebrew);
      const homebrewTwice = picker.mergeHomebrewEntry(homebrewOne, { ...homebrew, id: 'second-id', restoreHp: 12 });
      check('homebrew dedupes by name and kind',
        homebrewTwice.length === 1 && homebrewTwice[0].restoreHp === 12);

      // Resolver safety net
      const lookupChecks = {
        vigorous: lookup.lookupItem('VIGOROUS HEALING POTION')?.restoreHp,
        health: lookup.lookupItem('health potion')?.restoreHp,
        focus: lookup.lookupItem('Potion of Focus')?.restoreFp,
        ultimateMagicka: lookup.lookupItem('Potion of Ultimate Magicka')?.restoreFp,
        nonsense: lookup.lookupItem('banana'),
        storedCustom: lookup.resolveInventoryItem({
          name: 'QA Bloodwine', quantity: 1, kind: 'potion',
          effect: 'Drink to immediately restore 14 HP.', restoreHp: 14,
        })?.restoreHp,
      };
      check('resolver finds ladder words and aliases',
        lookupChecks.vigorous === 16 && lookupChecks.health === 8 &&
        lookupChecks.focus === 16 && lookupChecks.ultimateMagicka === 20);
      check('resolver leaves unknown names alone', lookupChecks.nonsense === null);
      check('resolver prefers stored custom values', lookupChecks.storedCustom === 14);

      return {
        checks,
        leaves: leaves.map(leaf => ({ label: leaf.label, values: leaf.values })),
        catalog: consumables.map(entry => ({
          name: entry.name,
          effect: entry.effect,
          aliases: entry.aliases ?? [],
        })),
        groups,
      };
    });

    let failures = 0;
    for (const check of audit.checks) {
      if (!check.pass) {
        failures += 1;
        console.error(`FAIL  ${check.name}${check.detail ? ` (${check.detail})` : ''}`);
      }
    }

    // ── Pass 2: every printed row in the rulebook must exist, with its values ──
    const docRows = Object.values(docTables).flat();
    const printableRows = docRows.filter(row => row.name !== 'Gold (Septim)');
    const leafNames = new Set(audit.leaves.map(leaf => norm(leaf.values.name)));
    for (const row of printableRows) {
      if (!leafNames.has(norm(row.name))) {
        failures += 1;
        console.error(`FAIL  missing from picker: ${row.name}`);
        continue;
      }
      const leaf = audit.leaves.find(candidate => norm(candidate.values.name) === norm(row.name));
      if (norm(leaf.values.effect) !== norm(row.effect)) {
        failures += 1;
        console.error(`FAIL  effect drift: ${row.name}\n   book:  ${norm(row.effect)}\n   picker:${norm(leaf.values.effect)}`);
      }
      const match = row.effect.match(/restore (\d+) (HP|FP)/i);
      if (match) {
        const expected = Number(match[1]);
        const actual = match[2].toUpperCase() === 'HP' ? leaf.values.restoreHp : leaf.values.restoreFp;
        if (actual !== expected) {
          failures += 1;
          console.error(`FAIL  wrong number: ${row.name} (book ${expected}, picker ${actual})`);
        }
      }
    }

    const docNames = new Set(printableRows.map(row => norm(row.name)));
    for (const leaf of audit.leaves) {
      if (!docNames.has(norm(leaf.values.name))) {
        failures += 1;
        console.error(`FAIL  picker invents an item that is not in the book: ${leaf.values.name}`);
      }
    }

    // The resolver catalog (what legacy rows fall back to) must match the book too.
    for (const row of printableRows) {
      const entry = audit.catalog.find(candidate =>
        [candidate.name, ...candidate.aliases].some(name => norm(name) === norm(row.name))
      );
      if (!entry) {
        failures += 1;
        console.error(`FAIL  resolver catalog is missing: ${row.name}`);
        continue;
      }
      if (norm(entry.effect) !== norm(row.effect)) {
        failures += 1;
        console.error(`FAIL  resolver effect drift: ${row.name}\n   book:    ${norm(row.effect)}\n   catalog: ${norm(entry.effect)}`);
      }
    }

    // ── Pass 3: real UI flow ──
    await page.evaluate(async () => {
      const { sampleCharacter } = await import('/src/data/sampleCharacter.ts');
      const character = structuredClone(sampleCharacter);
      character.resources.hp.current = Math.max(1, character.resources.hp.max - 5);
      character.inventory.items = character.inventory.items.filter(item => !/potion/i.test(item.name));
      character.inventory.homebrew = [];
      localStorage.setItem('skyrimTTRPG_characterLibrary', JSON.stringify([character]));
    });
    await page.reload();
    await page.getByRole('button', { name: 'Enter as Player', exact: true }).click();
    await page.getByRole('button', { name: 'Load Character', exact: true }).click();
    await page.getByRole('button', { name: /Bjorn Ironshield/ }).click();

    const readCharacter = () => page.evaluate(() =>
      JSON.parse(localStorage.getItem('skyrimTTRPG_characterLibrary'))[0]);
    const openPicker = async () => {
      await page.getByRole('button', { name: 'Add Item', exact: true }).first().click();
      const dialog = page.getByRole('dialog');
      await dialog.waitFor();
      return dialog;
    };
    const drillToHealth = async dialog => {
      await dialog.getByRole('button', { name: /^Potions/ }).click();
      await dialog.getByRole('button', { name: /^Restorative/ }).click();
      await dialog.getByRole('button', { name: /^Restore Health/ }).click();
    };

    // Printed item through the branches.
    let dialog = await openPicker();
    await drillToHealth(dialog);
    await dialog.getByRole('button', { name: /^Potion of Vigorous Healing/ }).click();
    await dialog.getByRole('button', { name: 'Add to inventory' }).click();
    await page.waitForFunction(() => {
      const stored = JSON.parse(localStorage.getItem('skyrimTTRPG_characterLibrary'))[0];
      return stored.inventory.items.some(item => item.name === 'Potion of Vigorous Healing');
    });
    let stored = await readCharacter();
    const vigorous = stored.inventory.items.find(item => item.name === 'Potion of Vigorous Healing');
    assert.equal(vigorous.quantity, 1);
    assert.equal(vigorous.restoreHp, 16);
    assert.equal(vigorous.kind, 'potion');

    // Custom item: blank name blocked, rank prefills, edited value survives.
    dialog = await openPicker();
    await drillToHealth(dialog);
    await dialog.getByRole('button', { name: /^Custom healing potion/ }).click();
    const addToInventory = dialog.getByRole('button', { name: 'Add to inventory' });
    await dialog.getByLabel('Name').fill('   ');
    assert.equal(await addToInventory.isDisabled(), true, 'blank custom name should disable Add');
    await dialog.getByLabel('Name').fill('Potion of Healing');
    assert.equal(await addToInventory.isDisabled(), true, 'printed item names must be reserved');
    await dialog.getByText(/belongs to a printed item/).waitFor();
    await dialog.getByLabel('Name').fill('QA Bloodwine');
    await dialog.getByRole('button', { name: /Vigorous/ }).click();
    await dialog.getByRole('spinbutton').fill('14');
    await dialog.getByText('Drink to immediately restore 14 HP.', { exact: true }).waitFor();
    await addToInventory.click();
    await page.waitForFunction(() => {
      const stored = JSON.parse(localStorage.getItem('skyrimTTRPG_characterLibrary'))[0];
      return stored.inventory.items.some(item => item.name === 'QA Bloodwine');
    });
    stored = await readCharacter();
    const brew = stored.inventory.items.find(item => item.name === 'QA Bloodwine');
    assert.equal(brew.quantity, 1);
    assert.equal(brew.restoreHp, 14);
    assert.equal(brew.homebrew, true, 'custom item must be tagged player-made');
    assert.match(brew.effect, /restore 14 HP/);
    assert.equal(vigorous.homebrew, undefined, 'printed item must not be tagged');
    await page.getByText('Brewed', { exact: true }).first().waitFor();
    assert.equal(stored.inventory.homebrew.length, 1);
    assert.equal(stored.inventory.homebrew[0].restoreHp, 14);

    // Homebrew comes back as a branch and stacks instead of duplicating.
    dialog = await openPicker();
    await dialog.getByRole('button', { name: /^Your Homebrew/ }).click();
    await dialog.getByRole('button', { name: /^QA Bloodwine/ }).click();
    await dialog.getByRole('button', { name: 'Add to inventory' }).click();
    await page.waitForFunction(() => {
      const stored = JSON.parse(localStorage.getItem('skyrimTTRPG_characterLibrary'))[0];
      return stored.inventory.items.find(item => item.name === 'QA Bloodwine')?.quantity === 2;
    });
    stored = await readCharacter();
    assert.equal(stored.inventory.homebrew.length, 1, 'homebrew should not duplicate');

    // Drinking it restores the resolved amount, capped, and spends one.
    const before = await readCharacter();
    await page.getByRole('switch', { name: 'Combat Mode' }).click();
    await page.getByText('MINOR ACTION', { exact: true }).click();
    await page.getByText(/Drink QA Bloodwine \(Brewed\)/).click();
    await page.waitForFunction(() => {
      const stored = JSON.parse(localStorage.getItem('skyrimTTRPG_characterLibrary'))[0];
      return stored.inventory.items.find(item => item.name === 'QA Bloodwine')?.quantity === 1;
    });
    const after = await readCharacter();
    assert.equal(after.resources.hp.current, before.resources.hp.max, 'drink should cap at max HP');
    assert.equal(after.resources.hp.current - before.resources.hp.current, 5, 'only the missing 5 HP should be restored');

    assert.deepEqual(pageErrors, []);

    if (failures > 0) {
      throw new Error(`${failures} adversarial check(s) failed`);
    }
    console.log(`PASS: ${audit.checks.length} data/helper checks, ${printableRows.length} rulebook rows matched, drill-down + custom + homebrew + drink flow verified, no page errors.`);
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
