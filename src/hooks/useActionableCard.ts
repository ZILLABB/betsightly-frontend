import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, type BookableNowResponse } from "../api/predictions";
import type {
  AccumulatorResponse,
  CategoryData,
  GamePrediction,
} from "../types";

const BOOKING_BUFFER_MS = 20 * 60 * 1000;
const REFRESH_MS = 2 * 60 * 1000;

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
    };
  }

  let affectedSelections = 0;

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
    needsReplacement: affectedSelections > 0,
    affectedSelections,
  };
};

export function useActionableCard(
  published?: AccumulatorResponse["accumulators"],
  cardDate?: string,
) {
  const [mode, setMode] = useState<"auto" | "published">("auto");
  const [bookable, setBookable] = useState<BookableNowResponse | null>(null);
  const [bookableLoading, setBookableLoading] = useState(false);
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
    setFetchedAt(0);
  }, [cardDate]);

  const actionability = useMemo(
    () => cardActionability(published, now),
    [published, now],
  );

  useEffect(() => {
    if (!actionability.needsReplacement || mode === "published") return;
    if (bookableLoading) return;

    const freshEnough =
      bookable !== null &&
      fetchedAt > 0 &&
      now - fetchedAt < REFRESH_MS;

    if (freshEnough) return;

    const requestId = ++requestIdRef.current;
    setBookableLoading(true);

    api.getBookableNow()
      .then(result => {
        if (requestId !== requestIdRef.current) return;
        setBookable(result);
        setFetchedAt(Date.now());
      })
      .catch((error: unknown) => {
        if (requestId !== requestIdRef.current) return;
        setBookable({
          status: "error",
          available: false,
          reason: error instanceof Error
            ? `Available-now rebuild failed: ${error.message}`
            : "Available-now rebuild failed. Please try again.",
        });
        setFetchedAt(Date.now());
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setBookableLoading(false);
        }
      });
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
    setFetchedAt(0);
    setNow(Date.now());
  }, []);

  const showPublished = useCallback(() => {
    setMode("published");
  }, []);

  const viewingBookable =
    mode === "auto" &&
    actionability.needsReplacement &&
    bookable?.available === true;

  const viewingPublishedRecord =
    mode === "published" &&
    actionability.needsReplacement;

  const unavailable =
    mode === "auto" &&
    actionability.needsReplacement &&
    !bookableLoading &&
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
    viewingBookable,
    viewingPublishedRecord,
    unavailable,
    needsReplacement: actionability.needsReplacement,
    affectedSelections: actionability.affectedSelections,
    showAvailable,
    showPublished,
  };
}
