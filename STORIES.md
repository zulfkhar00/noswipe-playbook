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

**What happened (part 2, nightly for 2026-11-26, round 2):** 39.6 s, vote board up 32.55 s, end card 36.85 s. Frame 1 has a clear strip of glass showing the valley far
below; a 0.8 s exterior insert (3.0-3.8) shows the red cabin "6" hanging on the cable. Viewers' B (lose on purpose) is played second (loser-first rewind). Board
X X _ / O O _, "winner asks / 1 question.", take 1 = A: his X top-right, thick red strike, he freezes and writes DO YOU LIKE SNOW?, she looks out and writes "...yes.",
strip "I wasted my one question.", he sinks into his collar; a breath re-fogs the glass ("rewind. take 2."). Take 2 = B: his X in the far corner, she completes
O O O, squints, "you let me win." / "why?", "WANTED YOUR / QUESTION.", her real laugh (goggles bounce). Waltz drops to wind plus one glock note, then the pylon jolt:
camera shake, cut to the exterior (cabin stops dead and swings, KA-CHUNK burst, strip "the gondola stops. mid-air."), he wipes a patch of fog and looks down, POV of
tiny pines far below, his face goes pale with sweat and a gulp (strip "she doesn't know I'm scared of heights."), her "stuck. / you ok?", then the vote A ADMIT: SCARED /
OF HEIGHTS. / B PLAY IT COOL. / ANOTHER GAME. Writing arms now drop away right after each line, fog text sits in clear fog above the board with a dark thick outline.
Blind checks for the exports still to do.
