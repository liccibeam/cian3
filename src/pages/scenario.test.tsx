import { StrictMode } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import { clearGoalLog, getGoalLog } from '@/analytics/metrika';
import { mapLanes, mapScreens } from '@/data/scenarioMap';

beforeEach(() => {
  localStorage.clear();
  clearGoalLog();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});
afterEach(() => {
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
function open(path: string) {
  window.history.replaceState(null, '', path);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('Scenario map and goals', () => {
  it('shows every distinct screen, supports enlargement and validates the calculator', async () => {
    open('/map');
    expect(new Set(mapLanes.flatMap((lane) => lane.screens)).size).toBe(16);
    for (const item of Object.values(mapScreens)) {
      expect(
        screen.getAllByRole('button', { name: `Увеличить: ${item.title}` }).length,
      ).toBeGreaterThan(0);
    }
    expect(screen.getByText('13 200 пользователей', { exact: false })).toBeVisible();
    const trigger = screen.getAllByRole('button', { name: 'Увеличить: Связаться с продавцом' })[0];
    await userEvent.click(trigger);
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Связаться с продавцом');
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { bubbles: true, cancelable: true }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    await userEvent.clear(screen.getByLabelText('Подходящих пользователей в день'));
    expect(screen.getByRole('alert')).toBeVisible();
    expect(getGoalLog()).toHaveLength(0);
  });

  it('tracks the journey without query or form text', async () => {
    open('/?scenario=new');
    await userEvent.type(screen.getByLabelText('Город, район или метро'), 'Сокольники');
    await userEvent.click(screen.getByRole('button', { name: 'Найти квартиру' }));
    await userEvent.click(
      await screen.findByRole('link', { name: '2-комн. квартира, 54 м², 7/17 этаж' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'В избранное: Светлая квартира рядом с парком' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Связаться с продавцом' }));
    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('Ваше имя'), 'ТестовоеИмя');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Отправить сообщение' }));
    const log = getGoalLog();
    expect(log.filter((event) => event.goal === 'home_view')).toHaveLength(1);
    for (const [goal, step] of [
      ['home_view', 1],
      ['search_submit', 1],
      ['search_view', 2],
      ['listing_open', 3],
      ['listing_view', 3],
      ['contact_open', 4],
      ['contact_view', 4],
      ['contact_submit', 5],
      ['contact_success_view', 5],
    ] as const) {
      expect(log.some((event) => event.goal === goal && event.params.step === step)).toBe(true);
    }
    expect(log.filter((event) => event.goal === 'contact_submit')).toHaveLength(1);
    expect(log.filter((event) => event.goal === 'contact_success_view')).toHaveLength(1);
    expect(log.find((event) => event.goal === 'favorite_toggle')?.params.action).toBe('add');
    expect(JSON.stringify(log)).not.toMatch(/Сокольники|ТестовоеИмя/);
  });

  it('keeps a preview panel open through the queued StrictMode close event', async () => {
    vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(function (
      this: HTMLDialogElement,
    ) {
      this.removeAttribute('open');
      queueMicrotask(() => this.dispatchEvent(new Event('close')));
    });
    render(
      <StrictMode>
        <MemoryRouter initialEntries={['/listing/1?scenario=new&panel=contact']}>
          <App />
        </MemoryRouter>
      </StrictMode>,
    );
    await Promise.resolve();
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Написать продавцу');
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { bubbles: true, cancelable: true }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(getGoalLog().filter((event) => event.goal === 'contact_view')).toHaveLength(1);
  });
});
