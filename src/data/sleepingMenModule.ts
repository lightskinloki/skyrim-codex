// THE SLEEPING MEN — a 90-120 minute level 5 / 5 AP one-shot for five players,
// set in Markarth.
//
// Calcelmo, curator of the Dwemer Museum, hires the party to escort him to the
// sealed waystation of Bthar-Zel and bring back three dormant animunculi: the
// only intact specimens of their kind. The Forsworn ambush the expedition on
// the road out. On the road back, the Three wake — and Calcelmo's contract says
// the party is not paid for anything they destroy.
//
// Quick-run cut: museum hire -> bridge ambush -> Bthar-Zel and the Hall ->
// the curator's bargain -> the Three wake -> payment. The setup-only and
// road-only scenes from the long version are gone. Keep the museum to one
// offer, one objection, and a signature to stay inside two hours.
//
// Calibration: Apprentice tier (3-6 AP), five PCs at 5 AP. Enemy numbers use
// the APPRENTICE row of GM Guide/Reference tables. The Three are both the
// museum pieces and the climax enemies; their HP is the line between
// "restorable" and "destroyed." The Quieting Rod is the clean way out.
//
// The adventure is authored as a TypeScript CampaignModule rather than compiled
// from a markdown runsheet so the director, combat trackers and ending branches
// ship together. It is imported by data/bundledModules.ts.

import type { CampaignModule } from '@/types/campaign';

