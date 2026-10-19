import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RefreshCw, Sliders } from "lucide-react";
import { usePredictions } from "../hooks/usePredictions";
import { useFormatOdds } from "../hooks/useFormatOdds";
import { useActionableCard } from "../hooks/useActionableCard";
import { WelcomeBanner } from "../components/common/WelcomeBanner";
import { JoinTelegram } from "../components/common/JoinTelegram";
import { AccuracyBadge } from "../components/common/AccuracyBadge";
import { AvailableNowOverview } from "../components/predictions/AvailableNowOverview";
import { ManualRemainingOverview } from "../components/predictions/ManualRemainingOverview";
import { useManualRemaining } from "../hooks/useManualRemaining";
import { preferredBookableTier } from "../utils/bookableTiers";
import { CategoryTabs } from "../components/predictions/CategoryTabs";
import { PredictionCard } from "../components/predictions/PredictionCard";
import { EmptyState } from "../components/predictions/EmptyState";
import BookingCode from "../components/predictions/BookingCode";
import { PredictionCardSkeleton } from "../components/ui/Skeleton";
import { BrandLoader } from "../components/ui/BrandLoader";
import { CATEGORIES } from "../types";
import { SEO } from "../components/common/SEO";
import type { CategoryKey } from "../types";
import { api, type HomeCampaign } from "../api/predictions";
import { publishedCardCounts } from "../utils/publishedCardCounts";
import { isEarlierPublication } from "../utils/publicationFreshness";
import { competitionSpotlight, type CompetitionSpotlight } from "../utils/competitionSpotlight";

// ── Loading State — branded logo loader + skeleton grid ──
function LoadingState() {
  return (
    <BrandLoader message="Fetching today's predictions...">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ animationDelay: `${i * 80}ms` }}>
            <PredictionCardSkeleton />
          </div>
        ))}
      </div>
    </BrandLoader>
  );
}

