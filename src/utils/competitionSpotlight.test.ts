import { competitionSpotlight } from "./competitionSpotlight";

describe("competitionSpotlight", () => {
  test("promotes Champions League only from actual upcoming fixtures", () => {
    expect(competitionSpotlight([
      { slug: "eng.1", name: "Premier League", count: 9 },
      { slug: "uefa.champions", name: "UEFA Champions League", count: 18 },
    ])).toEqual(expect.objectContaining({
      headline: "Champions League week",
      fixtureCount: 18,
    }));
  });

  test("World Cup takes priority only when it appears on the current board", () => {
    const result = competitionSpotlight([
      { slug: "uefa.champions", name: "UEFA Champions League", count: 18 },
      { slug: "fifa.world", name: "FIFA World Cup", count: 10 },
    ]);
    expect(result?.headline).toBe("World Cup fixtures ahead");
  });

  test("no tournament name or no fixture means no manufactured spotlight", () => {
    expect(competitionSpotlight([])).toBeNull();
    expect(competitionSpotlight([{ name: "FIFA World Cup", count: 0 }])).toBeNull();
    expect(competitionSpotlight([{ name: "World Cup", count: -5 }])).toBeNull();
    expect(competitionSpotlight([{ name: "World Cup" }])).toBeNull();
    expect(competitionSpotlight([{ name: "Friendly", count: 5 }])).toBeNull();
    expect(competitionSpotlight(undefined)).toBeNull();
  });
});
