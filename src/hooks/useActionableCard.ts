import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, type BookableNowResponse } from "../api/predictions";
import type {
  AccumulatorResponse,
  CategoryData,
  GamePrediction,
} from "../types";

const BOOKING_BUFFER_MS = 20 * 60 * 1000;
const REFRESH_MS = 2 * 60 * 1000;
const BOARD_REFRESH_RETRY_MS = 5_000;
const BOARD_REFRESH_RETRY_LIMIT = 12;

const REPLACEABLE_KEYS = [
  "banker",
  "2_odds",
  "5_odds",
  "10_odds",
  "over_1_5",
] as const;

type RuntimeGame = GamePrediction & {
  started?: boolean;
  bookable?: boolean;
};

type AvailableNowFailure = Error & {
  status?: number;
  reason?: string;
  retryable?: boolean;
  detail?: unknown;
};

const availableNowFailure = (error: unknown) => {
  const failure = error as AvailableNowFailure;

  const detail =
    failure?.detail &&
    typeof failure.detail === "object"
      ? failure.detail as Record<string, unknown>
      : null;

  const reason =
    failure?.reason ||
    (typeof detail?.reason === "string" ? detail.reason : "") ||
    (error instanceof Error ? error.message : "");

  const retryable =
    failure?.retryable === true ||
    detail?.retryable === true;

  return {
    status: failure?.status,
    reason,
    retryable,
  };
};

const bookingIsActionable = (category?: CategoryData) => {
  const booking = category?.booking;
  if (!booking) return true;

  return booking.status === "active"
    && booking.actionable !== false
    && (!booking.lifecycle_status || booking.lifecycle_status === "active")
    && !!booking.share_code;
};

const gameIsNoLongerActionable = (
  game: RuntimeGame,
  nowMs: number,
) => {
  if (game.started === true) return true;

  const rawKickoff = game.kickoff || game.date;
  if (!rawKickoff) return false;

  const kickoff = new Date(rawKickoff).getTime();
  if (!Number.isFinite(kickoff)) return false;

  return kickoff <= nowMs + BOOKING_BUFFER_MS;
};

export const cardActionability = (
  published?: AccumulatorResponse["accumulators"],
  nowMs = Date.now(),
) => {
  if (!published) {
    return {
      needsReplacement: false,
      affectedSelections: 0,
      timingAffected: false,
      portfolioIntegrityInvalid: false,
    };
  }

  let affectedSelections = 0;
  const portfolioMetadataPresent = Boolean(published._portfolio);
  // Do not punish historical cards that predate portfolio diagnostics. An
  // explicit metadata record with absent/null/false final validation means the
  // frozen card predates (or failed) final integrity verification instead.
  const portfolioIntegrityInvalid =
    portfolioMetadataPresent &&
    published._portfolio?.portfolio_validation?.valid !== true;

  for (const key of REPLACEABLE_KEYS) {
    const category = published[key];
    if (!category?.selected || !category.games?.length) continue;

    const timingAffected = category.games.filter(game =>
      gameIsNoLongerActionable(game as RuntimeGame, nowMs),
    ).length;

    if (timingAffected > 0) {
      affectedSelections += timingAffected;
      continue;
    }

    if (!bookingIsActionable(category)) {
      affectedSelections += category.games.length;
    }
  }

  return {
    needsReplacement: affectedSelections > 0 || portfolioIntegrityInvalid,
    affectedSelections,
    timingAffected: affectedSelections > 0,
    portfolioIntegrityInvalid,
  };
};

const availableNowIsPortfolioSafe = (result: BookableNowResponse) =>
  !result._portfolio || result._portfolio.portfolio_validation?.valid === true;

