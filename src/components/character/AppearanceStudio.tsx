import { useEffect, useMemo, useRef, useState } from "react";
import {
  PortraitBackdropStyle,
  PortraitBodyType,
  PortraitConfig,
  PortraitRenderAge,
  PortraitRenderExpression,
  PortraitRenderOptions,
  PortraitTint,
} from "@/types/character";
import {
  BACKDROP_OPTIONS,
  CatalogCharacter,
  DEFAULT_TINT,
  PortraitCatalog,
  TINT_PRESETS,
  TintGroup,
  buildDefaultPortraitConfig,
  collectSlotOptions,
  createDefaultTints,
  loadPortraitCatalog,
  raceToCharacterId,
  randomizePortraitConfig,
} from "@/lib/portraitCatalog";
import {
  AGE_DESCRIPTIONS,
  BODY_TYPE_DESCRIPTIONS,
  CharacterSheetRenderContext,
  DEFAULT_RENDER_OPTIONS,
  EXPRESSION_DESCRIPTIONS,
} from "@/lib/renderSpecCompiler";
import { useStoredPortrait } from "@/lib/portraitStorage";
import { CharacterPortraitCanvas } from "./CharacterPortraitCanvas";
import { FinalRenderPanel } from "./FinalRenderPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dices,
  Download,
  EyeOff,
  Palette,
  RotateCcw,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Layers,
  Lock,
} from "lucide-react";

interface AppearanceStudioProps {
  value: PortraitConfig | undefined;
  raceId: string;
  onChange: (next: PortraitConfig) => void;
  allowSkeletonSwitch?: boolean;
  compactHeader?: boolean;
  starterMode?: boolean;
  hideRenderTab?: boolean;
  sheetContext?: CharacterSheetRenderContext;
}

const BASE_TABS = [
  { id: "presets", label: "Presets" },
  { id: "Hair", label: "Hair & Beard" },
  { id: "Eyes & Brows", label: "Eyes" },
  { id: "Markings", label: "Scars & Paint" },
  { id: "Accessories", label: "Crowns & Ears" },
  { id: "Wardrobe", label: "Attire" },
  { id: "Face & Body", label: "Features" },
  { id: "physique", label: "Physique & Vibe" },
  { id: "colors", label: "Color Studio" },
];

const TINT_GROUP_LABELS: Array<{ key: Exclude<TintGroup, "none">; label: string }> = [
  { key: "skin", label: "Skin / Scales / Fur" },
  { key: "hair", label: "Hair / Brow / Beard" },
  { key: "eyes", label: "Eyes & Glow" },
  { key: "warpaint", label: "Warpaint / Scars / Tattoo" },
  { key: "gear", label: "Armor / Crowns" },
  { key: "cloak", label: "Cloak / Scarf / Amulet" },
];

