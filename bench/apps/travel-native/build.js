// Generates the "A11yConf Travel" page as static, semantic HTML. The only
// JavaScript (app.js) filters and sorts the results and fills the details
// dialog; everything else works with the browser's own elements.
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import {
  AMENITIES,
  ANY_BOARD,
  BOARD_TYPES,
  DEFAULT_CHECK_IN,
  DEFAULT_CHECK_OUT,
  DEFAULT_DESTINATION,
  DEFAULT_GUESTS,
  DESTINATIONS,
  HOTELS,
  MAX_GUESTS,
  NAV_LINKS,
  PAGE_COUNT,
  PRICE_MAX,
  PRICE_MIN,
  PRICE_STEP,
  ROOM_TYPES,
  SITE_NAME,
  SORT_OPTIONS,
  STAR_OPTIONS,
  TRIP_TYPES,
  formatDistance,
  formatPrice,
  formatRating,
  hotelImage,
  imageAlt,
  resultsStatus,
  starsLabel,
} from '../../shared/travel.js';

const escapeHtml = (text) =>
  String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const amenityLabel = (id) => AMENITIES.find((a) => a.id === id).label;
const guests = (n) => (n === 1 ? '1 adulto' : `${n} adultos`);

const card = (hotel) => `<li class="hotel" data-id="${hotel.id}">
            <article aria-labelledby="${hotel.id}-name">
              <img src="${hotelImage(hotel)}" alt="${escapeHtml(imageAlt(hotel))}" width="320" height="200">
              <div class="hotel-body">
                <h3 id="${hotel.id}-name">${escapeHtml(hotel.name)}</h3>
                <p class="stars">${starsLabel(hotel.stars)}</p>
                <p>${escapeHtml(formatDistance(hotel))}</p>
                <p class="rating">${escapeHtml(formatRating(hotel))}</p>
                <ul class="amenities" aria-label="Servicios">
                  ${hotel.amenities.map((id) => `<li>${escapeHtml(amenityLabel(id))}</li>`).join('')}
                </ul>
              </div>
              <div class="hotel-offer">
                ${hotel.freeCancellation ? '<p class="badge">Cancelación gratuita</p>' : ''}
                <p class="price"><strong>${formatPrice(hotel.price)}</strong> por noche</p>
                <button type="button" class="details" data-hotel="${hotel.id}">Ver detalles<span class="visually-hidden"> de ${escapeHtml(hotel.name)}</span></button>
              </div>
            </article>
          </li>`;

