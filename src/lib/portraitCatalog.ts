import { PortraitBackdropStyle, PortraitConfig, PortraitTint } from "@/types/character";

export type TintGroup = "skin" | "hair" | "eyes" | "warpaint" | "gear" | "cloak" | "none";

export interface SlotMeta {
  label: string;
  category: string;
  tintGroup: TintGroup;
  canHide: boolean;
  anchorType: "eye" | "mouth" | "body";
}

export interface CharacterAnchor {
  eyeX: number;
  eyeY: number;
  mouthX: number;
  mouthY: number;
}

export interface CatalogVariant {
  id: string;
  label: string;
  archetype: string;
  isExpansionPack?: boolean;
  layers: Record<string, string>;
  slotLabels: Record<string, string>;
  clearSlots: string[];
}

export interface CatalogCharacter {
  id: string;
  raceId: string;
  raceName: string;
  gender: "female" | "male";
  displayName: string;
  compatibilityGroup: string;
  anchor: CharacterAnchor;
  baseLayers: Record<string, string>;
  baseSlotLabels: Record<string, string>;
  variants: CatalogVariant[];
}

export interface PortraitCatalog {
  version: number;
  canvas: { width: number; height: number };
  layerOrder: string[];
  slots: Record<string, SlotMeta>;
  characters: CatalogCharacter[];
}

export interface SlotOption {
  url: string;
  label: string;
  sourceCharacterId: string;
  sourceDisplayName: string;
  sourceAnchor: CharacterAnchor;
  variantLabel?: string;
  isSameCharacter: boolean;
  isSameCompatGroup: boolean;
  isExpansionPack?: boolean;
}

export interface ColorPreset {
  name: string;
  swatch: string;
  tint: PortraitTint;
}

export const DEFAULT_TINT: PortraitTint = {
  hueRotate: 0,
  saturate: 100,
  brightness: 100,
};

export function createDefaultTints(): PortraitConfig["tints"] {
  return {
    skin: { ...DEFAULT_TINT },
    hair: { ...DEFAULT_TINT },
    eyes: { ...DEFAULT_TINT },
    warpaint: { ...DEFAULT_TINT },
    gear: { ...DEFAULT_TINT },
    cloak: { ...DEFAULT_TINT },
  };
}

