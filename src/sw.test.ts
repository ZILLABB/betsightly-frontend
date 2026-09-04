import fs from "node:fs";
import path from "node:path";

test("time-sensitive betting endpoints are registered as network-only first", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src", "sw.ts"), "utf8");
  const networkOnly = source.indexOf("new NetworkOnly()")
  const fallback = source.indexOf('cacheName: "api-cache"')
  expect(networkOnly).toBeGreaterThan(0)
  expect(networkOnly).toBeLessThan(fallback)
  for (const endpoint of ["daily-accumulators", "bookable-now", "bookings", "live-scores"]) {
    expect(source.slice(0, fallback)).toContain(endpoint)
  }
})
