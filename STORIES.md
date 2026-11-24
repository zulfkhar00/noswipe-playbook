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

| 4a FINALE | She asked my real name on the bowling scoreboard. Finale (56) | `specs/stories/lane-ep4.json` | `Lane4` hook a |

**What happened (part 4 FINALE, nightly for 2026-11-11):** lane-3-a floored (248 at 6h, 45% skip) -> finale. 30 s, no vote.
Frame 1: his phone lit mid-swipe, boards NAME? / PLAYER 7. He pockets it, deletes PLAYER 7, types DAN; her board JUNE; LAST
GAME, house lights dim; her strike, his gutter (NICE TRY / NICE, DAN); both leave their phones in the shoe cubbies; fries on
one bench; boards merge DAN · JUNE; "send this to someone you'd bowl badly with"; end card "lane 8 · the end". No NoSwipe
mention (no gag-shaped place for it). Blind check 1 round: clarity 7, hook 7, satisfaction 7, want_next 6. **Season over.**


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
| 2a | Wedding stranger asked why I'm single. Part 2 (45) | `specs/stories/table-ep2.json` | `Table2` hook a |
| 2b | Singles table. She asked why I'm on it. I lied first (52) | same | `Table2` hook b |
| 2c | A wedding stranger caught me swiping. Then she wrote this (57) | same | `Table2` hook c |

**What happened (part 1, posted 2026-11-10):** breakout on both hooks: table-1-a 1451 at 6h (32% skip), table-1-b (repeat)
858 at 6h (29% skip). Vote B (I'M NOT. HENCE TABLE 9) carried as planned.

**What happened (part 2, nightly for 2026-11-11):** 32 s. Frame 1: his phone lit mid-swipe, tent card "(why table 9?)"; he
flips the phone face down. Take 1 "(i'm great at weddings.)": spotlight, DJ sign SINGLES TO THE FLOOR!, conga line carries him
off while she eats cake ("I lost to the dance floor."). Lazy Susan spins back. Take 2 "(i'm not. hence table 9.)": she laughs,
"(same. good table.)", ignores her buzzing phone, stands her card next to his. Best man taps his glass; her card "(cake? sneak
out?)". Vote (up 21.8 s) "she wants to sneak out mid-speech. what do I write?" A (YES. NOW.) / B (AFTER THE SPEECH.).
Blind check 1 round: clarity 7, hook a 5 / b 6 / c 5, satisfaction 7, want_next 7 (fixed after: "two tents" strip, cake vs
sneak-out mismatch). **Part 3 (The speech):** A is the planned winner (honest, bold); B plays first and fails on him: the
speech never ends, he falls asleep on the cake.

| 3a | The stranger at this wedding wants to sneak out. Part 3 (55) | `specs/stories/table-ep3.json` | `Table3` hook a |
| 3b | Mid-speech, a wedding stranger caught me swiping. Part 3 (56) | same | `Table3` hook b |

**What happened (part 3, nightly for 2026-11-12):** Table P2 broke out on all three hooks (2092 / 1538 / 1156). 33 s. Frame 1:
his phone lit mid-swipe, card "(cake? now?)", best man at the mic behind. Take 1 "(after the speech.)": the speech never ends
(cue-card stack, baby slideshow, spinning clock), "the cake rolled past.", empty stand, "I waited. the cake left." Lazy Susan
rewind, "rewind. take 2." "(yes. now.)": they crouch-walk out, two forks, terrace, one slice, napkin "(best speech ever.)", his
pocket buzzes and he ignores it. Cliff: the aunt's new card "TABLE 2 · moved for family photos". Vote (up 23.7 s) "they're moving
her to table 2. what do I write?" A (TAKE ME WITH YOU.) / B (I'LL SWAP OUR CARDS.). Blind check 2 rounds: clarity 8, hook a 8 /
b 7, satisfaction 7, want_next 8 (I rewrote hook b and added the cart and rewind strips). Open: the forks shot has no strip; his
buzzing pocket glow reads as a ring box. **Part 4 (seating chart):** pick the winner from comments; if none, B (swapping the
cards is the bolder gag), A plays first and fails on him.

| 4a | They moved the stranger beside me at this wedding. Part 4 (57) | `specs/stories/table-ep4.json` | `Table4` hook a |
| 4b | Wedding stranger got moved to table 2. I had a plan. Part 4 (59) | same | `Table4` hook b |

**What happened (part 3, posted 2026-11-12):** table-3-a 1525 at 12h (33.5% skip); table-3-b floored (345 at 6h, 42% skip) on
the same body: its "mid-speech, ..." line was the problem. No usable vote counts; B (swap the cards) carried as planned.

**What happened (part 4, nightly for 2026-11-13):** 33.6 s. Frame 1: his phone lit mid-swipe, the TABLE 2 / "moved for family
photos" card at her seat, the aunt with a clipboard. Take 1 "(take me with you.)": he drags his chair to table 2 and ends up in
the family photo ("wrong move. I'm in their family photo now."). Lazy Susan rewind (big "rewind. take 2." held 1.5 s). Take 2
"(i'll swap our cards.)": he swaps his OLLIE card for COUSIN RAJ's at table 2 ("her cousin got my seat at table 9."), the aunt
double-takes and shrugs ("her aunt saw. said nothing."), she writes "(smooth.)". Cliff: LAST SONG, her card "(dance?)", he
freezes. Vote (up 24.3 s) "she asked me to dance. I can't dance. what do I write?" A (I CAN'T. TEACH ME?) / B (I'LL WATCH YOUR
BAG.). Blind check 3 rounds: clarity 6 -> 6 -> 7 (I rewrote four strips and hook b myself), hook a 5 / b 8, satisfaction 7,
want_next 8. Open: the swap with three cards is still busy. **Part 5 (Last song):** A is the planned winner (honest); B plays
first and fails on him (he guards her bag alone while the whole room dances, maybe the bag owner is the aunt). Phones in his
jacket; she is called to the family photo as the cliff. Wind-down: if table-4-a floors at 6h, make part 5 the finale.

