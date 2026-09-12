import { formatCompetitionContext, formatKickoffDateTime, formatLeagueName, formatLocalTimeWithZone } from "./formatters";

test("formats kickoff and compact times in the requested zone with a label", () => {
  const kickoff = "2026-09-20T19:45:00Z";
  expect(formatKickoffDateTime(kickoff, { timeZone: "Africa/Lagos" }))
    .toBe("20 Sept · 20:45 GMT+1");
  expect(formatLocalTimeWithZone(kickoff, { timeZone: "Africa/Lagos" }))
    .toBe("20:45 GMT+1");
});

test("formats provider season league names without hardcoding a competition", () => {
  expect(formatLeagueName("2026 27 German Bundesliga")).toBe("Bundesliga · 2026/27");
  expect(formatLeagueName("2025-2026 English Premier League")).toBe("Premier League · 2025/26");
  expect(formatLeagueName("UEFA Champions League")).toBe("UEFA Champions League");
});

test("formats duplicated season context but preserves genuine stages", () => {
  expect(formatCompetitionContext("2026 27 Turkish Super Lig")).toBe("2026/27");
  expect(formatCompetitionContext("2026 Eliteserien")).toBe("2026 season");
  expect(formatCompetitionContext("Quarterfinals · 2nd leg")).toBe("Quarterfinals · 2nd leg");
  expect(formatCompetitionContext("Regular Season")).toBe("Regular Season");
});

test("returns an empty string for an invalid timestamp", () => {
  expect(formatKickoffDateTime("not-a-date")).toBe("");
  expect(formatLocalTimeWithZone("not-a-date")).toBe("");
});