export const TINT_PRESETS: Record<Exclude<TintGroup, "none">, ColorPreset[]> = {
  skin: [
    { name: "Natural", swatch: "#c99672", tint: { hueRotate: 0, saturate: 100, brightness: 100 } },
    { name: "Fair Nordic", swatch: "#dfb69a", tint: { hueRotate: 4, saturate: 82, brightness: 112 } },
    { name: "Sun-Bronzed", swatch: "#ad6e46", tint: { hueRotate: -4, saturate: 112, brightness: 88 } },
    { name: "Deep Umber", swatch: "#6b422d", tint: { hueRotate: -6, saturate: 95, brightness: 68 } },
    { name: "Vampire Pale", swatch: "#d6d9e0", tint: { hueRotate: -10, saturate: 35, brightness: 116 } },
    { name: "Ash Dunmer", swatch: "#7f8694", tint: { hueRotate: 195, saturate: 28, brightness: 86 } },
    { name: "Altmer Gold", swatch: "#d79f3e", tint: { hueRotate: 12, saturate: 132, brightness: 104 } },
    { name: "Orsimer Jade", swatch: "#6b7d42", tint: { hueRotate: 64, saturate: 96, brightness: 92 } },
  ],
  hair: [
    { name: "Natural", swatch: "#5e4534", tint: { hueRotate: 0, saturate: 100, brightness: 100 } },
    { name: "Platinum", swatch: "#d8dde6", tint: { hueRotate: 0, saturate: 18, brightness: 142 } },
    { name: "Raven Black", swatch: "#1f232b", tint: { hueRotate: 0, saturate: 35, brightness: 54 } },
    { name: "Flame Copper", swatch: "#b84928", tint: { hueRotate: -18, saturate: 155, brightness: 106 } },
    { name: "Crimson Dye", swatch: "#a92335", tint: { hueRotate: -38, saturate: 165, brightness: 98 } },
    { name: "Emerald Moss", swatch: "#2f855a", tint: { hueRotate: 115, saturate: 140, brightness: 96 } },
    { name: "Arcane Cyan", swatch: "#38bdf8", tint: { hueRotate: 175, saturate: 160, brightness: 112 } },
    { name: "Void Violet", swatch: "#9333ea", tint: { hueRotate: -85, saturate: 155, brightness: 102 } },
  ],
  eyes: [
    { name: "Natural", swatch: "#d49b35", tint: { hueRotate: 0, saturate: 100, brightness: 100 } },
    { name: "Blood Crimson", swatch: "#dc2626", tint: { hueRotate: -35, saturate: 175, brightness: 104 } },
    { name: "Glacial Blue", swatch: "#38bdf8", tint: { hueRotate: 168, saturate: 160, brightness: 114 } },
    { name: "Fel Emerald", swatch: "#22c55e", tint: { hueRotate: 88, saturate: 155, brightness: 108 } },
    { name: "Oblivion Violet", swatch: "#a855f7", tint: { hueRotate: -85, saturate: 165, brightness: 108 } },
    { name: "Ghost Blind", swatch: "#e2e8f0", tint: { hueRotate: 0, saturate: 10, brightness: 138 } },
  ],
  warpaint: [
    { name: "Natural", swatch: "#c87f55", tint: { hueRotate: 0, saturate: 100, brightness: 100 } },
    { name: "Nordic Woad", swatch: "#3b82f6", tint: { hueRotate: 185, saturate: 150, brightness: 104 } },
    { name: "Blood Scar", swatch: "#b91c1c", tint: { hueRotate: -24, saturate: 165, brightness: 92 } },
    { name: "Bone White", swatch: "#e5e7eb", tint: { hueRotate: 0, saturate: 12, brightness: 142 } },
    { name: "Hist Glow", swatch: "#4ade80", tint: { hueRotate: 92, saturate: 165, brightness: 116 } },
    { name: "Obsidian Ink", swatch: "#1e293b", tint: { hueRotate: 0, saturate: 25, brightness: 54 } },
  ],
  gear: [
    { name: "Natural", swatch: "#94a3b8", tint: { hueRotate: 0, saturate: 100, brightness: 100 } },
    { name: "Obsidian Plate", swatch: "#1e293b", tint: { hueRotate: 0, saturate: 45, brightness: 60 } },
    { name: "Imperial Gold", swatch: "#eab308", tint: { hueRotate: 18, saturate: 145, brightness: 110 } },
    { name: "Malachite Glass", swatch: "#10b981", tint: { hueRotate: 120, saturate: 145, brightness: 105 } },
    { name: "Blood Daedric", swatch: "#991b1b", tint: { hueRotate: -32, saturate: 160, brightness: 86 } },
    { name: "Silver Steel", swatch: "#cbd5e1", tint: { hueRotate: 195, saturate: 35, brightness: 118 } },
  ],
  cloak: [
    { name: "Natural", swatch: "#64748b", tint: { hueRotate: 0, saturate: 100, brightness: 100 } },
    { name: "Charcoal", swatch: "#1e293b", tint: { hueRotate: 0, saturate: 30, brightness: 62 } },
    { name: "Stormcloak Blue", swatch: "#2563eb", tint: { hueRotate: 175, saturate: 145, brightness: 98 } },
    { name: "Crimson Velvet", swatch: "#9f1239", tint: { hueRotate: -35, saturate: 150, brightness: 92 } },
    { name: "Ranger Green", swatch: "#15803d", tint: { hueRotate: 95, saturate: 135, brightness: 92 } },
    { name: "Telvanni Violet", swatch: "#6d28d9", tint: { hueRotate: -85, saturate: 145, brightness: 96 } },
  ],
};

