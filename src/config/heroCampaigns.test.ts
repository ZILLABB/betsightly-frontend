import { resolveHeroCampaign } from "./heroCampaigns";

const saturday = new Date("2026-10-03T12:00:00Z");

test("World Cup outranks generic weekend", () => {
  expect(resolveHeroCampaign({ now: saturday, activeCompetitions: ["FIFA World Cup", "Premier League"], fixtureCount: 10 }).id).toBe("world-cup");
});

test("resolves qualifier and Champions League signals deterministically", () => {
  expect(resolveHeroCampaign({ now: saturday, activeCompetitions: ["World Cup Qualifiers"] }).id).toBe("qualifiers");
  expect(resolveHeroCampaign({ now: saturday, activeCompetitions: ["UEFA Champions League"] }).id).toBe("continental");
});

test("uses a quiet-board fallback without a campaign collision", () => {
  const result = resolveHeroCampaign({ now: saturday, fixtureCount: 1 });
  expect(result.id).toBe("quiet-board");
  expect(result.headline).toContain("Same standards");
});
