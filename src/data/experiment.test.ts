import { describe, expect, it } from 'vitest';
import { experimentSize } from './experiment';

describe('Experiment planning', () => {
  it('sizes both metrics and includes complete weeks plus follow-up', () => {
    expect(experimentSize()).toEqual({
      primary: 6510,
      guardrail: 5874,
      perArm: 6600,
      total: 13200,
      recruitmentDays: 14,
      totalDays: 15,
    });
    expect(experimentSize(20, 2, 500)?.recruitmentDays).toBe(28);
    expect(experimentSize(20, 10, 1000)?.perArm).toBe(5900);
  });

  it.each([
    [0, 2, 1000],
    [99, 2, 1000],
    [20, 0, 1000],
    [20, -2, 1000],
    [20, 2, 0],
    [20, 2, Infinity],
    [NaN, 2, 1000],
  ])('rejects invalid inputs (%s, %s, %s)', (base, effect, traffic) => {
    expect(experimentSize(base, effect, traffic)).toBeNull();
  });
});
