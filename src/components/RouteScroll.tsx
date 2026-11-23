import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/** Restore explicit card returns and browser Back, including delayed search results. */
export function RouteScroll() {
  const location = useLocation();
  const navigation = useNavigationType();
  const positions = useRef(new Map<string, number>());
  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);
  useLayoutEffect(() => {
    const requested: unknown = location.state?.restoreScroll;
    const target =
      navigation === 'POP' && positions.current.has(location.key)
        ? positions.current.get(location.key)!
        : typeof requested === 'number' && Number.isFinite(requested)
          ? Math.max(0, requested)
          : 0;
    window.scrollTo(0, target);
    const onScroll = () => positions.current.set(location.key, window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    const observer =
      target && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            window.scrollTo(0, target);
            if (document.documentElement.scrollHeight >= target + window.innerHeight)
              observer?.disconnect();
          })
        : null;
    observer?.observe(document.body);
    const stop = () => observer?.disconnect();
    window.addEventListener('pointerdown', stop, { once: true });
    window.addEventListener('wheel', stop, { once: true });
    window.addEventListener('keydown', stop, { once: true });
    const timer = window.setTimeout(stop, 1500);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointerdown', stop);
      window.removeEventListener('wheel', stop);
      window.removeEventListener('keydown', stop);
      window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, [location.key, location.state, navigation]);
  return null;
}
