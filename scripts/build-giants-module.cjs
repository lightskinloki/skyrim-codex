#!/usr/bin/env node
// Converts the oneshot's two TABLE EDITION sources into one CampaignModule the
// Forge can open and Live Play can run. Part One runs to the burial ring; from
// there the continuation takes over and replaces the old last act.
//
// The source format is the HTML console's own vocabulary:
//   ## key | title | subtitle      scene boundary
//   READ: / GM: / RULE: / CUE:     content lines
//   SAY NAME, direction: "line"    spoken line (or bare NAME: "line")
//   PAUSE:                         hand the scene to the players
//   BRANCH: title                  everything until the next boundary belongs to it
//   HANDOUT TITLE: line            an in-world document
//   COMPANION: name                inline companion card
//   TRACKERS: giant | pines        fight trackers for that encounter
//   EXIT: ... #scene-key ...       scene links
//
// Regenerate with: node scripts/build-giants-module.cjs
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
const ONESHOTS = path.join(REPO, 'Frogs-5-skyrim', 'oneshots');
const SRC = path.join(ONESHOTS, 'WHAT_THE_GIANTS_GUARD_MODULE.txt');
const SRC_CONT = path.join(ONESHOTS, 'WHAT_THE_GIANTS_GUARD_CONTINUATION.txt');
const OUT = path.resolve(__dirname, '..', 'src', 'data', 'bundledModules.ts');

const MODULE_ID = 'wtgg';
const sceneId = (key) => `wtgg:scene:${key}`;

/* ── read a source file into scene stubs ──────────────────────────────── */
function readSource(file) {
  const scenes = [];
  let cur = null;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      const [key, title, subtitle] = heading[1].split('|').map((s) => s.trim());
      cur = { key, title: title || key, subtitle: subtitle || '', lines: [] };
      scenes.push(cur);
      continue;
    }
    if (cur) cur.lines.push(line);
  }
  return scenes;
}

/* ── one adventure in two documents ───────────────────────────────────── */
// The continuation is not a second module: it replaces the end of this one.
// Part One survives to the burial ring; from there the continuation takes over,
// because it re-authors the camp, the resolution, the court report, the rewards
// and the reference scene around the real cast and the real table state.
const PART_ONE_KEPT = ['start', 'arrival', 'hearing', 'ruling', 'break', 'briefing', 'farm', 'ridge'];
const PART_ONE_LAST = 'ending-withdraw'; // a declined contract still has to close somewhere

// Renumber the continuation into the module's own run, so the scene list reads
// as one adventure instead of two documents that both start at 00.
const renumber = (title, n) =>
  title.replace(/^\s*\d+[A-Za-z]?\s*(?:--|–|—)\s*/, `${String(n).padStart(2, '0')} -- `);

const partOne = readSource(SRC);
const contSource = readSource(SRC_CONT);
const withdrawn = partOne.find((s) => s.key === PART_ONE_LAST);

const scenes = [
  ...partOne.filter((s) => PART_ONE_KEPT.includes(s.key)).map((s) => ({ ...s, source: 'module' })),
  ...contSource.map((s, i) => ({
    ...s,
    key: `c-${s.key}`,           // the two documents share keys ("farm" is both)
    sourceKey: s.key,
    source: 'continuation',
    title: renumber(s.title, 8 + i),
  })),
  ...(withdrawn
    ? [{ ...withdrawn, source: 'module', title: renumber(withdrawn.title, 8 + contSource.length) }]
    : []),
];

const byKey = new Map(scenes.map((s) => [s.key, s]));
const titleOf = (key) => byKey.get(key)?.title ?? key;

/* ── what the cut scenes' pointers now mean ───────────────────────────── */
// Surviving Part One scenes still exit toward the camp and the six endings the
// continuation replaced. Each pointer is re-aimed at the scene that took that
// job over; null means the scene was a close, not a doorway.
const EXIT_OVERRIDES = {
  farm: { 'ending-partial': 'c-report' },
  ridge: {
    pines: 'c-approach',
    'ending-giant': 'c-burials',
    farm: 'c-farm',
    'ending-partial': 'c-report',
  },
  [PART_ONE_LAST]: { settlement: null, rewards: null },
};

