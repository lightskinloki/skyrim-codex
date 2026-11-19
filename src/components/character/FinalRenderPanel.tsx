import { useEffect, useMemo, useRef, useState } from "react";
import {
  PortraitBodyType,
  PortraitConfig,
  PortraitRenderAge,
  PortraitRenderExpression,
  PortraitRenderOptions,
} from "@/types/character";
import { PortraitCatalog, loadPortraitCatalog } from "@/lib/portraitCatalog";
import {
  AGE_DESCRIPTIONS,
  BODY_TYPE_DESCRIPTIONS,
  CharacterSheetRenderContext,
  DEFAULT_RENDER_OPTIONS,
  EXPRESSION_DESCRIPTIONS,
  compileRenderPrompt,
} from "@/lib/renderSpecCompiler";
import { savePortraitRender, useStoredPortrait } from "@/lib/portraitStorage";
import {
  RENDER_BRIDGE_STORE_URL,
  RenderBridgeStatus,
  focusRenderTab,
  pingRenderBridge,
  requestAiRender,
  requestBuiltInAiRender,
  retryRenderGrab,
  sendRenderSavedAck,
  subscribeLateRenderComplete,
} from "@/lib/renderBridgeClient";
import { CharacterPortraitCanvas, renderCleanPreRenderDataUrl } from "./CharacterPortraitCanvas";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  RefreshCw,
  RotateCcw,
  Upload,
  Wand2,
} from "lucide-react";

interface FinalRenderPanelProps {
  portrait: PortraitConfig;
  onChange: (next: PortraitConfig) => void;
  sheetContext?: CharacterSheetRenderContext;
  fallbackRaceImage?: string;
}

