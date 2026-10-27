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
