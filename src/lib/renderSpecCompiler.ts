import {
  CharacterSkill,
  CustomAbility,
  Equipment,
  PortraitBodyType,
  PortraitConfig,
  PortraitRenderAge,
  PortraitRenderExpression,
  PortraitRenderOptions,
  PortraitTint,
  Race,
  StandingStone,
} from "@/types/character";
import {
  BACKDROP_OPTIONS,
  CatalogCharacter,
  PortraitCatalog,
  TINT_PRESETS,
  buildUrlAnchorMap,
  cleanSlotDisplayLabel,
  getEffectiveTintGroup,
} from "./portraitCatalog";

export interface CharacterSheetRenderContext {
  name?: string;
  race?: Pick<Race, "id" | "name" | "abilityName">;
  standingStone?: Pick<StandingStone, "name" | "archetype">;
  skills?: CharacterSkill[];
  equipment?: Equipment[];
  customAbilities?: CustomAbility[];
}

export const DEFAULT_RENDER_OPTIONS: PortraitRenderOptions = {
  usePreRenderOnly: false,
  bodyType: "athletic",
  customBodyNote: "",
  expression: "stoic",
  customExpressionNote: "",
  age: "seasoned",
  customAgeNote: "",
};

export const BODY_TYPE_DESCRIPTIONS: Record<PortraitBodyType, { label: string; prompt: string }> = {
  lean: {
    label: "Lean / Slim",
    prompt: "thin slender narrow-shouldered build with sharper cheekbones, slim neck, and slender chest",
  },
  wiry: {
    label: "Wiry / Agile",
    prompt: "wiry sinewy agile build with gaunt sculpted cheeks, slim neck, and narrow athletic shoulders",
  },
  athletic: { label: "Athletic / Toned", prompt: "toned athletic balanced build" },
  muscular: {
    label: "Muscular / Heroic",
    prompt: "thick muscular heroic warrior build with widened jaw, thick neck/traps, and broad heavy shoulders",
  },
  broad: {
    label: "Broad / Brawny",
    prompt: "wide broad-chested brawny build with thick neck, square heavy jaw, and massive wide shoulders",
  },
  curvy: {
    label: "Curvy / Voluptuous",
    prompt: "curvy plush full-figured hourglass build with softer fuller cheeks, rounded jaw, and broad full chest",
  },
  stout: {
    label: "Stout / Stocky",
    prompt: "stout wide stocky build with fuller round face, thick short neck, and heavy broad shoulders",
  },
  heavy: {
    label: "Heavy / Plus-Sized",
    prompt: "noticeably fat plus-sized heavyset build with chubby round cheeks, soft double chin, thick heavy neck, wide hefty shoulders, and broad fat torso",
  },
  hulking: {
    label: "Hulking / Massive",
    prompt: "massive towering hulking juggernaut frame with thick heavy jaw, bull neck, and enormous wide torso and shoulders",
  },
};

export const EXPRESSION_DESCRIPTIONS: Record<PortraitRenderExpression, { label: string; prompt: string }> = {
  stoic: { label: "Stoic Resolve", prompt: "stoic calm gaze" },
  fierce: { label: "Fierce Battle Snarl", prompt: "fierce snarling battle scowl" },
  cold: { label: "Cold & Calculating", prompt: "cold sharp calculating gaze" },
  arcane: { label: "Arcane Focus", prompt: "intense mystic focus" },
  smirk: { label: "Roguish Smirk", prompt: "cocky roguish smirk" },
  warm: { label: "Warm / Kind", prompt: "warm kind gentle half-smile" },
  haunted: { label: "Haunted / Grim", prompt: "solemn weary grim gaze" },
  serene: { label: "Serene Meditative", prompt: "calm peaceful meditative expression" },
};

export const AGE_DESCRIPTIONS: Record<PortraitRenderAge, { label: string; prompt: string }> = {
  youthful: { label: "Youthful (Late Teens / Early 20s)", prompt: "youthful unlined early-20s face" },
  "young-adult": { label: "Young Adult (20s)", prompt: "young adult crisp mid-20s face" },
  seasoned: { label: "Seasoned Prime (30s–40s)", prompt: "mature 30s-40s weathered features" },
  veteran: { label: "Grizzled Veteran (40s–50s)", prompt: "grizzled creased 40s-50s veteran face" },
  elder: { label: "Elder / Ancient (60s+)", prompt: "deeply lined aged 60s+ elder face" },
};

const RACE_DEFAULT_SKIN: Record<string, string> = {
  breton: "warm fair peach skin",
  nord: "fair pale ivory skin",
  imperial: "warm olive-tan skin",
  redguard: "rich deep umber skin",
  "high-elf": "warm golden Altmer skin",
  "dark-elf": "cool ash-gray Dunmer skin",
  "wood-elf": "warm earthy tan skin",
  orc: "olive-green Orsimer skin",
  khajiit: "patterned feline fur",
  argonian: "detailed reptilian scales",
};

