export interface Labeled { id: string; label: string }
export interface Room extends Labeled { extra: number }
export interface Hotel {
  id: string;
  name: string;
  area: string;
  distanceKm: number;
  stars: number;
  rating: number;
  reviews: number;
  price: number;
  amenities: string[];
  board: string;
  freeCancellation: boolean;
  description: string;
  hue: number;
}
export interface Filters {
  stars: number[];
  amenities: string[];
  maxPrice: number;
  board: string;
  freeCancellation: boolean;
}

export declare const SITE_NAME: string;
export declare const DEFAULT_DESTINATION: string;
export declare const DEFAULT_CHECK_IN: string;
export declare const DEFAULT_CHECK_OUT: string;
export declare const MAX_GUESTS: number;
export declare const DEFAULT_GUESTS: number;
export declare const NAV_LINKS: string[];
export declare const DESTINATIONS: { country: string; cities: string[] }[];
export declare const TRIP_TYPES: Labeled[];
export declare const STAR_OPTIONS: number[];
export declare const AMENITIES: Labeled[];
export declare const BOARD_TYPES: Labeled[];
export declare const ANY_BOARD: Labeled;
export declare const PRICE_MIN: number;
export declare const PRICE_MAX: number;
export declare const PRICE_STEP: number;
export declare const SORT_OPTIONS: Labeled[];
export declare const ROOM_TYPES: Room[];
export declare const DEFAULT_FILTERS: Filters;
export declare const PAGE_COUNT: number;
export declare const HOTELS: Hotel[];
export declare function filterHotels(hotels: Hotel[], filters: Filters): Hotel[];
export declare function sortHotels(hotels: Hotel[], sort: string): Hotel[];
export declare function resultsStatus(count: number): string;
export declare function formatPrice(amount: number): string;
export declare function ratingWord(rating: number): string;
export declare function formatRating(hotel: Hotel): string;
export declare function formatDistance(hotel: Hotel): string;
export declare function starsLabel(stars: number): string;
export declare function hotelImage(hotel: Hotel): string;
export declare function imageAlt(hotel: Hotel): string;
