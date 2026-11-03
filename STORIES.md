# NoSwipe story account

A second account, separate from the direct-ad formats in `FORMATS.md`. It posts **serialized stories**: each format is one ongoing mini-season (same cast, continuing plot, cliffhangers). The format rotates every 2 days to 1 week, and when it changes **everything** changes: story, cast, genre, look, music and voices.

## Rules for the story account
- **The ad is invisible.** NoSwipe exists inside the story world and never gets pitched: at most two in-story mentions per season, no feature list, no CTA in the voiceover, and it never resolves the protagonist's arc on its own. noswipe.app lives in the bio; a low-key pinned line only on episodes that mention NoSwipe.
- **All `AGENTS.md` honesty rules still apply:** no fake testimonials framed as real, no number of dates, no $1, no Tinder/Bumble/Hinge logos or UI (only "the apps"), no real named places, women are never the punchline.
- **Clarity:** the first 3 seconds of every episode make the situation clear to a cold viewer (plain setup text or a "Previously" card), even mid-season.
- **Each season has its own look and sound**; the noswipe.app brand look isn't used.
- Voices: each character is cast to an ElevenLabs voice in the episode spec (`cast`), one take per line.

## Season 1 · The Group Chat Is Cooking (rom-com told through a group chat)

**Logline:** Dev finally asks out Sana, a kind woman he likes. His two roommates write his texts in a group chat, and the chat quickly gets out of hand.

**Tone:** warm, fast, cringe comedy with a soft heart. The joke is the over-helping advice and Dev's nerves, never Sana.

| Name | Age | Personality | How they text | Voice |
|---|---|---|---|---|
| Dev | 26 | Shy, kind, over-thinks every word | all lowercase, no emoji, drafts then deletes | Moses |
| Bo | 27 | Loud, loyal, confident with terrible advice; secretly a bit lonely | caps bursts, three messages in a row, 🔥😎 | Liam |
| Nina | 28 | Dry, observant, actually fixes things | full sentences, perfect punctuation, no emoji | Sarah |
| Sana | 25 | Warm, funny, direct, patient | lowercase, "haha", at most one gentle emoji | Jessica |
| Narrator | — | Deadpan, sparing | — | Arthur |

**Arc (6 episodes, each ends on a cliffhanger):**
1. **The Draft.** The roommates argue over the wording; Sana texts first, Dev taps her chat by reflex and sends their mashup to her. *Cliff:* Seen. Sana is typing.
2. **Seen.** Sana answers kindly ("haha, who wrote this?"). Bo grabs the phone and replies "as Dev." *Cliff:* Dev is booked for a "surprise" Saturday dinner he knows nothing about.
3. **The Surprise.** Bo's plan grows, Nina vetoes, Dev rehearses in the chat. *Cliff:* "Can I ask you something? Are you the one writing these?"
4. **The Confession.** Dev tells the roommates the truth; Bo admits he over-helps because he has no one to text. Nina points Bo to NoSwipe (mention 1). Dev decides to go alone. *Cliff:* "I'm at the café. No pressure." Dev's phone is at 3%.
5. **Battery.** Dev walks over with no script while the roommates' messages ping in. *Cliff:* the phone dies at the café door.
6. **No Chat.** For the first time, no chat UI: two people at a table. Dev says the honest thing in his own words. Bo's phone shows a small NoSwipe notification in the background (mention 2). *Cliff:* "So, who wrote the husband one?"

**NoSwipe mentions:** ep 4, Nina: "If you want help setting up dates, there's a thing called NoSwipe. You'd still have to show up." Ep 6: a one-second notification on Bo's phone. Both are Bo's story, not Dev's.

**Look and sound:** a pastel UI collage (periwinkle, peach, pale mint, butter, navy ink), deliberately not the NoSwipe cream/grape/lime. Each person has a bubble colour: Dev butter, Bo coral, Nina teal, Sana peach. The roommates are paper-doll half-body cut-outs pinned on a corkboard around the phone, reacting with small head and hand moves. Hand-lettered captions and recap cards. Signature transition: the "send swoosh" (a bubble flies to the corner and unfolds into the next scene). Lo-fi bedroom-pop with glockenspiel; per-letter typing clicks, a swoosh on send, a soft tick on "Seen", a bass thump under the typing dots.

