# NoSwipe video ads

NoSwipe (https://noswipe.app) is a done-for-you dating service concept: a 2-minute form, then "we build your profiles, swipe, chat and book the date" on Tinder, Bumble and Hinge, and you get a date card. **There is no product yet:** these videos are demand tests that drive people to the site.

## Rules for every video
- **Clarity first.** A cold viewer must get the situation from the first 3 seconds in plain words, before any gag. Pass the one-sentence test: a stranger can retell it after one watch.
- **Honest claims.** Never mention the $1 reservation. Never state or imply a specific number of dates. No "not guaranteed" disclaimer line is needed (the user's call); just don't promise. No fake testimonials and no implied existing users: narrators are obvious comedy characters (e.g. the thumb, the cashier).
- **Name the brand at the turn.** The voiceover says "NoSwipe" when the solution appears (e.g. "Or… let NoSwipe do it."), so viewers know who "we" is.
- **No Tinder, Bumble or Hinge logos or UI.** Their names may appear only as plain text in the brand font, as on the site.
- **CTA:** a soft "noswipe.app" while the product is on screen, plus the end card "Stop swiping. Just show up." with noswipe.app.
- **Look:** each format has its own visual identity (palette, type, character style, transitions), defined in `FORMATS.md`; a new format means a new look, not the site reskinned. The noswipe.app brand look is required only at the brand moments: the NoSwipe turn (date card, logo), the noswipe.app pill and the end card. The receipt format uses the website animated in 2.5D. Brand tokens are in `src/brand/brand.tsx`. Flat planes in depth, soft ink-tinted shadows between planes, hard offset shadows on UI cards, subtle camera. One signature transition (`SwipeCuts`), motion blur only on fast moves, 60 fps masters.
- **Ad-safe layout:** nothing critical in the top 270 px or the bottom 670 px. Captions sit around y = 1150.
- **Voice:** ElevenLabs "Witty McGee" (`R9RZPy40Zzy1wNxrgQpj`), with takes fetched with character timestamps for exact captions and lip-sync. Music and SFX are composed in code.
- **Posting titles** are under 60 characters (count them), conversational, and kept separate from the caption.
- **Before delivery:** frame-by-frame review of the exported file, plus a blind comprehension check (a no-context reviewer retells the story from frames and transcript).

## Fonts (portable renders) — added 2026-11-03
Videos are also rendered on a Linux server, which has no macOS fonts (and Apple's licence forbids copying them there).
- New episodes and formats use ONLY the bundled fonts in `public/fonts`, via `OPEN.*` / `DISPLAY` / `SANS` from
  `src/lib/fonts.ts` (Caveat, Patrick Hand, Permanent Marker, Barlow Condensed, Jost, Nunito Sans, Nunito, Inter,
  Gelasio, Courier Prime, Anton, plus brand Bagel Fat One + Figtree). Add new ones there (woff2, open licence).
- Older episodes keep their macOS font first with the open look-alike listed right after it: identical on the Mac,
  close on Linux. Don't remove those look-alikes.
- Fonts load for every composition through `import './lib/fonts'` in `src/index.ts`.
