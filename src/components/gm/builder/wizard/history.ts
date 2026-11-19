// Saved versions of an adventure, kept on this device. Lets someone go back to
// how it was an hour ago without knowing what "version control" is.
import { CampaignModule } from "@/types/campaign";

export interface Snapshot { at: string; label: string; module: CampaignModule }

const KEY = (id: string) => `forge-versions-${id}`;
const MAX = 12;

export function loadHistory(moduleId: string): Snapshot[] {
  try { return JSON.parse(localStorage.getItem(KEY(moduleId)) ?? "[]") as Snapshot[]; } catch { return []; }
}

/** Save a version. Skips it if nothing changed since the newest one. */
export function pushSnapshot(module: CampaignModule, label: string, minGapMs = 0): boolean {
  try {
    const list = loadHistory(module.id);
    const json = JSON.stringify(module);
    if (list[0] && JSON.stringify(list[0].module) === json) return false;
    if (list[0] && minGapMs && Date.now() - new Date(list[0].at).getTime() < minGapMs) return false;
    list.unshift({ at: new Date().toISOString(), label, module: JSON.parse(json) });
    localStorage.setItem(KEY(module.id), JSON.stringify(list.slice(0, MAX)));
    return true;
  } catch { return false; }
}

export function clearHistory(moduleId: string) {
  try { localStorage.removeItem(KEY(moduleId)); } catch { /* ignore */ }
}

export function describeAge(iso: string): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} hr ago`;
  return new Date(iso).toLocaleDateString();
}