**Posting:** no link on ep 1; noswipe.app in the bio; "Curious what Nina mentioned? noswipe.app" pinned on eps 4 and 6 only.

| Ep | Title | Spec | Composition |
|---|---|---|---|
| 1 | He asked her out. His roommates wrote the text. (47) | `specs/stories/groupchat-ep1.json` | `GroupChat1` |
| 2 | His roommate texted his crush as him. Part 2 (44) | `specs/stories/groupchat-ep2.json` | `GroupChat2` |
| 3 | She asked: are you the one writing these texts? Part 3 (54) | `specs/stories/groupchat-ep3.json` | `GroupChat3` |

## Season 2 · The Ring in the Drawer (AI-animated drama)

The account's first **AI-visuals** season: start frames from Nano Banana Pro (Gemini 3 Pro Image, `ai/gen_image.py`) in a warm 3D animated-feature look with per-character reference sheets, animated into 3–6 s shots with Kling 4.0 on fal (`ai/gen_video.py`), cut to an ElevenLabs voice timeline in Remotion with code-drawn text on top. No on-camera lip-sync: Nora's thoughts are inner monologue, Sam is heard off-screen or on the phone. AI-generated content must carry the platforms' AI labels.

**Logline:** Nora finds a ring box in her boyfriend Sam's nightstand and prepares to say yes. The truth isn't a proposal gone wrong: it's a loving secret kept for the wrong reason (he's been pawning his late grandmother's ring to cover his mother's rent), which changes what they owe each other. No other woman, no cheating bait; his flaw is deciding for her.

**Tone:** tender, grounded, big emotional swings; warm honey light for hope, cool teal for doubt.

| | Age | Look and signature item | Personality | Voice |
|---|---|---|---|---|
| Nora | 29 | Warm brown skin, dark wavy shoulder-length hair, small yellow hair clip, mustard cardigan over a cream tee | Warm, observant, hopeful, over-plans; won't be managed | Bella |
| Sam | 31 | Light-brown skin, short black curls, round tortoiseshell glasses, light stubble, forest-green flannel, worn leather watch | Gentle, funny, proud fixer who hides stress behind jokes | Will |
| Dani | 28 | Pale freckled skin, copper curly bob, big gold hoops, denim jacket with enamel pins | Quick, dry, loyal; single and burnt out on dating | — |

**Apartment:** fourth-floor walk-up in honey and sage: sage-green cabinets, mustard velvet sofa, pothos, warm lamps, a fire-escape window with a tomato plant; the round oak nightstand with one brass-handled drawer is the series icon. No readable text anywhere in frame.

