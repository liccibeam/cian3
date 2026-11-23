/** Two independent proportions, normal approximation; alpha=.05 two-sided, power=.8. */
export function experimentSize(baselinePercent = 20, upliftPoints = 2, dailyUsers = 1000) {
  const p0 = baselinePercent / 100;
  const delta = upliftPoints / 100;
  const p1 = p0 + delta;
  if (!(p0 > 0 && p1 < 1 && delta > 0 && dailyUsers > 0 && Number.isFinite(dailyUsers)))
    return null;
  const pooled = (p0 + p1) / 2;
  const primary = Math.ceil(
    ((1.95996398454 * Math.sqrt(2 * pooled * (1 - pooled)) +
      0.84162123357 * Math.sqrt(p0 * (1 - p0) + p1 * (1 - p1))) /
      delta) **
      2,
  );
  // Non-inferiority: error/empty-user rate assumed 5%, maximum increase +1 pp;
  // one-sided alpha=.05, power=.8 under true difference zero.
  const guardrail = Math.ceil(2 * 0.05 * 0.95 * ((1.64485362695 + 0.84162123357) / 0.01) ** 2);
  const perArm = Math.ceil(Math.max(primary, guardrail) / 100) * 100;
  const recruitmentDays = Math.max(14, Math.ceil((2 * perArm) / dailyUsers / 7) * 7);
  return {
    primary,
    guardrail,
    perArm,
    total: perArm * 2,
    recruitmentDays,
    totalDays: recruitmentDays + 1,
  };
}
