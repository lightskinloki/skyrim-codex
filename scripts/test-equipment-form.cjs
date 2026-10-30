// Isolated browser storage only; never touches a live player's character.
const { chromium } = require('C:/Users/fbrown/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.APP_TEST_URL || 'http://127.0.0.1:8093');
    const rules = await page.evaluate(async () => {
      const { sampleCharacter } = await import('/src/data/sampleCharacter.ts');
      const { getBonusActions, getValidMajorActions } = await import('/src/utils/actionUtils.ts');
      const { races } = await import('/src/data/races.ts');
      const { standingStones } = await import('/src/data/standingStones.ts');
      const { skills } = await import('/src/data/skills.ts');
      const character = structuredClone(sampleCharacter);
      character.standingStone = standingStones.find(s => s.id === 'thief');
      character.race = races.find(r => r.id === 'argonian');
      const basicRegen = getValidMajorActions(character).find(a => a.id === 'racial-argonian');
      character.skills = character.skills.map(s => ['two-handed', 'restoration'].includes(s.skillId) ? { ...s, rank: 'Expert' } : s);
      const upgradedRegen = getValidMajorActions(character).find(a => a.id === 'racial-argonian');
      character.equipment.push({ id: 'qa-bow', name: 'Hunting Bow', type: 'weapon', damage: 4 });
      const actions = getValidMajorActions(character, 2);
      return {
        fleet: getBonusActions(character).find(a => a.id === 'fleet-footed'),
        basicRegen, upgradedRegen,
        power: actions.find(a => a.id === 'power-attack-steel-greatsword'),
        bowPower: actions.some(a => a.id === 'power-attack-qa-bow'),
        savage: skills.find(s => s.id === 'one-handed').perks.find(p => p.name === 'Savage Strike').description,
      };
    });
    assert.equal(rules.fleet.fpCost, 2);
    assert.match(rules.fleet.description, /off-turn/);
    assert.match(rules.basicRegen.description, /Regain 1 HP/);
    assert.match(rules.upgradedRegen.description, /Regain 2 HP/);
    assert.equal(rules.power.fpCost, 6);
    assert.equal(rules.power.damage, 11); // sample greatsword5 + two stacks of Expert3
    assert.match(rules.power.description, /cannot be staggered or knocked prone/);
    assert.equal(rules.bowPower, false);
    assert.match(rules.savage, /\+3 damage instead of \+2/);
    await page.evaluate(async () => {
      const { sampleCharacter } = await import('/src/data/sampleCharacter.ts');
      localStorage.setItem('skyrimTTRPG_characterLibrary', JSON.stringify([sampleCharacter]));
    });
    await page.reload();
    await page.getByRole('button', { name: 'Enter as Player', exact: true }).click();
    await page.getByRole('button', { name: 'Load Character', exact: true }).click();
    await page.getByRole('button', { name: /Bjorn Ironshield/ }).click();
    for (const slot of ['bonus', 'free']) {
      await page.getByRole('button', { name: 'Add Equipment', exact: true }).click();
      await page.getByPlaceholder('Enchantment name (leave blank for none)').fill('QA-' + slot);
      await page.getByPlaceholder('Effect description', { exact: true }).fill('Keep this when selecting equipment');
      await page.getByPlaceholder('Max charges', { exact: true }).fill('7');
      await page.getByPlaceholder('Cost/use', { exact: true }).fill('2');
      await page.getByRole('button', { name: slot === 'bonus' ? 'Bonus Action' : 'Free Action', exact: true }).click();
      await page.getByPlaceholder('Start typing item name...').fill('Steel Sword');
      await page.getByRole('button', { name: /^Steel Sword\b/ }).click();
      await page.getByRole('button', { name: 'Add', exact: true }).first().click();
      const item = await page.evaluate(name => JSON.parse(localStorage.getItem('skyrimTTRPG_characterLibrary'))[0].equipment.find(e => e.enchantment?.name === name), 'QA-' + slot);
      assert.equal(item.name, 'Steel Sword');
      assert.deepEqual(item.enchantment, { name: 'QA-' + slot, description: 'Keep this when selecting equipment', charges: 7, maxCharges: 7, chargeCost: 2, actionSlot: slot });
    }
    await page.getByRole('switch', { name: 'Combat Mode' }).click();
    await page.getByText('MAJOR ACTION', { exact: true }).click();
    await page.getByRole('spinbutton', { name: 'Power Attack stacks' }).fill('2');
    const powerCard = page.getByText('Power Attack (Steel Greatsword)', { exact: true }).locator('xpath=../../..');
    assert.match(await powerCard.innerText(), /6 FP/);
    assert.match(await powerCard.innerText(), /9 dmg/); // base two-handed, not Expert in saved fixture
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem('skyrimTTRPG_characterLibrary'))[0].resources.fp.current);
    await powerCard.click();
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem('skyrimTTRPG_characterLibrary'))[0].resources.fp.current);
    assert.equal(before - after, 6);
    assert.deepEqual(errors, []);
    console.log('PASS: equipment preserves enchantments and saves Bonus/Free; Fleet Footed2FP; Histskin scaling; Expert two-handed3 per stack; ranged exclusion; Savage Strike text; UI stacks spend correct FP; no browser exceptions.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