**Arc:** 1 The Box (joy → doubt; "Don't tell her yet.") · 2 Act Normal (the box is gone) · 3 The Ticket (a pawn ticket; NoSwipe mention 1, in passing in Dani's own dating life) · 4 Half the Truth (it's money, not another woman) · 5 Who Decides (she leaves for Dani's; it was his grandmother's ring) · 6 The Door ("Ask me when it's truly yours"; NoSwipe mention 2, a notification on Dani's phone). NoSwipe never touches Nora and Sam's arc.

**Comment-war questions:** Was Sam right to hide it? Should Nora have gone through his drawer? Would you want to know your partner's family money problems?

| Ep | Title | Spec | Composition |
|---|---|---|---|
| 1 | She found a ring box in his drawer. Part 1 (42) | `specs/stories/ring-ep1.json` | `Ring1` |
| 2 | He almost proposed. Then his phone buzzed. Part 2 (49) | `specs/stories/ring-ep2.json` | `Ring2` |
| 3 | She found a pawn ticket in his jacket. Part 3 (45) | `specs/stories/ring-ep3.json` | `Ring3` |

## Season 3 · Across the Alley (silent paper-cut romance)

**Logline:** Theo and Mira live in facing apartments across a narrow alley. Both swipe alone at 2 AM. One night they notice each other and start talking with paper signs held to the glass.

**Tone:** quiet, warm, a little funny; the tension is the apps (endless, distracting) versus the real person across the alley. Mira is an equal lead, never the punchline.

**Silent format:** no voices. Signs are the dialogue (her sketchbook pages, his pizza-box lids, in marker); typewriter paper strips set the scene. It works muted, so it's built for the feed.

| | Age | Look | How they write |
|---|---|---|---|
| Theo | 28 | Silhouette with a messy tuft, warm amber window (left), fire escape below | pizza-box lids, short, lowercase |
| Mira | 27 | Silhouette with a bun, peach window (right), string lights, a plant on the sill | sketchbook pages, a question mark on most |

**Arc (6 episodes, each ends on a cliffhanger):**
1. **Same.** Both swiping at 2:07 AM; his phone slips, they see each other; signs ("you too?" "every night." "any luck?" "nope. you?" "same."). She asks his name; mid-"TH…" his phone lights up with a new match and he looks down; she sees it, lowers her sign and draws the curtains. *Cliff:* he holds up "TH" to a dark window.
2. **4B.** Next night her window stays dark. He turns his phone face down and tapes "sorry. it was just an app." to the glass, waits for hours and dozes off. Her lamp comes on; she tugs the bulb string to wake him. "I'm Mira." "Theo." "rule #1: no phones at the window." "deal." *Cliff:* her door opens and a hooded figure steps in behind her; she waves goodnight and shuts the curtains.
3. **Rules.** Recap: two shadows on her curtain. Next night the hooded figure drops the hood: Jo, her roommate ("hi Theo. I'm Jo. roommate."); Theo slumps with relief; Jo's "he's cute." gets snatched. Montage of nights: "rule #2: one question a night." / "favourite food?" "dumplings." / "rule #3: no sad songs." / "what do you do?" "I fix bikes." / her pen sketch of his window. *Cliff:* night 9, "same time tomorrow?" — she slowly writes "I move away in 3 weeks."
4. **The Friend.** Mira's friend visits and points at the apps on her phone; on a sign Mira jokes that her friend "uses NoSwipe so she doesn't have to do this" (mention 1). Theo keeps getting matches he doesn't answer. *Cliff:* "coffee? downstairs. 10am" — no answer.
5. **Boxes.** Moving boxes in her window. *Cliff:* her window is empty.
6. **Downstairs.** No windows: the alley at street level, two doors open. A NoSwipe notification lights the friend's phone on the stoop (mention 2). *Cliff:* "so. what's your name?" "Theo." "Mira."

**NoSwipe mentions:** only through the friend (eps 4 and 6), never as the thing that solves Theo and Mira.

**Look and sound:** cut paper in a rainy night (indigo, navy, warm amber and peach windows, cold phone glow), layered planes with soft drop shadows and a slight edge wobble, rain in front and behind, film grain. Camera: slow pushes, whip pans with motion blur between the windows, a wide two-shot for the sign exchange. The signature object is the string of bulbs between their windows (it dims when a window goes dark). Sound: rain on glass, a music-box figure in A minor that warms into piano during the signs and cuts out on the cliffhanger; marker squeaks, paper rustles, the buzz, the lamp click.

**Posting:** no link on eps 1–3; noswipe.app in the bio; a pinned line only on eps 4 and 6.

| Ep | Title | Spec | Composition |
|---|---|---|---|
| 1 | My neighbour swipes at 2 AM too. Part 1 (39) | `specs/stories/alley-ep1.json` | `Alley1` |
| 2 | I said sorry with a pizza box. Part 2 (37) | `specs/stories/alley-ep2.json` | `Alley2` |
| 3 | We made rules for talking through windows. Part 3 (49) | `specs/stories/alley-ep3.json` | `Alley3` |
| 4 | Her roommate doesn't swipe. At all. Part 4 (42) | `specs/stories/alley-ep4.json` | `Alley4` |
| 5 | Her window filled up with boxes. Part 5 (39) | `specs/stories/alley-ep5.json` | `Alley5` |
| 6 | She moved out. Then she showed up at 10am. Part 6 (49) | `specs/stories/alley-ep6.json` | `Alley6` |

## Season 4 · The Dryer Notes (silent riso romance, vote-and-rewind)

**Logline:** Two strangers who use the same night laundromat never meet; they talk in notes left on dryers 4 and 5. It starts when his red sock turns her whole wash pink.

**Why this season:** Across the Alley was the first format that worked (~10× the earlier seasons) but got almost no comments. This season keeps what worked (silent, two strangers, objects as dialogue, a plain hook in frame 1) in a new world and look, and adds a vote to earn comments.

**Vote-and-rewind:** every part ends on "What should he write back?" (or "What should he do?") with two notes, A and B, and "comment A or B". The next part plays the wrong choice first and lets it fail (it always embarrasses him, never her), the dryer drum spins backwards as the rewind, and the right choice plays and carries the story on. Outcomes are fixed in advance, so posting 3–4 parts a day is fine.

| | Look | How they write |
|---|---|---|
| Him | Messy hair, blue hoodie, basket of white tees; uses dryer 4 | small caps on receipts (Noteworthy) |
| Her | Unseen until late; uses dryer 5 | loose script (Bradley Hand), signs "— dryer 5", doodles in pink |

**Arc (6 parts):**
1. **Pink.** On dryer 4: a pink tee, his red sock, her note ("now everything I own is pink."). *Vote:* A bleach and "so sorry!" · B "I owe you a new shirt. also... we match now."
2. A plays out politely and dies ("thanks. it's fine.", a lint tumbleweed); the scene runs backwards, the drum spins backwards, "rewind. here's what really happened."; B: she laughs, "you owe me 3 shirts.", four nights of notes. *Vote:* A "can I get your number?" · B "I'm Leo, by the way. and you are...?" (changed from guessing her name from her laundry, which read as snooping).
3. A plays out and dies ("oh. that's a bit fast. you don't know my name. take care.", a quarter rolls across the floor and falls flat); rewind; B: "hi Leo. I'm Nora. the one you turned pink. still got your sock."; the notes get easy, then she gets honest: "ugh. dating wears me out." (no app named). *Vote:* A "you'll find someone great, I promise!" · B "honestly, same. it wears me out too."
4. A plays and dies ("aw. thanks, friend. I'll be okay." she hears him friend-zoning himself; a lone sock drops off dryer 5); rewind; B: "huh. you get it. no pep talk. thank you. what song helps you?", then songs and doodles; they've never seen each other. *Vote:* A "here's my number, text me sometime." · B "thursday, 9pm? I'll be at dryer 4."
5. A plays and dies ("I like the notes better, honestly. phones feel loud.", he waits with a dark phone); rewind; B: "it's a date. bring the sock. I'll wear the pink." Thursday: he's early, the wall clock runs 8:50 → 9:40, dryer 5 stays empty, "she never came." *Vote (What should he do?):* A "come back again next thursday." · B "leave one last note." Tease: "part 6: dryer 5".
6. She shows up late with her pink tee. They meet.

**Look and sound:** a two-colour risograph print in code: fluorescent pink and medium blue on cream paper, halftone tints, purple where the inks overprint, the pink plate slightly off register and shifting a few times a second, static paper grain. Every shape is drawn once per ink plate (`src/stories/dryer/world.tsx`, `useInk`); shared screens from part 2 on (vote board, close-up, night card, rewind drum, end card) are in `parts.tsx`, and each spec's `audio` block lists its sound cues. Stamped blue labels (DIN Condensed) are the narration. Transitions are new sheets sliding in; the signature is the dryer door with the drum tumbling (backwards for a rewind). Sound: fluorescent hum and dryer rumble, lazy lo-fi at 84 bpm (Rhodes, round bass, brushes) that drops out for the note, the dryer's end-of-cycle buzzer as the punchline, rubber-stamp thumps on every label. `python3 generate_dryer_audio.py dryer-ep1`.

**Posting:** 3–4 parts a day is fine; the end card never says "tomorrow". noswipe.app stays in the bio only.

| Ep | Title | Spec | Composition |
|---|---|---|---|
| 1 | My sock turned a stranger's laundry pink. Part 1 (48) | `specs/stories/dryer-ep1.json` | `Dryer1` |
| 2 | I left her bleach. Wrong move. Part 2 (37) | `specs/stories/dryer-ep2.json` | `Dryer2` |
| 3 | I asked for her number. I didn't know her name. Part 3 (54) | `specs/stories/dryer-ep3.json` | `Dryer3` |
| 4 | I told her she'd find someone. Wrong move. Part 4 (49) | `specs/stories/dryer-ep4.json` | `Dryer4` |
| 5 | She said yes to Thursday. Then she didn't show. Part 5 (54) | `specs/stories/dryer-ep5.json` | `Dryer5` |
