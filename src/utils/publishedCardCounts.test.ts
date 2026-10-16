import { publishedCardCounts } from "./publishedCardCounts";

describe("publishedCardCounts", () => {
  test("counts repeated fixture only once across the official categories", () => {
    const leg = (fixture_id: number, home_team = "Alpha") => ({
      fixture_id, home_team, away_team: "Beta", date: "2026-10-16",
    });
    expect(publishedCardCounts({
      banker: { games: [leg(101)] },
      "2_odds": { games: [leg(101), leg(102, "Gamma")] },
      "5_odds": { games: [leg(101)] },
      over_1_5: { games: [leg(102, "Gamma")] },
    } as any)).toEqual({ selections: 5, uniqueFixtures: 2 });
  });

  test("uses team names and day when event identifier is absent", () => {
    const leg = { home_team: "Alpha", away_team: "Beta", date: "2026-10-16" };
    expect(publishedCardCounts({
      "2_odds": { games: [leg] },
      "10_odds": { games: [{ ...leg, home_team: " alpha " }, {
        ...leg, date: "2026-10-17",
      }] },
    } as any)).toEqual({ selections: 3, uniqueFixtures: 2 });
    expect(publishedCardCounts(undefined)).toEqual({
      selections: 0, uniqueFixtures: 0,
    });
  });
});
