import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { UIKitPage } from './pages/UIKitPage';
import { PrototypeProvider } from './hooks/PrototypeContext';
import { RouteScroll } from './components/RouteScroll';
import { ScenarioMap } from './pages/ScenarioMap';
import {
  HomePage,
  SearchPage,
  DetailPage,
  GuidePage,
  PatternsPage,
  NotFoundPage,
} from './pages/PrototypePages';
export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title =
      pathname === '/map'
        ? 'Циан · Карта сценария и A/B-тест'
        : pathname === '/ui'
          ? 'Циан · UI kit'
          : 'Циан · Прототипы';
  }, [pathname]);
  return (
    <PrototypeProvider>
      <RouteScroll />
      <Routes>
        <Route path="/map" element={<ScenarioMap />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/listing/:id" element={<DetailPage />} />
        <Route path="/ui" element={<UIKitPage prototype />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/patterns" element={<PatternsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </PrototypeProvider>
  );
}
