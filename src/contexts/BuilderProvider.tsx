import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { api } from "../api/predictions";
import {
  reviseBuilderSlip,
  type BuilderAction,
  type EditableBuiltSlip,
} from "../api/builderRevisions";
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
  slip: EditableBuiltSlip | null;
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
    useState<EditableBuiltSlip | null>(initial.slip);

  const [loading, setLoading] = useState(false);
  const [recoveringCode, setRecoveringCode] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [editingSelectionId, setEditingSelectionId] =
    useState<string | null>(null);
  const [editingMessage, setEditingMessage] =
    useState<string | null>(null);
  const [editingAction, setEditingAction] =
    useState<BuilderAction | null>(null);
  const [revisionFeedback, setRevisionFeedback] = useState<{
    action: BuilderAction; status: "success" | "failure";
    oldGame?: GamePrediction; newGame?: GamePrediction; message: string;
  } | null>(null);

  const inFlight = useRef(false);
  const recoveryAttempts = useRef(0);
  const revisionSequence = useRef(0);
  const revisionController = useRef<AbortController | null>(null);
  const feedbackTimer = useRef<number | null>(null);

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

  const chooseTarget = useCallback((value: number, preserveSlip = false) => {
    setTarget(value);
    if (!preserveSlip) setSlip(null);
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
      preserveSlip = false,
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
      if (!preserveSlip) setSlip(null);

      try {
        const result = await api.buildSlip(
          requestedTarget,
          horizon,
          regenerate,
        );

        setSlip(result as EditableBuiltSlip);
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
            requested_target: requestedTarget,
            achieved_target: result.odds,
            optimization_status: result.optimization_status,
            result_status: result.result_status,
          });
        } else {
          trackProductEvent("builder_unavailable", {
            product_area: "builder",
            target_odds: requestedTarget,
            horizon,
            failure_category: result.status,
            requested_target: requestedTarget,
            achieved_target: result.best_reachable,
            optimization_status: result.optimization_status,
            result_status: result.result_status,
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
      (slip.revision ?? 1) > 1 ||
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

  useEffect(() => () => {
    revisionController.current?.abort();
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
  }, []);

  const reviseLeg = useCallback(async (
    action: BuilderAction,
    game?: GamePrediction,
    targetOverride?: number,
  ) => {
    const current = slip;
    if (!current?.builder_run_id || !current.edit_token || !current.revision) {
      setError("Build a fresh slip before editing its selections.");
      return;
    }

    const selectionId = game?.selection_id;
    const fixtureId = game?.match_id || String(game?.fixture_id ?? "");
    if (action !== "accept_best_reachable" && !selectionId) {
      setError("This selection has no current revision identity. Build again.");
      return;
    }

    revisionController.current?.abort();
    const controller = new AbortController();
    revisionController.current = controller;
    const sequence = ++revisionSequence.current;
    const eventByAction = {
      replace_selection: "builder_leg_replace_clicked",
      safer_same_fixture: "builder_safer_market_requested",
      exclude_fixture: "builder_fixture_excluded",
      remove_selection: "builder_leg_removed",
      lock_selection: "builder_leg_locked",
      unlock_selection: "builder_leg_unlocked",
      accept_best_reachable: "builder_best_reachable_accepted",
    } as const;
    trackProductEvent(eventByAction[action], {
      product_area: "builder",
      target_odds: targetOverride ?? current.target,
      horizon,
    });

    setError(null);
    setRevisionFeedback(null);
    setEditingSelectionId(selectionId ?? "best-reachable");
    setEditingAction(action);
    setEditingMessage(
      action === "replace_selection" ? "Finding a different game…"
        : action === "safer_same_fixture" ? "Checking safer markets…"
          : action === "remove_selection" ? "Rebalancing slip…"
            : action === "exclude_fixture" ? "Excluding this game…"
              : action.includes("lock") ? null
                : "Updating this slip…",
    );
    // A code for the prior fingerprint must never remain actionable while a
    // structural edit is in flight or after an ambiguous network failure.
    setSlip({
      ...current,
      booking: current.booking ? {
        ...current.booking,
        status: "stale",
        lifecycle_status: "stale",
        actionable: false,
        share_code: null,
        share_url: undefined,
        reason: "This code belongs to the previous slip revision.",
      } : undefined,
    });

    try {
      const next = await reviseBuilderSlip({
        runId: current.builder_run_id,
        editToken: current.edit_token,
        revision: current.revision,
        requestId: globalThis.crypto?.randomUUID?.() ??
          `revision-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        action,
        selectionId,
        fixtureId,
        target: targetOverride,
      }, controller.signal);
      if (sequence !== revisionSequence.current) return;
      if (action === "replace_selection" && !next.action_error && game &&
          next.change_summary?.action === "replace_selection") {
        const oldGames = current.games ?? [];
        const newGames = next.games ?? [];
        const oldFixture = String(game.match_id || game.fixture_id || "");
        const oldUnaffected = oldGames
          .filter((item) => item.selection_id !== selectionId)
          .map((item) => item.selection_id)
          .filter(Boolean);
        const validSwap = newGames.length === oldGames.length &&
          !newGames.some((item) =>
            String(item.match_id || item.fixture_id || "") === oldFixture) &&
          oldUnaffected.every((id) =>
            newGames.some((item) => item.selection_id === id)) &&
          (current.locked_selection_ids ?? []).every((id) =>
            newGames.some((item) => item.selection_id === id));
        if (!validSwap) {
          setRevisionFeedback({ action, status: "failure", oldGame: game,
            message: "No suitable replacement found. Your original game has been kept." });
          return;
        }
      }
      setSlip(next);
      if (next.action_error) {
        setRevisionFeedback({ action, status: "failure", oldGame: game,
          message: action === "replace_selection"
            ? "No suitable replacement found. Your original game has been kept."
            : next.action_error });
      } else {
        const added = next.change_summary?.added?.[0];
        const message = action === "replace_selection" ? "Game replaced"
          : action === "safer_same_fixture" ? "Safer market applied"
            : action === "exclude_fixture" ? "Game excluded from this Builder run"
              : action === "lock_selection" ? "Leg locked"
                : action === "unlock_selection" ? "Leg unlocked"
                  : "Slip updated";
        setRevisionFeedback({ action, status: "success", oldGame: game,
          newGame: added, message });
        if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
        feedbackTimer.current = window.setTimeout(
          () => setRevisionFeedback(null), 3800,
        );
      }
    } catch (caught) {
      if (sequence !== revisionSequence.current) return;
      const failure = caught as Error & { status?: number };
      if (failure.name === "AbortError") return;
      setError(
        failure.status === 409
          ? "This slip changed in another request. Its older response was ignored; build or reload the latest revision."
          : "That edit could not be verified. The previous code stays hidden until the slip is rebuilt.",
      );
    } finally {
      if (sequence === revisionSequence.current) {
        setEditingSelectionId(null);
        setEditingMessage(null);
        setEditingAction(null);
      }
    }
  }, [horizon, slip]);

  return (
    <BuilderContext.Provider
      value={{
        target,
        horizon,
        slip,
        loading,
        recoveringCode,
        error,
        editingSelectionId,
        editingMessage,
        editingAction,
        revisionFeedback,
        chooseTarget,
        chooseHorizon,
        build,
        reviseLeg,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
}
