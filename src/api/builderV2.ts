import type { GamePrediction, TierBooking } from "../types";

const BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://betsightly-api.onrender.com/api";

export type BuilderV2Mode =
  | "target_odds"
  | "game_count"
  | "strongest"
  | "manual";

export type BuilderV2Horizon =
  | "today"
  | "3_days"
  | "7_days";

export interface BuilderV2Filters {
  horizon: BuilderV2Horizon;
  markets?: string[];
  min_odds?: number;
  max_odds?: number;
  min_probability?: number;
  min_trust_grade?: "A" | "B";
  include_leagues?: string[];
  require_bookable?: boolean;
}

export interface BuilderV2Candidate extends GamePrediction {
  recommended_for_fixture?: boolean;
  market_capability?: string;
  lower_reliability_bound?: number;
  trust_grade?: "A" | "B";
  trust_score?: number;
}

export interface BuilderV2Response {
  status:
    | "success"
    | "unavailable"
    | "error"
    | "SELECTIONS_CHANGED"
    | "BOOKING_UNAVAILABLE";
  reason?: string;
  mode?: BuilderV2Mode;
  origin?: "BETSIGHTLY_AUTO" | "USER_MANUAL" | "USER_EDITED";
  games?: GamePrediction[];
  candidates?: BuilderV2Candidate[];
  candidate_count?: number;
  odds?: number;
  achieved_odds?: number;
  legs?: number;
  requested_game_count?: number | null;
  delivered_game_count?: number;
  shortfall?: number;
  shortfall_reason?: string | null;
  average_probability?: number;
  lowest_probability?: number;
  estimated_all_leg_probability?: number;
  lowest_trust_grade?: string | null;
  booking?: TierBooking;
  booking_status?: string;
  readback_status?: string;
  retryable?: boolean;
  refresh_started?: boolean;
  invalid_selections?: Array<{
    selection_id?: string;
    fixture_id?: string;
    reason: string;
    actions?: string[];
  }>;
}

async function post<T>(
  path: string,
  body: unknown,
): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(
    () => controller.abort(),
    60_000,
  );

  try {
    const response = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      let detail = "";
      try {
        const payload = await response.json();
        detail =
          payload?.detail ||
          payload?.reason ||
          payload?.message ||
          "";
      } catch {
        // Non-JSON body.
      }
      const error = new Error(
        detail || `HTTP ${response.status}`,
      ) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }

    return response.json() as Promise<T>;
  } finally {
    window.clearTimeout(timer);
  }
}

export const builderV2Api = {
  candidates: (filters: BuilderV2Filters) =>
    post<BuilderV2Response>(
      "/leagues/slip-builder/v2/candidates",
      { ...filters, require_bookable: true },
    ),

  generate: (
    request: BuilderV2Filters & {
      mode: "game_count" | "strongest";
      game_count?: number;
      max_games?: number;
    },
  ) =>
    post<BuilderV2Response>(
      "/leagues/slip-builder/v2/generate",
      { ...request, require_bookable: true },
    ),

  manual: (
    request: BuilderV2Filters & {
      selection_ids: string[];
    },
  ) =>
    post<BuilderV2Response>(
      "/leagues/slip-builder/v2/manual",
      { ...request, require_bookable: true },
    ),
};
