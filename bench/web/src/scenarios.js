// What the browser version measures: each scenario loads its pages in the test
// iframe and runs the same steps on every version, by script. Element lookups
// use the visible labels, which are the same in every version.

const radios = (doc) => [
  ...doc.querySelectorAll('#bench input[type=radio]:not([aria-hidden=true]), #bench [role=radio]'),
];

// The form control whose <label> text starts with `text`.
function control(doc, text) {
  const label = [...doc.querySelectorAll('label')].find((l) => l.textContent.trim().startsWith(text));
  const element = label?.control ?? label?.querySelector('input');
  if (!element) throw new Error(`No control labelled "${text}"`);
  return element;
}

function button(doc, text) {
  const element = [...doc.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith(text));
  if (!element) throw new Error(`No button "${text}"`);
  return element;
}

export const SCENARIOS = [
  {
    id: 'radio',
    title: { es: 'Grupo de 1000 radio buttons', en: 'Group of 1000 radio buttons', ca: 'Grup de 1000 radio buttons' },
    targets: [
      { id: 'native', label: { es: 'HTML nativo', en: 'Native HTML', ca: 'HTML natiu' }, path: 'apps/native/n-1000.html' },
      { id: 'shadcn-radix', label: { es: 'shadcn/ui (Radix)', en: 'shadcn/ui (Radix)', ca: 'shadcn/ui (Radix)' }, path: 'apps/shadcn-radix/index.html?n=1000', marksRendered: true },
      { id: 'mui', label: { es: 'MUI', en: 'MUI', ca: 'MUI' }, path: 'apps/mui/index.html?n=1000', marksRendered: true },
    ],
    steps: [
      { id: 'last', name: { es: 'Elegir la última opción', en: 'Pick the last option', ca: "Triar l'última opció" }, run: (doc) => radios(doc).at(-1).click() },
      { id: 'first', name: { es: 'Elegir la primera opción', en: 'Pick the first option', ca: 'Triar la primera opció' }, run: (doc) => radios(doc)[0].click() },
      {
        id: 'middle',
        name: { es: 'Elegir una opción del medio', en: 'Pick an option in the middle', ca: 'Triar una opció del mig' },
        run: (doc) => radios(doc)[Math.floor(radios(doc).length / 2)].click(),
      },
    ],
  },
  {
    id: 'travel',
    title: { es: 'A11yConf Travel, búsqueda de hoteles', en: 'A11yConf Travel, hotel search', ca: "A11yConf Travel, cerca d'hotels" },
    targets: [
      { id: 'travel-native', label: { es: 'HTML nativo', en: 'Native HTML', ca: 'HTML natiu' }, path: 'apps/travel-native/index.html' },
      {
        id: 'travel-legacy',
        label: { es: 'React, MUI y otras librerías', en: 'React, MUI and other libraries', ca: 'React, MUI i altres llibreries' },
        path: 'apps/travel-legacy/index.html',
        marksRendered: true,
      },
    ],
    steps: [
      { id: 'filter', name: { es: 'Marcar «4 estrellas»', en: 'Check "4 estrellas"', ca: 'Marcar «4 estrellas»' }, run: (doc) => control(doc, '4 estrellas').click() },
      { id: 'board', name: { es: 'Elegir «Solo alojamiento»', en: 'Choose "Solo alojamiento"', ca: 'Triar «Solo alojamiento»' }, run: (doc) => control(doc, 'Solo alojamiento').click() },
      { id: 'board-any', name: { es: 'Volver a «Cualquier régimen»', en: 'Back to "Cualquier régimen"', ca: 'Tornar a «Cualquier régimen»' }, run: (doc) => control(doc, 'Cualquier régimen').click() },
      { id: 'open', name: { es: 'Abrir el detalle del hotel', en: 'Open the hotel details', ca: "Obrir el detall de l'hotel" }, run: (doc) => button(doc, 'Ver detalles').click() },
      { id: 'room', name: { es: 'Elegir otra habitación', en: 'Pick another room', ca: 'Triar una altra habitació' }, run: (doc) => control(doc, 'Habitación doble superior').click() },
      { id: 'close', name: { es: 'Cerrar el detalle', en: 'Close the details', ca: 'Tancar el detall' }, run: (doc) => button(doc, 'Cerrar').click() },
    ],
  },
];

export const REPETITIONS = 3;
