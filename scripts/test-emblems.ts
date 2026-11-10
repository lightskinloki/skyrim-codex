// Checks for the character-creation skill emblems.
// Run: npm run test:emblems
import { skills } from '@/data/skills';
import { EMBLEM_SIZE, SKILL_EMBLEM_IDS, skillEmblemPixels } from '@/characters/skillEmblem';

let passed = 0;
const failures: string[] = [];

function check(label: string, condition: boolean, detail = '') {
  if (condition) passed++;
  else failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
}

// --- coverage -------------------------------------------------------------
{
  const drawn = new Set(SKILL_EMBLEM_IDS);
  for (const skill of skills) {
    check(`${skill.id} has an emblem`, drawn.has(skill.id));
    check(
      `${skill.id} explains itself`,
      typeof skill.summary === 'string' && skill.summary.length > 20,
      skill.summary ?? '(no summary)',
    );
  }
  check('no orphan emblems', drawn.size === skills.length, `${drawn.size} emblems vs ${skills.length} skills`);
}

// --- the drawing ----------------------------------------------------------
{
  check('emblem is 32×32', EMBLEM_SIZE.w === 32 && EMBLEM_SIZE.h === 32);

  const seen: { id: string; px: Uint32Array }[] = [];
  // The face is x 3..28 / y 3..28; everything else is frame by design.
  const FACE = { x0: 3, y0: 3, x1: 29, y1: 29 };

  for (const id of SKILL_EMBLEM_IDS) {
    const px = skillEmblemPixels(id);
    check(`${id} fills the buffer`, px.length === EMBLEM_SIZE.w * EMBLEM_SIZE.h);

    // Only the four carved corners are clear; a hole anywhere else would show
    // the dark card through the emblem.
    let clear = 0;
    for (let i = 0; i < px.length; i++) if ((px[i] >>> 24) === 0) clear++;
    check(`${id} is solid except the corners`, clear === 16, `${clear} clear pixels`);
    check(`${id} has corner cuts`, (px[0] >>> 24) === 0 && (px[px.length - 1] >>> 24) === 0);

    // A glyph has to be drawn on the face, not just the plaque around it.
    const ink = px[6 * EMBLEM_SIZE.w + 6];
    let drawn = 0;
    for (let y = FACE.y0; y < FACE.y1; y++) {
      for (let x = FACE.x0; x < FACE.x1; x++) if (px[y * EMBLEM_SIZE.w + x] !== ink) drawn++;
    }
    check(`${id} draws a glyph`, drawn >= 40, `${drawn} face pixels drawn`);

    // Distinctness: no two skills may render the same picture.
    const clash = seen.find((s) => s.px.every((v, i) => v === px[i]));
    check(`${id} is visually distinct`, !clash, clash ? `same picture as ${clash.id}` : '');
    seen.push({ id, px });
  }

  // An unknown id still renders the fallback rune rather than throwing.
  const fallback = skillEmblemPixels('not-a-skill');
  check('unknown ids fall back to a rune', fallback.length === 1024);
}

if (failures.length) {
  console.error(`\n${failures.length} failed, ${passed} passed\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`emblems: ${passed} checks passed`);
