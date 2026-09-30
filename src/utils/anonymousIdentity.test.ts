import { anonymousBuilderId } from "./anonymousIdentity";

beforeEach(() => localStorage.clear());

test("creates one persistent anonymous Builder identity", () => {
  const first = anonymousBuilderId();
  expect(first).toMatch(/^anon_/);
  expect(localStorage.getItem("betsightly.anonymous_id.v1")).toBe(first);
  expect(anonymousBuilderId()).toBe(first);
});
