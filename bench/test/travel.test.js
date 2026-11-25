import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AMENITIES,
  BOARD_TYPES,
  DEFAULT_FILTERS,
  DESTINATIONS,
  HOTELS,
  SORT_OPTIONS,
  filterHotels,
  formatPrice,
  resultsStatus,
  sortHotels,
} from '../shared/travel.js';

test('lists 30 hotels with unique ids and names, the same on every load', async () => {
  assert.equal(HOTELS.length, 30);
  assert.equal(new Set(HOTELS.map((h) => h.id)).size, 30);
  assert.equal(new Set(HOTELS.map((h) => h.name)).size, 30);

  const again = await import(`../shared/travel.js?reload=${Date.now()}`);
  assert.deepEqual(again.HOTELS, HOTELS);
});

test('every hotel uses known amenities and board types, and stars from 1 to 5', () => {
  const amenityIds = new Set(AMENITIES.map((a) => a.id));
  const boardIds = new Set(BOARD_TYPES.map((b) => b.id));
  for (const hotel of HOTELS) {
    assert.ok(hotel.stars >= 1 && hotel.stars <= 5);
    assert.ok(hotel.amenities.every((id) => amenityIds.has(id)));
    assert.ok(boardIds.has(hotel.board));
  }
});

test('destinations are grouped by country and include Barcelona', () => {
  const cities = DESTINATIONS.flatMap((group) => group.cities);
  assert.ok(cities.includes('Barcelona'));
  assert.ok(DESTINATIONS.length > 3);
});

test('the default filters keep every hotel', () => {
  assert.equal(filterHotels(HOTELS, DEFAULT_FILTERS).length, HOTELS.length);
});

test('filters by stars, amenities (all required), price, board and free cancellation', () => {
  const byStars = filterHotels(HOTELS, { ...DEFAULT_FILTERS, stars: [4, 5] });
  assert.ok(byStars.length > 0 && byStars.length < HOTELS.length);
  assert.ok(byStars.every((h) => h.stars >= 4));

  const byAmenities = filterHotels(HOTELS, { ...DEFAULT_FILTERS, amenities: ['wifi', 'pool'] });
  assert.ok(byAmenities.every((h) => h.amenities.includes('wifi') && h.amenities.includes('pool')));

  const cheap = filterHotels(HOTELS, { ...DEFAULT_FILTERS, maxPrice: 100 });
  assert.ok(cheap.every((h) => h.price <= 100));

  const breakfast = filterHotels(HOTELS, { ...DEFAULT_FILTERS, board: 'breakfast' });
  assert.ok(breakfast.every((h) => h.board === 'breakfast'));

  const flexible = filterHotels(HOTELS, { ...DEFAULT_FILTERS, freeCancellation: true });
  assert.ok(flexible.every((h) => h.freeCancellation));
});

test('the 4-star filter used by the VoiceOver task leaves some but not all hotels', () => {
  const fourStars = filterHotels(HOTELS, { ...DEFAULT_FILTERS, stars: [4] });
  assert.ok(fourStars.length > 1 && fourStars.length < HOTELS.length);
});

test('sorts without changing the input', () => {
  const original = HOTELS.map((h) => h.id);
  const byPrice = sortHotels(HOTELS, 'price-asc');
  assert.deepEqual(HOTELS.map((h) => h.id), original);
  for (let i = 1; i < byPrice.length; i += 1) assert.ok(byPrice[i - 1].price <= byPrice[i].price);

  const byRating = sortHotels(HOTELS, 'rating');
  for (let i = 1; i < byRating.length; i += 1) assert.ok(byRating[i - 1].rating >= byRating[i].rating);

  assert.deepEqual(sortHotels(HOTELS, 'recommended').map((h) => h.id), original);
  assert.ok(SORT_OPTIONS.some((o) => o.id === 'price-asc'));
});

test('describes the result count in Spanish', () => {
  assert.equal(resultsStatus(30), '30 hoteles encontrados');
  assert.equal(resultsStatus(1), '1 hotel encontrado');
  assert.equal(resultsStatus(0), 'Ningún hotel coincide con los filtros');
});

test('formats prices in euros without decimals', () => {
  assert.match(formatPrice(120), /^120\s€$/);
  assert.match(formatPrice(1250), /^1\.250\s€$/);
});
