/** Only for opt-in manual reduced tickets. Other tiers retain their 20m rule. */
export const MANUAL_REMAINDER_CUTOFF_MS = 10 * 60 * 1000;

export function manualRemainingLegsStillEligible(
  games: Array<{ kickoff?: string | null; date?: string | null; commence_time?: string | null }>,
  nowMs = Date.now(),
): boolean {
  if (!games.length) return false;
  return games.every(game => {
    const kickoff = new Date(game.kickoff || game.date || game.commence_time || "").getTime();
    return Number.isFinite(kickoff) && kickoff > nowMs + MANUAL_REMAINDER_CUTOFF_MS;
  });
}
