import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { api, type BuiltSlip } from "../api/predictions";
import type { GamePrediction } from "../types";
import { trackProductEvent } from "../services/bookingTracking";

import {
  BuilderContext,
  type BuilderHorizon,
} from "./BuilderContextInstance";

const STORAGE_KEY = "betsightly_builder_session";
const MAX_AUTO_RECOVERY_ATTEMPTS = 3;

interface SavedBuilderState {
  target: number;
  horizon: BuilderHorizon;
  slip: BuiltSlip | null;
}

function readSavedState(): SavedBuilderState {
  const fallback: SavedBuilderState = {
    target: 50,
    horizon: "week",
    slip: null,
  };

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return fallback;
    }

    return {
      ...fallback,
      ...JSON.parse(raw),
    };
  } catch {
    return fallback;
  }
}

const trustBand = (score?: number) =>
  score == null
    ? "Evidence checked"
    : score >= 85
      ? "Strong evidence"
      : "Supported evidence";

const marketMix = (games: GamePrediction[] = []) =>
  Object.entries(
    games.reduce<Record<string, number>>((all, game) => {
      const market =
        game.prediction_type || game.market || "other";

      all[market] = (all[market] || 0) + 1;

      return all;
    }, {}),
  )
    .map(([market, count]) => `${market}:${count}`)
    .join(",");

export function BuilderProvider({
  children,
}: {
  children: ReactNode;
}) {
  const initial = useRef(readSavedState()).current;

  const [target, setTarget] = useState(initial.target);
  const [horizon, setHorizon] =
    useState<BuilderHorizon>(initial.horizon);
  const [slip, setSlip] =
    useState<BuiltSlip | null>(initial.slip);

  const [loading, setLoading] = useState(false);
  const [recoveringCode, setRecoveringCode] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  const inFlight = useRef(false);
  const recoveryAttempts = useRef(0);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          target,
          horizon,
          slip,
        }),
      );
    } catch {
      // Persistence failure must never break Builder.
    }
  }, [target, horizon, slip]);

  const chooseTarget = useCallback((value: number) => {
    setTarget(value);
    setSlip(null);
    setError(null);
    recoveryAttempts.current = 0;
  }, []);

  const chooseHorizon = useCallback(
    (value: BuilderHorizon) => {
      setHorizon(value);
      setSlip(null);
      setError(null);
      recoveryAttempts.current = 0;
    },
    [],
  );

  const build = useCallback(
    async (
      regenerate = false,
      targetOverride?: number,
    ) => {
      if (inFlight.current) {
        return;
      }

      if (
        regenerate &&
        !window.confirm(
          "Regenerating creates a fresh SportyBet code and may change the selections or odds. Continue?",
        )
      ) {
        return;
      }

      const requestedTarget =
        targetOverride ?? target;

      inFlight.current = true;
      const startedAt = performance.now();

      trackProductEvent(
        "builder_generate_requested",
        {
          product_area: "builder",
          source: "generator",
          tier: horizon,
          target_odds: requestedTarget,
          horizon,
        },
      );

      setLoading(true);
      setError(null);
      setSlip(null);

      try {
        const result = await api.buildSlip(
          requestedTarget,
          horizon,
          regenerate,
        );

        setSlip(result);
        recoveryAttempts.current = 0;

        const booking = result.booking;

        if (result.status === "success") {
          trackProductEvent("builder_generated", {
            product_area: "builder",
            source: "generator",
            tier: horizon,
            target_odds: requestedTarget,
            horizon,
            leg_count: result.legs,
            booking_status:
              booking?.booking_status ??
              booking?.status ??
              "UNAVAILABLE",
            actual_sportybet_odds:
              booking?.actual_sportybet_odds,
            duration_ms: Math.round(
              performance.now() - startedAt,
            ),
            cached: result.cached ? 1 : 0,
            lowest_trust_grade:
              result.lowest_trust_grade,
            average_trust_band: trustBand(
              result.average_trust_score,
            ),
            market_mix: marketMix(result.games),
            target_reached:
              (result.odds ?? 0) >= requestedTarget
                ? 1
                : 0,
          });
        } else {
          trackProductEvent("builder_unavailable", {
            product_area: "builder",
            target_odds: requestedTarget,
            horizon,
            failure_category: result.status,
            duration_ms: Math.round(
              performance.now() - startedAt,
            ),
          });
        }
      } catch (error) {
        const err = error as Error & {
          name?: string;
        };

        trackProductEvent("builder_failed", {
          product_area: "builder",
          target_odds: requestedTarget,
          horizon,
          failure_category:
            err?.name === "AbortError"
              ? "timeout"
              : "request_failed",
          duration_ms: Math.round(
            performance.now() - startedAt,
          ),
        });

        setError(
          err?.name === "AbortError"
            ? "That took longer than expected — the server may be waking up. Try once more."
            : err?.message
              ? `Could not build a slip: ${err.message}`
              : "Could not build a slip just now. Try again in a moment.",
        );
      } finally {
        inFlight.current = false;
        setLoading(false);
      }
    },
    [horizon, target],
  );

  useEffect(() => {
    if (
      slip?.status !== "success" ||
      slip.booking?.status === "active" ||
      recoveryAttempts.current >=
        MAX_AUTO_RECOVERY_ATTEMPTS
    ) {
      return;
    }

    let timer: number | undefined;

    const recover = async () => {
      if (
        document.visibilityState !== "visible" ||
        !navigator.onLine ||
        inFlight.current
      ) {
        return;
      }

      inFlight.current = true;
      recoveryAttempts.current += 1;
      setRecoveringCode(true);

      try {
        setSlip(
          await api.buildSlip(
            target,
            horizon,
            true,
          ),
        );
      } catch {
        // Recovery must never break navigation.
      } finally {
        inFlight.current = false;
        setRecoveringCode(false);
      }
    };

    const schedule = () => {
      if (!timer) {
        timer = window.setTimeout(() => {
          timer = undefined;
          void recover();
        }, 12_000);
      }
    };

    schedule();

    window.addEventListener("focus", schedule);
    window.addEventListener("online", schedule);
    document.addEventListener(
      "visibilitychange",
      schedule,
    );

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }

      window.removeEventListener(
        "focus",
        schedule,
      );
      window.removeEventListener(
        "online",
        schedule,
      );
      document.removeEventListener(
        "visibilitychange",
        schedule,
      );
    };
  }, [slip, target, horizon]);

  return (
    <BuilderContext.Provider
      value={{
        target,
        horizon,
        slip,
        loading,
        recoveringCode,
        error,
        chooseTarget,
        chooseHorizon,
        build,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
}