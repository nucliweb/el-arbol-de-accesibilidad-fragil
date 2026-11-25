// The built apps of the benchmark and the page that renders N options in each.
export const TARGETS = {
  native: { dir: 'apps/native/dist/native', page: (n) => `n-${n}.html` },
  'native-styled': { dir: 'apps/native/dist/native-styled', page: (n) => `n-${n}.html` },
  'shadcn-base': { dir: 'apps/shadcn/dist', page: (n) => `index.html?n=${n}`, marksRendered: true },
  'shadcn-radix': { dir: 'apps/shadcn-radix/dist', page: (n) => `index.html?n=${n}`, marksRendered: true },
  mui: { dir: 'apps/mui/dist', page: (n) => `index.html?n=${n}`, marksRendered: true },
  'material-web': { dir: 'apps/material-web/dist', page: (n) => `index.html?n=${n}`, marksRendered: true },
};

// The first radio of the group, whatever element each implementation uses.
export const FIRST_RADIO_SELECTOR =
  '#bench input[type=radio]:not([aria-hidden=true]), #bench [role=radio], #bench md-radio';