const RAW_SLEEPING_MEN_MODULE = {
  id: 'sleeping-men:module',
  name: 'The Sleeping Men',
  description:
    "A 90-120 minute job. Calcelmo of Markarth will pay well for five escorts — as long as every exhibit comes back unmarked. The Forsworn have other plans for the Sleeping Men of Bthar-Zel.",
  badge: 'One-shot · Level 5 · 5 PCs · 90-120 min',
  navTitle: 'THE SLEEPING MEN',
  tierTables: [],
  sourcePath: 'skyrim-codex/src/data/sleepingMenModule.ts',
  scenes: [
    {
      id: 'sleeping-men:scene:museum',
      moduleId: 'sleeping-men:module',
      title: '01 — The Dwemer Museum',
      subtitle: 'A curator, a contract, and three empty crates',
      type: 'character',
      kind: 'conversation',
      navNote: 'The offer',
      blocks: [
        {
          id: 'sm:museum:setup',
          kind: 'gmAlert',
          tag: 'START HERE:',
          text: `Five players. Level 5 (5 AP). **90-120 minutes.** Two fights, one museum scene, one vault, one payment scene. Run the museum fast: one offer, one objection, one signature. The damage clause is the twist — say it now, and again on the road back.`,
        },
        {
          id: 'sm:museum:secret',
          kind: 'gmNote',
          tag: "THE CURATOR'S SECRET — GM ONLY:",
          text: `Calcelmo knows the Three can wake outside the vault's dampening field. He brought the Quieting Rod as a failsafe and did not tell the party because he was afraid they would refuse the job or demand more money. The museum's acquisition fund is the fee; losing the Three will ruin him. He is not bluffing. Aicantar suspects, and is ashamed of not asking.`,
        },
        {
          id: 'sm:museum:party',
          kind: 'gmNote',
          tag: 'THE PARTY:',
          text: `Five 5 AP characters, Apprentice tier. Four players: remove one Forsworn reaver from the bridge and 50 HP from the Tall One's first bar. Six players: add one reaver and 50 HP to that bar. If your table treats “level 5” as 8-9 AP, use the Adept numbers in the appendix; the story and the rod rules do not change.`,
        },
        {
          id: 'sm:museum:1',
          kind: 'readAloud',
          paragraphs: [
            `Markarth is built on the bones of a dead city. The streets climb between grey stone faces; water falls from a hundred channels and vanishes into the dark below. Understone Keep stands at the top of the city, its dwemer masonry fitted so tightly that no mortar shows.`,
            `The Dwemer Museum is a long hall off the keep's main court. The air inside is cold and dry. Lamps burn behind glass, and the cases stand in rows like small coffins. At the far end, a tall Altmer in an ink-stained robe stands on a stool, adjusting a brass armature no bigger than a dinner plate. He does not turn around.`,
          ],
        },
        {
          id: 'sm:museum:2',
          kind: 'gmAlert',
          tag: 'OPEN THE TABLE:',
          text: `Let them look around before Calcelmo speaks. The museum is open; Aicantar is at the ledger; Nessa and Halvard are outside in the loading yard. Ask what they do. When the room has settled, read Calcelmo's first line.`,
        },
        {
          id: 'sm:museum:3',
          kind: 'spoken',
          speaker: 'CALCELMO',
          direction: 'without turning around',
          line: `Don't touch the cases. The glass is older than your family name.`,
        },
        {
          id: 'sm:museum:4',
          kind: 'gmNote',
          tag: 'WHO IS HERE:',
          text: `The museum is open. These are the people in it.`,
          items: [
            `**Calcelmo** — Altmer, court wizard of Markarth and curator of the Dwemer Museum. Tall, ink-stained, precise, vain, and more frightened than he lets on. He talks about objects the way other men talk about children.`,
            `**Aicantar** — his nephew and assistant. Younger, neater, tired. He keeps the ledger and the manifests, and he is the only person in the room who will tell the party the truth without being asked.`,
            `**Nessa and Halvard** — two of the excavation workers, in the loading yard. They fled Bthar-Zel. Nessa is angry; Halvard is quiet. Pell, the third worker, is dead.`,
            `**Two city guards** at the door. They do not interfere. They are there because the museum is in the Jarl's keep, not because Calcelmo expects trouble.`,
          ],
        },
        {
          id: 'sm:museum:5',
          kind: 'readAloud',
          paragraphs: [
            `Calcelmo sets the armature down, steps off the stool, and looks the party over the way he might look over a crate of doubtful provenance. Then he nods, once.`,
          ],
        },
        {
          id: 'sm:museum:6',
          kind: 'spoken',
          speaker: 'CALCELMO',
          line: `Five. Good. You look like you can lift things and keep your mouths shut. I have a proposition, a contract, and a cart. In that order.`,
        },
        {
          id: 'sm:museum:7',
          kind: 'gmNote',
          tag: 'THE OFFER:',
          text: `Calcelmo's excavation at **Bthar-Zel**, a sealed dwemer waystation in the Druadach foothills, has found three intact, dormant animunculi. His crew opened the Hall of Preserved Machines, saw the Three, and ran. One man, Torr, stayed behind with a broken leg. Calcelmo needs five escorts to bring the specimens back to the museum. The road is watched by Forsworn; he will not trust a merchant caravan with the find of the century.`,
        },
        {
          id: 'sm:museum:8',
          kind: 'handout',
          title: 'Contract of the Dwemer Museum',
          text: `BY ORDER OF THE DWEMER MUSEUM, UNDERSTONE KEEP, MARKARTH.\n\nThe bearers agree to escort Curator Calcelmo and the recovered property of the Museum to the waystation of Bthar-Zel and return.\n\nAdvance: 200 septims each, on signing.\nBalance: 400 septims each, on delivery of all three specimens in restorable condition.\n\nThe specimens are the property of the Museum. They are not to be struck, dropped, pried open, or exposed to flame, frost, shock, or loud incantation. If a specimen is destroyed or damaged beyond restoration, the balance for that specimen is forfeit. The advance is not refundable.\n\nSigned: Calcelmo, Curator; Aicantar, Witness; the bearers.`,
        },
        {
          id: 'sm:museum:9',
          kind: 'director',
          director: {
            npc: 'Calcelmo',
            title: "Calcelmo — the curator's terms",
            mustSay: [
              `Don't touch the cases. The glass is older than your family name.`,
              `If you break them, I cannot pay you. Not will not. Cannot.`,
              `The tall one is not a weapon. It is the only one of its kind.`,
            ],
            mustSayNote: `Everything else is yours. He is fussy, precise, and frightened; he hides behind procedure.`,
            always: [
              `He corrects small errors in other people's speech.`,
              `He touches the Quieting Rod when he is nervous.`,
              `He does not lie about the money. He lies by leaving things out.`,
              `He never admits he is afraid until the road back.`,
            ],
            beatsLabel: 'Museum beat',
            beats: [
              `A display case ticks as it cools.`,
              `Aicantar's pen scratches in the ledger.`,
              `Somewhere in the keep a door slams; Calcelmo flinches.`,
              `The lamps hum.`,
            ],
            groups: [
              { id: 'start', label: 'START' },
              { id: 'offer', label: 'THE OFFER' },
              { id: 'risk', label: 'THE RISK' },
              { id: 'close', label: 'CLOSING', exit: true },
            ],
            startNodeId: 'sm:museum:start',
            hubNodeId: 'sm:museum:hub',
            nodes: [
              {
                id: 'sm:museum:start',
                group: 'start',
                title: 'They come in',
                intent: `The party enters the museum. Calcelmo is on a stool, adjusting an armature. He finishes before he turns around.`,
                aim: `Make them feel like visitors in a place that belongs to him.`,
                must: [`Don't touch the cases. The glass is older than your family name.`],
                anchors: [
                  { text: `Five. Good. You look like you can lift things and keep your mouths shut.`, source: 'DRAFT' },
                ],
                info: [
                  `He has already decided to hire them. The interview is theatre.`,
                  `He is more comfortable talking about the collection than about money.`,
                ],
                next: ['sm:museum:hub'],
              },
              {
                id: 'sm:museum:hub',
                group: 'start',
                title: 'WHAT DO THEY ASK?',
                intent: `The main map. Every card leads back here.`,
                aim: `Tap the card closest to what the players ask or do.`,
                info: [
                  `He wants five escorts, a cart, and no questions.`,
                  `He will not raise the gold fee. He can be talked into a personal danger bonus.`,
                  `He is hiding the risk of the road.`,
                ],
                points: [
                  `Fee and advance stated`,
                  `Damage clause stated`,
                  `Quieting Rod handed over`,
                  `Workers heard`,
                  `Road risk raised`,
                ],
                next: ['sm:museum:pay', 'sm:museum:three', 'sm:museum:risk', 'sm:museum:workers', 'sm:museum:clause', 'sm:museum:accept'],
              },
              {
                id: 'sm:museum:pay',
                group: 'offer',
                title: 'They ask about the pay',
                intent: `They want to know what the job is worth.`,
                aim: `Get to the number fast. He is proud of being fair.`,
                anchors: [
                  { text: `Two hundred on signing, four hundred on delivery. Each. Aicantar has the ledger.`, source: 'DRAFT' },
                ],
                info: [
                  `The museum's acquisition fund is the fee. There is no hidden vault.`,
                  `He will add a 100-gold personal bonus if all three specimens survive, but only if pressed.`,
                  `He will not raise the museum's fee. The board would reject the contract.`,
                ],
                replies: [
                  { say: `That's not enough.`, ans: `Then I am sorry. I cannot invent money. I can offer the museum's favor, and my own purse if the Three come back whole.` },
                ],
                next: ['sm:museum:hub', 'sm:museum:clause'],
              },
              {
                id: 'sm:museum:three',
                group: 'offer',
                title: 'They ask what the Three are',
                intent: `They want to know what they are carrying.`,
                aim: `Let his love for the collection show. This is the most alive he gets.`,
                anchors: [
                  { text: `The small one is a spider. The round one is a sphere. The tall one is a centurion. There is no fourth.`, source: 'DRAFT' },
                ],
                info: [
                  `All three are dormant, intact, and unique in the museum's collection.`,
                  `Aicantar has named them Tick, Orbit, and Grandfather. Calcelmo pretends not to know.`,
                  `The tall one is twelve feet and does not fit a lined crate.`,
                ],
                next: ['sm:museum:hub', 'sm:museum:risk'],
              },
              {
                id: 'sm:museum:risk',
                group: 'risk',
                title: 'They ask about the road',
                intent: `They have heard about the Forsworn.`,
                aim: `He downplays the danger, then gives one true detail he cannot resist correcting.`,
                anchors: [
                  { text: `The Forsworn are bandits with a religion. They will not trouble a well-armed party.`, source: 'DRAFT' },
                ],
                info: [
                  `The Forsworn have been watching the excavation. They call the Three “the Sleeping Men.”`,
                  `The old road passes a dwemer waystone. Calcelmo knows it is a resonance pylon. He does not mention it.`,
                  `Aicantar looks at his uncle when the road is mentioned. A Hard Guile check catches the look.`,
                ],
                replies: [
                  { say: `What aren't you telling us?`, ans: `A pause. “The vault's field keeps them quiet. That is all. The rod is a precaution.” He is telling the truth and leaving out the road.` },
                ],
                next: ['sm:museum:hub', 'sm:museum:clause'],
              },
              {
                id: 'sm:museum:workers',
                group: 'risk',
                title: 'They ask to see the workers',
                intent: `Nessa and Halvard are in the loading yard.`,
                aim: `Let the workers undercut him without meaning to.`,
                anchors: [
                  { text: `The tall one moved its head. The curator says it was a trick of the light. There was no light.`, source: 'DRAFT' },
                ],
                info: [
                  `Pell died when the outer door came down. Torr stayed at the vault with a broken leg.`,
                  `The Forsworn watched the camp and did not attack. One said, “The Sleepers are not for sale.”`,
                  `Nessa will not go back. Halvard wants the curator to pay for Pell's burial. Calcelmo has not paid it.`,
                ],
                next: ['sm:museum:hub', 'sm:museum:risk'],
              },
              {
                id: 'sm:museum:clause',
                group: 'offer',
                title: 'They refuse the damage clause',
                intent: `They want to be paid even if they have to fight the cargo.`,
                aim: `Do not make him a villain. He genuinely cannot pay. Offer the narrow concession he can afford.`,
                anchors: [
                  { text: `If it attacks you, defend yourself. I am not asking you to die. I am asking you to try the rod first.`, source: 'DRAFT' },
                ],
                info: [
                  `He will agree that self-defense does not void the fee, but destruction still does.`,
                  `He will not remove the clause. The museum's board would reject the contract.`,
                  `Aicantar quietly suggests a personal bonus for every specimen that survives.`,
                ],
                next: ['sm:museum:hub', 'sm:museum:accept'],
              },
              {
                id: 'sm:museum:accept',
                group: 'close',
                title: 'They accept',
                intent: `The contract is signed; the advance is counted out.`,
                aim: `Close the scene and move to the road.`,
                must: [`The tall one is not a weapon. It is the only one of its kind.`],
                anchors: [
                  { text: `Aicantar, the ledger. Two hundred each. Do not spend it in the same tavern.`, source: 'DRAFT' },
                ],
                info: [
                  `Aicantar signs as witness; the party signs; 200 gold each is paid.`,
                  `Calcelmo gives the Quieting Rod to the PC who will carry it. He does not let go of it immediately.`,
                  `Aicantar shows the three sigils and the turning rings.`,
                ],
                next: ['sm:museum:hub'],
              },
            ],
          },
        },
        {
          id: 'sm:museum:10',
          kind: 'gmNote',
          tag: 'THE QUIETING ROD:',
          text: `Calcelmo hands the rod to the PC who will carry it — usually the strongest-looking one. A three-foot brass rod, three rings, three sigils: a spiral (the small one), a circle with a cross (the round one), three notches (the tall one). The rod is a Major Action to use; the full rules are in the combat scene and the appendix. If nobody volunteers, Aicantar gives it to the PC nearest him and says, “Please do not lose it. He will not sleep if you lose it.”`,
        },
        {
          id: 'sm:museum:11',
          kind: 'check',
          stat: 'guile',
          difficulty: 'Hard',
          penalty: -4,
          label: `Catch the pause when Calcelmo says the crates are lined.`,
        },
        {
          id: 'sm:museum:12',
          kind: 'check',
          stat: 'magic',
          difficulty: 'Standard',
          penalty: 0,
          label: `Study the Quieting Rod's three rings and sigils before taking it. Success: the first command check in the climax has advantage.`,
        },
        {
          id: 'sm:museum:13',
          kind: 'check',
          stat: 'guile',
          difficulty: 'Standard',
          penalty: 0,
          label: `Talk Calcelmo into a 100-gold personal bonus, each, if all three specimens survive. He agrees only if they also agree to carry the rod.`,
        },
        {
          id: 'sm:museum:14',
          kind: 'gmNote',
          tag: 'AICANTAR, QUIETLY:',
          text: `If the party asks Aicantar anything Calcelmo has not answered, he tells the truth in a low voice: the museum's acquisition fund is the fee; his uncle has not slept since the crew came back; the Jarl's court is already asking why the museum is spending money on “old brass.” He does not know the Three can wake. He knows his uncle is afraid of something and will not say what.`,
        },
      ],
      enemies: [],
      exits: [
        {
          id: 'sm:exit:museum',
          description: 'The contract is signed. Load the cart.',
          targetSceneId: 'sleeping-men:scene:bridge',
          branchLabel: '02 — The Broken Bridge',
        },
      ],
      tags: ['social', 'hiring'],
      schemaVersion: 2,
    },
    {
      id: 'sleeping-men:scene:bridge',
      moduleId: 'sleeping-men:module',
      title: '02 — The Broken Bridge',
      subtitle: 'Forsworn on the high ground, a cut harness, and a curator who will not leave the cart',
      type: 'combat',
      kind: 'combat',
      navNote: 'Forsworn ambush',
      blocks: [
        {
          id: 'sm:bridge:1',
          kind: 'readAloud',
          paragraphs: [
            `Three days out of Markarth, the road narrows onto a dwemer bridge over a gorge. The cart is heavy; Calcelmo has checked the ropes every hour; Aicantar has stopped telling him to stop.`,
            `The bridge is dwemer work: a single span of grey stone over a gorge, wide enough for one cart. The near end has cracked and settled. The far end disappears around a shoulder of rock. Halfway across, a line of red ochre handprints crosses the parapet.`,
            `Aicantar reins in. “Uncle. The marks.”`,
            `Calcelmo leans out of the cart, peers at the handprints, and says, “Paint. It is paint. Drive on.”`,
            `The first arrow takes the driver's hat off.`,
          ],
        },
        {
          id: 'sm:bridge:2',
          kind: 'gmAlert',
          tag: 'START THE FIGHT:',
          text: `Three reavers are on the rocks on both sides of the gorge; Varn the Briar-Sworn stands on the far parapet with a bow. One of them, Duach, is hidden under the bridge with a knife, waiting to cut the harness. Put the cart in the middle of the span. Calcelmo starts in the cart; Aicantar is with the mule. The Forsworn are not here to kill the party. They are here to stop the expedition and take the rod. Play them as people defending a boundary, not as bandits.`,
        },
        {
          id: 'sm:bridge:3',
          kind: 'combat',
          combat: {
            title: 'The Broken Bridge',
            objective: `Get the cart, Calcelmo and the crates across the gorge. Varn wants the Quieting Rod. The party can fight, bluff, or give him the rod — but the expedition dies here if the cart does.`,
            handout: {
              title: `Varn's terms, shouted across the bridge`,
              note: `He says this once, after the first arrow. He means it.`,
              items: [
                `“Throw the rod into the gorge. Turn the cart around. Go back to Markarth.”`,
                `“The Sleepers stay in the dark. No one has to die today.”`,
                `“The curator can keep his empty boxes. I want the key.”`,
              ],
            },
            statusFields: [
              { id: 'sm:bridge:status:cart', label: 'Cart', initial: 'Harnessed' },
              { id: 'sm:bridge:status:calcelmo', label: 'Calcelmo', initial: 'In the cart' },
              { id: 'sm:bridge:status:rod', label: 'Rod', initial: 'With the party' },
              { id: 'sm:bridge:status:bridge', label: 'Bridge', initial: 'Sound' },
            ],
            trackers: [
              {
                id: 'sm:bridge:tracker:escort',
                title: 'The Escort',
                description: `Calcelmo is a noncombatant: 10 HP, DR 0. The wagon is 80 HP; if it is wrecked, the crates must be carried and the party loses the mule's speed. Use the Down button when Calcelmo drops.`,
                targets: [
                  { id: 'sm:bridge:target:calcelmo', label: 'Calcelmo', maxHp: 10 },
                  { id: 'sm:bridge:target:wagon', label: 'Wagon', maxHp: 80 },
                ],
                quickDamage: [5, 10, 20],
                triggerBlocks: [],
              },
            ],
            cards: [
              {
                id: 'sm:bridge:card:varn',
                title: 'Varn the Briar-Sworn',
                statLine: `Apprentice TL2 Elite · 113 HP · DR 6 · Forsworn Sword 12 · Firebolt 6 + Burning 2 (3 FP) · Oakflesh +2 DR (3 FP) · Briarheart: a called shot to the chest (Very Hard) or a fire critical destroys the heart and drops him.`,
                ordered: true,
                items: [
                  `Opens with a bow shot from the far parapet, then shouts his terms. He wants the rod, not the crates.`,
                  `Stays on the far side while the reavers work. If a PC closes to melee, he meets them with sword and Oakflesh.`,
                  `If reduced below half HP, offers the same terms again: “The rod, and the cart goes back. You keep your lives.” He will not surrender while he has a weapon.`,
                  `If he dies, the reavers break at the end of the round.`,
                ],
                quote: `The Sleepers are not for sale. Neither is the Reach.`,
              },
              {
                id: 'sm:bridge:card:reavers',
                title: 'The Forsworn Reavers',
                statLine: `Apprentice TL1 Minion · 40 HP · DR 4 · Forsworn Sword 8 · Flames 4 + Burning 1 for 2 turns (1 FP).`,
                ordered: false,
                items: [
                  `**Uraccen** — left rocks, above the cart. Uses Flames on the mule's harness; wants the cart stopped, not the party dead.`,
                  `**Mael** — right rocks, above the cart. Shoots at anyone who leaves cover.`,
                  `**Duach** — under the bridge with a knife. At the end of round 2, if alive, he cuts the harness.`,
                  `They break and run if Varn dies or two of them are down. They do not pursue across the bridge.`,
                ],
              },
              {
                id: 'sm:bridge:card:calcelmo',
                title: 'Calcelmo',
                statLine: `10 HP · DR 0 · no attack.`,
                ordered: true,
                items: [
                  `Starts in the cart, on the floor, with his arms around the nearest crate.`,
                  `Shouts advice nobody asked for: “The tall one must not be struck! The small one must not be struck! None of them are here yet, but the principle stands!”`,
                  `If a reaver climbs into the cart, Calcelmo hits him with the ledger. No damage; the reaver has disadvantage on its next attack.`,
                  `If he reaches 0 HP, he is dying, not dead. A PC can stabilize him with a Major Action and a Standard Guile check.`,
                ],
                quote: `If you break them, I cannot pay you. Not will not. Cannot.`,
              },
              {
                id: 'sm:bridge:card:aicantar',
                title: 'Aicantar and the mule',
                statLine: `8 HP · DR 0 · no attack.`,
                ordered: false,
                items: [
                  `Drives the cart. Keeps his head down until someone is hurt.`,
                  `Can cut the mule loose as a Minor Action, but only if told to. If the harness is cut first, he grabs the mule's head and holds it.`,
                  `Once per fight, he throws a lamp at a reaver: Standard Agility, 4 fire damage, no Burning. Then he is out of things to throw.`,
                ],
              },
              {
                id: 'sm:bridge:card:terrain',
                title: 'The bridge',
                ordered: false,
                items: [
                  `Twenty feet wide, sixty feet long. The cart blocks the middle. Cover from the cart gives +2 DR against ranged attacks (local ruling).`,
                  `The gorge is a sixty-foot drop. A PC who goes over the edge can grab the parapet with a Standard Agility check; failure means 3d6 falling damage and a long climb back.`,
                  `The far end is clear. If the cart crosses, the party can cut the pursuit off by overturning it on the span.`,
                ],
              },
            ],
            triggers: [
              {
                id: 'sm:bridge:trigger:calcelmo-down',
                condition: 'Calcelmo reaches 0 HP',
                blocks: [
                  {
                    kind: 'readAloud',
                    tone: 'danger',
                    paragraphs: [
                      `Calcelmo folds over the tailboard and does not get up. The ledger slides out of the cart and opens face-down in the dust. Aicantar screams his name and lets go of the mule.`,
                    ],
                  },
                  {
                    kind: 'text',
                    text: `He is dying, not dead. A PC can stabilize him with a Major Action and a Standard Guile check. If nobody reaches him before the end of the next round, he dies. The Forsworn do not finish him; Varn shouts at his reavers to leave the old man alone. The curator's death ends the museum plot and changes the ending.`,
                  },
                ],
              },
              {
                id: 'sm:bridge:trigger:harness',
                condition: 'End of round 2 — Duach cuts the harness (if alive)',
                blocks: [
                  {
                    kind: 'readAloud',
                    paragraphs: [
                      `A knife saws through the harness beneath the cart. The mule screams and lurches forward; the cart rolls back, its wheel wedging against the near parapet with a crack that echoes down the gorge.`,
                    ],
                  },
                  {
                    kind: 'text',
                    text: `The cart rolls ten feet back and stops against the parapet. A PC can grab the brake with a Standard Might check to hold it steady; failure means the cart takes 10 damage and a crate of packing straw goes over the edge. The mule is panicked until someone spends a Minor Action calming it (Standard Guile).`,
                  },
                ],
              },
              {
                id: 'sm:bridge:trigger:varn-down',
                condition: 'Varn reaches 0 HP or surrenders',
                blocks: [
                  {
                    kind: 'readAloud',
                    paragraphs: [
                      `Varn goes down on the far parapet. The briar heart in his chest gives one last pulse of red light and goes dark. The reavers look at him, then at the road, and then they are gone — over the rocks, into the heather, without a backward glance.`,
                    ],
                  },
                  {
                    kind: 'text',
                    text: `If Varn is alive and surrendered, he spits blood and says: “You will hear the stone before you see the bridge. When it sings, run.” Then he tells them what he knows: the old road passes a dwemer waystone; the Forsworn call it the Weeper; the Sleeping Men wake when it sings. He will not say how he knows.`,
                  },
                ],
              },
            ],
            enemies: ['forsworn_reaver', 'forsworn_reaver', 'forsworn_reaver', 'varn_briarheart'],
          },
        },
        {
          id: 'sm:bridge:4',
          kind: 'gmNote',
          tag: 'RUNNING VARN:',
          text: `Varn is not a suicide. He wants the rod and the expedition turned back. He will parley once, mid-fight, if the party stops attacking: “The rod, and the cart goes back. You keep your lives.” If they refuse, he fights to the death. If they throw the rod into the gorge, he lets them pass — but the rod is gone, the museum's best hope with it, and the climax becomes a damage race. Mark the rod lost and let the consequences land.`,
        },
        {
          id: 'sm:bridge:5',
          kind: 'choices',
          prompt: 'After the bridge',
          options: [
            {
              id: 'sm:bridge:o1',
              label: 'They spare Varn',
              heading: 'They spare Varn',
              blocks: [
                {
                  kind: 'readAloud',
                  paragraphs: [
                    `Varn sits against the parapet with his sword across his knees. The briar heart in his chest is a dull red knot; it does not look like it belongs in a man. He watches the party bind his wound and does not thank them.`,
                  ],
                },
                {
                  kind: 'spoken',
                  speaker: 'VARN',
                  line: `You are carrying a key to something that was buried for a reason. The curator wants to put it behind glass. I want it to stay in the dark. Only one of us is lying about what it is.`,
                },
                {
                  kind: 'text',
                  text: `Varn tells them what he knows: the old road passes a dwemer waystone; the Forsworn call it the Weeper; the Sleeping Men wake when it sings. He does not know the rod can put them back to sleep. If the party promises to leave the Three in the vault, he lets them go — he will not believe them, but he will not stop them. If they lie, he knows it and says nothing.`,
                },
              ],
            },
            {
              id: 'sm:bridge:o2',
              label: 'They kill Varn',
              heading: 'They kill Varn',
              blocks: [
                {
                  kind: 'readAloud',
                  paragraphs: [
                    `Varn dies with his eyes open, looking at the sky over the gorge. The reavers are gone. The bridge is quiet except for the wind and the mule.`,
                  ],
                },
                {
                  kind: 'spoken',
                  speaker: 'AICANTAR',
                  direction: 'quietly',
                  line: `He knew something. About the stone. I saw him look at it when he said the Weeper.`,
                },
                {
                  kind: 'text',
                  text: `A dying reaver, if any are left, spits: “The Sleepers will not stay buried.” No other information. The Forsworn are now enemies of the party; a future adventure can revisit this.`,
                },
              ],
            },
          ],
        },
        {
          id: 'sm:bridge:rod',
          kind: 'gmNote',
          tag: 'IF THEY THROW THE ROD:',
          text: `Varn lowers his bow. Mark the Quieting Rod lost. The Forsworn let the cart pass to the vault, but Varn's scouts shadow them; the road back becomes a damage race, with the Weeping Stone as the only clean shutdown. Calcelmo is devastated. The museum's fee is still owed if they bring the specimens back.`,
        },
        {
          id: 'sm:bridge:6',
          kind: 'text',
          small: true,
          text: `The party can take a short rest after the bridge. The Forsworn are gone. Do not roll a random encounter.`,
        },
      ],
      enemies: [],
      exits: [
        {
          id: 'sm:exit:bridge',
          description: 'Cross the gorge and climb to Bthar-Zel.',
          targetSceneId: 'sleeping-men:scene:vault',
          branchLabel: '03 — Bthar-Zel',
        },
      ],
      tags: ['combat', 'forsworn'],
      schemaVersion: 2,
    },
    {
      id: 'sleeping-men:scene:vault',
      moduleId: 'sleeping-men:module',
      title: '03 — Bthar-Zel',
      subtitle: 'A dead camp, a singing door, and one man who stayed',
      type: 'set-piece',
      kind: 'scene',
      navNote: 'The waystation',
      blocks: [
        {
          id: 'sm:vault:1',
          kind: 'readAloud',
          paragraphs: [
            `The waystation is cut into the cliff like a lodged axe: a low dwemer facade, a black doorway, and a terrace scattered with the expedition's leavings. A camp stove lies on its side. A crate of lamps has burst open. There are boot prints everywhere, all of them pointing away from the door.`,
            `One tent is still standing. Someone has propped a shovel against it and hung a strip of cloth over the entrance. From inside, a man says, “If you're here to rob the place, I've got a pickaxe and nothing to lose.”`,
          ],
        },
        {
          id: 'sm:vault:2',
          kind: 'spoken',
          speaker: 'TORR',
          direction: 'from inside the tent',
          line: `If you're here to rob the place, I've got a pickaxe and nothing to lose.`,
        },
        {
          id: 'sm:vault:3',
          kind: 'gmNote',
          tag: 'TORR, THE FOREMAN:',
          text: `Torr has been alone at the vault for three days. He is not glad to see the curator.`,
          items: [
            `Nord, middle-aged, leg broken in two places and splinted with a shovel handle. He stayed because he could not walk and because the curator would have docked his pay. He is dry, tired, and not impressed by the party.`,
            `He knows the Hall is open, the Three are inside, and the rod is on the lectern. He does not know the Three can wake.`,
            `He knows the Forsworn watched the camp and did not attack. One of them said, “The Sleepers are not for sale.”`,
            `He knows Pell died when the outer door came down. He blames Calcelmo for opening it before the shoring was finished.`,
            `He knows the Hall's floor has a pressure plate in front of the tall one's niche: “Third ring from the wall. Don't step on it.”`,
            `If the party splints his leg properly, he can ride in the cart and help once in the climax (drag a crate clear, cut the mule loose, or hold a lantern steady for a command check). He will not fight.`,
          ],
        },
        {
          id: 'sm:vault:4',
          kind: 'choices',
          prompt: 'At the camp',
          options: [
            {
              id: 'sm:vault:o1',
              label: 'They splint his leg',
              heading: 'They splint his leg',
              blocks: [
                { kind: 'check', stat: 'might', difficulty: 'Standard', penalty: 0, label: `Set and splint Torr's leg with the expedition's supplies.` },
                {
                  kind: 'text',
                  text: `Success: Torr can travel in the cart. He grumbles about being cargo, then falls asleep. Failure: he will not let them touch it; he stays at the camp with the pickaxe. Either way, he tells them what he knows.`,
                },
                {
                  kind: 'spoken',
                  speaker: 'TORR',
                  line: `The tall one's crate is the sledge. No lead in it. Curator said the rod would be enough. I'd have lined it myself if I could stand.`,
                },
              ],
            },
          ],
        },
      ],
      enemies: [],
      exits: [
        {
          id: 'sm:exit:vault',
          description: 'Enter the Hall of Preserved Machines.',
          targetSceneId: 'sleeping-men:scene:hall',
          branchLabel: '04 — The Hall of Preserved Machines',
        },
      ],
      tags: ['exploration', 'vault'],
      schemaVersion: 2,
    },
    {
      id: 'sleeping-men:scene:hall',
      moduleId: 'sleeping-men:module',
      title: '04 — The Hall of Preserved Machines',
      subtitle: 'Three niches, three sleepers, and one rod that is the only key',
      type: 'set-piece',
      kind: 'scene',
      navNote: 'The Three',
      blocks: [
        {
          id: 'sm:hall:1',
          kind: 'readAloud',
          paragraphs: [
            `The Hall smells of cold metal and old dust. The blue lamps do not flicker. The Three stand in their niches exactly as Pell described them: the small one on its plinth, the round one in its cradle, the tall one against the back wall with its arms folded.`,
            `Up close, they are not statues. The small one's legs are jointed and folded; the round one's crossbow arm is retracted but whole; the tall one's chest rises and falls — not with breath, but with a slow pulse of blue light behind the brass.`,
            `On the lectern, the Quieting Rod lies across a plaque. Three rings. Three sigils. The rod is warm.`,
          ],
        },
        {
          id: 'sm:hall:2',
          kind: 'gmNote',
          tag: 'THE HALL:',
          text: `The Hall is a showroom, not a tomb. Everything in it was meant to be looked at.`,
          items: [
            `**The niches** — three alcoves, each tall as a door, each edged in brass. The small one's plinth is at waist height; the round one's cradle is at chest height; the tall one's niche is a step up from the floor, with the pressure plate in front of it.`,
            `**The lectern** — white dwemer metal, waist high, with the Quieting Rod and a plaque. The plaque is in dwemer script and plain Tamrielic, as if the dwemer expected visitors.`,
            `**The crates** — four lined with lead, one long sledge for the tall one. The sledge is canvas-covered, unlined, and too short for the centurion unless it is folded.`,
            `**The walls** — covered in dwemer script. A Standard Magic check reads enough to know this was a waystation for “preserved servants,” not a tomb. Nothing here is a weapon; everything here is a collection.`,
          ],
        },
        {
          id: 'sm:hall:plate',
          kind: 'gmNote',
          tag: 'THE PRESSURE PLATE:',
          text: `The third ring from the wall, directly in front of the tall one's niche, is a pressure plate. Stepping on it opens a steam vent: 8 fire damage to everyone within 5 feet, DR applies, and a clang that makes Calcelmo yelp. A PC who spots it can mark it with chalk or a lamp and avoid it. It is not a puzzle; it is a warning that the Hall was built to keep people away from the tall one.`,
        },
        {
          id: 'sm:hall:plate-check',
          kind: 'check',
          stat: 'agility',
          difficulty: 'Hard',
          penalty: -4,
          label: `Cross the Hall without stepping on the third ring from the wall — or spot the plate first with a Standard Guile check.`,
        },
        {
          id: 'sm:hall:3',
          kind: 'handout',
          title: 'The plaque on the lectern',
          text: `THE HAND THAT QUIETS THE THREE\n\nTurn the outer ring to the sigil of the sleeper.\nSpeak the tone. Do not wake them.\n\nThe small one answers the spiral.\nThe round one answers the circle.\nThe tall one answers the three notches.\n\nThe tall one is stubborn. Speak twice.`,
        },
        {
          id: 'sm:hall:journal',
          kind: 'findable',
          name: "Pell's journal, last page",
          description: `A folded page on the lectern, weighted under a brass gear. The handwriting gets worse toward the bottom.`,
          readAloud: `Day 7. The door is open. The hall is longer than the survey said. Three niches. Three of them.\nDay 8. The curator says they are dormant. The small one is warm. He says that is residual heat. It has been three thousand years.\nDay 9. The tall one's eyes followed me. The curator says it is a trick of the light. There is no light in the hall except the brass.\nDay 10. Nessa says the small one twitched. I heard the tall one take a breath. Brass does not breathe. We are going to be rich.`,
        },
        {
          id: 'sm:hall:4',
          kind: 'gmNote',
          tag: 'INSPECTING THE THREE:',
          text: `Give the party one detail per inspection. Do not read all three unless they take the time.`,
          items: [
            `**The Small One** — a Standard Magic check finds a faint hum in its carapace and a warmth that has nothing to do with the lamps. It is dormant, not dead. If a PC touches it, one leg twitches. Calcelmo says it is a trapped gear. Aicantar says, “Tick does that.”`,
            `**The Round One** — a Standard Magic check finds its crossbow arm loaded. The bolt is dwemer make, still bright. It is pointing at the door.`,
            `**The Tall One** — a Hard Magic check finds the pulse in its chest is synchronized with the waystone outside. This is the clue: the pylon is the leash. If the party learns this, they know the old road is dangerous.`,
          ],
        },
        {
          id: 'sm:hall:5',
          kind: 'check',
          stat: 'magic',
          difficulty: 'Hard',
          penalty: -4,
          label: `Understand the Quieting Rod's three rings and why the tall one's ring is stiff. Success: the first command check in the climax has advantage.`,
        },
        {
          id: 'sm:hall:6',
          kind: 'gmNote',
          tag: 'LOADING THE THREE:',
          text: `The workers left the crates. Loading them is a skill challenge, not a fight. Play each specimen as a separate problem; do not roll for every crate.`,
          items: [
            `**The Small One** — light enough for one person. No check unless they are careless; if they drop it, it clangs and Calcelmo makes a sound like a wounded animal. No damage, but his trust drops.`,
            `**The Round One** — Standard Might, advantage with the block-and-tackle or Torr's help. Failure: it slips, the crate cracks, and the round one's crate will open at the start of the climax instead of the end of round 1. Mark it.`,
            `**The Tall One** — Hard Might to sledge it, or a **Standard Magic** command check with the rod to make it fold. Success on the rod: it folds with a sound like a lock turning, the sledge is easy to load, and the party has practiced the sequence — the first command check in the climax has advantage. Failure: it does not fold; they must sledge it, the sledge is unlined, and the Tall One assembles at the end of round 2.`,
          ],
        },
        {
          id: 'sm:hall:7',
          kind: 'gmNote',
          tag: 'CALCELMO IN THE HALL:',
          text: `Calcelmo is delighted and unbearable. He circles the niches, measuring with his hands, talking about display angles and humidity. He touches the tall one's plinth once, lightly, like a man touching a grave. He does not look at the unlined sledge. When Aicantar mentions the road, he changes the subject.`,
        },
        {
          id: 'sm:hall:8',
          kind: 'check',
          stat: 'guile',
          difficulty: 'Hard',
          penalty: -4,
          label: `Press Calcelmo about the field, the road, and what he knows.`,
        },
        {
          id: 'sm:hall:9',
          kind: 'text',
          text: `Success: he admits it. “The vault's field keeps them quiet. Outside, the rod is the only thing that will. I did not tell you because I knew what you would ask.” He straightens his robe. “I am not a brave man. I am a curator. There is a difference, and it is not in my favor.” Aicantar looks at the floor. Failure: he deflects with a lecture on dwemer damping fields; Aicantar tells the party on the road back, when it is too late to prepare.`,
        },
        {
          id: 'sm:hall:10',
          kind: 'choices',
          prompt: 'Before they leave the vault',
          options: [
            {
              id: 'sm:hall:o1',
              label: 'They bring Torr',
              heading: 'They bring Torr',
              blocks: [
                {
                  kind: 'text',
                  text: `Torr rides in the cart with his splinted leg against the tailboard. He can help once in the climax: drag a crate clear, cut the mule loose, or hold a lantern steady for a command check (granting advantage on one check). He will not fight, and he will not be quiet about the curator's driving.`,
                },
                {
                  kind: 'spoken',
                  speaker: 'TORR',
                  line: `I've been down here ten days. I'm not staying another one.`,
                },
              ],
            },
            {
              id: 'sm:hall:o2',
              label: 'They leave Torr with supplies',
              heading: 'They leave Torr with supplies',
              blocks: [
                {
                  kind: 'text',
                  text: `Torr stays at the camp with food, water, and the pickaxe. He tells them to send someone from Markarth if they are not back in two days. He does not ask them to stay. If the party returns to the vault later, he is still there; if they never return, that is its own ending.`,
                },
              ],
            },
          ],
        },
        {
          id: 'sm:hall:go',
          kind: 'text',
          text: `The cart is loaded, the sledge roped down, the rod in the party's keeping. Calcelmo checks the ropes three times. Aicantar checks them once, after Calcelmo is done. The sun is already going down when they start back.`,
        },
      ],
      enemies: [],
      exits: [
        {
          id: 'sm:exit:hall',
          description: 'Load the Three and start back to Markarth.',
          targetSceneId: 'sleeping-men:scene:road-back',
          branchLabel: '05 — The Road Back',
        },
      ],
      tags: ['exploration', 'artifacts'],
      schemaVersion: 2,
    },
    {
      id: 'sleeping-men:scene:road-back',
      moduleId: 'sleeping-men:module',
      title: '05 — The Road Back',
      subtitle: 'A heavier cart, a shorter road, and a stone that hums',
      type: 'interlude',
      kind: 'scene',
      navNote: 'The Weeping Stone',
      blocks: [
        {
          id: 'sm:roadback:1',
          kind: 'readAloud',
          paragraphs: [
            `The cart sits lower on its axles. The Three are crated and roped; the Tall One rides on the sledge at the back, covered in canvas, its shape still wrong under the cloth. Calcelmo has not stopped talking since the vault. He talks about display cases, about humidity, about the correct angle at which to light a dwemer armature. Aicantar drives. Torr, if he came, sits with his splinted leg against the tailboard and watches the ridge.`,
            `The road back is the same road, but the light is different. The wind has turned. Ahead, where the old dwemer road forks toward the Karth, a standing stone rises out of the heather. It is half-buried and black with age, and it is humming.`,
          ],
        },
        {
          id: 'sm:roadback:2',
          kind: 'spoken',
          speaker: 'CALCELMO',
          direction: 'waving a hand',
          line: `That is a resonance pylon. A waystone. It is harmless. It is a road marker.`,
        },
        {
          id: 'sm:roadback:3',
          kind: 'spoken',
          speaker: 'AICANTAR',
          direction: 'quietly',
          line: `Uncle. It is singing.`,
        },
        {
          id: 'sm:roadback:4',
          kind: 'spoken',
          speaker: 'CALCELMO',
          direction: 'not looking at him',
          line: `It is humming. There is a difference.`,
        },
        {
          id: 'sm:roadback:5',
          kind: 'gmNote',
          tag: 'THE WAKE:',
          text: `The main road is blocked by a fresh rockslide — the Forsworn's parting gift, whether Varn lived or died. The old road past the pylon is the only cart-friendly route. The pylon is the twin of the field generator in the vault. It is calling the Three home.`,
        },
        {
          id: 'sm:roadback:6',
          kind: 'readAloud',
          paragraphs: [
            `The cart's iron tire rings on a stone. The rod in the party's pack grows warm. One by one, the sigils light: spiral, circle, three notches. In the crates, something begins to tick.`,
            `Calcelmo's face changes. “Drive,” he says. “Drive faster. Do not stop at the stone.”`,
            `The mule balks. The cart's axle settles into a rut. The sledge shifts, and the canvas over the Tall One rises — not lifted, but pushed from underneath, like a hand testing a lid.`,
          ],
        },
        {
          id: 'sm:roadback:7',
          kind: 'gmAlert',
          tag: "THE CURATOR'S BARGAIN:",
          text: `Before initiative, Calcelmo climbs down from the cart and puts himself between the party and the crates. Read the five lines below in order, then let the table react. If they run, go to the payment scene with the “fled” ending. If they stand, go to the combat. If they try the rod before initiative, resolve one command check first (see the combat rules), then go to the combat.`,
        },
        {
          id: 'sm:roadback:8',
          kind: 'spoken',
          speaker: 'CALCELMO',
          direction: 'arms spread, robe flapping',
          line: `Stop! STOP! You cannot — listen to me — you cannot strike them!`,
        },
        {
          id: 'sm:roadback:9',
          kind: 'spoken',
          speaker: 'CALCELMO',
          line: `They are not attacking you. They are waking up. There is a difference! The vault kept them quiet; the stone is calling them home; they are frightened, or confused, or following an old road in their heads — I do not know! But they are not evil. They are the only three of their kind that still exist!`,
        },
        {
          id: 'sm:roadback:10',
          kind: 'spoken',
          speaker: 'CALCELMO',
          line: `If you break them, I cannot pay you. I am not threatening you. I am telling you the truth. The museum's entire acquisition fund is in those crates. The Jarl's court will take my office. They will sell the collection to pay the debt. Aicantar will lose his position. I will be a man in a dirty robe with a locked door and a sign that says closed. Do you understand? You will have saved my life and I will have nothing left to pay you with.`,
        },
        {
          id: 'sm:roadback:11',
          kind: 'spoken',
          speaker: 'CALCELMO',
          direction: 'quieter, worse',
          line: `They are priceless. There is no second Bthar-Zel. There is no second set. I have looked. I have spent forty years looking. The small one is the only intact spider in Skyrim. The round one still has its original bow. The tall one — the tall one is not a machine. It is a held breath. If you put a hammer through it, there is no one left who knows what it sounded like.`,
        },
        {
          id: 'sm:roadback:12',
          kind: 'spoken',
          speaker: 'CALCELMO',
          direction: 'desperate',
          line: `Use the rod. The rod is the key. Put them back to sleep. I will give you everything I have — my purse, my books, the good cloak — but do not put a hammer through the tall one's chest. Please. Please.`,
        },
        {
          id: 'sm:roadback:13',
          kind: 'spoken',
          speaker: 'CALCELMO',
          direction: 'if a PC says they are trying to kill us',
          line: `I know. I know. That is why I am asking. If you must choose between my life and theirs, choose mine. I mean it. I have had a long life and a small museum. They have neither.`,
        },
        {
          id: 'sm:roadback:14',
          kind: 'gmNote',
          tag: 'PLAY IT STRAIGHT:',
          text: `He is not haggling. He is doing arithmetic he has already lost. Do not let the table think he is bluffing; the contract is real, the museum's fund is real, and Aicantar's face is the proof. He is also not a saint: he hired them without telling them the road would wake the Three. Both things are true.`,
        },
        {
          id: 'sm:roadback:15',
          kind: 'choices',
          prompt: 'What do they do?',
          options: [
            {
              id: 'sm:roadback:o1',
              label: 'They run',
              heading: 'They run',
              blocks: [
                {
                  kind: 'readAloud',
                  paragraphs: [
                    `They leave the cart in the road and run for the ridge. Behind them, the crates split. The small one comes out first, brass legs clicking on the stone. The tall one's canvas rises all the way and falls away.`,
                    `The Three do not follow. They stand in the road around the humming stone, watching the party go. Calcelmo does not run. He stands between them and the cart with his arms out until Aicantar pulls him away.`,
                  ],
                },
                {
                  kind: 'text',
                  text: `They keep the advance (200 each). No balance, no AP. Calcelmo and Aicantar either escape with them or do not, GM's choice; if they do, the museum is ruined and Calcelmo does not blame them out loud. Use the “fled” ending in the payment scene.`,
                },
              ],
            },
            {
              id: 'sm:roadback:o2',
              label: 'They stand and fight',
              heading: 'They stand and fight',
              blocks: [
                {
                  kind: 'text',
                  text: `Roll initiative. The Quieting Rod is in the party's keeping; Calcelmo is between them and the crates. Go to the combat.`,
                },
              ],
            },
            {
              id: 'sm:roadback:o3',
              label: 'They try the rod before initiative',
              heading: 'They try the rod before initiative',
              blocks: [
                { kind: 'check', stat: 'magic', difficulty: 'Hard', penalty: -4, label: `Command the nearest waking specimen with the Quieting Rod.` },
                {
                  kind: 'text',
                  text: `Success: the small one powers down before it fully unfolds. It is preserved. Mark it dormant and remove it from the fight; the party still faces the round one and the tall one. Failure: the small one shrieks and attacks the rod-bearer; the fight starts with the party at a disadvantage in the fiction, but no mechanical penalty beyond the failed action. Then go to the combat.`,
                },
              ],
            },
          ],
        },
      ],
      enemies: [],
      exits: [
        {
          id: 'sm:exit:roadback',
          description: 'The Sleeping Men wake.',
          targetSceneId: 'sleeping-men:scene:wake',
          branchLabel: '06 — The Sleeping Men Wake',
        },
      ],
      tags: ['travel', 'the-weeping-stone'],
      schemaVersion: 2,
    },
    {
      id: 'sleeping-men:scene:wake',
      moduleId: 'sleeping-men:module',
      title: '06 — The Sleeping Men Wake',
      subtitle: 'Three priceless things try to kill the party. The curator asks them not to hit back.',
      type: 'combat',
      kind: 'combat',
      navNote: 'The climax',
      blocks: [
        {
          id: 'sm:wake:1',
          kind: 'readAloud',
          paragraphs: [
            `The small one comes first. It is the size of a dog and moves like a wasp, brass legs finding the road stones, a single blue eye burning in its carapace. The round one follows, unfolding from its crate in a series of clicks, its crossbow arm extending with a sound like a knife leaving a sheath. The tall one is still under the canvas. The canvas is rising.`,
            `Calcelmo stands between the party and the crates with his arms spread. Aicantar has the mule's head in both hands. The pylon hums behind them all, a note you feel in your teeth.`,
          ],
        },
        {
          id: 'sm:wake:2',
          kind: 'combat',
          combat: {
            title: 'The Sleeping Men Wake',
            objective: `Survive. Preserve the Three if you can. Each destroyed specimen costs the party 200 gold per PC and a piece of Calcelmo's museum. The Quieting Rod is the clean way out, destroying the pylon is the brute-force way, and killing the Three is the desperate way. All three are legitimate choices; do not tell the players which one is “right.” The Three do not pursue beyond the pylon.`,
            handout: {
              title: 'The Quieting Rod — quick rules',
              note: `Give this to the rod-bearer. It is a key, not a weapon.`,
              items: [
                `**Command (Major Action):** choose one construct within 30 feet. Roll Hard Magic (-4) or Hard Guile (-4) against your own stat. Success: it powers down and is preserved. Failure: it immediately attacks you as a reaction; if it cannot, the rod burns you for 8 damage and the Tall One advances one assembly stage.`,
                `**The Tall One is stubborn:** the first success staggers it (it loses its next action); the second shuts it down. After its first 150 HP bar is gone, command checks are Very Hard (-6).`,
                `**Calcelmo can assist:** if he is within 5 feet and calm, your command check has advantage. To calm him, a PC spends a Minor Action and makes a Standard Guile check. He panics again if a specimen is destroyed or he is hit.`,
                `**Called shot:** Very Hard Might or Agility, no HP damage. The target loses its next action. This is how a martial character staggers a specimen without damaging it.`,
                `**If the rod is lost:** destroy the Weeping Stone (80 HP, DR 8) to shut all three down at the end of the round. Everyone within 20 feet takes 8 thunder damage (Standard Agility avoids).`,
              ],
            },
            statusFields: [
              { id: 'sm:wake:status:exhibits', label: 'Exhibits intact', initial: '3 / 3' },
              { id: 'sm:wake:status:tall', label: 'The Tall One', initial: 'Crated — assembles end of round 2' },
              { id: 'sm:wake:status:rod', label: 'The Rod', initial: "With the party" },
              { id: 'sm:wake:status:calcelmo', label: 'Calcelmo', initial: 'Panicking' },
              { id: 'sm:wake:status:pylon', label: 'The Weeping Stone', initial: 'Humming' },
            ],
            trackers: [
              {
                id: 'sm:wake:tracker:tall-one',
                title: 'The Tall One — two bars',
                description: `Track the Tall One's HP here, not on its token. The token is for initiative and its attacks. Press Down on the first bar when it reaches 0. The second bar starts at 150 and clears its statuses.`,
                targets: [
                  { id: 'sm:wake:target:bar1', label: 'First bar', maxHp: 150 },
                  { id: 'sm:wake:target:bar2', label: 'Second bar', maxHp: 150 },
                ],
                quickDamage: [10, 20, 50],
                threshold: 1,
                thresholdText: `The first bar is spent. Steam screams out of the Tall One's chest; the rod can reach its core. Command checks are now Very Hard (-6).`,
                triggerBlocks: [
                  {
                    kind: 'readAloud',
                    paragraphs: [
                      `The Tall One's chest splits open. Inside is a blue-white core the size of a man's fist, held in three brass claws. The rod in your hand jumps. The rings spin on their own.`,
                      `Calcelmo screams: “The core! Do not touch the core! The core is the — ” The rest is lost in steam.`,
                    ],
                  },
                  {
                    kind: 'text',
                    text: `Command checks against the Tall One are now Very Hard (-6). The first success staggers it; the second shuts it down. A called shot to the core (Very Hard Agility, adjacent) can pull it free: the Tall One shuts down and is preserved. Failure: the core burns the attacker for 10 damage.`,
                  },
                ],
              },
            ],
            cards: [
              {
                id: 'sm:wake:card:spider',
                title: 'The Small One (Tick)',
                statLine: `Dwarven Spider · 40 HP · DR 4 · Shock Bolt 8 (drains 2 FP) · immune to poison and mind-affecting · self-destructs at 0 HP.`,
                ordered: true,
                items: [
                  `Hunts the Quieting Rod. It will climb the cart, a rock, or a PC to reach the rod-bearer.`,
                  `It is fast: it moves as a Minor Action and attacks as a Major. It does not hold ground.`,
                  `At 0 HP it self-destructs: 6 shock damage to everyone within 5 feet, Standard Agility avoids. Calcelmo screams “Tick!” whether or not he can see it.`,
                  `If commanded with the rod, it powers down and is preserved. One success.`,
                ],
              },
              {
                id: 'sm:wake:card:sphere',
                title: 'The Round One (Orbit)',
                statLine: `Dwarven Sphere · 113 HP · DR 6 · Blade 12 · Integrated Crossbow 12 (ignores 1 DR) · immune to poison and mind-affecting · resistant to frost.`,
                ordered: true,
                items: [
                  `Puts itself between the party and the Tall One's sledge. It does not pursue anyone who retreats more than 30 feet from the sledge.`,
                  `Uses the crossbow at range and the blade in melee. It targets the PC who last damaged the Tall One, if any.`,
                  `If commanded with the rod, it powers down and is preserved. One success.`,
                ],
              },
              {
                id: 'sm:wake:card:warden',
                title: 'The Tall One (Grandfather)',
                statLine: `Dwarven Centurion · 300 HP (two 150 bars) · DR 8 · Hammer Arm 16 (Staggering) · Steam Breath 12 (cone, Standard Agility avoids) · immune to poison and mind-affecting · resistant to frost.`,
                ordered: true,
                items: [
                  `Starts in the sledge under canvas. End of round 1: the canvas tears; one arm unfolds. End of round 2: it stands and joins the fight next round. If it was folded in the vault, it stands at the end of round 3.`,
                  `While assembling, it cannot act or move. Attacks against it hit the crate and the construct; damage counts against its first bar. If reduced to 0 before assembly, it is destroyed.`,
                  `Once assembled, it attacks the nearest PC who damaged an exhibit. If none, it attacks the rod-bearer. If neither, the nearest PC.`,
                  `Steam Breath when two or more PCs are in a 15-foot cone; otherwise Hammer Arm.`,
                  `The rod needs two successes: first staggers, second shuts down. After its first bar, checks are Very Hard (-6).`,
                ],
                quote: `The tall one is not a machine. It is a held breath.`,
              },
              {
                id: 'sm:wake:card:calcelmo',
                title: 'Calcelmo',
                statLine: `10 HP · DR 0 · no attack.`,
                ordered: true,
                items: [
                  `Starts panicking. He will try to shield the Tall One with his body. If a PC attacks an exhibit, he screams and tries to grab their arm; this is roleplay, not a mechanical penalty.`,
                  `A PC can calm him with a Minor Action and a Standard Guile check. While calm and within 5 feet, he grants advantage on command checks.`,
                  `If a specimen is destroyed or he is hit, he panics again.`,
                  `If he reaches 0 HP, he is dying, not dead. Stabilize him with a Major Action and a Standard Guile check. The Three ignore him unless he touched the rod.`,
                ],
                quote: `If you must choose between my life and theirs, choose mine.`,
              },
              {
                id: 'sm:wake:card:pylon',
                title: 'The Weeping Stone',
                statLine: `Dwemer resonance pylon · 80 HP · DR 8 · no attack.`,
                ordered: false,
                items: [
                  `The pylon is the field anchor. The Three are tied to it. Destroying it shuts all three down at the end of the round — preserved, but the old road's field collapses.`,
                  `When it is destroyed, everyone within 20 feet takes 8 thunder damage, Standard Agility avoids. Calcelmo is horrified: the museum loses the site, not the specimens. He still pays if the Three survive.`,
                  `A Hard Magic check can disrupt it for one round instead: the Three lose their next actions, but the pylon is not destroyed. This is a delay, not a solution.`,
                ],
              },
              {
                id: 'sm:wake:card:helpers',
                title: 'Aicantar and Torr',
                statLine: `Aicantar 8 HP · Torr 12 HP · neither fights.`,
                ordered: false,
                items: [
                  `**Aicantar** holds the mule and drags one crate clear once. He can throw a lamp once: Standard Agility, 4 fire damage, no Burning.`,
                  `**Torr**, if he came, can help once: drag a crate clear, cut the mule loose, or hold a lantern steady for a command check (grant advantage on one check).`,
                  `Neither will abandon Calcelmo. If Calcelmo goes down, Aicantar runs to him; Torr covers the retreat as best he can.`,
                ],
              },
            ],
            triggers: [
              {
                id: 'sm:wake:trigger:destroyed',
                condition: 'A specimen is destroyed',
                blocks: [
                  {
                    kind: 'text',
                    text: `Update “Exhibits intact” on the status board and mark the specimen's 200-gold share of the balance lost. Calcelmo's reaction depends on which one: the Small One — he drops to his knees and says “Tick. Tick, no.” The Round One — he makes a sound like he has been hit and says, “The only one with its original bow.” The Tall One — he goes silent for a full round, then says, “Grandfather.”`,
                  },
                  {
                    kind: 'text',
                    text: `He does not stop fighting for his life. He stops fighting for the party's payment. The contract is the contract. If they saved his life, he will thank them later; he will not thank them now.`,
                  },
                ],
              },
              {
                id: 'sm:wake:trigger:calcelmo-down',
                condition: 'Calcelmo reaches 0 HP',
                blocks: [
                  {
                    kind: 'readAloud',
                    tone: 'danger',
                    paragraphs: [
                      `Calcelmo goes down between the crates. The ledger falls out of his robe and opens in the road. Aicantar screams and runs to him, and the mule bolts.`,
                    ],
                  },
                  {
                    kind: 'text',
                    text: `He is dying, not dead. A PC can stabilize him with a Major Action and a Standard Guile check. If nobody reaches him before the end of the next round, he dies. The Three ignore him; the rod is what they want. If he dies, the museum collapses as an institution and the ending changes.`,
                  },
                ],
              },
              {
                id: 'sm:wake:trigger:dormant',
                condition: 'All three specimens are dormant or destroyed',
                blocks: [
                  {
                    kind: 'readAloud',
                    paragraphs: [
                      `The pylon's hum fades by degrees. The road is quiet except for the wind and the mule, somewhere off in the heather. The Three are still — dark brass, or sleeping brass, or a scatter of parts on the stones.`,
                    ],
                  },
                  {
                    kind: 'text',
                    text: `The fight is over. Go to the payment scene. Count which specimens are restorable: dormant = preserved; destroyed = lost. Update “Exhibits intact.”`,
                  },
                ],
              },
            ],
            enemies: ['sleeping_spider', 'sleeping_sphere', 'sleeping_warden'],
          },
        },
        {
          id: 'sm:wake:4',
          kind: 'gmNote',
          tag: 'RUNNING THE THREE:',
          text: `The Three are not a coordinated squad; they are three old things waking in a road. The Small One hunts the rod. The Round One guards the Tall One's sledge. The Tall One assembles in public, one stage per round, and attacks whoever hurt it. Describe each stage of the assembly; the party should feel the clock.`,
        },
        {
          id: 'sm:wake:5',
          kind: 'gmNote',
          tag: 'THE ROD IN PLAY:',
          text: `The rod-bearer can shut down the Small One and the Round One with one success each. The Tall One needs two. The command is a Major Action; the rod-bearer cannot also attack that turn. Calming Calcelmo costs a Minor Action, which means the party must choose between a clean command and a safe one. If they studied the rod or folded the Tall One in the vault, the first command check has advantage. Mark all of this before initiative.`,
        },
        {
          id: 'sm:wake:6',
          kind: 'gmNote',
          tag: 'IF THEY FLEE:',
          text: `The Three do not pursue beyond the pylon. They stand in the road and watch. The party can reach Markarth; Calcelmo either escapes with them or does not. Use the “fled” ending. This is a valid ending, not a fail state: they live, they keep the advance, and the museum loses its future.`,
        },
      ],
      enemies: [],
      exits: [
        {
          id: 'sm:exit:wake',
          description: 'The road is quiet. The ledger is not.',
          targetSceneId: 'sleeping-men:scene:payment',
          branchLabel: '07 — The Price of Brass',
        },
      ],
      tags: ['combat', 'climax', 'artifacts'],
      schemaVersion: 2,
    },
    {
      id: 'sleeping-men:scene:payment',
      moduleId: 'sleeping-men:module',
      title: '07 — The Price of Brass',
      subtitle: 'The road is quiet. The ledger is not.',
      type: 'character',
      kind: 'resolution',
      navNote: 'Payment and endings',
      blocks: [
        {
          id: 'sm:payment:1',
          kind: 'readAloud',
          paragraphs: [
            `The waystone's hum dies by degrees. The Small One lies on its side in the road, or stands dark in its crate, or is a scatter of brass and legs. The Round One is still. The Tall One is a mountain of brass under the canvas, or a ruined thing venting steam into the heather.`,
            `Calcelmo sits on the tailboard of the cart with the ledger open on his knees. His hands are shaking too badly to write. Aicantar takes the pen from him.`,
            `The wind comes down the pass. Somewhere below, the Karth goes on running.`,
          ],
        },
        {
          id: 'sm:payment:2',
          kind: 'gmNote',
          tag: 'THE LEDGER:',
          text: `Count the specimens that are restorable. Dormant by the rod or the pylon = preserved. Destroyed = lost. The advance is already paid and never refunded. Each lost specimen forfeits 200 gold per PC of the balance.`,
          items: [
            `**All three preserved:** 600 each (200 advance + 400 balance), plus 100 each if the danger bonus was negotiated. 1 AP each. The museum's favor is granted gladly.`,
            `**Two preserved:** 400 each (200 + 200). No bonus. 1 AP each. The museum's favor is granted grudgingly.`,
            `**One preserved:** 200 each (advance only). No balance. 1 AP each. The museum's favor is a formality.`,
            `**None preserved:** 200 each (advance only). No balance. 1 AP each for surviving the job, if they delivered the cart to Markarth. Calcelmo cannot pay more.`,
            `**They fled / Calcelmo died:** 200 each advance. No balance. No AP. If Calcelmo died and they did not deliver the cart, there is no museum payment at all.`,
            `**The pylon was destroyed but the Three survived:** full contract pay. The pylon is not a specimen. Calcelmo pays, then mourns the site for the rest of his life.`,
          ],
        },
        {
          id: 'sm:payment:3',
          kind: 'choices',
          variant: 'endings',
          prompt: 'How many of the Three came back restorable?',
          options: [
            {
              id: 'sm:payment:o1',
              label: 'A. All three preserved',
              heading: 'All three preserved',
              planned: true,
              source: 'the contract, fulfilled',
              blocks: [
                {
                  kind: 'readAloud',
                  paragraphs: [
                    `Calcelmo reads the ledger twice. Then he closes it and looks at the party as if he has never seen them before.`,
                  ],
                },
                {
                  kind: 'spoken',
                  speaker: 'CALCELMO',
                  direction: 'unsteady',
                  line: `You brought them back. All three. I did not think — I will pay the bonus. I said I would. I did not think I would have to.`,
                },
                {
                  kind: 'list',
                  title: 'PAYMENT',
                  items: [
                    `600 septims each (200 advance + 400 balance).`,
                    `Plus 100 each if the danger bonus was negotiated.`,
                    `1 AP each.`,
                    `The museum's favor: one free identification or appraisal, one loan from the restricted collection (a minor dwemer item of the GM's choice, returned after one adventure), and Calcelmo's testimony in Markarth.`,
                  ],
                },
                {
                  kind: 'text',
                  text: `The museum mounts a new exhibit: **The Three of Bthar-Zel.** The plaque names the party as the escort. Calcelmo's star rises at court; the Jarl's court grants him a larger budget. He complains about the paperwork. Aicantar frames the plaque.`,
                },
                {
                  kind: 'text',
                  text: `If they destroyed the Weeping Stone, add: the old road is quiet, the Forsworn leave offerings at the broken pylon, and Calcelmo mourns the site more than he will admit. The Three are safe. The vault will never be excavated.`,
                },
              ],
            },
            {
              id: 'sm:payment:o2',
              label: 'B. Two preserved',
              heading: 'Two preserved',
              planned: true,
              source: 'the contract, reduced',
              blocks: [
                {
                  kind: 'readAloud',
                  paragraphs: [
                    `Calcelmo turns the ledger around so the party can see the column. He does not make them count it themselves.`,
                  ],
                },
                {
                  kind: 'spoken',
                  speaker: 'CALCELMO',
                  direction: 'flat',
                  line: `Which one? ... You will be paid for the other two. I am sorry. That is not enough. I know.`,
                },
                {
                  kind: 'list',
                  title: 'PAYMENT',
                  items: [
                    `400 septims each (200 advance + 200 balance).`,
                    `No danger bonus.`,
                    `1 AP each.`,
                    `The museum's favor, grudgingly: one appraisal and a small loan, if the party asks.`,
                  ],
                },
                {
                  kind: 'text',
                  text: `The exhibit opens with a blank plinth where the lost specimen should be. Calcelmo keeps his office but not his influence. Aicantar does most of the work now. The Jarl's court has questions. The party is welcome at the museum; the welcome is thinner than it was.`,
                },
              ],
            },
            {
              id: 'sm:payment:o3',
              label: 'C. One preserved',
              heading: 'One preserved',
              planned: true,
              source: 'the contract, nearly void',
              blocks: [
                {
                  kind: 'readAloud',
                  paragraphs: [
                    `Calcelmo counts the crates twice and still gets the number wrong. Aicantar counts them for him. The ledger stays open on the tailboard.`,
                  ],
                },
                {
                  kind: 'spoken',
                  speaker: 'CALCELMO',
                  direction: 'very quiet',
                  line: `I cannot pay the balance. I am not refusing. There is no balance. The advance was the museum's. The rest was going to be — Aicantar will count what is left.`,
                },
                {
                  kind: 'list',
                  title: 'PAYMENT',
                  items: [
                    `200 septims each (advance only). No balance.`,
                    `No danger bonus.`,
                    `1 AP each, if they delivered the cart to Markarth.`,
                    `The museum's favor is a formality: one appraisal, nothing more.`,
                  ],
                },
                {
                  kind: 'text',
                  text: `The exhibit is one plinth and a great deal of empty floor. Calcelmo keeps his office by a vote of the board. Aicantar is appointed assistant curator with a salary the museum cannot really afford. Calcelmo does not blame the party in public. In private, he blames himself, and he is right.`,
                },
              ],
            },
            {
              id: 'sm:payment:o4',
              label: 'D. None preserved',
              heading: 'None preserved',
              planned: true,
              source: 'the contract, void',
              blocks: [
                {
                  kind: 'readAloud',
                  paragraphs: [
                    `Calcelmo sits in the road with the empty ledger open on his knees. The wind turns the pages. He does not stop it.`,
                  ],
                },
                {
                  kind: 'spoken',
                  speaker: 'CALCELMO',
                  direction: 'without looking up',
                  line: `You saved my life. I asked you to choose between my life and theirs. You chose mine. I should be grateful. I am not.`,
                },
                {
                  kind: 'list',
                  title: 'PAYMENT',
                  items: [
                    `200 septims each (advance only). No balance.`,
                    `1 AP each, if they delivered the cart to Markarth.`,
                    `No museum favor. There is no museum left to grant one.`,
                  ],
                },
                {
                  kind: 'text',
                  text: `The museum closes for “restoration.” The Jarl's court seizes the collection to cover the debt. Aicantar is appointed acting curator of a locked building. Calcelmo retires to a small room in Understone Keep and does not attend the hearing. The party is not banned from Markarth. They are simply not spoken to.`,
                },
              ],
            },
            {
              id: 'sm:payment:o5',
              label: 'E. They fled, or Calcelmo died',
              heading: 'They fled, or Calcelmo died',
              planned: false,
              source: 'improvised',
              blocks: [
                {
                  kind: 'readAloud',
                  paragraphs: [
                    `Markarth is the same city it was when they left: grey stone, falling water, the keep at the top of the hill. The museum is not the same. The door is closed. There is no sign in the window yet.`,
                  ],
                },
                {
                  kind: 'spoken',
                  speaker: 'AICANTAR',
                  direction: 'at the museum door, if he survived',
                  line: `He is not seeing anyone. I am sorry. I do not know what else to tell you.`,
                },
                {
                  kind: 'list',
                  title: 'PAYMENT',
                  items: [
                    `200 septims each, the advance. No balance.`,
                    `No AP. The job was not seen through.`,
                    `No museum favor.`,
                  ],
                },
                {
                  kind: 'text',
                  text: `If Calcelmo died, Aicantar pays what he can from the museum's petty cash and asks the party to leave before the Jarl's court starts asking questions. The Three are still out there, dormant or destroyed, and the old road is quiet. That is its own ending.`,
                },
              ],
            },
          ],
        },
        {
          id: 'sm:payment:4',
          kind: 'list',
          title: 'SEEDS FOR AFTER THE ONE-SHOT',
          items: [
            `If Varn survived, the Forsworn remember the party. A future adventure can revisit the Sleeping Men, the Weeping Stone, or the Reach's claim to both.`,
            `If the Tall One survived, Calcelmo displays it in the museum. The party can visit it. It watches them.`,
            `If the pylon was destroyed, the old road's field is gone. The Forsworn leave offerings at the broken stone; the museum's future excavations are finished.`,
            `If the museum was ruined, Aicantar becomes the party's contact in Markarth: a curator with no collection and a long memory.`,
            `The Quieting Rod remains museum property. If the party kept it, Calcelmo will ask for it back. That conversation can be a whole scene.`,
          ],
        },
      ],
      enemies: [],
      exits: [
        {
          id: 'sm:exit:payment',
          description: 'The contract, the statblocks, and the road rules.',
          targetSceneId: 'sleeping-men:scene:appendix',
          branchLabel: '08 — Appendix',
        },
      ],
      tags: ['ending', 'payment'],
      schemaVersion: 2,
    },
    {
      id: 'sleeping-men:scene:appendix',
      moduleId: 'sleeping-men:module',
      title: '08 — Appendix: the contract, the Three, and the road',
      subtitle: 'Everything the GM needs to run the one-shot without flipping back',
      type: 'interlude',
      kind: 'scene',
      navNote: 'Reference',
      blocks: [
        {
          id: 'sm:appendix:1',
          kind: 'readAloud',
          paragraphs: [
            `Pell's journal, last page: “Day 10. Nessa says the small one twitched. I heard the tall one take a breath. Brass does not breathe. We are going to be rich.”`,
          ],
        },
        {
          id: 'sm:appendix:2',
          kind: 'gmNote',
          tag: 'WHAT THIS IS:',
          text: `Reference material, not a scene. The contract, the Three, the Forsworn, the rod, and the scaling rules are repeated here so the GM does not have to flip back during the climax.`,
        },
        {
          id: 'sm:appendix:3',
          kind: 'handout',
          title: 'Contract of the Dwemer Museum',
          text: `BY ORDER OF THE DWEMER MUSEUM, UNDERSTONE KEEP, MARKARTH.\n\nThe bearers agree to escort Curator Calcelmo and the recovered property of the Museum to the waystation of Bthar-Zel and return.\n\nAdvance: 200 septims each, on signing.\nBalance: 400 septims each, on delivery of all three specimens in restorable condition.\n\nThe specimens are the property of the Museum. They are not to be struck, dropped, pried open, or exposed to flame, frost, shock, or loud incantation. If a specimen is destroyed or damaged beyond restoration, the balance for that specimen is forfeit. The advance is not refundable.\n\nSigned: Calcelmo, Curator; Aicantar, Witness; the bearers.`,
        },
        {
          id: 'sm:appendix:4',
          kind: 'card',
          title: 'The Three — statblocks',
          open: true,
          items: [
            `**The Small One (Tick)** — Dwarven Spider. 40 HP, DR 4. Stats 15/13/11/8. Shock Bolt 8 (drains 2 FP). Immune to poison and mind-affecting; resistant to frost. Self-destructs at 0 HP: 6 shock damage within 5 feet, Standard Agility avoids. Hunts the rod. One command success shuts it down.`,
            `**The Round One (Orbit)** — Dwarven Sphere. 113 HP, DR 6. Stats 16/14/11/8. Blade 12; Integrated Crossbow 12 (ignores 1 DR). Immune to poison and mind-affecting; resistant to frost. Guards the Tall One's sledge; does not pursue beyond 30 feet of it. One command success shuts it down.`,
            `**The Tall One (Grandfather)** — Dwarven Centurion. 300 HP (two 150 bars), DR 8. Stats 17/15/11/8. Hammer Arm 16 (Staggering); Steam Breath 12 (cone, Standard Agility avoids). Immune to poison and mind-affecting; resistant to frost. Assembles at the end of round 2 (round 3 if folded in the vault). Two command successes: first staggers, second shuts down. After the first bar, commands are Very Hard (-6).`,
          ],
          note: `The Three are the museum specimens and the climax enemies at once. Their HP is the line between “restorable” and “destroyed.” Destroying one is a legitimate choice with a real cost.`,
        },
        {
          id: 'sm:appendix:5',
          kind: 'card',
          title: 'Varn and the Forsworn — statblocks',
          open: false,
          items: [
            `**Varn the Briar-Sworn** — 113 HP, DR 6. Stats 16/14/11/8. Forsworn Sword 12; Firebolt 6 + Burning 2 for 2 turns (3 FP); Oakflesh +2 DR (3 FP). Briarheart: a called shot to the chest (Very Hard) or a fire critical destroys the heart and drops him. He parleys once; he will not let the rod pass.`,
            `**Forsworn Reaver** — 40 HP, DR 4. Stats 15/13/11/8. Forsworn Sword 8; Flames 4 + Burning 1 for 2 turns (1 FP). Three at the bridge: Uraccen and Mael on the rocks, Duach under the bridge. They break if Varn dies or two are down.`,
          ],
        },
        {
          id: 'sm:appendix:6',
          kind: 'card',
          title: 'The Quieting Rod — full rules',
          open: true,
          items: [
            `**Command:** Major Action. One construct within 30 feet. Roll Hard Magic (-4) or Hard Guile (-4) against your own stat. Success: it powers down and is preserved. Failure: it immediately attacks you as a reaction; if it cannot, the rod burns you for 8 damage and the Tall One advances one assembly stage.`,
            `**The Tall One:** two successes. First staggers (loses its next action); second shuts it down. After its first bar, checks are Very Hard (-6).`,
            `**Calcelmo's help:** if he is within 5 feet and calm, the command check has advantage. Calming him costs a Minor Action and a Standard Guile check. He panics again if a specimen is destroyed or he is hit.`,
            `**Called shot:** Very Hard Might or Agility, no HP damage; the target loses its next action. This is the non-destructive martial option.`,
            `**If the rod is lost:** the Weeping Stone (80 HP, DR 8) can be destroyed to shut all three down at the end of the round. Everyone within 20 feet takes 8 thunder damage, Standard Agility avoids. The Three are preserved; the site is lost.`,
            `**Improvised core pull:** after the Tall One's first bar is gone, a Very Hard Agility called shot adjacent to the core can pull it free. Success: the Tall One shuts down and is preserved. Failure: 10 damage to the attacker.`,
          ],
          note: `The rod is a key, not a weapon. It has no attack and cannot be used on anything except the Three.`,
        },
        {
          id: 'sm:appendix:7',
          kind: 'card',
          title: 'Calcelmo, Aicantar, and Torr',
          open: false,
          items: [
            `**Calcelmo** — Altmer curator, 10 HP, DR 0, no attack. Wants the Three preserved above his own life. Knows the road can wake them. Did not tell the party. Will pay what the contract says and not a septim more, not because he is stingy but because there is no more.`,
            `**Aicantar** — nephew and assistant, 8 HP, DR 0, no attack. Keeps the ledger. Knows the museum's finances and his uncle's fear. Can drag one crate clear or throw one lamp (4 fire, no Burning).`,
            `**Torr** — foreman, 12 HP, DR 0, no attack, broken leg. If brought, helps once: drag a crate clear, cut the mule loose, or grant advantage on one command check. If left, he stays at the camp with supplies.`,
          ],
        },
        {
          id: 'sm:appendix:8',
          kind: 'card',
          title: 'Scaling and table adjustments',
          open: false,
          items: [
            `**Four players:** remove one Forsworn reaver from the bridge and 50 HP from the Tall One's first bar. Leave everything else alone.`,
            `**Six players:** add one Forsworn reaver and 50 HP to the Tall One's first bar. Do not add a second boss; the fight is already about time, not attrition.`,
            `**Adept-tier party (8-9 AP):** use the Adept row from GM Guide/Reference tables: the Small One and the reavers 70 HP / 13 damage / DR 7; Varn 175 / 20 / DR 11; the Round One 175 / 20 / DR 11; the Tall One 540 / 26 / DR 14. The story, the rod, and the contract do not change.`,
            `**No rod:** if the party lost it at the bridge, the Weeping Stone is the only non-destructive path. Say so plainly when the Three wake: “The rod is gone. The stone is still humming.” Do not add a second rod.`,
            `**TPK risk:** the Three do not pursue beyond the pylon. If the party breaks and runs, they live. Calcelmo may not. Use the fled ending.`,
          ],
          note: `The appendix's Adept numbers are the canonical tier row, not a guess. If you change one, change the party's tier, not the fiction.`,
        },
        {
          id: 'sm:appendix:9',
          kind: 'list',
          title: 'PACING',
          ordered: true,
          items: [
            `Museum and hiring: 15 minutes. One offer, one objection, one signature.`,
            `Broken Bridge: 20-25 minutes. Three reavers and Varn; the parley is part of the fight.`,
            `Bthar-Zel and the Hall: 15-20 minutes. Torr, the plaque, the rod, loading.`,
            `Road back and the bargain: 10 minutes. The curator's speech is the centerpiece; give it room.`,
            `The Sleeping Men Wake: 25-35 minutes. The assembly clock and the rod decisions are the fight.`,
            `Payment and endings: 5-10 minutes. Let the ledger land.`,
            `**Total: 90-120 minutes.** For the fast end, skip the Torr choice and use only the three main cards in the wake.`,
          ],
        },
        {
          id: 'sm:appendix:10',
          kind: 'text',
          small: true,
          text: `Calibrated to the Apprentice tier (3-6 AP) of the Frogs 5 rules; the party is 5 AP (level 5). Enemy numbers use the TL1/TL2/TL3 Apprentice row from GM Guide/Reference tables. The tier bands and the Additive Multiplier Law are the authority for any table disagreement.`,
        },
      ],
      enemies: [],
      exits: [],
      tags: ['appendix', 'reference'],
      schemaVersion: 2,
    },
  ],
  schemaVersion: 2,
};

/* ------------------------------------------------------------------ *
 * Normalize the authored data: every SceneBlock needs an id, including
 * the blocks nested inside choice panels and combat trigger cards. The
 * top-level blocks carry readable ids already; this fills the rest with
 * stable-per-load ids so the Forge, findables and director state work.
 * ------------------------------------------------------------------ */

let autoId = 0;
function nextAutoId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  autoId += 1;
  return `sm:auto:${autoId}`;
}

function withBlockIds<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => withBlockIds(item)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.kind === 'string' && typeof record.id !== 'string') {
      record.id = nextAutoId();
    }
    for (const key of Object.keys(record)) {
      record[key] = withBlockIds(record[key]);
    }
  }
  return value;
}

function normalizeModule(raw: unknown): CampaignModule {
  const module = withBlockIds(raw) as CampaignModule;
  module.schemaVersion = 2;
  module.scenes = module.scenes.map((scene) => ({
    ...scene,
    moduleId: module.id,
    schemaVersion: 2,
  }));
  return module;
}

export const SLEEPING_MEN_MODULE: CampaignModule = normalizeModule(RAW_SLEEPING_MEN_MODULE);
