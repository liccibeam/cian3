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
  const preview = scenario === 'new' || scenario === 'returning';
  const [history, setHistory] = useState(() =>
    scenario === 'new'
      ? emptyHistory
      : scenario === 'returning'
        ? { lastSearch: exampleSearch, savedSearches: [exampleSearch] }
        : readSearchHistory(),
  );
  const [favorites, setFavorites] = useState(() => (preview ? [] : readFavorites()));
  const [demo, setDemo] = useState('');
  const [notice, setNotice] = useState('');
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
  };
  const removeSearch = (search: string) => {
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
    setFavorites((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };
  return (
    <PrototypeContext.Provider
      value={{
        favorites,
        toggleFavorite,
        showDemo: setDemo,
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
          <Button fullWidth onClick={() => setDemo('')}>
            Понятно
          </Button>
        </div>
      </Modal>
    </PrototypeContext.Provider>
  );
}
