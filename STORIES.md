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
6. **Finale.** Recap of part 5's vote (A stamped "TRY A FIRST"). A plays and dies: he goes home at 9:41 and keeps coming back for three Thursdays with the sock, a cobweb and a spider growing on him; "he never left a note. so she never knew." Rewind. B: he stays to write one last note and it takes him 20 minutes (drafts pile up on dryer 4, the clock runs 9:40 → 10:00): "no pressure. thank you for every note. — Leo, dryer 4". At 10:02 someone runs in: Nora, seen for the first time, out of breath, in the pink tee. On the back of his note: "so sorry I'm late! my bus broke down. I ran the rest. — Nora, right here". "first time out loud." "hi, Nora." "hi, Leo." She holds up the sock. "one dryer this time." (both loads tumbling together). End card: "the dryer notes · the end · thanks for every A and B." No vote, no next part.

**NoSwipe mentions:** none this season (decided at the finale: the season's theme is notes over phones, and a mention in the payoff part would read as the thing that brought them together). noswipe.app stays in the bio; no pinned line needed.

**What happened (part 6, 2026-11-03, nightly session on the Linux server):** B won (the note is what keeps him there long enough). Nora's rig (`Nora` in `ep6.tsx`: pink tee, blue bob with fringe, tote bag) is new. `generate_dryer_audio.py` gained optional cues (`buzzer`, `thuds`, `runs`, `finale`). Blind checks: round 1 clarity 6 (the sock held low read as a gun; "she didn't show" lacked the date; cobweb read as cracked glass) → fixed; round 2 clarity 7 / hook 6 / satisfaction 8 (sock at the hip read phallic → now held at chest height). Rendered with the bundled look-alike fonts (Caveat, Patrick Hand, Barlow Condensed).

**Look and sound:** a two-colour risograph print in code: fluorescent pink and medium blue on cream paper, halftone tints, purple where the inks overprint, the pink plate slightly off register and shifting a few times a second, static paper grain. Every shape is drawn once per ink plate (`src/stories/dryer/world.tsx`, `useInk`); shared screens from part 2 on (vote board, close-up, night card, rewind drum, end card) are in `parts.tsx`, and each spec's `audio` block lists its sound cues. Stamped blue labels (DIN Condensed) are the narration. Transitions are new sheets sliding in; the signature is the dryer door with the drum tumbling (backwards for a rewind). Sound: fluorescent hum and dryer rumble, lazy lo-fi at 84 bpm (Rhodes, round bass, brushes) that drops out for the note, the dryer's end-of-cycle buzzer as the punchline, rubber-stamp thumps on every label. `python3 generate_dryer_audio.py dryer-ep1`.

**Posting:** 3–4 parts a day is fine; the end card never says "tomorrow". noswipe.app stays in the bio only.

| Ep | Title | Spec | Composition |
|---|---|---|---|
| 1 | My sock turned a stranger's laundry pink. Part 1 (48) | `specs/stories/dryer-ep1.json` | `Dryer1` |
| 2 | I left her bleach. Wrong move. Part 2 (37) | `specs/stories/dryer-ep2.json` | `Dryer2` |
| 3 | I asked for her number. I didn't know her name. Part 3 (54) | `specs/stories/dryer-ep3.json` | `Dryer3` |
| 4 | I told her she'd find someone. Wrong move. Part 4 (49) | `specs/stories/dryer-ep4.json` | `Dryer4` |
| 5 | She said yes to Thursday. Then she didn't show. Part 5 (54) | `specs/stories/dryer-ep5.json` | `Dryer5` |
| 6 | She didn't show. I left one last note. Part 6 (45) | `specs/stories/dryer-ep6.json` | `Dryer6` |

## Season 5 · Seven Across (silent quiet-carriage romance, clue-and-box vote)

**Logline:** Two strangers share a table on the 7:42 quiet carriage. She leaves crossword clues about his morning; he answers in the boxes she draws. Nobody says a word.

**Why this season:** The Dryer Notes ended. Keep what worked (silent, two strangers, a written device, a plain first-person hook, the A/B vote) and fix Dryer part 5's weak opening (61% skip, 9 s average watch): the hook text and a fully composed gag are on frame 1, the first exchange lands by 8 s, and the vote is up by about 32 s. Picked from 5 scenario-writer pitches on 2026-11-03 (nightly run for 2026-11-04).

| | Look | How they write |
|---|---|---|
| Him | orange beanie, ear blushes, phone in hand | answers in the boxes; his own clues get scribbled out |
| Her | mustard scarf, crossword booklet, pen | printed-looking clues with an enumeration, e.g. "(7)" |

**Device:** her clue plus a row of empty boxes; the answer length is the constraint. Votes offer two answers that both fit the boxes. The wrong one embarrasses him, never her.

**Arc (6 parts):**
1. **Seven across.** "You, every morning (7)" = SWIPING; "What the window has (4)" = VIEW, so he looks up for the first time; his clue "What you're reading (5)" = CLUES makes her smile; at her stop she leaves "How you feel right now (7)". *Vote:* A RELAXED · B NERVOUS (B wins).
2. **Nervous.** A: RELAXED, then a shaking pen and spilled coffee; the passing train runs backwards (rewind); B: NERVOUS, she writes "same (4)". Then a vote.
3. **Clues back.** His clues get braver; her stop is the last one. Then a vote.
4. **The delay.** The train stops mid-track. NoSwipe mention 1: a bystander's phone notification, never the leads. Then a vote.
5. **Her stop.** She isn't on the train.
6. **Last stop.** They finish the crossword together. NoSwipe mention 2 (bystander) is optional.

**Look and sound:** a mid-century travel poster in flat 2.5D planes. Palette: bottle green #2F4A3E (seats), signal orange #FF8A3D (beanie, sunrise), pale sky #CFE6EE, rust #B5452B, ink #1B1E1C, mustard #E3A82B (her scarf only), on warm cream. Fonts (bundled): Jost (clues, the QUIET CARRIAGE sign), Caveat (handwriting), Barlow Condensed (strips, vote board). The window is a parallax stack (sky gradient, hills 0.3x, pylons 0.7x, fence and cows 1.2x). **Signature transition:** the passing train, an opposite train's lit windows sweeping across with motion blur. Sound: a 6/8 rail clack throughout, vibraphone and brushes swing at 112 bpm that drops out for the last clue, pen scratches with a tick per letter, station chime, door hiss, phone buzz. Code: `src/stories/across/{world,ep1}.tsx`; audio: `python3 generate_across_audio.py across-ep1`.

**Hook test (part 1, 3 variants, only the strip in the first 3 s changes):** a "A stranger on my train leaves me crossword clues." (blind hook 7) · b "I swipe every morning on my train. She noticed." (rewritten after the original b scored 4) · c "Her clue for me: 'You, every morning' (7)" (blind hook 6).

**Posting:** noswipe.app stays in the bio only; there is no mention in part 1. The end card says "seven across · part 2 · A or B" (never "tomorrow").

| Ep | Title | Spec | Composition |
|---|---|---|---|
| 1a | A stranger on my train leaves me crossword clues. Part 1 (56) | `specs/stories/across-ep1.json` | `Across1` hook a |
| 1b | I swipe every morning on my train. She noticed. Part 1 (54) | same | `Across1` hook b |
| 1c | Her crossword clue for me: You, every morning. Part 1 (53) | same | `Across1` hook c |
| 2a | A stranger on my train asks how I feel. Part 2 (46) | `specs/stories/across-ep2.json` | `Across2` hook a |
| 2b | I told my train stranger I was RELAXED. I lied. Part 2 (54) | same | `Across2` hook b |
| 3a | A stranger on my train wants my name. Part 3 (44) | `specs/stories/across-ep3.json` | `Across3` hook a |
| 3b | I told a stranger my name was DUKE. It's Dave. Part 3 (53) | same | `Across3` hook b |
| 4a | A stranger on my train left a clue. I missed it. Part 4 (55) | `specs/stories/across-ep4.json` | `Across4` hook a |
| 4b | She wrote me a clue. I checked my phone instead. Part 4 (55) | same | `Across4` hook b |
| 5a | A stranger on my train left me one last clue. Finale (52) | `specs/stories/across-ep5.json` | `Across5` hook a |
| 5b | Her seat was empty. Her clue said where she'd be. Finale (56) | same | `Across5` hook b |

**What happened (part 5 = FINALE, nightly for 2026-11-09):** planned parts 5 and 6 merged into one finale because P3 and P4
both sat on the floor (pre-registered wind-down rule). 31.6 s, no vote. Frame 1: her seat empty, her folded page on the table
(grid, balloon doodle, "– Iris"), one hook strip. Take 1 SEAT: he guards her seat with his coat from a commuter, she never comes,
he plops onto her seat and crumples her page ("crunch"); opposite train backwards. Take 2 TIME: "no Iris on the 7:42. just her
clue." "Where I'll be at 6 (4,4)" = LAST STOP; sunrise window turns to sunset, boards 5:58 -> 6:00 · LAST STOP; she's on the
platform bench; she passes him the pen for "Us, tomorrow (4,4)", he writes SAME TIME, she ticks it; "out loud, at last:"
"hi." "hi.". End card "seven across · the end · a new story starts next." No NoSwipe mention this season at all.
Blind check: round 1 clarity 6, round 2 clarity 6 (maker fixes), round 3 (my text fixes) clarity 7, hook a 5 / b 6,
satisfaction 8, want_next 6. **Season over.**

**What happened (part 4, nightly for 2026-11-08):** 28.4 s, vote fully up at 19.5 s. Frame 1: the carriage moving, her clue
"Look at the (6)", his phone (lock screen 7:44) in hand. Take 1 SCREEN: the train jolts to a halt, his phone slides off the
table, he dives; she points at the window; opposite train backwards. Take 2 WINDOW: both phones face down, a lone orange
hot-air balloon rises over the hills, he writes WINDOW without looking down, she ticks it and doodles a balloon. Board flips
to NEXT STOP, she writes "Tomorrow, same (4)" and looks back from the door. Vote A SEAT ("I'll save her seat") / B TIME
("7:42, same as ever"). **NoSwipe mention 1 was tried (a sleeping bystander's phone) and CUT:** the blind check read it as a
plug that broke the story. No mention used yet this season. Blind check: round 1 clarity 6, round 2 clarity 6 (strip POV,
hook a), round 3 (my text fixes) clarity 7, hook a 6 / b 7, satisfaction 7. Body strips are now first person ("I").
**Part 5 is decided:** B TIME wins. A first: next morning he parks his coat on her seat, fends off a commuter, she never
appears, he sits guarding an empty seat; rewind. B: 7:42 as normal, her seat empty, her stop passes; he finds her booklet
page with a new clue under the table clip; the vote sets up part 6 "Last stop".

**What happened (part 3, nightly for 2026-11-07):** 31.5 s, vote up at 18.3 s (both cards in by 19.3). Frame 1: her stop,
doors open, "Who you are (4)". Take 1 DUKE: his phone lights "Mum: Dave, call me back" ("mum disagrees."); the opposite
train runs backwards. Take 2 DAVE: phone face down, she writes her name IRIS ("a name for a name."), steps to the door,
looks back and sits by her own choice; doors close, board flips LAST STOP to RETURN TRIP. Her new clue "Look at the (6)";
vote "what should I look at?" A SCREEN (my phone, again) / B WINDOW (the view, with her). Blind check round 1 clarity 6
(crop, IRIS too small, why she stays, third-person vote), round 2 clarity 7, hook a 6 / b 8.
**Part 4 is decided:** B WINDOW wins. A plays first: he picks up the phone (plain lock screen), the train jolts to a halt
mid-track, the phone slides off the table and he dives for it while she is already looking out of the window; rewind;
B: both look out at the fields, the train stopped. NoSwipe mention 1 is a bystander's phone notification later in part 4,
never the leads.

**What happened (part 2, nightly for 2026-11-06):** part 1 hook a won, and 0 comments with 20 s average watch said the vote comes too late, so part 2 runs 36.5 s with the vote up at 23.6 s. It stands alone with no recap card. It plays both branches, tagged "take 1: RELAXED" (the cup shakes, "he was not relaxed.", coffee over the sheet, she offers a napkin; the opposite train runs backwards) and "take 2: NERVOUS" (she writes SAME). Blind check round 1 was clarity 6: A/B meant two things (so the tags became takes; only the vote says A and B), the spill had no cause, and her gasp read as judging. Round 2: clarity 7, hook a 7, hook b 8.
**Part 3 is decided:** vote A DAVE (his real name) vs B DUKE (the name he wishes he had). A wins: the wrong B plays first (mid-DUKE his phone lights up "Mum: Dave, call me back"), rewind, then A carries on. Note the honest answer is A this time so voters can't guess by habit.

## Season 6 · Ten Swipes Left (narrated second-person choice story)

**Logline:** Imagine the apps only gave you ten swipes a day. You burn nine and reach the last one in a coffee queue, where the card says "Also on my last one. Same. Coffee?" and the person ahead turns round, her screen on 1 too.

**Why this format:** a one-slot test of the mechanics in the two reference accounts (CONTENT_PLAYBOOK.md) we'd never tried: second person, one narrator, 2-3 word centre captions, a HUD counter, a two-way choice that the next part plays both ways. It stays on the apps, where our best hook came from. Picked from 5 pitches on 2026-11-05. Takes the mechanics only: no horror, and she's a warm equal who shows her own screen by her own choice.

**Cast:** you are only a POV thumb and cuff. She has a bun and a coral top; the last card shows the same bun, top and cup. Card people are bean figures with one prop and a kind bio. Voice: Witty McGee, calm.

**Look and sound:** arcade tokens. Ink #101218, token gold #FFC21A, cyan #2FD9F5, signal red #FF3B3B (the counter at 1 only), off-white #F2F2EC. Anton (counter, captions), Barlow Condensed (strips), Inter (bios), Courier Prime (the RULE 1 stamp). HUD chip with 10 pips top-left, y >= 290. **Signature transition:** a gold coin falling through a slot, then a gold iris. Chiptune at 100 bpm, swipe whoosh, coin clink, counter tick. Code: `src/stories/swipes/`; audio: `python3 generate_swipes_audio.py swipes-ep1`.

**Arc:**
1. **Last swipe.** Vote: A use the last swipe · B put the phone away and say hi.
2. B wins. A first: you swipe, a generic match burst, counter 0, you draft "hey" and delete it while she takes her coffee and the barista says "Next"; coins fly back up (rewind). B: you pocket the phone, "Hi. Also on my last one." She says "I'm getting coffee first. Then maybe." She nods at the empty chair; vote: sit there, or give her space. This pays off RULE 1 "no going back" (the swipe branch can't be undone).

**Posting:** noswipe.app in the bio only, no mention in part 1. End card "ten swipes left · part 2 · A or B", never "tomorrow".

| Ep | Title | Spec | Composition |
|---|---|---|---|
| 1a | The apps only gave me ten swipes today. Part 1 (46) | `specs/stories/swipes-ep1.json` | `Swipes1` hook a |
| 1b | One swipe left and a stranger in my coffee queue. Part 1 (56) | same | `Swipes1` hook b |
| 2a | A stranger in my queue has one swipe left too. Part 2 (53) | `specs/stories/swipes-ep2.json` | `Swipes2` hook a |
| 2b | Last swipe, and she's right in front of me. Part 2 (50) | same | `Swipes2` hook b |

**What happened (part 2, nightly for 2026-11-07):** 29.4 s. Plays both branches, tagged YOU SWIPED / YOU SAID HI. Swipe:
"hey" typed and deleted, she takes her coffee and leaves, barista NEXT, RULE 1 / NO GOING BACK, REWIND disc. Hi: "coffee
first. Then maybe.", she clears her bag off the chair ("Sit, if you like."), your phone: LAST SWIPE EXPIRES AT 6:00; she turns
her phone face down: "I'm not a swipe. Neither are you." Vote A SWIPE BEFORE 6:00 / B LET IT EXPIRE (planned winner B; part 3
plays A first: you swipe at 5:59, she nods, takes her cup to the window table, NO GOING BACK, rewind; then B: phones face
down, both counters pop to 0 at 6:00, you sit; next vote: say something rehearsed or something true). Board at 20.8 s (the
18 s target was given up to make the swipe branch readable). 501 ElevenLabs characters.
**Kill check:** P1 sat on the 150-180 floor. If P2's fresh body also stays on the floor at 24h with a clean slot, kill the format.
**Killed 2026-11-08:** P2 stayed on the floor too (158 / 150 views, 41-48% skip, 9-11 s watch). Its slot went to Season 7 Lane 8.

## Season 7 · Lane 8 (silent bowling-alley romance, scoreboard name boxes)

**Logline:** Two strangers bowl alone on neighbouring lanes 7 and 8. The only chat is the 9-cell player-name box on the
overhead scoreboards. He keeps skipping his own turn to swipe; she renames herself to talk to him.

**Why this season:** replaces Ten Swipes Left (killed). Keeps what works (silent, two strangers, a written device, a plain
first-person hook, an early vote ~19 s) and makes the device huge and readable in under a second; the phone costing him his
turn ties it to swipe fatigue. Picked pitch 1 of 5 on 2026-11-08 (others: Table Nine wedding place cards, Fifty Whites
paint swatches, Red Light chalk wall, Plot 14 garden labels; keep them for later seasons).

| | Look | How they write |
|---|---|---|
| Him (lane 7) | tangerine hoodie, ink cap, lemon ball, phone | types on the NAME keypad: SORRY |
| Her (lane 8) | violet jacket, high ponytail + lemon scrunchie, violet ball | flips her name box: YOUR TURN, AGAIN, NICE!, BEAT ME? |

**Look and sound:** 80s Memphis carpet pop. Ink #1D1A2F, cream #FFF7E6, teal #12A8A0, tangerine #FF6B2C, lemon #FFD93D,
violet #7C4DFF. Jost 800 strips, Nunito 900 cards and end card, Barlow Condensed 800 scoreboard letters. Bean figures with dot
eyes. **Signature transition:** the ball wipe (a violet ball rolls across the foreground, an iris opens behind it). Gated drum
machine, square bass, glass marimba at 108 bpm; keypad beeps, flap ticks, ball rumble, pin clacks. Code: `src/stories/lane/
{world,ep1}.tsx`; audio: `python3 generate_lane_audio.py lane-ep1`.

**Arc (6 parts):** 1 Beat me · 2 The game (A ONE SEC plays first and fails: frame timer runs out, his box blinks ONE SEC
beside a lonely 1; the ball rolls back up the lane as the rewind; B GAME ON carries on) · 3 Loser buys fries (he has to name
his own row) · 4 the alley owner's phone chimes NoSwipe (bystander, mention 1; note Across's bystander mention was cut as a
plug, so make it part of the gag or skip it) · 5 last frame, she is called away · 6 final frame: real first names, no phone.

**Posting:** noswipe.app in the bio only, no mention in part 1. End card "lane 8 · part 2 · A or B", never "tomorrow".

| Ep | Title | Spec | Composition |
|---|---|---|---|
| 1a | My lane neighbour texts me through the scoreboard. Part 1 (57) | `specs/stories/lane-ep1.json` | `Lane1` hook a |
| 1b | I skipped my turn to swipe. She wrote YOUR TURN. Part 1 (55) | same | `Lane1` hook b |
| 2a | My lane neighbour texts me. I finally answered. Part 2 (54) | `specs/stories/lane-ep2.json` | `Lane2` hook a |
| 2b | She dared me on the scoreboard. My phone buzzed. Part 2 (55) | same | `Lane2` hook b |
| 3a | A stranger on the next lane bet me fries. Part 3 | `specs/stories/lane-ep3.json` | `Lane3` hook a |
| 3b | Loser buys fries, she typed. So I tried to lose. Part 3 | same | `Lane3` hook b |

**What happened (part 1, nightly for 2026-11-08):** 32 s, vote up at 19.9 s. He swipes at the foul line, TURN SKIPPED; her box
YOUR TURN; he types SORRY, pockets the phone; gutter; one pin (her box NICE!); her strike; BEAT ME?; his pocket buzzes; vote
"what should I put in my name box?" A ONE SEC / B GAME ON (B wins). Blind check round 1 clarity 6 (swiping not visible,
strips over the boards, keypad unreadable, vote ambiguous), round 2 clarity 7, hook a 6 / b 7, satisfaction 5 (the part's own
payoff is thin: give part 2 a bigger one).

**What happened (part 2, nightly for 2026-11-09):** lane-1-a never posted (the phone keyboard auto-capitalised "and" after
"BEAT ME?", failing the caption check), so P1 = lane-1-b only: 143 at 3h, 53% skip. P2 opening rebuilt brighter with ONE
strip, big boards (his box blinking cursor, hers BEAT ME?), his phone buzzing. 32 s. Take 1 ONE SEC: timer ring runs out
(TIME!), her box OK, she turns back; rewind icon, pins fly back up. Take 2 GAME ON: phone off, spare (NICE!), her strike
(YOUR MOVE), his first strike, air high-five over the ball return (OK. WOW., tied); her box LOSER / BUYS / FRIES?; vote
"loser buys fries. what should I type?" A LET YOU WIN / B DEAL (fully up ~20.7 s); end card "lane 8 · part 3 · A or B".
Blind check round 1: clarity 7, hook a 6 / b 7, satisfaction 6, want_next 7.
**Part 3 is decided:** B DEAL wins (letting her win is patronising). A plays first: he types LET YOU WIN, rolls a deliberate
gutter, her box flips to REALLY? and she bowls her own last ball with her back to him; rewind. B: DEAL, both bowl the last
frame for real. **Kill check:** if P2's first publish (lane-2-a) is also on the floor at 24h, kill Lane 8.

**What happened (part 3, nightly for 2026-11-10):** lane-2-a 283 at 6h, 37% skip (best since Across P2) -> continue. 32.4 s.
Take A LET U WIN: deliberate gutter, her box REALLY?, she bowls alone; ball rewinds. Take B DEAL / FINE.: her SPARE! (141-133),
his wobbling-pin STRIKE! wins 143-141, her box I BUY., fries slide along the ball return and he slides half back. Cliff: her
box types NAME?; vote (up ~25.1 s) "she wants my real name. what should I type?" A PLAYER 7 (stay a mystery) / B DAN.
Blind check 2 rounds: clarity 7, hook a 5 / b 7, satisfaction 6, want_next 6 (flags: take A's failure hard to read in stills,
fries small). **Part 4 lean:** B DAN (the series is about trading the screen name for a real one); if lane-3-a sits on the
floor at 24h (<270, >45% skip), make part 4 the finale.


## Season 8 · Table Nine (silent wedding-reception romance, place-card tents)

**Logline:** Two strangers are seated side by side at a wedding's singles table, both swiping alone under the cloth. The folded
place-card tent between them becomes their only conversation: she edits his card, he writes back, and the card passes across
the table.

**Why this season:** replaces Seven Across (ended 2026-11-09). Keeps what works: silent, two strangers, a written device, a
plain first-person hook, and the apps as the visible situation in frame 1 (as in the 12.5k Alley P1). Frame 1 follows the
one-strip hypothesis: ONE strip, one big bright device (the tent card), two large faces, both phones visibly swiping (generic
card glow only). Picked pitch 1 of 5 on 2026-11-10 (others: Red Light chalk crossing, Fifty Whites paint chips, Plot 14
garden stakes, Highlights library book; keep them for later seasons). No named couple, no real venue, no app UI; she writes
her own lines and is never the punchline.

| | Look | How they write |
|---|---|---|
| Him (Ollie, shown only on his card) | aubergine suit, terracotta tie, messy dark hair, flushed ears | marker on the tent, lowercase in parentheses |
| Her (name withheld until part 6) | sage-green dress, marigold earrings, low bun | marker on the tent, lowercase in parentheses, dry asides |

**Device:** one folded double-sided place-card tent (printed name and table, Gelasio) and one marker slid across the cloth.
Max ~18 characters per line. Votes offer two answers about him; the wrong one embarrasses him, never her.

**Look and sound:** ivory reception in flat paper cut-outs. Ivory #FBF5E9, eucalyptus #86A38C, terracotta #D9785B,
marigold #F2B632, aubergine ink #2B1630, champagne #E9D9B0. Nunito Sans 800 strips and end card, Gelasio for the printed
card, Permanent Marker for handwriting. Big-headed half-figures. Far plane string-light bokeh and an arch window, mid plane
table and lazy Susan, near plane blurred sprigs. **Signature transition:** the lazy Susan spin (backwards for a rewind).
Pizzicato-strings waltz in 3/4 at 96 bpm that drops out for the shared moment, fork-on-glass tinks, room tone, marker
squeaks, phone taps. Code: `src/stories/table/{world,ep1}.tsx`; audio: `python3 generate_table_audio.py table-ep1`.

**Arc (6 parts):**
1. **Still swiping?** She edits his card; he writes back; she out-swipes him ("since the bread"); both phones go face down on
   the same beat. Vote "why table nine? what should I write?" A I'M GREAT AT WEDDINGS / B I'M NOT. HENCE TABLE 9 (B wins).
2. **Why table 9.** A plays first and fails on him (the DJ calls the floor, he loses to it); lazy Susan spins backwards;
   B carries on, she laughs. Next vote again about him.
3. **The speech.** The best man's endless toast; cards trade under it. Make the honest answer A this time.
4. **The seating chart.** Table 9 gets moved to the back; a guest's phone may chime NoSwipe (mention 1, only if it is part
   of the gag: Across' bystander mention was cut as a plug).
5. **Last song.** The floor lights up; phones in his jacket; she is called to the family photo.
6. **One card.** Finale, no phones: names for the first time, one tent reads "OLLIE · NOOR".

**Posting:** noswipe.app in the bio only, no mention in part 1. End card "table nine · part 2 · A or B", never "tomorrow".
Wind-down rule: two parts in a row on the floor -> finale, not a fade.

| Ep | Title | Spec | Composition |
|---|---|---|---|
| 1a | The stranger beside me at this wedding swipes too. Part 1 | `specs/stories/table-ep1.json` | `Table1` hook a |
| 1b | A singles table stranger rewrote my place card. Part 1 | same | `Table1` hook b |
