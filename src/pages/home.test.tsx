import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import { exampleSearch, normalizeSearch, searchStorageKey, searchTitle } from '@/data/searches';

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
function open(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}
const home = () => userEvent.click(screen.getByRole('link', { name: 'Циан — главная' }));

describe('Mobile home journey', () => {
  it('offers five verticals, eight distinct recommendations and no history for a newcomer', async () => {
    open();
    expect(screen.queryByRole('region', { name: 'Продолжить поиск' })).not.toBeInTheDocument();
    const verticals = screen.getByRole('navigation', { name: 'Что вы ищете?' });
    expect(within(verticals).getByRole('link', { name: /Купить/ })).toHaveAttribute(
      'href',
      '/search',
    );
    for (const name of ['Снять', 'Новостройки', 'Посуточно', 'Коммерческая']) {
      expect(within(verticals).getByRole('button', { name })).toBeVisible();
    }
    expect(screen.getAllByRole('article')).toHaveLength(8);
    await userEvent.click(within(verticals).getByRole('button', { name: 'Посуточно' }));
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Посуточная аренда');
    await userEvent.click(screen.getByRole('button', { name: 'Понятно' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('persists the last query, resumes it and shows all results for a blank query', async () => {
    open();
    await userEvent.type(screen.getByLabelText('Город, район или метро'), '  Сокольники  ');
    await userEvent.click(screen.getByRole('button', { name: 'Найти квартиру' }));
    expect(await screen.findByText('Найдено 2 объявления')).toBeVisible();
    await home();
    expect(screen.getByText('Вы недавно искали')).toBeVisible();
    cleanup();
    open();
    await userEvent.click(screen.getByRole('link', { name: /Квартиры · Сокольники/ }));
    expect(await screen.findByText('Найдено 2 объявления')).toBeVisible();
    await home();
    await userEvent.click(screen.getByRole('button', { name: 'Найти квартиру' }));
    expect(await screen.findByText('Найдено 8 объявлений')).toBeVisible();
    await home();
    expect(screen.getByRole('link', { name: /Квартиры · Москва/ })).toBeVisible();
  });

  it('keeps the last query when search is opened through navigation or all listings', async () => {
    open('/search?q=Сокольники');
    expect(await screen.findByText('Найдено 2 объявления')).toBeVisible();
    await home();
    await userEvent.click(screen.getByRole('link', { name: 'Поиск' }));
    expect(await screen.findByText('Найдено 8 объявлений')).toBeVisible();
    await home();
    expect(screen.getByRole('link', { name: /Квартиры · Сокольники/ })).toBeVisible();
    await userEvent.click(screen.getByRole('link', { name: 'Все объявления' }));
    expect(await screen.findByText('Найдено 8 объявлений')).toBeVisible();
    await home();
    expect(screen.getByRole('link', { name: /Квартиры · Сокольники/ })).toBeVisible();
  });

  it('records an explicitly submitted search after clearing its filters', async () => {
    open('/search?q=Сокольники');
    expect(await screen.findByText('Найдено 2 объявления')).toBeVisible();
    await userEvent.clear(screen.getByLabelText('Город, район или метро'));
    await userEvent.click(screen.getByRole('button', { name: 'Показать' }));
    expect(await screen.findByText('Найдено 8 объявлений')).toBeVisible();
    await home();
    expect(screen.getByRole('link', { name: /Квартиры · Москва/ })).toBeVisible();
  });

  it('saves criteria once, restores filters after reload and falls back to last search on removal', async () => {
    open(`/search?${exampleSearch}`);
    expect(await screen.findByText('Найдено 1 объявление')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить поиск' }));
    expect(screen.getByRole('button', { name: 'Поиск сохранён' })).toBeDisabled();
    const stored = JSON.parse(localStorage.getItem(searchStorageKey)!);
    expect(stored.savedSearches).toEqual([exampleSearch]);
    cleanup();
    open();
    expect(screen.getByText('Сохранённый поиск')).toBeVisible();
    expect(screen.queryByText('Вы недавно искали')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: /2-комнатные квартиры · Сокольники/ }));
    expect(await screen.findByText('Найдено 1 объявление')).toBeVisible();
    expect(screen.getByLabelText('Комнатность')).toHaveValue('2');
    expect(screen.getByLabelText('Цена до, ₽')).toHaveValue(20000000);
    await home();
    await userEvent.click(screen.getByRole('button', { name: 'Все сохранённые поиски' }));
    await userEvent.click(
      screen.getByRole('button', { name: `Удалить поиск: ${searchTitle(exampleSearch)}` }),
    );
    expect(screen.getByRole('dialog')).toHaveTextContent('Пока нет сохранённых поисков');
    await userEvent.click(screen.getByRole('button', { name: 'Закрыть окно' }));
    expect(screen.getByText('Вы недавно искали')).toBeVisible();
  });

  it('updates favorites across the feed and tabbar and returns from detail to the scrolled home', async () => {
    open();
    await userEvent.click(
      screen.getByRole('button', { name: 'В избранное: Светлая квартира рядом с парком' }),
    );
    expect(screen.getByRole('link', { name: 'Избранное: 1' })).toBeVisible();
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(420);
    await userEvent.click(screen.getByRole('link', { name: '2-комн. квартира, 54 м², 7/17 этаж' }));
    expect(screen.getByRole('link', { name: '← На главную' })).toBeVisible();
    await userEvent.click(screen.getByRole('link', { name: '← На главную' }));
    expect(window.scrollTo).toHaveBeenLastCalledWith(0, 420);
    await userEvent.click(screen.getByRole('link', { name: 'Избранное: 1' }));
    expect(await screen.findByText('Найдено 1 объявление')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Сохранить поиск' })).not.toBeInTheDocument();
  });

  it.each(['new', 'returning'])(
    'isolates the %s example from personal storage',
    async (scenario) => {
      const personal = JSON.stringify({ lastSearch: 'q=Сокол', savedSearches: ['q=Сокол'] });
      localStorage.setItem(searchStorageKey, personal);
      localStorage.setItem('cian3:favorites:v1', '["8"]');
      open(`/?scenario=${scenario}`);
      expect(!!screen.queryByText('Сохранённый поиск')).toBe(scenario === 'returning');
      await userEvent.click(
        screen.getByRole('button', { name: 'В избранное: Светлая квартира рядом с парком' }),
      );
      await userEvent.click(screen.getByRole('link', { name: /Купить/ }));
      expect(await screen.findByText('Найдено 8 объявлений')).toBeVisible();
      await userEvent.click(screen.getByRole('button', { name: 'Сохранить поиск' }));
      expect(localStorage.getItem(searchStorageKey)).toBe(personal);
      expect(localStorage.getItem('cian3:favorites:v1')).toBe('["8"]');
    },
  );

  it('handles invalid history and blocked storage without breaking search or saving', async () => {
    localStorage.setItem(searchStorageKey, '{broken');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Blocked');
    });
    open();
    expect(screen.queryByText('Вы недавно искали')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Найти квартиру' }));
    expect(await screen.findByText('Найдено 8 объявлений')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить поиск' }));
    await home();
    expect(screen.getByText('Сохранённый поиск')).toBeVisible();
  });
});

describe('Search history identity', () => {
  it('deduplicates equivalent parameters and excludes review and favorites parameters', () => {
    expect(
      normalizeSearch('state=error&rooms=2&q=+Сокол+&favorites=1&sort=default&maxPrice=0'),
    ).toBe(normalizeSearch('q=Сокол&rooms=2'));
    expect(normalizeSearch('rooms=invalid&maxPrice=Infinity&sort=unknown')).toBe('');
  });
});