| 5a | Wedding stranger asked me to dance. I can't dance. Part 5 (49) | `specs/stories/table-ep5.json` | `Table5` hook a |
| 5b | The girl I like asked me to dance. I really can't. Part 5 (49) | same | `Table5` hook b |

**What happened (part 4, posted 2026-11-13):** table-4-a 1848 at 12h (35.6% skip), table-4-b 2017 at 6h (30.4%): the stakes
line beat who+where. No usable comment votes; A (TEACH ME) carried as planned.

**What happened (part 5, nightly for 2026-11-14):** 33.6 s, vote up 24.3 s. Frame 1: his phone lit mid-swipe, her card
"(dance?)", LAST SONG sign, the aunt behind. Take 1 "(i'll watch your bag.)": the room dances, the aunt in the conga, he hugs her
sequined bag in a spotlight ("I became the bag guy."). Lazy Susan rewind. Take 2 "(i can't. teach me?)": she laughs, draws two
footprints, "(stand here.)"; he steps on her toe; his pocket buzzes, ignored; music drops out; "I can't dance. we danced
anyway." Cliff: house lights up, the aunt with keys "car's here!", the last blank card slides over. Vote "she's leaving. one card
left. what do I write?" A (MY NAME. YOURS?) / B (SAME TABLE NEXT WEDDING?). Blind check 1 round: clarity 7, hook a 5 / b 7,
satisfaction 6, want_next 7. Open: the dance shots fade the torsos into dark blocks; the slow-sway reads as a pose.
**Part 6 (finale, One card):** A wins (names: OLLIE · NOOR), B plays first and fails on him; no phones; season over.

| 6a | The girl I like at this wedding is leaving. Part 6 (42) | `specs/stories/table-ep6.json` | `Table6` hook a |
| 6b | A stranger caught me swiping at this wedding. Part 6 (44) | same | `Table6` hook b |

