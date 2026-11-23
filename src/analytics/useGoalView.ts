import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackGoal } from './metrika';
import type { GoalId, GoalParams } from './goals';

/** One view per navigation/state, including React StrictMode's repeated effect setup. */
export function useGoalView(goal: GoalId | null, params: GoalParams = {}, stateKey?: string) {
  const location = useLocation();
  const last = useRef('');
  const signature = JSON.stringify(params);
  useEffect(() => {
    const identity = `${location.key}:${goal}:${stateKey ?? signature}`;
    if (!goal) {
      last.current = '';
      return;
    }
    if (last.current === identity) return;
    last.current = identity;
    trackGoal(goal, JSON.parse(signature) as GoalParams);
  }, [goal, signature, location.key, stateKey]);
}