const page = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hoteles en ${DEFAULT_DESTINATION}: ${SITE_NAME}</title>
    <link rel="stylesheet" href="styles.css">
    <script type="module" src="app.js"></script>
  </head>
  <body>
    <a class="skip-link" href="#results-heading">Saltar a los resultados</a>
    <header class="site-header">
      <p class="logo"><a href="#">${SITE_NAME}</a></p>
      <nav aria-label="Principal">
        <ul>
          ${NAV_LINKS.map((link, i) => `<li><a href="#"${i === 0 ? ' aria-current="page"' : ''}>${link}</a></li>`).join('\n          ')}
        </ul>
      </nav>
    </header>
    <main>
      <h1>Encuentra tu hotel</h1>
      <search>
        <form class="search" id="search">
          <p class="field">
            <label for="destination">Destino</label>
            <select id="destination" name="destination">
              ${DESTINATIONS.map(
                (group) => `<optgroup label="${escapeHtml(group.country)}">${group.cities
                  .map((city) => `<option${city === DEFAULT_DESTINATION ? ' selected' : ''}>${escapeHtml(city)}</option>`)
                  .join('')}</optgroup>`,
              ).join('\n              ')}
            </select>
          </p>
          <p class="field">
            <label for="check-in">Fecha de entrada</label>
            <input type="date" id="check-in" name="check-in" value="${DEFAULT_CHECK_IN}">
          </p>
          <p class="field">
            <label for="check-out">Fecha de salida</label>
            <input type="date" id="check-out" name="check-out" value="${DEFAULT_CHECK_OUT}">
          </p>
          <p class="field">
            <label for="guests">Huéspedes</label>
            <select id="guests" name="guests">
              ${Array.from({ length: MAX_GUESTS }, (_, i) => `<option value="${i + 1}"${i + 1 === DEFAULT_GUESTS ? ' selected' : ''}>${guests(i + 1)}</option>`).join('')}
            </select>
          </p>
          <fieldset class="trip-type">
            <legend>Tipo de viaje</legend>
            ${TRIP_TYPES.map(
              (type, i) => `<label><input type="radio" name="trip" value="${type.id}"${i === 0 ? ' checked' : ''}> ${escapeHtml(type.label)}</label>`,
            ).join('\n            ')}
          </fieldset>
          <button type="submit">Buscar</button>
        </form>
      </search>
      <div class="layout">
        <aside aria-labelledby="filters-heading">
          <h2 id="filters-heading">Filtros</h2>
          <form id="filters">
            <fieldset>
              <legend>Estrellas</legend>
              ${STAR_OPTIONS.map((stars) => `<label><input type="checkbox" name="stars" value="${stars}"> ${starsLabel(stars)}</label>`).join('\n              ')}
            </fieldset>
            <p class="field">
              <label for="max-price">Precio máximo por noche</label>
              <input type="range" id="max-price" name="max-price" min="${PRICE_MIN}" max="${PRICE_MAX}" step="${PRICE_STEP}" value="${PRICE_MAX}" aria-valuetext="${formatPrice(PRICE_MAX)}">
              <span id="max-price-value">${formatPrice(PRICE_MAX)}</span>
            </p>
            <fieldset>
              <legend>Régimen</legend>
              ${[ANY_BOARD, ...BOARD_TYPES]
                .map((board, i) => `<label><input type="radio" name="board" value="${board.id}"${i === 0 ? ' checked' : ''}> ${escapeHtml(board.label)}</label>`)
                .join('\n              ')}
            </fieldset>
            <fieldset>
              <legend>Servicios</legend>
              ${AMENITIES.map((a) => `<label><input type="checkbox" name="amenities" value="${a.id}"> ${escapeHtml(a.label)}</label>`).join('\n              ')}
            </fieldset>
            <label class="toggle"><input type="checkbox" name="free-cancellation"> Cancelación gratuita</label>
          </form>
        </aside>
        <section class="results" aria-labelledby="results-heading">
          <div class="results-header">
            <h2 id="results-heading" tabindex="-1">Hoteles en <span id="results-city">${DEFAULT_DESTINATION}</span></h2>
            <p id="results-status" role="status">${resultsStatus(HOTELS.length)}</p>
            <p class="field">
              <label for="sort">Ordenar por</label>
              <select id="sort" name="sort" form="filters">
                ${SORT_OPTIONS.map((o) => `<option value="${o.id}">${escapeHtml(o.label)}</option>`).join('')}
              </select>
            </p>
          </div>
          <ul class="hotels" id="hotels">
          ${HOTELS.map(card).join('\n          ')}
          </ul>
          <nav class="pagination" aria-label="Paginación">
            <ul>
              ${Array.from({ length: PAGE_COUNT }, (_, i) => `<li><a href="#"${i === 0 ? ' aria-current="page"' : ''}><span class="visually-hidden">Página </span>${i + 1}</a></li>`).join('')}
              <li><a href="#">Siguiente<span class="visually-hidden"> página</span></a></li>
            </ul>
          </nav>
        </section>
      </div>
    </main>
    <footer class="site-footer">
      <nav aria-label="Pie de página">
        <ul>
          <li><a href="#">Ayuda</a></li>
          <li><a href="#">Declaración de accesibilidad</a></li>
          <li><a href="#">Privacidad</a></li>
          <li><a href="#">Condiciones</a></li>
        </ul>
      </nav>
      <p>© 2026 ${SITE_NAME}. Una web ficticia para un benchmark.</p>
    </footer>
    <dialog id="details" aria-labelledby="details-name">
      <form method="dialog" class="details-form">
        <h2 id="details-name"></h2>
        <img id="details-image" src="" alt="" width="320" height="200">
        <p id="details-description"></p>
        <p id="details-stay"></p>
        <fieldset>
          <legend>Tipo de habitación</legend>
          ${ROOM_TYPES.map(
            (room, i) => `<label><input type="radio" name="room" value="${room.id}"${i === 0 ? ' checked' : ''}> ${escapeHtml(room.label)}, <span data-room-price="${room.extra}"></span></label>`,
          ).join('\n          ')}
        </fieldset>
        <div class="dialog-actions">
          <button value="book">Reservar</button>
          <button value="cancel" formnovalidate>Cerrar</button>
        </div>
      </form>
    </dialog>
  </body>
</html>
`;

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
writeFileSync('dist/index.html', page);
copyFileSync('styles.css', 'dist/styles.css');
copyFileSync('app.js', 'dist/app.js');
copyFileSync('../../shared/travel.js', 'dist/travel.js');
console.log('Built dist/index.html');