**What happened (part 6 finale, nightly for 2026-11-15):** 34 s, no vote. Frame 1: his phone lit mid-swipe (flipped face down
at 1.5 s, the last phone we see), the blank tent, the aunt with car keys; "we never spoke. we only wrote on this card." Take 1
"(same table next wedding?)": the aunt grabs the card, writes "(it's a date! -auntie)" and pinches his cheek ("her aunt said
yes.", "it wasn't for her."). Lazy Susan rewind. Take 2 "(ollie. yours?)" -> "(noor.)", the tent turns to OLLIE · NOOR, "she
waved. I kept the card."; payoff on the empty table: "(same table / next wedding.)" in her hand, "she wrote back." End card
"table nine · the end · follow for the next story". Blind check 2 rounds: clarity 6 -> 7, hook a 6 / b 5, satisfaction 8,
want_next 6 (round 2 added the aunt-grab strips, bigger ink, warm reveal). Posted while the phone was offline: it queues behind
P5. Season over.

## Season 9 · Fifty Whites (silent paint-aisle romance, paint-chip handoffs)

**Logline:** Two strangers each need a white for their own flat and both keep swiping between the chips. She starts
answering him with paint-chip names and a pencil on a chain.

**Why this season:** the apps-visible opener won 7 of 7 posts (Table Nine P1-P2, the Lane 8 finale), so frame 1 keeps ONE
strip, two big faces, a phone lit mid-swipe and one big bright device. Here the device is also the swipe-fatigue metaphor:
fifty near-identical whites. Runs in parallel with Table Nine in a different setting, palette, type, cast, transition and
sound. Picked pitch 1 of 5 on 2026-11-12 (others: Pie for Two, a holiday-night diner, kept for Thanksgiving week; Red Light
chalk wall; Highlights library book; Plot 14 garden stakes).

| | Look | How they talk |
|---|---|---|
| Me (him, unnamed) | charcoal hoodie, tidy dark hair, flushed ears, phone | hands chips across; his reflex is to swipe chips off the fan like cards |
| Her (name withheld until part 6) | oatmeal knit, claw clip, paint-flecked cuffs | hands chips; writes on the back of a chip with the pencil on the chain, lowercase, dry |

**Device:** a fan-deck of paint chips with invented generic names (FOG, OAT MILK, SAME, EGGSHELL, POPPY, ALMOST TUESDAY).
A chip handed across is the line; the back of a chip takes two short pencil lines (max ~18 characters each). Votes offer
two chips about him; the wrong one embarrasses him, never her.

**Look and sound:** flat paper cut-outs in a bright hardware aisle. Navy #1B2A4A (pegboard, ink), cobalt #2F5BFF, poppy
#FF4F8B, sunflower #FFC400, mint #5EE0B5; the whites #FAFAF7, #F3EBDD, #EADFC8, #E4E8EA; his hoodie #3A3D45, her knit
#CDBB9C (neutral clothes so the chips are the only colour). Big-headed half-figures with a white die-cut paper edge. Far
plane pegboard and chip racks, mid the fan and chip tray, near the rack edge, pencil on a chain, a blurred paint can. Fonts:
Inter 800 (chip names, vote cards, strips), Anton (end card), Courier Prime (stamp). **Signature transition:** the
fan-deck (chips fan out from a corner pivot to reveal the next shot; a rewind snaps the fan shut). Sound: fluorescent hum,
chip riffle on every handoff, intercom ding, paint-shaker rattle; easy bossa at 100 bpm (nylon pluck, shaker, soft bass)
that drops out for the shared moment. Code: `src/stories/whites/{world,ep1}.tsx`; audio: `python3 generate_whites_audio.py
whites-ep1`.

**Arc (6 parts):**
1. **Which white.** Both swipe in the aisle; she hands him SAME; shared laugh; phones down; she asks which white he is.
   Vote A EGGSHELL / B POPPY (B planned to win).
2. **Poppy.** A plays first and fails on him (he hands EGGSHELL and blends into the beige test wall while she walks past;
   the fan snaps shut as the rewind); B: POPPY, she laughs. Next vote about him.
3. **Mixing.** Ten minutes at the paint shaker pins them together. Make the honest answer A this time.
4. **Test patch.** They paint a test square each. A bystander's phone may chime NoSwipe (mention 1, only as part of the gag).
5. **Closing time.** The intercom calls her; she leaves her chip on the shelf.
6. **One chip.** Finale, no phones: names for the first time, two chips taped together read "POPPY + SAME".

**Posting:** noswipe.app in the bio only, no mention in part 1. End card "fifty whites · part 2 · A or B", never
"tomorrow". Wind-down rule: two parts in a row on the floor -> finale, not a fade.

| Ep | Title | Spec | Composition |
|---|---|---|---|
| 1a | The stranger in the paint aisle swipes too. Part 1 (51) | `specs/stories/whites-ep1.json` | `Whites1` hook a |
| 1b | A stranger caught me swiping in the paint aisle. Part 1 (56) | same | `Whites1` hook b |

**What happened (part 1, nightly for 2026-11-12):** 32 s, vote up 21.8 s. Frame 1: both phones lit mid-swipe with a profile
card (generic portrait), the fan of whites between them, his guilty side-eye, her smirk. He flicks three chips off the fan like
swipes ("I swipe left on paint now."); she hands him SAME ("she handed me this."), tilts her own phone ("she swipes too."),
shared laugh, "phones down. both of us."; she writes "which white / are you?" on the back; EGGSHELL vs POPPY ("one of these
isn't white.", "she's waiting."); fan-deck wipe to the vote A EGGSHELL (the safe one) / B POPPY (not a white). Blind check 2
rounds: clarity 6 -> 7 (fixed: phones didn't read as dating, SAME unexplained, blur block, icon), hook a 5 / b 7, satisfaction
5, want_next 7. **Part 2 lean:** B POPPY wins; A plays first (he hands EGGSHELL and blends into the beige test wall). Give part
2 a bigger payoff of its own (satisfaction 5 here). If whites-1-a sits on the floor at 6h (<300, >40% skip), revisit.

| 2a | Paint aisle stranger asked which white I am. Part 2 (51) | `specs/stories/whites-ep2.json` | `Whites2` hook a |
| 2b | She caught me swiping, then asked which white I am. Part 2 (58) | same | `Whites2` hook b |

**What happened (part 1, posted 2026-11-12):** breakout on both hooks: whites-1-a 2195 at 6h (23.4% skip, best ever),
whites-1-b 1613 at 3h (25.5%). B POPPY carried as planned.

**What happened (part 2, nightly for 2026-11-13):** 33.1 s, vote up 23.1 s. Frame 1: his phone lit mid-swipe (1.5x, profile card
with a heart badge), her chip "which white / are you?". Take 1 EGGSHELL: he fades into the beige test wall, she looks for him
("the safe answer. I became the wall."). Fan-deck snaps shut (rewind). Take 2 POPPY ("not a white. she laughed."), then the
payoff close-up: her can with POPPY taped on the lid beside his chip, labelled HER CAN / MY CHIP, "same pink." ("she'd picked it
too."). Mixing counter "MIXING / 10 MIN WAIT", one bench, his phone buzzes big in his pocket. Vote "ten minutes on one bench.
what do I do?" A PHONE AWAY. ASK HER. / B SHOW HER MY MATCHES. End card "fifty whites · part 3 · A or B". Blind check 3 rounds:
clarity 7 -> 6 -> 7 (I added the close-up labels after round 2), hook a 7 / b 6, satisfaction 5 -> 6, want_next 8. Open: her
can is not planted before the reveal; her pat arm is stiff. **Part 3 (Mixing):** A wins (honest); B plays first and fails on
him (he scrolls her through his matches, all "seen 3 weeks ago"; she winces for him). Then A: his phone goes in the basket,
they talk while the shaker rattles.

| 3a | Ten minutes on a bench with the paint aisle stranger. Part 3 (52) | `specs/stories/whites-ep3.json` | `Whites3` hook a |
| 3b | Caught swiping again, now stuck on one bench with her. Part 3 (53) | same | `Whites3` hook b |

**What happened (part 2, posted 2026-11-13):** whites-2-a 2211 at 6h (21.1% skip, best ever), whites-2-b 2942 at 3h (23.2%, best
3h ever). A (PHONE AWAY) carried as planned.

**What happened (part 3, nightly for 2026-11-14):** 34.0 s, vote up 24.1 s. Frame 1: both on the bench, his phone lit mid-swipe,
"MIXING · 10 MIN WAIT", her POPPY can in the shaker. Take 1 SHOW HER MY MATCHES: every match stamped "seen 3 wks ago", she
winces and pats him. Fan snaps shut. Take 2 PHONE AWAY. ASK HER.: phone into the basket, chips "what's the room for?" / "my first
own place." / "mine too."; the shaker stops, the music drops out; the clerk slides two POPPY cans ("two cans. same pink.").
Cliff: she paints a test square and holds out the brush, "your turn." Vote "she handed me the brush. what do I paint?" A (A TINY
HEART.) / B (A WINDOW. FOR YOUR ROOM.). Blind check 1 round: clarity 8, hook a 6 / b 8, satisfaction 6, want_next 8. Open: her
pat can read as a shove; "seen" stamps are small; nothing says the paint is for a new flat before the chip question.
**Part 4 (Test patch):** B (the window) is the planned winner (sweet, about her room); A plays first and fails on him (the heart
drips into a blob). A bystander's phone may chime NoSwipe only if it is the gag.


| 4a | The paint aisle stranger handed me her brush. Part 4 (52) | `specs/stories/whites-ep4.json` | `Whites4` hook a |
| 4b | She caught me swiping and handed me her brush. Part 4 (53) | same | `Whites4` hook b |

**What happened (part 4, nightly for 2026-11-16):** 34.0 s, vote up 23.9 s. Frame 1: his phone lit mid-swipe, her arm holding
the brush out, her wet POPPY square on the TEST PATCH board. Take 1 A TINY HEART.: the heart drips into a tomato ("I painted a
heart. it's a tomato."), she holds in a kind smile and gives a thumbs-up. Fan snaps shut ("rewind. take 2."). Take 2 A WINDOW.
FOR YOUR ROOM.: a POPPY window; she writes "it needs / a view." and paints a sunflower sun in it; shared laugh; she holds the
board up and keeps it. Cliff: intercom, STORE CLOSES / IN 10 MIN, "we never even swapped names." Vote "they're closing. what do
I do?" A (ASK HER / FOR COFFEE.) / B (BUY MORE / PAINT. STALL.). End card "fifty whites · part 5 · A or B". No NoSwipe mention
(both season slots still free; best fit a cashier's phone in part 5's STALL branch). Blind check 1 round + polish: clarity 7,
hook a 6 / b 7, satisfaction 7, want_next 8. Open: the thumbs-up hand reads as a raised finger; her arms are long diagonals.
**Part 5 (Closing time):** A wins (honest, planned); B plays first and fails on him (he buys a cart of rollers, tape and a
ladder at the register while the intercom calls her; she leaves her chip on the shelf), then rewind and A.

| 5a | The girl I like leaves the paint aisle in 10 min. Part 5 (56) | `specs/stories/whites-ep5.json` | `Whites5` hook a |
| 5b | She caught me swiping. Now the store is closing. Part 5 (55) | same | `Whites5` hook b |

**What happened (part 5, nightly for 2026-11-17):** 34.2 s, vote up 24.3 s. Frame 1: his phone lit mid-swipe, a hanging sign
STORE / CLOSES / IN 10 MIN between the two faces, her holding the TEST PATCH board (POPPY window + sunflower sun), a register
with a bored cashier, an empty chip stand. Hook a "the girl I like from the paint aisle leaves in 10 min." / hook b "she caught me
swiping. now the store closes in 10 min."; stakes strip "we never even swapped names." at 3.1 s. Take 1 BUY MORE PAINT. STALL.:
basket of rollers, tape and a ladder, ITEMS counter to 48, intercom ding (sign flips to NOW), she places her POPPY chip on the
stand (bigger, where she stood), waves and leaves by 7.3 s (her spot is empty), the ladder tips onto him ("I bought a ladder. she left."). Fan snaps shut ("rewind. take 2."). Take 2
ASK HER FOR COFFEE.: his pocket phone buzzes (a heart pops out of his hoodie pocket) and he ignores it; he writes "coffee? / across the / street?" and
slides it over; she reads, laughs (music drops out), flips the chip and writes "only if you / pick the cup." with a cup doodle,
whole-frame close-up ("yes. with conditions."). Cliff outside: shutter down, a CAFE across the street, she holds a chip "so,
what's / your name?". Vote "what do I write on my chip?" A (MY REAL NAME. / NO JOKE.) / B (JUST SIGN IT / 'LADDER GUY'.). End card "fifty
whites · part 6 · A or B". No NoSwipe mention (both season slots still free; part 6 finale is no-phones, so a mention would need
to land in the finale's last beat or be skipped). Hands redrawn locally (`Hand5`: short near-vertical arms, short side thumb, no
thumbs-up). Blind check: clarity 7, hook a 5 / b 7, satisfaction 6, want_next 7; polish round done (phone lit through 3 s on both hooks, earlier exit, pocket phone, smaller close-up chip, register enlarged, B = callback to the ladder). **Part 6 (finale):** A (real name) is the planned winner; B plays first and fails on
him (he signs as LADDER GUY, she reads it deadpan), rewind, A, names exchanged, two chips taped together read "POPPY + SAME".

| 6a | The girl from the paint aisle asked my name. Part 6 (44) | `specs/stories/whites-ep6.json` | `Whites6` hook a |
| 6b | She caught me swiping, now she wants my name. Part 6 (45) | same | `Whites6` hook b |

**What happened (part 6 finale, nightly for 2026-11-18):** 34.0 s, no vote. Frame 1: outside the closed store at dusk (shutter
down, PAINT sign, CAFE across the street), his phone lit mid-swipe, her chip "so, what's / your name?". Hook b adds the catch
(her eyes drop to his screen, raised brow, pink "!" at 0.8 s, he flinches with sweat). Context strip "we met in a paint aisle. we
only talked on paint chips." at 3 s, phone off. Take 1 LADDER GUY: she writes "i'll wait / for the / real one." and turns to the
cafe. Fan snaps shut (rewind). Take 2 THEO; she writes "june. / hi, theo.", shared laugh, music drops out; she tapes POPPY to
SAME ("fifty whites. we picked the same one."); they cross to the cafe, two silhouettes and two cups ("real names. first
coffee."). End card "fifty whites · the end · follow for the next story". Blind check 1 round: clarity 8, hook a 6 / b 8,
satisfaction 7, want_next 6. Open flags (not fixed): the chip conceit is told, not shown, at 5 s; POPPY/SAME callback is opaque
cold (POPPY is pink, not a white); "june." could read as the month; walkers small and faint at 26 s. No NoSwipe mention this
season. Season over; only P6 was made tonight (phone off since 11-14, 16 posts queued).

## Season 10 · Same Bag (silent baggage-claim romance, luggage-tag handoffs)

**Logline:** Two strangers wait at the same carousel, both swiping. Two identical grey suitcases, one wrong grab, and she
answers him on the back of luggage tags.

**Why this season:** replaces Table Nine (finale 2026-11-15) and runs in parallel with Fifty Whites. Keeps the apps-visible
opener (ONE strip, two big faces, a phone lit mid-swipe, one big bright device); the kraft tag is shown whole-frame whenever it
carries a line. Picked pitch 3 of 5 on 2026-11-15 (others: Cabin Six gondola fog-writing, Highlights library book, Red Light
chalk wall, Four Frames photo booth; Pie for Two still reserved for Thanksgiving week). Picked for the most everyday, instantly
readable setting and a plain mix-up hook, ahead of holiday travel.

| | Look | How they write |
|---|---|---|
| Him (unnamed) | olive bomber, rumpled hair, flushed ears; grey suitcase, no loop | pen on a kraft tag, lowercase in parentheses |
| Her (name withheld until part 6) | camel coat, round glasses, curly bob; grey suitcase with a chartreuse tag loop | pen on a kraft tag, dry and kind |

**Device:** a double-sided kraft luggage tag and one pen, max ~18 characters per line. Votes are about him; the wrong one
embarrasses him, never her.

**Look and sound:** flat paper cut-out arrivals hall: concrete #E6E3DC, hi-vis chartreuse #C6F135, amber #FFB000, carbon
#1C1C1F, sky #8EC9FF, kraft #D8B589, slate suitcases #5B6B7A. Jost 800 (strips, vote cards, end card), Barlow Condensed 700
(the generic ARRIVALS / BELT 4 board), Caveat 700 (tags). **Signature transition:** the belt-flap wipe (reversed belt for a
rewind). Sound: belt rumble, wheel clacks, soft house at 110 bpm with electric piano that drops out for the shared moment,
tag slides, pen scratches, a board flip, a muted match buzz. Code: `src/stories/bag/{world,ep1}.tsx`; audio:
`python3 generate_bag_audio.py bag-ep1`.

**Arc (6 parts):**
1. **Same bag.** He grabs her identical bag; sorry on her tag; she points to his; swap, laugh, phones into the bags. She
   writes "(rough trip?)" on his tag. Vote A (WORK. VERY BUSY.) / B (A DATE THAT DIED.) (B planned).
2. **Rough trip.** A plays first and fails on him (pompous, then trails his bag round the belt); belt reverses; B carries on.
3. **Stuck zip.** Her zip jams, he fixes it his own way. Honest answer is A this time.
4. **Long wait.** Her ride is delayed, one bench. A bystander's phone may chime NoSwipe (mention 1, gag only).
5. **Lost bag.** Her second bag never arrives; she is called to the desk.
6. **Two tags.** Finale, no phones: names, two tags clipped to one handle read "MILES · ANYA".

**Posting:** noswipe.app in the bio only, no mention in part 1. End card "same bag · part 2 · A or B", never "tomorrow".
Wind-down rule: two parts in a row on the floor -> finale, not a fade.

| Ep | Title | Spec | Composition |
|---|---|---|---|
| 1a | The stranger at baggage claim swipes too. Part 1 (40) | `specs/stories/bag-ep1.json` | `Bag1` hook a |
| 1b | She caught me swiping at baggage claim, then wrote this (55) | same | `Bag1` hook b |

**What happened (part 1, nightly for 2026-11-15):** 32.6 s, vote up 23.5 s. Frame 1: his phone lit mid-swipe, her huge kraft
tag "(that one's mine.)", ARRIVALS / BELT 4, his hand on her bag (chartreuse loop); "I grabbed her bag. it looks like mine."
"hers" / "mine" labels; sorry on her tag, "(yours: behind you.)", swap; she ties a chartreuse bow on his handle ("she marked
mine. so I'd stop taking hers."); phones away; she writes "(rough trip?)" on his tag; his pocket buzzes, he doesn't look;
belt empty, she waits. Vote "she asked if it was a rough trip. I flew in for a date. it flopped." A (WORK. VERY BUSY.) / B (A
DATE THAT DIED.). Blind check 2 rounds: clarity 6 -> 7, hook a 5 / b 7, satisfaction 4 -> 5, want_next 7. Open for part 2: the
date backstory lands only at the vote (plant it earlier), the bow makes both bags chartreuse, the second strip covers the
board. **Part 2 (Rough trip):** B wins unless comments say otherwise; A plays first and fails on him.

| 2a | A baggage claim stranger asked about my trip. Part 2 (52) | `specs/stories/bag-ep2.json` | `Bag2` hook a |
| 2b | Baggage claim stranger caught me swiping. Again. Part 2 (55) | same | `Bag2` hook b |

**What happened (part 2, nightly for 2026-11-16):** 33.4 s, vote up 23.8 s. Frame 1: his phone lit mid-swipe, her big tag
"(rough trip?)". Backstory planted at 3-5.7 s: limp flowers droop, "I flew in for a date." / "it flopped." Take 1 (work. / very
busy.): he poses, sets his bag on the belt, it rides away, he chases it. Belt-flap wipe reversed (rewind). Take 2 (a date / that
died.): they laugh together, she writes "(their loss.)", then her own tag "(same. layover.)"; tags tap. His ribbon is now AMBER
(only her bag is chartreuse). Cliff: her zip jams with her phone half in. Vote "her zip's stuck. what do I do?" A (ASK FIRST.
THEN HELP.) / B (YANK IT. LOOK STRONG.). End card "same bag · part 3 · A or B". Blind check 1 round + fixes (bag exit, shared
laugh, full "(their loss.)", bigger payoff tags, zip close-up, bigger phone): clarity 7, hook a 5 / b 6, satisfaction 7,
want_next 7. Open: the swiping thread drops after frame 1. **Part 3 (Stuck zip):** A wins (planned); B plays first and fails
on him (he yanks, the tab pops off, he topples over his own bag), belt reverses, then A.

| 3a | Her phone got stuck in her zip at baggage claim. Part 3 (55) | `specs/stories/bag-ep3.json` | `Bag3` hook a |
| 3b | She caught me swiping. Now her zip's stuck. Part 3 (50) | same | `Bag3` hook b |

**What happened (part 3, nightly for 2026-11-17):** 34.0 s, vote up 23.95 s. Frame 1: his phone lit mid-swipe, her grey suitcase
(chartreuse loop) held up with the front zip jammed and HER phone (pink case, labelled "her phone" with an arrow) wedged in it,
ARRIVALS / BELT 4; hook a "the stranger at baggage claim got her phone stuck in her zip." / hook b "she caught me swiping. now her
zip's stuck." Take 1 (B, fails on him): he flexes, yanks, the amber zip tab pops off and flies, he trips over his own bag (it tips
over) and rides the belt on his back, legs in the air, while she smiles behind her hand (amused with him). Belt-flap wipe reversed
(rewind). Take 2 (A): his tag "(can I try?)" handed to her, she nods, his pocket phone buzzes and he lets it (glances once, grits
his teeth), he works the tab slowly, her pink-case phone pops free; music drops out for her tag "(my hero. / mildly.)"; payoff of
the swiping thread: his pocket buzzes again, he takes the phone out and switches it OFF (dark screen, power symbol) for her.
Cliff: both look up, the board flips to RIDE / DELAYED 40 MIN. Vote "her ride's late. what do I do?" A (WAIT WITH HER. NO PHONE.)
/ B (FLEX AGAIN. CARRY BOTH BAGS., callback to take 1). End card "same bag. / next: part 4 · A or B". No NoSwipe mention. Blind
check round 1 (clarity 6, hook a 5 / b 7, satisfaction 6) fixed in round 2 (her phone case + label, bent arms, tumble framing, vote
B, end card). Added `noTab`/`caseColor` props to `Bag`/`Phone`, `prefix` to `EndCard`, and a `pops` list to
`generate_bag_audio.py`. **Part 4 (Long wait):** A wins (planned, honest again); B plays first and fails on him, rewind, then A.

| 4a | The girl I like at baggage claim is stuck here 40 min (53) | `specs/stories/bag-ep4.json` | `Bag4` hook a |
| 4b | She caught me swiping, so I switched my phone off (49) | same | `Bag4` hook b |

**What happened (part 4, nightly for 2026-11-19):** 35.4 s, vote up ~26 s. Frame 1: his phone lit mid-swipe on ONE bench beside
her, both grey suitcases; hook a "the girl I like at baggage claim is stuck here for 40 min." / hook b "she caught me swiping. so I
switched my phone off." with her head turn + "!" at 0.6-0.95 s. Both: power press 1.8 s, dark screen, pocketed. Board flips to
RIDE / DELAYED 40 MIN with the P3 vote recap. Take 1 (B, fails on him): he hoists both bags, marches to the EXIT, empty kerb ("no
car. her ride's late."), arms shaking; her tag "(my ride's not here yet.)". Reversed belt-flap rewind. Take 2 (A): phone face down,
her "(rate that bag.)" game, his "(7. strong wheels.)", a lone ski boot "(2. lonely.)", board 40 -> 25 -> 10 MIN; music out for
her "(best part of my whole trip.)", strip "I didn't miss my phone once." Cliff: belt stops, BELT 4 / COMPLETE, BAGGAGE DESK lights,
dashed ghost bag. Vote "her other bag never came. what do I do?" A (GO TO THE DESK WITH HER.) / B (TELL HER IT'LL TURN UP.
LEAVE.). Blind check 1 round: clarity 7, hook a 5 / b 7, satisfaction 7, want_next 6. Unfixed flags: her second bag is never
shown before the cliff (plant it in P5's recap), the vote's B is lopsided, end card "same bag." opaque cold, hook a opener static.
**Part 5 (Lost bag):** A wins (planned); B plays first and fails on him, rewind, then A at the desk.

| 5a | My baggage claim crush just lost her bag. Part 5 (48) | `specs/stories/bag-ep5.json` | `Bag5` hook a |
| 5b | Caught swiping at baggage claim. Now her bag's lost. Part 5 (59) | same | `Bag5` hook b |

**What happened (part 5, nightly for 2026-11-23):** 35.2 s, vote up 27.1 s (tag holds and a new car shot pushed it). Frame 1: his
phone lit mid-swipe, BELT 4 / COMPLETE, her one bag + a dashed "?" ghost of the missing one; hook a "the girl I like at baggage
claim just lost her bag." (her look to the ghost, pulse, his glance by 0.8 s) / hook b "she caught me swiping. now her bag is
lost." (head turn + "!", he pockets the phone). Insert "she had two bags. same chartreuse loop." with labelled bags. Take 1 (B):
"(it'll turn up!)", he strides to the EXIT, the auto doors don't open for him (bonk), they open for a stranger; she is alone at
the desk. Reversed belt-flap rewind. Take 2 (A): DESCRIBE THE BAG form, her "(grey. like everyone's.)", his "(chartreuse loop. I
noticed.)", BELT 5 / COMING OUT, "her 2nd bag" rides out; music out for "(you noticed that?)" / "(hard not to.)"; payoff strip
"found it. because I was looking at her, not my phone." Cliff: a car pulls up at PICK-UP, RIDE / ARRIVED. Vote "her ride's here.
what do I do?" A (ASK FOR HER NAME.) / B (SAY NOTHING. JUST WAVE.). End card "a silent baggage-claim love story / same bag. / next:
part 6 (finale) · A or B". Blind check 2 rounds: clarity 6 -> 7, hook a 6 -> 7 / b 7 -> 6, satisfaction 7, want_next 7. Open: b's
"now her bag is lost" can read as if he caused it; the cause of belt 5 isn't shown. **Part 6 (Two tags, finale):** A wins
(planned); B plays first (he waves, she leaves, he stands alone with her tag), rewind, then names: "MILES · ANYA" on two tags.

| 6a | Her ride is here and I don't know her name. Part 6 (50) | `specs/stories/bag-ep6.json` | `Bag6` hook a |
| 6b | Caught swiping, and I still don't know her name. Part 6 (55) | same | `Bag6` hook b |

**What happened (part 6, FINALE, nightly for 2026-11-24):** 36.0 s, no vote. Frame 1: his phone lit mid-swipe, board RIDE / ARRIVED, her
teal car in the window; hook a "her ride is here and I still don't know her name." / hook b "she caught me swiping. I don't even know
her name." Backstory insert (flopped-date flowers, tags "(rough trip?)" / "(it flopped.)"). Take 1 (B): he just waves, she is gone,
blank "NAME: ____" tag. Reversed belt-flap rewind. Take 2 (A): phone off, "(wait. I'm Miles.)", music out for "(finally. Anya.)", two
tags MILES / ANYA on one handle; driver honks politely; "(coffee? you're buying.)"; an app buzzes, he doesn't look; "I flew in for a
bad date. I left with her tag." End card "same bag. / the end". Blind check 2 rounds: clarity 6 -> 7, hook a 7 / b 6, satisfaction 8,
want_next 6. **Season over.**

## Season 11 · Pie for Two (silent night-diner romance, napkin crayon notes)

**Logline:** Thanksgiving eve, a nearly empty all-night diner. Two solo strangers at the counter, both swiping. One slice of
pumpkin pie is left in the case, and they both order it. They talk on napkins, in crayon.

**Why this season:** started 2026-11-23 for Thanksgiving week (Thu 11-26); reserved since the 2026-11-12 pitch. Runs beside Same
Bag (finale P6 due 11-24). Keeps the apps-visible opener (ONE strip, two big faces, both phones lit mid-swipe, generic glow, the
napkin as the one big bright device). New gag: phones go under upside-down coffee mugs. No real diner or place names.

| | Look | How they write |
|---|---|---|
| Him (name withheld until part 6: WES) | rust work jacket, custard cord collar, hair flat on one side from a long drive, flushed ears | pumpkin crayon, ALL CAPS, short and nervy |
| Her (name withheld until part 6: ROSA) | chunky cranberry knit, gold hoops, curly half-up hair, cream pompom beanie, pink-case phone | cranberry crayon, lowercase, dry and kind |
| The waitress | mint uniform, cream apron, order pad, deadpan, never writes | nothing: the straight man |

**Device:** napkins from the chrome dispenser and a cup of crayon stubs; max ~18 characters per line, two lines per napkin, no
parentheses. A napkin with a line is always a whole-frame insert (~800 px wide, centred near y=760). Never the word "tip" (reads
as gratuity); the stake in P1-P2 is "first bite".

**Look and sound:** flat vector night diner, thick espresso outlines, diagonal gloss on chrome and glass. Espresso ink #2A1810,
night teal #0F3B3A, mint formica #A9DCCB, pumpkin #F2861E, cranberry #B5233F, custard #FFE7A8, chrome #DDE6E9, napkin #FFFDF6.
Strips are printed guest-check slips (custard, torn edges, Courier Prime 700). Napkins Patrick Hand 700; neon, vote letters,
end card Anton; chalkboard Permanent Marker. **Signature transition: the slice wipe** (a crimped pie wedge sweeps clockwise like
a clock hand; counter-clockwise for a rewind). Sound: jukebox doo-wop ballad, 12/8 at 76 bpm (tremolo guitar, upright bass,
brushes, ooh pad, snaps), dropping to fridge hum + one celesta note for the shared moment; plate scrapes, crayon scrawl,
mug-flip clunks, muted buzz under a mug. Code `src/stories/pie/{world,ep1}.tsx`; audio `python3 generate_pie_audio.py pie-ep1`.

**Arc (6 parts; from part 2 the losing option plays first, fails on him, slice wipe reverses "rewind. take 2.", then the winner):**
1. **Last slice.** One plate between them, pushed back and forth ("you first." / "NO. YOU."), cream on his ear, phones under
   mugs, she writes "split it? / who gets first bite?". Vote A YOU TAKE IT. I'M FULL. / B ME. I CALLED IT. **B wins.**
2. **I called it.** A: his stomach growls so loud the mugs rattle, the waitress deadpans a second fork; rewind. B: fork duel for
   the first bite, she lets him, he gives half back. Cliff "why are you at a diner at midnight?" A I'M A PIE CRITIC. / B
   NOWHERE ELSE TO BE. **B wins.**
3. **Nowhere else.** A: pie-critic act, the waitress hands him a one-star REVIEW card; rewind. B: she skipped the family drive too
   (and the questions about the apps); mugs clink. Cliff: the jukebox lights up. A SOMETHING SLOW. / B SOMETHING DUMB. **A wins.**
4. **Last call.** B: a novelty song fills the empty diner; rewind. A: one slow song, two stools. Check "1 PIE · 2 FORKS".
   Optional NoSwipe mention 1 (gag only: the waitress's phone chimes it, she silences it). A I'LL GET IT. / B SPLIT IT. WE'RE
   EVEN. **B wins.**
5. **Closing time.** A: his wallet holds a gum wrapper; rewind. B: split, crust bagged as leftovers, sidewalk at 12:00, her
   brother's car honks; last napkin slides to him. A WES. YOURS? / B I'LL SAVE YOU A SLICE. **A wins.**
6. **One napkin.** Finale, no vote: B first (case empty, she waves from the car), rewind, A: names, one napkin signed in both
   crayons "WES · ROSA". End card "pie for two · the end".

**Posting:** noswipe.app in the bio only, no mention in part 1. End card "pie for two · part 2 · A or B", never "tomorrow".

| Ep | Title | Spec | Composition |
|---|---|---|---|
| 1a | The stranger on the next stool wants my last pie. Part 1 | `specs/stories/pie-ep1.json` | `Pie1` hook a |
| 1b | Caught swiping at a diner. We want the last pie. Part 1 | same | `Pie1` hook b |

**What happened (part 1, nightly for 2026-11-23):** 34.7 s, vote board up 23.7 s, end card 30.1 s. Frame 1: both phones lit
mid-swipe at the counter, her napkin "that's my slice.", LAST SLICE case, 11:41 PM, neon OPEN; hook a "the stranger on the next
stool wants my last slice of pie." / hook b "she caught me swiping. now we both want the last slice." (her eyes to his screen,
"!", his flinch). Adult waitress serves one plate; push-back standoff; napkins "you first." / "NO. YOU."; plate montage, cream on
his ear, shared 1 s laugh, she hands him a napkin; close-up: phones flipped face-down and mugs dropped over them (glow pools);
"best bite" macro; napkin "split it? / who gets first bite?"; his mug buzzes, he looks away. Vote A (YOU TAKE IT. I'M FULL.) / B
(ME. I CALLED IT.). Blind check 2 rounds (round 1: waitress read as a child, mugs/phones unclear, "best bite" missing, napkin
covered): clarity 7, hook a 6 -> 7 / b 7, satisfaction 4, want_next 6. Open: the hook frame shows the standoff before the
"we both ordered" beat (reads as a flash-forward); the napkin is held by him in the face shot though "she asked". **Part 2:** B
wins (planned), A plays first and fails on him.

| 2a | A diner stranger and I fought for the first bite. Part 2 (56) | `specs/stories/pie-ep2.json` | `Pie2` hook a |
| 2b | She saw me swiping. Then we dueled over pie. Part 2 (51) | same | `Pie2` hook b |

**What happened (part 2, nightly for 2026-11-24):** 35.6 s, vote up ~25.8 s. Frame 1: both phones lit mid-swipe, last slice, her napkin
"first bite?"; hook a "the stranger beside me and I are fighting over the first bite of pie." / hook b "she caught me swiping. now we're
dueling over pie." Take 1 (A): YOU TAKE IT. / I'M FULL., stomach growls, the waitress brings him a fork. Slice wipe reversed. Take 2 (B):
phones under mugs, ME. / I CALLED IT., fork duel, "fine. go.", he bites, cuts the rest in half, HALF. / FAIR?, "we finished it." Vote
"she asks why I'm at a diner on Thanksgiving eve." A (I'M A PIE CRITIC.) / B (NOWHERE ELSE TO BE.). Blind check: stills 7, export 6,
after fixes 7; hook a 5 / b 7, satisfaction 6, want_next 6. Open: hook a opener low action, mugs not explained or paid off in this part,
vote card near-static. **Part 3 (Nowhere else):** B wins (planned), A plays first and fails on him.