const PROSE_RETARGET = {
  '#ending-restored': '#c-report',
  '#ending-giant': '#c-burials',
  '#ending-alternative': '#c-report',
  '#ending-partial': '#c-report',
  '#ending-defeat': '#c-restoration',
  '#pines': '#c-approach',
  '#settlement': '#c-report',
  '#rewards': '#c-report',
};
const retargetProse = (s) =>
  Object.entries(PROSE_RETARGET).reduce((out, [from, to]) => out.split(from).join(to), s);

// A GM note that names a replaced scene has to name its replacement, or it
// sends the reader to a page that no longer exists.
function retargetRefs(node) {
  if (Array.isArray(node)) { node.forEach(retargetRefs); return; }
  if (!node || typeof node !== 'object') return;
  for (const [k, v] of Object.entries(node)) {
    if (typeof v === 'string') {
      if (v.includes('#') && (k === 'text' || k === 'line' || k === 'title')) node[k] = retargetProse(v);
    } else retargetRefs(v);
  }
}

// Where a link from `scene` actually goes once the tail has been replaced.
function resolveRef(scene, key) {
  const over = EXIT_OVERRIDES[scene.key];
  if (over && Object.prototype.hasOwnProperty.call(over, key)) {
    return over[key] ? { key: over[key] } : null; // null: that destination is gone
  }
  return { key: scene.source === 'continuation' ? `c-${key}` : key };
}

/* ── companions (the oneshot inlines only Hirt) ───────────────────────── */
const COMPANIONS = {
  Hirt: [
    'Might 16 · Agility 10 · Magic 10 · Guile 4',
    'HP 42 · FP 20 · DR 2 (+armour). Uncapped temporary HP from Bio-Siphon.',
    'Headsman\'s Axe: 10 damage, Hack & Slash (Bleeding 1/turn).',
    'Avoid Death: once per adventure, at 0 HP heal 10 (a blow over 10 excess still downs him).',
    'Bio-Siphon (Major, 10 FP): 5 irreducible + 5 fire, gain 20 temp HP.',
    'Mist Form (Reaction, 8 FP): immune to physical until his next turn; adjacent creatures take 4 fire.',
    'Equilibrium (Minor, 0 FP): take 10 irreducible, regain 20 FP.',
    'Sanguine Overload: at 84+ total HP his melee adds +2 fire.',
    'His turns never advance the giant\'s Grief-Quake counter — only PC turns do.',
  ],
};

