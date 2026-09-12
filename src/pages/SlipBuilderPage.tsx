import {
  CalendarDays,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { useState } from "react";

import BookingCode from "../components/predictions/BookingCode";
import { BuilderLeg } from "../components/builder/BuilderLeg";
import { BrandLoader } from "../components/ui/BrandLoader";
import { SEO } from "../components/common/SEO";
import { CATEGORIES } from "../types";
import { trackProductEvent } from "../services/bookingTracking";
import { useBuilder } from "../contexts/BuilderContextInstance";
import "../styles/builder-editor.css";
import "../styles/product-experience.css";

const TARGETS = [10, 20, 30, 50, 70, 100];
const suggestedTargets = (requested: number) =>
  TARGETS.filter((value) => value < requested).slice(-3).reverse();
const accent = CATEGORIES.find((c) => c.key === "5_odds")!;
const capHeading = (status: string | undefined, target: number) => ({
  EXPOSURE_CAPPED: `${target}x is limited by the current diversification rules`,
  TEAM_TO_SCORE_CAPPED: `${target}x reached the Team-to-Score safety limit`,
  FIXTURE_DIVERSITY_CAPPED: `${target}x is limited by fixture diversity`,
  MAX_LEGS_CAPPED: `${target}x exceeds the current leg ceiling`,
  BOOKABILITY_CAPPED: `${target}x is limited by exact SportyBet availability`,
  EXPECTED_RETURN_CAPPED: `${target}x does not clear the expected-return policy`,
}[status || ""] || `${target}x isn’t supported by the current board`);

export default function SlipBuilderPage() {
  const {
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
  } = useBuilder();
  const [customTarget, setCustomTarget] = useState("");

  const acceptBestReachable = () => {
    if (!slip?.best_reachable) return;

    const closest = Math.max(2, Number(slip.best_reachable.toFixed(2)));

    chooseTarget(closest, true);

    if (slip.builder_run_id) {
      void reviseLeg("accept_best_reachable", undefined, closest);
    } else {
      trackProductEvent("builder_best_reachable_accepted", {
        product_area: "builder", target_odds: closest, horizon,
      });
      void build(false, closest, true);
    }
  };

  const dnbLegCount = slip?.dnb_leg_count ?? 0;
  const hasDnb = dnbLegCount > 0;
  const headlineProbability = hasDnb
    ? (slip?.target_hit_probability ?? slip?.hit_probability ?? 0)
    : (slip?.hit_probability ?? 0);
  const capStatus = String(slip?.result_status || "");

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
        <div className="builder-custom-target">
          <label htmlFor="builder-custom-target">Custom target (2x–200x)</label>
          <div>
            <input id="builder-custom-target" type="number" min="2" max="200"
              step="0.01" inputMode="decimal" value={customTarget}
              placeholder="e.g. 125"
              onChange={(event) => setCustomTarget(event.target.value)} />
            <button type="button" disabled={loading || Number(customTarget) < 2 || Number(customTarget) > 200}
              onClick={() => {
                const value = Number(customTarget);
                chooseTarget(value);
                trackProductEvent("builder_target_selected", {
                  product_area: "builder", source: "custom",
                  target_odds: value, horizon,
                });
              }}>
              Use target
            </button>
          </div>
          <small>A higher request is not a promise; quality rules stay unchanged.</small>
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
      {editingMessage && editingAction !== "replace_selection" &&
        editingAction !== "safer_same_fixture" && (
        <div className="builder-revision-progress" role="status">
          <BrandLoader />
          <div>
            <strong>{editingMessage}</strong>
            <span>Checking SportyBet selections, creating the current booking, then validating every event and market.</span>
          </div>
        </div>
      )}
      {slip?.reason === "board_refreshing" && (
        <section className="builder-message builder-cap" aria-live="polite">
          <span className="builder-cap__badge">Board updating</span>
          <h2>We’re preparing the latest fixture board</h2>
          <p>
            The weekly predictions are being evaluated now. Please try again
            shortly—your request was controlled safely and was not a CORS error.
          </p>
          <button className="builder-cap__cta" type="button"
            onClick={() => void build(false)} disabled={loading}>
            <Target size={17} />
            {loading ? "Checking the board…" : "Try again"}
          </button>
        </section>
      )}
      {slip && slip.status !== "success" && slip.reason !== "board_refreshing" && (
        <section className="builder-message builder-cap" aria-live="polite">
          <span className="builder-cap__badge">Best available</span>
          <h2>{capHeading(capStatus, target)}</h2>
          {slip.best_reachable && (
            <div className="builder-cap__number">
              <strong>{slip.best_reachable.toFixed(2)}x</strong>
              <span>{slip.optimization_status === "OPTIMAL"
                ? slip.board?.degraded || slip.board?.complete === false
                  ? "verified maximum on the current board"
                  : "verified maximum"
                : "reachable"}</span>
            </div>
          )}
          {(slip.board?.degraded || slip.board?.complete === false) && (
            <p className="builder-cap__board-note">
              Some competitions were unavailable during this refresh. A later
              complete board may support a stronger combination.
            </p>
          )}
          <p>{slip.reason ?? "That target is not responsibly reachable from the available board."}</p>
          <p className="builder-cap__promise">
            {["EXPOSURE_CAPPED", "TEAM_TO_SCORE_CAPPED",
              "FIXTURE_DIVERSITY_CAPPED"].includes(capStatus)
              ? "Approved picks remain, but the current exposure limit is binding. This is not the same as those picks failing quality."
              : slip.result_status === "MAX_LEGS_CAPPED"
                ? "Approved picks may remain beyond the current leg ceiling; BetSightly will not silently create an oversized slip."
                : capStatus === "EXPECTED_RETURN_CAPPED"
                  ? "A combination can reach the requested odds, but it does not meet BetSightly’s minimum expected-return policy."
                : `We will not add weaker picks simply to manufacture ${target}x.`}
          </p>
          {slip.best_reachable && (
            <button
              className="builder-cap__cta"
              type="button"
              onClick={acceptBestReachable}
              disabled={loading}
            >
              <Target size={17} />
              {loading ? "Building verified slip…" :
                `Build ${slip.optimization_status === "OPTIMAL" ? "verified" : "the best reachable"} ${slip.best_reachable.toFixed(2)}x slip`}
            </button>
          )}
          {!!suggestedTargets(target).length && (
            <div className="builder-cap__alternatives" aria-label="Try another target">
              <span>Try another target</span>
              {suggestedTargets(target).map((value) => (
                <button key={value} type="button" disabled={loading}
                  onClick={() => chooseTarget(value)}>{value}x</button>
              ))}
            </div>
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
          {slip.board?.degraded && (
            <p className="builder-board-state">
              The prepared board is usable but incomplete. Unavailable competitions were not searched again for this edit.
            </p>
          )}
          {slip.change_summary && (
            <section className="builder-change-summary" aria-label="Latest slip changes">
              <strong>Rebuilt your slip</strong>
              <span>
                {slip.change_summary.removed.length} removed · {slip.change_summary.added.length} added
              </span>
              <p>{slip.change_summary.reason}</p>
              {slip.change_summary.removed[0] && slip.change_summary.added[0] && (
                <div className="builder-change-summary__swap">
                  <span>
                    Removed <strong>{slip.change_summary.removed[0].prediction}</strong>
                    {slip.change_summary.removed[0].odds ? ` @ ${slip.change_summary.removed[0].odds?.toFixed(2)}` : ""}
                  </span>
                  <span>
                    Added <strong>{slip.change_summary.added[0].prediction}</strong>
                    {slip.change_summary.added[0].odds ? ` @ ${slip.change_summary.added[0].odds?.toFixed(2)}` : ""}
                  </span>
                  {slip.change_summary.action === "safer_same_fixture" && (
                    <small>
                      Conservative probability: {((slip.change_summary.added[0].selection_probability ?? 0) * 100).toFixed(1)}%
                      {slip.change_summary.added[0].market?.startsWith("dnb_")
                        ? " · A draw pushes this leg at 1.00x."
                        : ""}
                    </small>
                  )}
                </div>
              )}
              <small>
                Old total: {slip.change_summary.old_odds?.toFixed(2) ?? "—"}x · New total: {slip.change_summary.new_odds?.toFixed(2) ?? "—"}x
              </small>
            </section>
          )}
          <div className="builder-stats">
            <Stat label="Total odds" value={`${slip.odds?.toFixed(2)}x`} />
            <Stat label="Legs" value={String(slip.legs)} />
            <Stat
              label={hasDnb ? "Target hit chance" : "All legs win"}
              value={`${(headlineProbability * 100).toFixed(2)}%`}
            />
            <Stat
              label="Bookmaker break-even"
              value={`${(100 / (slip.odds || 1)).toFixed(2)}%`}
            />
          </div>
          {hasDnb ? (
            <p className="builder-explainer">
              This slip includes {dnbLegCount} Draw No Bet {dnbLegCount === 1 ? "leg" : "legs"}.
              {" "}A draw on {dnbLegCount === 1 ? "that leg" : "those legs"} voids it at 1.00x
              instead of losing the ticket.
              {" "}Target hit chance is the probability that the final payout still reaches
              {" "}{slip.target}x after any DNB pushes.
              {" "}All-win chance: {((slip.hit_probability ?? 0) * 100).toFixed(2)}%.
              {" "}No-loss chance: {((slip.no_loss_probability ?? slip.hit_probability ?? 0) * 100).toFixed(2)}%.
              {" "}These are evidence-adjusted estimates, not promised results or profit.
            </p>
          ) : (
            <p className="builder-explainer">
              All {slip.legs} legs must win. The probability shown is
              evidence-adjusted and remains an estimate—not a promised result or
              profit.
            </p>
          )}
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
              slip.booking?.status === "active" && slip.booking?.actionable !== false
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
          {slip.booking?.status === "active" && slip.booking?.actionable !== false && (
            <div className="builder-regenerate">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => void build(true)}
                disabled={loading}
              >
                Refresh slip and code
              </button>
              <span>Rechecks live availability; unchanged selections reuse the validated code.</span>
            </div>
          )}
          <div className="builder-leg-list">
            <div className="builder-leg-list__heading">
              <div>
                <h2>Shape this slip</h2>
                <p>Replace a pick, request a safer market, exclude a game, or lock what you want to keep.</p>
              </div>
              {slip.revision && <span>Revision {slip.revision}</span>}
            </div>
            {(slip.games ?? []).map((game, index) => (
              <BuilderLeg key={game.selection_id || `${game.fixture_id}-${index}`}
                game={game} index={index} accent={accent}
                locked={Boolean(game.selection_id && slip.locked_selection_ids?.includes(game.selection_id))}
                pending={editingSelectionId === game.selection_id}
                pendingAction={editingAction}
                replacedFrom={revisionFeedback?.status === "success" &&
                  revisionFeedback.action === "replace_selection" &&
                  revisionFeedback.newGame?.selection_id === game.selection_id
                  ? revisionFeedback.oldGame : undefined}
                feedback={revisionFeedback && (
                  revisionFeedback.oldGame?.selection_id === game.selection_id ||
                  revisionFeedback.newGame?.selection_id === game.selection_id)
                  ? { status: revisionFeedback.status,
                      message: revisionFeedback.message }
                  : undefined}
                onAction={(action, selected) => void reviseLeg(action, selected)}
                onExplanation={() => trackProductEvent("builder_explanation_opened", {
                  product_area: "builder", target_odds: target, horizon,
                })} />
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
