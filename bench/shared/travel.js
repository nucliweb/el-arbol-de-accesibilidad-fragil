// The "A11yConf Travel" scenario: a hotel search results page that every
// implementation renders with the same content, controls and behavior. The
// data is generated from a fixed seed, so every load and every app is equal.

export const SITE_NAME = 'A11yConf Travel';
export const DEFAULT_DESTINATION = 'Barcelona';
export const DEFAULT_CHECK_IN = '2026-12-11';
export const DEFAULT_CHECK_OUT = '2026-12-14';
export const MAX_GUESTS = 8;
export const DEFAULT_GUESTS = 2;

export const NAV_LINKS = ['Hoteles', 'Vuelos', 'Coches', 'Ofertas', 'Mi cuenta'];

export const DESTINATIONS = [
  { country: 'España', cities: ['Barcelona', 'Bilbao', 'Granada', 'Madrid', 'Málaga', 'Palma', 'Sevilla', 'Valencia'] },
  { country: 'Portugal', cities: ['Faro', 'Lisboa', 'Oporto'] },
  { country: 'Francia', cities: ['Burdeos', 'Lyon', 'Marsella', 'Niza', 'París'] },
  { country: 'Italia', cities: ['Florencia', 'Milán', 'Nápoles', 'Roma', 'Venecia'] },
  { country: 'Alemania', cities: ['Berlín', 'Hamburgo', 'Múnich'] },
  { country: 'Reino Unido', cities: ['Edimburgo', 'Londres', 'Mánchester'] },
];

export const TRIP_TYPES = [
  { id: 'hotel', label: 'Solo hotel' },
  { id: 'flight-hotel', label: 'Vuelo y hotel' },
  { id: 'flight-hotel-car', label: 'Vuelo, hotel y coche' },
];

export const STAR_OPTIONS = [5, 4, 3, 2, 1];

export const AMENITIES = [
  { id: 'wifi', label: 'Wifi gratis' },
  { id: 'pool', label: 'Piscina' },
  { id: 'parking', label: 'Aparcamiento' },
  { id: 'gym', label: 'Gimnasio' },
  { id: 'spa', label: 'Spa' },
  { id: 'pets', label: 'Admite mascotas' },
  { id: 'wheelchair', label: 'Accesible en silla de ruedas' },
  { id: 'air', label: 'Aire acondicionado' },
];

export const BOARD_TYPES = [
  { id: 'room', label: 'Solo alojamiento' },
  { id: 'breakfast', label: 'Desayuno incluido' },
  { id: 'half', label: 'Media pensión' },
  { id: 'all', label: 'Todo incluido' },
];
export const ANY_BOARD = { id: 'any', label: 'Cualquier régimen' };

export const PRICE_MIN = 50;
export const PRICE_MAX = 400;
export const PRICE_STEP = 10;

export const SORT_OPTIONS = [
  { id: 'recommended', label: 'Recomendados' },
  { id: 'price-asc', label: 'Precio más bajo' },
  { id: 'price-desc', label: 'Precio más alto' },
  { id: 'rating', label: 'Mejor valorados' },
];

export const ROOM_TYPES = [
  { id: 'standard', label: 'Habitación doble estándar', extra: 0 },
  { id: 'superior', label: 'Habitación doble superior', extra: 35 },
  { id: 'suite', label: 'Suite junior', extra: 90 },
];

export const DEFAULT_FILTERS = {
  stars: [],
  amenities: [],
  maxPrice: PRICE_MAX,
  board: ANY_BOARD.id,
  freeCancellation: false,
};

export const PAGE_COUNT = 4;

