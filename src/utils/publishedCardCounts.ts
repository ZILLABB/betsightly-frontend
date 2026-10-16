import type { CategoryKey, GamePrediction } from "../types";

/** Duplicate fixtures across Banker, 2x, 5x, 10x and Over Goals are
 * distinct published selections, not five separate football matches.
 * Prefer exact source identifiers. Use a stable fixture label only when
 * providers omit IDs; never count a phantom fixture with no teams. */
export function publishedCardCounts(
  accumulators: Partial<Record<CategoryKey, { games?: GamePrediction[] }>> | null | undefined,
): { selections: number; uniqueFixtures: number } {
  const ids = new Set<string>();
  let selections = 0;
  for (const tier of Object.values(accumulators ?? {})) {
    for (const game of tier?.games ?? []) {
      if (!game) continue;
      selections++;
      const key = (game.match_id && String(game.match_id)) ||
        (game.fixture_id && String(game.fixture_id)) ||
        (game.home_team && game.away_team
          ? [game.home_team.trim().toLowerCase(), game.away_team.trim().toLowerCase(),
             String(game.date || "").slice(0, 10)].join("|")
          : "");
      if (key) ids.add(key);
    }
  }
  return { selections, uniqueFixtures: ids.size };
}
