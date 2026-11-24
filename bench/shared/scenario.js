// The scenario every implementation renders, so all apps produce the same
// content: a "Ringtone" settings group with N radio options.

export const N_VALUES = [1, 10, 100, 1000];
export const TITLE = 'Ajustes';
export const GROUP_LABEL = 'Tono de llamada';

const DEFAULT_COUNT = 10;
const MOONS = ['Calisto', 'Ganímedes', 'Luna', 'Europa', 'Ío', 'Titán', 'Tritón', 'Fobos', 'Deimos', 'Encélado'];

export function optionsFor(n) {
  return Array.from({ length: n }, (_, i) => {
    const round = Math.floor(i / MOONS.length);
    const name = MOONS[i % MOONS.length];
    return {
      id: `moon-${i}`,
      value: `moon-${i}`,
      label: round === 0 ? name : `${name} ${round + 1}`,
    };
  });
}

export function countFromSearch(search) {
  const n = Number.parseInt(new URLSearchParams(search).get('n') ?? '', 10);
  return Number.isInteger(n) && n > 0 ? n : DEFAULT_COUNT;
}