const SKIN_PRESET_WORDS: Record<string, string> = {
  "Fair Nordic": "fair ivory skin",
  "Sun-Bronzed": "sun-bronzed tan skin",
  "Deep Umber": "deep umber skin",
  "Vampire Pale": "vampiric pale skin",
  "Ash Dunmer": "ash-gray Dunmer skin",
  "Altmer Gold": "golden Altmer skin",
  "Orsimer Jade": "olive-jade Orsimer skin",
};

const CLOTH_PIGMENT_STRIP_RE =
  /\b(espresso|auburn|chestnut|brunette|blonde|blond|ginger|rose-copper|copper-auburn|copper|raven|jet-black|midnight-black|midnight|ash-brown|ash-black|ash-blond|ash-blonde|ash-grey|ash-gray|salt-and-pepper|iron-grey|iron-gray|platinum|pearlescent|pearl-white|ivory|obsidian|ebony|sandy-brown|dark-brown|dark brown|light-brown|light brown|dark-auburn|black-brown|brown|black|dark(?!\s+(?:brotherhood|steel|iron))|crimson-copper|crimson-amber|crimson-red|crimson|bloodmoon|blood-crimson|blood-red|scarlet|ruby|garnet|burgundy|maroon|amber-gold|amber-orange|amber-brown|amber|solar-gold|molten gold|molten amber|fiery-amber|fiery|volcanic ember|golden-hazel|golden-white|golden-amber|golden-brown|golden-blonde|emerald-gold|emerald-cyan|emerald|malachite|eldritch green|fel emerald|forest-green|moss-green|sage-green|jade-green|jade|pale-green|olive-brown|olive|green|turquoise|teal-violet|teal|cerulean|cobalt|azure|sapphire|pale-cyan|arcane cyan|neon-cyan|bioluminescent cyan|cyan|ice-blue|steel-blue|grey-blue|gray-blue|pale-blue|pale-ice|dark blue|blue|indigo-purple|indigo|bioluminescent violet|nocturnal violet|royal violet|violet|amethyst|magenta|purple|pale-ochre|ochre|pale-gold|pale-jade|cream-sand|cream|hazel-brown|hazel|grey|gray|white|tan)\b/gi;

function describeSkinTint(tint?: PortraitTint): string | null {
  if (!tint) return null;
  if (tint.hueRotate === 0 && tint.saturate === 100 && tint.brightness === 100) return null;
  const preset = TINT_PRESETS.skin.find(
    (p) =>
      p.tint.hueRotate === tint.hueRotate &&
      p.tint.saturate === tint.saturate &&
      p.tint.brightness === tint.brightness
  );
  if (preset) {
    if (preset.name === "Natural") return null;
    return SKIN_PRESET_WORDS[preset.name] || preset.name.toLowerCase();
  }
  return "custom skin tone matching reference";
}

function resolveSlotEntry(
  catalog: PortraitCatalog,
  urlAnchorMap: Record<string, { char: CatalogCharacter; labels: Record<string, string> }>,
  slotKey: string,
  url: string | null
): { label: string; sourceChar?: CatalogCharacter } | null {
  if (!url) return null;
  const mapped = urlAnchorMap[url];
  if (mapped?.labels[slotKey]) {
    return { label: mapped.labels[slotKey], sourceChar: mapped.char };
  }
  for (const ch of catalog.characters) {
    if (ch.baseLayers[slotKey] === url) {
      return { label: ch.baseSlotLabels?.[slotKey] || ch.displayName, sourceChar: ch };
    }
    for (const v of ch.variants) {
      if (v.layers[slotKey] === url) {
        return { label: v.slotLabels?.[slotKey] || v.label, sourceChar: ch };
      }
    }
  }
  return null;
}

function shouldSkipSlotLabel(rawLabel: string): boolean {
  const lower = rawLabel.toLowerCase();
  return (
    /\bempty\b/.test(lower) ||
    lower === "clean unscarred complexion" ||
    lower === "clean-shaven jawline"
  );
}

