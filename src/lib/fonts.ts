import {continueRender, delayRender, staticFile} from 'remotion';

// All fonts are bundled in public/fonts, so renders never wait on a network download
// (a stalled Google Fonts fetch once froze a render indefinitely) and look the same on every machine.
//
// macOS system fonts (Bradley Hand, Noteworthy, DIN Condensed, Futura, Avenir Next, Helvetica Neue, Georgia, ...)
// do NOT exist on the Linux render server and may not be copied there (Apple licence). Rules:
//  - NEW episodes/formats: use only the bundled families below (put them first in the stack).
//  - Existing episodes keep their macOS font first and list the open look-alike after it, so the Mac renders
//    exactly as before and Linux falls back to the look-alike.
// Look-alikes (all SIL Open Font License, from Google Fonts):
//   Bradley Hand -> Caveat · Noteworthy / Chalkboard SE -> Patrick Hand · Marker Felt -> Permanent Marker
//   DIN Condensed / Avenir Next Condensed / Futura Condensed -> Barlow Condensed · Futura -> Jost
//   Avenir Next -> Nunito Sans · Arial Rounded / Avenir Next Rounded -> Nunito · Helvetica Neue / Arial -> Inter
//   Georgia / Iowan Old Style / Palatino -> Gelasio · American Typewriter / Courier New -> Courier Prime · Impact -> Anton

const FACES: [string, string, string][] = [
  ['Bagel Fat One', 'fonts/BagelFatOne-400-latin.woff2', '400'],
  ['Bagel Fat One', 'fonts/BagelFatOne-400-latin-ext.woff2', '400'],
  ['Figtree', 'fonts/Figtree-latin.woff2', '300 900'],
  ['Figtree', 'fonts/Figtree-latin-ext.woff2', '300 900'],
  ['Caveat', 'fonts/Caveat-400_700-latin.woff2', '400 700'],
  ['Caveat', 'fonts/Caveat-400_700-latin-ext.woff2', '400 700'],
  ['Patrick Hand', 'fonts/PatrickHand-400-latin.woff2', '400'],
  ['Patrick Hand', 'fonts/PatrickHand-400-latin-ext.woff2', '400'],
  ['Permanent Marker', 'fonts/PermanentMarker-400-latin.woff2', '400'],
  ['Barlow Condensed', 'fonts/BarlowCondensed-400-latin.woff2', '400'],
  ['Barlow Condensed', 'fonts/BarlowCondensed-400-latin-ext.woff2', '400'],
  ['Barlow Condensed', 'fonts/BarlowCondensed-500-latin.woff2', '500'],
  ['Barlow Condensed', 'fonts/BarlowCondensed-500-latin-ext.woff2', '500'],
  ['Barlow Condensed', 'fonts/BarlowCondensed-600-latin.woff2', '600'],
  ['Barlow Condensed', 'fonts/BarlowCondensed-600-latin-ext.woff2', '600'],
  ['Barlow Condensed', 'fonts/BarlowCondensed-700-latin.woff2', '700'],
  ['Barlow Condensed', 'fonts/BarlowCondensed-700-latin-ext.woff2', '700'],
  ['Barlow Condensed', 'fonts/BarlowCondensed-800-latin.woff2', '800'],
  ['Barlow Condensed', 'fonts/BarlowCondensed-800-latin-ext.woff2', '800'],
  ['Jost', 'fonts/Jost-100_900-latin.woff2', '100 900'],
  ['Jost', 'fonts/Jost-100_900-latin-ext.woff2', '100 900'],
  ['Nunito Sans', 'fonts/NunitoSans-200_1000-latin.woff2', '200 1000'],
  ['Nunito Sans', 'fonts/NunitoSans-200_1000-latin-ext.woff2', '200 1000'],
  ['Nunito', 'fonts/Nunito-200_1000-latin.woff2', '200 1000'],
  ['Nunito', 'fonts/Nunito-200_1000-latin-ext.woff2', '200 1000'],
  ['Inter', 'fonts/Inter-100_900-latin.woff2', '100 900'],
  ['Inter', 'fonts/Inter-100_900-latin-ext.woff2', '100 900'],
  ['Gelasio', 'fonts/Gelasio-400_700-latin.woff2', '400 700'],
  ['Gelasio', 'fonts/Gelasio-400_700-latin-ext.woff2', '400 700'],
  ['Courier Prime', 'fonts/CourierPrime-400-latin.woff2', '400'],
  ['Courier Prime', 'fonts/CourierPrime-400-latin-ext.woff2', '400'],
  ['Courier Prime', 'fonts/CourierPrime-700-latin.woff2', '700'],
  ['Courier Prime', 'fonts/CourierPrime-700-latin-ext.woff2', '700'],
  ['Anton', 'fonts/Anton-400-latin.woff2', '400'],
  ['Anton', 'fonts/Anton-400-latin-ext.woff2', '400'],
];

// Brand
export const DISPLAY = '"Bagel Fat One", sans-serif';
export const SANS = 'Figtree, "Helvetica Neue", Inter, Arial, sans-serif';

// Portable stacks for new episodes (identical on Mac and Linux)
export const OPEN = {
  handwriting: '"Caveat", cursive',
  handPrint: '"Patrick Hand", cursive',
  marker: '"Permanent Marker", cursive',
  condensed: '"Barlow Condensed", sans-serif',
  geometric: '"Jost", sans-serif',
  humanist: '"Nunito Sans", sans-serif',
  rounded: '"Nunito", sans-serif',
  grotesk: '"Inter", sans-serif',
  serif: '"Gelasio", serif',
  typewriter: '"Courier Prime", monospace',
  poster: '"Anton", sans-serif',
} as const;

if (typeof document !== 'undefined') {
  const handle = delayRender('Loading bundled fonts');
  Promise.all(FACES.map(([family, file, weight]) => {
    const face = new FontFace(family, `url(${staticFile(file)}) format("woff2")`, {weight});
    return face.load().then((f) => document.fonts.add(f));
  })).then(() => continueRender(handle), (e) => { console.error(e); continueRender(handle); });
}
