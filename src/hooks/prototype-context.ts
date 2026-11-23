import { createContext, useContext } from 'react';

type PrototypeContextValue = {
  favorites: string[];
  toggleFavorite: (id: string) => void;
  showDemo: (title: string) => void;
  notify: (text: string) => void;
  lastSearch: string | null;
  savedSearches: string[];
  rememberSearch: (params: URLSearchParams) => void;
  saveSearch: (params: URLSearchParams) => void;
  removeSearch: (search: string) => void;
};
export const PrototypeContext = createContext<PrototypeContextValue | null>(null);

export function usePrototype() {
  const value = useContext(PrototypeContext);
  if (!value) throw new Error('Use inside PrototypeProvider');
  return value;
}