function formatStructuralFeature(
  slotKey: string,
  rawLabel: string,
  sourceChar: CatalogCharacter | undefined,
  defaultGroup: "skin" | "hair" | "eyes" | "warpaint" | "gear" | "cloak" | "none",
  tints: PortraitConfig["tints"] | undefined
): string {
  const cleaned = cleanSlotDisplayLabel(slotKey, rawLabel, sourceChar);
  const lower = cleaned.toLowerCase();

  if (slotKey === "08_eyes.png") {
    if (lower.includes("heterochromia")) {
      return `${lower.replace(/\bheterochromia\b/g, "heterochromia/differently colored")} matching the image`;
    }
    if (lower.includes("&")) {
      return `${lower} matching the image`;
    }
    return lower;
  }

  const effectiveGroup = getEffectiveTintGroup(slotKey, rawLabel, defaultGroup);
  const activeTint = effectiveGroup !== "none" ? tints?.[effectiveGroup] : undefined;
  const hasTintOverride =
    activeTint &&
    (activeTint.hueRotate !== 0 || activeTint.saturate !== 100 || activeTint.brightness !== 100);

  if (hasTintOverride && (effectiveGroup === "cloak" || effectiveGroup === "gear" || effectiveGroup === "warpaint")) {
    const noHue = cleaned
      .replace(CLOTH_PIGMENT_STRIP_RE, "")
      .replace(/\s*&\s*(?=&|\s|$)/g, " ")
      .replace(/\s+[-–—]\s+/g, " ")
      .replace(/\s{2,}/g, " ")
      .replace(/^[\s,&\-–—/]+|[\s,&\-–—/]+$/g, "")
      .trim()
      .toLowerCase();
    return noHue || lower;
  }

  return lower;
}

