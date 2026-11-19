import { useEffect, useMemo, useRef, useState } from "react";
import { PortraitConfig, PortraitTint } from "@/types/character";
import {
  BACKDROP_OPTIONS,
  PortraitCatalog,
  buildUrlAnchorMap,
  computeAutoAlignmentOffset,
  getEffectiveTintGroup,
  loadPortraitCatalog,
} from "@/lib/portraitCatalog";

const imageCache = new Map<string, Promise<HTMLImageElement | null>>();

function loadImage(url: string): Promise<HTMLImageElement | null> {
  const existing = imageCache.get(url);
  if (existing) return existing;

  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
  imageCache.set(url, promise);
  return promise;
}

function buildFilterString(tint?: PortraitTint): string {
  if (!tint) return "none";
  const { hueRotate, saturate, brightness } = tint;
  if (hueRotate === 0 && saturate === 100 && brightness === 100) return "none";
  return `hue-rotate(${hueRotate}deg) saturate(${saturate}%) brightness(${brightness}%)`;
}

export async function renderCleanPreRenderDataUrl(
  portrait: PortraitConfig,
  catalog: PortraitCatalog,
  options: { includeFrame?: boolean } = {}
): Promise<string> {
  const { includeFrame = false } = options;
  const urlAnchorMap = buildUrlAnchorMap(catalog);
  const targetChar = catalog.characters.find((c) => c.id === portrait.baseCharacterId);

  const drawTasks: Array<{
    url: string;
    filter: string;
    dx: number;
    dy: number;
  }> = [];

  for (const slotKey of catalog.layerOrder) {
    if (slotKey === "01_background.png") {
      const bgUrl = targetChar?.baseLayers[slotKey] || "/character-layers/shared/01_background.png";
      const bgStyle = BACKDROP_OPTIONS.find((b) => b.id === (portrait.backdropStyle || "rune"));
      drawTasks.push({ url: bgUrl, filter: bgStyle?.tintFilter || "none", dx: 0, dy: 0 });
      continue;
    }

    if (slotKey === "17_frame.png") {
      if (!includeFrame) continue;
      const frameUrl = targetChar?.baseLayers[slotKey] || "/character-layers/shared/17_frame.png";
      drawTasks.push({ url: frameUrl, filter: "none", dx: 0, dy: 0 });
      continue;
    }

    const rawUrl = portrait.slots?.[slotKey];
    if (!rawUrl) continue;

    const meta = catalog.slots[slotKey];
    const sourceEntry = urlAnchorMap[rawUrl];
    const sourceChar = sourceEntry?.char;
    const rawLabel = sourceEntry?.labels?.[slotKey];
    const tintGroup = getEffectiveTintGroup(slotKey, rawLabel, meta?.tintGroup || "none");
    const tint = tintGroup !== "none" ? portrait.tints?.[tintGroup] : undefined;
    const autoOffset = computeAutoAlignmentOffset(targetChar, sourceChar, meta);
    const userOffset = portrait.slotOffsets?.[slotKey];

    drawTasks.push({
      url: rawUrl,
      filter: buildFilterString(tint),
      dx: autoOffset.dx + (userOffset?.dx || 0),
      dy: autoOffset.dy + (userOffset?.dy || 0),
    });
  }

  const images = await Promise.all(drawTasks.map((t) => loadImage(t.url)));
  const { width, height } = catalog.canvas;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = false;
  images.forEach((img, idx) => {
    if (!img) return;
    const task = drawTasks[idx];
    ctx.save();
    ctx.filter = task.filter;
    ctx.drawImage(img, Math.round(task.dx), Math.round(task.dy), width, height);
    ctx.restore();
  });

  return canvas.toDataURL("image/png");
}

interface CharacterPortraitCanvasProps {
  portrait?: PortraitConfig;
  fallbackRaceImage?: string;
  fallbackAlt?: string;
  className?: string;
  onCanvasElement?: (canvas: HTMLCanvasElement | null) => void;
}

