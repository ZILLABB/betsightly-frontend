import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

// Execute the real API module with only Vite's compile-time env substituted.
// This exercises fetch serialization, not a mocked API facade.
const source = fs.readFileSync(path.join(process.cwd(), "src/api/predictions.ts"), "utf8")
  .replace("import.meta.env.VITE_API_BASE_URL", '"https://backend.test/api"');
const compiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
} }).outputText;
const exported: any = {};
new Function("exports", compiled)(exported);
const api = exported.api;

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "success" }) });
});

test.each(["today", "week"])("legacy target helper uses V2 for %s", async (horizon) => {
  await api.buildSlip(100, horizon, true);
  const [url, options] = (fetch as jest.Mock).mock.calls[0];
  expect(url).toBe("https://backend.test/api/leagues/slip-builder/v2/generate");
  expect(JSON.parse(options.body)).toEqual({ mode: "target_odds", target_odds: 100,
    horizon: horizon === "week" ? "7_days" : "today", refresh: true,
    markets: [], min_trust_grade: "B", require_bookable: true });
});

test.each(["strict_selected_markets", "selected_first_then_eligible"])("preserves %s contract", async (fill_strategy) => {
  const payload = { mode: "game_count", game_count: 50, horizon: "7_days",
    markets: ["over_1_5"], fill_strategy, require_bookable: true };
  await api.generateBuilderV2(payload);
  expect(JSON.parse((fetch as jest.Mock).mock.calls[0][1].body)).toEqual(payload);
});

test("preserves optional anonymous Builder identity in request serialization", async () => {
  const payload = { mode: "strongest", horizon: "today", anonymous_id: "anon_test_identity_123" };
  await api.generateBuilderV2(payload);
  expect(JSON.parse((fetch as jest.Mock).mock.calls[0][1].body)).toEqual(payload);
});

test("serializes explicit Build Another without changing the request contract", async () => {
  const payload = {
    mode: "target_odds",
    target_odds: 20,
    horizon: "7_days",
    anonymous_id: "anon_test_identity_123",
    build_another: true,
  };

  await api.generateBuilderV2(payload);

  expect(
    JSON.parse((fetch as jest.Mock).mock.calls[0][1].body),
  ).toEqual(payload);
});


test("manual sends exact IDs to V2, never reconstructed odds", async () => {
  const payload = { mode: "manual", selection_ids: ["exact-a", "exact-b"], horizon: "3_days" };
  await api.buildManualBuilderV2(payload);
  const [url, options] = (fetch as jest.Mock).mock.calls[0];
  expect(url).toContain("/v2/manual");
  expect(JSON.parse(options.body)).toEqual(payload);
});


test("preserves structured retryable API error details", async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status: 503,
    json: async () => ({
      detail: {
        reason: "board_refreshing",
        retryable: true,
        refresh_started: true,
      },
    }),
  });

  await expect(api.getBookableNow()).rejects.toMatchObject({
    message: "board_refreshing",
    status: 503,
    reason: "board_refreshing",
    retryable: true,
  });
});
