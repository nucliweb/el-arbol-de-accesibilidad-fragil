// Languages of the browser version and where its slides live. Plain
// functions, shared by the page and the tests.

const SLIDES = 'https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/';

export const LANGUAGES = [
  { code: 'es', name: 'Español', slidesPath: '' },
  { code: 'en', name: 'English', slidesPath: 'en/' },
  { code: 'ca', name: 'Català', slidesPath: 'ca/' },
];

const isKnown = (code) => LANGUAGES.some((language) => language.code === code);

// ?lang= first; otherwise the browser language when the page has it, and
// English for everyone else.
export function pickLanguage(param, browserLanguage) {
  if (isKnown(param)) return param;
  const base = String(browserLanguage ?? '').toLowerCase().split('-')[0];
  return isKnown(base) && base !== 'en' ? base : 'en';
}

// Absolute, so the link also works when the benchmark is served locally.
export const slidesUrl = (code) => SLIDES + LANGUAGES.find((language) => language.code === code).slidesPath;