export function FinalRenderPanel({
  portrait,
  onChange,
  sheetContext,
  fallbackRaceImage,
}: FinalRenderPanelProps) {
  const [catalog, setCatalog] = useState<PortraitCatalog | null>(null);
  const [bridgeConnected, setBridgeConnected] = useState<boolean | null>(null);
  const [activeBackend, setActiveBackend] = useState<"extension" | "builtin" | null>(null);
  const [renderStatus, setRenderStatus] = useState<RenderBridgeStatus>("idle");
  const [renderMessage, setRenderMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const renderOptions: PortraitRenderOptions = {
    ...DEFAULT_RENDER_OPTIONS,
    ...(portrait.renderOptions || {}),
  };

  const storedFinalUrl = useStoredPortrait(
    portrait.renderedPortraitId,
    renderOptions.usePreRenderOnly
  );

  useEffect(() => {
    let mounted = true;
    loadPortraitCatalog().then((c) => {
      if (mounted) setCatalog(c);
    });
    pingRenderBridge().then((ok) => {
      if (mounted) setBridgeConnected(ok);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const compiledSpec = useMemo(() => {
    if (!catalog) return { prompt: "", summary: "" };
    return compileRenderPrompt({ portrait, catalog, sheet: sheetContext });
  }, [portrait, catalog, sheetContext]);

  const updateRenderOptions = (patch: Partial<PortraitRenderOptions>) => {
    onChange({
      ...portrait,
      renderOptions: {
        ...renderOptions,
        ...patch,
      },
    });
  };

  const applyFinalRenderImage = async (rawDataUrl: string, jobId?: string) => {
    const renderId = `render_${Date.now()}`;
    await savePortraitRender(renderId, rawDataUrl);
    if (jobId) {
      sendRenderSavedAck(jobId);
    }
    const historyItem = {
      id: renderId,
      createdAt: new Date().toISOString(),
      bodyType: renderOptions.bodyType,
      expression: renderOptions.expression,
      age: renderOptions.age,
      promptSummary: compiledSpec.summary,
    };
    onChange({
      ...portrait,
      renderOptions: { ...renderOptions, usePreRenderOnly: false },
      renderedPortraitId: renderId,
      renderHistory: [historyItem, ...(portrait.renderHistory || [])].slice(0, 10),
    });
  };

  const applyLateRef = useRef(applyFinalRenderImage);
  applyLateRef.current = applyFinalRenderImage;

  useEffect(() => {
    return subscribeLateRenderComplete(
      async (res) => {
        await applyLateRef.current(res.imageDataUrl, res.renderJobId);
        setRenderStatus("idle");
        setRenderMessage("Recovered & saved final portrait from render tab cleanly.");
      },
      (errMsg) => {
        setRenderStatus("error");
        setRenderMessage(errMsg);
      }
    );
  }, []);

  const handleTriggerFinalRender = async () => {
    if (!catalog) return;
    try {
      const hasBridge = await pingRenderBridge();
      setBridgeConnected(hasBridge);

      setRenderStatus("starting");
      setRenderMessage("Exporting Stage 1 blueprint (without UI border)...");
      const baseImageDataUrl = await renderCleanPreRenderDataUrl(portrait, catalog, {
        includeFrame: false,
      });

      const backend = hasBridge ? "extension" : "builtin";
      setActiveBackend(backend);

      const result = hasBridge
        ? await requestAiRender({
            baseImageDataUrl,
            prompt: compiledSpec.prompt,
            onStatus: (st, msg) => {
              setRenderStatus(st);
              if (msg) setRenderMessage(msg);
            },
          })
        : await requestBuiltInAiRender({
            baseImageDataUrl,
            prompt: compiledSpec.prompt,
            onStatus: (st, msg) => {
              setRenderStatus(st);
              if (msg) setRenderMessage(msg);
            },
          });

      await applyFinalRenderImage(
        result.imageDataUrl,
        hasBridge ? result.renderJobId : undefined
      );
      setRenderStatus("idle");
      setRenderMessage(
        hasBridge
          ? "Final portrait rendered via Google AI Mode and saved cleanly."
          : "Final portrait rendered via Built-In AI Finalizer and saved cleanly."
      );
    } catch (err) {
      setRenderStatus("error");
      setRenderMessage(err instanceof Error ? err.message : "Render failed.");
    }
  };

  const handleManualImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === "string") {
        await applyFinalRenderImage(reader.result);
        setRenderStatus("idle");
        setRenderMessage("Imported rendered image saved cleanly.");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const isRunning =
    renderStatus === "starting" ||
    renderStatus === "attaching" ||
    renderStatus === "generating" ||
    renderStatus === "saving";

  return (
    <div className="space-y-4">
      <Card className="p-3 border-primary/30 bg-muted/20 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Use Pre-Render Directly (No AI Finalizer)</div>
          <p className="text-xs text-muted-foreground">
            Opt out of AI finalization and use the Stage 1 paper-doll blueprint directly (locked bust anatomy, no AI-rendered body build or sheet weapon artwork).
          </p>
        </div>
        <Switch
          checked={renderOptions.usePreRenderOnly}
          onCheckedChange={(checked) => updateRenderOptions({ usePreRenderOnly: checked })}
        />
      </Card>

      {!renderOptions.usePreRenderOnly && (
        <>
          {/* Locked Pipeline Visual Preview: Side-by-Side Blueprint vs Final Portrait */}
          <Card className="p-4 border-primary/40 bg-card/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-cinzel font-semibold text-primary">
                  Stage 2 Final Portrait Pipeline
                </h4>
                <p className="text-xs text-muted-foreground">
                  Visual style &amp; portrait framing are locked to the Skyrim Codex 32-bit aesthetic for 2D gameplay sprite compatibility.
                </p>
              </div>
              {bridgeConnected === true ? (
                <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Google AI Mode Bridge Connected
                </Badge>
              ) : bridgeConnected === false ? (
                <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Built-In AI Finalizer Ready
                </Badge>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="space-y-1.5 text-center">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Stage 1 Pre-Render
                </div>
                <div className="aspect-[764/1024] w-full rounded-md overflow-hidden border border-border bg-[#0c1d24]">
                  <CharacterPortraitCanvas
                    portrait={portrait}
                    fallbackRaceImage={fallbackRaceImage}
                    className="w-full h-full"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-center">
                <div className="text-[11px] uppercase tracking-wider text-primary font-semibold">
                  Final Rendered Portrait
                </div>
                <div className="aspect-[764/1024] w-full rounded-md overflow-hidden border-2 border-primary/50 bg-[#0c1d24] flex items-center justify-center">
                  {storedFinalUrl ? (
                    <img
                      src={storedFinalUrl}
                      alt="Final rendered character portrait"
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="p-3 text-center text-xs text-muted-foreground space-y-1">
                      <Wand2 className="w-6 h-6 mx-auto text-primary/60" />
                      <div>
                        {isRunning
                          ? activeBackend === "extension"
                            ? "Rendering in Google AI Mode..."
                            : "Rendering via Built-In AI..."
                          : "Not rendered yet"}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <Button
                size="sm"
                onClick={handleTriggerFinalRender}
                disabled={isRunning || !catalog}
                className="h-9 px-4 text-xs"
              >
                <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                {isRunning
                  ? "Rendering..."
                  : storedFinalUrl
                  ? "Re-Render Final Portrait"
                  : "Render Final Portrait"}
              </Button>

              {activeBackend === "extension" &&
                (isRunning || renderStatus === "needs-attention" || renderStatus === "error") && (
                <>
                  <Button size="sm" variant="outline" className="h-9 text-xs" onClick={focusRenderTab}>
                    <ExternalLink className="w-3.5 h-3.5 mr-1" />
                    Focus Render Tab
                  </Button>
                  <Button size="sm" variant="outline" className="h-9 text-xs" onClick={retryRenderGrab}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    Retry Grab
                  </Button>
                </>
              )}

              {storedFinalUrl && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 text-xs"
                    onClick={() => {
                      const a = document.createElement("a");
                      a.download = `${sheetContext?.name || "character"}_final_portrait.webp`;
                      a.href = storedFinalUrl;
                      a.click();
                    }}
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 text-xs text-muted-foreground"
                    onClick={() => onChange({ ...portrait, renderedPortraitId: undefined })}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Clear Final Render
                  </Button>
                </>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleManualImageUpload}
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-9 text-xs text-muted-foreground"
                onClick={() => fileInputRef.current?.click()}
                title="Import a rendered image manually"
              >
                <Upload className="w-3.5 h-3.5 mr-1" />
                Import Image
              </Button>
            </div>

            {renderMessage && (
              <div
                className={`text-xs rounded-md px-3 py-2 border ${
                  renderStatus === "error" || renderStatus === "needs-attention"
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                    : "border-primary/30 bg-primary/10 text-foreground"
                }`}
              >
                {renderMessage}
              </div>
            )}

            {bridgeConnected === false && RENDER_BRIDGE_STORE_URL && (
              <div className="rounded-md border border-border/80 bg-background/60 p-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                <div className="space-y-0.5">
                  <div className="font-medium text-foreground">
                    Optional: Use Your Google AI Mode Quota
                  </div>
                  <p>
                    1-click install from the Chrome Web Store to render via Google AI Mode (Nano Banana) in addition to the built-in AI finalizer.
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" className="h-7 text-xs shrink-0">
                  <a
                    href={RENDER_BRIDGE_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    Add to Chrome
                  </a>
                </Button>
              </div>
            )}
          </Card>

          {/* Rich Physique, Expression & Age Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                    className="h-7 text-[11px] px-2"
                    onClick={() => updateRenderOptions({ bodyType: key })}
                  >
                    {BODY_TYPE_DESCRIPTIONS[key].label}
                  </Button>
                ))}
              </div>
              <Input
                value={renderOptions.customBodyNote || ""}
                onChange={(e) => updateRenderOptions({ customBodyNote: e.target.value })}
                placeholder="Custom build details (e.g., towering, broad-shouldered, gaunt)..."
                className="h-8 text-xs"
              />
            </Card>

            <Card className="p-3 border-border space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-primary block">
                Facial Expression &amp; Bearing
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(EXPRESSION_DESCRIPTIONS) as PortraitRenderExpression[]).map((key) => (
                  <Button
                    key={key}
                    size="sm"
                    variant={renderOptions.expression === key ? "default" : "outline"}
                    className="h-7 text-[11px] px-2"
                    onClick={() => updateRenderOptions({ expression: key })}
                  >
                    {EXPRESSION_DESCRIPTIONS[key].label}
                  </Button>
                ))}
              </div>
              <Input
                value={renderOptions.customExpressionNote || ""}
                onChange={(e) => updateRenderOptions({ customExpressionNote: e.target.value })}
                placeholder="Custom expression cue (e.g., clenching jaw, glowing stare)..."
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
                    className="h-7 text-[11px] px-2"
                    onClick={() => updateRenderOptions({ age: key })}
                  >
                    {AGE_DESCRIPTIONS[key].label}
                  </Button>
                ))}
              </div>
              <Input
                value={renderOptions.customAgeNote || ""}
                onChange={(e) => updateRenderOptions({ customAgeNote: e.target.value })}
                placeholder="Custom weathering (e.g., frostbite scars, ash-worn skin)..."
                className="h-8 text-xs"
              />
            </Card>
          </div>

          <Card className="p-3 border-border space-y-2">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground block">
              Compiled Character Sheet + Pre-Render Prompt Spec (Style Locked)
            </Label>
            <pre className="text-[11px] leading-relaxed whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-2.5 max-h-36 overflow-y-auto text-muted-foreground">
              {compiledSpec.prompt}
            </pre>
          </Card>

          {(portrait.renderHistory || []).length > 0 && (
            <Card className="p-3 border-border space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-primary block">
                Saved Campaign Renders ({portrait.renderHistory?.length})
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {portrait.renderHistory?.map((item) => (
                  <Button
                    key={item.id}
                    size="sm"
                    variant={portrait.renderedPortraitId === item.id ? "default" : "outline"}
                    className="h-7 text-[11px]"
                    onClick={() => onChange({ ...portrait, renderedPortraitId: item.id })}
                  >
                    {item.promptSummary}
                  </Button>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