export function useActionableCard(
  published?: AccumulatorResponse["accumulators"],
  cardDate?: string,
) {
  const [mode, setMode] = useState<"auto" | "published">("auto");
  const [bookable, setBookable] = useState<BookableNowResponse | null>(null);
  const [bookableLoading, setBookableLoading] = useState(false);
  const [bookableNotice, setBookableNotice] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const requestIdRef = useRef(0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    // Invalidate a response belonging to the previous published card.
    requestIdRef.current += 1;
    setMode("auto");
    setBookable(null);
    setBookableLoading(false);
    setBookableNotice(null);
    setFetchedAt(0);
  }, [cardDate]);

  const actionability = useMemo(
    () => cardActionability(published, now),
    [published, now],
  );

  useEffect(() => {
    if (!actionability.needsReplacement || mode === "published") return;

    const freshEnough =
      bookable !== null &&
      fetchedAt > 0 &&
      now - fetchedAt < REFRESH_MS;

    if (freshEnough) return;

    const requestId = ++requestIdRef.current;
    let retryTimer: number | null = null;

    setBookableLoading(true);
    setBookableNotice(null);

    const load = async (attempt: number) => {
      try {
        const result = await api.getBookableNow();

        if (requestId !== requestIdRef.current) return;

        // A modern live response that carries integrity metadata must have
        // passed it. Keep the immutable published card on screen otherwise.
        if (!result.available || !result.accumulators || !availableNowIsPortfolioSafe(result)) {
          setBookable({
            ...result,
            status: "error",
            available: false,
            reason: !availableNowIsPortfolioSafe(result)
              ? "The live replacement card did not pass portfolio validation."
              : (result.reason || "No verified bookable slip remains right now."),
          });
        } else {
          setBookable(result);
        }
        setFetchedAt(Date.now());
        setBookableNotice(null);
        setBookableLoading(false);
      } catch (error: unknown) {
        if (requestId !== requestIdRef.current) return;

        const failure = availableNowFailure(error);

        if (
          failure.status === 503 &&
          failure.reason === "board_refreshing" &&
          failure.retryable &&
          attempt < BOARD_REFRESH_RETRY_LIMIT
        ) {
          setBookableNotice(
            "The current fixture board is refreshing. Retrying automatically…",
          );

          retryTimer = window.setTimeout(() => {
            if (requestId === requestIdRef.current) {
              void load(attempt + 1);
            }
          }, BOARD_REFRESH_RETRY_MS);

          return;
        }

        const reason =
          failure.reason === "board_refreshing"
            ? "The current fixture board is still refreshing. Please try again."
            : failure.reason
              ? `Could not verify current SportyBet availability: ${failure.reason.replaceAll("_", " ")}.`
              : "Could not verify current SportyBet availability. Please try again.";

        setBookable({
          status: "error",
          available: false,
          reason,
        });

        setFetchedAt(Date.now());
        setBookableNotice(null);
        setBookableLoading(false);
      }
    };

    void load(0);

    return () => {
      if (retryTimer != null) {
        window.clearTimeout(retryTimer);
      }

      if (requestId === requestIdRef.current) {
        requestIdRef.current += 1;
      }
    };
  }, [
    actionability.needsReplacement,
    mode,
    bookable,
    fetchedAt,
    now,
  ]);

  const showAvailable = useCallback(() => {
    setMode("auto");
    setBookable(null);
    setBookableNotice(null);
    setFetchedAt(0);
    setNow(Date.now());
  }, []);

  const showPublished = useCallback(() => {
    setMode("published");
  }, []);

  const viewingBookable =
    mode === "auto" &&
    actionability.needsReplacement &&
    bookable?.available === true &&
    !!bookable.accumulators &&
    availableNowIsPortfolioSafe(bookable);

  const viewingPublishedRecord =
    mode === "published" &&
    actionability.needsReplacement;

  const bookableError =
    mode === "auto" &&
    actionability.needsReplacement &&
    !bookableLoading &&
    bookable?.status === "error";

  const unavailable =
    mode === "auto" &&
    actionability.needsReplacement &&
    !bookableLoading &&
    !bookableError &&
    bookable?.available === false;

  const mergedAvailable =
    viewingBookable && bookable?.accumulators
      ? ({
          ...published,
          ...bookable.accumulators,
          // Available-now intentionally does not create a new rollover chain.
          rollover: published?.rollover,
        } as AccumulatorResponse["accumulators"])
      : undefined;

  // Never replace real published data with an empty loading state.
  // While Available Now is being verified, keep the frozen publication
  // visible as a clearly labelled record. Swap only after the replacement
  // has been successfully verified.
  const accumulators =
    viewingBookable && mergedAvailable
      ? mergedAvailable
      : published;

  return {
    accumulators,
    bookable,
    bookableLoading,
    bookableNotice,
    bookableError,
    viewingBookable,
    viewingPublishedRecord,
    unavailable,
    needsReplacement: actionability.needsReplacement,
    affectedSelections: actionability.affectedSelections,
    timingAffected: actionability.timingAffected,
    portfolioIntegrityInvalid: actionability.portfolioIntegrityInvalid,
    showAvailable,
    showPublished,
  };
}
