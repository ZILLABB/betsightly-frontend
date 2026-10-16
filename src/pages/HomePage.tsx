import React, { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, CircleCheck, RefreshCw, Shield, Sliders, Target, TrendingUp } from "lucide-react";
import { usePredictions } from "../hooks/usePredictions";
import { useFormatOdds } from "../hooks/useFormatOdds";
import { useActionableCard } from "../hooks/useActionableCard";
import { WelcomeBanner } from "../components/common/WelcomeBanner";
import { JoinTelegram } from "../components/common/JoinTelegram";
import { AccuracyBadge } from "../components/common/AccuracyBadge";
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
import { competitionSpotlight, type CompetitionSpotlight } from "../utils/competitionSpotlight";

function StatBubble({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="card metric-card" style={{
      "--card-accent": color,
      padding: "16px 18px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      flex: 1,
      minWidth: 140,
    } as React.CSSProperties}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: `${color}10`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <p className="stat-num" style={{ fontSize: 22, lineHeight: 1.1 }}>{value}</p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{label}</p>
      </div>
    </div>
  );
}

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

  const published = data?.accumulators;
  const actionable = useActionableCard(published, data?.date);
  const accumulators = actionable.accumulators;
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
  const featuredKey: CategoryKey | undefined =
    CATEGORIES.find(c => {
      const tier = accumulators?.[c.key];
      return tier?.selected && tier.games?.length > 0 && isVerifiedBooking(tier);
    })?.key ?? CATEGORIES.find(c => {
      const tier = accumulators?.[c.key];
      return tier?.selected && tier.games?.length > 0;
    })?.key;
  const featuredTier = featuredKey ? accumulators?.[featuredKey] : null;
  const featuredMeta = CATEGORIES.find(c => c.key === featuredKey);
  const featuredBookable = isVerifiedBooking(featuredTier);
  const featuredOdds = featuredBookable && featuredTier?.presentation !== "singles" &&
    typeof featuredTier?.total_odds === "number" && Number.isFinite(featuredTier.total_odds) &&
    featuredTier.total_odds > 1 ? featuredTier.total_odds : null;


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

      {/* Product hero */}
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <div className="market-status">
            <span className="market-status-dot" />
            Published card
            <span aria-hidden="true">·</span>
            {data?.date
              ? new Date(data.date + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
              : new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
          </div>
          <h1 id="home-title">
            Today&apos;s<br />
            <span>Smart Picks.</span>
          </h1>
          <p>
            Curated football picks and accumulators backed by real bookmaker odds and statistical
            analysis, with every published result tracked transparently.
          </p>
          {(campaign || spotlight) && (
            <div className="home-competition-spotlight" role="status" aria-live="polite">
              <span className="home-competition-spotlight__label">{campaign?.eyebrow || spotlight?.label}</span>
              <strong>{campaign?.headline || spotlight?.headline}</strong>
              <span>{campaign?.description || spotlight?.description} Picks are published only when they meet our usual verification checks.</span>
              {campaign && <Link className="home-competition-spotlight__cta"
                to={campaign.cta_path}>{campaign.cta_text || "View predictions"} <ArrowRight size={13} aria-hidden="true" /></Link>}
            </div>
          )}
          <div className="home-hero-actions">
            <a href="#todays-picks" className="hero-action hero-action-primary">
              See today&apos;s picks &amp; codes <ArrowRight size={16} />
            </a>
            <Link to="/build-slip" className="hero-action hero-action-secondary">
              <Sliders size={16} /> Build a slip
            </Link>
          </div>
          <div className="trust-row" aria-label="Product principles">
            <span><CircleCheck size={14} /> Real odds</span>
            <span><CircleCheck size={14} /> {activeCat?.editorial_manual ? "Bookmaker-verified selections" : "Calibrated confidence"}</span>
            <span><CircleCheck size={14} /> Results tracked</span>
          </div>
        </div>

        <aside className="signal-panel" aria-label="Featured matchday slip and selection process">
          <div className="v3-feature">
            <div className="v3-feature__top">
              <span className="v3-feature__label">Today's matchday desk</span>
              <span className="v3-feature__state">
                {featuredBookable ? "Bookmaker-verified code" :
                  featuredTier ? "Review availability" : "Awaiting qualifying picks"}
              </span>
            </div>
            <h2 className="v3-feature__name">
              {featuredTier ? `${featuredMeta?.label ?? "Published"} ${featuredTier.presentation === "singles" ? "singles" : "slip"}`
                : "No qualifying ticket yet"}
            </h2>
            <p className="v3-feature__fixture">
              {featuredTier?.games?.length
                ? `${featuredTier.games[0].home_team} vs ${featuredTier.games[0].away_team}${featuredTier.games.length > 1 ? ` · +${featuredTier.games.length - 1} more` : ""}`
                : "Only verified, evidence-supported selections are published. No bet is guaranteed."}
            </p>
            <div className="v3-feature__foot">
              {featuredOdds !== null && (
                <span className="v3-feature__odds"><small>Verified ticket odds</small>
                  {fmtOdds(featuredOdds)}{oddsSuffix}
                </span>
              )}
              {featuredTier && featuredKey ? (
                <a href="#todays-picks" className="v3-link v3-link--primary"
                   onClick={() => setActiveKey(featuredKey)}>
                  Review slip and code <ArrowRight size={15} aria-hidden="true" />
                </a>
              ) : (
                <Link to="/build-slip" className="v3-link">Explore available fixtures
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
          <div className="signal-panel-head">
            <div>
              <span>Selection engine</span>
              <strong>Signal quality</strong>
            </div>
            <Activity size={18} />
          </div>
          <div className="signal-score">
            <strong>{loading ? "—" : confidenceLabel}</strong>
            <span>{confidenceExplanation}</span>
          </div>
          <div className="signal-list">
            <div><span>Probability model</span><b>{avgConf === null ? "Not evaluated" : "Calibrated"}</b></div>
            <div><span>Market scan</span><b>Daily snapshot</b></div>
            <div><span>Risk filter</span><b>Applied</b></div>
          </div>
          <div className="signal-foot">
            <Shield size={14} /> No result is guaranteed. Stake responsibly.
          </div>
        </aside>
      </section>

      {/* Live track record + Telegram CTA */}
      <div className="home-support-grid">
        <AccuracyBadge />
        <JoinTelegram variant="card" />
      </div>

      {/* Stats row */}
      <div className="metric-grid">
        <StatBubble label="Selections across tiers" value={loading ? "—" : String(totalGames)} icon={<Target size={17} color="var(--brand)" />} color="var(--brand)" />
        <StatBubble label="Confidence" value={loading ? "—" : confidenceLabel} icon={<Shield size={17} color="var(--green)" />} color="var(--green)" />
        <StatBubble
          label={isSingles ? "Independent picks" : "Top odds"}
          value={loading ? "—" : isSingles
            ? String(activeCat?.games?.length ?? 0)
            : hasActiveBookableOdds
              ? `${fmtOdds(activeOdds!)}${oddsSuffix}`
              : "—"}
          icon={<TrendingUp size={17} color="var(--blue)" />}
          color="var(--blue)"
        />
        <StatBubble label="Unique matches" value={loading ? "—" : String(uniqueFixtures)} icon={<Target size={17} color="var(--gold)" />} color="var(--gold)" />
      </div>

      {actionable.needsReplacement && (
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
      <div id="todays-picks" className="home-picks-anchor" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <CategoryTabs active={activeKey} onChange={setActiveKey} oddsMap={oddsMap} singlesMap={singlesMap} />

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
                background: catMeta.faint, border: `1px solid ${catMeta.color}20`,
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
      </div>
    </div>
  );
}
