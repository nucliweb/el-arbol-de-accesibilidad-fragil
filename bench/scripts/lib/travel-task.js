// The user task measured with VoiceOver on the "A11yConf Travel" pages:
// filter by stars, adjust the price and board filters, open a hotel, go
// through its rooms and close it. Every page receives the same key presses.
//
// A step with `focus` is setup (untimed): it moves focus to a control, as a
// screen reader user jumping there would, and waits for VoiceOver to say
// `expect`. A step with `key` is timed: from the key press until VoiceOver
// says `expect`.
import {
  ANY_BOARD,
  BOARD_TYPES,
  DEFAULT_FILTERS,
  HOTELS,
  PRICE_MAX,
  PRICE_STEP,
  ROOM_TYPES,
  STAR_OPTIONS,
  filterHotels,
  resultsStatus,
  starsLabel,
} from '../../shared/travel.js';
import { median } from './aggregate.js';

const fourStars = filterHotels(HOTELS, { ...DEFAULT_FILTERS, stars: [4] });
const hotel = fourStars[0].name;
const detailsButton = `Ver detalles de ${hotel}`;
const [five, four, three, two, one] = STAR_OPTIONS.map(starsLabel);

export const TRAVEL_TASK = [
  { focus: { role: 'checkbox', name: five }, expect: five },
  { name: 'Tab a «4 estrellas»', key: 'Tab', expect: four },
  { name: 'Marcar «4 estrellas» (anuncio de resultados)', key: 'Space', expect: resultsStatus(fourStars.length) },
  { name: 'Tab a «3 estrellas»', key: 'Tab', expect: three },
  { name: 'Tab a «2 estrellas»', key: 'Tab', expect: two },
  { name: 'Tab a «1 estrella»', key: 'Tab', expect: one },
  { name: 'Tab al precio máximo', key: 'Tab', expect: 'Precio máximo por noche' },
  { name: 'Bajar el precio', key: 'ArrowLeft', expect: String(PRICE_MAX - PRICE_STEP) },
  { name: 'Tab al régimen', key: 'Tab', expect: ANY_BOARD.label },
  { name: 'Elegir «Solo alojamiento»', key: 'ArrowDown', expect: BOARD_TYPES[0].label },
  { name: 'Volver a «Cualquier régimen»', key: 'ArrowUp', expect: ANY_BOARD.label },
  { focus: { role: 'button', name: detailsButton }, expect: detailsButton },
  { name: 'Abrir el detalle del hotel', key: 'Enter', expect: hotel },
  { focus: { role: 'radio', name: new RegExp(`^${ROOM_TYPES[0].label}`) }, expect: ROOM_TYPES[0].label },
  { name: 'Siguiente habitación', key: 'ArrowDown', expect: ROOM_TYPES[1].label },
  { name: 'Siguiente habitación', key: 'ArrowDown', expect: ROOM_TYPES[2].label },
  { name: 'Cerrar con Escape (vuelta al botón)', key: 'Escape', expect: detailsButton },
];

// Median latency per timed step and target across runs; the total adds the
// step medians, so it is the time a typical run spends waiting for VoiceOver.
export function summarizeTask(rows) {
  const byTarget = {};
  for (const row of rows) {
    if (!row.target) continue;
    const entry = (byTarget[row.target] ??= { runs: 0, errors: 0, rows: [] });
    if (row.error) entry.errors += 1;
    else {
      entry.runs += 1;
      entry.rows.push(row);
    }
  }
  for (const entry of Object.values(byTarget)) {
    const stepCount = Math.max(0, ...entry.rows.map((row) => row.steps.length));
    entry.steps = Array.from({ length: stepCount }, (_, i) => {
      const values = entry.rows.map((row) => row.steps[i]?.latencyMs);
      return {
        name: entry.rows[0].steps[i].name,
        medianMs: median(values),
        silences: values.filter((v) => v === null).length,
      };
    });
    entry.totalMs = entry.steps.reduce((sum, step) => sum + (step.medianMs ?? 0), 0);
    delete entry.rows;
  }
  return byTarget;
}
