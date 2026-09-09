import { formatKickoffDateTime, formatLocalTimeWithZone } from "./formatters";

test("formats kickoff and compact times in the requested zone with a label", () => {
  const kickoff = "2026-09-20T19:45:00Z";
  expect(formatKickoffDateTime(kickoff, { timeZone: "Africa/Lagos" }))
    .toBe("20 Sept · 20:45 GMT+1");
  expect(formatLocalTimeWithZone(kickoff, { timeZone: "Africa/Lagos" }))
    .toBe("20:45 GMT+1");
});

test("returns an empty string for an invalid timestamp", () => {
  expect(formatKickoffDateTime("not-a-date")).toBe("");
  expect(formatLocalTimeWithZone("not-a-date")).toBe("");
});
