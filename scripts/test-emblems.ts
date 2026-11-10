// Checks for the in-game skill glyphs.
// Run: npm run test:emblems
import { skills } from '@/data/skills';
import { EMBLEM_INK, EMBLEM_SIZE, SKILL_EMBLEM_IDS, skillEmblemPixels } from '@/characters/skillEmblem';

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
    check(`${skill.id} has a glyph`, drawn.has(skill.id));
    check(
      `${skill.id} explains itself`,
      typeof skill.summary === 'string' && skill.summary.length > 20,
      skill.summary ?? '(no summary)',
    );
  }
  check('no orphan glyphs', drawn.size === skills.length, `${drawn.size} glyphs vs ${skills.length} skills`);
}

// --- the drawing ----------------------------------------------------------
{
  check('glyph is 32×32', EMBLEM_SIZE.w === 32 && EMBLEM_SIZE.h === 32);

  const seen: { id: string; px: Uint32Array }[] = [];
  const W = EMBLEM_SIZE.w;
  const H = EMBLEM_SIZE.h;

  for (const id of SKILL_EMBLEM_IDS) {
    const px = skillEmblemPixels(id);
    check(`${id} fills the buffer`, px.length === W * H);

    let clear = 0;
    let ink = 0;
    let minX = W;
    let minY = H;
    let maxX = -1;
    let maxY = -1;
    const colours = new Set<number>();

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const c = px[y * W + x];
        if ((c >>> 24) === 0) {
          clear++;
          continue;
        }
        colours.add(c);
        if (c === EMBLEM_INK) ink++;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }

    // A HUD glyph has no plate behind it: the card shows through.
    check(`${id} is transparent`, clear >= 260, `${clear} clear pixels`);
    check(`${id} has corner transparency`, (px[0] >>> 24) === 0 && (px[px.length - 1] >>> 24) === 0);
    check(`${id} is outlined`, ink >= 30, `${ink} ink pixels`);
    check(`${id} uses the ramps`, colours.size >= 3, `${colours.size} colours`);

    // It has to read at 20 px, which means a real silhouette, not a speck.
    check(`${id} fills the square`, minX <= 6 && maxX >= 25 && minY <= 6 && maxY >= 25, `x ${minX}–${maxX}, y ${minY}–${maxY}`);
    check(`${id} keeps a margin`, minX >= 1 && minY >= 1 && maxX <= 30 && maxY <= 30);

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
