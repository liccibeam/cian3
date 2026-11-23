import { goals, type GoalId, type GoalParams } from './goals';

// 0 is the placeholder. No counter SDK or network request is installed by the prototype.
export const METRIKA_COUNTER_ID = Number(import.meta.env.VITE_METRIKA_COUNTER_ID || 0);
export const GOAL_LOG_KEY = 'cian3:goals:v1';
export type GoalEvent = { id: string; goal: GoalId; at: string; params: GoalParams };
declare global {
  interface Window {
    ym?: (counterId: number, method: 'reachGoal', goal: string, params: GoalParams) => void;
  }
}
function readLog(): GoalEvent[] {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(GOAL_LOG_KEY) || '[]');
    return Array.isArray(value)
      ? value
          .filter(
            (entry) =>
              entry &&
              typeof entry === 'object' &&
              entry.goal in goals &&
              typeof entry.at === 'string' &&
              entry.params &&
              typeof entry.params === 'object',
          )
          .slice(-200)
      : [];
  } catch {
    return [];
  }
}
let log = readLog();
let sequence = 0;
export function currentScreen() {
  const { pathname, search } = window.location;
  if (pathname === '/') return 'home';
  if (pathname === '/search')
    return new URLSearchParams(search).get('favorites') === '1' ? 'favorites' : 'search';
  return pathname.startsWith('/listing/') ? 'listing' : 'other';
}
export function trackGoal(goal: GoalId, params: GoalParams = {}) {
  if (window.location.pathname === '/map') return;
  const event: GoalEvent = {
    id: `${Date.now()}-${++sequence}`,
    goal,
    at: new Date().toISOString(),
    params: {
      flow: 'home',
      variant: 'A',
      step: goals[goal].step,
      screen: currentScreen(),
      ...params,
    },
  };
  log = [...log.slice(-199), event];
  try {
    sessionStorage.setItem(GOAL_LOG_KEY, JSON.stringify(log));
  } catch {
    /* Session memory is sufficient for review. */
  }
  window.dispatchEvent(new CustomEvent('prototype:goal', { detail: event }));
  if (Number.isInteger(METRIKA_COUNTER_ID) && METRIKA_COUNTER_ID > 0 && window.ym) {
    try {
      window.ym(METRIKA_COUNTER_ID, 'reachGoal', goal, event.params);
    } catch {
      /* Analytics must not interrupt the scenario. */
    }
  }
}
export const getGoalLog = () => log;
export function subscribeGoals(callback: () => void) {
  window.addEventListener('prototype:goal', callback);
  return () => window.removeEventListener('prototype:goal', callback);
}
export function clearGoalLog() {
  log = [];
  try {
    sessionStorage.removeItem(GOAL_LOG_KEY);
  } catch {
    /* Storage can be blocked. */
  }
  window.dispatchEvent(new CustomEvent('prototype:goal'));
}
