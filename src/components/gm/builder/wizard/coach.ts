// The wizard's "coach": plain checks on what someone wrote, with a reason for
// every note. No AI, no network: these are fixed good-practice rules for
// writing things you'll say out loud at a table. Notes never block anything;
// they explain, and the writer decides.

export interface Tip {
  level: "warn" | "idea";
  text: string;
  /** One or two sentences on why it matters at the table. */
  why: string;
}

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
export const readingSeconds = (wordCount: number) => Math.max(1, Math.round(wordCount / 2.5));

const PLAYER_FEELINGS = /\b(you|your characters?|the party|the players|everyone|each of you|all of you)\s+(?:\w+\s+){0,2}(feel|feels|felt|realize|realizes|realise|realises|decide|decides|understand|understands|know|knows|sense|senses|wonder|wonders|suspect|suspects|remember|remembers|think|thinks|want|wants|fear|fears|notice that|can tell)\b/i;
const MOOD_WORDS = /\b(eerie|ominous|sinister|mysterious|unsettling|foreboding|spooky|creepy|haunting|menacing|dread|oppressive)\b/i;
const PADDING = /\b(very|really|simply|just|actually|quite|suddenly|somehow)\b/gi;
const NEGATION = /\b(not|no|nothing|never|without|isn't|wasn't|aren't|weren't|doesn't|didn't|can't|won't)\b/gi;

/** Checks for text you will read aloud. */
export function checkReadAloud(paragraphs: string[]): Tip[] {
  const text = paragraphs.join(" ").trim();
  if (!text) return [];
  const tips: Tip[] = [];
  const wc = words(text);

  if (PLAYER_FEELINGS.test(text)) {
    tips.push({
      level: "warn",
      text: "This tells the players what their characters feel, think or decide.",
      why: "What the characters feel and choose is the players' job. When you describe only what is there (a door hanging by one hinge), they react on their own, and that reaction is what makes the moment theirs.",
    });
  }
  if (wc > 140) {
    tips.push({
      level: "idea",
      text: `That's about ${readingSeconds(wc)} seconds to read out loud. Try splitting it into two shorter pieces.`,
      why: "Players start to drift after about a minute of you talking. Two short readings with a pause between them keep the table with you. Add a second read-aloud box and let them react in between.",
    });
  }
  const longSentence = text.split(/(?<=[.!?])\s+/).find((s) => words(s) > 35);
  if (longSentence) {
    tips.push({
      level: "idea",
      text: "One sentence is very long to say in a single breath.",
      why: "You can't re-read a spoken sentence the way readers can. Shorter sentences are easier to say well and easier to follow.",
    });
  }
  if ((text.match(NEGATION) ?? []).length >= 2) {
    tips.push({
      level: "idea",
      text: "This describes several things that are NOT there or did NOT happen.",
      why: "Players picture what you say. Saying 'no sound, nothing moving' makes them picture a void. Describe what IS there instead: 'the door stands open, the bar leaning against the wall.'",
    });
  }
  if (MOOD_WORDS.test(text)) {
    tips.push({
      level: "idea",
      text: "You used a mood word (like 'eerie' or 'ominous').",
      why: "Mood words tell players how to feel without giving them anything to see. One concrete detail does more: a handprint pressed into the frost, a lamp burning in an empty room.",
    });
  }
  if ((text.match(PADDING) ?? []).length >= 3) {
    tips.push({
      level: "idea",
      text: "Words like 'very', 'really', 'just' and 'suddenly' appear several times.",
      why: "They add length but no picture. Try deleting each one; if the sentence still means the same, it didn't need it.",
    });
  }
  return tips;
}

/** Checks for a line a character says. */
export function checkSpoken(text: string): Tip[] {
  const t = text.trim();
  if (!t) return [];
  const tips: Tip[] = [];
  if (words(t) > 45) {
    tips.push({
      level: "idea",
      text: "This is a long speech.",
      why: "At the table, players tune out during long speeches. Try cutting it in half, or end with a question so the players get to answer.",
    });
  }
  if (/[,;]\s*because\b/i.test(t) || /\bthe reason (?:i|we)\b/i.test(t)) {
    tips.push({
      level: "idea",
      text: "The character explains why they're saying it.",
      why: "People rarely announce their own reasons out loud. Try cutting the 'because...' part and let what they do show it. Keep the reason in your own notes.",
    });
  }
  return tips;
}

/** Checks for text where someone might set a target number. */
export function checkNoTargetNumber(text: string): Tip[] {
  if (/\b(?:TN|DC|target number|target of)\s*[:=]?\s*\d+/i.test(text)) {
    return [{
      level: "warn",
      text: "It looks like you've written a number the players must beat.",
      why: "In this game you never pick a number. You pick how hard something is (Easy, Standard, Hard...), and it adjusts each player's own skill number. That keeps every character's build meaningful. Use a 'Roll' entry instead.",
    }];
  }
  return [];
}

/** True if the array has any non-blank text. */
export const anyText = (a?: string[]) => !!a?.some((x) => x.trim());
export const blank = (s?: string) => !s || !s.trim();
