# NoSwipe video ads

NoSwipe (https://noswipe.app) is a done-for-you dating service concept: a 2-minute form, then "we build your profiles, swipe, chat and book the date" on Tinder, Bumble and Hinge, and you get a date card. **There is no product yet:** these videos are demand tests that drive people to the site.

## Rules for every video
- **Clarity first.** A cold viewer must get the situation from the first 3 seconds in plain words, before any gag. Pass the one-sentence test: a stranger can retell it after one watch.
- **Honest claims.** Never mention the $1 reservation. Never promise a number of dates (the site says it can't). No fake testimonials and no implied existing users: narrators are obvious comedy characters (e.g. the thumb).
- **No Tinder, Bumble or Hinge logos or UI.** Their names may appear only as plain text in the brand font, as on the site.
- **CTA:** a soft "noswipe.app" while the product is on screen, plus the end card "Stop swiping. Just show up." with noswipe.app.
- **Look:** the website animated in 2.5D. Brand tokens are in `src/brand/brand.tsx`. Flat planes in depth, soft ink-tinted shadows between planes, hard offset shadows on UI cards, subtle camera. One signature transition (`SwipeCuts`), motion blur only on fast moves, 60 fps masters.
- **Ad-safe layout:** nothing critical in the top 270 px or the bottom 670 px. Captions sit around y = 1150.
- **Voice:** ElevenLabs "Witty McGee" (`R9RZPy40Zzy1wNxrgQpj`), with takes fetched with character timestamps for exact captions and lip-sync. Music and SFX are composed in code.
- **Posting titles** are under 60 characters (count them), conversational, and kept separate from the caption.
- **Before delivery:** frame-by-frame review of the exported file, plus a blind comprehension check (a no-context reviewer retells the story from frames and transcript).
