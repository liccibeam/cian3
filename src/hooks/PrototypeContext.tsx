import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import {
  emptyHistory,
  exampleSearch,
  normalizeSearch,
  readSearchHistory,
  searchStorageKey,
} from '@/data/searches';
import { PrototypeContext } from './prototype-context';
import { Button, Modal } from '@/ui';
import { trackGoal } from '@/analytics/metrika';
import { useGoalView } from '@/analytics/useGoalView';
const storageKey = 'cian3:favorites:v1';
function readFavorites(): string[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(storageKey) || '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}
export function PrototypeProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  // Review examples are isolated for this page session; they never overwrite personal data.
  const [scenario] = useState(() => new URLSearchParams(location.search).get('scenario'));
  const preview = ['new', 'returning', 'recent', 'favorites'].includes(scenario || '');
  const [history, setHistory] = useState(() =>
    scenario === 'new'
      ? emptyHistory
      : scenario === 'returning'
        ? { lastSearch: exampleSearch, savedSearches: [exampleSearch] }
        : scenario === 'recent' || scenario === 'favorites'
          ? { lastSearch: exampleSearch, savedSearches: [] }
          : readSearchHistory(),
  );
  const [favorites, setFavorites] = useState(() =>
    scenario === 'favorites' ? ['1'] : preview ? [] : readFavorites(),
  );
  const initialPanel = new URLSearchParams(location.search).get('panel');
  const [demo, setDemo] = useState(initialPanel === 'demo' ? 'Посуточная аренда' : '');
  const [notice, setNotice] = useState(
    initialPanel === 'sent' ? 'Сообщение сохранено в прототипе' : '',
  );
  useGoalView(demo ? 'demo_view' : null, { screen: 'demo', destination: demo });
  useGoalView(notice === 'Сообщение сохранено в прототипе' ? 'contact_success_view' : null, {
    screen: 'contact_success',
  });
  const openDemo = (title: string) => {
    trackGoal('demo_open', { destination: title });
    setDemo(title);
  };
  useEffect(() => {
    if (preview) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(favorites));
    } catch {
      /* Prototypes remain usable when storage is unavailable. */
    }
  }, [favorites, preview]);
  useEffect(() => {
    if (preview) return;
    try {
      localStorage.setItem(searchStorageKey, JSON.stringify(history));
    } catch {
      /* Keep the current session usable without storage. */
    }
  }, [history, preview]);
  const rememberSearch = useCallback((params: URLSearchParams) => {
    if (params.get('favorites') === '1' || params.has('state')) return;
    const search = normalizeSearch(params);
    setHistory((current) =>
      current.lastSearch === search ? current : { ...current, lastSearch: search },
    );
  }, []);
  const saveSearch = (params: URLSearchParams) => {
    const search = normalizeSearch(params);
    setHistory((current) => ({
      lastSearch: search,
      savedSearches: [search, ...current.savedSearches.filter((item) => item !== search)],
    }));
    setNotice('Поиск сохранён');
    trackGoal('search_save', {
      has_query: params.has('q'),
      has_rooms: params.has('rooms'),
      has_budget: params.has('maxPrice'),
    });
  };
  const removeSearch = (search: string) => {
    trackGoal('saved_search_remove', { screen: 'saved_searches' });
    setHistory((current) => ({
      ...current,
      savedSearches: current.savedSearches.filter((item) => item !== search),
    }));
    setNotice('Поиск удалён из сохранённых');
  };
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(timer);
  }, [notice]);
  const toggleFavorite = (id: string) => {
    trackGoal('favorite_toggle', {
      listing_id: id,
      action: favorites.includes(id) ? 'remove' : 'add',
    });
    setFavorites((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };
  return (
    <PrototypeContext.Provider
      value={{
        favorites,
        toggleFavorite,
        showDemo: openDemo,
        notify: setNotice,
        ...history,
        rememberSearch,
        saveSearch,
        removeSearch,
      }}
    >
      {children}
      <div className="prototype-toast" role="status">
        {notice}
      </div>
      <Modal open={!!demo} title={demo} onClose={() => setDemo('')}>
        <div className="stack">
          <p>
            Этот раздел можно спроектировать в рамках вашего прототипа. Сейчас доступен пример
            поиска, выдачи и просмотра квартиры.
          </p>
          <Button
            fullWidth
            onClick={() => {
              trackGoal('overlay_close', { overlay: 'demo', method: 'confirm' });
              setDemo('');
            }}
          >
            Понятно
          </Button>
        </div>
      </Modal>
    </PrototypeContext.Provider>
  );
}