export function CharacterPortraitCanvas({
  portrait,
  fallbackRaceImage,
  fallbackAlt = "Character portrait",
  className = "",
  onCanvasElement,
}: CharacterPortraitCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [catalog, setCatalog] = useState<PortraitCatalog | null>(null);
  const [renderedOk, setRenderedOk] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadPortraitCatalog()
      .then((c) => {
        if (mounted) setCatalog(c);
      })
      .catch(() => {
        if (mounted) setRenderedOk(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const urlAnchorMap = useMemo(() => (catalog ? buildUrlAnchorMap(catalog) : {}), [catalog]);

  useEffect(() => {
    onCanvasElement?.(canvasRef.current);
  }, [onCanvasElement, renderedOk]);

  useEffect(() => {
    if (!portrait || !catalog || !canvasRef.current) return;
    let cancelled = false;

    const targetChar = catalog.characters.find((c) => c.id === portrait.baseCharacterId);
    const drawTasks: Array<{
      slotKey: string;
      url: string;
      filter: string;
      dx: number;
      dy: number;
    }> = [];

    for (const slotKey of catalog.layerOrder) {
      if (slotKey === "01_background.png") {
        const bgUrl = targetChar?.baseLayers[slotKey] || "/character-layers/shared/01_background.png";
        const bgStyle = BACKDROP_OPTIONS.find((b) => b.id === (portrait.backdropStyle || "rune"));
        drawTasks.push({
          slotKey,
          url: bgUrl,
          filter: bgStyle?.tintFilter || "none",
          dx: 0,
          dy: 0,
        });
        continue;
      }

      if (slotKey === "17_frame.png") {
        const frameUrl = targetChar?.baseLayers[slotKey] || "/character-layers/shared/17_frame.png";
        drawTasks.push({
          slotKey,
          url: frameUrl,
          filter: "none",
          dx: 0,
          dy: 0,
        });
        continue;
      }

      const rawUrl = portrait.slots?.[slotKey];
      if (!rawUrl) continue;

      const meta = catalog.slots[slotKey];
      const sourceEntry = urlAnchorMap[rawUrl];
      const sourceChar = sourceEntry?.char;
      const rawLabel = sourceEntry?.labels?.[slotKey];
      const tintGroup = getEffectiveTintGroup(slotKey, rawLabel, meta?.tintGroup || "none");
      const tint = tintGroup !== "none" ? portrait.tints?.[tintGroup] : undefined;
      const autoOffset = computeAutoAlignmentOffset(targetChar, sourceChar, meta);
      const userOffset = portrait.slotOffsets?.[slotKey];

      drawTasks.push({
        slotKey,
        url: rawUrl,
        filter: buildFilterString(tint),
        dx: autoOffset.dx + (userOffset?.dx || 0),
        dy: autoOffset.dy + (userOffset?.dy || 0),
      });
    }

    Promise.all(drawTasks.map((t) => loadImage(t.url))).then((images) => {
      if (cancelled || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = catalog.canvas;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = false;

      images.forEach((img, idx) => {
        if (!img) return;
        const task = drawTasks[idx];
        ctx.save();
        ctx.filter = task.filter;
        ctx.drawImage(img, Math.round(task.dx), Math.round(task.dy), width, height);
        ctx.restore();
      });

      setRenderedOk(true);
    });

    return () => {
      cancelled = true;
    };
  }, [portrait, catalog, urlAnchorMap]);

  if (!portrait) {
    if (fallbackRaceImage) {
      return (
        <div className={`relative overflow-hidden bg-muted ${className}`}>
          <img
            src={`/images/races/${fallbackRaceImage}`}
            alt={fallbackAlt}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`relative overflow-hidden bg-[#0c1d24] ${className}`}>
      <canvas
        ref={canvasRef}
        width={764}
        height={1024}
        className="w-full h-full object-contain block"
        style={{ imageRendering: "pixelated" }}
      />
      {!renderedOk && fallbackRaceImage && (
        <img
          src={`/images/races/${fallbackRaceImage}`}
          alt={fallbackAlt}
          className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
        />
      )}
    </div>
  );
}
