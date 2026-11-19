// One small, self-contained sample story used for every example in the wizard
// and for the "sample adventure" a newcomer can open and change:
//
//   THE SILENT MILL. A village mill has stopped turning. The miller's son
//   Corin went down into the cellar two nights ago and hasn't come back. A
//   smuggler named Harl is using the cellar to hide stolen grain.
//
// It exists so someone who has never seen this app can watch how the pieces
// fit together. It has nothing to do with any particular campaign.

export const SAMPLE = {
  moduleName: "The Silent Mill (sample)",
  moduleDesc: "The party has just reached the village of Alder Ford, where the mill has stopped turning.",

  opening: {
    title: "The Village at Dusk",
    subtitle: "The party arrives at a village where the mill has stopped turning.",
    startHere: "The party has just reached Alder Ford. Start in the village square. Don't mention the cellar yet; let the players find it.",
    resume: [
      "The road drops into Alder Ford as the light turns orange. Twelve cottages stand around a green, and no one is working the fields.",
      "At the edge of the village a stone mill stands beside the river. The great wheel hangs still while the river runs past it.",
      "A woman in a flour-dusted apron stands on the mill steps, gripping the rail with both hands.",
    ],
    table: 'Ask: **"What does everyone do?"** Then use the buttons below to run whatever they choose.',
    present: [
      { name: "Marta", text: "The miller. Her son Corin went into the cellar two nights ago and has not come out." },
      { name: "The villagers", text: "Frightened. They keep away from the mill after dark." },
    ],
    found: ["A wedge of new timber jams the mill wheel.", "Fresh boot prints lead from the yard to the cellar door."],
    exactText: ["CLOSED BY ORDER OF HARL. STAY OUT."],
    beats: [{ name: "Marta", text: "She will give everything in the house to whoever brings Corin back." }],
    options: [
      { label: "They talk to Marta", text: "Marta says a man with a scarred hand carried crates down to the cellar. She offers twenty silver for Corin." },
      { label: "They look at the mill wheel", text: "An Easy Might roll pulls the wedge loose. It was hammered in from outside, recently." },
      { label: "They ask the villagers", text: "Nobody will say much. One boy says he heard hammering at night." },
      { label: "They go straight to the cellar", text: "Marta tries to stop them, then hands over the cellar key. Go to the next scene." },
    ],
    noAutomate: "Let the players choose what to do first. The next scene starts when they go down to the cellar.",
    exit: "The party goes down to the cellar door.",
  },

  place: {
    title: "The Cellar Door",
    subtitle: "The cellar door is chained shut, and someone is humming behind it.",
    read: [
      "Six stone steps lead down to an oak door bound in iron. Lamplight shows along the bottom edge.",
      "A chain loops through the door handle. The padlock hangs open on the last link. Behind the door, water drips and a man hums.",
    ],
    truth: "Harl and three helpers are hiding stolen grain here. Corin is tied up at the back, unhurt. Harl does not want a fight. He wants to leave with the grain.",
    speaks: [{ speaker: "Marta", direction: "from the top of the steps", line: "Please. He's fourteen." }],
    rolls: [
      { difficulty: "Hard", stat: "agility", label: "Creep down the steps without the boards creaking." },
      { difficulty: "Standard", stat: "might", label: "Force the door if it is barred." },
    ],
    finds: [{ name: "A torn ledger page", description: "A page of grain weights, tucked behind a loose stone.", readAloud: "Nine sacks to the ferry, the twelfth of the month. Payment on delivery. H." }],
    options: [
      { label: "They open the door", text: "The humming stops. Go to the talk with Harl." },
      { label: "They sneak down", text: "Make a Hard Agility roll. If it works, they hear Harl's whole opening speech before he knows they're there." },
      { label: "They listen at the door", text: "They hear two men whispering about 'the ferry' and a boy coughing." },
    ],
    exit: "The door opens and Harl speaks.",
  },

  talk: {
    title: "Harl in the Cellar",
    subtitle: "A calm smuggler who wants time, not a fight.",
    npc: "Harl",
    arrival: [
      "The cellar runs longer than the mill above it. Grain sacks are stacked to the ceiling.",
      "A broad man in a leather jerkin sits on a barrel, his scarred left hand resting on his knee. Behind him a boy is tied to a post.",
      "\"Evening,\" the man says. \"You're early. Sit down if you like. I'm in no hurry.\"",
    ],
    stopAsk: 'Stop after his last line. Ask the table: **"What do you do?"** Don\'t begin a second speech until someone answers.',
    mustSay: ["\"Give me till dawn and the boy walks out.\" (Said calmly, after the players have said something.)"],
    always: ["He stays seated until someone draws a weapon.", "He never raises his voice.", "He answers honest questions honestly. He only lies about where his helpers are."],
    beatsLabel: "Background beat",
    beats: ["One of Harl's helpers shifts a sack on the stairs.", "The lamp gutters and steadies.", "Corin coughs."],
    ask: {
      aim: "Give the players enough to see what Harl really wants: time.",
      anchors: ["I move grain. I don't hurt children."],
      info: ["The grain is stolen from the granary two villages over.", "He will free Corin in exchange for time, not money."],
      replies: [{ say: "Where are the rest of your men?", ans: "Upstairs, watching the road. He will not say more than that." }],
    },
    disagree: {
      aim: "Let them argue. He wants them calm.",
      anchors: ["You can shout. It won't change what's in these sacks."],
      info: ["He is not offended by anger. He has heard worse."],
    },
    agree: {
      aim: "The deal is real. Play it straight.",
      anchors: ["Good. Dawn, then. Sit."],
      info: ["If they agree, Corin is freed at dawn, but Harl leaves with the grain."],
    },
    attack: {
      aim: "He stays seated until steel is drawn. Then his helpers come down the stairs.",
      anchors: ["Ah. Then we do it the loud way."],
      info: ["This starts the fight. Go to the next scene."],
    },
  },

  fight: {
    title: "The Cellar Fight",
    subtitle: "Harl's crew, three barrels of lamp oil, and a boy tied to a post.",
    managerTitle: "Cellar fight",
    objective: "The players are trying to get Corin out safely. Harl's crew wants to leave with the grain. Nobody here wants to burn the mill down, but the oil barrels are stacked next to the lamps.",
    tracker: { title: "Lamp-oil barrels", description: "Three barrels, wood, 40 HP each. Any damage that opens one spills oil.", labels: ["Barrel A", "Barrel B", "Barrel C"], hp: 40, quick: [5, 10], threshold: 2, banner: "Two barrels are open. Oil is running toward the lamps.", read: ["Oil runs across the flagstones and meets a lamp. Flame races along the floor toward the grain sacks."], note: "The fire spreads one square a round. Corin must be cut loose before round 4, or he takes damage each round." },
    table: { name: "Smoke each round", tiers: [{ min: 1, max: 10, label: "Clear", effect: "No effect." }, { min: 11, max: 17, label: "Smoky", effect: "Ranged attacks are Hard (-4)." }, { min: 18, max: 20, label: "Choking", effect: "Everyone loses their Minor action this round." }], note: "Roll once at the start of each round, after the first barrel is open." },
    cards: [
      { title: "Harl (main enemy)", ordered: true, items: ["Keep the party away from Corin.", "Save as much grain as he can.", "Run through the stairs when the fire reaches him."] },
      { title: "Harl's helpers", ordered: false, items: ["Fight from the stairs.", "Retreat as soon as Harl runs."] },
      { title: "Corin (present, not fighting)", ordered: false, items: ["Struggles against the ropes.", "Can be cut free with a Minor action by anyone next to him."] },
    ],
    triggers: [{ condition: "A player character is knocked out", note: "Harl shouts for his helpers to stop. He will not hurt a helpless person, and he says so." }],
    enemies: ["bandit", "bandit_chief"],
    statusFields: [{ label: "Smoke", initial: "None yet" }],
    exit: "The fight ends. Pick how it ended on the next scene.",
  },

  endings: {
    title: "How It Ends",
    options: [
      { label: "A. They rescue Corin", planned: true, list: ["Corin walks out on his own feet.", "Harl and his helpers get away with some of the grain, or are captured, depending on the fight."], read: ["Corin steps into the dusk with a blanket around his shoulders. Marta crosses the yard at a run."] , note: "" },
      { label: "B. Harl escapes with the grain", planned: true, list: ["The mill is scorched but standing.", "Corin is safe. The grain is gone."], read: [], note: "The ledger page tells them where the grain is going." },
      { label: "C. The party is beaten or retreats", planned: false, list: ["Harl leaves at dawn as promised. He frees Corin at the top of the steps, but the party's goods are lighter."], read: [], note: "Decide what he takes based on how the fight went." },
    ],
    exit: "On to the wrap-up.",
  },

  wrap: {
    title: "Wrap-up and Rewards",
    read: ["By morning the wheel is turning again. Marta stands at the mill door with flour on her hands and Corin beside her, and she does not let go of his sleeve."],
    rewards: ["Twenty silver from Marta.", "The villagers sell them supplies at half price for as long as they stay."],
    seeds: ["The ledger page names a ferry buyer for the grain. Follow it in a later adventure."],
    ledger: ["Word of the rescue reaches the next village by nightfall."],
  },
} as const;
