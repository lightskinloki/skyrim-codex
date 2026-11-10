import { useState } from "react";

interface CreatorPlateProps {
  src: string;
  alt: string;
  className?: string;
}

/**
 * One authored plate — the creator's skill and kit steps, and the expanded
 * skill on the character sheet.
 *
 * The card provides the frame; this provides the picture. Until the file exists
 * it renders nothing — not a broken-image icon and not a placeholder drawing.
 * That is deliberate: a designed hole is honest, and a procedural stand-in
 * would be a second thing to keep in sync with the real art.
 *
 * A JPG is the documented format, but a PNG with the same name is accepted, so
 * dropping in a screenshot of a work in progress does not need a rename.
 */
export function CreatorPlate({ src, alt, className = "" }: CreatorPlateProps) {
  const [source, setSource] = useState(src);
  const [missing, setMissing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (missing) return null;

  return (
    <div className={`relative overflow-hidden border-b border-border/60 bg-black/50 ${className}`}>
      <img
        src={source}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (source.endsWith(".jpg")) {
            setSource(source.replace(/\.jpg$/, ".png"));
            setLoaded(false);
          } else {
            setMissing(true);
          }
        }}
        className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
      {!loaded && <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/[0.06] to-transparent" />}
    </div>
  );
}
