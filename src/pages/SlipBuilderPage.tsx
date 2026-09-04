import {
  CalendarDays,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

import { PredictionCard } from "../components/predictions/PredictionCard";
import BookingCode from "../components/predictions/BookingCode";
import { BrandLoader } from "../components/ui/BrandLoader";
import { SEO } from "../components/common/SEO";
import { CATEGORIES } from "../types";
import { trackProductEvent } from "../services/bookingTracking";
import { useBuilder } from "../contexts/BuilderContextInstance";

const TARGETS = [10, 20, 30, 50, 70, 100];
const accent = CATEGORIES.find((c) => c.key === "5_odds")!;
const trustBand = (score?: number) =>
  score == null
    ? "Evidence checked"
    : score >= 85
      ? "Strong evidence"
      : "Supported evidence";

export default function SlipBuilderPage() {
  const {
    target,
    horizon,
    slip,
    loading,
    recoveringCode,
    error,
    chooseTarget,
    chooseHorizon,
    build,
  } = useBuilder();

  const acceptBestReachable = () => {
    if (!slip?.best_reachable) return;

    const closest = Math.max(2, Number(slip.best_reachable.toFixed(2)));

    chooseTarget(closest);

    trackProductEvent("best_reachable_accepted", {
      product_area: "builder",
      target_odds: closest,
      horizon,
    });

    void build(false, closest);
  };

  return (
    <main className="builder-page page-stack">
      <SEO
        title="Build a slip · BetSightly"
        description="Choose your odds and get a qualifying slip with a SportyBet booking code."
      />
      <section className="builder-hero">
        <div className="builder-hero__copy">
          <span className="builder-eyebrow">
            <Sparkles size={14} /> Smart slip builder
          </span>
          <h1>Build around your target, not the hype.</h1>
          <p>
            We combine the strongest supported markets, check live SportyBet
            availability, and stop when the evidence cannot justify your target.
          </p>
          <div className="builder-proof">
            <span>
              <ShieldCheck size={16} /> Evidence screened
            </span>
            <span>
              <CheckCircle2 size={16} /> Bookability checked
            </span>
          </div>
        </div>
        <div className="builder-hero__target" aria-label="Selected target">
          <span>Your target</span>
          <strong>
            {target}
            <small>x</small>
          </strong>
          <em>{horizon === "today" ? "Today" : "7-day board"}</em>
        </div>
      </section>

      <section
        className="builder-config"
        aria-labelledby="builder-config-title"
      >
        <div className="builder-section-heading">
          <div>
            <span>01</span>
            <h2 id="builder-config-title">Choose total odds</h2>
          </div>
          <p>
            Higher targets usually need more legs and have a lower chance of
            landing.
          </p>
        </div>
        <div className="builder-targets" role="group" aria-label="Target odds">
          {TARGETS.map((t) => (
            <button
              key={t}
              type="button"
              className={t === target ? "is-active" : ""}
              aria-pressed={t === target}
              onClick={() => {
                chooseTarget(t);

                trackProductEvent("builder_target_selected", {
                  product_area: "builder",
                  source: "generator",
                  target_odds: t,
                  tier: horizon,
                  horizon,
                });
              }}
            >
              <strong>{t}x</strong>
              <span>
                {t <= 20
                  ? "Lower target"
                  : t <= 50
                    ? "Balanced"
                    : "High target"}
              </span>
            </button>
          ))}
        </div>
        <div className="builder-divider" />
        <div className="builder-section-heading">
          <div>
            <span>02</span>
            <h2>Choose the window</h2>
          </div>
          <p>A wider window gives the model a deeper board to search.</p>
        </div>
        <div
          className="builder-horizons"
          role="group"
          aria-label="Fixture window"
        >
          <button
            type="button"
            className={horizon === "today" ? "is-active" : ""}
            aria-pressed={horizon === "today"}
            onClick={() => chooseHorizon("today")}
          >
            <CalendarDays size={22} />
            <span>
              <strong>Today only</strong>
              <small>All legs settle from today’s fixtures.</small>
            </span>
          </button>

          <button
            type="button"
            className={horizon === "week" ? "is-active" : ""}
            aria-pressed={horizon === "week"}
            onClick={() => chooseHorizon("week")}
          >
            <CalendarDays size={22} />
            <span>
              <strong>Across 7 days</strong>
              <small>A larger board for stronger combinations.</small>
            </span>
          </button>
        </div>
        <button
          className="builder-submit"
          type="button"
          onClick={() => void build(false)}
          disabled={loading}
        >
          <Target size={19} />
          {loading ? "Searching the board…" : `Build my ${target}x slip`}
        </button>
        {loading && (
          <div className="builder-loading">
            <BrandLoader />
            <span>Checking evidence and current SportyBet availability.</span>
          </div>
        )}
      </section>

      {error && (
        <div className="builder-message builder-message--error" role="alert">
          {error}
        </div>
      )}
      {slip && slip.status !== "success" && (
        <section className="builder-message">
          <h2>We won’t force this target</h2>
          <p>
            {slip.reason ??
              "That target is not responsibly reachable from the available board."}
          </p>
          {slip.best_reachable && (
            <button
              className="btn-ghost"
              type="button"
              onClick={acceptBestReachable}
            >
              Build the best reachable {slip.best_reachable.toFixed(2)}x slip
            </button>
          )}
        </section>
      )}

      {slip?.status === "success" && (
        <section className="builder-results" aria-live="polite">
          <header>
            <div>
              <span className="builder-eyebrow">
                <CheckCircle2 size={14} /> Combination ready
              </span>
              <h2>Your {slip.odds?.toFixed(2)}x slip</h2>
            </div>
            <span className="builder-trust-chip">
              <ShieldCheck size={15} /> Grade {slip.lowest_trust_grade ?? "B"}{" "}
              minimum
            </span>
          </header>
          <div className="builder-stats">
            <Stat label="Total odds" value={`${slip.odds?.toFixed(2)}x`} />
            <Stat label="Legs" value={String(slip.legs)} />
            <Stat
              label="All legs land"
              value={`${((slip.hit_probability ?? 0) * 100).toFixed(2)}%`}
            />
            <Stat
              label="Bookmaker break-even"
              value={`${(100 / (slip.odds || 1)).toFixed(2)}%`}
            />
          </div>
          <p className="builder-explainer">
            All {slip.legs} legs must land. The probability shown is
            evidence-adjusted and remains an estimate—not a promised result or
            profit.
          </p>
          <div className="builder-warning">
            <ShieldCheck size={20} />
            <p>
              <span className="builder-warning__desktop">
                Review every match and market yourself before staking.
                Predictions are probability estimates, not guarantees, and team
                news, line-ups, injuries and odds can change.
              </span>
              <span className="builder-warning__mobile">
                Check every match before staking. Predictions are estimates, not
                guarantees; line-ups, injuries and odds can change.
              </span>
            </p>
          </div>
          <BookingCode
            booking={slip.booking}
            category={accent}
            tracking={{
              source: "generator",
              tier: `${target}_${horizon}`,
              legCount: slip.booking?.booked_leg_count ?? slip.legs,
              fingerprint: slip.booking?.sportybet_selection_fingerprint,
              targetOdds: target,
              bookingStatus: slip.booking?.booking_status,
              actualOdds: slip.booking?.actual_sportybet_odds,
            }}
            onShowBookable={
              slip.booking?.status === "active"
                ? undefined
                : () => void build(true)
            }
            fallbackActionLabel="Try another bookable slip"
          />
          {recoveringCode && (
            <p className="builder-recovery">
              Rechecking SportyBet availability…
            </p>
          )}
          {slip.booking?.status === "active" && (
            <div className="builder-regenerate">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => void build(true)}
                disabled={loading}
              >
                Regenerate slip and code
              </button>
              <span>Rechecks live availability and creates a fresh code.</span>
            </div>
          )}
          <div className="builder-leg-list">
            <h2>Why each leg qualified</h2>
            {(slip.games ?? []).map((game, index) => (
              <article
                className="builder-leg"
                key={`${game.fixture_id}-${index}`}
              >
                <div className="builder-leg__meta">
                  <span>Leg {String(index + 1).padStart(2, "0")}</span>
                  <strong>
                    <ShieldCheck size={14} /> {trustBand(game.trust?.score)}
                  </strong>
                  <small>
                    {game.trust?.evidence_state === "SUPPORTED"
                      ? "Historical and live evidence checked"
                      : "Conservative evidence threshold passed"}
                  </small>
                </div>
                <PredictionCard game={game} category={accent} />
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
