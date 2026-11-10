// GENERATED FILE — do not hand-edit.
// Sources: Frogs-5-skyrim/oneshots/WHAT_THE_GIANTS_GUARD_MODULE.txt (TABLE EDITION, scenes 00-07)
//          Frogs-5-skyrim/oneshots/WHAT_THE_GIANTS_GUARD_CONTINUATION.txt (scenes 08-21)
// Regenerate: node scripts/build-giants-module.cjs
import type { CampaignModule } from '@/types/campaign';
// Hand-added bundled adventure: authored as a CampaignModule rather than
// generated from a runsheet text file. See data/sleepingMenModule.ts.
import { SLEEPING_MEN_MODULE } from './sleepingMenModule';

export const BUNDLED_MODULES: CampaignModule[] = [
  SLEEPING_MEN_MODULE,
  {
    "id": "wtgg:module",
    "name": "What the Giants Guard",
    "description": "Hearthfeld's guardian has been robbed and the field cannot be cut. A steward's contract, six missing mercenaries, and two sacks of grave-goods.",
    "badge": "One-shot · Adept · 5 PCs",
    "navTitle": "WHAT THE GIANTS GUARD",
    "tierTables": [],
    "sourcePath": "Frogs-5-skyrim/oneshots/WHAT_THE_GIANTS_GUARD_MODULE.txt",
    "scenes": [
      {
        "id": "wtgg:scene:start",
        "moduleId": "wtgg:module",
        "title": "00 -- Run the night",
        "subtitle": "Setup, GM truth, and pacing",
        "type": "set-piece",
        "kind": "scene",
        "blocks": [
          {
            "id": "wtgg:start:b1",
            "kind": "gmNote",
            "text": "New characters: 8 AP, Adept. Keep the existing backup characters and ordinary equipment. Every episode starts short of disposable money by the GM's anthology ruling; this is an openly stated episode reset, not an invented fine. No long-term bank ledger or faction-management campaign is needed."
          },
          {
            "id": "wtgg:start:b2",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**FIVE-PLAYER PRESET -- 2026-10-12 / new balancing prep**\nGuardian: two 300 HP bars, 600 total (source: two 270, 540 total). Hrodulf: 200 HP (source: 175), split offer at 66 or below. All damage, DR, stats, difficulties, four diggers, and two possible freed combat allies remain unchanged. No extra enemy or turn. These durability adjustments preserve the easier camp encounter.\nGrief-Quake still follows every second PC turn, carrying across rounds: five PC turns produce two triggers and one carried turn, then three triggers next round. NPC turns never count. Do not add a separate end-of-round quake.\nTonight's five shares: 1,000 advance, 1,000 completion, 4,000 robber coin including the 300 purse and 3,700 chest. Full recovery totals 6,000 party / 1,200 per PC. NPCs take no PC shares.\nThe console preserves saved combat and notes. For a fresh session use Reset combat (notes remain). Existing in-progress saves keep their actual HP until manually corrected; do not reset a played fight merely to adopt this preset."
          },
          {
            "id": "wtgg:start:b3",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**RUN ORDER**\nWhiterun introduction 15-20 minutes -> actual smoke break -> ten-day inquiry and several weeks of odd jobs -> steward 10 minutes -> farm 20 minutes -> ridge 20 minutes -> pines 25 minutes -> fight 25-35 minutes -> aftermath 15 minutes.\nAllow 2-3 hours after the break; choosing the giant boss adds 20-30 minutes. Both fights remain possible. Cut repeated travel narration, never the players' decisions or an encounter's earned consequences."
          },
          {
            "id": "wtgg:start:b4",
            "kind": "gmNote",
            "text": "Established history supplied by the GM: the B-team spared the impersonators, traveled under their writ, and directed the Thalmor to the Sleeping Giant. Delphine was captured; the Thalmor allowed passage to catch her, rather than being fooled. Whiterun's court knows only what it witnesses, receives in a report, or hears in testimony. Do not reveal Delphine's capture through omniscient court dialogue."
          },
          {
            "id": "wtgg:start:b5",
            "kind": "gmNote",
            "text": "The old module names the impostor company the Crimson Blades; the GM also calls them the Crimson Lanterns. Same crew here. The B-team's own company name belongs to the players. This adventure's title is What the Giants Guard; the Whiterun hearing is its introduction."
          },
          {
            "id": "wtgg:start:b6",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**COMPLETE INCIDENT -- GM ONLY / new connective design**\nFour nights before the summons: Hrodulf and four diggers open three giant graves, empty two, and are interrupted at the third. They run across Sela's barley with their sacks; two giants chase them through the field. One giant subsequently leaves west with the mammoths. Sela witnesses that departure; the other returns to guard the ridge. There is ONE present giant encounter, never a second giant reinforcement.\nTuesday: six Gray Anvils camp beside the farm. The robbers raid at night. Torsten, Runa, and Eydis surrender; Bersi, Hakon, and Leif escape toward the river. Eydis twists her ankle crossing the ridge and is supported/dragged. All three captives sort burial goods in the pine camp. The three escapees are in the company's fallback shepherd hut, one mile downstream. Nobody is secretly dead.\nThe guardian searches the field at dusk for the missing goods until they are restored, it is killed, or the party establishes another effective settlement. It remains on the ridge during the pine encounter. Harvesting resumes only after the threat is settled, not merely after a rescue."
          },
          {
            "id": "wtgg:start:b7",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**HARVEST PRESSURE -- CONTINUED TRAMPLING, NOT CROP EXPIRY**\nThe barley is ready to cut. Each unsettled evening search can crush another strip of standing crop where the giant actually walks. Show its route and fresh damage at the farm; repeated passage over already crushed ground does not destroy fresh acreage. Do not roll an unseen percentage loss or declare the whole harvest ruined after a fixed number of days. Sela keeps her sons out while the giant continues entering the field.\nOnce access is secured, cutting and gathering the remaining crop takes roughly three working days with Sela's usual harvest help (new local preparation). A peaceful arrangement must cover that work, not merely one safe visit. Ordinary rest is allowed; an evening incursion matters only if the threat remains unsettled. Earlier crop losses do not reduce the agreed completion pay. Stop incursions sooner to preserve more winter food, not to beat an arbitrary expiry timer."
          },
          {
            "id": "wtgg:start:b8",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**COMMON FROGS 5 ROLLS**\nRoll d20 against the character's OWN stat plus difficulty. Very Easy +4; Easy +2; Standard 0; Hard -4; Very Hard -6; Nearly Impossible -8; Impossible -14; Mythic -20.\nNatural 1: critical success. Under modified TN: success. Exactly modified TN: success with a complication. Over: failure. Natural 20: catastrophe, even with TN 20+. Advantage keeps lower of two; disadvantage keeps higher. A resistance roll equal to modified TN still resists; any complication must preserve that successful resistance.\nOpposed skill checks: each tests own stat; only one succeeds -> that side wins; both succeed -> lower die wins. For exact ties, reroll both (local tie ruling). Both fail -> neither gains the contested result; current position holds."
          },
          {
            "id": "wtgg:start:b9",
            "kind": "gmNote",
            "text": "Discovery never means dictating a PC's conclusion. Give the object, tracks, or testimony. Essential routes remain visible after failed examinations. All exact inventories, identities, local court dates, and movement/rescue rulings introduced for this edition are listed in the appendix."
          }
        ],
        "enemies": [],
        "exits": [
          {
            "id": "wtgg:exit:start:1",
            "description": "Begin",
            "targetSceneId": "wtgg:scene:arrival",
            "branchLabel": "01 -- Seeking hospitality"
          },
          {
            "id": "wtgg:exit:start:2",
            "description": "If the court opening has already been played, use without replaying established testimony",
            "targetSceneId": "wtgg:scene:break",
            "branchLabel": "04 -- Work under their own names"
          }
        ],
        "tags": [
          "start"
        ],
        "schemaVersion": 2
      },
      {
        "id": "wtgg:scene:arrival",
        "moduleId": "wtgg:module",
        "title": "01 -- Seeking hospitality",
        "subtitle": "Let the B-team intervene before the false introduction",
        "type": "set-piece",
        "kind": "scene",
        "blocks": [
          {
            "id": "wtgg:arrival:b1",
            "kind": "gmNote",
            "text": "Start here, before the inquiry or time skip. Read the recap as past events, then the Whiterun approach. Give a new PC a place beside the company and let their player introduce them; do not assign them involvement in earlier adventures. The B-team's name belongs to the players. The Crimson Lanterns below are the same impostor crew called the Crimson Blades in the original module."
          },
          {
            "id": "wtgg:arrival:b2",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**CRIMSON LANTERNS -- RACE AND DELIVERY NOTES / GM ONLY**\nIngrid the Loud: Nord woman, impersonating Davinia. Her attempted Cyrodiilic accent is a delivery choice; all written dialogue uses ordinary spelling.\nHadring the Slow: Nord man, impersonating Orion; carries the Dwarven shield.\nYsolda the Opportunist: Nord woman, impersonating Danica; wears priestess robes and the wooden holy symbol.\nAnariel the Fleet-Footed: Bosmer woman, impersonating Saijah; dark leather and black cloak.\nFaryl Atheron: Dunmer man, impersonating Alfonso; singed robes and a crystal tied to a walking stick.\nThe crew's Khajiit brawler: impersonating Kyboh; fur armor and cheap jewelry. Original prose calls him Ma'dran, while its combat block uses Garff'ebo; retain whatever name was actually used at the table rather than inventing a correction.\nRace notes guide the GM's delivery. Do not read these notes or phonetic spellings to the players."
          },
          {
            "id": "wtgg:arrival:b3",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "RECAP -- established previous B-team play. Read before the new scene; these choices have already happened. Delphine's capture and the Thalmor's real reason for allowing passage remain GM-only unless learned in play."
          },
          {
            "id": "wtgg:arrival:b4",
            "kind": "readAloud",
            "paragraphs": [
              "In Falkreath, you completed the mission. At the banquet, mentioning Valerius and the Obsidian Lanterns brought the Mistwalker onto your side. Then you headed for Riverwood, where a Thalmor checkpoint blocked the road north.",
              "At the Sleeping Giant Inn, you found the Crimson Lanterns using the Obsidian Lanterns' names. Delphine offered her help if you got rid of them. You found their hidden stash and ambushed them, then spared them and agreed to travel together under their writ.",
              "You also directed the Thalmor to investigate the Sleeping Giant. The checkpoint let your company through. Now the road has brought you to Whiterun, still traveling beside the people who carry those borrowed names and papers.",
              "Whiterun rises ahead above the surrounding fields. Its walls climb the hill, and Dragonsreach's great timber roof stands above the city. The Crimson Lanterns approach the gate alongside you. Ingrid's scroll case hangs against her steel breastplate; Hadring carries the Dwarven shield, and Ysolda walks in her priestess's robes."
            ]
          },
          {
            "id": "wtgg:arrival:b5",
            "kind": "stop",
            "text": "Allow the new character's introduction and any action on arrival. If the company continues into Whiterun, read the city walk below. Do not assign the new PC a history they have not chosen."
          },
          {
            "id": "wtgg:arrival:b6",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "The PCs enter Whiterun with the Crimson Lanterns. If they separate here, use the report-first/separate branch below instead."
          },
          {
            "id": "wtgg:arrival:b7",
            "kind": "readAloud",
            "paragraphs": [
              "Inside the walls, the street climbs between timber houses toward the market. Traders call from their stalls. Beyond them, stone steps lead farther uphill toward Dragonsreach. Ingrid stops and looks up at the hall, then pushes her helmet back from her eyes."
            ]
          },
          {
            "id": "wtgg:arrival:b8",
            "kind": "spoken",
            "speaker": "INGRID",
            "line": "Let's go to Dragonsreach. The Jarl will have rooms. Proper rooms. We have the papers."
          },
          {
            "id": "wtgg:arrival:b9",
            "kind": "stop",
            "text": "The Crimson Lanterns propose going to the Jarl; the PCs decide whether to accompany them, warn them, separate, or report first. If they agree to the approach, read the stairs passage below. Otherwise use their chosen branch."
          },
          {
            "id": "wtgg:arrival:b10",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "The party approaches Dragonsreach with the Crimson Lanterns after the decision above."
          },
          {
            "id": "wtgg:arrival:b11",
            "kind": "readAloud",
            "paragraphs": [
              "At the foot of Whiterun's long stairs, the Crimson Lanterns gather around Ingrid and her scroll case. She points toward the Jarl's hall.",
              "She wears a steel breastplate and an officer's helmet that sits low over her eyes. She pushes it back. Hadring stands beside her in patched hide, gripping his Dwarven shield. Ysolda carries a wooden holy symbol over her priestess's robes. The scroll case knocks against Ingrid's breastplate as she starts toward the stairs."
            ]
          },
          {
            "id": "wtgg:arrival:b12",
            "kind": "spoken",
            "speaker": "INGRID",
            "line": "Come on."
          },
          {
            "id": "wtgg:arrival:b13",
            "kind": "stop",
            "text": "What do you do? Allow introductions, questions, warnings, or a separate approach. Do not move the PCs into the hall until they choose to go."
          },
          {
            "id": "wtgg:arrival:b14",
            "kind": "gmNote",
            "text": "Give the players the floor. They may accompany, warn, separate, report first, or convince the crew to use their own names. Do not narrate them following Ingrid."
          },
          {
            "id": "wtgg:arrival:b15",
            "kind": "branch",
            "title": "They warn that Balgruuf knows the real Lanterns",
            "tone": "neutral",
            "blocks": [
              {
                "id": "wtgg:arrival:b16",
                "kind": "readAloud",
                "paragraphs": [
                  "Ingrid stops on the stairs and taps the scroll case. Ysolda steps closer to the person who warned her."
                ]
              },
              {
                "id": "wtgg:arrival:b17",
                "kind": "spoken",
                "speaker": "INGRID",
                "line": "The soldiers let us through. We have the papers."
              },
              {
                "id": "wtgg:arrival:b18",
                "kind": "spoken",
                "speaker": "YSOLDA",
                "line": "What does he know? Their names, or their faces?"
              },
              {
                "id": "wtgg:arrival:b19",
                "kind": "stop",
                "text": "Let the PC give the actual warning before resolving persuasion.\nCredible firsthand information convinces Ysolda to abandon the false claim. For uncertain persuasion, Standard Guile (0); equal TN succeeds but she wants the PCs beside her at the audience; failure leaves Ingrid intent on claiming hospitality; natural 20 produces a loud argument, not unavoidable combat.\nIf persuaded, Ysolda presents the writ for examination instead of privileges: \"We need these papers checked.\" Irileth takes it. The inquiry still addresses their earlier use; prevention of today's lie counts as cooperation."
              }
            ]
          },
          {
            "id": "wtgg:arrival:b20",
            "kind": "branch",
            "title": "They report first or separate from the crew",
            "tone": "neutral",
            "blocks": [
              {
                "id": "wtgg:arrival:b21",
                "kind": "readAloud",
                "paragraphs": [
                  "Irileth takes your account at Dragonsreach. She looks toward the hall doors, then back to you."
                ]
              },
              {
                "id": "wtgg:arrival:b22",
                "kind": "spoken",
                "speaker": "IRILETH",
                "direction": "to reporters",
                "line": "Where are they staying? Who is carrying the writ?"
              },
              {
                "id": "wtgg:arrival:b23",
                "kind": "stop",
                "text": "Take the report. The court can act on the location and document holder they actually name.\nIf the PCs separate, a guard later asks them to attend as named traveling companions: \"The Jarl needs your account of the people you came here with.\"\nReporting counts as cooperation. Association alone proves no crime. The writ is retained once presented or recovered; no peaceful branch returns its travel privileges."
              }
            ]
          }
        ],
        "enemies": [],
        "exits": [
          {
            "id": "wtgg:exit:arrival:1",
            "description": "public claim if uninterrupted; ordinary inquiry if prevented.",
            "targetSceneId": "wtgg:scene:hearing",
            "branchLabel": "02 -- The audience"
          }
        ],
        "tags": [
          "arrival"
        ],
        "schemaVersion": 2
      },
      {
        "id": "wtgg:scene:hearing",
        "moduleId": "wtgg:module",
        "title": "02 -- The audience",
        "subtitle": "Recognition, custody, and individual testimony",
        "type": "set-piece",
        "kind": "scene",
        "blocks": [
          {
            "id": "wtgg:hearing:b1",
            "kind": "gmNote",
            "text": "Read the hall arrival after PCs enter. Then choose ONE introduction below. If the PCs came ahead of the crew, use the report-first branch; never conjure Ingrid into their audience."
          },
          {
            "id": "wtgg:hearing:b2",
            "kind": "readAloud",
            "paragraphs": [
              "Dragonsreach's hall opens around the steps to Balgruuf's throne. Irileth stands beside him. Four guards watch the hall: two by the doors, two beside the throne steps. Balgruuf looks from the document's holder to the people waiting before him."
            ]
          },
          {
            "id": "wtgg:hearing:b3",
            "kind": "branch",
            "title": "Ingrid makes the false claim -- use only if she was not stopped",
            "tone": "gold",
            "blocks": [
              {
                "id": "wtgg:hearing:b4",
                "kind": "readAloud",
                "paragraphs": [
                  "Ingrid draws the writ from its case and holds it out. Hadring grips his shield behind her."
                ]
              },
              {
                "id": "wtgg:hearing:b5",
                "kind": "spoken",
                "speaker": "INGRID",
                "line": "Davinia. Obsidian Lanterns. We request lodging for our company."
              },
              {
                "id": "wtgg:hearing:b6",
                "kind": "stop",
                "text": "Allow a PC interruption here. If they interrupt, take their account before continuing; Balgruuf's recognition still stands."
              },
              {
                "id": "wtgg:hearing:b7",
                "kind": "spoken",
                "speaker": "BALGRUUF",
                "line": "Davinia has stood before me. So have her companions. Irileth, take the document."
              },
              {
                "id": "wtgg:hearing:b8",
                "kind": "spoken",
                "speaker": "IRILETH",
                "line": "Hand it here."
              },
              {
                "id": "wtgg:hearing:b9",
                "kind": "stop",
                "text": "Does the holder hand over the writ? Resolve refusal or violence before narrating custody."
              }
            ]
          },
          {
            "id": "wtgg:hearing:b10",
            "kind": "branch",
            "title": "The false introduction was prevented -- ordinary inquiry",
            "tone": "neutral",
            "blocks": [
              {
                "id": "wtgg:hearing:b11",
                "kind": "readAloud",
                "paragraphs": [
                  "Ysolda holds the writ out for examination beside Ingrid. Irileth extends her hand for it."
                ]
              },
              {
                "id": "wtgg:hearing:b12",
                "kind": "spoken",
                "speaker": "YSOLDA",
                "line": "We need these papers checked."
              },
              {
                "id": "wtgg:hearing:b13",
                "kind": "spoken",
                "speaker": "IRILETH",
                "line": "Hand it here."
              },
              {
                "id": "wtgg:hearing:b14",
                "kind": "stop",
                "text": "Resolve the handover. Prevention of today's claim counts as cooperation; the earlier use still requires an account."
              }
            ]
          },
          {
            "id": "wtgg:hearing:b15",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "The document is in court custody and the PCs are available to answer. If they reported first, ask this after hearing their initial report."
          },
          {
            "id": "wtgg:hearing:b16",
            "kind": "readAloud",
            "paragraphs": [
              "Balgruuf turns from the writ to you. Irileth takes up a sheet for the names."
            ]
          },
          {
            "id": "wtgg:hearing:b17",
            "kind": "spoken",
            "speaker": "BALGRUUF",
            "line": "Give me your names. Then tell me how you came to travel with them."
          },
          {
            "id": "wtgg:hearing:b18",
            "kind": "stop",
            "text": "Take each character's name and account separately. Use the follow-up questions below only for gaps in what they say."
          },
          {
            "id": "wtgg:hearing:b19",
            "kind": "gmNote",
            "text": "Stop for their answers. Balgruuf's personal recognition needs no roll. Irileth retains the paper and directs guards to hold the impersonators for questioning. Treat each PC separately. Hirt's presence establishes no confession or complicity."
          },
          {
            "id": "wtgg:hearing:b20",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**FOLLOW-UP QUESTIONS -- ask only what their testimony leaves open**"
          },
          {
            "id": "wtgg:hearing:b21",
            "kind": "spoken",
            "speaker": "IRILETH",
            "line": "Where did you meet them?"
          },
          {
            "id": "wtgg:hearing:b22",
            "kind": "spoken",
            "speaker": "IRILETH",
            "line": "Who showed you these papers?"
          },
          {
            "id": "wtgg:hearing:b23",
            "kind": "spoken",
            "speaker": "IRILETH",
            "line": "What did you use them to obtain?"
          },
          {
            "id": "wtgg:hearing:b24",
            "kind": "spoken",
            "speaker": "IRILETH",
            "line": "When did you learn whose names they were using?"
          },
          {
            "id": "wtgg:hearing:b25",
            "kind": "spoken",
            "speaker": "IRILETH",
            "line": "What happened at the bridge?"
          },
          {
            "id": "wtgg:hearing:b26",
            "kind": "gmNote",
            "text": "Record exact disputed claims in the notes box. Riverwood thefts and earlier agreements require testimony or evidence, not the old module's planned outcomes."
          },
          {
            "id": "wtgg:hearing:b27",
            "kind": "branch",
            "title": "They claim the Thalmor authenticated the writ",
            "tone": "blue",
            "blocks": [
              {
                "id": "wtgg:hearing:b28",
                "kind": "gmNote",
                "text": "Balgruuf holds out his hand for the page."
              },
              {
                "id": "wtgg:hearing:b29",
                "kind": "spoken",
                "speaker": "BALGRUUF",
                "line": "I'll have this checked. Tell Irileth exactly what they said."
              },
              {
                "id": "wtgg:hearing:b30",
                "kind": "gmNote",
                "text": "He checks the claim without revealing why the checkpoint allowed passage. The writ stays in custody."
              }
            ]
          },
          {
            "id": "wtgg:hearing:b31",
            "kind": "branch",
            "title": "They admit using the crew or the writ",
            "tone": "red",
            "blocks": [
              {
                "id": "wtgg:hearing:b32",
                "kind": "spoken",
                "speaker": "IRILETH",
                "line": "Using them for what? What did you promise in return?"
              },
              {
                "id": "wtgg:hearing:b33",
                "kind": "spoken",
                "speaker": "BALGRUUF",
                "line": "Tell me what you claimed, and to whom."
              },
              {
                "id": "wtgg:hearing:b34",
                "kind": "gmNote",
                "text": "Evaluate admitted acts individually. Sharing a road, sparing enemies, and passing a checkpoint do not themselves establish extortion. Knowing use for a specific fraudulent benefit can establish complicity. Cooperation matters even when misconduct is admitted."
              }
            ]
          },
          {
            "id": "wtgg:hearing:b35",
            "kind": "branch",
            "title": "They lie",
            "tone": "neutral",
            "blocks": [
              {
                "id": "wtgg:hearing:b36",
                "kind": "gmNote",
                "text": "Hard Guile (-4), speaker's own TN, only if the claim is plausible and genuinely uncertain. Natural 1: credible pending verification. Clean success: accepted provisionally. Equal TN: accepted, with a named corroborating witness requested. Failure: IRILETH: \"Who can confirm that? Give me a name and a place.\"\nNatural 20: the speaker contradicts one specific statement already recorded; read both back and invite an explanation. It proves that inconsistency, not every unspoken secret. A failed roll never automatically sends everyone to jail."
              }
            ]
          },
          {
            "id": "wtgg:hearing:b37",
            "kind": "branch",
            "title": "They demand the writ, refuse questions, or seek early departure",
            "tone": "blue",
            "blocks": [
              {
                "id": "wtgg:hearing:b38",
                "kind": "spoken",
                "speaker": "IRILETH",
                "direction": "about the writ",
                "line": "It stays here while we examine it. You can give your account of where it came from."
              },
              {
                "id": "wtgg:hearing:b39",
                "kind": "spoken",
                "speaker": "IRILETH",
                "direction": "to silence",
                "line": "You can give your account now, or wait while we take theirs."
              },
              {
                "id": "wtgg:hearing:b40",
                "kind": "spoken",
                "speaker": "BALGRUUF",
                "direction": "about leaving",
                "line": "Stay in the city until Irileth has checked your account. Give her an address where the guards can find you."
              },
              {
                "id": "wtgg:hearing:b41",
                "kind": "gmNote",
                "text": "A receipt can name the holder, document, and Dragonsreach custody; it grants no privileges. Refusal alone proves no guilt. Credible reasons permit supervised travel or earlier review by Standard Guile (0); equality requires a named escort/contact. Failure leaves the ten-day review date. The adventure does not require the players to consent to imprisonment."
              }
            ]
          },
          {
            "id": "wtgg:hearing:b42",
            "kind": "branch",
            "title": "They question the Crimson crew",
            "tone": "blue",
            "blocks": [
              {
                "id": "wtgg:hearing:b43",
                "kind": "spoken",
                "speaker": "INGRID",
                "line": "It got us across the bridge. Ask them."
              },
              {
                "id": "wtgg:hearing:b44",
                "kind": "spoken",
                "speaker": "YSOLDA",
                "line": "We traveled together from Riverwood. Tell her what we agreed."
              },
              {
                "id": "wtgg:hearing:b45",
                "kind": "spoken",
                "speaker": "HADRING",
                "direction": "asked his name",
                "line": "Hadring. It's Hadring."
              },
              {
                "id": "wtgg:hearing:b46",
                "kind": "gmNote",
                "text": "Ysolda's allegations are testimony, not automatic truth. Use the players' actual account of their agreement; do not invent an incriminating promise."
              }
            ]
          },
          {
            "id": "wtgg:hearing:b47",
            "kind": "branch",
            "title": "They attack or flee -- off-script emergency procedure",
            "tone": "blue",
            "blocks": [
              {
                "id": "wtgg:hearing:b48",
                "kind": "spoken",
                "speaker": "IRILETH",
                "line": "Weapons down. Stay where you are."
              },
              {
                "id": "wtgg:hearing:b49",
                "kind": "gmNote",
                "text": "Pause the montage. Two guards block the hall doors 30 feet behind the audience; two stand beside the throne steps. PCs can surrender, fight, or retreat through the doors/stairs. No automatic capture. Other visitors move behind the throne pillars; nobody supplies a hostage by fiat.\nLocal contingency cards, not established character builds: four guards each M16/A14/Magic8/G12, HP70, DR7, FP0, melee13; Major sword strike, Minor move/brace (-2 next hit). Irileth M18/A17/Magic8/G16, HP250, DR14, FP0, melee30; Major sword strike, Minor move/brace. Roll initiative d20 low first. Attacks roll own Might, DR per hit; natural1 doubles damage. Guard pairs use Major opposed Might to restrain instead of damage when practical; target's Might or Agility contests, ties reroll. Restrained: movement0, Major opposed Might/Agility to break free. No bonus attacks or hidden reinforcements this scene.\nEpisode movement: one Minor reaches any location on the field (no distance cap), melee reach 5 feet. Leaving engagement allows free attack; Major Standard Might shove / Agility slip / Guile feint plus Minor movement avoids it on success. Guards and Irileth carry ordinary swords and shields for the listed strike/brace. Balgruuf remains behind the pillars rather than becoming an extra enemy. If PCs escape, the court episode ends as fugitives: no legal time skip or steward summons until they return and settle the new violence. Use #ending-withdraw for a concluded unsuccessful episode if they refuse that. This choice may replace the planned one-shot; never narrate over it."
              }
            ]
          }
        ],
        "enemies": [],
        "exits": [
          {
            "id": "wtgg:exit:hearing:1",
            "description": "Peaceful accounts",
            "targetSceneId": "wtgg:scene:ruling",
            "branchLabel": "03 -- The ruling"
          },
          {
            "id": "wtgg:exit:hearing:2",
            "description": "Active resistance -> resolve the contingency, then surrender/inquiry or unsuccessful departure"
          }
        ],
        "tags": [
          "hearing"
        ],
        "schemaVersion": 2
      },
      {
        "id": "wtgg:scene:ruling",
        "moduleId": "wtgg:module",
        "title": "03 -- The ruling",
        "subtitle": "Clear statuses before the break",
        "type": "set-piece",
        "kind": "scene",
        "blocks": [
          {
            "id": "wtgg:ruling:b1",
            "kind": "readAloud",
            "paragraphs": [
              "Irileth folds the writ and sets it beside Balgruuf's chair. She reads the names from her sheet, checking each against the people before her. A guard waits by the hall doors. Balgruuf gives his ruling."
            ]
          },
          {
            "id": "wtgg:ruling:b2",
            "kind": "branch",
            "title": "Truthful witnesses / cooperating travelers",
            "tone": "blue",
            "blocks": [
              {
                "id": "wtgg:ruling:b3",
                "kind": "readAloud",
                "paragraphs": [
                  "Irileth marks your names on the inquiry sheet and turns it so the guard can see them."
                ]
              },
              {
                "id": "wtgg:ruling:b4",
                "kind": "spoken",
                "speaker": "BALGRUUF",
                "line": "Give Irileth your lodging address. Stay available. You may take work in the city while she checks this."
              },
              {
                "id": "wtgg:ruling:b5",
                "kind": "spoken",
                "speaker": "IRILETH",
                "line": "Come back in ten days. If I need you sooner, a guard will find you."
              },
              {
                "id": "wtgg:ruling:b6",
                "kind": "stop",
                "text": "Take their lodging address and any objections. State which PCs this ruling covers before the break.\nFree within Whiterun. No automatic fine, gear seizure, or guilt by association. Proven earlier misconduct is considered separately."
              }
            ]
          },
          {
            "id": "wtgg:ruling:b7",
            "kind": "branch",
            "title": "Plausible account accepted but unverified",
            "tone": "blue",
            "blocks": [
              {
                "id": "wtgg:ruling:b8",
                "kind": "readAloud",
                "paragraphs": [
                  "Irileth writes the account beside your names and sets her quill down."
                ]
              },
              {
                "id": "wtgg:ruling:b9",
                "kind": "spoken",
                "speaker": "IRILETH",
                "line": "I've taken your account. Stay at the address you gave me. We'll check it against theirs. Return in ten days."
              },
              {
                "id": "wtgg:ruling:b10",
                "kind": "stop",
                "text": "Take their address and response. They can work in the city during the inquiry.\nSame work access and financial treatment as witnesses. Record the tested false claim. If contradictory evidence arrives, identify it and replay the hearing before applying a harsher outcome; do not secretly negate a successful roll."
              }
            ]
          },
          {
            "id": "wtgg:ruling:b11",
            "kind": "branch",
            "title": "Specific knowing complicity established",
            "tone": "red",
            "blocks": [
              {
                "id": "wtgg:ruling:b12",
                "kind": "readAloud",
                "paragraphs": [
                  "Irileth separates the implicated names onto another sheet. The guard by the doors steps forward."
                ]
              },
              {
                "id": "wtgg:ruling:b13",
                "kind": "spoken",
                "speaker": "BALGRUUF",
                "line": "Irileth will take your statement separately. You'll remain here until I've reviewed the losses and your part in them."
              },
              {
                "id": "wtgg:ruling:b14",
                "kind": "spoken",
                "speaker": "IRILETH",
                "line": "The first review is in two days. Give me the names of anyone who can support your account."
              },
              {
                "id": "wtgg:ruling:b15",
                "kind": "stop",
                "text": "They may name witnesses, object, or choose resistance. Resolve that before skipping time. This ruling applies only to specifically implicated PCs.\nTwo nights held for implicated characters; innocent companions stay free. At review, cooperation and resolved immediate evidence allow conditional release: \"You'll stay in Whiterun and report when called. Your belongings will be returned, apart from anything held as evidence.\"\nUse reporting conditions rather than an unaffordable bond. Restitution concerns a named, proven loss caused by that character; never bill the B-team for the Crimson crew's entire history. Unresolved player resistance stays on-screen; no forced montage."
              },
              {
                "id": "wtgg:ruling:b16",
                "kind": "spoken",
                "speaker": "IRILETH",
                "direction": "if asked about the Crimson crew",
                "line": "They'll answer for the names they used and the claims they made. Your statement will be taken separately."
              },
              {
                "id": "wtgg:ruling:b17",
                "kind": "gmNote",
                "text": "Their final sentence is beyond this short opening. Do not invent execution, Thalmor transfer, or a completed unseen trial."
              }
            ]
          },
          {
            "id": "wtgg:ruling:b18",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**BEFORE THE REAL SMOKE BREAK**\nState each PC's status, evidence held, two-day release if applicable, and ten-day review. Retain ordinary equipment. Explain the anthology reset openly: the inquiry and subsequent odd jobs leave cooperative PCs with 100 gold each; detained PCs with 25 each. These are this edition's episode-start allowances, not court fines. Existing large purses are abstracted into downtime living/purchases by the agreed anthology convention, not silently stolen. Players may describe one modest purchase or job from the interval; subtract actual purchases from that allowance, never delete gear.\nThe reset is the GM's established anthology format: every episode starts broke. Retain ordinary gear and established history; abstract disposable wealth through the downtime interval. Do not invent a legal fine or create a new financial subsystem to justify it."
          }
        ],
        "enemies": [],
        "exits": [
          {
            "id": "wtgg:exit:ruling:1",
            "description": "Resume at after release and the ten-day inquiry; then several weeks of ordinary work while reports of the real Lanterns conflict",
            "targetSceneId": "wtgg:scene:break",
            "branchLabel": "04 -- Work under their own names"
          }
        ],
        "tags": [
          "ruling"
        ],
        "schemaVersion": 2
      },
      {
        "id": "wtgg:scene:break",
        "moduleId": "wtgg:module",
        "title": "04 -- Work under their own names",
        "subtitle": "Complete the time skip and launch the job",
        "type": "set-piece",
        "kind": "scene",
        "blocks": [
          {
            "id": "wtgg:break:b1",
            "kind": "gmNote",
            "text": "Resume after the real smoke break. For any detained PC, use the conditional-release line below before completing the ten-day review. Then read the review and agreed odd-job interval. This clears the local inquiry only; Dominion interest is unchanged and offstage in this adventure."
          },
          {
            "id": "wtgg:break:b2",
            "kind": "branch",
            "title": "Conditional release after the two-night review -- implicated PCs only",
            "tone": "blue",
            "blocks": [
              {
                "id": "wtgg:break:b3",
                "kind": "readAloud",
                "paragraphs": [
                  "At Dragonsreach, Irileth checks your name against the statement sheet. The guard returns your belongings, keeping any item individually recorded as evidence."
                ]
              },
              {
                "id": "wtgg:break:b4",
                "kind": "spoken",
                "speaker": "IRILETH",
                "line": "You'll stay in Whiterun and report when called. Your belongings will be returned, apart from anything held as evidence."
              },
              {
                "id": "wtgg:break:b5",
                "kind": "stop",
                "text": "State the remaining review date and actual evidence held; resolve an objection before the montage."
              }
            ]
          },
          {
            "id": "wtgg:break:b6",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "The ten-day local inquiry has concluded and actual unresolved charges do not prevent release."
          },
          {
            "id": "wtgg:break:b7",
            "kind": "readAloud",
            "paragraphs": [
              "Ten days after the audience, Irileth closes the inquiry ledger at Dragonsreach. The writ lies in a separate folder beside her elbow."
            ]
          },
          {
            "id": "wtgg:break:b8",
            "kind": "spoken",
            "speaker": "IRILETH",
            "line": "Your account is entered. You're free to leave. These papers stay here."
          },
          {
            "id": "wtgg:break:b9",
            "kind": "gmNote",
            "text": "Use after peaceful review/conditional release. If a specific unresolved charge remains from actual play, state it instead of announcing clearance. The standard opening has no continuing detention, bond tracker, or debt campaign."
          },
          {
            "id": "wtgg:break:b10",
            "kind": "readAloud",
            "paragraphs": [
              "Over the following weeks, Whiterun's work comes by the load: sacks to carry, carts to unload, parcels to deliver uphill. A small delivery for the Jarl's brother takes a crate of lamp oil to Dragonsreach's service door. The money from these errands buys food and lodging.",
              "Reports place the real Obsidian Lanterns in Winterhold and Riften, then Windhelm and Ivarstead. Each new account sends the search in another direction. Here in Whiterun, people hire you under your own names."
            ]
          },
          {
            "id": "wtgg:break:b11",
            "kind": "stop",
            "text": "Let each player name one ordinary job or modest purchase from the interval. State the agreed remaining allowance: 100 gold for cooperative PCs, 25 for detained PCs, less any purchase chosen from it. Keep their equipment. Then read the summons."
          },
          {
            "id": "wtgg:break:b12",
            "kind": "gmNote",
            "text": "Offer the existing Cloud District errands and one small delivery for the Jarl's brother: a crate of lamp oil from market storage to Dragonsreach's service door, 20 gold to the company, consumed within the montage's food/lodging allowance. These delivery specifics are new color, not a secret clue. They may describe different work. Their ordinary local service makes them eligible for the summons, without inheriting the Lanterns' reputation."
          },
          {
            "id": "wtgg:break:b13",
            "kind": "readAloud",
            "paragraphs": [
              "A guard stops beside the market stalls with a folded message."
            ]
          },
          {
            "id": "wtgg:break:b14",
            "kind": "spoken",
            "speaker": "GUARD",
            "line": "Proventus Avenicci asks you to come to Dragonsreach. He has paid work."
          },
          {
            "id": "wtgg:break:b15",
            "kind": "stop",
            "text": "Do they go, ask about it, postpone, or refuse? The steward's contract begins only if they choose to attend."
          },
          {
            "id": "wtgg:break:b16",
            "kind": "branch",
            "title": "They ask whether this is more questioning, or want terms",
            "tone": "red",
            "blocks": [
              {
                "id": "wtgg:break:b17",
                "kind": "spoken",
                "speaker": "GUARD",
                "line": "It's a contract. The steward will give you the particulars."
              },
              {
                "id": "wtgg:break:b18",
                "kind": "spoken",
                "speaker": "GUARD",
                "direction": "about advance terms",
                "line": "He's arranging work south of the city. Ask him about the pay."
              },
              {
                "id": "wtgg:break:b19",
                "kind": "gmNote",
                "text": "Accept -> briefing. Postpone -> one day without another encounter; an unsettled evening search can trample more standing barley. Refuse -> #ending-withdraw, no automatic acceptance."
              }
            ]
          }
        ],
        "enemies": [],
        "exits": [
          {
            "id": "wtgg:exit:break:1",
            "description": "Continue",
            "targetSceneId": "wtgg:scene:briefing",
            "branchLabel": "05 -- The steward's request"
          }
        ],
        "tags": [
          "break"
        ],
        "schemaVersion": 2
      },
      {
        "id": "wtgg:scene:briefing",
        "moduleId": "wtgg:module",
        "title": "05 -- The steward's request",
        "subtitle": "A field-safety contract with a missing-company report",
        "type": "set-piece",
        "kind": "scene",
        "blocks": [
          {
            "id": "wtgg:briefing:b1",
            "kind": "readAloud",
            "paragraphs": [
              "Dragonsreach smells of woodsmoke. Proventus Avenicci sits at a side table off the Jarl's hall, a ledger open before him. He sets down his quill and turns the page toward you. Red circles mark the figures in its margin."
            ]
          },
          {
            "id": "wtgg:briefing:b2",
            "kind": "spoken",
            "speaker": "PROVENTUS",
            "line": "Hearthfeld, three hours south of the river. Two giants trampled the north field four nights ago. I sent six Gray Anvils on Tuesday. They haven't reported. I need the field safe for harvest, and an account of those six."
          },
          {
            "id": "wtgg:briefing:b3",
            "kind": "readAloud",
            "paragraphs": [
              "He opens the drawer beneath the table and sets out the advance purses."
            ]
          },
          {
            "id": "wtgg:briefing:b4",
            "kind": "spoken",
            "speaker": "PROVENTUS",
            "line": "Two hundred gold apiece now, two hundred apiece when Sela can work the field again. Drive them out, settle terms, kill them if you must. The field is what I'm paying for."
          },
          {
            "id": "wtgg:briefing:b5",
            "kind": "stop",
            "text": "Take questions and the decision. Hand over the advance only after acceptance; do not narrate them accepting or leaving."
          },
          {
            "id": "wtgg:briefing:b6",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**CONTRACT -- hand the players these exact terms**\nNamed adventurers: five PCs tonight; Hirt and freed allies do not earn PC shares.\nAdvance: 200 gold per PC on accepting, earned for undertaking the trip. Completion: 200 gold per PC after credible confirmation of safe harvesting. Total steward pay: 400 gold per PC, not 1,200.\nReport on all six Gray Anvils: required account of what was learned, not a hidden rescue prerequisite. An honest incomplete report does not void an otherwise safe field. No payment for extra giant heads.\nHearthfeld's barley is ready to cut, but the guardian's evening searches keep the workers out and can trample further strips. Once access is safe, cutting and gathering takes roughly three working days with the farm's usual harvest help. There is no three-day crop-expiry deadline. Completion pays for secured access; earlier crop damage does not reduce the agreed balance."
          },
          {
            "id": "wtgg:briefing:b7",
            "kind": "branch",
            "title": "They ask about the farm, giants, or missing men",
            "tone": "blue",
            "blocks": [
              {
                "id": "wtgg:briefing:b8",
                "kind": "gmNote",
                "text": "Answer the question actually asked; these are separate replies, not a single unsolicited speech."
              },
              {
                "id": "wtgg:briefing:b9",
                "kind": "spoken",
                "speaker": "PROVENTUS",
                "line": "Sela Hearthfeld runs it with her two sons. Follow the cart road south; her mill is beside the river crossing."
              },
              {
                "id": "wtgg:briefing:b10",
                "kind": "spoken",
                "speaker": "PROVENTUS",
                "line": "They've kept to the mound above her land for generations. This is the first complaint I've had."
              },
              {
                "id": "wtgg:briefing:b11",
                "kind": "spoken",
                "speaker": "PROVENTUS",
                "line": "The Gray Anvils came off the hiring board. I know they left. I need you to find out what happened after that."
              },
              {
                "id": "wtgg:briefing:b12",
                "kind": "gmNote",
                "text": "He has the original two-giant report, not the current departure or robbery facts. Ordinary questions reveal these answers without a roll."
              }
            ]
          },
          {
            "id": "wtgg:briefing:b13",
            "kind": "branch",
            "title": "They demand more, refuse, or ask for equipment",
            "tone": "gold",
            "blocks": [
              {
                "id": "wtgg:briefing:b14",
                "kind": "spoken",
                "speaker": "PROVENTUS",
                "line": "Four hundred apiece for the job. You can take the advance today."
              },
              {
                "id": "wtgg:briefing:b15",
                "kind": "gmNote",
                "text": "The full session treasure budget already provides a 1,200-per-PC successful haul; no extra automatic stipend. Specific extra expenses can be agreed live before incurred. If refused: \"Then I'll need another company.\" End or let PCs reconsider; no forced journey.\nOne crate of ordinary food for the outward trip is supplied, including meat scraps for Hirt. No unlisted magic items or free replacement armor. Advance can fund their own established shopping choices."
              }
            ]
          }
        ],
        "enemies": [],
        "exits": [
          {
            "id": "wtgg:exit:briefing:1",
            "description": "Accepted",
            "targetSceneId": "wtgg:scene:farm",
            "branchLabel": "06 -- Hearthfeld"
          },
          {
            "id": "wtgg:exit:briefing:2",
            "description": "Refused",
            "targetSceneId": "wtgg:scene:ending-withdraw",
            "branchLabel": "21 -- Work declined"
          }
        ],
        "tags": [
          "briefing"
        ],
        "schemaVersion": 2
      },
      {
        "id": "wtgg:scene:farm",
        "moduleId": "wtgg:module",
        "title": "06 -- Hearthfeld",
        "subtitle": "Witnesses, searchable property, and several routes forward",
        "type": "set-piece",
        "kind": "scene",
        "blocks": [
          {
            "id": "wtgg:farm:b1",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They accepted the job and followed the road to Hearthfeld. The ordinary trip takes three hours; allow any chosen preparation before this arrival."
          },
          {
            "id": "wtgg:farm:b2",
            "kind": "readAloud",
            "paragraphs": [
              "The cart road runs south through open farmland. Windmills turn above fields of barley, and the road reaches Hearthfeld beside a river crossing. Beyond the farmhouse, barley bends under its seed heads. Two broad tracks of crushed stalks cut across the north field.",
              "Sela stands beside the field gate with a boy gripping her sleeve. Both face the ridge above the farm. Standing stones form a ring along its crest. A giant moves between them, carrying a club. Beside the farmhouse, three tents stand around the ashes of a cookfire."
            ]
          },
          {
            "id": "wtgg:farm:b3",
            "kind": "spoken",
            "speaker": "SELA",
            "line": "From the steward? Come here. The hired company left their tents beside my house."
          },
          {
            "id": "wtgg:farm:b4",
            "kind": "stop",
            "text": "Let them speak to Sela, inspect the field or tents, or go straight toward the ridge. She answers direct questions with the witness lines below."
          },
          {
            "id": "wtgg:farm:b5",
            "kind": "branch",
            "title": "Ask what she saw",
            "tone": "neutral",
            "blocks": [
              {
                "id": "wtgg:farm:b6",
                "kind": "gmNote",
                "text": "Read only the answer matching the question. Sela personally witnessed the departure west, not the contents of the stolen sacks."
              },
              {
                "id": "wtgg:farm:b7",
                "kind": "spoken",
                "speaker": "SELA",
                "line": "Five people ran downhill with sacks. The giants came after them, straight through the barley. That was four nights ago."
              },
              {
                "id": "wtgg:farm:b8",
                "kind": "spoken",
                "speaker": "SELA",
                "direction": "about the second giant",
                "line": "One went west yesterday with the mammoths. I watched them cross the ford. The other went back up to the stones."
              },
              {
                "id": "wtgg:farm:b9",
                "kind": "spoken",
                "speaker": "SELA",
                "direction": "about the mercenaries",
                "line": "Six arrived on Tuesday. I heard shouting after dark. I kept the boys inside. In the morning their packs were still here."
              },
              {
                "id": "wtgg:farm:b10",
                "kind": "spoken",
                "speaker": "SELA",
                "direction": "about leaving",
                "line": "We need this crop for winter."
              },
              {
                "id": "wtgg:farm:b11",
                "kind": "spoken",
                "speaker": "SELA",
                "direction": "about current danger",
                "line": "The one on the ridge comes down at dusk. He walks through the barley, looking at the ground. I keep the boys out until he goes back."
              },
              {
                "id": "wtgg:farm:b12",
                "kind": "spoken",
                "speaker": "SELA",
                "direction": "about the work",
                "line": "We need about three working days to cut and gather what's standing. Get us that time in the field."
              },
              {
                "id": "wtgg:farm:b13",
                "kind": "spoken",
                "speaker": "SELA",
                "direction": "about the ridge route",
                "line": "The path starts above the tents. Follow it to the stones."
              },
              {
                "id": "wtgg:farm:b14",
                "kind": "gmNote",
                "text": "She saw movement and heard the raid; she does not know the sacks' contents, captive destination, or second giant's ultimate campsite."
              }
            ]
          },
          {
            "id": "wtgg:farm:b15",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They approach the mercenaries' tents."
          },
          {
            "id": "wtgg:farm:b16",
            "kind": "readAloud",
            "paragraphs": [
              "Six packs lean against the tent poles. The three tent flaps hang from sliced fastenings. Inside, bedrolls lie half-unrolled beside bowls and waterskins. A cooking pot rests on its side by the fire, with porridge dried around its rim.",
              "The grass beyond the tents is pressed flat in two directions. One trail climbs toward the ridge. The other leads downhill toward the river. The ridge path begins just above the camp."
            ]
          },
          {
            "id": "wtgg:farm:b17",
            "kind": "stop",
            "text": "What do they examine? The observation/result passages below give the exact evidence without telling them what to conclude."
          },
          {
            "id": "wtgg:farm:b18",
            "kind": "branch",
            "title": "Searching the packs -- give the tally handout as well",
            "tone": "gold",
            "blocks": [
              {
                "id": "wtgg:farm:b19",
                "kind": "readAloud",
                "paragraphs": [
                  "Each pack holds travel supplies and a small purse tied shut. There are six bedrolls, six waterskins, and six bowls. Three spare cloaks bear gray anvils stitched at the shoulder. A company tally lists six names and a fallback shelter: the old shepherd's hut, one mile downstream from the pine bend."
                ]
              },
              {
                "id": "wtgg:farm:b20",
                "kind": "gmNote",
                "text": "Hand them the COMPANY TALLY below. Searching gets the inventory even after a failed detail roll; do not hide the hut lead."
              }
            ]
          },
          {
            "id": "wtgg:farm:b21",
            "kind": "branch",
            "title": "Following the departure marks -- successful detail roll",
            "tone": "red",
            "blocks": [
              {
                "id": "wtgg:farm:b22",
                "kind": "readAloud",
                "paragraphs": [
                  "Three sets of boot prints head uphill. Alongside them, one heel has dragged through the soil. Three more sets turn toward the river. The uphill marks continue onto the ridge path."
                ]
              },
              {
                "id": "wtgg:farm:b23",
                "kind": "gmNote",
                "text": "On failed fine tracking, use the next passage instead. The broad uphill route remains available."
              }
            ]
          },
          {
            "id": "wtgg:farm:b24",
            "kind": "branch",
            "title": "Departure marks -- fine tracking failed",
            "tone": "green",
            "blocks": [
              {
                "id": "wtgg:farm:b25",
                "kind": "readAloud",
                "paragraphs": [
                  "Boots and a broad dragging scrape have pressed the grass flat toward the ridge path. Another trampled trail runs toward the river. The individual prints overlap in the mud."
                ]
              }
            ]
          },
          {
            "id": "wtgg:farm:b26",
            "kind": "branch",
            "title": "Examining the damaged field",
            "tone": "red",
            "blocks": [
              {
                "id": "wtgg:farm:b27",
                "kind": "readAloud",
                "paragraphs": [
                  "Narrow boot prints cross the barley toward the river. The giant's deeper tracks follow them through the crushed stalks. At the field's edge, a torn sack holds clods of soil and a curved fragment of bronze. Its broken edge cuts across part of a worked band."
                ]
              },
              {
                "id": "wtgg:farm:b28",
                "kind": "gmNote",
                "text": "Give the ring fragment on examination. Success finds it promptly; failed detail search costs ten minutes. Sela can still give the ridge path and departure testimony."
              }
            ]
          },
          {
            "id": "wtgg:farm:b29",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**INVESTIGATE THE CAMP -- no clue bottleneck**\nPacks searched: give inventory and tally automatically. Standard Guile (0) determines detail: under -> personal purses remain tied inside, bedrolls half-unrolled; equal -> same facts, one disturbed tent peg gives a scrape/noise; over -> inventory still found, takes ten minutes;20 -> overturned porridge soils a spare cloak, not erased evidence.\nDeparture marks: Standard Might or Agility (0). Under -> three boot trails and one dragging heel uphill, three boot trails toward river. Equal -> trails identified, steep climb costs ten minutes. Over -> broad uphill scrape remains visible; fine counts uncertain.20 -> muddy slide dirties clothes; the route remains. These are observations, never a dictated robbery conclusion.\nField search: torn sack at field edge holds soil and a broken bronze ring fragment. Narrow boots cross the crop toward the river; deeper giant prints follow. Open examination gives these facts; Standard Guile (0) locates the fragment quickly, failure costs ten minutes instead of suppressing it.\nSela points out the public ridge path on request. Smoke beyond the ridge supplies a second pine-camp lead even if every tracking roll fails."
          },
          {
            "id": "wtgg:farm:b30",
            "kind": "handout",
            "title": "COMPANY TALLY",
            "text": "GRAY ANVILS -- HEARTHFELD DETAIL\nTorsten, Runa, Eydis, Bersi, Hakon, Leif.\nSix packs. Six bedrolls. Six waterskins. Six bowls and spoons.\nTwelve travel portions. Two thirty-foot ropes. Tinderbox, whetstone, sewing kit.\nThree spare cloaks, gray anvil stitched at the shoulder.\nPersonal purses: twenty septims each. Keep them tied in their owners' packs.\nFallback: old shepherd's hut, one mile downstream from the pine bend."
          },
          {
            "id": "wtgg:farm:b31",
            "kind": "gmNote",
            "text": "Total pack money: 120 gold, owned by the mercenaries; it is not included in the reward budget. Armor and weapons went with them. Taking their property is possible, with recognizable owners later; no free arsenal materializes in the tents."
          },
          {
            "id": "wtgg:farm:b32",
            "kind": "branch",
            "title": "They check the downstream hut first",
            "tone": "blue",
            "blocks": [
              {
                "id": "wtgg:farm:b33",
                "kind": "gmNote",
                "text": "One mile, about twenty minutes on foot. Bersi, Hakon, and Leif are exhausted, armed, and sheltering behind a barred door; they fled without packs and kept out of the robbers' patrol route. No additional fight."
              },
              {
                "id": "wtgg:farm:b34",
                "kind": "readAloud",
                "paragraphs": [
                  "A shepherd's hut stands one mile downstream. Its door is barred from inside. As you approach, someone shifts behind it, and a man's voice comes through the boards."
                ]
              },
              {
                "id": "wtgg:farm:b35",
                "kind": "spoken",
                "speaker": "BERSI",
                "line": "Anvils? Tell me whose company sent you."
              },
              {
                "id": "wtgg:farm:b36",
                "kind": "stop",
                "text": "Take their identification. The door opens on credible information from Sela or the tally; use the bluff procedure only if uncertain.\nCredible identification from the tally/Sela opens the door. Standard Guile(0) for uncertain bluff; equality gets a reply through the door before admission; failure leaves them behind the door but willing to speak;20 makes them ask to see weapons lowered."
              },
              {
                "id": "wtgg:farm:b37",
                "kind": "spoken",
                "speaker": "HAKON",
                "line": "They cut the tent flaps. Three of us got out. The others were taken up the ridge."
              },
              {
                "id": "wtgg:farm:b38",
                "kind": "spoken",
                "speaker": "LEIF",
                "line": "We're going back for them. If you've found our packs, bring the food."
              },
              {
                "id": "wtgg:farm:b39",
                "kind": "stop",
                "text": "They can return to Sela or accompany the rescue off the combat line. Ask what the PCs arrange; these three add no extra combat allies.\nThey can return to Sela or accompany the rescue off the combat line. They add no extra combat units beyond the two stated captive allies. Their evidence answers three missing names; it does not solve the field."
              }
            ]
          },
          {
            "id": "wtgg:farm:b40",
            "kind": "branch",
            "title": "They seek a rest or supplies",
            "tone": "neutral",
            "blocks": [
              {
                "id": "wtgg:farm:b41",
                "kind": "readAloud",
                "paragraphs": [
                  "Sela opens the farmhouse door and sets a jug of water beside a clear patch of floor. Beyond the gate, the ridge path climbs toward the stones."
                ]
              },
              {
                "id": "wtgg:farm:b42",
                "kind": "gmNote",
                "text": "Sela offers floor space and water. A Short Rest takes one hour: regain half maximum HP and FP, rounded down and capped at maxima; field repair DR to a maximum of 2. Her house is secure while PCs leave the ridge alone; no danger roll. A Long Rest takes eight hours securely: full HP/FP and refreshed once-per-adventure abilities. If an unsettled evening search occurs during that interval, show the giant's actual route and any freshly trampled strip next morning; rest does not make the remaining crop expire. Hirt rests by his own conversion rule, inlined in the companion card."
              }
            ]
          },
          {
            "id": "wtgg:farm:b43",
            "kind": "branch",
            "title": "They witness an unsettled evening search",
            "tone": "gold",
            "blocks": [
              {
                "id": "wtgg:farm:b44",
                "kind": "readAloud",
                "paragraphs": [
                  "The giant comes down from the ridge and enters the north field. It bends over the trampled ground, pushes stalks aside with its fingers, and moves farther into the barley. Sela holds the boys at the gate. Each step presses another patch of standing stalks into the earth."
                ]
              },
              {
                "id": "wtgg:farm:b45",
                "kind": "gmNote",
                "text": "Use only while the guardian is alive and field safety unresolved. Describe its actual route; repeated footsteps on existing damage do not destroy fresh acreage. PCs may intervene or wait. No invisible total-crop deadline."
              }
            ]
          }
        ],
        "enemies": [],
        "exits": [
          {
            "id": "wtgg:exit:farm:1",
            "description": "optional hut above",
            "targetSceneId": "wtgg:scene:ridge",
            "branchLabel": "07 -- The burial ring"
          },
          {
            "id": "wtgg:exit:farm:2",
            "description": "Field-only reconnaissance can return",
            "targetSceneId": "wtgg:scene:c-report",
            "branchLabel": "19 -- A job under their own name"
          }
        ],
        "tags": [
          "farm"
        ],
        "schemaVersion": 2
      },
      {
        "id": "wtgg:scene:ridge",
        "moduleId": "wtgg:module",
        "title": "07 -- The burial ring",
        "subtitle": "Evidence and the optional dangerous fight",
        "type": "combat",
        "kind": "combat",
        "blocks": [
          {
            "id": "wtgg:ridge:b1",
            "kind": "readAloud",
            "paragraphs": [
              "The ridge path climbs from the farm to a ring of weathered stones. Each stone stands taller than a man. The ring is about sixty feet across, and the path skirts its outer edge. Three square openings cut into the turf between the stones, with folded sod beside each one.",
              "A giant stands over the nearest opening, one hand resting on an ironwood club. Bronze rings and amber lie beside bones in that grave. Its head turns as you approach. Farther around the ring, the path descends toward pines beside the river. Cookfire smoke rises through their branches."
            ]
          },
          {
            "id": "wtgg:ridge:b2",
            "kind": "stop",
            "text": "Where do they move, and what do they examine? Staying on the outer path keeps them about twenty feet from the remaining goods. The giant watches; do not begin combat merely because they arrived."
          },
          {
            "id": "wtgg:ridge:b3",
            "kind": "branch",
            "title": "They inspect the open graves from a safe position",
            "tone": "gold",
            "blocks": [
              {
                "id": "wtgg:ridge:b4",
                "kind": "readAloud",
                "paragraphs": [
                  "Two of the graves hold displaced bones. Broad bands have left impressions in their soil, and small recesses have been cleared beside the remains. The third grave holds two bronze arm-rings, a carved bone flute, and four pieces of worked amber. Spade cuts mark its sides as well."
                ]
              },
              {
                "id": "wtgg:ridge:b5",
                "kind": "stop",
                "text": "Let them interpret or compare these facts. Reaching for the remaining goods provokes the guardian; inspection alone does not."
              }
            ]
          },
          {
            "id": "wtgg:ridge:b6",
            "kind": "branch",
            "title": "They examine the broken tool and cloth",
            "tone": "red",
            "blocks": [
              {
                "id": "wtgg:ridge:b7",
                "kind": "readAloud",
                "paragraphs": [
                  "An iron-headed spade lies beside a grave, snapped across its wooden haft. A leather wrist thong hangs from it, stamped with the shape of a tooth. On the lowest standing stone, a strip of gray cloth catches on a rough edge. Part of a stitched anvil remains on the torn corner."
                ]
              },
              {
                "id": "wtgg:ridge:b8",
                "kind": "gmNote",
                "text": "Give these physical objects. The cloth came from Torsten's cloak; it does not establish who dug the graves. The spade mark matches tools at the pines."
              }
            ]
          },
          {
            "id": "wtgg:ridge:b9",
            "kind": "branch",
            "title": "They examine tracks or carvings",
            "tone": "green",
            "blocks": [
              {
                "id": "wtgg:ridge:b10",
                "kind": "readAloud",
                "paragraphs": [
                  "Several sets of boot prints continue down the far side of the ridge. A dragged heel cuts through them toward the pines. Larger footprints circle the graves, descend toward the field, and climb back to the ring.",
                  "Carvings on the stones show people laying bowls beside a body, a row of figures holding clubs, and a flute player beside a mound."
                ]
              },
              {
                "id": "wtgg:ridge:b11",
                "kind": "gmNote",
                "text": "The pictures are the full find, not a cipher or a hidden magical reward. The boot trail and smoke both lead to the pine camp."
              }
            ]
          },
          {
            "id": "wtgg:ridge:b12",
            "kind": "branch",
            "title": "The giant gives a warning",
            "tone": "blue",
            "blocks": [
              {
                "id": "wtgg:ridge:b13",
                "kind": "readAloud",
                "paragraphs": [
                  "The giant lifts its club across the grave mouth and stamps once. Loose dirt drops from the turf edge. Its hand tightens around the club as it watches the space between you and the grave."
                ]
              },
              {
                "id": "wtgg:ridge:b14",
                "kind": "stop",
                "text": "Do they stop, withdraw, offer a gesture, or press forward? Give them this response before a warning becomes a fight."
              }
            ]
          },
          {
            "id": "wtgg:ridge:b15",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**PHYSICAL EVIDENCE -- reveal by inspection, no forced interpretation**\nTwo graves: displaced bones; arm-ring impressions and small cleared recesses in their soil. Third grave: opened but UNROBBED, bronze rings, carved bone flute, amber still alongside its bones.\nBroken human-sized spade: leather wrist thong stamped with a tooth mark. Gray cloth on a lower stone: torn corner of an anvil badge. Boot/drag tracks continue toward the pines. Giant tracks circle the graves and descend toward the field, then return.\nStone carvings, ungated: people laying bowls beside a body; a row of standing figures with clubs; a flute player beside a mound. These are carved pictures, not an unwritten cipher or a promise of magical rewards.\nComparisons: Standard Guile (0) notices matching objects when both are presented. Under -> match; equal -> match after careful cleaning; over -> shapes remain available, ask players what they compare;20 -> a rubbing tears, objects remain. Plainly fitting broken bronze pieces needs no roll once deliberately tried."
          },
          {
            "id": "wtgg:ridge:b16",
            "kind": "gmNote",
            "text": "The third grave was opened, not untouched. The gray badge came from a captive crossing the ridge, not proof that the Anvils dug it. The robbers' tool thong and bronze ring provide independent matches at the pines. Preserve inference for the players."
          },
          {
            "id": "wtgg:ridge:b17",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**GEOGRAPHY / GIANT SIGNALS**\nRing 60 feet across; three grave openings 10 feet square. The path skirts the outer stones, 20 feet from the unrobbed grave. The far-side path descends 150 feet over a fifteen-minute walk; the pine camp lies beyond sight of the ring.\nStay on outer path, weapons lowered, goods untouched -> guardian watches and lets them pass. Drawn weapons alone receive warning if carried at rest; a threatening advance, attack, or taking burial goods triggers initiative.\nWarning read: The giant lifts its club across the grave mouth and stamps once. Loose dirt drops from the turf edge.\nThe giant never teleports to the pines or joins that fight. Offering ordinary food can create space for a gesture, not purchase the missing funeral goods. Speech in a language it cannot understand does not auto-persuade it."
          },
          {
            "id": "wtgg:ridge:b18",
            "kind": "branch",
            "title": "They attempt communication or propose a settlement",
            "tone": "gold",
            "blocks": [
              {
                "id": "wtgg:ridge:b19",
                "kind": "gmNote",
                "text": "Present goods or gestures instead of inventing a shared language. Standard Guile (0) for an uncertain peaceful approach from outside the ring. Under: it attends to the gesture, points to the two robbed graves, then toward the pines. Equal: same response, while keeping them outside club reach. Over: club warning; they can withdraw. Natural 20: a startled club sweep at the soil; withdraw, or roll initiative if they press.\nIt accepts actual restoration without persuasion. Another concrete settlement that protects the graves and keeps robbers away can work on Hard Guile (-4), after demonstrated leverage. Clean/critical: it returns to guarding the ring. Equality: it agrees, but burial repairs must be completed before field access. Failure: remains unsettled, without forcing a fight. Natural 20: warning; negotiation closes until something material changes.\nTemporary Calm/Fear alone cannot guarantee tomorrow's harvest. Duration and actual spell rolls still matter. A lasting alternative is valid; verify it with Sela before paying completion. Do not invent immunity to veto PC skills."
              }
            ]
          },
          {
            "id": "wtgg:ridge:b20",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Peaceful approach succeeded. On failure, use the warning passage instead."
          },
          {
            "id": "wtgg:ridge:b21",
            "kind": "readAloud",
            "paragraphs": [
              "The giant points to the displaced bones in one grave, then to the other. It turns its hand toward the path descending into the pines."
            ]
          },
          {
            "id": "wtgg:ridge:b22",
            "kind": "gmNote",
            "text": "The gesture gives physical information; leave its interpretation to the players."
          },
          {
            "id": "wtgg:ridge:b23",
            "kind": "stop",
            "text": "What do they offer or do next? It accepts actual full restoration without a persuasion roll."
          },
          {
            "id": "wtgg:ridge:b24",
            "kind": "branch",
            "title": "They fight -- optional TL3 boss",
            "tone": "green",
            "blocks": [
              {
                "id": "wtgg:ridge:b25",
                "kind": "readAloud",
                "paragraphs": [
                  "The giant steps over the grave mouth and swings its club down across the path. Soil and stone scatter between the standing stones."
                ]
              },
              {
                "id": "wtgg:ridge:b26",
                "kind": "stop",
                "text": "Roll initiative now; place combatants at their chosen positions. Only attacking, threatening advance, or taking burial goods starts this fight.\nInitiative: all participants roll d20, low first; tied actors reroll. One Major and one Minor each turn; Bonus reactions off-turn, Free actions on-turn. One Minor moves to any location on the field (no distance cap); melee reach 5 feet. Leaving engagement permits an enemy free attack. Spend a Major on Standard Might shove / Agility slip / Guile feint, then a Minor to move: success avoids the attack; failure still moves but permits it. Prone is the core condition (players guide, Status Effects): Advantage on ranged attacks it makes, any attack that hits it is an automatic critical, and standing costs a Minor. Area effects resolved as a Resistance Roll are not attacks and never crit.\nBasic melee: own Might 18; damage 26, natural 1 deals 52 before DR. On equal TN, the hit lands but the club lodges briefly: the next attack against the giant has Advantage. A miss deals no damage; natural 20 also gives its next attack Disadvantage. These are module complications, not universal rules.\nGroundbreaker Swing | Major | Everyone within 5 feet rolls Standard Agility (0). Failure: Prone and 13 physical damage, DR applies. Resistance including equality avoids both; equality drops a loose held object instead. No attack roll or critical damage multiplier on this save-based move.\nGrief-Quake | Villain Action | End of every second PC turn. Everyone within 20 feet rolls Hard Agility (-4). Failure: Prone and 8 physical shockwave damage, DR applies. A successful save avoids both; equality causes a stumble without Prone. NPC turns do not count. Reset the counter when the action triggers; carry it across rounds. Stagger blocks the next Major, not this separate action; Paralyzed prevents actions while effective.\nTwo phase bars, 300 HP each. When the first reaches zero, discard excess from that hit, clear statuses, and start the next at 300. The guardian tears up a standing stone: basic damage 32, critical 64, ignores 2 target DR per hit; phase base DR 10. Penetration is not permanent Sunder. Retain permanent armor-Sunder reductions against the new base of 10. Groundbreaker remains 13; Grief-Quake remains 8.\nOther hits in a multi-hit action can strike the next bar; discard only the breaking hit's overflow. Final bar zero defeats it; the phase gate does not cap final overkill.\nFight at full strength. It neither surrenders nor delivers scripted mercy. Retreat works if players get clear: it guards the ring rather than pursuing to Whiterun. Resolve movement and status rules, never automatic escape. Bars do not regenerate between return visits without an actual effect.\nAt HP 0 or below a PC or ally cannot act. Track negative HP; heal above zero before the end of their next turn or the local death deadline applies. Adjacent ally: Major administer an actual potion (4 or 8 HP) or cast actual healing. Major Standard Guile bandaging pauses the deadline but leaves the patient unconscious; equality consumes cloth, failure leaves the deadline running, natural 20 adds no invented injury. Hirt's Avoid Death resolves first. This is the edition's explicit local downed fallback, not a claimed baseline rule."
              }
            ]
          },
          {
            "id": "wtgg:ridge:b27",
            "kind": "branch",
            "title": "First giant bar breaks -- read immediately when the first 300 HP is gone",
            "tone": "blue",
            "blocks": [
              {
                "id": "wtgg:ridge:b28",
                "kind": "readAloud",
                "paragraphs": [
                  "The giant drops the club beside the grave and seizes a standing stone with both hands. Turf tears around its base. It pulls the stone free and swings it up across its shoulders. The stone's empty socket opens beside the graves."
                ]
              },
              {
                "id": "wtgg:ridge:b29",
                "kind": "gmNote",
                "text": "Discard the breaking hit's overflow. Start bar two at 300 HP; clear temporary statuses, retain permanent Sunder. Basic damage32, crit64, ignores2 target DR; base DR10. Groundbreaker13 and quake8 remain unchanged. Continue the actual turn; no free attack for the transformation."
              }
            ]
          },
          {
            "id": "wtgg:ridge:b30",
            "kind": "branch",
            "title": "Giant defeated -- final bar zero",
            "tone": "neutral",
            "blocks": [
              {
                "id": "wtgg:ridge:b31",
                "kind": "readAloud",
                "paragraphs": [
                  "The standing stone drops from the giant's hands and strikes the earth beside the graves. The giant falls across the broken turf. Beyond the ring, smoke continues to rise from the pines."
                ]
              },
              {
                "id": "wtgg:ridge:b32",
                "kind": "gmNote",
                "text": "If defeated in the first form by an explicit instant-death effect, use the club rather than the stone. There is no loot purse, pick, captive rescue, or pine-camp victory here. Resolve downed allies, then ask where they go."
              },
              {
                "id": "wtgg:ridge:b33",
                "kind": "stop",
                "text": "Pine camp, farm, restitution, or report? The field threat is removed; the robbers and missing company remain wherever actual play left them."
              }
            ]
          },
          {
            "id": "wtgg:ridge:b34",
            "kind": "combat",
            "combat": {
              "title": "The guardian of the ring",
              "objective": "Two 300 HP bars. Break both to kill it. It never surrenders and never leaves the ring.",
              "statusFields": [
                {
                  "id": "giant-phase",
                  "label": "Phase",
                  "initial": "Bar one"
                }
              ],
              "trackers": [
                {
                  "id": "giant-bar-1",
                  "title": "First bar",
                  "description": "DR 14. Club 26 / crit 52. At 0 discard that hit's overflow and start bar two.",
                  "targets": [
                    {
                      "id": "giant-bar-1-target",
                      "label": "Bar one",
                      "maxHp": 300
                    }
                  ],
                  "quickDamage": [
                    13,
                    26,
                    52
                  ],
                  "threshold": 1,
                  "thresholdText": "The first bar breaks — it tears a standing stone free.",
                  "triggerBlocks": [
                    {
                      "id": "giant-break-read",
                      "kind": "readAloud",
                      "paragraphs": [
                        "The giant drops the club beside the grave and seizes a standing stone with both hands. Turf tears around its base. It pulls the stone free and swings it up across its shoulders. The stone's empty socket opens beside the graves."
                      ]
                    },
                    {
                      "id": "giant-break-note",
                      "kind": "gmNote",
                      "tag": "RULE:",
                      "text": "**Phase two**\nDiscard the breaking hit's overflow, clear temporary statuses, keep permanent Sunder. Second bar starts at 300. Base DR 10. Standing stone 32 / crit 64, ignores 2 target DR per hit. Groundbreaker stays 13; Grief-Quake stays 8. No free attack for the transformation."
                    }
                  ]
                },
                {
                  "id": "giant-bar-2",
                  "title": "Second bar",
                  "description": "DR 10. Standing stone 32 / crit 64, ignores 2 target DR. Groundbreaker 13, Grief-Quake 8.",
                  "targets": [
                    {
                      "id": "giant-bar-2-target",
                      "label": "Bar two",
                      "maxHp": 300
                    }
                  ],
                  "quickDamage": [
                    13,
                    32,
                    64
                  ],
                  "triggerBlocks": []
                }
              ],
              "cards": [
                {
                  "id": "giant-card",
                  "title": "The giant — Adept TL3",
                  "statLine": "Might 18 · Agility 12 · Magic 8 · Guile 16 · DR 14 → 10",
                  "items": [
                    "Club 26 / crit 52 (phase one) → standing stone 32 / crit 64, ignores 2 DR (phase two).",
                    "Groundbreaker (Major): everyone within 5 feet rolls Standard Agility or is Prone + 13 physical, DR applies.",
                    "Grief-Quake (Villain Action): end of every second PC turn. Everyone within 20 feet rolls Hard Agility (-4) or is Prone + 8 physical. NPC turns never count; carry the counter across rounds.",
                    "No FP pool. No treasure on it. The third grave's goods stay burial property."
                  ]
                }
              ],
              "enemies": [
                "giant-guardian"
              ],
              "triggers": []
            }
          },
          {
            "id": "wtgg:ridge:b35",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**GIANT CARD -- ADEPT TL3 / FIVE-PLAYER HP ADJUSTMENT**\nMight 18 | Agility 12 | Magic 8 | Guile 16\nTwo bars: 300 HP each (600 total) | DR 14 then 10\nNo FP pool specified in source; authored moves cost no FP here.\nClub 26 / crit 52 -> standing stone 32 / crit 64, ignores 2 DR.\nGroundbreaker Major: Standard Agility, all within 5 feet, or Prone + 13 physical.\nGrief-Quake Villain: Hard Agility (-4), all within 20 feet, or Prone + 8 physical.\nNo treasure on the giant. Third-grave goods remain burial property. Its death does not recover Hrodulf's money, weapon, or captives."
          },
          {
            "id": "wtgg:ridge:b36",
            "kind": "gmNote",
            "text": "If Hirt is present, open his full card below; his turns do not advance the villain counter. It is the same companion, not an additional enemy or reward share."
          },
          {
            "id": "wtgg:ridge:b37",
            "kind": "card",
            "title": "Companion — Hirt",
            "items": [
              "Might 16 · Agility 10 · Magic 10 · Guile 4",
              "HP 42 · FP 20 · DR 2 (+armour). Uncapped temporary HP from Bio-Siphon.",
              "Headsman's Axe: 10 damage, Hack & Slash (Bleeding 1/turn).",
              "Avoid Death: once per adventure, at 0 HP heal 10 (a blow over 10 excess still downs him).",
              "Bio-Siphon (Major, 10 FP): 5 irreducible + 5 fire, gain 20 temp HP.",
              "Mist Form (Reaction, 8 FP): immune to physical until his next turn; adjacent creatures take 4 fire.",
              "Equilibrium (Minor, 0 FP): take 10 irreducible, regain 20 FP.",
              "Sanguine Overload: at 84+ total HP his melee adds +2 fire.",
              "His turns never advance the giant's Grief-Quake counter — only PC turns do."
            ]
          }
        ],
        "enemies": [
          "giant-guardian"
        ],
        "exits": [
          {
            "id": "wtgg:exit:ridge:1",
            "description": "Guardian avoided",
            "targetSceneId": "wtgg:scene:c-approach",
            "branchLabel": "12 -- The people behind the smoke"
          },
          {
            "id": "wtgg:exit:ridge:2",
            "description": "Killed",
            "targetSceneId": "wtgg:scene:c-approach",
            "branchLabel": "12 -- The people behind the smoke"
          },
          {
            "id": "wtgg:exit:ridge:3",
            "description": "Retreated",
            "targetSceneId": "wtgg:scene:c-farm",
            "branchLabel": "11 -- Regroup without losing the thread"
          }
        ],
        "tags": [
          "ridge"
        ],
        "schemaVersion": 2
      },
      {
        "id": "wtgg:scene:c-pickup",
        "moduleId": "wtgg:module",
        "title": "08 -- Start here tonight",
        "subtitle": "Actual state, GM truth, and a short recap",
        "type": "set-piece",
        "kind": "scene",
        "blocks": [
          {
            "id": "wtgg:c-pickup:b1",
            "kind": "gmNote",
            "text": "Read this setup before the players arrive. Start play at #standoff. The already-played Whiterun hearing is not tonight's opening. Every essential clue below has its own visible spoken beat. Read those beats when the location becomes observable, before asking for further questions. Blue text is spoken; amber/maroon text is private. Conditional scenes are expanded and explicitly labelled, never hidden behind a closed panel."
          },
          {
            "id": "wtgg:c-pickup:b2",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**TONIGHT'S PREFLIGHT -- SIMULATED PLAYTEST EVENTS ARE NOT TONIGHT'S STATE**\nUse the five actual character sheets and last table positions. The playtest did not establish Conrad's Guile, anyone's current personal cash, or a new guard escort for the real session. Enter the actual stat in the check tool; its example value is not a PC score. Do not reset saved combat or repeat the 200-each advance.\nRead the recap below, then go to #standoff. Stop the corpse display and withdraw -> #burials; retreat to farm/river -> #farm; chosen fight -> the complete giant card at #standoff. At the camp use #approach for the visible situation before #bargain, #rescue, or #evidence. No essential observation waits for the right question.\nSay names and quantities aloud when disclosed. The surviving comrades can identify Bersi, Hakon, and Leif; the PCs do not know those names merely by seeing bodies. If a survivor learns about their purses, use the reaction at #rescue then, rather than postponing it until the ending. Reading a record does not put that record in anyone's inventory.\nBefore leaving the farm, account for the existing pit, six placed ammunition pieces, borrowed cloaks, Eydis's ankle, bodies, and actual carriers. A proposed cleanup or medical request is not a completed action. At #report, pay for a demonstrated lasting harvest solution; report survivors separately. At the end, export notes and table state."
          },
          {
            "id": "wtgg:c-pickup:b3",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**ACTUAL PICKUP -- THE FIGHT IS STILL RUNNING, DO NOT RESET IT**\nTwo full sessions have now gone into this one encounter and it is still open; the table called it a three-shot. Play stopped mid-fight, not before it and not after it. Do not re-deploy the giant on a fresh first bar and do not replay the opening rounds.\nRecorded state at the last break: the first bar of 300 is gone. The giant is on its second bar at full 300 and has not been hit on it. It is fighting with the standing stone it tore out of the ring -- basic 32, critical 64, ignores 2 target DR, base DR 10, Groundbreaker 13, Grief-Quake 8. Its ironwood club is lying on the ground beside the grave where it dropped it. A lost toe was part of the table's own description of that moment; keep whatever was actually ruled about it.\nDo not press the tracker's Deploy button as written: that starts a fresh first bar and undoes two sessions. Zero bar one to fire the phase-two read, or track the second bar on its own.\nOne PC was killed by the giant during this fight and a replacement character was rolled at the table. The recording preserves the death and the new sheet being made, not which sheet it was. Confirm the dead character's name, the replacement's AP, and any share still owed to the dead PC with your players before play. Do not restore the dead character and do not claw back advancement already earned.\nKeep their actual positions, HP, FP, spell durations, potions, ammunition, and Hidden status. Put the tokens back where play left them; if positions were not saved, have players state where they stood when the session stopped. This is recovering placement, not offering a free reposition.\nThey made a concealed pit roughly thirty feet deep near the farm approach, with four shock ammunition pieces inside, two earlier pieces on the approach, and a rope arrangement. Deduct already-spent resources once, not again. Recovery of any component requires reaching it; ordinary enchanted ammunition is not assumed to be a proximity mine.\nThey took six Anvil purses, twenty septims each, and other supplies. Two marked cloaks and supplies went with Sela and her boy toward the downstream hut. Three Anvils died at the ridge. The others have not been found.\nTheir contract: 200 gold each advance ALREADY PAID; 200 each after the remaining field can be harvested. An honest account of the six is required, not a hidden all-six-alive condition. This is the SAME adventure and the SAME advancement reward across two sessions."
          },
          {
            "id": "wtgg:c-pickup:b4",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**COMPLETE INCIDENT -- CONTINUATION DESIGN / GM TRUTH**\nHrodulf and four Barrow-Pickers opened three giant graves. They emptied two and abandoned the third with its goods still beside the bones. Their flight with the sacks brought giants across the barley. The guardian continues searching that route at dusk while the stolen objects remain away.\nThe six Gray Anvils camped at the farm and attempted to deal with the giants, as Sela described. Retained preparation from the earlier module's captive account: Hrodulf's crew cut into their tents after dark; three Anvils got away, and Torsten, Runa, and Eydis were captured and surrendered. That raid separated the company. Bersi, Hakon, and Leif were the three who later made the renewed attack at the stones during the party's preparations and died there. The raid/capture linkage and name allocation are connective preparation, not recovered dialogue. The captives cannot recount what the escaped three decided or did afterward until someone brings news. If a dead person's name was actually established at your table, swap the name tags before play; keep three dead and three captive, never duplicate a person.\nThe captives are at the pine camp. The old unplayed version with three living Anvils at the hut is retired. Sela and her boy reach that shelter in this continuation; there are no Anvil escapees waiting there. Sela's other son is at the farmhouse, keeping to the house and watching for her return. These are new location resolutions, not claims that those arrivals were recorded.\nTwo giants were described in the live detection. Preserve that: the second is with mammoths in the western river fold. In the opening interval it continues west with the herd. It does not guard the stolen goods, join the pine fight, or become a surprise reinforcement. Give the western sighting at #burials or #farm when actually visible. Its normal business is herd protection; do not turn this into a second compulsory giant battle.\nThe religious activity is handling and restoring disturbed burials at an existing site. Its completion is being prevented by the missing objects. This makes the ongoing activity relevant to the field without changing it into a newly founded religion or a magical ritual. The farmer's fear that the site will keep the fields inaccessible remains understandable.\nHrodulf's business sells relics to Solitude collectors. The route-cost note later is new local evidence of already-established disrupted trade, not a new Thalmor plot. Thalmor interest in this party remains unresolved and offstage. No patrol or arrest is added tonight."
          },
          {
            "id": "wtgg:c-pickup:b5",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**PEOPLE / STARTING LOCATIONS**\nGuardian: ring, hostile to the corpse display, responsive to actual withdrawal. Speechless; no agriculture; established burial practices. Do not give it human dialogue or let a Guile success teach it a new economic system.\nSecond giant: western river fold with the departing mammoths; outside tonight's encounter roster.\nTorsten: Nord man, captive at east stake; wants his people out, asks about the others. Runa: Nord woman, captive carrying sacks; wants a safe route and her weapon. Eydis: Nord woman, captive seated at stake, injured ankle; wants assistance moving. Race/sex are delivery notes and new local casting, not an accent script.\nHrodulf: Nord man, broker at central sorting table; wants his haul and a safe departure. Four Nord crew: north lookout, southern sorter, carrier, east prisoner guard. Roles are new staging of the SAME four enemies; the carrier does not add a fifth guard.\nSela and boy: downstream shepherd hut. Other son: farmhouse. Bersi/Hakon/Leif: dead at the ring; any raised bodies remain subject to the actual spell and their controller. Hirt was not established in this session's recorded active group; do not spawn him. His complete conditional reference is in the appendix only if your table actually has him."
          },
          {
            "id": "wtgg:c-pickup:b6",
            "kind": "readAloud",
            "paragraphs": [
              "You came to Hearthfeld to make the barley fields safe for harvest and find the six Gray Anvils. You searched their camp, sent Sela and her boy toward the shepherd's hut, and prepared a pit with shock ammunition. At the stones, three Anvils died fighting the giant, and your drawing caught its attention. The later demonstration with raised bodies brought its club up again. You have been fighting it since, and it has torn a standing stone out of the ring to fight you with. The fight is still open, and one of your company is dead."
            ]
          },
          {
            "id": "wtgg:c-pickup:b7",
            "kind": "stop",
            "text": "Confirm the last positions, who was next in the order, and which character was lost. Ask what the players do at the current moment; do not replay earlier rounds, grant an enemy free hit, or narrate the giant's defeat."
          }
        ],
        "enemies": [],
        "exits": [
          {
            "id": "wtgg:exit:c-pickup:1",
            "description": "Continue",
            "targetSceneId": "wtgg:scene:c-standoff",
            "branchLabel": "09 -- The standing stone"
          }
        ],
        "tags": [
          "pickup"
        ],
        "schemaVersion": 2
      },
      {
        "id": "wtgg:scene:c-standoff",
        "moduleId": "wtgg:module",
        "title": "09 -- The standing stone",
        "subtitle": "Resume an open fight, with an actionable way to disengage",
        "type": "combat",
        "kind": "combat",
        "blocks": [
          {
            "id": "wtgg:c-standoff:b1",
            "kind": "gmNote",
            "text": "Re-read the whole beat before using it. It resumes the fight exactly where the last session stopped: second bar, stone already in its hands, club on the ground. The raised bodies and their controller retain their actual positions. The giant has not acquired knowledge of the hidden PC's location. Its aggression is directed at whoever is still in reach, not at an irreversible combat flag."
          },
          {
            "id": "wtgg:c-standoff:b2",
            "kind": "readAloud",
            "paragraphs": [
              "The giant sets its feet between the graves and the path, the standing stone riding across its shoulders. Its ironwood club lies where it dropped it. Behind it, square cuts in the turf lie between the stones, with pale bones and worked bronze visible in one opening. The outer path slopes down toward the farm."
            ]
          },
          {
            "id": "wtgg:c-standoff:b3",
            "kind": "stop",
            "text": "What do you do? Give every player a chance to declare an immediate response. Resolve initiative if hostile actions need ordering; speaking or choosing to back away does not itself force a damaging attack."
          },
          {
            "id": "wtgg:c-standoff:b4",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**DE-ESCALATION -- NEW ENCOUNTER RESPONSE, NOT A MIND-CONTROL CHECK**\nCombat is already open, so this is disengagement, not a fresh approach. Attacking no more, moving clear of the graves, and not pressing back in ends the exchange: the giant uses its next action to hold the ring rather than pursue someone leaving. It does not require the exact phrase 'we surrender', a successful speech, or a perfect drawing. A hidden character may stay hidden. Staying inside its reach with weapons up is still a fight, and an animated corpse still advancing at it is still a threat even if its controller apologizes.\nIf all threats stand down, read the boundary result immediately, then #burials. If some withdraw but another attacks, the giant retaliates against the active threat on its actual turn; it does not attack a surrendered bystander by default. If players retreat entirely, give the farm route at #farm; the pines are also reachable by the river. Fight only if they press the attack, keep threatening it, or seize protected goods.\nUse real spells for Calm, Fear, illusion, and dismissal. Spell list's opening note explicitly permits reduced effects on bosses; do not forbid targeting merely because the giant is a boss. For new casts here, use the printed reduced-effect adjudication in the spell card. None creates agriculture, shared language, permanent trust, or guaranteed harvest protection. A concrete respectful gesture from outside club reach can get attention; success is not a licence to persuade it of an incomprehensible proposition."
          },
          {
            "id": "wtgg:c-standoff:b5",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "The attacks have stopped and the party has moved clear of the graves."
          },
          {
            "id": "wtgg:c-standoff:b6",
            "kind": "readAloud",
            "paragraphs": [
              "The giant lowers the stone until its base rests in the turf. It stays between you and the openings. After watching you for another moment, it turns sideways and reaches into the nearest grave. Between two fingers it lifts a bronze ring and lays it beside the bones."
            ]
          },
          {
            "id": "wtgg:c-standoff:b7",
            "kind": "stop",
            "text": "Allow a response. Continue with the visible burial evidence at #burials without requiring someone to ask the right question. Their next decision remains theirs."
          },
          {
            "id": "wtgg:c-standoff:b8",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They keep a corpse approaching, threaten the graves, or attack."
          },
          {
            "id": "wtgg:c-standoff:b9",
            "kind": "readAloud",
            "paragraphs": [
              "The giant steps toward the advancing threat and brings its club around. Its back remains toward the open graves."
            ]
          },
          {
            "id": "wtgg:c-standoff:b10",
            "kind": "combat",
            "combat": {
              "title": "The guardian of the ring",
              "objective": "Two 300 HP bars. Break both to kill it. It never surrenders and never leaves the ring.",
              "statusFields": [
                {
                  "id": "giant-phase",
                  "label": "Phase",
                  "initial": "Bar one"
                }
              ],
              "trackers": [
                {
                  "id": "giant-bar-1",
                  "title": "First bar",
                  "description": "DR 14. Club 26 / crit 52. At 0 discard that hit's overflow and start bar two.",
                  "targets": [
                    {
                      "id": "giant-bar-1-target",
                      "label": "Bar one",
                      "maxHp": 300
                    }
                  ],
                  "quickDamage": [
                    13,
                    26,
                    52
                  ],
                  "threshold": 1,
                  "thresholdText": "The first bar breaks — it tears a standing stone free.",
                  "triggerBlocks": [
                    {
                      "id": "giant-break-read",
                      "kind": "readAloud",
                      "paragraphs": [
                        "The giant drops the club beside the grave and seizes a standing stone with both hands. Turf tears around its base. It pulls the stone free and swings it up across its shoulders. The stone's empty socket opens beside the graves."
                      ]
                    },
                    {
                      "id": "giant-break-note",
                      "kind": "gmNote",
                      "tag": "RULE:",
                      "text": "**Phase two**\nDiscard the breaking hit's overflow, clear temporary statuses, keep permanent Sunder. Second bar starts at 300. Base DR 10. Standing stone 32 / crit 64, ignores 2 target DR per hit. Groundbreaker stays 13; Grief-Quake stays 8. No free attack for the transformation."
                    }
                  ]
                },
                {
                  "id": "giant-bar-2",
                  "title": "Second bar",
                  "description": "DR 10. Standing stone 32 / crit 64, ignores 2 target DR. Groundbreaker 13, Grief-Quake 8.",
                  "targets": [
                    {
                      "id": "giant-bar-2-target",
                      "label": "Bar two",
                      "maxHp": 300
                    }
                  ],
                  "quickDamage": [
                    13,
                    32,
                    64
                  ],
                  "triggerBlocks": []
                }
              ],
              "cards": [
                {
                  "id": "giant-card",
                  "title": "The giant — Adept TL3",
                  "statLine": "Might 18 · Agility 12 · Magic 8 · Guile 16 · DR 14 → 10",
                  "items": [
                    "Club 26 / crit 52 (phase one) → standing stone 32 / crit 64, ignores 2 DR (phase two).",
                    "Groundbreaker (Major): everyone within 5 feet rolls Standard Agility or is Prone + 13 physical, DR applies.",
                    "Grief-Quake (Villain Action): end of every second PC turn. Everyone within 20 feet rolls Hard Agility (-4) or is Prone + 8 physical. NPC turns never count; carry the counter across rounds.",
                    "No FP pool. No treasure on it. The third grave's goods stay burial property."
                  ]
                }
              ],
              "enemies": [
                "giant-guardian"
              ],
              "triggers": []
            }
          },
          {
            "id": "wtgg:c-standoff:b11",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**THEIR PREPARED PIT -- REACH IT BEFORE USING IT**\nKeep the actual trap on the farm approach, not under the giant at the stones. The guardian will not abandon the burials merely because someone waves from downhill. During its ordinary dusk search it may reach that route; players can also try an actual lure, which risks renewing combat. A mindless corpse is neither automatically compelling bait nor a free permanent servant; retain the original spell's limits.\nThe covered pit triggers only when its supported surface is actually crossed. For this already-built giant trap, use the giant's Standard Agility (0) to catch the edge once; success leaves it at the lip, equality leaves it Prone at the lip, failure puts it in the pit, natural 20 also dislodges loose edge soil. No roll is needed to notice a deliberately exposed hole. Falling over twenty feet: 5 damage and Prone, from Reference tables; apply ordinary physical DR. It is a restraint opportunity, not automatic giant death.\nThirty-foot sheer pit: the trapped giant spends a Major on Hard Might (-4) to cut footholds/climb. Success climbs 15 feet; equality climbs 10; failure holds position; natural 20 loses that turn's progress. Two normal successes escape; standing on the bottom costs a Minor first. This climb procedure is new local adjudication. It can brace its club -- or, in the second bar, the standing stone -- across the lip only when actually within reach; no teleporting out.\nPreserve the purchased rounds' accepted enchantment, including any Rune trigger the GM already allowed when they were placed. Lightning Rune's reference effect is next approaching creature triggers 6 shock damage and 6 FP drain; it costs 5 FP to cast as a spell, not an extra charge retroactively levied on already enchanted ammunition. Ordinary shock-damage-on-hit ammunition has no new proximity trigger. For the placed rune plan, resolve each actual triggered piece once and mark it spent, applying DR per damage instance; don't award six overlapping area explosions without actual placement/trigger support. A player may retrieve/reposition accessible unspent rounds. Trip rope requires an actual pull: opposed PC Might against giant Might 18, each own TN, lower successful die wins; a win makes it Prone on the square it occupies. A rope cannot drag it across arbitrary terrain into the pit.\nIf trapped and the party disengages, it stops attacking unreachable targets. A pit alone does not prove safe harvest for three days; use #restoration for a lasting result. If the players free it without restoring goods, it resumes guarding/searching; that action may reopen a respectful approach, not solve the whole incident."
          }
        ],
        "enemies": [
          "giant-guardian"
        ],
        "exits": [
          {
            "id": "wtgg:exit:c-standoff:1",
            "description": "Stand-down",
            "targetSceneId": "wtgg:scene:c-burials",
            "branchLabel": "10 -- What was disturbed"
          },
          {
            "id": "wtgg:exit:c-standoff:2",
            "description": "Actual retreat",
            "targetSceneId": "wtgg:scene:c-farm",
            "branchLabel": "11 -- Regroup without losing the thread"
          },
          {
            "id": "wtgg:exit:c-standoff:3",
            "description": "Chosen fight",
            "targetSceneId": "wtgg:scene:c-burials",
            "branchLabel": "10 -- What was disturbed"
          }
        ],
        "tags": [
          "standoff"
        ],
        "schemaVersion": 2
      },
      {
        "id": "wtgg:scene:c-burials",
        "moduleId": "wtgg:module",
        "title": "10 -- What was disturbed",
        "subtitle": "Essential evidence in the spoken layer, not a question menu",
        "type": "set-piece",
        "kind": "scene",
        "blocks": [
          {
            "id": "wtgg:c-burials:b1",
            "kind": "gmNote",
            "text": "Deliver the following short observations in order once the party can see the ring safely. They need not step within club reach or touch protected objects. If they fled without looking, use the river-side approach in #farm; do not tell them they already learned this."
          },
          {
            "id": "wtgg:c-burials:b2",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**RING DISTANCES -- RESTORED FROM THE EXISTING MODULE**\nRing 60 feet across; each grave opening 10 feet square. The outer path passes 20 feet from the unrobbed grave. Folded turf rests beside the openings, inside the ring. A person on that path cannot reach the turf by hand; moving in to handle it is a separate approach to the guarded graves, not an automatic repair from safety. The guardian's printed melee reach is 5 feet from its actual position. Keep existing tokens where play left them; these site dimensions do not reposition anyone. Before an uncertain approach, show the relevant grave edge, turf, guardian, and intended route on the table map and state the distances. The far-side descent to the pines loses 150 feet of elevation over roughly fifteen minutes; the camp itself is beyond sight of the ring."
          },
          {
            "id": "wtgg:c-burials:b3",
            "kind": "readAloud",
            "paragraphs": [
              "Within the stone ring, bones lie along the bottoms of three square excavations. Folded turf rests beside the cuts. In one grave, bronze arm-rings, a bone flute, and pieces of amber sit alongside the remains."
            ]
          },
          {
            "id": "wtgg:c-burials:b4",
            "kind": "stop",
            "text": "Let the table respond; do not name their conclusion."
          },
          {
            "id": "wtgg:c-burials:b5",
            "kind": "readAloud",
            "paragraphs": [
              "The other two graves have loose bones pushed against their sides. Broad curved impressions remain in the soil, with scraped recesses beside them. An iron spade lies nearby, its wooden shaft snapped in two. The handle is small enough for a human hand."
            ]
          },
          {
            "id": "wtgg:c-burials:b6",
            "kind": "gmNote",
            "text": "These are essential observations, not a reward for a Guile roll. A living guardian permits looking from the outer path while the party respects its boundary. If it is dead, omit behavior passages and describe the objects in the same places. Its bones are not the giant ancestors' bones inside the graves."
          },
          {
            "id": "wtgg:c-burials:b7",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Guardian alive, display stopped, party still outside the grave boundary."
          },
          {
            "id": "wtgg:c-burials:b8",
            "kind": "readAloud",
            "paragraphs": [
              "The giant sets the remaining ring beside the flute. It touches the bare curved impression in the neighboring grave, then turns its head toward the path on the far side of the stones."
            ]
          },
          {
            "id": "wtgg:c-burials:b9",
            "kind": "stop",
            "text": "They may draw, point, show an object, examine safely, leave, or try another approach. The giant has supplied a physical response, not a spoken mission briefing."
          },
          {
            "id": "wtgg:c-burials:b10",
            "kind": "readAloud",
            "paragraphs": [
              "Beyond the outer stones, boot prints run down a narrow path toward the pines beside the river. Smoke rises between those trees. A leather thong on the broken spade carries a stamped tooth shape."
            ]
          },
          {
            "id": "wtgg:c-burials:b11",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**USING THEIR DRAWING / INVESTIGATION**\nA drawing of the ring already got attention: no new roll to repeat that established recognition. Indicating an actual burial opening or matching object makes it look there. Pointing from the scraped spaces toward the far-side path gets its existing gesture toward that path. It cannot agree to farm, recognize a forged new doctrine, name a culprit, explain a sale, or translate abstract symbols. Guile can affect an uncertain approach; it does not supply missing concepts.\nStanding still and examining from a safe position gives the described bones, soil, and spade. Fine examination of the impressions: Standard Guile (0); success/equality identifies the shapes as matching the broad ornaments visible in the third grave, failure takes longer but leaves both shapes visible, natural 20 spoils a paper rubbing, not the original evidence. If the players deliberately compare shapes correctly, give the match without a roll.\nThe tooth-marked spade is human equipment. The gray cloth at the low stone bears an anvil corner: a separate clue of Anvil passage, not proof they dug. A PC reaching for remaining funeral goods gets a club-across-the-opening warning before an attack. Returning a dropped object and withdrawing stops that provocation. Actual theft or violence can still lead to combat."
          },
          {
            "id": "wtgg:c-burials:b12",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They inspect the gray cloth or Anvil remains, with access actually safe."
          },
          {
            "id": "wtgg:c-burials:b13",
            "kind": "readAloud",
            "paragraphs": [
              "A strip of gray cloth catches on the lowest standing stone. A stitched anvil crosses its torn edge. The company badge also appears on the dead mercenaries' gear."
            ]
          },
          {
            "id": "wtgg:c-burials:b14",
            "kind": "gmNote",
            "text": "Newly assigned dead names are Bersi, Hakon, and Leif. They can be identified later by surviving comrades; do not declare the party knows their names from their faces. No talking-corpse ability is granted by Raise Zombie. Undead keep the actual spell's stats/duration; they do not inherit the full living allied card automatically. Resurrecting a dead person is a different effect and must actually exist on a player sheet."
          },
          {
            "id": "wtgg:c-burials:b15",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Someone has a western view, either from the ridge or the field; new staging preserving the earlier second detection."
          },
          {
            "id": "wtgg:c-burials:b16",
            "kind": "readAloud",
            "paragraphs": [
              "In the river fold to the west, mammoths move between the banks. Another giant walks beside them. The herd follows the water away from Hearthfeld."
            ]
          },
          {
            "id": "wtgg:c-burials:b17",
            "kind": "gmNote",
            "text": "This is the second giant leaving with its herd, not a replacement mystery enemy. It stays out of the ridge/pine encounters. If the party deliberately follows and threatens the herd, use the same full giant profile as a separate new encounter only after openly warning that they are leaving the job area to confront another giant. No second treasure/AP and no automatic reinforcement."
          }
        ],
        "enemies": [],
        "exits": [
          {
            "id": "wtgg:exit:c-burials:1",
            "description": "Downhill path and smoke",
            "targetSceneId": "wtgg:scene:c-approach",
            "branchLabel": "12 -- The people behind the smoke"
          },
          {
            "id": "wtgg:exit:c-burials:2",
            "description": "Return for recovery or farmer",
            "targetSceneId": "wtgg:scene:c-farm",
            "branchLabel": "11 -- Regroup without losing the thread"
          },
          {
            "id": "wtgg:exit:c-burials:3",
            "description": "Remaining giant fight",
            "targetSceneId": "wtgg:scene:c-standoff",
            "branchLabel": "09 -- The standing stone"
          },
          {
            "id": "wtgg:exit:c-burials:4",
            "description": "Returning goods later",
            "targetSceneId": "wtgg:scene:c-restoration",
            "branchLabel": "17 -- What they bring back"
          }
        ],
        "tags": [
          "burials"
        ],
        "schemaVersion": 2
      },
      {
        "id": "wtgg:scene:c-farm",
        "moduleId": "wtgg:module",
        "title": "11 -- Regroup without losing the thread",
        "subtitle": "River route, farmer, hut, and real rest",
        "type": "set-piece",
        "kind": "scene",
        "blocks": [
          {
            "id": "wtgg:c-farm:b1",
            "kind": "gmNote",
            "text": "The farm and hut are separate places. Only use the arrival matching the route chosen. A retreat can end the immediate confrontation without settling field access. Resolve actual movement before reading a safe arrival."
          },
          {
            "id": "wtgg:c-farm:b2",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They are clear of the guardian and return to the farmhouse."
          },
          {
            "id": "wtgg:c-farm:b3",
            "kind": "readAloud",
            "paragraphs": [
              "The farmhouse stands beside the trampled rows. A boy watches from its doorway. Downhill, the river bends past the pines. A thread of smoke rises from the trees beyond the ridge's far shoulder."
            ]
          },
          {
            "id": "wtgg:c-farm:b4",
            "kind": "spoken",
            "speaker": "SON",
            "line": "Did you find my mother? She went downriver with my brother."
          },
          {
            "id": "wtgg:c-farm:b5",
            "kind": "stop",
            "text": "He wants news of his family. He can give water and point out the ordinary river path. He did not witness the robbery, know the missing men's fate, or hear the giant exchange."
          },
          {
            "id": "wtgg:c-farm:b6",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**THE ALTERNATIVE APPROACH / RECOVERY**\nThe hut is one mile downstream, twenty minutes on foot along the river. The pine camp lies between the ridge and that downstream bend; the river route reaches its southern edge. This uses the established riverside camp and shelter, with a new explicit connection. PCs walking that route see its smoke and traffic at #approach without having to cross the guarded ring. Do not move any essential evidence to their feet.\nIf they stay to plan or rest, give the actual smoke and route once, then let them choose. They can report an incomplete job at #report. A route is an opportunity, not compelled movement.\nSecure Short Rest: one hour, regain half maximum HP and FP rounded down, capped at maxima; field repair DR to maximum 2, never above original DR. Secure Long Rest: eight hours, full HP/FP, refresh once-per-adventure features by the existing table-edition ruling. No free rest between encounters, and no rest revives the dead. Dangerous hostile occupancy is not secure rest.\nWhile the guardian remains unsettled it searches at dusk; show the actual new strip of trampling if its route crosses standing barley. Repeated steps on already flattened crop do not destroy another field. There is no invisible harvest-expiry clock or late-payment reduction."
          },
          {
            "id": "wtgg:c-farm:b7",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**FIELD ROUTE -- MAKE THE OBSERVABLE GROUND AVAILABLE**\nThe existing farm description has two broad crushed tracks through the north field, smaller boot prints toward the river, and standing barley beside the damaged strips. Keep the farm gate, ridge path, and river approach in their established places, including the party's actual pit and ammunition. The guardian descends from the ridge, searches the earlier flight route toward the river, and returns to the graves. Searching can take it off that old track into adjacent standing crop; fresh loss occurs only where it actually steps. This search pattern is continuation staging, not a claim that a particular new strip has already been destroyed.\nIf players inspect the route, point out old flattened ground and still-standing stalks before they propose protection or a harvesting lane. If they watch a search, place its route openly before resolving intervention; mark only actual fresh trampling. A waiting interval is time for their plan, not permission to move the giant through an unseen field. A plan that keeps it on already flattened ground may protect remaining crop; judge the demonstrated access, worker safety, and three-day coverage rather than requiring the restoration route."
          },
          {
            "id": "wtgg:c-farm:b8",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They inspect the north field or ask whether every part of it is already trampled."
          },
          {
            "id": "wtgg:c-farm:b9",
            "kind": "readAloud",
            "paragraphs": [
              "Two broad tracks of crushed stalks cross the north field. Narrow boot prints continue toward the river. Standing barley borders the flattened ground."
            ]
          },
          {
            "id": "wtgg:c-farm:b10",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They observe the guardian's actual dusk search while the field remains unsettled."
          },
          {
            "id": "wtgg:c-farm:b11",
            "kind": "readAloud",
            "paragraphs": [
              "The giant comes down from the ridge and enters the north field. It bends over the trampled ground and pushes stalks aside with its fingers."
            ]
          },
          {
            "id": "wtgg:c-farm:b12",
            "kind": "stop",
            "text": "Show its current position and next visible direction. Resolve their intervention before moving it farther. Say which steps land on old damage and which flatten standing stalks; never charge fresh crop loss for the old track."
          },
          {
            "id": "wtgg:c-farm:b13",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They deliberately continue to the hut; Sela and boy have arrived there in the new continuation."
          },
          {
            "id": "wtgg:c-farm:b14",
            "kind": "readAloud",
            "paragraphs": [
              "The shepherd's hut stands beside the bend, its roof patched with turf. One of the gray-anvil cloaks hangs over a drying branch by the door. Sela opens the door with her boy beside her."
            ]
          },
          {
            "id": "wtgg:c-farm:b15",
            "kind": "spoken",
            "speaker": "SELA",
            "line": "Is it safe to go home? My other boy's still there."
          },
          {
            "id": "wtgg:c-farm:b16",
            "kind": "stop",
            "text": "Take their answer. Her priority is her sons and access to the crop. She does not reveal unseen camp facts or identify a secret culprit."
          },
          {
            "id": "wtgg:c-farm:b17",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They report that the giant is still at the stones / ask about the field's history."
          },
          {
            "id": "wtgg:c-farm:b18",
            "kind": "readAloud",
            "paragraphs": [
              "Sela pulls the borrowed cloak around her boy's shoulders and looks upstream."
            ]
          },
          {
            "id": "wtgg:c-farm:b19",
            "kind": "spoken",
            "speaker": "SELA",
            "line": "They've always used that mound. We worked below it. Four nights ago, people ran down with sacks and the giants followed them through the barley. Now the one at the stones keeps coming back through it."
          },
          {
            "id": "wtgg:c-farm:b20",
            "kind": "gmNote",
            "text": "This is previously prepared eyewitness information delivered at her practical request to return home, not a gate for continuing. Read it once during this reunion if the giant is unsettled, even if the players do not phrase a history question. It supplements the witnessed Anvil ambush without claiming she saw the sacks opened or knew their owners."
          },
          {
            "id": "wtgg:c-farm:b21",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They want her and boy to return while access remains uncertain."
          },
          {
            "id": "wtgg:c-farm:b22",
            "kind": "spoken",
            "speaker": "SELA",
            "line": "Walk us to the house, then. I'll keep them inside. I still need the field safe."
          },
          {
            "id": "wtgg:c-farm:b23",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They decline to escort or recommend staying here."
          },
          {
            "id": "wtgg:c-farm:b24",
            "kind": "spoken",
            "speaker": "SELA",
            "line": "Then tell my eldest where we are. He's waiting at the house."
          },
          {
            "id": "wtgg:c-farm:b25",
            "kind": "gmNote",
            "text": "Neither choice completes the contract. Record actual locations. Reunite the family only after travel or a message actually happens. She can lend the farm handcart if they reach the house and ask; no horse is invented. Carrying bodies/goods is the party's choice, not an automatic ceremony."
          }
        ],
        "enemies": [],
        "exits": [
          {
            "id": "wtgg:exit:c-farm:1",
            "description": "River or ridge route",
            "targetSceneId": "wtgg:scene:c-approach",
            "branchLabel": "12 -- The people behind the smoke"
          },
          {
            "id": "wtgg:exit:c-farm:2",
            "description": "Another giant approach",
            "targetSceneId": "wtgg:scene:c-burials",
            "branchLabel": "10 -- What was disturbed"
          },
          {
            "id": "wtgg:exit:c-farm:3",
            "description": "Final attempt abandoned",
            "targetSceneId": "wtgg:scene:c-report",
            "branchLabel": "19 -- A job under their own name"
          },
          {
            "id": "wtgg:exit:c-farm:4",
            "description": "Lasting field result",
            "targetSceneId": "wtgg:scene:c-harvest",
            "branchLabel": "18 -- The field opens"
          }
        ],
        "tags": [
          "farm"
        ],
        "schemaVersion": 2
      },
      {
        "id": "wtgg:scene:c-approach",
        "moduleId": "wtgg:module",
        "title": "12 -- The people behind the smoke",
        "subtitle": "A working camp with several approaches",
        "type": "set-piece",
        "kind": "scene",
        "blocks": [
          {
            "id": "wtgg:c-approach:b1",
            "kind": "gmNote",
            "text": "North approach comes down from the ring; south approach follows the river. Read the appropriate first paragraph, then ALWAYS read the central view and people paragraphs once they are observable. These establish the camp before questions. No reconnaissance roll gates the existence of captives or grave goods."
          },
          {
            "id": "wtgg:c-approach:b2",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "North approach from ridge."
          },
          {
            "id": "wtgg:c-approach:b3",
            "kind": "readAloud",
            "paragraphs": [
              "The path descends through pines. Ahead, canvas hangs between trunks over a table. A lookout stands beside the path with a sword at his hip. Beyond him, people move sacks between the table and a patch of stacked equipment."
            ]
          },
          {
            "id": "wtgg:c-approach:b4",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "South approach along river."
          },
          {
            "id": "wtgg:c-approach:b5",
            "kind": "readAloud",
            "paragraphs": [
              "The riverbank rises beside a stand of pines. Above it, a man sets a sack beside a canvas-covered table, then walks back toward the eastern trees. A sword hangs from his belt. Smoke drifts from a turf-covered coal pit farther into the clearing.",
              "Broad bronze arm-rings lie across the table beside a bone flute and pieces of amber. A man in reinforced leather checks them against a folded sheet. A Dwarven war-pick rests against his knee, and a locked chest sits under the table.",
              "To the east, rope links three people's wrists to a stake. Two carry sacks under an armed guard's eye. The third sits with a wrapped ankle and one boot loosened. Gray anvils are stitched on their clothing. Their swords and mace hang on a rack behind them."
            ]
          },
          {
            "id": "wtgg:c-approach:b6",
            "kind": "stop",
            "text": "What do you do? They have seen goods, armed workers, and restrained company members; allow observation, speech, stealth, an illusion, withdrawal, or attack. Do not name their deduction or declare anyone persuaded."
          },
          {
            "id": "wtgg:c-approach:b7",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**CAMP GEOGRAPHY / THE SAME FIVE ENEMIES**\nClearing roughly 60 feet across. Table and Hrodulf at center (0,0). Coals 10 feet west. Prisoner stake 20 feet east; weapon rack 10 feet farther east. North lookout 25 feet north. Sorter 20 feet south; carrier moves table-to-stake; east guard remains within 5 feet of prisoners. Southern riverbank begins 30 feet beyond the clearing, five feet down, knee-deep water. Pine trunks about two feet wide; line-of-sight blocking trunks give full cover, exposed limbs may be targeted normally.\nRope detail -- new physical staging for this continuation: each captive has a wrist binding and a 10-foot lead joining a common tether at the stake. Eydis sits at its base; Torsten and Runa move sacks within that 10-foot work area. The carrier, not a tethered captive, takes loads across the 20-foot gap to the table. Put the east guard within 5 feet of the stake; measure its actual 5-foot reach against a moving captive rather than granting reach over the whole work area. One cut at the common stake tether frees all three from the post; the second printed release action cuts their wrist bindings. This preserves the existing two-Major release procedure. The leads do not reach the rack or table. Pine trunks block actual sightlines, not an entire named approach by fiat.\nHrodulf + FOUR crew total. Carrier, lookout, sorter, prisoner guard are those four, not extra units. No arriving buyer, surprise patrol, dog, additional prisoner, or unseen reinforcements.\nWatch for one uninterrupted minute and give the work routine without a check: the carrier walks to the east sacks, loads one, returns to the table; the sorter separates objects into the two sacks; the lookout faces the north path, then checks toward the river; the east guard watches the working captives. A routine creates openings, not automatic stealth success.\nAt rest: alarm unwarned. A suspicious noise/failed bluff: lookout investigates the actual location, Hrodulf stops sorting. Open hostility: draw weapons and roll initiative. They protect the haul and block access; no automatic throat-cutting or captive execution. Track alarm and actual actor positions in notes.\nTheir visible packing is real work but no secret escape timer. If the PCs deliberately wait several hours/overnight after seeing packing, state what is loaded and where it is going before time advances; they can interrupt, follow, or let it leave. No indispensable clue disappears because the GM silently advanced a clock."
          },
          {
            "id": "wtgg:c-approach:b8",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They observe the routine for a minute."
          },
          {
            "id": "wtgg:c-approach:b9",
            "kind": "readAloud",
            "paragraphs": [
              "The carrier brings another sack from the prisoners to the table. The sorter wraps a bronze ring in cloth and places it inside. The lookout turns from the northern path to check the riverbank. At the stake, the seated captive pulls her loosened boot farther off her ankle."
            ]
          },
          {
            "id": "wtgg:c-approach:b10",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**PLAYER ABILITIES / NO INVENTED EXTRA POWERS**\nDetect Life supplies life signs within its actual spell range and duration, not names, guilt, or a map through every obstacle. Eight living people begin in this camp: five captors and three captives. Raised bodies are not additional living signatures. Light magic illuminates an actual place; it does not grant mental translation. The purchased shock rounds retain their actual enchantment and FP/charge rules. Illusions must match actual known spells and affected senses. Reanimation does not unlock Speak with Dead or restore a victim's memories. Keep the table's written character abilities; this sheet never upgrades them for a clue."
          }
        ],
        "enemies": [],
        "exits": [
          {
            "id": "wtgg:exit:c-approach:1",
            "description": "Social approach",
            "targetSceneId": "wtgg:scene:c-bargain",
            "branchLabel": "15 -- Hrodulf's business"
          },
          {
            "id": "wtgg:exit:c-approach:2",
            "description": "Covert contact/reconnaissance",
            "targetSceneId": "wtgg:scene:c-rescue",
            "branchLabel": "13 -- The other half of the company"
          },
          {
            "id": "wtgg:exit:c-approach:3",
            "description": "Attack",
            "targetSceneId": "wtgg:scene:c-camp-fight",
            "branchLabel": "16 -- The clearing under pressure"
          },
          {
            "id": "wtgg:exit:c-approach:4",
            "description": "Withdraw",
            "targetSceneId": "wtgg:scene:c-farm",
            "branchLabel": "11 -- Regroup without losing the thread"
          }
        ],
        "tags": [
          "approach"
        ],
        "schemaVersion": 2
      },
      {
        "id": "wtgg:scene:c-rescue",
        "moduleId": "wtgg:module",
        "title": "13 -- The other half of the company",
        "subtitle": "Recognition, news, release, and belongings",
        "type": "set-piece",
        "kind": "scene",
        "blocks": [
          {
            "id": "wtgg:c-rescue:b1",
            "kind": "gmNote",
            "text": "Run at the prisoners' side when a PC reaches speaking distance or deliberately signals. If they only see prisoners from afar, the opening in #approach already gave the important facts. Do not make a captive shout the solution across a guarded camp."
          },
          {
            "id": "wtgg:c-rescue:b2",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Torsten is still bound and can speak to the PC without an immediate interruption; they are close enough for a quiet exchange."
          },
          {
            "id": "wtgg:c-rescue:b3",
            "kind": "readAloud",
            "paragraphs": [
              "The standing man shifts his bound wrists against the rope. He looks from you to the path leading up to the stones."
            ]
          },
          {
            "id": "wtgg:c-rescue:b4",
            "kind": "spoken",
            "speaker": "TORSTEN",
            "line": "You came from the farm? Where are the others? Bersi, Hakon, Leif?"
          },
          {
            "id": "wtgg:c-rescue:b5",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Torsten is already free when the party first speaks with him; he has not yet learned the others' fate."
          },
          {
            "id": "wtgg:c-rescue:b6",
            "kind": "readAloud",
            "paragraphs": [
              "He looks from you to the path leading up to the stones."
            ]
          },
          {
            "id": "wtgg:c-rescue:b7",
            "kind": "spoken",
            "speaker": "TORSTEN",
            "line": "You came from the farm? Where are the others? Bersi, Hakon, Leif?"
          },
          {
            "id": "wtgg:c-rescue:b8",
            "kind": "stop",
            "text": "Let the party give the actual news, lie, evade, ask for identification, or propose a rescue. He cannot know the deaths until told or shown evidence."
          },
          {
            "id": "wtgg:c-rescue:b9",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They tell him the three are dead while Runa is still captive."
          },
          {
            "id": "wtgg:c-rescue:b10",
            "kind": "readAloud",
            "paragraphs": [
              "Torsten grips the stake. He lowers his head, then looks toward the other two prisoners."
            ]
          },
          {
            "id": "wtgg:c-rescue:b11",
            "kind": "spoken",
            "speaker": "TORSTEN",
            "line": "All three? ... Get Runa out. Eydis needs help walking."
          },
          {
            "id": "wtgg:c-rescue:b12",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They tell Torsten the three are dead after the captives have been released."
          },
          {
            "id": "wtgg:c-rescue:b13",
            "kind": "readAloud",
            "paragraphs": [
              "He lowers his head, then looks toward the other two."
            ]
          },
          {
            "id": "wtgg:c-rescue:b14",
            "kind": "spoken",
            "speaker": "TORSTEN",
            "line": "All three? ..."
          },
          {
            "id": "wtgg:c-rescue:b15",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "After that news, Eydis still needs walking support and nobody has offered it."
          },
          {
            "id": "wtgg:c-rescue:b16",
            "kind": "spoken",
            "speaker": "TORSTEN",
            "line": "Eydis needs help walking."
          },
          {
            "id": "wtgg:c-rescue:b17",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They ask what happened to these three, whether before or after release."
          },
          {
            "id": "wtgg:c-rescue:b18",
            "kind": "spoken",
            "speaker": "RUNA",
            "line": "They caught us after we split up. We surrendered. They've had us carrying those sacks ever since."
          },
          {
            "id": "wtgg:c-rescue:b19",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Runa is still bound after that account."
          },
          {
            "id": "wtgg:c-rescue:b20",
            "kind": "spoken",
            "speaker": "RUNA",
            "line": "Cut this, please. Our weapons are behind the stake."
          },
          {
            "id": "wtgg:c-rescue:b21",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They ask how the company was separated or how the prisoners were taken."
          },
          {
            "id": "wtgg:c-rescue:b22",
            "kind": "spoken",
            "speaker": "RUNA",
            "line": "They cut into the tents after dark. Three got away."
          },
          {
            "id": "wtgg:c-rescue:b23",
            "kind": "gmNote",
            "text": "This restores the earlier module's prepared raid account, with the obsolete claim that the escapees are waiting at the hut omitted. The three escaped men are now the three witnessed dead at the stones. Runa knows her own capture, not their later plans or decisions. Do not improvise a second separation, additional captives, or a claim that she witnessed their final fight."
          },
          {
            "id": "wtgg:c-rescue:b24",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They ask what the captives actually saw of the grave goods or tools."
          },
          {
            "id": "wtgg:c-rescue:b25",
            "kind": "spoken",
            "speaker": "RUNA",
            "line": "They unloaded the rings here. The spades have the same tooth stamped in the straps."
          },
          {
            "id": "wtgg:c-rescue:b26",
            "kind": "gmNote",
            "text": "Her testimony establishes unloading and identifiable tools at this camp. The stock sheet and ridge observations supply the excavation case. She did not witness the initial digging four nights ago; do not turn her into an eyewitness to every stage of the robbery. Her account is available after release as well as before it, without another roll."
          },
          {
            "id": "wtgg:c-rescue:b27",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They hide the news, or genuinely do not know identities, while Torsten is still captive."
          },
          {
            "id": "wtgg:c-rescue:b28",
            "kind": "spoken",
            "speaker": "TORSTEN",
            "line": "Then get us out and we'll look for them. That's Runa. Eydis is the one sitting down."
          },
          {
            "id": "wtgg:c-rescue:b29",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Torsten is free, they have not given him the news, and the other two still need identifying."
          },
          {
            "id": "wtgg:c-rescue:b30",
            "kind": "spoken",
            "speaker": "TORSTEN",
            "line": "That's Runa. Eydis is the one sitting down."
          },
          {
            "id": "wtgg:c-rescue:b31",
            "kind": "gmNote",
            "text": "Use the second sentence only while Eydis is actually seated. A freed group already on the road does not return to the stake to perform an introduction."
          },
          {
            "id": "wtgg:c-rescue:b32",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They reach Eydis."
          },
          {
            "id": "wtgg:c-rescue:b33",
            "kind": "spoken",
            "speaker": "EYDIS",
            "line": "My ankle turned on the ridge. I can stand if someone takes my arm."
          },
          {
            "id": "wtgg:c-rescue:b34",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**COVERT APPROACH / RELEASE / EXIT -- LOCAL PROCEDURE**\nOnly PCs crossing watched ground roll. Opposed PC Agility against watcher's Guile 12, both testing their own stats. One succeeds -> that side wins; both succeed -> lower die wins; ties reroll; both fail -> position holds. A real distraction gives Advantage on that crossing; permission or complete visual obstruction can remove the contest. A failed crossing means a guard addresses the actual disturbance, not teleporting every enemy to it. Equality on a winning PC check reaches cover noisily; natural 20 exposes that PC's location.\nKnife at accessible rope: one Major cuts stake link, second Major cuts the wrists free for all three. By hand: Major Hard Agility (-4) for each step. Success/equality opens, equality noisy; failure holds; natural 20 tightens the knot and alerts nearby actual watcher. Rope cutting alone wakes nobody and restores no HP.\nRearm: Minor per person to draw from the rack within 5 feet. Torsten/Runa may fight only when free, armed, and invited; two allies maximum. Eydis is a rescue patient, not an extra fighter. Her movement: 15 feet per Minor with helper also spending Minor; 5 feet alone; carrying gives helper normal 30-foot Minor with occupied hands. A meaningful actual healing spell/potion may treat the ankle; use the real effect, not a free restoration for finishing a scene.\nLeave by southern trees/river or northern path. Check stealth only across a still-watched leg. No repeat group rolls every five feet. If discovered, guards draw/block; #bargain remains available before anyone attacks. Actual attack -> #camp-fight. Hidden PCs keep the ability's actual break conditions; ordinary spellcasting/attacking can reveal them."
          },
          {
            "id": "wtgg:c-rescue:b35",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "A guard detects the rescue before combat."
          },
          {
            "id": "wtgg:c-rescue:b36",
            "kind": "spoken",
            "speaker": "GUARD",
            "line": "Step away from the rope. Hands where I can see them."
          },
          {
            "id": "wtgg:c-rescue:b37",
            "kind": "stop",
            "text": "Talk, stop, use an ability, flee, or attack? Resolve this moment rather than imposing completed capture."
          },
          {
            "id": "wtgg:c-rescue:b38",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "A marked spare company cloak is visibly worn/carried by a PC, or a PC openly presents a known Anvil possession."
          },
          {
            "id": "wtgg:c-rescue:b39",
            "kind": "spoken",
            "speaker": "RUNA",
            "line": "That's ours. Did you get it from the tents? We left our food there."
          },
          {
            "id": "wtgg:c-rescue:b40",
            "kind": "gmNote",
            "text": "Recognition is limited to what she can see. Two cloaks went with the farmer; the party does not magically retain all three. Recognition can support trust and a request for food. It does not reveal hidden purses or prove the PCs killed anyone. A guard may also notice a badge in plain view; disguising as an Anvil here identifies a prisoner/rescuer, not a camp employee."
          },
          {
            "id": "wtgg:c-rescue:b41",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "After release, a survivor actually learns the PCs hold their personal purses."
          },
          {
            "id": "wtgg:c-rescue:b42",
            "kind": "spoken",
            "speaker": "TORSTEN",
            "line": "Keep the company food if you need it. My pay's in my purse. I'll need that back."
          },
          {
            "id": "wtgg:c-rescue:b43",
            "kind": "stop",
            "text": "They can return money, bargain, deny possession, or refuse. Do not search the PCs by fiat. A truthful return is accepted; a refusal makes that survivor less willing to carry goods or volunteer combat help, not an instant attack or revoked steward payment. The stolen 120 is separate from the session's treasure budget."
          },
          {
            "id": "wtgg:c-rescue:b44",
            "kind": "gmNote",
            "text": "Choose one departure passage matching actual people, weapons, and injury. Read it once; the alternatives do not replay the exit."
          },
          {
            "id": "wtgg:c-rescue:b45",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Released survivors are leaving with the PCs; Runa is alive, free, conscious, and present, their weapons are still on the rack, and Eydis has been offered support."
          },
          {
            "id": "wtgg:c-rescue:b46",
            "kind": "readAloud",
            "paragraphs": [
              "Runa takes the weapons from the rack that the survivors can carry. Eydis reaches for the offered support, keeping her swollen ankle above the ground."
            ]
          },
          {
            "id": "wtgg:c-rescue:b47",
            "kind": "spoken",
            "speaker": "EYDIS",
            "line": "The river path. Slowly, please."
          },
          {
            "id": "wtgg:c-rescue:b48",
            "kind": "gmNote",
            "text": "If she is unconscious, dying, absent, or dead, use her actual state and the downed procedure printed in the combat scene; do not read a successful walking exit."
          },
          {
            "id": "wtgg:c-rescue:b49",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Eydis is alive, free, conscious, and offered support; the group already recovered its weapons or is clear of the camp."
          },
          {
            "id": "wtgg:c-rescue:b50",
            "kind": "readAloud",
            "paragraphs": [
              "Eydis reaches for the offered support, keeping her swollen ankle above the ground."
            ]
          },
          {
            "id": "wtgg:c-rescue:b51",
            "kind": "spoken",
            "speaker": "EYDIS",
            "line": "The river path. Slowly, please."
          },
          {
            "id": "wtgg:c-rescue:b52",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Eydis is alive, free, conscious, and offered support, but Runa is absent or dead."
          },
          {
            "id": "wtgg:c-rescue:b53",
            "kind": "readAloud",
            "paragraphs": [
              "Eydis reaches for the offered arm and raises her injured foot above the ground."
            ]
          },
          {
            "id": "wtgg:c-rescue:b54",
            "kind": "spoken",
            "speaker": "EYDIS",
            "line": "The river path. Slowly, please."
          }
        ],
        "enemies": [],
        "exits": [
          {
            "id": "wtgg:exit:c-rescue:1",
            "description": "Goods/records",
            "targetSceneId": "wtgg:scene:c-evidence",
            "branchLabel": "14 -- The sorting table"
          },
          {
            "id": "wtgg:exit:c-rescue:2",
            "description": "Confrontation",
            "targetSceneId": "wtgg:scene:c-bargain",
            "branchLabel": "15 -- Hrodulf's business"
          },
          {
            "id": "wtgg:exit:c-rescue:3",
            "description": "Actual safe exit",
            "targetSceneId": "wtgg:scene:c-farm",
            "branchLabel": "11 -- Regroup without losing the thread"
          },
          {
            "id": "wtgg:exit:c-rescue:4",
            "description": "They can choose an honest partial report",
            "targetSceneId": "wtgg:scene:c-report",
            "branchLabel": "19 -- A job under their own name"
          }
        ],
        "tags": [
          "rescue"
        ],
        "schemaVersion": 2
      },
      {
        "id": "wtgg:scene:c-evidence",
        "moduleId": "wtgg:module",
        "title": "14 -- The sorting table",
        "subtitle": "A case that works without a confession",
        "type": "set-piece",
        "kind": "scene",
        "blocks": [
          {
            "id": "wtgg:c-evidence:b1",
            "kind": "gmNote",
            "text": "These objects stay in fixed places. Describe what is visible when reached or illuminated. A correct deliberate comparison succeeds; rolls concern access under pressure, not whether the evidence exists. If they bypassed the ridge entirely, this location must still reveal that the haul came out of graves."
          },
          {
            "id": "wtgg:c-evidence:b2",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "The sorting table can be examined safely or from close enough cover to see its contents."
          },
          {
            "id": "wtgg:c-evidence:b3",
            "kind": "readAloud",
            "paragraphs": [
              "Soil clings inside the broad bronze rings. A bone flute lies beside worked amber and a folded stock sheet. Human-sized spades lean against the table, each with a tooth stamped into its leather wrist strap. One ring ends in a jagged break. Two sacks stand beneath the canvas, and a locked chest sits under the boards."
            ]
          },
          {
            "id": "wtgg:c-evidence:b4",
            "kind": "stop",
            "text": "Let them examine, compare, take, bargain, or leave. Give the stock sheet's short gist when they read it, then offer the full handout. No roll gates legible ordinary writing or these objects."
          },
          {
            "id": "wtgg:c-evidence:b5",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They read the stock sheet."
          },
          {
            "id": "wtgg:c-evidence:b6",
            "kind": "readAloud",
            "paragraphs": [
              "The sheet lists two loads taken from the Hearthfeld ridge graves. It records a third grave opened with its goods left behind, then a prospective buyer's price in Solitude."
            ]
          },
          {
            "id": "wtgg:c-evidence:b7",
            "kind": "handout",
            "title": "STOCK SHEET",
            "text": "HEARTHFELD RIDGE -- TWO LOADS LIFTED\nFour broad bronze arm-rings. One carved bone flute. Eight worked amber pieces.\nThird grave opened; goods left when the giants returned.\nSolitude buyers: four thousand for the complete three-grave lot, subject to inspection.\nKeep trade coin separate. Prisoners' blades at the east rack."
          },
          {
            "id": "wtgg:c-evidence:b8",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They examine the route note beside the stock sheet."
          },
          {
            "id": "wtgg:c-evidence:b9",
            "kind": "readAloud",
            "paragraphs": [
              "A smaller account sheet lists timber and carriage charges, a delayed southern delivery, and a revised route through Whiterun toward Solitude. Transport costs have been crossed out and written higher."
            ]
          },
          {
            "id": "wtgg:c-evidence:b10",
            "kind": "handout",
            "title": "ROUTE ACCOUNT",
            "text": "CARRIAGE / LOCAL BUSINESS RECORD -- NEW PREPARATION\nSouthern timber delivery delayed at the Falkreath road checks.\nReplace damaged packing boards locally. Keep the sound ones.\nCarry ridge stock through Whiterun, then west toward the Solitude buyers.\nObtain the carrier's new price before promising a delivery day.\nNo further advance to the digging crew until the lots are packed."
          },
          {
            "id": "wtgg:c-evidence:b11",
            "kind": "gmNote",
            "text": "This local record shows the already-established Falkreath road disruption through a broker's business. It is not proof the Thalmor commissioned grave robbery, a new customs law, a precise inflation multiplier, or knowledge of the main party's current crisis. No date is printed that falsely synchronizes the anthology with an unverified main-campaign chapter. Existing conflicting Lantern reports remain rumors, not a magical tracking service."
          },
          {
            "id": "wtgg:c-evidence:b12",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They compare the spade with the ridge tool, or the broken ring with the field fragment if they actually found it."
          },
          {
            "id": "wtgg:c-evidence:b13",
            "kind": "readAloud",
            "paragraphs": [
              "The stamped tooth on the strap matches the broken spade's mark."
            ]
          },
          {
            "id": "wtgg:c-evidence:b14",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "The broken ring and fragment are both present and deliberately fitted."
          },
          {
            "id": "wtgg:c-evidence:b15",
            "kind": "readAloud",
            "paragraphs": [
              "The bronze edges fit. The worked band continues across the join."
            ]
          },
          {
            "id": "wtgg:c-evidence:b16",
            "kind": "gmNote",
            "text": "Read only the comparison they can actually perform. The party never obtained the field fragment in the recorded session; do not hand it to them retroactively. Tools, stock sheet, surviving prisoners, and the actual grave objects are independent evidence routes."
          },
          {
            "id": "wtgg:c-evidence:b17",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**ACCESS / CHEST / PICKPOCKETING**\nTable search or sheet retrieval with permission/unwatched: ordinary interaction, no roll. Watched covert theft: opposed PC Agility versus watcher Guile 12, both own TN; lower successful die wins, ties reroll, both fail current position. Failure alerts that watcher; they demand return/explanation. Hrodulf's purse/key stay on him unless taken.\nChest: key on Hrodulf; Standard Guile (0) with lockpick. Success opens; equality opens noisily; failure breaks a pick unless a perk prevents it; natural 20 jams the lock and makes noise. Forcing: Major Standard Might (0); success/equality opens noisily; failure holds; natural 20 bruises hand for 1 physical, DR applies. These are local complications from the existing edition. No unlisted trap.\nThe chest holds 3,700 septims. Hrodulf's purse holds 300; full cash 4,000 TOTAL, not plus another 300. A successful search obtains only accessible items; a deal can leave all cash with him. War-pick player damage 8, one-handed Might, ignores 2 DR per hit. His NPC attack's 20 is not its loot base.\nBurial sacks: two, 30 pounds each; together four rings, one flute, eight amber. Third grave still holds two rings, another flute, four amber. Returning both stolen sacks is full restitution; a negotiated handful is partial. The buyer quote is speculative complete-lot value, not cash in the chest, not an automatic sale, and not new tax-free income."
          },
          {
            "id": "wtgg:c-evidence:b18",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They actually open the secured chest."
          },
          {
            "id": "wtgg:c-evidence:b19",
            "kind": "readAloud",
            "paragraphs": [
              "Rows of septims fill the chest beneath the table. Counted together, they total three thousand seven hundred. The broker's personal purse is separate."
            ]
          },
          {
            "id": "wtgg:c-evidence:b20",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They open both secured burial sacks."
          },
          {
            "id": "wtgg:c-evidence:b21",
            "kind": "readAloud",
            "paragraphs": [
              "The sacks hold four broad bronze rings, a bone flute, and eight pieces of worked amber. Soil gathers in their seams and underneath the ornaments."
            ]
          }
        ],
        "enemies": [],
        "exits": [
          {
            "id": "wtgg:exit:c-evidence:1",
            "description": "Evidence in hand",
            "targetSceneId": "wtgg:scene:c-bargain",
            "branchLabel": "15 -- Hrodulf's business"
          },
          {
            "id": "wtgg:exit:c-evidence:2",
            "description": "If confronted stealing",
            "targetSceneId": "wtgg:scene:c-bargain",
            "branchLabel": "15 -- Hrodulf's business"
          }
        ],
        "tags": [
          "evidence"
        ],
        "schemaVersion": 2
      },
      {
        "id": "wtgg:scene:c-bargain",
        "moduleId": "wtgg:module",
        "title": "15 -- Hrodulf's business",
        "subtitle": "Offers, leverage, disagreement, and actual reactions",
        "type": "set-piece",
        "kind": "scene",
        "blocks": [
          {
            "id": "wtgg:c-bargain:b1",
            "kind": "gmNote",
            "text": "Hrodulf speaks only after noticing/being approached by the PCs. He knows his excavation, captives, stock, and buyers. He does not know their secret purses, their exact giant exchange, the dead Anvils' current fate, or the Thalmor's private intentions. Crew roles remain the five-person roster, not social reinforcements."
          },
          {
            "id": "wtgg:c-bargain:b2",
            "kind": "readAloud",
            "paragraphs": [
              "The man beside the table puts one hand on the war-pick. His other hand stays across the stock sheet."
            ]
          },
          {
            "id": "wtgg:c-bargain:b3",
            "kind": "spoken",
            "speaker": "HRODULF",
            "line": "Who's paying you? The steward? Put your weapons down and tell me what you want."
          },
          {
            "id": "wtgg:c-bargain:b4",
            "kind": "stop",
            "text": "Let them answer. Claiming employment, proposing trade, asking about the people, accusing him, or bluffing are all playable. Refusing to lower weapons does not itself mean the PCs attack."
          },
          {
            "id": "wtgg:c-bargain:b5",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They seek the prisoners or show a company badge."
          },
          {
            "id": "wtgg:c-bargain:b6",
            "kind": "spoken",
            "speaker": "HRODULF",
            "line": "They came after us. They can leave when the packing's done."
          },
          {
            "id": "wtgg:c-bargain:b7",
            "kind": "gmNote",
            "text": "This is his justification, not a true debt or GM endorsement. He will release people for a credible arrangement because holding them was labor expediency, not a sacred objective. Players can attack, expose the lie, offer labor/payment, bluff authority, or extract them covertly."
          },
          {
            "id": "wtgg:c-bargain:b8",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They seek immediate release or ask for a price or concrete terms for the prisoners separately from the grave goods."
          },
          {
            "id": "wtgg:c-bargain:b9",
            "kind": "readAloud",
            "paragraphs": [
              "The price for all three prisoners and their own weapons is one hundred septims in total."
            ]
          },
          {
            "id": "wtgg:c-bargain:b10",
            "kind": "stop",
            "text": "This is the existing opening offer, not an accepted payment. They may pay, counteroffer, refuse, or seek another approach. Deliver the price before expecting them to name a payment. No mandatory speech roll for an ordinary accepted exchange."
          },
          {
            "id": "wtgg:c-bargain:b11",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They demand the haul / accuse him using actual evidence."
          },
          {
            "id": "wtgg:c-bargain:b12",
            "kind": "spoken",
            "speaker": "HRODULF",
            "line": "Yes, we dug it up. I have buyers for it. What are you offering?"
          },
          {
            "id": "wtgg:c-bargain:b13",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They say the giant must have its possessions back, without leverage or a concrete offer."
          },
          {
            "id": "wtgg:c-bargain:b14",
            "kind": "spoken",
            "speaker": "HRODULF",
            "line": "Then buy them. Four thousand for the two sacks. The workers go with you."
          },
          {
            "id": "wtgg:c-bargain:b15",
            "kind": "gmNote",
            "text": "This is a negotiable opening price, not a demand that they possess that money. Buying the bags does not transfer the cash chest or pick. He will take less to avoid danger; use the leverage procedure below. Do not announce a predetermined combat after a rejected price."
          },
          {
            "id": "wtgg:c-bargain:b16",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They propose working together or keeping the giant away while the crew leaves."
          },
          {
            "id": "wtgg:c-bargain:b17",
            "kind": "readAloud",
            "paragraphs": [
              "Hrodulf draws a line between the objects on the table with one finger."
            ]
          },
          {
            "id": "wtgg:c-bargain:b18",
            "kind": "spoken",
            "speaker": "HRODULF",
            "line": "A third of the goods. Help us get the rest out. The workers go once we're clear."
          },
          {
            "id": "wtgg:c-bargain:b19",
            "kind": "stop",
            "text": "A genuine complicity offer can work; record goods, release timing, and safe departure before anyone acts. Captives are not automatically freed merely because he spoke. Default third: broken ring, one flute, three amber; he retains other relics, cash, pick. The remaining field problem still exists."
          },
          {
            "id": "wtgg:c-bargain:b20",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**SOCIAL LEVERAGE -- DECIDE WHAT IS ACTUALLY AT STAKE**\nAn honest small exchange he wants, such as supplies or a direct prisoner ransom within a credible bargain, can be agreed without a roll. His initial prisoner release price if separately asked: 100 TOTAL for the three, with their own weapons; new negotiable opening, not their legal value or a mandatory expense.\nPlausible uncertain bluff/negotiation: Hard Guile (-4). Threat must be credible; a lone claim that the Jarl has thousands of guards standing offscreen is not made true by a die. Actual leverage includes proof and a credible plan to bring the case to court, two freed/rearmed Anvils, loss of guards, blocked exit, or PCs controlling the bags. These can give Advantage; do not add an invisible higher TN because you dislike the proposed outcome.\nSuccess: he accepts the concrete reasonable demand being tested. For whole-haul surrender under strong leverage, relics and prisoners are released for his departure; cash/pick remain his unless explicitly part of the demand. Equality: same result but he requires a clear departure lane before handover. Failure: current offer stands, players may change approach, withdraw, or act; it does not start combat. Natural 20: he refuses further bargaining on that pretext and orders them away; attacking/pressing triggers initiative, withdrawing remains possible.\nGetting all goods, cash, and the pick by speech requires leverage over those things, not an automatic jackpot for saying 'guards'. If uncertain use the same Hard Guile (-4), declare exact stakes first. A successful coercive surrender is respected. New demands after agreement reopen negotiation; no hidden betrayal by default."
          },
          {
            "id": "wtgg:c-bargain:b21",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "He accepts surrendering the sacks for safe departure."
          },
          {
            "id": "wtgg:c-bargain:b22",
            "kind": "readAloud",
            "paragraphs": [
              "Hrodulf moves his hand off the stock sheet. He nudges the two sacks toward the edge of the canvas with his boot."
            ]
          },
          {
            "id": "wtgg:c-bargain:b23",
            "kind": "spoken",
            "speaker": "HRODULF",
            "line": "The sacks and the three workers. Leave the river path open."
          },
          {
            "id": "wtgg:c-bargain:b24",
            "kind": "stop",
            "text": "Confirm terms. If the roll/agreement also included coin or pick, state those additional surrendered items explicitly. Resolve handover, restraint release, and departure with actual movement, not a cutscene that disarms the PCs."
          },
          {
            "id": "wtgg:c-bargain:b25",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "He accepts buying the prisoners separately."
          },
          {
            "id": "wtgg:c-bargain:b26",
            "kind": "spoken",
            "speaker": "HRODULF",
            "line": "Pay it here. They take their weapons and walk."
          },
          {
            "id": "wtgg:c-bargain:b27",
            "kind": "gmNote",
            "text": "Money and release happen together. He keeps the grave goods; this alone does not end the field threat. A rescue without robbery is still a meaningful result."
          },
          {
            "id": "wtgg:c-bargain:b28",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "PCs bring news of the three dead Anvils."
          },
          {
            "id": "wtgg:c-bargain:b29",
            "kind": "readAloud",
            "paragraphs": [
              "The carrier stops with a sack against his hip. Hrodulf looks toward the northern path."
            ]
          },
          {
            "id": "wtgg:c-bargain:b30",
            "kind": "spoken",
            "speaker": "HRODULF",
            "line": "Then you know what that giant does. Are you here for the survivors, or my stock?"
          },
          {
            "id": "wtgg:c-bargain:b31",
            "kind": "gmNote",
            "text": "He seeks the demand and protects his business. He cannot describe the fight he did not see. His crew may be shaken but does not receive automatic fear immunity or an automatic surrender."
          },
          {
            "id": "wtgg:c-bargain:b32",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They warn the crew and offer them departure while Hrodulf is obstructing a concrete agreement."
          },
          {
            "id": "wtgg:c-bargain:b33",
            "kind": "spoken",
            "speaker": "LOOKOUT",
            "line": "Do we get to leave? With our own gear?"
          },
          {
            "id": "wtgg:c-bargain:b34",
            "kind": "gmNote",
            "text": "A credible exit can get an uncertain guard to stand aside: Standard Guile (0), success/equality holds position rather than attacks; equality insists on leaving immediately, failure remains with Hrodulf, natural 20 calls attention to the attempted split. This does not secretly make all four into party allies. Unpaid-crew tension in the route note is bargaining material, not an instant rebellion switch."
          },
          {
            "id": "wtgg:c-bargain:b35",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "A deal is rejected and they withdraw without attacking."
          },
          {
            "id": "wtgg:c-bargain:b36",
            "kind": "spoken",
            "speaker": "HRODULF",
            "line": "Then leave the stock alone."
          },
          {
            "id": "wtgg:c-bargain:b37",
            "kind": "gmNote",
            "text": "He watches them go; no free arrow at their backs. Actual theft discovered during withdrawal is a different situation, with a demand to return it and a chance to respond."
          },
          {
            "id": "wtgg:c-bargain:b38",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Violence actually starts."
          },
          {
            "id": "wtgg:c-bargain:b39",
            "kind": "readAloud",
            "paragraphs": [
              "Hrodulf pushes his chair back and takes the pick in both hands. The armed workers turn toward the threat."
            ]
          }
        ],
        "enemies": [],
        "exits": [
          {
            "id": "wtgg:exit:c-bargain:1",
            "description": "Accepted actual terms",
            "targetSceneId": "wtgg:scene:c-rescue",
            "branchLabel": "13 -- The other half of the company"
          },
          {
            "id": "wtgg:exit:c-bargain:2",
            "description": "Actual fight",
            "targetSceneId": "wtgg:scene:c-camp-fight",
            "branchLabel": "16 -- The clearing under pressure"
          },
          {
            "id": "wtgg:exit:c-bargain:3",
            "description": "Withdraw",
            "targetSceneId": "wtgg:scene:c-farm",
            "branchLabel": "11 -- Regroup without losing the thread"
          }
        ],
        "tags": [
          "bargain"
        ],
        "schemaVersion": 2
      },
      {
        "id": "wtgg:scene:c-camp-fight",
        "moduleId": "wtgg:module",
        "title": "16 -- The clearing under pressure",
        "subtitle": "Existing balance, local terrain, surrender, and escape",
        "type": "combat",
        "kind": "combat",
        "blocks": [
          {
            "id": "wtgg:c-camp-fight:b1",
            "kind": "gmNote",
            "text": "Only use when violence actually starts. Count remaining guards, freed allies, injuries, spent actions, and current positions. The giant stays at the ridge. Hrodulf has no phase bar or villain action. No added enemy to compensate for good infiltration."
          },
          {
            "id": "wtgg:c-camp-fight:b2",
            "kind": "readAloud",
            "paragraphs": [
              "The war-pick comes up beside the sorting table. The coal pit glows beneath its turf cover. To the east, rope runs from the stake toward the captives; their weapons hang behind it. Trees border the path down to the river."
            ]
          },
          {
            "id": "wtgg:c-camp-fight:b3",
            "kind": "gmNote",
            "text": "If the captives are already free, replace the rope sentence with their actual visible position; never conjure bound duplicates. Roll initiative once, d20 low first, tied participants reroll; if combat already runs, keep the order."
          },
          {
            "id": "wtgg:c-camp-fight:b4",
            "kind": "combat",
            "combat": {
              "title": "The Barrow-Pickers",
              "objective": "Hrodulf 200 HP / DR 11. Four diggers 70 HP / DR 7 each. At 66 HP he offers a split, once.",
              "statusFields": [
                {
                  "id": "pines-diggers",
                  "label": "Active diggers",
                  "initial": "4"
                }
              ],
              "trackers": [
                {
                  "id": "pines-hrodulf",
                  "title": "Hrodulf",
                  "description": "War-pick 20 / crit 40, ignores 2 DR. Offer at 66 HP or less, once.",
                  "targets": [
                    {
                      "id": "pines-hrodulf-target",
                      "label": "Hrodulf",
                      "maxHp": 200
                    }
                  ],
                  "quickDamage": [
                    13,
                    20,
                    40
                  ],
                  "threshold": 1,
                  "thresholdText": "At 66 HP or less — make the split offer once.",
                  "triggerBlocks": [
                    {
                      "id": "hrodulf-offer-read",
                      "kind": "readAloud",
                      "paragraphs": [
                        "Hrodulf backs against the table. He lowers the pickhead toward the ground and holds his free hand out."
                      ]
                    },
                    {
                      "id": "hrodulf-offer-line",
                      "kind": "spoken",
                      "speaker": "Hrodulf",
                      "line": "Enough. A third of the goods. Take your people. Let us walk out with the rest."
                    },
                    {
                      "id": "hrodulf-offer-note",
                      "kind": "stop",
                      "text": "Accept, counteroffer, refuse, or keep attacking. Acceptance holds only while the deal is observed: all three captives released now; default share is the bone flute, the broken bronze ring, and three amber pieces. Time and spent actions do not reset."
                    }
                  ]
                },
                {
                  "id": "pines-diggers",
                  "title": "The four diggers",
                  "description": "70 HP / DR 7 each. Melee 13 / crit 26. Flee at two or fewer active.",
                  "targets": [
                    {
                      "id": "pines-digger-a",
                      "label": "Digger A",
                      "maxHp": 70
                    },
                    {
                      "id": "pines-digger-b",
                      "label": "Digger B",
                      "maxHp": 70
                    },
                    {
                      "id": "pines-digger-c",
                      "label": "Digger C",
                      "maxHp": 70
                    },
                    {
                      "id": "pines-digger-d",
                      "label": "Digger D",
                      "maxHp": 70
                    }
                  ],
                  "quickDamage": [
                    13,
                    26
                  ],
                  "threshold": 2,
                  "thresholdText": "Two or fewer diggers remain — the survivors withdraw on their turns.",
                  "triggerBlocks": [
                    {
                      "id": "pines-flee-read",
                      "kind": "readAloud",
                      "paragraphs": [
                        "The surviving diggers turn toward the trees with their swords still in hand."
                      ]
                    }
                  ]
                }
              ],
              "cards": [
                {
                  "id": "pines-card",
                  "title": "Stat lines",
                  "items": [
                    "Hrodulf: Might 17 · Agility 15 · Magic 8 · Guile 12 · HP 200 · DR 11.",
                    "Hrodulf, Bury the Lead (Major): target Hard Agility (-4) or Blinded — disadvantage on attacks until end of their next turn.",
                    "Each digger: Might 16 · Agility 14 · Magic 8 · Guile 12 · HP 70 · DR 7. Melee 13 / crit 26.",
                    "Freed Anvils (at most two): Torsten and Runa, M16/A14/Magic8/G12, HP 70, DR 7, melee 13. Eydis is not a third fighter.",
                    "Coals: 2 fire per turn in contact, DR applies. Overturn the table: Major Standard Might (0)."
                  ]
                }
              ],
              "enemies": [
                "hrodulf",
                "barrow-picker"
              ],
              "triggers": []
            }
          },
          {
            "id": "wtgg:c-camp-fight:b5",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**TERRAIN AND PRACTICAL ACTIONS**\nMelee reach 5 feet, one Minor moves to any location on the field. Riverbank 5 feet down: crossing the water is its own Minor, no automatic drowning. Pine trunks fully blocking line of sight provide full cover. Major Standard Might (0) overturns table; equality noisy, failure stays upright, natural 20 knocks the actor Prone instead. Table shields only what its real position obscures. Coals 2 fire each turn of contact; DR applies, leaving ends it. Shove Major opposed Might versus target Might or Agility: winner pushes 5 feet; ties reroll, both fail hold position.\nKnife release at accessible rope: one Major stake link, another Major wrists; all three can be freed by those two steps. Bare hands: Hard Agility (-4) per step, equality noisy, failure holds, natural 20 alerts nearby watcher. Each free person uses Minor to draw own accessible weapon. Torsten/Runa join only if invited; Eydis needs aid. Supported Eydis/helper each Minor -> 15 feet; carried -> helper30, hands occupied. Do not kill a hostage as an automatic response to combat."
          },
          {
            "id": "wtgg:c-camp-fight:b6",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Hrodulf reaches 66 HP or below, remains conscious, and has not already made this offer."
          },
          {
            "id": "wtgg:c-camp-fight:b7",
            "kind": "readAloud",
            "paragraphs": [
              "Hrodulf backs against the table and holds his free hand out. The pickhead drops toward the ground."
            ]
          },
          {
            "id": "wtgg:c-camp-fight:b8",
            "kind": "spoken",
            "speaker": "HRODULF",
            "line": "Enough. A third of the goods. Take the workers. Let us leave with the rest."
          },
          {
            "id": "wtgg:c-camp-fight:b9",
            "kind": "stop",
            "text": "Resolve their answer at the current point in the turn. Acceptance pauses attacks while terms are honored; it does not reset HP or give him a free move. Default relic share: broken ring, flute, three amber, all surviving captives released; cash and pick retained unless demanded successfully. Under strong leverage a Hard Guile (-4) counter can obtain all bags and cash: success agrees, equality keeps his pick, failure original offer remains, natural 20 he attempts a normal retreat on his turn. Killing him before this point prevents the offer; no resurrection to deliver it."
          },
          {
            "id": "wtgg:c-camp-fight:b10",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Two or fewer Barrow-Pickers remain active."
          },
          {
            "id": "wtgg:c-camp-fight:b11",
            "kind": "readAloud",
            "paragraphs": [
              "The surviving workers look toward the river path and begin backing toward the trees."
            ]
          },
          {
            "id": "wtgg:c-camp-fight:b12",
            "kind": "gmNote",
            "text": "Their actual turns and engagement rules govern withdrawal. If blocked and offered credible surrender, they can lay down weapons; no compulsory suicidal charge. Their belongings don't vanish. Hrodulf's decision remains his own."
          },
          {
            "id": "wtgg:c-camp-fight:b13",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Hrodulf surrenders the camp or falls and the active opposition is resolved."
          },
          {
            "id": "wtgg:c-camp-fight:b14",
            "kind": "readAloud",
            "paragraphs": [
              "The sorting table stands beneath its canvas. Bronze and amber lie across the boards. The two sacks rest beside it, and the chest remains underneath."
            ]
          },
          {
            "id": "wtgg:c-camp-fight:b15",
            "kind": "gmNote",
            "text": "Omit any goods already removed. Resolve downed people before counting coin. Ask who frees people, treats injuries, secures weapons, and opens the chest. Actual victory neither cuts ropes nor transfers inventory automatically."
          },
          {
            "id": "wtgg:c-camp-fight:b16",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "PCs are actually clear of pursuit after retreat."
          },
          {
            "id": "wtgg:c-camp-fight:b17",
            "kind": "readAloud",
            "paragraphs": [
              "The river runs beside the trees ahead. Behind you, smoke still rises over the sorting shelter. The ridge path and the downstream track lead away from the clearing."
            ]
          },
          {
            "id": "wtgg:c-camp-fight:b18",
            "kind": "stop",
            "text": "Regroup, return for people/goods, or report? Keep actual casualties and resources. A successful rescue may remain successful despite retreat from the money."
          },
          {
            "id": "wtgg:c-camp-fight:b19",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Defeated survivors explicitly surrender to Hrodulf."
          },
          {
            "id": "wtgg:c-camp-fight:b20",
            "kind": "readAloud",
            "paragraphs": [
              "Hrodulf plants the pick beside the table and points to the prisoner stake."
            ]
          },
          {
            "id": "wtgg:c-camp-fight:b21",
            "kind": "spoken",
            "speaker": "HRODULF",
            "line": "Put your weapons down. The living ones work."
          },
          {
            "id": "wtgg:c-camp-fight:b22",
            "kind": "stop",
            "text": "Resolve their response and actual restraint actions. No automatic tying, equipment loss, or revival. Each able guard needs actions to collect weapons and bind people. If only Hrodulf remains he must do it himself."
          },
          {
            "id": "wtgg:c-camp-fight:b23",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**CAPTURE / BREAKOUT**\nKeep dead people dead and stabilize anyone still within the downed deadline. Equipment goes to the existing east rack only if captors actually collect it. Captors return to packing; no new guard appears. Knife available: Major cut stake link, second Major wrists. By hand Hard Agility (-4) per step, equality noisy, failure holds, natural 20 alerts an actual watcher. Watched escape: opposed PC Agility versus watcher's Guile12, own TN, lower successful die wins, ties reroll, both fail current position. Unwatched movement needs no opposed roll. They can negotiate labor/release or wait for a real opening; no invented NPC rescue. If the session ends captured, that is the outcome, with no completion award."
          }
        ],
        "enemies": [
          "hrodulf",
          "barrow-picker"
        ],
        "exits": [
          {
            "id": "wtgg:exit:c-camp-fight:1",
            "description": "Actual people/goods recovered",
            "targetSceneId": "wtgg:scene:c-restoration",
            "branchLabel": "17 -- What they bring back"
          },
          {
            "id": "wtgg:exit:c-camp-fight:2",
            "description": "Recovery needed",
            "targetSceneId": "wtgg:scene:c-farm",
            "branchLabel": "11 -- Regroup without losing the thread"
          },
          {
            "id": "wtgg:exit:c-camp-fight:3",
            "description": "Partial report",
            "targetSceneId": "wtgg:scene:c-report",
            "branchLabel": "19 -- A job under their own name"
          },
          {
            "id": "wtgg:exit:c-camp-fight:4",
            "description": "Captured -> play breakout here or stop at actual state"
          }
        ],
        "tags": [
          "camp-fight"
        ],
        "schemaVersion": 2
      },
      {
        "id": "wtgg:scene:c-restoration",
        "moduleId": "wtgg:module",
        "title": "17 -- What they bring back",
        "subtitle": "Resolve people, property, and the guardian separately",
        "type": "set-piece",
        "kind": "scene",
        "blocks": [
          {
            "id": "wtgg:c-restoration:b1",
            "kind": "gmNote",
            "text": "Resolve dying actors first. Track each person alive/conscious/free/injured/location, each of the two burial sacks, chest coin, purse, pick, and any animated remains. Do not read an all-alive reunion: three company members already died. Bringing living comrades back is still real success."
          },
          {
            "id": "wtgg:c-restoration:b2",
            "kind": "readAloud",
            "paragraphs": [
              "The ridge path climbs above the river. Beyond the trees, the tops of the standing stones rise over the grass. The farm lies on the other side of the slope."
            ]
          },
          {
            "id": "wtgg:c-restoration:b3",
            "kind": "stop",
            "text": "Ask where they go and who/what they take. Neither restitution nor grave repair is automatically chosen for them."
          },
          {
            "id": "wtgg:c-restoration:b4",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**CARRYING AND RESTITUTION**\nTwo sacks, 30lb each. Ordinary carrying needs no roll, but occupies hands if carried rather than packed. Free, able survivors may help if asked; an injured/unconscious person cannot carry another full load. A secured chest may be emptied into actual bags. The farm has a lendable handcart; there is no newly conjured horse.\nAt the ring place objects outside club reach and stand back. The guardian recognizes its actual grave goods without a persuasion roll. Partial return is accepted as those objects returned, but both robbed graves remain unsettled until their missing goods are restored. Ordinary food/coins don't count as the exact funeral objects. Repairing disturbed turf is a possible respectful action, not a scripted PC task.\nIf undead remain active, stop threatening movement before approaching. Using the dead mercenaries to carry bags is possible only within their actual spell; it does not turn them into living rescued Anvils. Captive reactions below depend on what they actually witness. The giant guards its own dead; do not invent a universal necromancy religion to explain its behavior."
          },
          {
            "id": "wtgg:c-restoration:b5",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "All stolen goods are presented, guardian alive, party leaves room for it to inspect."
          },
          {
            "id": "wtgg:c-restoration:b6",
            "kind": "readAloud",
            "paragraphs": [
              "The giant sets its club against a stone and crouches over the sacks. It lifts the rings into the graves, sets the flute alongside the bones, and gathers the amber between two fingers. It draws the displaced remains together and pulls the folded turf over them.",
              "It presses the last edge of turf into place, then sits beside the tallest stone. Below the ridge, the path to the barley runs beside the farmhouse."
            ]
          },
          {
            "id": "wtgg:c-restoration:b7",
            "kind": "gmNote",
            "text": "This completes the interrupted burial restoration. The guardian ceases the dusk searches and leaves field access clear. Give the players space to act before continuing; no magical blessing, new religious authority, or additional permanent reward is invented. The departed herd giant remains west, not waiting to replace it."
          },
          {
            "id": "wtgg:c-restoration:b8",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They return only part of the haul, guardian alive."
          },
          {
            "id": "wtgg:c-restoration:b9",
            "kind": "readAloud",
            "paragraphs": [
              "The giant places the offered objects beside the bones. It touches the scraped space in the other grave, then looks back along the path from the pines."
            ]
          },
          {
            "id": "wtgg:c-restoration:b10",
            "kind": "stop",
            "text": "They can seek remaining goods, propose a real alternative, withdraw, or fight. A successful speech cannot make a missing object present."
          },
          {
            "id": "wtgg:c-restoration:b11",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Guardian dead and PCs choose to return goods."
          },
          {
            "id": "wtgg:c-restoration:b12",
            "kind": "readAloud",
            "paragraphs": [
              "The giant lies beside the broken turf. Within the stones, the three grave openings remain exposed. The bronze ornaments in the third grave catch the light beside its bones."
            ]
          },
          {
            "id": "wtgg:c-restoration:b13",
            "kind": "stop",
            "text": "Ask what they actually do. Returning goods, repairing graves, moving bodies, and burying the giant require their chosen actions and logistics. No automatic funeral performed by the PCs; no lost field pay for declining it."
          },
          {
            "id": "wtgg:c-restoration:b14",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Runa is alive, free, conscious, and physically present beside the three bodies."
          },
          {
            "id": "wtgg:c-restoration:b15",
            "kind": "readAloud",
            "paragraphs": [
              "Runa stops beside the company badge. She kneels and touches the cloth at its stitched edge."
            ]
          },
          {
            "id": "wtgg:c-restoration:b16",
            "kind": "spoken",
            "speaker": "RUNA",
            "line": "Bersi. Hakon. Leif. We'll need to bring them down. Can you help us?"
          },
          {
            "id": "wtgg:c-restoration:b17",
            "kind": "stop",
            "text": "A request, not an automatic transport or forced solemn speech. The party decides what to do; transport requires actual help and time."
          },
          {
            "id": "wtgg:c-restoration:b18",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Runa is absent/dead, but Torsten is alive, free, conscious, and is shown the bodies or told where they lie."
          },
          {
            "id": "wtgg:c-restoration:b19",
            "kind": "spoken",
            "speaker": "TORSTEN",
            "line": "We'll need to bring them down. Can you help us?"
          },
          {
            "id": "wtgg:c-restoration:b20",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Torsten is alive, conscious, and physically sees his comrade animated with copied scars."
          },
          {
            "id": "wtgg:c-restoration:b21",
            "kind": "readAloud",
            "paragraphs": [
              "Torsten stops in front of the moving body. His eyes move from the company badge to the marks cut into its skin."
            ]
          },
          {
            "id": "wtgg:c-restoration:b22",
            "kind": "spoken",
            "speaker": "TORSTEN",
            "line": "That's Bersi. Stop him. Let me take him down."
          },
          {
            "id": "wtgg:c-restoration:b23",
            "kind": "stop",
            "text": "The party may comply, explain, refuse, or end the spell. He asks for his comrade, not a speech on the party's morality. No automatic forgiveness, hostility, or resurrection. If the body is another identified comrade, use that actual name."
          },
          {
            "id": "wtgg:c-restoration:b24",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**OTHER ACTUAL FIELD SOLUTIONS**\nKilling the guardian removes the immediate field threat without requiring another camp victory. A lasting relocation/protected boundary can count if actual behavior and coverage allow roughly three working days of harvest. Temporary Calm/Fear or holding it in a shallow/escapable pit alone is not three-day coverage. Do not prohibit creative solutions that genuinely meet the requirement; declare the concrete duration, access, and risk before judging success. An uncertain understandable gesture with physical leverage can use Hard Guile (-4); equality requires the offered repair first, failure leaves it unsettled, natural 20 closes that approach until circumstances change. It cannot comprehend a farm-labor contract.\nKeeping/selling burial objects while the guardian lives leaves the ordinary restoration route unfinished. Killing it while keeping goods can still earn field pay; the steward does not acquire secret knowledge of theft. Buying/negotiating the bags without taking the chest gives no invented cash top-up."
          }
        ],
        "enemies": [],
        "exits": [
          {
            "id": "wtgg:exit:c-restoration:1",
            "description": "Field secured",
            "targetSceneId": "wtgg:scene:c-harvest",
            "branchLabel": "18 -- The field opens"
          },
          {
            "id": "wtgg:exit:c-restoration:2",
            "description": "People rescued but field unsafe",
            "targetSceneId": "wtgg:scene:c-farm",
            "branchLabel": "11 -- Regroup without losing the thread"
          },
          {
            "id": "wtgg:exit:c-restoration:3",
            "description": "Further attempt",
            "targetSceneId": "wtgg:scene:c-approach",
            "branchLabel": "12 -- The people behind the smoke"
          }
        ],
        "tags": [
          "restoration"
        ],
        "schemaVersion": 2
      },
      {
        "id": "wtgg:scene:c-harvest",
        "moduleId": "wtgg:module",
        "title": "18 -- The field opens",
        "subtitle": "Show the local result, not a victory label",
        "type": "set-piece",
        "kind": "scene",
        "blocks": [
          {
            "id": "wtgg:c-harvest:b1",
            "kind": "gmNote",
            "text": "Bring Sela and her son back from the actual hut if still there, or meet them at the farm if already escorted. Don't read a farmhouse reunion before the trip happens. A message, escort, or their chosen return supplies it. Workers need roughly three working days to cut/gather; observation of safe access and credible lasting coverage establishes payment without playing out every hour."
          },
          {
            "id": "wtgg:c-harvest:b2",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They escort Sela and boy from hut to the house after a solution."
          },
          {
            "id": "wtgg:c-harvest:b3",
            "kind": "readAloud",
            "paragraphs": [
              "At the farmhouse door, Sela's eldest comes out to meet her. Her younger boy passes him the borrowed cloak. Sela takes the sickle from its hook beside the gate and looks up toward the stones."
            ]
          },
          {
            "id": "wtgg:c-harvest:b4",
            "kind": "spoken",
            "speaker": "SELA",
            "line": "Show me where we can work."
          },
          {
            "id": "wtgg:c-harvest:b5",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Sela is already at the farm and the players present a completed solution."
          },
          {
            "id": "wtgg:c-harvest:b6",
            "kind": "readAloud",
            "paragraphs": [
              "Sela lifts her sickle from beside the gate. Her sons wait with a coil of binding cord and a wooden rake."
            ]
          },
          {
            "id": "wtgg:c-harvest:b7",
            "kind": "spoken",
            "speaker": "SELA",
            "line": "Show me where we can work."
          },
          {
            "id": "wtgg:c-harvest:b8",
            "kind": "stop",
            "text": "Let them demonstrate, explain, or accompany her. If their claimed solution is false/temporary/uncertain, use the unsettled passage rather than narrating success."
          },
          {
            "id": "wtgg:c-harvest:b9",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Guardian alive with full restitution, seated at the stones as described in the restoration scene."
          },
          {
            "id": "wtgg:c-harvest:b10",
            "kind": "readAloud",
            "paragraphs": [
              "Sela steps into the standing barley and gathers a handful of stalks. Her sickle cuts through them. One son follows with the binding cord. Above the field, the giant stays beside the stones."
            ]
          },
          {
            "id": "wtgg:c-harvest:b11",
            "kind": "spoken",
            "speaker": "SELA",
            "line": "We can bring this in. Thank you."
          },
          {
            "id": "wtgg:c-harvest:b12",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Another lasting arrangement was demonstrated, with guardian relocated or otherwise outside the working field."
          },
          {
            "id": "wtgg:c-harvest:b13",
            "kind": "readAloud",
            "paragraphs": [
              "Sela steps along the route you showed her and gathers a handful of barley. Her sickle cuts the stalks. Her sons follow with the binding cord and rake."
            ]
          },
          {
            "id": "wtgg:c-harvest:b14",
            "kind": "spoken",
            "speaker": "SELA",
            "line": "We can bring this in. Thank you."
          },
          {
            "id": "wtgg:c-harvest:b15",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Guardian killed, remaining herd giant departed, field accessible."
          },
          {
            "id": "wtgg:c-harvest:b16",
            "kind": "readAloud",
            "paragraphs": [
              "Sela follows the trampled strip to the standing crop. Her sons begin cutting beside her, laying the stalks in bundles along the row."
            ]
          },
          {
            "id": "wtgg:c-harvest:b17",
            "kind": "spoken",
            "speaker": "SELA",
            "line": "We'll cut what's left. Tell the steward we're working."
          },
          {
            "id": "wtgg:c-harvest:b18",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Safety remains unresolved, including rescue-only outcome."
          },
          {
            "id": "wtgg:c-harvest:b19",
            "kind": "readAloud",
            "paragraphs": [
              "Sela rests the sickle against the gatepost. Beyond her, the deep tracks cross the standing crop toward the ridge."
            ]
          },
          {
            "id": "wtgg:c-harvest:b20",
            "kind": "spoken",
            "speaker": "SELA",
            "line": "Can you keep him out while we cut? We need three working days."
          },
          {
            "id": "wtgg:c-harvest:b21",
            "kind": "stop",
            "text": "A concrete further plan, another attempt, or honest partial report? Her question establishes the remaining practical requirement; it is not a new deadline before all food vanishes."
          },
          {
            "id": "wtgg:c-harvest:b22",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Sela still has the borrowed cloaks and the PCs have not asked her to keep them."
          },
          {
            "id": "wtgg:c-harvest:b23",
            "kind": "spoken",
            "speaker": "SELA",
            "line": "I'll send the cloaks back with you. Thank you for getting us out."
          },
          {
            "id": "wtgg:c-harvest:b24",
            "kind": "gmNote",
            "text": "If the party asks her to keep one, she accepts; no secret extra reward. Stolen mercenary property still belongs to its owner/estate, not her automatic gift. Food consumed is consumed, not replenished by narration."
          }
        ],
        "enemies": [],
        "exits": [
          {
            "id": "wtgg:exit:c-harvest:1",
            "description": "Their choice to report",
            "targetSceneId": "wtgg:scene:c-report",
            "branchLabel": "19 -- A job under their own name"
          },
          {
            "id": "wtgg:exit:c-harvest:2",
            "description": "Unsettled field",
            "targetSceneId": "wtgg:scene:c-burials",
            "branchLabel": "10 -- What was disturbed"
          }
        ],
        "tags": [
          "harvest"
        ],
        "schemaVersion": 2
      },
      {
        "id": "wtgg:scene:c-report",
        "moduleId": "wtgg:module",
        "title": "19 -- A job under their own name",
        "subtitle": "Full, partial, dishonest, or unsuccessful close",
        "type": "set-piece",
        "kind": "scene",
        "blocks": [
          {
            "id": "wtgg:c-report:b1",
            "kind": "gmNote",
            "text": "Whiterun is about three hours by the established outward route. Only read after the party actually returns. Hrodulf/crew prisoners travel only if disarmed/bound/escorted by actual actions. Mercenary bodies need actual transport; reporting locations is also valid. The court's earlier local clearance stands; Thalmor interest remains separate and offstage. Do not replay the false-Lantern hearing."
          },
          {
            "id": "wtgg:c-report:b2",
            "kind": "readAloud",
            "paragraphs": [
              "At Dragonsreach, Proventus opens the Hearthfeld page. He sets his quill beside the names of the Silver Fangs and looks up from the unfinished field entry."
            ]
          },
          {
            "id": "wtgg:c-report:b3",
            "kind": "spoken",
            "speaker": "PROVENTUS",
            "line": "Can Sela harvest? And what happened to the six I sent?"
          },
          {
            "id": "wtgg:c-report:b4",
            "kind": "stop",
            "text": "Take their actual account. Ask clarifying questions with the lines below as needed, not a fixed interrogation of every possible topic. Do not dictate who speaks."
          },
          {
            "id": "wtgg:c-report:b5",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Credible safe field / completed contract, regardless of incomplete rescue."
          },
          {
            "id": "wtgg:c-report:b6",
            "kind": "readAloud",
            "paragraphs": [
              "Proventus marks the field column and opens the drawer beneath the ledger. He sets out the completion purses."
            ]
          },
          {
            "id": "wtgg:c-report:b7",
            "kind": "spoken",
            "speaker": "PROVENTUS",
            "line": "Two hundred apiece. Give me the names of the dead, and the last places you saw anyone still missing."
          },
          {
            "id": "wtgg:c-report:b8",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Three rescued survivors present and conscious, Torsten alive."
          },
          {
            "id": "wtgg:c-report:b9",
            "kind": "spoken",
            "speaker": "TORSTEN",
            "line": "Three of us were held in the pines. These people brought us out. Bersi, Hakon, and Leif died at the stones."
          },
          {
            "id": "wtgg:c-report:b10",
            "kind": "gmNote",
            "text": "That line requires the survivors to know the deaths. If they were never told and never saw them, have the PCs report instead. If one later died, give the actual number and name; never read three returned by habit."
          },
          {
            "id": "wtgg:c-report:b11",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They produce records for Proventus to keep."
          },
          {
            "id": "wtgg:c-report:b12",
            "kind": "spoken",
            "speaker": "PROVENTUS",
            "line": "Leave the papers with me."
          },
          {
            "id": "wtgg:c-report:b13",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They surrender Hrodulf, request investigation of the robbers, or submit records; the location and guards have not yet been reported."
          },
          {
            "id": "wtgg:c-report:b14",
            "kind": "spoken",
            "speaker": "PROVENTUS",
            "line": "Where were the goods, and who was guarding them?"
          },
          {
            "id": "wtgg:c-report:b15",
            "kind": "gmNote",
            "text": "Take the report and order custody for actual living prisoners; no unseen completed trial, automatic confiscation of all incidental coin, or automatic bounty. Anvils can identify their own equipment/money if the issue is actually raised; no omniscient steward inventory search."
          },
          {
            "id": "wtgg:c-report:b16",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**IMPROVISING AN UNEXPECTED RETURN -- INTENT AND LIMITS**\nReturning for official help is a valid player solution, not an adventure failure or an order to replay the camp. Proventus needs the field usable and a reliable account of the six. He is buying a result, not a particular fight. He learns the robbery from actual testimony or evidence, and surviving Anvils can corroborate their own captivity. The existing contract still offers the unpaid 200 each for actual field safety; no fresh advance or automatic expense reimbursement.\nThe earlier briefing explicitly allows specific extra expenses to be agreed live BEFORE they are incurred. Bring that authority into this scene: ask what assistance they need, what it would accomplish, and what they can demonstrate. Agree an actual expense or practical arrangement before they rely on it. The GM may adjudicate an unexpected sensible request here; missing prewritten dialogue is not an automatic refusal. Returning with useful evidence and rescued people is meaningful progress.\nGuard numbers, departure time, an escort order, and a medical service have not been established. Set and state any such commitment at the table before advancing time or relying on it; record the new decision. Use the report, the remaining danger, and the proposed task to judge the request. Do not fabricate a troop shortage, law against assistance, or free royal force merely to force the original route. A request can be accepted, limited, or refused on an actual stated circumstance. Their prior local clearance is not general police authority.\nMedical care is a separate request from armed support. Retain Eydis's actual injury and the real effects of any available healing. Bringing her to court does not itself cure her or grant a party potion. Do not promise a named healer, price, or instant cure that has not been established. The GM can make a new local arrangement openly if appropriate; mark it as a live decision rather than recovered preparation.\nIf the agreed help resolves the robbers through custody, surrender, or another new plan, carry the actual goods/people into #restoration and verify field safety at #harvest. Do not insert a compulsory battle to restore the planned sequence. If they hand the matter over and end their involvement, close with their actual rescue/report result and the existing payment terms; future official action is not already completed on the page. The players retain the choice to return, hand over the case, negotiate another arrangement, or stop."
          },
          {
            "id": "wtgg:c-report:b17",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They report only the giant killed, field actually secure, others unaccounted for."
          },
          {
            "id": "wtgg:c-report:b18",
            "kind": "spoken",
            "speaker": "PROVENTUS",
            "line": "The field is settled. The missing people are still an open matter. Give me the places you searched."
          },
          {
            "id": "wtgg:c-report:b19",
            "kind": "gmNote",
            "text": "Pay the agreed 200 balance each and award one AP once. No forced second fight or return trip to earn the already-achieved field result. No 4,000 robber cash appears on the giant."
          },
          {
            "id": "wtgg:c-report:b20",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Field unsafe or honestly uncertain, even if people were rescued."
          },
          {
            "id": "wtgg:c-report:b21",
            "kind": "readAloud",
            "paragraphs": [
              "Proventus writes the findings below the company names. His quill stops beside the field column."
            ]
          },
          {
            "id": "wtgg:c-report:b22",
            "kind": "spoken",
            "speaker": "PROVENTUS",
            "line": "I'll record that. The balance waits until she can work. Are you going back?"
          },
          {
            "id": "wtgg:c-report:b23",
            "kind": "stop",
            "text": "They may make another attempt or end with the advance and actual loot. No advance repayment or completion AP is automatic. A new crew can be hired later; no mandatory ongoing reputation/debt game."
          },
          {
            "id": "wtgg:c-report:b24",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They knowingly lie about field safety and the claim is plausible/uncertain."
          },
          {
            "id": "wtgg:c-report:b25",
            "kind": "spoken",
            "speaker": "PROVENTUS",
            "line": "Who can confirm the field's open? Can I send word to Sela?"
          },
          {
            "id": "wtgg:c-report:b26",
            "kind": "gmNote",
            "text": "Uncertain deception: Hard Guile (-4), own TN. Success accepted provisionally and pays as claimed; equality pays but requests named corroboration; failure defers balance pending confirmation, natural 20 catches one actual contradiction and asks for explanation. A lie cannot alter the field itself. Later verification is a possible consequence, not invented immediate arrest, blanket truth detection, or a new anthology debt subsystem."
          },
          {
            "id": "wtgg:c-report:b27",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**REWARDS -- THE SAME ADVENTURE, NOT A SECOND PAYDAY**\nAdvance 200 each was paid last session. Completion 200 each is paid ONCE for actual safe harvest. With the full 4,000 robber cash divided among five: 800 each. Full episode acquisition 1,200 each = 200 already paid + 200 balance + 800 recovered. Tonight's new cash on that route is 1,000 each, before actual purchases. No repeated advance.\nThree hundred purse + 3,700 chest are the SAME 4,000. A pick only if taken/surrendered: damage8 Might, ignores2DR/hit. Burial relics are not cash, not automatic sales, and cannot be both returned and sold. Taking only a third of goods gives actual objects, not another 1,333 cash. Personal Anvil120 remains their property, outside reward allocation.\nOne AP per PC ONCE when field safety is achieved, regardless of one fight, two fights, or no fights. No extra AP because the adventure crossed two real sessions. Rescue-only/partial gets actual advance/loot and no automatic completion award. No full-success cash top-up when they leave the chest behind.\nThe next anthology's broke-start convention still applies later; do not seize tonight's legitimate reward or strip earned equipment now. Keep this a short local episode, not a bank ledger or a faction-management campaign."
          },
          {
            "id": "wtgg:c-report:b28",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "Job completed; after their report and any final questions."
          },
          {
            "id": "wtgg:c-report:b29",
            "kind": "readAloud",
            "paragraphs": [
              "Proventus closes the Hearthfeld page and sets it beneath the next petition. Beyond Dragonsreach's doors, the market calls carry up the steps. Your company name is entered beside the finished job."
            ]
          },
          {
            "id": "wtgg:c-report:b30",
            "kind": "stop",
            "text": "Ask each player for one final action. State actual cash/item/AP awards out loud, record actual survivors/dead/missing, and end here. Reports of the real Obsidian Lanterns remain contradictory; nobody supplies their current location for free."
          },
          {
            "id": "wtgg:c-report:b31",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They end with the field unresolved."
          },
          {
            "id": "wtgg:c-report:b32",
            "kind": "readAloud",
            "paragraphs": [
              "Proventus leaves the Hearthfeld page open beside his quill. Outside the hall, the road down through Whiterun leads back toward the southern fields."
            ]
          },
          {
            "id": "wtgg:c-report:b33",
            "kind": "stop",
            "text": "Ask for final actions and record the actual outcome. No victory narration, compulsory return, or erased rescue success."
          }
        ],
        "enemies": [],
        "exits": [
          {
            "id": "wtgg:exit:c-report:1",
            "description": "Finished"
          }
        ],
        "tags": [
          "report"
        ],
        "schemaVersion": 2
      },
      {
        "id": "wtgg:scene:c-reference",
        "moduleId": "wtgg:module",
        "title": "20 -- Table reference and provenance",
        "subtitle": "Rules, conditional companion, and explicit design decisions",
        "type": "set-piece",
        "kind": "scene",
        "blocks": [
          {
            "id": "wtgg:c-reference:b1",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**THE RULES USED HERE**\nd20 against own Might/Agility/Magic/Guile plus difficulty: Very Easy+4, Easy+2, Standard0, Hard-4, Very Hard-6, Nearly Impossible-8, Impossible-14, Mythic-20. Natural1 critical; underTN success; equalTN success with complication; over failure; natural20 catastrophe. Resistance equality still resists; complication preserves success. Advantage lower of two, Disadvantage higher.\nOpposed: each ownTN; single success wins; both successes lower die wins; exact ties reroll; both fail holds position. No fixed GM-set player TN. Player spells keep actual school/FP/duration/resistance; no free extra spell or invented general giant immunity. Flats add before multipliers; multipliers add together into one Total Multiplier (a x2 on a x2 is a x3, never a x4).\nLocal movement: one Minor to any location on the field, reach5ft, Prone standMinor, disengage Major Standard Might/Agility/Guile then Minor to move, success avoids free attack; failure moves but permits it. Local negative-HP procedure in every encounter: unconscious at0/below, healed above0 before end of next own turn or dies; Major Standard Guile bandaging pauses deadline unconscious. Potion/spell requires actual inventory/resources. Hirt exception below only if actually present."
          },
          {
            "id": "wtgg:c-reference:b2",
            "kind": "card",
            "title": "Companion — Hirt",
            "items": [
              "Might 16 · Agility 10 · Magic 10 · Guile 4",
              "HP 42 · FP 20 · DR 2 (+armour). Uncapped temporary HP from Bio-Siphon.",
              "Headsman's Axe: 10 damage, Hack & Slash (Bleeding 1/turn).",
              "Avoid Death: once per adventure, at 0 HP heal 10 (a blow over 10 excess still downs him).",
              "Bio-Siphon (Major, 10 FP): 5 irreducible + 5 fire, gain 20 temp HP.",
              "Mist Form (Reaction, 8 FP): immune to physical until his next turn; adjacent creatures take 4 fire.",
              "Equilibrium (Minor, 0 FP): take 10 irreducible, regain 20 FP.",
              "Sanguine Overload: at 84+ total HP his melee adds +2 fire.",
              "His turns never advance the giant's Grief-Quake counter — only PC turns do."
            ]
          },
          {
            "id": "wtgg:c-reference:b3",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**SOURCE QUOTATIONS / CHECKED FOUNDATION**\nRecovered ending transcript, 11873.40-11888.40: \"when we pick up next time we'll be in combat\". This fixes an unresolved confrontation, not an already-rolled damaging hit or a death-match obligation.\nLive transcript entries477-480: club warning misses, giant walks away; entries491-493: the picture makes it stop short and watch. Earlier de-escalation remains real.\nLive entries412-423: personal purses, supplies, marked cloaks, hut note, ropes. Entries430-442: pit, ammunition placement, cover. Entries449/479: three Anvils fighting, confirmed dead. Recovered entries505-513: animated scarred bodies, attack, successful hidden escape.\nOriginal what the giants guard.rtf:55: \"It stays at the ring\"; \"the giant is not present at the Barrow-Pickers' camp\". Same67: \"Four of his crew, plus three of the missing Gray Anvils -- alive, disarmed\". Same79: \"Below roughly a third of his HP, he offers to split the grave-goods\". Same92: \"Dwarven War-Pick (Damage 8, Sunder: ignores 2 pts of target DR)\".\nExisting table module: five-player guardian600/two300, Hrodulf200/offer66; exact sacks, tools, coin split, local rescue/downed/movement rulings, three-day harvest coverage. These are preparation, not newly recovered play.\nplayers guide:800: \"Minor Actions: Moving to a different location, Drawing a weapon, Bracing with a shield, Drinking a potion, Applying a poison.\" Same819: \"Sunder Armor (Melee only)(Major Action)\". Reference tables162-165: falling10-20ft2damage/Prone;20+ft5damage/Prone. Existing module uses DR for physical hazards.\nRegional post-kynesgrove tracker: \"The main road from Cyrodiil through Helgen/Falkreath is now a Thalmor-controlled checkpoint.\" This supports local delivery disruption, not importing its old clock tier or all prices into the later anthology. The players already encountered the checkpoint. Thalmor status is not cleared by Whiterun.\nSESSION SHEET FORMAT198: \"THE CLUE -- load-bearing\"; \"Give it its OWN short beat, at its point of use\". The story test is actual spoken information, not merely text somewhere in the HTML."
          },
          {
            "id": "wtgg:c-reference:b4",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**NEW PREPARATION -- NOT PAST CANON**\nDead-name allocation; intervening capture after Anvil split; Sela/boy safe arrival and older son's house location; second giant's departing western herd; stopping the display as de-escalation; fuller burial behavior; three camp work roles plus guard; routine and alarm responses; route account; separate100-total prisoner opening price; leverage surrender; pit climb; new reaction dialogue. These supply the authorized continuation and can be corrected without claiming a transcript contradiction. No source narrative, original RTF, past transcript, or THE WEB entry is rewritten as a result of building prep.\nAll past deaths, hidden escape, played resources, drawings, robbery, and unresolved contract remain. No retcon that giants have language/agriculture, no invented new priest, envoy, translator, boss, or occult mechanism. No main-party plot grafted onto Hrodulf. No Thalmor encounter added."
          },
          {
            "id": "wtgg:c-reference:b5",
            "kind": "gmNote",
            "tag": "RULE:",
            "text": "**NAMED DIALOGUE AUDIT -- WRITING GUIDE IX0-8**\n0 PASS: stage directions give hands, rope, objects, movement; private wants remain in GM notes. 1 PASS: agreements remain agreements; reactions change only after news/actions. 2 PASS: Sela requests family/field help, captives request release, broker negotiates; nobody lectures a PC on their expertise. 3 PASS: no character comments on narrative design. 4 PASS: no performer editorializes; this continuation has no scripted bard performance. 5 PASS: no 'not X, it's Y' mic-drop lines or smug quips. 6 PASS: no invented party legend; retrospective recap follows recorded actions, and newly assigned Anvil names/capture are labelled preparation. 7 PASS: Torsten seeks comrades/release/pay, Runa seeks freedom and recovery, Eydis asks mobility aid, Hrodulf seeks terms/departure, Sela seeks family safety/field access, Proventus seeks a report and pays the contract. 8 PASS: no dialogue announces why it is being delivered. New lines are direct playable requests/responses, not character biographies or outcome summaries."
          }
        ],
        "enemies": [],
        "exits": [
          {
            "id": "wtgg:exit:c-reference:1",
            "description": "Start tonight",
            "targetSceneId": "wtgg:scene:c-standoff",
            "branchLabel": "09 -- The standing stone"
          }
        ],
        "tags": [
          "reference"
        ],
        "schemaVersion": 2
      },
      {
        "id": "wtgg:scene:ending-withdraw",
        "moduleId": "wtgg:module",
        "title": "21 -- Work declined",
        "subtitle": "A legitimate unsuccessful close",
        "type": "set-piece",
        "kind": "scene",
        "blocks": [
          {
            "id": "wtgg:ending-withdraw:b1",
            "kind": "gmNote",
            "tag": "CUE:",
            "text": "They decline the steward's contract in person. If they refused the guard's invitation, end at that actual scene instead."
          },
          {
            "id": "wtgg:ending-withdraw:b2",
            "kind": "readAloud",
            "paragraphs": [
              "Proventus gathers the unclaimed advance purses back into the drawer. He puts the contract sheet beneath his ledger and takes up his quill."
            ]
          },
          {
            "id": "wtgg:ending-withdraw:b3",
            "kind": "spoken",
            "speaker": "PROVENTUS",
            "line": "I'll find another company."
          },
          {
            "id": "wtgg:ending-withdraw:b4",
            "kind": "stop",
            "text": "Take final reactions. If the job was accepted and later abandoned, use the actual-field report instead of this unaccepted-contract passage."
          },
          {
            "id": "wtgg:ending-withdraw:b5",
            "kind": "gmNote",
            "text": "If no contract was reached, use the actual court/road outcome instead of this steward scene. No advance, treasure, or AP for declining. If accepted then abandoned, the earned 200 advance each stands; report at #c-report using the actual field state. New court violence still has consequences; never force capture to salvage the intro."
          }
        ],
        "enemies": [],
        "exits": [],
        "tags": [
          "ending-withdraw"
        ],
        "schemaVersion": 2
      }
    ],
    "schemaVersion": 2
  }
];
