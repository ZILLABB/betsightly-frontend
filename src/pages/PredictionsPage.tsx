import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { usePredictions } from "../hooks/usePredictions";
import { useFormatOdds } from "../hooks/useFormatOdds";
import { CategoryTabs } from "../components/predictions/CategoryTabs";
import { PredictionCard } from "../components/predictions/PredictionCard";
import { EmptyState } from "../components/predictions/EmptyState";
import { AccumulatorSlip } from "../components/predictions/AccumulatorSlip";
import { StakeCalculator } from "../components/predictions/StakeCalculator";
import { LeagueFilter } from "../components/predictions/LeagueFilter";
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
  const [showBookable, setShowBookable] = useState(false);
  const [bookable, setBookable] = useState<BookableNowResponse | null>(null);
  const [bookableLoading, setBookableLoading] = useState(false);

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

  const accumulators = showBookable && bookable?.available
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
          padding: "12px 16px", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 12, flexWrap: "wrap",
          borderLeft: "3px solid var(--gold)",
        }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-2)" }}>
            {showBookable
              ? "Showing a slip built from matches that haven't started. This one isn't part of the published record."
              : `${startedCount} ${startedCount === 1 ? "pick has" : "picks have"} already kicked off — today's card was published at 08:00 and doesn't change.`}
          </span>
          <button
            className="btn-ghost"
            style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}
            onClick={() => setShowBookable(v => !v)}
          >
            {bookableLoading ? "Loading…" : showBookable ? "Back to today's card" : "Show what I can still bet"}
          </button>
        </div>
      )}

      <CategoryTabs active={activeKey} onChange={setActiveKey} oddsMap={oddsMap} singlesMap={singlesMap} />

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--red)" }}>
          {error}
        </div>
      )}

      {loading ? (
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
                <PredictionCard key={game.fixture_id} game={game} color={catMeta.color} faint={catMeta.faint} index={i} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
