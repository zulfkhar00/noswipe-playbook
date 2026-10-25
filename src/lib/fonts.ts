import {continueRender, delayRender, staticFile} from 'remotion';

// Brand fonts are bundled in public/fonts, so renders never wait on a network download
// (a stalled Google Fonts fetch once froze a render indefinitely).

const FACES: [string, string, string][] = [
  ['Bagel Fat One', 'fonts/BagelFatOne-400-latin.woff2', '400'],
  ['Bagel Fat One', 'fonts/BagelFatOne-400-latin-ext.woff2', '400'],
  ['Figtree', 'fonts/Figtree-latin.woff2', '300 900'],
  ['Figtree', 'fonts/Figtree-latin-ext.woff2', '300 900'],
];

export const DISPLAY = '"Bagel Fat One", sans-serif';
export const SANS = 'Figtree, "Helvetica Neue", Arial, sans-serif';

if (typeof document !== 'undefined') {
  const handle = delayRender('Loading bundled brand fonts');
  Promise.all(FACES.map(([family, file, weight]) => {
    const face = new FontFace(family, `url(${staticFile(file)}) format("woff2")`, {weight});
    return face.load().then((f) => document.fonts.add(f));
  })).then(() => continueRender(handle), (e) => { console.error(e); continueRender(handle); });
}
