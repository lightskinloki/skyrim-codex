// Plain-language wording for the guided wizard. Nothing in here assumes the
// person has read a rulebook, seen a runsheet, or worked with this app before.
// Every example across the wizard comes from ONE small sample story ("The
// Silent Mill": a village mill has stopped turning and a boy is missing in the
// cellar) so a newcomer can see how the pieces fit together.

import { SceneKind } from "@/types/campaign";

export const PLAIN_KIND: Record<SceneKind, { name: string; short: string; when: string }> = {
  opening: {
    name: "Start of the session",
    short: "A recap and a starting point",
    when: "Use this first when you're picking up a story. It holds a recap to read out loud, a reminder of who is in the room, and a few things the players can do before the story moves on.",
  },
  scene: {
    name: "A place or an event",
    short: "Exploring, a discovery, a chase, a puzzle",
    when: "Use this for anything that isn't mainly a conversation or a fight: a room the players explore, a clue they find, a locked door, a chase.",
  },
  conversation: {
    name: "A talk with a character",
    short: "A villain, ally, or stranger the players speak with",
    when: "Use this when the players will talk with someone important. You'll get a small map of how the talk could go, so you're ready whatever the players say or do.",
  },
  combat: {
    name: "A fight",
    short: "Enemies, what they want, what could change",
    when: "Use this for a battle. It helps you plan what the players are really trying to do, what each side goes for, and what could suddenly change the fight.",
  },
  endings: {
    name: "How it could end",
    short: "Several possible outcomes, ready to pick from",
    when: "Use this when the story could turn out in different ways. You list each outcome once, and at the table you tap the one the players reached.",
  },
  resolution: {
    name: "Wrap-up and rewards",
    short: "What they earn and what changed",
    when: "Use this last. It holds the closing words to read out loud, what the players earn, and what has changed in the world.",
  },
};

export const TYPICAL_OUTLINE: { kind: SceneKind; title: string }[] = [
  { kind: "opening", title: "Start of the session" },
  { kind: "scene", title: "A place to explore" },
  { kind: "conversation", title: "A talk with someone" },
  { kind: "combat", title: "A fight" },
  { kind: "endings", title: "How it ends" },
  { kind: "resolution", title: "Wrap-up and rewards" },
];

export const GLOSSARY: { term: string; meaning: string }[] = [
  { term: "Game Master (GM)", meaning: "The person running the game. That's you." },
  { term: "Adventure", meaning: "One game session's worth of story, or a short story with several scenes." },
  { term: "Scene", meaning: "One moment or place in your adventure: a room, a talk, a fight." },
  { term: "Read-aloud text", meaning: "Words you read out loud to your players to describe what they see and hear. It shows in a blue box while you run the game." },
  { term: "Reminder for you", meaning: "A note that only you can see, like a secret or a rule to remember. Your players never see it." },
  { term: "Character's words", meaning: "A line a non-player character says, shown in a gold box so you can read it in their voice." },
  { term: "Handout", meaning: "Written text your players can read, like a letter, a sign, or a journal page." },
  { term: "Difficulty", meaning: "You never pick a number the players must beat. You pick how hard a task is (Easy, Standard, Hard, and so on), and that adjusts each player's own skill number up or down." },
  { term: "Round", meaning: "In a fight, one full turn of everyone acting. The fight tracker counts rounds for you." },
  { term: "HP (health points)", meaning: "How much damage something can take before it breaks or falls." },
];

/** Shown in Live Play so a stranger can tell what the colored boxes mean. */
export const COLOR_KEY: { color: string; label: string }[] = [
  { color: "#58a6ff", label: "Blue: read this out loud" },
  { color: "#f85149", label: "Red: a reminder you must not miss" },
  { color: "#e55368", label: "Maroon: a note for you only" },
  { color: "#d29922", label: "Gold: something a character says" },
  { color: "#bc8c58", label: "Brown: text the players can read" },
];