export function AppearanceStudio({
  value,
  raceId,
  onChange,
  allowSkeletonSwitch = false,
  compactHeader = false,
  starterMode = false,
  hideRenderTab = false,
  sheetContext,
}: AppearanceStudioProps) {
  const [catalog, setCatalog] = useState<PortraitCatalog | null>(null);
  const [activeTab, setActiveTab] = useState("presets");
  const [previewMode, setPreviewMode] = useState<"pre-render" | "final">("pre-render");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const renderOptions: PortraitRenderOptions = {
    ...DEFAULT_RENDER_OPTIONS,
    ...(value?.renderOptions || {}),
  };
  const storedFinalUrl = useStoredPortrait(
    value?.renderedPortraitId,
    renderOptions.usePreRenderOnly
  );

  useEffect(() => {
    if (storedFinalUrl && !renderOptions.usePreRenderOnly) {
      setPreviewMode("final");
    } else if (!storedFinalUrl || renderOptions.usePreRenderOnly) {
      setPreviewMode("pre-render");
    }
  }, [storedFinalUrl, renderOptions.usePreRenderOnly]);

  useEffect(() => {
    let mounted = true;
    loadPortraitCatalog().then((c) => {
      if (mounted) setCatalog(c);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const activeChar: CatalogCharacter | undefined = useMemo(() => {
    if (!catalog) return undefined;
    const requestedId = value?.baseCharacterId || raceToCharacterId(raceId, "female");
    return (
      catalog.characters.find((c) => c.id === requestedId) ||
      catalog.characters.find((c) => c.raceId === raceId) ||
      catalog.characters[0]
    );
  }, [catalog, value?.baseCharacterId, raceId]);

  useEffect(() => {
    if (!catalog || !activeChar) return;
    if (!value) {
      onChange(buildDefaultPortraitConfig(activeChar));
    }
  }, [catalog, activeChar, value, onChange]);

  if (!catalog || !activeChar || !value) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading Cyberpunk-scale modular character studio...
      </div>
    );
  }

  const unlockAllRaces = Boolean(value.unlockAllRaces);

  const tabsList = hideRenderTab
    ? BASE_TABS
    : [...BASE_TABS, { id: "render", label: "Final Render" }];

  const handleGenderSwitch = (gender: "female" | "male") => {
    const nextChar =
      catalog.characters.find(
        (c) => c.raceId === activeChar.raceId && c.gender === gender
      ) || catalog.characters.find((c) => c.gender === gender);
    if (!nextChar || nextChar.id === activeChar.id) return;
    onChange({
      ...buildDefaultPortraitConfig(nextChar),
      renderOptions: value.renderOptions,
      renderHistory: value.renderHistory,
    });
  };

  const handleSkeletonSwitch = (charId: string) => {
    const nextChar = catalog.characters.find((c) => c.id === charId);
    if (!nextChar) return;
    onChange({
      ...buildDefaultPortraitConfig(nextChar),
      renderOptions: value.renderOptions,
      renderHistory: value.renderHistory,
    });
  };

  const handleApplyVariant = (variantId: string) => {
    const fresh = buildDefaultPortraitConfig(activeChar, variantId);
    onChange({
      ...fresh,
      tints: value.tints || createDefaultTints(),
      unlockAllRaces: value.unlockAllRaces,
      backdropStyle: value.backdropStyle || "rune",
      renderOptions: value.renderOptions,
      renderHistory: value.renderHistory,
    });
    setPreviewMode("pre-render");
  };

  const handleResetToBase = () => {
    const fresh = buildDefaultPortraitConfig(activeChar, "base");
    onChange({
      ...fresh,
      renderOptions: value.renderOptions,
      renderHistory: value.renderHistory,
    });
    setPreviewMode("pre-render");
  };

  const handleSlotSelect = (slotKey: string, url: string | null) => {
    onChange({
      ...value,
      presetVariantId: "custom",
      slots: {
        ...value.slots,
        [slotKey]: url,
      },
    });
    setPreviewMode("pre-render");
  };

  const handleNudgeSlot = (slotKey: string, dxDelta: number, dyDelta: number, reset = false) => {
    const currentOffset = value.slotOffsets?.[slotKey] || { dx: 0, dy: 0 };
    const nextOffset = reset
      ? { dx: 0, dy: 0 }
      : {
          dx: Math.max(-40, Math.min(40, currentOffset.dx + dxDelta)),
          dy: Math.max(-40, Math.min(40, currentOffset.dy + dyDelta)),
        };
    onChange({
      ...value,
      slotOffsets: {
        ...(value.slotOffsets || {}),
        [slotKey]: nextOffset,
      },
    });
  };

  const handleTintChange = (group: Exclude<TintGroup, "none">, patch: Partial<PortraitTint>) => {
    const current = value.tints?.[group] || { ...DEFAULT_TINT };
    onChange({
      ...value,
      tints: {
        ...value.tints,
        [group]: { ...current, ...patch },
      },
    });
  };

  const handleBackdropChange = (backdropStyle: PortraitBackdropStyle) => {
    onChange({ ...value, backdropStyle });
  };

  const handleRandomizeAll = () => {
    onChange(randomizePortraitConfig(catalog, activeChar, value, unlockAllRaces, starterMode));
    setPreviewMode("pre-render");
  };

  const handleDownloadPng = () => {
    const link = document.createElement("a");
    if (previewMode === "final" && storedFinalUrl) {
      link.download = `${activeChar.id}_final_portrait.webp`;
      link.href = storedFinalUrl;
      link.click();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    link.download = `${activeChar.id}_prerender.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const updateRenderOptions = (patch: Partial<PortraitRenderOptions>) => {
    onChange({
      ...value,
      renderOptions: {
        ...renderOptions,
        ...patch,
      },
    });
  };

  const slotsForCategory = (category: string) =>
    Object.entries(catalog.slots).filter(([, meta]) => meta.category === category);

  const sameRaceVariants = starterMode
    ? activeChar.variants.filter((v) => !v.isExpansionPack)
    : activeChar.variants;

  return (
    <div className="space-y-4">
      {!compactHeader && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <h3 className="text-xl font-cinzel text-primary flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Appearance Studio &amp; Face Sculptor
            </h3>
            <p className="text-xs text-muted-foreground">
              Mix hairstyles, scars, glowing eyes, circlets &amp; Skyrim guild armors across compatible rigs, then tune unlimited HSL pigments.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-border overflow-hidden">
              <Button
                size="sm"
                variant={activeChar.gender === "female" ? "default" : "ghost"}
                className="rounded-none h-8 text-xs px-3"
                onClick={() => handleGenderSwitch("female")}
              >
                Female
              </Button>
              <Button
                size="sm"
                variant={activeChar.gender === "male" ? "default" : "ghost"}
                className="rounded-none h-8 text-xs px-3"
                onClick={() => handleGenderSwitch("male")}
              >
                Male
              </Button>
            </div>
            {allowSkeletonSwitch && (
              <select
                value={activeChar.id}
                onChange={(e) => handleSkeletonSwitch(e.target.value)}
                className="h-8 px-2 rounded-md border border-border bg-card text-xs text-foreground"
              >
                {catalog.characters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.displayName}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5 items-start">
        {/* Left Live Canvas Dock */}
        <Card className="p-3 bg-card/80 border-primary/30 space-y-2.5 lg:sticky lg:top-0">
          {storedFinalUrl && !renderOptions.usePreRenderOnly && (
            <div className="grid grid-cols-2 rounded-md border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setPreviewMode("final")}
                className={`py-1 text-[11px] font-medium transition-colors ${
                  previewMode === "final"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                Final Render
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("pre-render")}
                className={`py-1 text-[11px] font-medium transition-colors ${
                  previewMode === "pre-render"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                Stage 1 Blueprint
              </button>
            </div>
          )}

          <div className="aspect-[764/1024] w-full rounded-md overflow-hidden border border-border shadow-lg bg-[#0c1d24]">
            {previewMode === "final" && storedFinalUrl && !renderOptions.usePreRenderOnly ? (
              <img
                src={storedFinalUrl}
                alt="Final rendered portrait"
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <CharacterPortraitCanvas
                portrait={value}
                onCanvasElement={(c) => {
                  canvasRef.current = c;
                }}
                className="w-full h-full"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="default"
              className="text-xs h-8"
              onClick={handleRandomizeAll}
            >
              <Dices className="w-3.5 h-3.5 mr-1.5" />
              Randomize
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8"
              onClick={handleResetToBase}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Base Look
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border px-2.5 py-2 bg-muted/30">
            <div className="pr-2">
              <div className="text-xs font-medium flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-primary" />
                Cross-Race Mix
              </div>
              <div className="text-[11px] text-muted-foreground">
                Unlock Elf/Beast/All layers
              </div>
            </div>
            <Switch
              checked={unlockAllRaces}
              onCheckedChange={(checked) =>
                onChange({ ...value, unlockAllRaces: checked })
              }
            />
          </div>

          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Rune Aura Backdrop
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {BACKDROP_OPTIONS.map((bg) => (
                <Button
                  key={bg.id}
                  size="sm"
                  variant={(value.backdropStyle || "rune") === bg.id ? "default" : "outline"}
                  className="h-6 text-[11px] px-2"
                  onClick={() => handleBackdropChange(bg.id)}
                >
                  {bg.label}
                </Button>
              ))}
            </div>
          </div>

          <Button
            size="sm"
            variant="secondary"
            className="w-full h-8 text-xs"
            onClick={handleDownloadPng}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export Portrait PNG
          </Button>
        </Card>

        {/* Right Cyberpunk Slot & Color Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/40 p-1 justify-start">
            {tabsList.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="text-xs py-1.5 px-2.5">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* PRESETS TAB */}
          <TabsContent value="presets" className="mt-3 space-y-4">
            {starterMode && (
              <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-muted-foreground">
                <Lock className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <span>
                  <strong className="text-foreground">Starter Creation:</strong> Endgame faction &amp; artifact armor (Daedric, Glass, Dragonbone, Ebony, Nightingale, etc.) unlocks post-creation via the Face Sculptor on your Character Sheet.
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-cinzel font-semibold text-primary">
                {starterMode ? "Starter Look Loadouts" : "Archetype Loadouts"} ({activeChar.displayName})
              </h4>
              <Badge variant="outline" className="text-xs">
                {sameRaceVariants.length + 1} Loadouts
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card
                onClick={handleResetToBase}
                className={`p-3 cursor-pointer transition-all hover:border-primary ${
                  value.presetVariantId === "base" ? "ring-2 ring-primary bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{activeChar.raceName} Classic</span>
                  <Badge variant="secondary" className="text-[10px]">Base</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Iconic starter gear &amp; clean heritage features.
                </p>
              </Card>

              {sameRaceVariants.map((variant) => (
                <Card
                  key={variant.id}
                  onClick={() => handleApplyVariant(variant.id)}
                  className={`p-3 cursor-pointer transition-all hover:border-primary ${
                    value.presetVariantId === variant.id ? "ring-2 ring-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm truncate">{variant.label}</span>
                    <Badge
                      variant={variant.isExpansionPack ? "default" : "secondary"}
                      className="text-[10px] flex-shrink-0"
                    >
                      {variant.isExpansionPack ? "Pack" : variant.archetype}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Object.keys(variant.layers).length} modular parts ready to remix
                  </p>
                </Card>
              ))}
            </div>

            {allowSkeletonSwitch && (
              <div className="pt-2 border-t border-border">
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Gender Toggle for Current Heritage
                </Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={activeChar.gender === "female" ? "default" : "outline"}
                    onClick={() => handleGenderSwitch("female")}
                  >
                    Female
                  </Button>
                  <Button
                    size="sm"
                    variant={activeChar.gender === "male" ? "default" : "outline"}
                    onClick={() => handleGenderSwitch("male")}
                  >
                    Male
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* LAYER SLOT TABS */}
          {["Hair", "Eyes & Brows", "Markings", "Accessories", "Wardrobe", "Face & Body"].map(
            (category) => (
              <TabsContent key={category} value={category} className="mt-3">
                <ScrollArea className="h-[460px] pr-3">
                  <div className="space-y-5">
                    {slotsForCategory(category).map(([slotKey, meta]) => {
                      const options = collectSlotOptions(
                        catalog,
                        activeChar,
                        slotKey,
                        unlockAllRaces,
                        starterMode
                      );
                      const currentUrl = value.slots?.[slotKey] ?? null;
                      const currentOffset = value.slotOffsets?.[slotKey] || { dx: 0, dy: 0 };

                      return (
                        <Card key={slotKey} className="p-3 bg-card/60 space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-cinzel font-semibold text-sm text-primary">
                                {meta.label}
                              </span>
                              <Badge variant="outline" className="text-[10px]">
                                {options.length} options
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              {currentUrl && (
                                <div className="flex items-center gap-0.5 mr-2 bg-muted/40 rounded px-1 py-0.5">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0"
                                    title="Nudge Left"
                                    onClick={() => handleNudgeSlot(slotKey, -2, 0)}
                                  >
                                    <ArrowLeft className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0"
                                    title="Nudge Up"
                                    onClick={() => handleNudgeSlot(slotKey, 0, -2)}
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0"
                                    title="Nudge Down"
                                    onClick={() => handleNudgeSlot(slotKey, 0, 2)}
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0"
                                    title="Nudge Right"
                                    onClick={() => handleNudgeSlot(slotKey, 2, 0)}
                                  >
                                    <ArrowRight className="w-3 h-3" />
                                  </Button>
                                  {(currentOffset.dx !== 0 || currentOffset.dy !== 0) && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-5 px-1 text-[10px]"
                                      onClick={() => handleNudgeSlot(slotKey, 0, 0, true)}
                                    >
                                      {currentOffset.dx},{currentOffset.dy}
                                    </Button>
                                  )}
                                </div>
                              )}

                              {meta.canHide && (
                                <Button
                                  size="sm"
                                  variant={currentUrl === null ? "default" : "outline"}
                                  className="h-6 text-[11px] px-2"
                                  onClick={() => handleSlotSelect(slotKey, null)}
                                >
                                  <EyeOff className="w-3 h-3 mr-1" />
                                  None
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {options.map((opt) => {
                              const isSelected = currentUrl === opt.url;
                              return (
                                <button
                                  key={opt.url}
                                  type="button"
                                  onClick={() => handleSlotSelect(slotKey, opt.url)}
                                  className={`text-left px-2.5 py-2 rounded-md border text-xs transition-all flex items-center justify-between gap-2 ${
                                    isSelected
                                      ? "border-primary bg-primary/15 text-foreground font-medium"
                                      : "border-border/70 bg-muted/20 hover:bg-muted/50 text-muted-foreground"
                                  }`}
                                >
                                  <span className="truncate">{opt.label}</span>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 flex-shrink-0"
                                  >
                                    {opt.isSameCharacter
                                      ? opt.isExpansionPack
                                        ? "Pack"
                                        : "Race"
                                      : opt.sourceDisplayName.split(" ")[0]}
                                  </Badge>
                                </button>
                              );
                            })}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            )
          )}

          {/* PHYSIQUE & VIBE TAB */}
          <TabsContent value="physique" className="mt-3">
            <ScrollArea className="h-[460px] pr-3">
              <div className="space-y-4">
                <Card className="p-3 border-border space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-primary block">
                    Body Type / Physique
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(BODY_TYPE_DESCRIPTIONS) as PortraitBodyType[]).map((key) => (
                      <Button
                        key={key}
                        size="sm"
                        variant={renderOptions.bodyType === key ? "default" : "outline"}
                        className="h-7 text-xs px-2.5"
                        onClick={() => updateRenderOptions({ bodyType: key })}
                      >
                        {BODY_TYPE_DESCRIPTIONS[key].label}
                      </Button>
                    ))}
                  </div>
                  <Input
                    value={renderOptions.customBodyNote || ""}
                    onChange={(e) => updateRenderOptions({ customBodyNote: e.target.value })}
                    placeholder="Optional physique details (e.g., towering, stout, narrow shoulders)..."
                    className="h-8 text-xs"
                  />
                </Card>

                <Card className="p-3 border-border space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-primary block">
                    Facial Expression &amp; Demeanor
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(EXPRESSION_DESCRIPTIONS) as PortraitRenderExpression[]).map((key) => (
                      <Button
                        key={key}
                        size="sm"
                        variant={renderOptions.expression === key ? "default" : "outline"}
                        className="h-7 text-xs px-2.5"
                        onClick={() => updateRenderOptions({ expression: key })}
                      >
                        {EXPRESSION_DESCRIPTIONS[key].label}
                      </Button>
                    ))}
                  </div>
                  <Input
                    value={renderOptions.customExpressionNote || ""}
                    onChange={(e) => updateRenderOptions({ customExpressionNote: e.target.value })}
                    placeholder="Optional expression detail (e.g., clenched jaw, sly grin, fierce focus)..."
                    className="h-8 text-xs"
                  />
                </Card>

                <Card className="p-3 border-border space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-primary block">
                    Age &amp; Weathering
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(AGE_DESCRIPTIONS) as PortraitRenderAge[]).map((key) => (
                      <Button
                        key={key}
                        size="sm"
                        variant={renderOptions.age === key ? "default" : "outline"}
                        className="h-7 text-xs px-2.5"
                        onClick={() => updateRenderOptions({ age: key })}
                      >
                        {AGE_DESCRIPTIONS[key].label}
                      </Button>
                    ))}
                  </div>
                  <Input
                    value={renderOptions.customAgeNote || ""}
                    onChange={(e) => updateRenderOptions({ customAgeNote: e.target.value })}
                    placeholder="Optional weathering details (e.g., frostbite scars, ash-worn skin)..."
                    className="h-8 text-xs"
                  />
                </Card>

                <Card className="p-3 border-primary/30 bg-muted/20 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">Use Pre-Render Directly (No AI Finalizer)</div>
                    <p className="text-xs text-muted-foreground">
                      Skip AI portrait unification and use the Stage 1 2D bust as-is.
                    </p>
                  </div>
                  <Switch
                    checked={renderOptions.usePreRenderOnly}
                    onCheckedChange={(checked) => updateRenderOptions({ usePreRenderOnly: checked })}
                  />
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* COLOR STUDIO TAB */}
          <TabsContent value="colors" className="mt-3">
            <ScrollArea className="h-[460px] pr-3">
              <div className="space-y-4">
                {TINT_GROUP_LABELS.map(({ key, label }) => {
                  const tint = value.tints?.[key] || DEFAULT_TINT;
                  const presets = TINT_PRESETS[key];
                  return (
                    <Card key={key} className="p-3 bg-card/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-cinzel font-semibold text-sm text-primary flex items-center gap-1.5">
                          <Palette className="w-4 h-4" />
                          {label}
                        </h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs px-2"
                          onClick={() => handleTintChange(key, DEFAULT_TINT)}
                        >
                          Reset
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {presets.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => handleTintChange(key, preset.tint)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-border bg-muted/30 hover:border-primary text-[11px]"
                          >
                            <span
                              className="w-3 h-3 rounded-full border border-white/30"
                              style={{ backgroundColor: preset.swatch }}
                            />
                            {preset.name}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <div>
                          <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                            <span>Hue</span>
                            <span>{tint.hueRotate}°</span>
                          </div>
                          <Slider
                            min={-180}
                            max={180}
                            step={2}
                            value={[tint.hueRotate]}
                            onValueChange={([v]) => handleTintChange(key, { hueRotate: v })}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                            <span>Saturation</span>
                            <span>{tint.saturate}%</span>
                          </div>
                          <Slider
                            min={0}
                            max={200}
                            step={5}
                            value={[tint.saturate]}
                            onValueChange={([v]) => handleTintChange(key, { saturate: v })}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                            <span>Brightness</span>
                            <span>{tint.brightness}%</span>
                          </div>
                          <Slider
                            min={45}
                            max={155}
                            step={5}
                            value={[tint.brightness]}
                            onValueChange={([v]) => handleTintChange(key, { brightness: v })}
                          />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {!hideRenderTab && (
            <TabsContent value="render" className="mt-3">
              <ScrollArea className="h-[460px] pr-3">
                <FinalRenderPanel
                  portrait={value}
                  onChange={onChange}
                  sheetContext={sheetContext}
                />
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
