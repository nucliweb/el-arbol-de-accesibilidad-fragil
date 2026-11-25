// Filters and sorts the server-rendered results, and fills the details
// dialog. The markup is already complete without this script.
import {
  ANY_BOARD,
  DEFAULT_CHECK_IN,
  DEFAULT_CHECK_OUT,
  HOTELS,
  filterHotels,
  formatPrice,
  hotelImage,
  imageAlt,
  resultsStatus,
  sortHotels,
} from './travel.js';

const filters = document.querySelector('#filters');
const list = document.querySelector('#hotels');
const status = document.querySelector('#results-status');
const priceInput = document.querySelector('#max-price');
const priceText = document.querySelector('#max-price-value');
const items = new Map([...list.children].map((item) => [item.dataset.id, item]));

function readFilters() {
  const data = new FormData(filters);
  return {
    stars: data.getAll('stars').map(Number),
    amenities: data.getAll('amenities'),
    maxPrice: Number(data.get('max-price')),
    board: data.get('board') ?? ANY_BOARD.id,
    freeCancellation: data.has('free-cancellation'),
  };
}

function update() {
  const current = readFilters();
  priceText.textContent = formatPrice(current.maxPrice);
  priceInput.setAttribute('aria-valuetext', priceText.textContent);
  const visible = new Set(filterHotels(HOTELS, current).map((hotel) => hotel.id));
  const sorted = sortHotels(HOTELS, document.querySelector('#sort').value);
  for (const hotel of sorted) {
    const item = items.get(hotel.id);
    item.hidden = !visible.has(hotel.id);
    list.append(item);
  }
  status.textContent = resultsStatus(visible.size);
}

filters.addEventListener('input', update);
filters.addEventListener('submit', (event) => event.preventDefault());
document.querySelector('#sort').addEventListener('change', update);

document.querySelector('#search').addEventListener('submit', (event) => {
  event.preventDefault();
  document.querySelector('#results-city').textContent = document.querySelector('#destination').value;
  document.querySelector('#results-heading').focus();
});

const dialog = document.querySelector('#details');
const dateFormat = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' });
const date = (value) => dateFormat.format(new Date(`${value}T12:00:00`));

list.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-hotel]');
  if (!button) return;
  const hotel = HOTELS.find((h) => h.id === button.dataset.hotel);
  const checkIn = document.querySelector('#check-in').value || DEFAULT_CHECK_IN;
  const checkOut = document.querySelector('#check-out').value || DEFAULT_CHECK_OUT;
  dialog.querySelector('#details-name').textContent = hotel.name;
  dialog.querySelector('#details-image').src = hotelImage(hotel);
  dialog.querySelector('#details-image').alt = imageAlt(hotel);
  dialog.querySelector('#details-description').textContent = hotel.description;
  dialog.querySelector('#details-stay').textContent = `Del ${date(checkIn)} al ${date(checkOut)}`;
  for (const price of dialog.querySelectorAll('[data-room-price]')) {
    price.textContent = `${formatPrice(hotel.price + Number(price.dataset.roomPrice))} por noche`;
  }
  dialog.querySelector('input[name=room]').checked = true;
  dialog.showModal();
});