const PREFIXES = ['Hotel', 'Hostal', 'Apartamentos', 'Gran Hotel', 'Casa', 'Residencia'];
const NAMES = [
  'Mirador del Puerto', 'Jardín de Gràcia', 'Las Ramblas', 'Sol de Poblenou', 'Torre Mar', 'Plaza Real',
  'Montjuïc', 'Barceloneta', 'Sagrada Família', 'Born Antiguo', 'Diagonal', 'Ciutadella',
  'Tibidabo', 'Raval', 'Sant Antoni', 'Les Corts', 'Port Vell', 'Eixample', 'Paral·lel', 'Vila Olímpica',
  'Fabra', 'Pedralbes', 'Sarrià', 'Horta', 'Glòries', 'Arc de Triomf', 'Sants', 'Turó Park', 'Bonanova', 'Nova Icària',
];
const AREAS = ['Ciutat Vella', 'Eixample', 'Gràcia', 'Sant Martí', 'Sants-Montjuïc', 'Sarrià-Sant Gervasi', 'Les Corts'];
const DESCRIPTIONS = [
  'Habitaciones luminosas, terraza en la azotea y desayuno con productos locales.',
  'Edificio modernista rehabilitado, a pocos minutos a pie del metro.',
  'Ambiente tranquilo, patio interior y personal que habla varios idiomas.',
  'Diseño contemporáneo, vistas a la ciudad y recepción abierta las 24 horas.',
  'Apartamentos con cocina equipada, ideales para estancias largas y familias.',
];

// Deterministic pseudo-random numbers (mulberry32), so the data never changes.
function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateHotels(count) {
  const random = seededRandom(2026);
  const pick = (list) => list[Math.floor(random() * list.length)];
  return Array.from({ length: count }, (_, i) => {
    const stars = 1 + Math.floor(random() * 5);
    const amenities = AMENITIES.filter(() => random() < 0.5).map((a) => a.id);
    return {
      id: `hotel-${i + 1}`,
      name: `${PREFIXES[i % PREFIXES.length]} ${NAMES[i]}`,
      area: pick(AREAS),
      distanceKm: Math.round((0.2 + random() * 6) * 10) / 10,
      stars,
      rating: Math.round((6 + random() * 3.9) * 10) / 10,
      reviews: 20 + Math.floor(random() * 3000),
      price: Math.round((40 + stars * 30 + random() * 120) / 5) * 5,
      amenities: amenities.length ? amenities : ['wifi'],
      board: pick(BOARD_TYPES).id,
      freeCancellation: random() < 0.6,
      description: pick(DESCRIPTIONS),
      hue: Math.floor(random() * 360),
    };
  });
}

export const HOTELS = generateHotels(30);

export function filterHotels(hotels, filters) {
  return hotels.filter(
    (hotel) =>
      (filters.stars.length === 0 || filters.stars.includes(hotel.stars)) &&
      filters.amenities.every((id) => hotel.amenities.includes(id)) &&
      hotel.price <= filters.maxPrice &&
      (filters.board === ANY_BOARD.id || hotel.board === filters.board) &&
      (!filters.freeCancellation || hotel.freeCancellation),
  );
}

export function sortHotels(hotels, sort) {
  const sorted = [...hotels];
  if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);
  else if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating);
  return sorted;
}

export function resultsStatus(count) {
  if (count === 0) return 'Ningún hotel coincide con los filtros';
  return count === 1 ? '1 hotel encontrado' : `${count} hoteles encontrados`;
}

const priceFormat = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
  useGrouping: 'always',
});
export const formatPrice = (amount) => priceFormat.format(amount);

const decimalFormat = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const countFormat = new Intl.NumberFormat('es-ES', { useGrouping: 'always' });

export function ratingWord(rating) {
  if (rating >= 9) return 'Excepcional';
  if (rating >= 8.5) return 'Fabuloso';
  if (rating >= 8) return 'Muy bueno';
  if (rating >= 7) return 'Bueno';
  return 'Correcto';
}

export const formatRating = (hotel) =>
  `${decimalFormat.format(hotel.rating)} ${ratingWord(hotel.rating)} · ${countFormat.format(hotel.reviews)} opiniones`;
export const formatDistance = (hotel) => `${hotel.area} · a ${decimalFormat.format(hotel.distanceKm)} km del centro`;
export const starsLabel = (stars) => (stars === 1 ? '1 estrella' : `${stars} estrellas`);

// A hotel photo stand-in: an inline SVG, identical in every app and with no
// network request, so images do not skew the comparison.
export const hotelImage = (hotel) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><defs><linearGradient id="g" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hotel.hue} 60% 75%)"/><stop offset="1" stop-color="hsl(${(hotel.hue + 40) % 360} 50% 40%)"/></linearGradient></defs><rect width="320" height="200" fill="url(#g)"/><rect x="110" y="60" width="100" height="140" fill="hsl(${hotel.hue} 20% 92%)"/></svg>`,
  )}`;
export const imageAlt = (hotel) => `Fachada de ${hotel.name}`;