export function compileRenderPrompt(params: {
  portrait: PortraitConfig;
  catalog: PortraitCatalog;
  sheet?: CharacterSheetRenderContext;
}): { prompt: string; fluxPrompt: string; summary: string } {
  const { portrait, catalog, sheet } = params;
  const opts: PortraitRenderOptions = {
    ...DEFAULT_RENDER_OPTIONS,
    ...(portrait.renderOptions || {}),
  };

  const urlAnchorMap = buildUrlAnchorMap(catalog);
  const baseChar = catalog.characters.find((c) => c.id === portrait.baseCharacterId);
  const genderWord = baseChar?.gender === "male" ? "male" : "female";
  const raceName = sheet?.race?.name || baseChar?.raceName || "Nord";

  const featureOrder = [
    "16_headgear_horns.png",
    "15_hair_front.png",
    "02_hair_back.png",
    "09_eyebrows.png",
    "08_eyes.png",
    "10_face_markings.png",
    "11_facial_hair.png",
    "12_earring_ears.png",
    "13_armor_torso.png",
    "14_cloak_mantle.png",
    "04_body_markings.png",
  ];

  const equipment = sheet?.equipment || [];
  const weapons = equipment.filter((e) => e.type === "weapon");
  const shields = equipment.filter((e) => e.type === "shield");
  const armors = equipment.filter((e) => e.type === "armor");

  const visualFeatures: string[] = [];
  for (const key of featureOrder) {
    const entry = resolveSlotEntry(catalog, urlAnchorMap, key, portrait.slots?.[key] ?? null);
    if (!entry || shouldSkipSlotLabel(entry.label)) continue;
    const defaultGroup = catalog.slots?.[key]?.tintGroup || "none";
    visualFeatures.push(
      formatStructuralFeature(key, entry.label, entry.sourceChar, defaultGroup, portrait.tints)
    );
  }

  const equippedList: string[] = [];
  if (armors.length > 0 && !portrait.slots?.["13_armor_torso.png"]) {
    equippedList.push(armors.map((a) => a.name).join(", "));
  }
  for (const w of weapons) {
    equippedList.push(
      w.enchantment ? `${w.name} (${w.enchantment.name} glow)` : w.name
    );
  }
  for (const s of shields) {
    equippedList.push(s.name);
  }

  const magicSchools = (sheet?.skills || [])
    .filter((s) =>
      ["destruction", "conjuration", "restoration", "alteration", "illusion"].includes(
        s.skillId.toLowerCase()
      )
    )
    .map((s) => s.skillId.toLowerCase());

  const physiqueText = [
    (BODY_TYPE_DESCRIPTIONS[opts.bodyType] || BODY_TYPE_DESCRIPTIONS.athletic).prompt,
    opts.customBodyNote?.trim() || null,
  ]
    .filter(Boolean)
    .join(", ");

  const expressionText = [
    (EXPRESSION_DESCRIPTIONS[opts.expression] || EXPRESSION_DESCRIPTIONS.stoic).prompt,
    opts.customExpressionNote?.trim() || null,
  ]
    .filter(Boolean)
    .join(", ");

  const ageText = [
    (AGE_DESCRIPTIONS[opts.age] || AGE_DESCRIPTIONS.seasoned).prompt,
    opts.customAgeNote?.trim() || null,
  ]
    .filter(Boolean)
    .join(", ");

  const targetSkinTone =
    describeSkinTint(portrait.tints?.skin) ||
    RACE_DEFAULT_SKIN[baseChar?.raceId || ""] ||
    "consistent natural skin";

  const backdrop = BACKDROP_OPTIONS.find((b) => b.id === (portrait.backdropStyle || "rune"));
  const backdropVisuals: Record<string, string> = {
    rune: "full-bleed dark-navy background, glowing cyan rune circle, warm orange embers",
    crimson: "full-bleed deep dark-crimson background, glowing blood-red rune circle, fiery embers",
    void: "full-bleed deep dark-violet background, glowing violet-magenta rune circle, bright green embers",
    gold: "full-bleed deep dark-slate bronze background, glowing warm golden rune circle, golden embers",
    emerald: "full-bleed deep dark-teal background, glowing emerald-green rune circle, cyan-amber embers",
  };
  const backdropText =
    backdropVisuals[backdrop?.id || "rune"] ||
    `full-bleed background, glowing ${backdrop?.label || "Nordic Cyan"} rune circle and embers`;

  const physiqueOverride =
    opts.bodyType !== "athletic" || Boolean(opts.customBodyNote?.trim())
      ? `Reshape the slim reference face, cheeks, chin, neck, shoulders, and torso into the ${BODY_TYPE_DESCRIPTIONS[opts.bodyType]?.label.split(" / ")[0].toLowerCase() || opts.bodyType} build.`
      : "";

  const prompt = [
    `Re-draw and unify the attached rough layered portrait collage as a ${physiqueText} ${genderWord} ${raceName} in a cohesive, polished dark-fantasy 32-bit pixel art portrait. Fix any visual glitches and errors from kitbashing.`,
    `Subject: ${physiqueOverride ? `${physiqueOverride} ` : ""}Continuous ${targetSkinTone} across face, neck, chest, and arms, ${ageText}, ${expressionText}.`,
    visualFeatures.length > 0 ? `Appearance & Outfit: ${visualFeatures.join(", ")}.` : "",
    equippedList.length > 0 ? `Equipped: wielding ${equippedList.join(", ")}.` : "",
    magicSchools.length > 0 ? `Magic flourish: strong ${magicSchools.slice(0, 2).join("/")} sparks.` : "",
    `Colors & Style: keep exact hair, eyebrow, eye, heterochromia, warpaint, cloak, and garment colors from the reference image; hand-crafted 32-bit RPG pixel art, crisp 1px dark ink outlines, sculpted cel shading, dithering, upper-left key light, seamless hair roots, sculpted lips, natural shoulder drape.`,
    `Composition & Backdrop: centered 3:4 bust portrait with generous headroom, ${backdropText}, keep exact backdrop void, halo, and ember colors from the image, no border.`,
    `Cleanup Note: Provided image is a multi-race kitbashed pre-render reference with assembly errors—repair seams, skin mismatches, clipped hair/ears, and layer artifacts into one clean, unified portrait.`,
  ]
    .filter(Boolean)
    .join("\n");

  const fluxBodyCue =
    opts.bodyType !== "athletic" || Boolean(opts.customBodyNote?.trim())
      ? ` Reshape the face, cheeks, jaw, neck, shoulders, and torso cleanly into a ${physiqueText}.`
      : "";

  const fluxPrompt = [
    `Repaint the character in image 0 as a seamless, cohesive 32-bit RPG pixel-art bust portrait of a ${physiqueText} ${genderWord} ${raceName} (${ageText}) with ${expressionText}.${fluxBodyCue}`,
    `Paint smooth, uniform ${targetSkinTone} evenly across the entire face, temples, jawline, neck, chest, and bare shoulders, with hair flowing naturally behind the ears, crisp sculpted lips, and unified armor and fabric transitions.`,
    visualFeatures.length > 0 ? `Retain all identity and outfit elements from image 0: ${visualFeatures.join(", ")}.` : "",
    equippedList.length > 0 ? `Depict equipped gear cleanly in hand or worn: ${equippedList.join(", ")}.` : "",
    magicSchools.length > 0 ? `Add ${magicSchools.slice(0, 2).join(" and ")} magic sparks around the character.` : "",
    `Keep the exact hair, eyebrow, eye, heterochromia, warpaint, cloak, and garment color palette from image 0. Render in hand-crafted 32-bit dark-fantasy RPG pixel art with crisp 1px dark ink outlines, sculpted cel shading, subtle dithering, and warm upper-left key light.`,
    `Compose a centered 3:4 bust portrait with generous headroom filling the entire canvas edge-to-edge against ${backdropText}.`,
  ]
    .filter(Boolean)
    .join(" ");

  const summary = `${raceName} ${genderWord} • ${BODY_TYPE_DESCRIPTIONS[opts.bodyType]?.label || opts.bodyType} • ${EXPRESSION_DESCRIPTIONS[opts.expression]?.label || opts.expression}`;
  return { prompt, fluxPrompt, summary };
}
