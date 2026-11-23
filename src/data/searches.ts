export const searchStorageKey = 'cian3:searches:v1';
export const exampleSearch =
  'q=%D0%A1%D0%BE%D0%BA%D0%BE%D0%BB%D1%8C%D0%BD%D0%B8%D0%BA%D0%B8&rooms=2&maxPrice=20000000';

/** Only search criteria belong in history; review states and favorites do not. */
export function normalizeSearch(input: string | URLSearchParams) {
  const source = typeof input === 'string' ? new URLSearchParams(input) : input;
  const result = new URLSearchParams();
  const q = source.get('q')?.trim();
  if (q) result.set('q', q);
  const rooms = source.get('rooms');
  if (rooms && ['0', '1', '2', '3', '4'].includes(rooms)) result.set('rooms', rooms);
  const price = Number(source.get('maxPrice'));
  if (Number.isFinite(price) && price > 0) result.set('maxPrice', String(price));
  const sort = source.get('sort');
  if (sort && ['price-asc', 'price-desc', 'area-desc'].includes(sort)) result.set('sort', sort);
  return result.toString();
}

export const searchHref = (search: string) => `/search${search ? `?${search}` : ''}`;
export function searchTitle(search: string) {
  const params = new URLSearchParams(search);
  const rooms = params.get('rooms');
  const kind =
    rooms === '0'
      ? 'Студии'
      : rooms
        ? `${rooms === '4' ? '4+' : rooms}-комнатные квартиры`
        : 'Квартиры';
  return `${kind} · ${params.get('q') || 'Москва'}`;
}
export function searchDescription(search: string) {
  const price = new URLSearchParams(search).get('maxPrice');
  return price ? `До ${Number(price).toLocaleString('ru-RU')} ₽` : 'Купить · Без ограничения цены';
}

export type SearchHistory = { lastSearch: string | null; savedSearches: string[] };
export const emptyHistory: SearchHistory = { lastSearch: null, savedSearches: [] };
export function readSearchHistory(): SearchHistory {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(searchStorageKey) || 'null');
    if (!value || typeof value !== 'object') return emptyHistory;
    const data = value as Record<string, unknown>;
    return {
      lastSearch: typeof data.lastSearch === 'string' ? normalizeSearch(data.lastSearch) : null,
      savedSearches: Array.isArray(data.savedSearches)
        ? [
            ...new Set(
              data.savedSearches
                .filter((item): item is string => typeof item === 'string')
                .map(normalizeSearch),
            ),
          ]
        : [],
    };
  } catch {
    return emptyHistory;
  }
}