/* ── parse one scene into v2 blocks ───────────────────────────────────── */
function buildScene(scene) {
  const blocks = [];
  const sceneExits = [];      // the scene footer's EXIT line(s)
  let list = blocks;          // where new blocks land (scene, or the open branch)
  let branch = null;
  let open = null;            // block that absorbs following prose
  let counter = 0;
  const nextId = () => `${MODULE_ID}:${scene.key}:b${++counter}`;

  const push = (b) => { list.push(b); return b; };
  const closeBranch = () => { branch = null; list = blocks; };
  const addText = (line) => {
    if (open && (open.kind === 'gmNote' || open.kind === 'handout' || open.kind === 'stop' || open.kind === 'text')) {
      open.text = open.text ? `${open.text}\n${line}` : line;
    } else {
      open = push({ id: nextId(), kind: 'gmNote', text: line });
    }
  };

  for (const line of scene.lines) {
    const t = line.trim();
    if (!t) continue;

    // ── read-aloud: consecutive READ lines are one block, one paragraph each
    let m = t.match(/^READ:\s*(.*)$/);
    if (m) {
      const last = list[list.length - 1];
      if (last && last.kind === 'readAloud' && open === last) last.paragraphs.push(m[1]);
      else open = push({ id: nextId(), kind: 'readAloud', paragraphs: [m[1]] });
      continue;
    }

    m = t.match(/^GM:\s*(.*)$/);
    if (m) { open = push({ id: nextId(), kind: 'gmNote', text: m[1] }); continue; }

    m = t.match(/^RULE:\s*(.*)$/);
    if (m) {
      // A RULE is reference material for the whole scene, so it never nests in
      // whichever branch happened to be open when it appeared.
      closeBranch();
      const title = m[1].trim();
      open = push({ id: nextId(), kind: 'gmNote', tag: 'RULE:', text: title ? `**${title}**` : '' });
      continue;
    }

    m = t.match(/^CUE:\s*(.*)$/);
    if (m) {
      // A cue that opens a branch's own beat belongs to it; one that starts a
      // new beat after real branch content closes it.
      if (branch && branch.blocks.length) closeBranch();
      open = push({ id: nextId(), kind: 'gmNote', tag: 'CUE:', text: m[1] });
      continue;
    }

    m = t.match(/^PAUSE:\s*(.*)$/);
    if (m) { open = push({ id: nextId(), kind: 'stop', text: m[1] }); continue; }

    m = t.match(/^BRANCH:\s*(.*)$/);
    if (m) {
      closeBranch(); // a second BRANCH is a sibling alternative, never a child
      const tone = ['red', 'blue', 'gold', 'green', 'neutral'][counter % 5];
      branch = push({ id: nextId(), kind: 'branch', title: m[1].trim(), tone, blocks: [] });
      list = branch.blocks;
      open = null;
      continue;
    }

    m = t.match(/^HANDOUT\s+([^:]+):\s*(.*)$/);
    if (m) {
      closeBranch();
      open = push({ id: nextId(), kind: 'handout', title: m[1].trim(), text: m[2].trim() });
      continue;
    }

    m = t.match(/^COMPANION:\s*(.*)$/);
    if (m) {
      closeBranch();
      const name = m[1].trim();
      push({ id: nextId(), kind: 'card', title: `Companion — ${name}`, items: COMPANIONS[name] ?? [] });
      open = null;
      continue;
    }

    // The continuation calls its encounter link MECHANICS; the module calls the
    // same thing TRACKERS. Both name the fight tracker to attach here.
    m = t.match(/^(?:TRACKERS|MECHANICS):\s*(.*)$/);
    if (m) {
      closeBranch();
      push({ id: nextId(), kind: 'combat', combat: buildCombat(m[1].trim()) });
      open = null;
      continue;
    }

    m = t.match(/^EXIT:\s*(.*)$/);
    if (m) {
      closeBranch();
      // A declined contract is a close, not a doorway: its old destination (the
      // rewards ledger) now lives inside the continuation's report scene, and
      // what remains on the line is advice, not a link.
      if (scene.key === PART_ONE_LAST) { open = null; continue; }
      // "#hearing -- public claim if uninterrupted" reads as "public claim … → 02 …"
      const found = [];
      for (const clause of m[1].split(/(?<=\.)\s+/)) {
        const leading = clause.match(/^\s*#([\w-]+)\s*(?:--|–|—)\s*(.+?)\s*$/);
        if (leading) {
          const ref = resolveRef(scene, leading[1]);
          if (!ref) continue;
          found.push({ description: leading[2], key: ref.key, routed: true });
          continue;
        }
        const keys = [...clause.matchAll(/#([\w-]+)/g)].map((x) => x[1]);
        // The renderer already appends "→ scene title", so the label is what
        // comes before the arrow: "Killed -> #pines" reads "Killed → 12 …".
        const label = (keys.length
          ? clause.split(/\s*(?:->|–|—)\s*/)[0]
          : clause
        )
          .replace(/#[\w-]+/g, '')
          .replace(/\s+/g, ' ')
          .replace(/^[\s,;:.]+|[\s,;:.]+$/g, '')
          .replace(/[\s,;:]+(?:via|then|or|to|at)$/i, '') // needs the space, or "retreat" loses its at
          .replace(/^(?:or|and|then)[\s,;:]+/i, '')
          .trim();
        const ref = keys.length ? resolveRef(scene, keys[0]) : { key: undefined };
        if (!ref) continue;
        // A clause with no destination is only a route if it names a branch.
        found.push({
          description: label || 'Continue',
          key: ref.key,
          routed: /->|–|—/.test(clause),
        });
      }
      // The sentences after an EXIT line are instructions to the GM, not places
      // to go, so they do not become links. Every scene still needs a way on, so
      // if nothing actually routed, the first clause stands in for it.
      const kept = found.filter((f) => f.key || f.routed);
      for (const f of (kept.length ? kept : found.slice(0, 1))) {
        sceneExits.push({
          id: `wtgg:exit:${scene.key}:${sceneExits.length + 1}`,
          description: f.description,
          targetSceneId: f.key ? sceneId(f.key) : undefined,
          branchLabel: f.key ? titleOf(f.key) : undefined,
        });
      }
      open = null;
      continue;
    }

    // spoken: SAY NAME, direction: "line"  |  NAME: "line"  |  NAME, note: "line"
    // A speaker is title-cased words only (IRILETH, HRODULF, PROVENTUS), so a
    // sentence like "If the PCs separate, a guard asks them: \"...\"" cannot
    // masquerade as an NPC line.
    const SPEAKER = "([A-Z][A-Za-z'-]*(?:\\s+[A-Z][A-Za-z'-]*)*)";
    m = t.match(new RegExp(`^SAY\\s+${SPEAKER}(?:,\\s*([^:]{1,80}))?:\\s*"(.*)"$`));
    if (!m) m = t.match(new RegExp(`^${SPEAKER}(?:,\\s*([^:]{1,80}))?:\\s*"(.*)"$`));
    if (m) {
      push({
        id: nextId(), kind: 'spoken',
        speaker: m[1].trim(),
        direction: m[2] ? m[2].trim() : undefined,
        line: m[3].trim(),
      });
      open = null;
      continue;
    }

    // A prose sentence followed on the same line by an NPC quote
    // ("Balgruuf holds out his hand. BALGRUUF: \"...\"") is both.
    const inlineQuote = t.match(new RegExp(`^(.*?[.!?])\\s+${SPEAKER}:\\s*"(.*)"$`));
    if (inlineQuote) {
      addText(inlineQuote[1].trim());
      push({ id: nextId(), kind: 'spoken', speaker: inlineQuote[2].trim(), line: inlineQuote[3].trim() });
      open = null;
      continue;
    }

    addText(t);
  }

  // Every scene here is either a fight or a normal scene. None of them is the
  // wizard's "pick the ending" template — each ending is its own scene — so
  // marking them 'endings' would ask for blocks that do not belong.
  const hasCombat = blocks.some((b) => b.kind === 'combat');
  const all = [];
  const collect = (list) => list.forEach((b) => { all.push(b); if (b.blocks) collect(b.blocks); });
  collect(blocks);
  const type = hasCombat ? 'combat' : 'set-piece';
  // SceneKind is a closed set (opening/scene/conversation/combat/endings/
  // resolution). Anything else crashes the Forge's overview, so stay inside it.
  const kind = hasCombat ? 'combat' : 'scene';

  const exits = sceneExits;

  return {
    id: sceneId(scene.key),
    moduleId: `wtgg:module`,
    title: scene.title,
    subtitle: scene.subtitle || undefined,
    type,
    kind,
    blocks,
    enemies: hasCombat
      ? blocks.flatMap((b) => (b.kind === 'combat' ? b.combat.enemies : []))
      : [],
    exits,
    tags: [scene.sourceKey ?? scene.key],
    schemaVersion: 2,
  };
}

/* ── the two fights ───────────────────────────────────────────────────── */
function buildCombat(which) {
  if (which === 'giant') {
    return {
      title: 'The guardian of the ring',
      objective: 'Two 300 HP bars. Break both to kill it. It never surrenders and never leaves the ring.',
      statusFields: [{ id: 'giant-phase', label: 'Phase', initial: 'Bar one' }],
      trackers: [
        {
          id: 'giant-bar-1',
          title: 'First bar',
          description: 'DR 14. Club 26 / crit 52. At 0 discard that hit\'s overflow and start bar two.',
          targets: [{ id: 'giant-bar-1-target', label: 'Bar one', maxHp: 300 }],
          quickDamage: [13, 26, 52],
          threshold: 1,
          thresholdText: 'The first bar breaks — it tears a standing stone free.',
          triggerBlocks: [
            {
              id: 'giant-break-read',
              kind: 'readAloud',
              paragraphs: [
                'The giant drops the club beside the grave and seizes a standing stone with both hands. Turf tears around its base. It pulls the stone free and swings it up across its shoulders. The stone\'s empty socket opens beside the graves.',
              ],
            },
            {
              id: 'giant-break-note',
              kind: 'gmNote',
              tag: 'RULE:',
              text: '**Phase two**\nDiscard the breaking hit\'s overflow, clear temporary statuses, keep permanent Sunder. Second bar starts at 300. Base DR 10. Standing stone 32 / crit 64, ignores 2 target DR per hit. Groundbreaker stays 13; Grief-Quake stays 8. No free attack for the transformation.',
            },
          ],
        },
        {
          id: 'giant-bar-2',
          title: 'Second bar',
          description: 'DR 10. Standing stone 32 / crit 64, ignores 2 target DR. Groundbreaker 13, Grief-Quake 8.',
          targets: [{ id: 'giant-bar-2-target', label: 'Bar two', maxHp: 300 }],
          quickDamage: [13, 32, 64],
          triggerBlocks: [],
        },
      ],
      cards: [
        {
          id: 'giant-card',
          title: 'The giant — Adept TL3',
          statLine: 'Might 18 · Agility 12 · Magic 8 · Guile 16 · DR 14 → 10',
          items: [
            'Club 26 / crit 52 (phase one) → standing stone 32 / crit 64, ignores 2 DR (phase two).',
            'Groundbreaker (Major): everyone within 5 feet rolls Standard Agility or is Prone + 13 physical, DR applies.',
            'Grief-Quake (Villain Action): end of every second PC turn. Everyone within 20 feet rolls Hard Agility (-4) or is Prone + 8 physical. NPC turns never count; carry the counter across rounds.',
            'No FP pool. No treasure on it. The third grave\'s goods stay burial property.',
          ],
        },
      ],
      enemies: ['giant-guardian'],
      triggers: [],
    };
  }

  return {
    title: 'The Barrow-Pickers',
    objective: 'Hrodulf 200 HP / DR 11. Four diggers 70 HP / DR 7 each. At 66 HP he offers a split, once.',
    statusFields: [{ id: 'pines-diggers', label: 'Active diggers', initial: '4' }],
    trackers: [
      {
        id: 'pines-hrodulf',
        title: 'Hrodulf',
        description: 'War-pick 20 / crit 40, ignores 2 DR. Offer at 66 HP or less, once.',
        targets: [{ id: 'pines-hrodulf-target', label: 'Hrodulf', maxHp: 200 }],
        quickDamage: [13, 20, 40],
        threshold: 1,
        thresholdText: 'At 66 HP or less — make the split offer once.',
        triggerBlocks: [
          {
            id: 'hrodulf-offer-read',
            kind: 'readAloud',
            paragraphs: [
              'Hrodulf backs against the table. He lowers the pickhead toward the ground and holds his free hand out.',
            ],
          },
          {
            id: 'hrodulf-offer-line',
            kind: 'spoken',
            speaker: 'Hrodulf',
            line: 'Enough. A third of the goods. Take your people. Let us walk out with the rest.',
          },
          {
            id: 'hrodulf-offer-note',
            kind: 'stop',
            text: 'Accept, counteroffer, refuse, or keep attacking. Acceptance holds only while the deal is observed: all three captives released now; default share is the bone flute, the broken bronze ring, and three amber pieces. Time and spent actions do not reset.',
          },
        ],
      },
      {
        id: 'pines-diggers',
        title: 'The four diggers',
        description: '70 HP / DR 7 each. Melee 13 / crit 26. Flee at two or fewer active.',
        targets: [
          { id: 'pines-digger-a', label: 'Digger A', maxHp: 70 },
          { id: 'pines-digger-b', label: 'Digger B', maxHp: 70 },
          { id: 'pines-digger-c', label: 'Digger C', maxHp: 70 },
          { id: 'pines-digger-d', label: 'Digger D', maxHp: 70 },
        ],
        quickDamage: [13, 26],
        threshold: 2,
        thresholdText: 'Two or fewer diggers remain — the survivors withdraw on their turns.',
        triggerBlocks: [
          {
            id: 'pines-flee-read',
            kind: 'readAloud',
            paragraphs: ['The surviving diggers turn toward the trees with their swords still in hand.'],
          },
        ],
      },
    ],
    cards: [
      {
        id: 'pines-card',
        title: 'Stat lines',
        items: [
          'Hrodulf: Might 17 · Agility 15 · Magic 8 · Guile 12 · HP 200 · DR 11.',
          'Hrodulf, Bury the Lead (Major): target Hard Agility (-4) or Blinded — disadvantage on attacks until end of their next turn.',
          'Each digger: Might 16 · Agility 14 · Magic 8 · Guile 12 · HP 70 · DR 7. Melee 13 / crit 26.',
          'Freed Anvils (at most two): Torsten and Runa, M16/A14/Magic8/G12, HP 70, DR 7, melee 13. Eydis is not a third fighter.',
          'Coals: 2 fire per turn in contact, DR applies. Overturn the table: Major Standard Might (0).',
        ],
      },
    ],
    enemies: ['hrodulf', 'barrow-picker'],
    triggers: [],
  };
}

/* ── assemble ─────────────────────────────────────────────────────────── */
const bundle = {
  id: `${MODULE_ID}:module`,
  name: 'What the Giants Guard',
  description: 'Hearthfeld\'s guardian has been robbed and the field cannot be cut. A steward\'s contract, six missing mercenaries, and two sacks of grave-goods.',
  badge: 'One-shot · Adept · 5 PCs',
  navTitle: 'WHAT THE GIANTS GUARD',
  tierTables: [],
  sourcePath: 'Frogs-5-skyrim/oneshots/WHAT_THE_GIANTS_GUARD_MODULE.txt',
  scenes: scenes.map((scene) => {
    const built = buildScene(scene);
    retargetRefs(built.blocks);
    return built;
  }),
  schemaVersion: 2,
};

fs.writeFileSync(
  OUT,
  [
    '// GENERATED FILE — do not hand-edit.',
    '// Sources: Frogs-5-skyrim/oneshots/WHAT_THE_GIANTS_GUARD_MODULE.txt (TABLE EDITION, scenes 00-07)',
    '//          Frogs-5-skyrim/oneshots/WHAT_THE_GIANTS_GUARD_CONTINUATION.txt (scenes 08-21)',
    '// Regenerate: node scripts/build-giants-module.cjs',
    "import type { CampaignModule } from '@/types/campaign';",
    '',
    'export const BUNDLED_MODULES: CampaignModule[] = ' + JSON.stringify([bundle], null, 2) + ';',
    '',
  ].join('\n'),
);

const blockCount = bundle.scenes.reduce((n, s) => n + s.blocks.length, 0);
console.log(`Wrote ${path.relative(REPO, OUT)} — ${bundle.scenes.length} scenes, ${blockCount} top-level blocks.`);
for (const s of bundle.scenes) console.log(`  ${s.id.padEnd(28)} ${s.title}  (${s.blocks.length})`);