export function HomePage() {
  const { data, loading, error, refetch } = usePredictions();
  const [activeKey, setActiveKey] = useState<CategoryKey>("2_odds");
  const [spinning, setSpinning] = useState(false);
  const [spotlight, setSpotlight] = useState<CompetitionSpotlight | null>(null);
  const [campaign, setCampaign] = useState<HomeCampaign | null>(null);
  useEffect(() => {
    let alive = true;
    const refreshSpotlight = () => {
      api.getHomeCampaign().then(response => {
        if (alive) setCampaign(response.status === "success" ? response.campaign : null);
      }).catch(() => { if (alive) setCampaign(null); });
      api.getFixtureCompetitionSchedule()
        .then(board => {
          if (alive) setSpotlight(
            board.status === "success" ? competitionSpotlight(board.leagues) : null
          );
        })
        .catch(() => {
          // A missing prepared weekly board is not evidence of an upcoming event.
          if (alive) setSpotlight(null);
        });
    };
    refreshSpotlight();
    const timer = window.setInterval(refreshSpotlight, 30 * 60 * 1000);
    return () => { alive = false; window.clearInterval(timer); };
  }, []);

  const { formatOdds: fmtOdds, oddsSuffix } = useFormatOdds();

  const previousEdition = isEarlierPublication(data?.date);
  const published = data?.accumulators;
  const actionable = useActionableCard(published, data?.date);
  const manualRemaining = useManualRemaining(actionable.requestedAvailable, data?.date);
  const accumulators = actionable.accumulators;
  // Fresh live cards can carry only Banker or a different subset than the
  // locked morning publication. Do not strand the visitor on an empty old tab.
  useEffect(() => {
    if (!actionable.viewingBookable || !accumulators) return;
    setActiveKey(current => preferredBookableTier(accumulators, current));
  }, [actionable.viewingBookable, accumulators]);
  const activeCat = accumulators?.[activeKey];
  const catMeta = CATEGORIES.find(c => c.key === activeKey)!;
  const isSingles = activeCat?.presentation === "singles";
  const activeOdds = activeCat?.total_odds;
  const hasActiveBookableOdds = Boolean(
    !isSingles && activeCat?.selected && activeCat.games?.length &&
    typeof activeOdds === "number" && Number.isFinite(activeOdds) && activeOdds > 1
  );


  const oddsMap = accumulators
    ? Object.fromEntries(
        CATEGORIES.map(c => [c.key, accumulators[c.key]?.total_odds])
      ) as Partial<Record<CategoryKey, number>>
    : {};

  const singlesMap = accumulators
    ? Object.fromEntries(
        CATEGORIES
          .filter(c => accumulators[c.key]?.presentation === "singles")
          .map(c => [c.key, accumulators[c.key]?.games?.length ?? 0])
      ) as Partial<Record<CategoryKey, number>>
    : {};

  const { selections: totalGames, uniqueFixtures } = publishedCardCounts(accumulators);
  // Feature actual published selections. Prefer a still-actionable, verified
  // SportyBet code. Never invent odds or a fixture when the board is thin.
  const isVerifiedBooking = (tier: typeof activeCat) => Boolean(
    tier?.booking?.status === "active" &&
    tier.booking.actionable !== false &&
    (!tier.booking.lifecycle_status || tier.booking.lifecycle_status === "active") &&
    tier.booking.share_code
  );
  // Matchday editorial priority: modest accumulator first, then Banker and
  // independently published goal singles; never promote 10x just for drama.
  const featureOrder: CategoryKey[] = [
    "2_odds", "banker", "over_1_5", "5_odds", "rollover", "10_odds",
  ];
  const featuredKey: CategoryKey | undefined =
    featureOrder.find(key => {
      const tier = accumulators?.[key];
      return tier?.selected && tier.games?.length > 0 && isVerifiedBooking(tier);
    }) ?? featureOrder.find(key => {
      const tier = accumulators?.[key];
      return tier?.selected && tier.games?.length > 0;
    });
  const featuredTier = featuredKey ? accumulators?.[featuredKey] : undefined;
  const featuredMeta = CATEGORIES.find(c => c.key === featuredKey);
  const featuredBookable = isVerifiedBooking(featuredTier);
  const bookedPrice = featuredTier?.booking?.actual_sportybet_odds;
  const featuredOdds = featuredBookable && featuredTier?.presentation !== "singles" &&
    typeof bookedPrice === "number" && Number.isFinite(bookedPrice) &&
    bookedPrice > 1 ? bookedPrice : null;


  // Manual editorial picks deliberately have no model confidence. Do not
  // include unscored, missing, invalid or non-finite values in the average.
  const scoredGames = (activeCat?.games ?? []).filter(g =>
    !g.editorial_manual &&
    g.model_probability_available !== false &&
    typeof g.confidence === "number" &&
    Number.isFinite(g.confidence) &&
    g.confidence >= 0 &&
    g.confidence <= 1
  );
  const avgConf = scoredGames.length
    ? Math.round(scoredGames.reduce((sum, g) => sum + g.confidence, 0) / scoredGames.length * 100)
    : null;
  const confidenceLabel = avgConf === null ? "Not scored" : `${avgConf}%`;
  const confidenceExplanation = avgConf === null
    ? (activeCat?.editorial_manual
      ? "Admin-curated ticket · no model confidence score"
      : "No model confidence score available")
    : "Average model confidence for scored picks in this tier";

  const handleRefresh = useCallback(() => {
    setSpinning(true);
    refetch();
    setTimeout(() => setSpinning(false), 700);
  }, [refetch]);

  return (
    <div className="page-stack v3-page v3-home" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SEO path="/" description={campaign
        ? `${campaign.headline}. ${campaign.description} Football predictions and transparently tracked results.`
        : undefined} />
      <WelcomeBanner />

      {/* Editorial matchday cover: actionable information, not a promotional billboard. */}
      <section className="editorial-cover" aria-labelledby="home-title">
        <div className="editorial-cover__main">
          <p className="editorial-overline">
            {previousEdition ? "LATEST PUBLISHED REPORT" : "MATCHDAY REPORT"} <span aria-hidden="true">/</span>
            {data?.date
              ? new Date(data.date + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })
              : "Today's edition"}
          </p>
          <h1 id="home-title">Football intelligence.<span>Clearer decisions.</span></h1>
          <p className="editorial-cover__intro">
            A verified publication desk for daily football selections, bookmaker prices and
            an accountable results record. Every selection stays visible after kickoff.
          </p>
          {previousEdition && (
            <p className="editorial-edition-notice" role="status">
              Showing the latest published edition, not a new card for today.
            </p>
          )}
          <div className="editorial-cover__actions">
            <a href="#todays-picks" className="editorial-button editorial-button--primary">
              Explore published tickets <ArrowRight size={16} aria-hidden="true"/>
            </a>
            <Link to="/build-slip" className="editorial-button editorial-button--quiet">
              <Sliders size={16} aria-hidden="true"/> Build a slip
            </Link>
          </div>
        </div>
        <aside className="editorial-cover__edition" aria-label="Today's verified publication summary">
          <div className="editorial-cover__edition-label">THE DAILY BOARD</div>
          <strong>{loading ? "—" : uniqueFixtures}</strong>
          <span>Unique published fixtures</span>
          <div className="editorial-cover__edition-divider"/>
          <div><b>{loading ? "—" : totalGames}</b><span>Selections across tiers</span></div>
          <div><b>{loading ? "—" : confidenceLabel}</b><span>{activeCat?.editorial_manual ? "Manual picks not model-scored" : "Selected tier model estimate"}</span></div>
          <small>Predictions are probabilities, never guarantees.</small>
        </aside>
      </section>

      {(campaign || spotlight) && (
        <aside className="editorial-spotlight" aria-label="Competition focus">
          <span>{campaign?.eyebrow || spotlight?.label || "COMPETITION WATCH"}</span>
          <div><strong>{campaign?.headline || spotlight?.headline}</strong>
            <p>{campaign?.description || spotlight?.description}</p></div>
          {campaign && <Link to={campaign.cta_path}>{campaign.cta_text || "View predictions"} <ArrowRight size={14} aria-hidden="true"/></Link>}
        </aside>
      )}

      <section className="editorial-feature" aria-label="Featured published ticket">
        <div className="editorial-section-title">
          <div><span className="editorial-overline">{previousEdition ? "LATEST PUBLISHED SELECTIONS" : "TODAY'S SELECTION DESK"}</span>
            <h2>Featured publication</h2></div>
          <Link to="/results" className="editorial-text-link">See verified results <ArrowRight size={15} aria-hidden="true"/></Link>
        </div>
        <div className="editorial-feature__body">
          <div className="editorial-feature__primary">
            <span className="editorial-feature__status">{featuredBookable ? "Verified booking code" : featuredTier ? "Review booking availability" : "No verified ticket"}</span>
            <h3>{featuredTier ? `${featuredMeta?.label ?? "Published"} ${featuredTier.presentation === "singles" ? "singles" : "slip"}` : "No qualifying ticket yet"}</h3>
            <p>{featuredTier?.games?.length
              ? `${featuredTier.games[0].home_team} vs ${featuredTier.games[0].away_team}${featuredTier.games.length > 1 ? ` and ${featuredTier.games.length - 1} more` : ""}`
              : "Selections only appear after our usual publication checks."}</p>
          </div>
          <div className="editorial-feature__action">
            <span>Actual bookmaker odds</span>
            <strong>{featuredOdds !== null ? `${fmtOdds(featuredOdds)}${oddsSuffix}` : "—"}</strong>
            {featuredTier && featuredKey
              ? <a href="#todays-picks" className="editorial-button editorial-button--primary" onClick={() => setActiveKey(featuredKey)}>
                  Open ticket <ArrowRight size={16} aria-hidden="true"/>
                </a>
              : <Link to="/build-slip" className="editorial-button editorial-button--quiet">
                  Browse available fixtures <ArrowRight size={16} aria-hidden="true"/>
                </Link>}
          </div>
        </div>
      </section>

      {(actionable.needsReplacement || actionable.requestedAvailable) && (
        <div className="card available-now" role="status" aria-live="polite" style={{
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          borderLeft: "4px solid var(--gold)",
        }}>
          <div style={{ minWidth: 0 }}>
            <strong style={{
              display: "block",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "var(--text-1)",
            }}>
              {actionable.bookableLoading
                ? (actionable.portfolioIntegrityInvalid
                  ? "Checking a freshly diversified card"
                  : "Checking what is still bookable")
                : actionable.viewingBookable
                  ? (actionable.portfolioIntegrityInvalid
                    ? "Showing a freshly diversified card"
                    : "Showing matches you can still bet")
                  : actionable.bookableError
                    ? "Couldn’t verify current SportyBet availability"
                    : actionable.unavailable
                      ? "No verified bookable slip remains right now"
                      : actionable.viewingPublishedRecord
                      ? "Viewing the original published card"
                      : "Refreshing the stale published card"}
            </strong>
            <span style={{
              display: "block",
              marginTop: 3,
              fontFamily: "var(--font-body)",
              fontSize: 12,
              lineHeight: 1.45,
              color: "var(--text-3)",
            }}>
              {actionable.bookableLoading
                ? (actionable.bookableNotice ||
                  (actionable.portfolioIntegrityInvalid
                    ? "Showing the original published card while we verify a diversified current card."
                    : "Showing the original published card while we verify which remaining matches are still exactly bookable."))
                : actionable.bookableError
                  ? (actionable.bookable?.reason ||
                    "Current SportyBet availability could not be verified.")
                  : actionable.viewingPublishedRecord
                  ? "The original card is preserved for the public record and may include matches already under way."
                  : actionable.viewingBookable && actionable.portfolioIntegrityInvalid
                    ? "Today’s original published card is preserved for transparent results tracking. This version uses currently available fixtures and avoids repeating the same match across official slips."
                    : actionable.bookable?.reason ||
                      "Late visitors automatically see the current exact-bookable card. The original publication remains unchanged for Results."}
            </span>
          </div>

          <button
            type="button"
            disabled={actionable.bookableLoading}
            onClick={() => actionable.viewingBookable
              ? actionable.showPublished()
              : actionable.showAvailable()}
            style={{
              minHeight: 38,
              padding: "7px 12px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--text-1)",
              fontFamily: "var(--font-body)",
              fontSize: 12,
              fontWeight: 700,
              cursor: actionable.bookableLoading ? "wait" : "pointer",
            }}
          >
            {actionable.bookableLoading
              ? "Checking…"
              : actionable.viewingBookable
                ? "View original card"
                : actionable.bookableError || actionable.unavailable
                  ? "Try again"
                  : "Show available now"}
          </button>
        </div>
      )}

      {/* Tabs + verified SportyBet booking code, reachable from the hero. */}
      <section id="todays-picks" className="editorial-ticket-board home-picks-anchor" aria-label="Published selections">
        <div className="editorial-section-title"><div><span className="editorial-overline">PUBLICATION DESK</span><h2>{previousEdition ? "Latest published tickets" : "Today's tickets"}</h2></div><span className="editorial-board-caption">Choose a category to inspect selections and its booking code</span></div>
        <ManualRemainingOverview data={manualRemaining.data} loading={manualRemaining.loading} error={manualRemaining.error} />
        {actionable.viewingBookable && accumulators && (
          <AvailableNowOverview accumulators={accumulators} onSelect={key => {
            setActiveKey(key);
          }} />
        )}
        <CategoryTabs active={activeKey} onChange={setActiveKey} oddsMap={oddsMap} singlesMap={singlesMap}
          availabilityMap={accumulators ? Object.fromEntries(CATEGORIES.map(item => [item.key,
            Boolean(accumulators[item.key]?.selected && accumulators[item.key]?.games?.length)])) : {}} />

        {/* Category header */}
        {!loading && activeCat && (
          <div className="animate-fade-in" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: catMeta.color, letterSpacing: "-0.02em" }}>
                {catMeta.label} {isSingles ? "Singles" : "Accumulator"}
              </h2>
              {activeCat.reason && (
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>
                  {activeCat.reason}
                </p>
              )}
              {isSingles && activeCat.games?.length > 0 && (
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>
                  {activeCat.games.length} independent picks · bet separately
                  {avgConf !== null ? ` · average model confidence ${avgConf}%` : ""}
                </p>
              )}
              {!isSingles && typeof activeCat.hit_probability === "number" && activeCat.games?.length > 0 && (
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>
                  All {activeCat.games.length} legs land about{" "}
                  <strong style={{ color: "var(--text-2)" }}>
                    {Math.round(activeCat.hit_probability * 100)}%
                  </strong>{" "}
                  of the time — bigger payouts win less often.
                </p>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {hasActiveBookableOdds && <div style={{
                padding: "5px 14px", borderRadius: 8,
                background: catMeta.faint, border: `1px solid color-mix(in srgb, ${catMeta.color} 22%, transparent)`,
                fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700,
                color: catMeta.color, letterSpacing: "-0.02em",
              }}>
                {fmtOdds(activeOdds!)}{oddsSuffix}
              </div>}
              <button
                onClick={handleRefresh}
                title="Refresh predictions"
                className="refresh-btn"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 34, height: 34, borderRadius: 8,
                  border: "1px solid var(--border)", background: "transparent",
                  cursor: "pointer", color: "var(--text-3)",
                  transition: "all 180ms ease",
                }}
              >
                <RefreshCw size={13} style={spinning ? { animation: "spin 0.5s ease" } : undefined} />
              </button>
            </div>
          </div>
        )}

        {/* The same code the Predictions page carries. The home page is where
            most visitors land, and sending them to another screen to copy six
            characters is the step where they stop. */}
        {activeCat && <BookingCode booking={activeCat.booking} category={catMeta} />}

        {/* Error banner */}
        {error && (
          <div style={{
            padding: "10px 14px", borderRadius: "var(--radius-md)",
            background: "var(--red-faint)", border: "1px solid rgba(248,113,113,0.15)",
            fontFamily: "var(--font-body)", fontSize: 12, color: "var(--red)",
          }}>
            {error}
          </div>
        )}

        {/* Cards grid */}
        {loading ? (
          <LoadingState />
        ) : !activeCat || !activeCat.selected ? (
          <EmptyState type="no-selection" />
        ) : !activeCat.games?.length ? (
          <EmptyState type="empty" />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {activeCat.games.map((game, i) => (
              <PredictionCard
                key={game.fixture_id}
                game={game}
                color={catMeta.color}
                faint={catMeta.faint}
                index={i}
              />
            ))}
          </div>
        )}
      </section>
      <section className="editorial-community" aria-label="Published performance and community">
        <div className="editorial-section-title"><div><span className="editorial-overline">THE PUBLIC RECORD</span><h2>Independent verification</h2></div></div>
        <div className="home-support-grid">
          <AccuracyBadge />
          <JoinTelegram variant="card" />
        </div>
      </section>
    </div>
  );
}
