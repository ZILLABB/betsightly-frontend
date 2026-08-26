import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, CircleCheck, Flame, RefreshCw, Shield, Sliders, Target, TrendingUp } from "lucide-react";
import { usePredictions } from "../hooks/usePredictions";
import { useFormatOdds } from "../hooks/useFormatOdds";
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
  const { formatOdds: fmtOdds, oddsSuffix } = useFormatOdds();

  const accumulators = data?.accumulators;
  const activeCat = accumulators?.[activeKey];
  const catMeta = CATEGORIES.find(c => c.key === activeKey)!;

  const oddsMap = accumulators
    ? Object.fromEntries(
        CATEGORIES.map(c => [c.key, accumulators[c.key]?.total_odds])
      ) as Partial<Record<CategoryKey, number>>
    : {};

  const totalGames = accumulators
    ? CATEGORIES.reduce((s, c) => s + (accumulators[c.key]?.games?.length ?? 0), 0)
    : 0;

  const avgConf = activeCat?.games?.length
    ? Math.round(activeCat.games.reduce((s, g) => s + g.confidence, 0) / activeCat.games.length * 100)
    : 0;

  const handleRefresh = useCallback(() => {
    setSpinning(true);
    refetch();
    setTimeout(() => setSpinning(false), 700);
  }, [refetch]);

  return (
    <div className="page-stack" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SEO path="/" />
      <WelcomeBanner />

      {/* Product hero */}
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <div className="market-status">
            <span className="market-status-dot" />
            Models online
            <span aria-hidden="true">·</span>
            {data?.date
              ? new Date(data.date + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
              : new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
          </div>
          <h1 id="home-title">
            Read the market.<br />
            <span>Back the signal.</span>
          </h1>
          <p>
            Daily football selections shaped by current bookmaker prices,
            calibrated probabilities, and a transparent results history.
          </p>
          <div className="home-hero-actions">
            <Link to="/predictions" className="hero-action hero-action-primary">
              Explore today&apos;s picks <ArrowRight size={16} />
            </Link>
            <Link to="/build-slip" className="hero-action hero-action-secondary">
              <Sliders size={16} /> Build a slip
            </Link>
          </div>
          <div className="trust-row" aria-label="Product principles">
            <span><CircleCheck size={14} /> Real odds</span>
            <span><CircleCheck size={14} /> Calibrated confidence</span>
            <span><CircleCheck size={14} /> Results tracked</span>
          </div>
        </div>

        <aside className="signal-panel" aria-label="Selection process">
          <div className="signal-panel-head">
            <div>
              <span>Selection engine</span>
              <strong>Signal quality</strong>
            </div>
            <Activity size={18} />
          </div>
          <div className="signal-score">
            <strong>{loading ? "—" : `${avgConf}%`}</strong>
            <span>Average confidence in the active card</span>
          </div>
          <div className="signal-list">
            <div><span>Probability model</span><b>Calibrated</b></div>
            <div><span>Market scan</span><b>Current</b></div>
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
        <StatBubble label="Picks today" value={loading ? "—" : String(totalGames)} icon={<Target size={17} color="var(--brand)" />} color="var(--brand)" />
        <StatBubble label="Confidence" value={loading ? "—" : `${avgConf}%`} icon={<Shield size={17} color="var(--green)" />} color="var(--green)" />
        <StatBubble label="Top odds" value={loading ? "—" : `${fmtOdds(activeCat?.total_odds ?? 0)}${oddsSuffix}`} icon={<TrendingUp size={17} color="var(--blue)" />} color="var(--blue)" />
        <StatBubble label="Categories" value={String(CATEGORIES.length)} icon={<Flame size={17} color="var(--gold)" />} color="var(--gold)" />
      </div>

      {/* Tabs + content */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <CategoryTabs active={activeKey} onChange={setActiveKey} oddsMap={oddsMap} />

        {/* Category header */}
        {!loading && activeCat && (
          <div className="animate-fade-in" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: catMeta.color, letterSpacing: "-0.02em" }}>
                {catMeta.label} Accumulator
              </h2>
              {activeCat.reason && (
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>
                  {activeCat.reason}
                </p>
              )}
              {typeof activeCat.hit_probability === "number" && activeCat.games?.length > 0 && (
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
              <div style={{
                padding: "5px 14px", borderRadius: 8,
                background: catMeta.faint, border: `1px solid ${catMeta.color}20`,
                fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700,
                color: catMeta.color, letterSpacing: "-0.02em",
              }}>
                {fmtOdds(activeCat.total_odds)}{oddsSuffix}
              </div>
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
