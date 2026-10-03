import { resolveHeroCampaign, selectHeroFixtures } from "./heroCampaigns";

const saturday = new Date("2026-10-03T12:00:00Z");

test("World Cup outranks generic weekend", () => {
  expect(resolveHeroCampaign({ now: saturday, activeCompetitions: ["FIFA World Cup", "Premier League"], fixtureCount: 10 }).id).toBe("world-cup");
});

test("resolves qualifier and Champions League signals deterministically", () => {
  expect(resolveHeroCampaign({ now: saturday, activeCompetitions: ["World Cup Qualifiers"] }).id).toBe("qualifiers");
  expect(resolveHeroCampaign({ now: saturday, activeCompetitions: ["UEFA Champions League"] }).id).toBe("continental");
  expect(resolveHeroCampaign({ now: saturday, activeCompetitions: ["FIFA Club World Cup"] }).id).toBe("club-world-cup");
  expect(resolveHeroCampaign({ now: saturday, activeCompetitions: ["AFCON Qualifiers"] }).id).toBe("afcon-qualifiers");
});

test("featured fixtures are upcoming, unique and campaign-relevant without changing pick selection", () => {
  const campaign = resolveHeroCampaign({ now: saturday, activeCompetitions: ["Premier League"] });
  const fixtures = selectHeroFixtures([
    { fixture_id: 1, home_team: "Past", away_team: "Fixture", league: "Premier League", date: "2026-10-02T12:00:00Z" },
    { fixture_id: 2, home_team: "Elsewhere", away_team: "FC", league: "Other League", date: "2026-10-04T12:00:00Z", home_team_logo: "logo" },
    { fixture_id: 3, home_team: "Home", away_team: "Away", league: "Premier League", date: "2026-10-05T12:00:00Z" },
    { fixture_id: 3, home_team: "Home", away_team: "Away", league: "Premier League", date: "2026-10-05T12:00:00Z" },
  ], campaign, saturday);

  expect(fixtures.map((fixture) => fixture.fixture_id)).toEqual([3, 2]);
});

test("uses a quiet-board fallback without a campaign collision", () => {
  const result = resolveHeroCampaign({ now: saturday, fixtureCount: 1 });
  expect(result.id).toBe("quiet-board");
  expect(result.headline).toContain("Same standards");
});
