import { isEarlierPublication, lagosDayKey } from "./publicationFreshness";

test("uses WAT business day on either side of midnight, not the viewer's timezone", () => {
  expect(lagosDayKey(new Date("2026-10-18T22:30:00Z"))).toBe("2026-10-18");
  expect(lagosDayKey(new Date("2026-10-18T23:30:00Z"))).toBe("2026-10-19");
});
test("labels an older published card as previous while retaining current-day cards", () => {
  const now = new Date("2026-10-19T06:30:00Z");
  expect(isEarlierPublication("2026-10-18", now)).toBe(true);
  expect(isEarlierPublication("2026-10-19", now)).toBe(false);
  expect(isEarlierPublication(undefined, now)).toBe(false);
});
