/**
 * Where the creator's authored artwork lives.
 *
 * One plate per skill and one per kit, at 16:9, dropped into `public/images`.
 * A missing file is not an error state: the frame does not render at all, so a
 * half-finished art pass still looks deliberate. The filenames are the ids in
 * `data/skills.ts` and `data/kits.ts`, which is the whole contract.
 *
 * The brief — dimensions, style, and a prompt for every file — is
 * `docs/CREATOR-ART-BRIEF.md`.
 */

export const SKILL_ART_DIR = '/images/skills';
export const KIT_ART_DIR = '/images/kits';

export const skillArtPath = (id: string): string => `${SKILL_ART_DIR}/${id}.jpg`;
export const kitArtPath = (id: string): string => `${KIT_ART_DIR}/${id}.jpg`;
