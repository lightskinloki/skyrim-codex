// Light inline markup for block text fields: **bold** and *italic*, in that
// order so ** isn't eaten by the single-* pass. No nesting, no HTML — every
// scene-block text field runs through this instead of dangerouslySetInnerHTML.
import { Fragment } from "react";

const RE = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;

export function Inline({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(RE).filter((p) => p !== "");
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (p.startsWith("*") && p.endsWith("*")) return <em key={i}>{p.slice(1, -1)}</em>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}