export const BACKDROP_OPTIONS: Array<{ id: PortraitBackdropStyle; label: string; tintFilter: string }> = [
  { id: "rune", label: "Nordic Cyan", tintFilter: "none" },
  { id: "crimson", label: "Oblivion Blood", tintFilter: "hue-rotate(155deg) saturate(145%) brightness(95%)" },
  { id: "void", label: "Soul Cairn Violet", tintFilter: "hue-rotate(92deg) saturate(135%) brightness(92%)" },
  { id: "gold", label: "Aetherium Gold", tintFilter: "hue-rotate(-140deg) saturate(140%) brightness(105%)" },
  { id: "emerald", label: "Black Marsh Hist", tintFilter: "hue-rotate(-38deg) saturate(135%) brightness(98%)" },
];

const RACE_SLUG_MAP: Record<string, string> = {
  nord: "nord",
  breton: "breton",
  imperial: "imperial",
  redguard: "redguard",
  "high-elf": "highelf",
  "wood-elf": "woodelf",
  "dark-elf": "darkelf",
  orc: "orc",
  khajiit: "khajiit",
  argonian: "argonian",
};

let catalogPromise: Promise<PortraitCatalog> | null = null;
let cachedCatalog: PortraitCatalog | null = null;

export function getCachedPortraitCatalog(): PortraitCatalog | null {
  return cachedCatalog;
}

