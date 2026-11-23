import { StrictMode } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearGoalLog, getGoalLog, GOAL_LOG_KEY, trackGoal } from './metrika';
import { useGoalView } from './useGoalView';

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  clearGoalLog();
});
afterEach(() => {
  delete window.ym;
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
});

describe('Local Metrika adapter', () => {
  it('adds step parameters and keeps a bounded session journal without calling counter 0', () => {
    window.ym = vi.fn();
    for (let i = 0; i < 205; i++) trackGoal('listing_view', { listing_id: '1' });
    expect(getGoalLog()).toHaveLength(200);
    expect(getGoalLog()[0].params).toMatchObject({ flow: 'home', variant: 'A', step: 3 });
    expect(JSON.parse(sessionStorage.getItem(GOAL_LOG_KEY)!)).toHaveLength(200);
    expect(window.ym).not.toHaveBeenCalled();
  });

  it('keeps working when storage is blocked, and excludes the map', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => trackGoal('contact_open')).not.toThrow();
    expect(getGoalLog()).toHaveLength(1);
    window.history.replaceState(null, '', '/map');
    trackGoal('overlay_close');
    expect(getGoalLog()).toHaveLength(1);
    clearGoalLog();
    expect(getGoalLog()).toEqual([]);
  });

  it('records a view once in StrictMode and again when the screen state changes', () => {
    function View({ status }: { status: string | null }) {
      useGoalView(status ? 'search_view' : null, { status });
      return null;
    }
    const tree = (status: string | null) => (
      <StrictMode>
        <MemoryRouter>
          <View status={status} />
        </MemoryRouter>
      </StrictMode>
    );
    const view = render(tree('loading'));
    expect(getGoalLog()).toHaveLength(1);
    view.rerender(tree('results'));
    expect(getGoalLog().map((event) => event.params.status)).toEqual(['loading', 'results']);
    view.rerender(tree('results'));
    expect(getGoalLog()).toHaveLength(2);
    view.rerender(tree(null));
    view.rerender(tree('results'));
    expect(getGoalLog()).toHaveLength(3);
  });
});
