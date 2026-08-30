import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowRight, Clock3, RotateCcw } from "lucide-react";
import { usePredictions } from "../hooks/usePredictions";
import { useFormatOdds } from "../hooks/useFormatOdds";
import { CategoryTabs } from "../components/predictions/CategoryTabs";
import { PredictionCard, type LiveScore } from "../components/predictions/PredictionCard";
import { EmptyState } from "../components/predictions/EmptyState";
import { AccumulatorSlip } from "../components/predictions/AccumulatorSlip";
import { StakeCalculator } from "../components/predictions/StakeCalculator";
import { LeagueFilter } from "../components/predictions/LeagueFilter";
import { AllSlips } from "../components/predictions/AllSlips";
import BookingCode from "../components/predictions/BookingCode";
import { PredictionCardSkeleton } from "../components/ui/Skeleton";
import { BrandLoader } from "../components/ui/BrandLoader";
import { CATEGORIES } from "../types";
import type { CategoryKey } from "../types";
import { SEO } from "../components/common/SEO";
import { api, type BookableNowResponse } from "../api/predictions";

const VALID_KEYS = new Set<string>(CATEGORIES.map(c => c.key));

export function PredictionsPage() {
  const [leagueFilter, setLeagueFilter] = React.useState<string | null>(null);
  const { category } = useParams<{ category?: string }>();
  const initialKey: CategoryKey = category && VALID_KEYS.has(category) ? (category as CategoryKey) : "2_odds";

  const { data, loading, error, refetch } = usePredictions();
  const [activeKey, setActiveKey] = useState<CategoryKey>(initialKey);
  const { formatOdds: fmtOdds, oddsSuffix } = useFormatOdds();

  // The morning card is frozen, so by the afternoon some legs have kicked off.
  // Rather than rewrite the card — which would change the slip under anyone who
  // already booked it — a separate still-bookable slip is offered, and only
  // once something has actually started.
  // "What is on today" is the question people actually arrive with, and the
  // tab bar answers it one slip at a time. This shows every tier at once.
  const [showAll, setShowAll] = useState(false);
  const [showBookable, setShowBookable] = useState(false);
  const [bookable, setBookable] = useState<BookableNowResponse | null>(null);
  const [bookableLoading, setBookableLoading] = useState(false);

  // Scores are fetched apart from the card and refreshed on a timer: the card
  // is frozen at 08:00, a score is not, and merging them would mean choosing
  // between a stale score and a card that rewrites itself.
  const [scores, setScores] = useState<Record<string, LiveScore>>({});
  React.useEffect(() => {
    let alive = true;
    const load = () => api.getLiveScores()
      .then(r => { if (alive) setScores(r.scores || {}); })
      .catch(() => { /* scores are an extra; the card stands without them */ });
    load();
    const id = setInterval(load, 90_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const published = data?.accumulators;
  const startedCount = React.useMemo(() => {
    if (!published) return 0;
    return CATEGORIES.reduce(
      (n, c) => n + (published[c.key]?.games?.filter(g => g.started).length ?? 0), 0);
  }, [published]);

  React.useEffect(() => {
    if (!showBookable || bookable || bookableLoading) return;
    setBookableLoading(true);
    api.getBookableNow()
      .then(setBookable)
      .catch(() => setBookable({ status: "error", available: false }))
      .finally(() => setBookableLoading(false));
  }, [showBookable, bookable, bookableLoading]);

  const viewingBookable = showBookable && bookable?.available === true;
  const bookableUnavailable = showBookable && bookable?.available === false;
  const accumulators = viewingBookable
    ? bookable.accumulators
    : published;
  const activeCat = accumulators?.[activeKey];
  const catMeta = CATEGORIES.find(c => c.key === activeKey)!;
  // Over 1.5 is a list of independent bets rather than one slip, so the
  // combined price, the joint probability and the slip tools do not apply.
  const isSingles = activeCat?.presentation === "singles";

  const oddsMap = accumulators
    ? (Object.fromEntries(CATEGORIES.map(c => [c.key, accumulators[c.key]?.total_odds])) as Partial<Record<CategoryKey, number>>)
    : {};

  // Singles tiers advertise how many picks they hold rather than a combined
  // price, since combining them is not what the tier is offering.
  const singlesMap = accumulators
    ? (Object.fromEntries(
        CATEGORIES
          .filter(c => accumulators[c.key]?.presentation === "singles")
          .map(c => [c.key, accumulators[c.key]?.games?.length ?? 0])
      ) as Partial<Record<CategoryKey, number>>)
    : {};

  return (
    <div className="page-stack" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <SEO title="Predictions" description="Today's best football predictions — 2 Odds, 5 Odds, 10 Odds, and Over 1.5 picks backed by real bookmaker odds." path="/predictions" />
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Today&apos;s Picks</div>
        <h1 style={{ fontSize: 32, fontWeight: 800 }}>All Predictions</h1>
        <p className="page-intro" style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)", marginTop: 6 }}>
          Every accumulator for {data?.date
            ? new Date(data.date + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })
            : "today"} — pick a tier that matches your risk appetite.
        </p>
      </div>

      {/* Only offered once something has actually kicked off — before that the
          published card is fully bookable and a second slip is just noise. */}
      {startedCount > 0 && (
        <div className="card" style={{
          padding: "16px 18px", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 16, flexWrap: "wrap",
          border: viewingBookable
            ? "1px solid color-mix(in srgb, var(--gold) 55%, var(--border))"
            : "1px solid var(--border)",
          borderLeft: "4px solid var(--gold)",
          background: viewingBookable
            ? "color-mix(in srgb, var(--gold) 7%, var(--surface))"
            : "var(--surface)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: "1 1 360px" }}>
            <span aria-hidden="true" style={{
              width: 38, height: 38, flex: "0 0 38px", borderRadius: "50%",
              display: "grid", placeItems: "center", color: "var(--gold)",
              background: "color-mix(in srgb, var(--gold) 13%, transparent)",
            }}>
              <Clock3 size={19} strokeWidth={2.2} />
            </span>
            <div style={{ fontFamily: "var(--font-body)" }}>
              <strong style={{ display: "block", fontSize: 14, color: "var(--text-1)", marginBottom: 3 }}>
                {bookableLoading
                  ? "Building an available-now slip"
                  : viewingBookable
                    ? "You’re viewing the available-now slip"
                    : bookableUnavailable
                      ? "No available-now slip could be built"
                      : `${startedCount} ${startedCount === 1 ? "pick has" : "picks have"} already started`}
              </strong>
              <span style={{ display: "block", fontSize: 13, lineHeight: 1.5, color: "var(--text-2)" }}>
                {bookableLoading
                  ? "Checking the remaining fixtures and their SportyBet availability."
                  : viewingBookable
                    ? "Only matches that have not started are included. This does not change today’s published record."
                    : bookableUnavailable
                      ? (bookable?.reason || "The remaining fixtures could not produce a valid SportyBet-ready slip. You can try the check again.")
                      : "Build a fresh slip using only matches that can still be booked. Today’s published card stays unchanged."}
              </span>
            </div>
          </div>
          <button
            type="button"
            disabled={bookableLoading}
            aria-pressed={viewingBookable}
            style={{
              minHeight: 42, padding: "10px 16px", borderRadius: 8,
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700,
              whiteSpace: "nowrap", cursor: bookableLoading ? "wait" : "pointer",
              border: viewingBookable ? "1px solid var(--border)" : "1px solid var(--gold)",
              background: viewingBookable ? "transparent" : "var(--gold)",
              color: viewingBookable ? "var(--text-1)" : "#16120a",
              opacity: bookableLoading ? 0.7 : 1,
            }}
            onClick={() => {
              if (viewingBookable) {
                setShowBookable(false);
                return;
              }
              if (bookableUnavailable) setBookable(null);
              setShowBookable(true);
            }}
          >
            {bookableLoading
              ? "Building…"
              : viewingBookable
                ? <><RotateCcw size={15} /> Back to published card</>
                : <>{bookableUnavailable ? "Try again" : "Build available slip"} <ArrowRight size={15} /></>}
          </button>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <CategoryTabs active={activeKey} onChange={setActiveKey} oddsMap={oddsMap} singlesMap={singlesMap} />
        <button
          className="btn-ghost"
          style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}
          onClick={() => setShowAll(v => !v)}
        >
          {showAll ? "Show one tier" : "See all slips"}
        </button>
      </div>

      {showAll && accumulators && (
        <AllSlips
          accumulators={accumulators}
          scores={scores}
          onOpen={(k) => { setActiveKey(k); setShowAll(false); }}
        />
      )}

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--red)" }}>
          {error}
        </div>
      )}

      {showAll ? null : loading ? (
        <BrandLoader message="Building today's accumulators...">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => <PredictionCardSkeleton key={i} />)}
          </div>
        </BrandLoader>
      ) : !activeCat || !activeCat.selected ? (
        <EmptyState type="no-selection" onRetry={refetch} />
      ) : !activeCat.games?.length ? (
        <EmptyState type="empty" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="slip-meta" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)" }}>
              {activeCat.games.length} {activeCat.games.length === 1 ? "pick" : "picks"}
              {isSingles ? " · bet separately" : ` · ${activeCat.risk_level} risk`}
            </span>
            {/* A singles tier has no combined price, because combining is not
                what is being suggested. Showing "9.4x total" next to ten
                independent bets invites exactly the accumulator we avoided. */}
            {!isSingles && (
              <div style={{ padding: "4px 12px", borderRadius: 6, background: catMeta.faint, fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: catMeta.color }}>
                {fmtOdds(activeCat.total_odds)}{oddsSuffix} total
              </div>
            )}
            {typeof activeCat.hit_probability === "number" && (
              <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)" }}>
                {isSingles
                  ? `each lands ~${Math.round(activeCat.hit_probability * 100)}% of the time`
                  : `lands ~${Math.round(activeCat.hit_probability * 100)}% of the time`}
              </span>
            )}
            </div>
            {!isSingles && (
              <AccumulatorSlip
                games={activeCat.games}
                category={catMeta}
                totalOdds={activeCat.total_odds}
                date={data?.date ?? new Date().toISOString().slice(0, 10)}
              />
            )}
          </div>
          {/* Outside `.slip-meta`, which scrolls horizontally on narrow
              screens. Nested inside it the panel measured 817px wide in a
              347px viewport and sat at x=519 — present, correct, and off the
              side of the phone, so it read as missing entirely.

              Shown for singles too. The predictions remain independent
              singles, but one SportyBet share code containing several of them
              is explicitly labelled as an accumulator ticket. */}
          <BookingCode
            booking={activeCat.booking}
            category={catMeta}
            tracking={{
              source: viewingBookable ? "bookable_now" : "daily_card",
              tier: activeKey,
              legCount: activeCat.booking?.booked_leg_count ?? activeCat.games.length,
              fingerprint: activeCat.booking?.booking_variant_fingerprint,
            }}
            onShowBookable={viewingBookable ? undefined : () => setShowBookable(true)}
          />
          {!isSingles && (
            <div className="tool-panel">
            <StakeCalculator
              totalOdds={activeCat.total_odds}
              hitProbability={activeCat.hit_probability}
              color={catMeta.color}
            />
            </div>
          )}

          <div className="filter-row">
          <LeagueFilter
            games={activeCat.games}
            active={leagueFilter}
            onChange={setLeagueFilter}
            color={catMeta.color}
          />
          </div>

          <div className="cards-grid picks-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {activeCat.games
              .filter(g => !leagueFilter || g.league === leagueFilter)
              .map((game, i) => (
                <PredictionCard key={game.fixture_id} game={game} color={catMeta.color} faint={catMeta.faint} index={i} score={scores[game.match_id]} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