export async function loadPortraitCatalog(): Promise<PortraitCatalog> {
  if (cachedCatalog) return cachedCatalog;
  if (!catalogPromise) {
    catalogPromise = fetch("/character-layers/catalog.json")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load portrait catalog: ${res.status}`);
        return res.json();
      })
      .then((data: PortraitCatalog) => {
        cachedCatalog = data;
        return data;
      });
  }
  return catalogPromise;
}

export function raceToCharacterId(raceId: string, gender: "female" | "male" = "female"): string {
  const slug = RACE_SLUG_MAP[raceId] || "nord";
  return `${slug}_${gender}`;
}

export function buildDefaultPortraitConfig(
  charEntry: CatalogCharacter,
  variantId?: string
): PortraitConfig {
  const chosenVariant =
    variantId && variantId !== "base"
      ? charEntry.variants.find((v) => v.id === variantId)
      : undefined;

  const slots: Record<string, string | null> = {};
  for (const [k, url] of Object.entries(charEntry.baseLayers)) {
    if (k === "01_background.png" || k === "17_frame.png") continue;
    slots[k] = url;
  }

  if (chosenVariant) {
    for (const clearKey of chosenVariant.clearSlots || []) {
      slots[clearKey] = null;
    }
    for (const [k, url] of Object.entries(chosenVariant.layers)) {
      slots[k] = url;
    }
  }

  return {
    baseCharacterId: charEntry.id,
    presetVariantId: chosenVariant?.id || "base",
    slots,
    slotOffsets: {},
    tints: createDefaultTints(),
    unlockAllRaces: false,
    backdropStyle: "rune",
  };
}

export function buildUrlAnchorMap(
  catalog: PortraitCatalog
): Record<string, { char: CatalogCharacter; labels: Record<string, string> }> {
  const map: Record<string, { char: CatalogCharacter; labels: Record<string, string> }> = {};
  const register = (url: string | undefined, slotKey: string, label: string | undefined, char: CatalogCharacter) => {
    if (!url || url.includes("/shared/")) return;
    if (!map[url]) map[url] = { char, labels: {} };
    if (label) map[url].labels[slotKey] = label;
  };
  for (const ch of catalog.characters) {
    for (const [k, url] of Object.entries(ch.baseLayers)) {
      register(url, k, ch.baseSlotLabels?.[k], ch);
    }
    for (const v of ch.variants) {
      for (const [k, url] of Object.entries(v.layers)) {
        register(url, k, v.slotLabels?.[k], ch);
      }
    }
  }
  return map;
}

const BAKED_PIGMENT_WORDS_RE =
  /\b(espresso|auburn|chestnut|brunette|blonde|blond|ginger|rose-copper|copper-auburn|copper|raven|jet-black|midnight-black|midnight|ash-brown|ash-black|ash-blond|ash-blonde|ash-grey|ash-gray|salt-and-pepper|iron-grey|iron-gray|platinum|pearlescent|pearl-white|obsidian|ebony|sandy-brown|dark-brown|dark brown|light-brown|light brown|dark-auburn|black-brown|brown|black|dark(?!\s+(?:brotherhood|steel|iron))|crimson-copper|crimson-amber|crimson-red|crimson|bloodmoon|blood-crimson|blood-red|scarlet|ruby|garnet|burgundy|maroon|amber-gold|amber-orange|amber-brown|amber|solar-gold|molten gold|molten amber|fiery-amber|fiery|volcanic ember|golden-hazel|golden-white|golden-amber|golden-brown|golden-blonde|emerald-gold|emerald-cyan|emerald|eldritch green|fel emerald|forest-green|moss-green|sage-green|jade-green|jade|pale-green|olive-brown|olive|green|turquoise|teal-violet|teal|cerulean|cobalt|azure|sapphire|pale-cyan|arcane cyan|neon-cyan|bioluminescent cyan|cyan|ice-blue|steel-blue|grey-blue|gray-blue|pale-blue|pale-ice|dark blue|blue|indigo-purple|indigo|bioluminescent violet|nocturnal violet|royal violet|violet|amethyst|magenta|purple|pale-ochre|ochre|pale-jade|hazel-brown|hazel|grey|gray|white|tan|gold(?!(?:\s+|-)+(?:wire|cuff|cuffs|ring|rings|ringed|pin|pins|clasp|clasps|chain|chains|brooch|medallion|buckle|laurel|trim|trimmed|filigree|sunburst|eagle|coin|eye|drop|teardrop|bead|beads|beaded))|golden(?!(?:\s+|-)+(?:wire|cuff|cuffs|ring|rings|ringed|pin|pins|clasp|clasps|chain|chains|brooch|medallion|buckle|laurel|trim|trimmed|filigree|sunburst|eagle|coin|eye|drop|teardrop|bead|beads|beaded))|silver(?!(?:\s+|-)+(?:wire|cuff|cuffs|ring|rings|ringed|pin|pins|hairpin|clasp|clasps|chain|chains|brooch|medallion|buckle|hoop|hoops|stud|studs|beads|beaded|septum|brow|nose|filigree|drop|pendant)))\b/gi;

const COLOR_FLEXIBLE_SLOTS = new Set<string>([
  "02_hair_back.png",
  "08_eyes.png",
  "09_eyebrows.png",
  "11_facial_hair.png",
  "15_hair_front.png",
]);

export function cleanSlotDisplayLabel(
  slotKey: string,
  rawLabel: string,
  sourceChar?: CatalogCharacter
): string {
  const noNotes = rawLabel
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (slotKey === "12_earring_ears.png" && sourceChar) {
    const lower = noNotes.toLowerCase();
    const hasAnatomy = /\b(ear|ears|elven|bosmer|altmer|dunmer|orsimer|cat|lynx|human|half-elven)\b/.test(lower) &&
      (/\b(pointed|elven|bosmer|altmer|dunmer|orsimer|cat|lynx|human|half-elven)\b/.test(lower));
    if (!hasAnatomy && !/\bempty\b/i.test(lower)) {
      const race = sourceChar.raceId;
      const prefix =
        race === "high-elf" || race === "wood-elf" || race === "dark-elf"
          ? "Pointed Elven Ear — "
          : race === "breton"
          ? "Half-Elven Ear — "
          : race === "orc"
          ? "Pointed Orsimer Ear — "
          : race === "khajiit"
          ? "Lynx Cat Ear — "
          : "Human Ear — ";
      return `${prefix}${noNotes}`;
    }
  }

  if (!COLOR_FLEXIBLE_SLOTS.has(slotKey)) {
    return noNotes;
  }

  const stripped = noNotes
    .replace(BAKED_PIGMENT_WORDS_RE, "")
    .replace(/\s*&\s*(?=&|\s|$)/g, " ")
    .replace(/\s+[-–—]\s+/g, " ")
    .replace(/\s*\/\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,&\-–—/]+|[\s,&\-–—/]+$/g, "")
    .trim();

  return stripped || noNotes;
}

export function getEffectiveTintGroup(
  slotKey: string,
  rawLabel: string | undefined,
  defaultGroup: TintGroup
): TintGroup {
  if (!rawLabel || defaultGroup === "none") return defaultGroup;
  const lower = rawLabel.toLowerCase();

  // Never tint pure scars, freckles, piercings, or eyepatches with warpaint dyes
  if (slotKey === "10_face_markings.png" || slotKey === "04_body_markings.png") {
    const hasPaintOrTattoo =
      /\b(paint|warpaint|war-paint|tattoo|tattoos|woad|rune|runes|sigil|sigils|henna|hist|stripe|streak|streaks|lace|circuit|markings|ash|tear|chevron)\b/.test(
        lower
      );
    if (!hasPaintOrTattoo) return "none";
  }

  // Never tint biological antlers, horns, dorsal spines, skull horns, or leather hats with metal armor tints
  if (slotKey === "16_headgear_horns.png") {
    const isOrganicOrCloth =
      /\b(antler|antlers|horn|horns|spines|crest|skull|bone|leather|tricorne|plume|hood|headband|headwrap)\b/.test(
        lower
      );
    const isMetalWork = /\b(circlet|crown|diadem|tiara|helmet|monocle)\b/.test(lower);
    if (isOrganicOrCloth && !isMetalWork) return "none";
  }

  return defaultGroup;
}

export const SKIN_LOCKED_SLOTS = new Set<string>([
  "05_nose.png",
  "06_mouth.png",
  "07_tusks_whiskers.png",
  "08_eyes.png",
  "09_eyebrows.png",
  "12_earring_ears.png",
]);

const STARTER_GATED_SLOTS = new Set<string>([
  "13_armor_torso.png",
  "14_cloak_mantle.png",
  "16_headgear_horns.png",
]);

export function collectSlotOptions(
  catalog: PortraitCatalog,
  targetChar: CatalogCharacter,
  slotKey: string,
  unlockAllRaces = false,
  starterOnly = false
): SlotOption[] {
  const options: SlotOption[] = [];
  const seenUrls = new Set<string>();
  const requireSameChar = !unlockAllRaces && SKIN_LOCKED_SLOTS.has(slotKey);
  const blockExpansionEquipment = starterOnly && STARTER_GATED_SLOTS.has(slotKey);

  const chars = [...catalog.characters].sort((a, b) => {
    if (a.id === targetChar.id) return -1;
    if (b.id === targetChar.id) return 1;
    const aCompat = a.compatibilityGroup === targetChar.compatibilityGroup ? 0 : 1;
    const bCompat = b.compatibilityGroup === targetChar.compatibilityGroup ? 0 : 1;
    if (aCompat !== bCompat) return aCompat - bCompat;
    return a.displayName.localeCompare(b.displayName);
  });

  for (const ch of chars) {
    const isSameCharacter = ch.id === targetChar.id;
    const isSameCompatGroup = ch.compatibilityGroup === targetChar.compatibilityGroup;
    if (requireSameChar && !isSameCharacter) {
      continue;
    }
    if (!unlockAllRaces && !isSameCharacter && !isSameCompatGroup) {
      continue;
    }

    const baseUrl = ch.baseLayers[slotKey];
    if (baseUrl && !seenUrls.has(baseUrl)) {
      seenUrls.add(baseUrl);
      const raw = ch.baseSlotLabels[slotKey] || `${ch.displayName} Base`;
      options.push({
        url: baseUrl,
        label: cleanSlotDisplayLabel(slotKey, raw, ch),
        sourceCharacterId: ch.id,
        sourceDisplayName: ch.displayName,
        sourceAnchor: ch.anchor,
        variantLabel: "Base Classic",
        isSameCharacter,
        isSameCompatGroup,
      });
    }

    for (const v of ch.variants) {
      if (blockExpansionEquipment && v.isExpansionPack) {
        continue;
      }
      const url = v.layers[slotKey];
      if (url && !seenUrls.has(url)) {
        seenUrls.add(url);
        const raw = v.slotLabels[slotKey] || `${v.label} (${ch.displayName})`;
        options.push({
          url,
          label: cleanSlotDisplayLabel(slotKey, raw, ch),
          sourceCharacterId: ch.id,
          sourceDisplayName: ch.displayName,
          sourceAnchor: ch.anchor,
          variantLabel: v.label,
          isSameCharacter,
          isSameCompatGroup,
          isExpansionPack: v.isExpansionPack,
        });
      }
    }
  }

  return options;
}

export function computeAutoAlignmentOffset(
  targetChar: CatalogCharacter | undefined,
  sourceChar: CatalogCharacter | undefined,
  slotMeta: SlotMeta | undefined
): { dx: number; dy: number } {
  if (!targetChar || !sourceChar || targetChar.id === sourceChar.id || !slotMeta) {
    return { dx: 0, dy: 0 };
  }
  if (slotMeta.anchorType === "body") {
    // Bust shoulders/collars sit on the shared 764x1024 frame; never shift vertically by snout/mouth height
    return { dx: 0, dy: 0 };
  }
  if (slotMeta.anchorType === "mouth") {
    return {
      dx: targetChar.anchor.mouthX - sourceChar.anchor.mouthX,
      dy: targetChar.anchor.mouthY - sourceChar.anchor.mouthY,
    };
  }
  return {
    dx: targetChar.anchor.eyeX - sourceChar.anchor.eyeX,
    dy: targetChar.anchor.eyeY - sourceChar.anchor.eyeY,
  };
}

export function randomizePortraitConfig(
  catalog: PortraitCatalog,
  targetChar: CatalogCharacter,
  current: PortraitConfig,
  unlockAllRaces = false,
  starterOnly = false
): PortraitConfig {
  const nextSlots: Record<string, string | null> = { ...current.slots };
  const customizableKeys = Object.keys(catalog.slots);
  const pickOne = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const findSourceClearSlots = (opt: SlotOption | undefined): string[] => {
    if (!opt || !opt.variantLabel || opt.variantLabel === "Base Classic") return [];
    const srcChar = catalog.characters.find((c) => c.id === opt.sourceCharacterId);
    const srcVar = srcChar?.variants.find((v) => v.label === opt.variantLabel);
    return srcVar?.clearSlots || [];
  };

  const findPairedLayerUrl = (opt: SlotOption | undefined, slotKey: string): string | null => {
    if (!opt) return null;
    const srcChar = catalog.characters.find((c) => c.id === opt.sourceCharacterId);
    if (!srcChar) return null;
    if (!opt.variantLabel || opt.variantLabel === "Base Classic") {
      return srcChar.baseLayers[slotKey] || null;
    }
    const srcVar = srcChar.variants.find((v) => v.label === opt.variantLabel);
    return srcVar?.layers[slotKey] || null;
  };

  const getRandomizerOptions = (slotFile: string): SlotOption[] => {
    const all = collectSlotOptions(catalog, targetChar, slotFile, unlockAllRaces, starterOnly);
    if (unlockAllRaces) return all;
    const sameChar = all.filter((o) => o.isSameCharacter);
    return sameChar.length > 0 ? sameChar : all;
  };

  // 1. Skin-locked anatomical features always stay matched to the character's own skeleton/skin
  for (const slotKey of customizableKeys) {
    if (!SKIN_LOCKED_SLOTS.has(slotKey)) continue;
    const meta = catalog.slots[slotKey];
    const ownOpts = getRandomizerOptions(slotKey).filter((o) => o.isSameCharacter);
    if (ownOpts.length === 0) {
      if (meta.canHide) nextSlots[slotKey] = null;
      continue;
    }
    if (meta.canHide && slotKey === "07_tusks_whiskers.png" && Math.random() < 0.3) {
      nextSlots[slotKey] = null;
      continue;
    }
    nextSlots[slotKey] = pickOne(ownOpts).url;
  }

  // 2. Match front & back hair as a cohesive pair (exclude hood-cropped bangs unless hood is equipped)
  const HOOD_BANGS_URL = "/character-layers/nord_female/variants/variant_b_mage/15_hair_front.png";
  const HOOD_HEADGEAR_URL = "/character-layers/nord_female/variants/variant_b_mage/16_headgear_horns.png";

  const hairFrontOpts = getRandomizerOptions("15_hair_front.png").filter(
    (o) => o.url !== HOOD_BANGS_URL
  );
  if (hairFrontOpts.length > 0) {
    const pickedHair = pickOne(hairFrontOpts);
    nextSlots["15_hair_front.png"] = pickedHair.url;
    nextSlots["02_hair_back.png"] = findPairedLayerUrl(pickedHair, "02_hair_back.png");
  } else {
    nextSlots["15_hair_front.png"] = null;
    const backOpts = getRandomizerOptions("02_hair_back.png");
    nextSlots["02_hair_back.png"] = backOpts.length > 0 ? pickOne(backOpts).url : null;
  }

  // 3. Cohesive Wardrobe: torso armor paired with matching cloak (75%) or null/compatible cloak (25%), no conflicting body markings
  const torsoOpts = getRandomizerOptions("13_armor_torso.png");
  if (torsoOpts.length > 0) {
    const pickedTorso = pickOne(torsoOpts);
    nextSlots["13_armor_torso.png"] = pickedTorso.url;
    nextSlots["04_body_markings.png"] = null;
    const matchedCloak = findPairedLayerUrl(pickedTorso, "14_cloak_mantle.png");
    if (matchedCloak && Math.random() < 0.75) {
      nextSlots["14_cloak_mantle.png"] = matchedCloak;
    } else if (Math.random() < 0.5) {
      nextSlots["14_cloak_mantle.png"] = null;
    } else {
      const cloakOpts = getRandomizerOptions("14_cloak_mantle.png");
      nextSlots["14_cloak_mantle.png"] = cloakOpts.length > 0 ? pickOne(cloakOpts).url : null;
    }
  } else {
    nextSlots["13_armor_torso.png"] = null;
  }

  // 4. Optional facial markings, beard, and headgear (respecting clearSlots and hood-bang pairing)
  const markOpts = getRandomizerOptions("10_face_markings.png");
  nextSlots["10_face_markings.png"] =
    markOpts.length > 0 && Math.random() >= 0.35 ? pickOne(markOpts).url : null;

  const beardOpts = getRandomizerOptions("11_facial_hair.png");
  if (targetChar.gender === "female" && !unlockAllRaces) {
    nextSlots["11_facial_hair.png"] = null;
  } else {
    nextSlots["11_facial_hair.png"] = beardOpts.length > 0 && Math.random() >= 0.25 ? pickOne(beardOpts).url : null;
  }

  const hgOpts = getRandomizerOptions("16_headgear_horns.png");
  if (hgOpts.length > 0 && Math.random() >= 0.35) {
    const pickedHg = pickOne(hgOpts);
    nextSlots["16_headgear_horns.png"] = pickedHg.url;
    if (pickedHg.url === HOOD_HEADGEAR_URL) {
      nextSlots["15_hair_front.png"] = HOOD_BANGS_URL;
      nextSlots["02_hair_back.png"] = null;
    } else {
      for (const clearKey of findSourceClearSlots(pickedHg)) {
        if (clearKey === "15_hair_front.png" || clearKey === "02_hair_back.png") {
          nextSlots[clearKey] = null;
        }
      }
    }
  } else {
    nextSlots["16_headgear_horns.png"] = null;
  }

  const pickPreset = (group: Exclude<TintGroup, "none">): PortraitTint => {
    const list = TINT_PRESETS[group];
    const p = list[Math.floor(Math.random() * list.length)];
    return { ...p.tint };
  };

  return {
    ...current,
    baseCharacterId: targetChar.id,
    presetVariantId: "custom",
    slots: nextSlots,
    tints: {
      skin: { ...DEFAULT_TINT },
      hair: pickPreset("hair"),
      eyes: pickPreset("eyes"),
      warpaint: pickPreset("warpaint"),
      gear: pickPreset("gear"),
      cloak: pickPreset("cloak"),
    },
    unlockAllRaces,
  };
}
