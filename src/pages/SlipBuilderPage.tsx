import {
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

import BookingCode from "../components/predictions/BookingCode";
import { BuilderLeg } from "../components/builder/BuilderLeg";
import { BuilderV2Controls } from "../components/builder/BuilderV2Controls";
import { BrandLoader } from "../components/ui/BrandLoader";
import { SEO } from "../components/common/SEO";
import { CATEGORIES } from "../types";
import { useBuilder } from "../contexts/BuilderContextInstance";
import { trackProductEvent } from "../services/bookingTracking";
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

const MARKET_LABELS: Record<string, string> = {
  over_1_5: "Over 1.5",
  over_2_5: "Over 2.5",
  under_3_5: "Under 3.5",
  under_4_5: "Under 4.5",
  home_or_draw: "Home / Draw",
  away_or_draw: "Away / Draw",
  dnb_home: "Home DNB",
  dnb_away: "Away DNB",
  home_win: "Home Win",
  away_win: "Away Win",
  home_over_0_5: "Home O0.5",
  away_over_0_5: "Away O0.5",
};

const marketLabel = (market: string) =>
  MARKET_LABELS[market] ??
  market.replaceAll("_", " ").replace(/\b\w/g, (value) => value.toUpperCase());

const formatProbabilityPercent = (value: number) => {
  if (value > 0 && value < 0.0001) return "<0.01%";
  return `${(value * 100).toFixed(2)}%`;
};

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
    retryBuild,
    reviseLeg,
  } = useBuilder();

  const acceptBestReachable = () => {
    if (!slip?.best_reachable) return;

    const closest = Number(slip.best_reachable.toFixed(2));

    if (!slip.builder_run_id) return;
    void reviseLeg("accept_best_reachable", undefined, closest);
  };

  const dnbLegCount = slip?.dnb_leg_count ?? 0;
  const hasDnb = dnbLegCount > 0;
  const capStatus = String(slip?.result_status || "");
  const slipMode = slip?.mode ?? "target_odds";
  const isTargetMode = slipMode === "target_odds";
  const headlineProbability = hasDnb
    ? (slip?.target_hit_probability ?? slip?.hit_probability ?? 0)
    : isTargetMode
      ? (slip?.hit_probability ?? 0)
      : (slip?.estimated_all_leg_probability ?? slip?.hit_probability ?? 0);
  const boardWindowLabel = horizon === "today" ? "Today’s board" : horizon === "3_days" ? "The 3-day board" : "The 7-day board";
  const isBestAvailable = Boolean(
    slip?.status === "success" && (
      slip.materialized_best_reachable ||
      (slip.odds != null && slip.target != null && slip.odds < slip.target)
    ),
  );
  const provenMaximum = Boolean(
    slip?.solver_proof?.optimality_proven === true &&
    slip.solver_proof.solution_kind === "MAX_REACHABLE"
  );

  const resultEyebrow = isBestAvailable
    ? "Best available"
    : slipMode === "game_count"
      ? "Game count ready"
      : slipMode === "strongest"
        ? "Strongest picks ready"
        : slipMode === "manual"
          ? "Your picks ready"
          : "Combination ready";

  const resultHeading = isBestAvailable
    ? `${provenMaximum ? "Best verified" : "Best available"} ${slip?.odds?.toFixed(2)}x slip`
    : slipMode === "game_count"
      ? `${slip?.delivered_game_count ?? slip?.legs ?? 0} qualifying games`
      : slipMode === "strongest"
        ? `${slip?.legs ?? 0} strongest qualifying picks`
        : slipMode === "manual"
          ? `${slip?.legs ?? 0} selected ${slip?.legs === 1 ? "game" : "games"}`
          : `Your ${slip?.odds?.toFixed(2)}x slip`;

  const marketShortfalls = Object.entries(
    slip?.market_balance?.shortfalls ?? {},
  ).filter(([, count]) => Number(count) > 0);
  const acceptingBest = editingAction === "accept_best_reachable";
  const confirmingBooking = editingAction === "confirm_booking";
  const bookingConfirmed = Boolean(
    slip?.booking?.status === "active" && slip.booking.actionable !== false,
  );
  const belowBuilderMinimum = Boolean(
    slip?.best_reachable && slip.best_reachable < 2,
  );
  const displayedBooking = editingSelectionId && slip?.booking
    ? {
        ...slip.booking,
        status: "stale" as const,
        lifecycle_status: "stale" as const,
        actionable: false,
        share_code: null,
        share_url: undefined,
        reason: "Awaiting server confirmation for this edit.",
      }
    : slip?.booking;

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
        <div className="builder-hero__target" aria-label="Builder V2">
          <span>Builder V2</span>
          <strong>4</strong>
          <em>ways to build · quality stays fixed</em>
        </div>
      </section>

      <BuilderV2Controls />

      {error && (
        <div className="builder-message builder-message--error" role="alert">
          <p>{error}</p>
          {!editingSelectionId && (
            <button className="builder-cap__cta" type="button"
              onClick={() => void retryBuild()} disabled={loading}>
              <Target size={17} />
              {loading ? "Trying again…" : "Try again"}
            </button>
          )}
        </div>
      )}
      {editingMessage && editingAction !== "replace_selection" &&
        editingAction !== "safer_same_fixture" && (
        <div className="builder-revision-progress" role="status">
          <BrandLoader />
          <div>
            <strong>{editingMessage}</strong>
            <span>Revalidating the current selections and SportyBet availability. The original slip stays unchanged unless the server confirms the edit.</span>
          </div>
        </div>
      )}
      {slip?.reason === "board_refreshing" && (
        <section className="builder-message builder-cap" aria-live="polite">
          <span className="builder-cap__badge">Board updating</span>
          <h2>We’re preparing the latest fixture board</h2>
          <p>
            {boardWindowLabel} is being evaluated now. Please try again
            shortly—your request was controlled safely and was not a CORS error.
          </p>
          <button className="builder-cap__cta" type="button"
            onClick={() => void retryBuild()} disabled={loading}>
            <Target size={17} />
            {loading ? "Checking the board…" : "Try again"}
          </button>
        </section>
      )}
      {slip && slip.status !== "success" && slip.reason !== "board_refreshing" && (
        <section className="builder-message builder-cap" aria-live="polite">
          <span className="builder-cap__badge">Best available</span>
          <h2>{isTargetMode ? capHeading(capStatus, target) : "No qualifying combination is available right now"}</h2>
          {belowBuilderMinimum && (
            <p className="builder-cap__minimum-note">
              The current verified combination is below the Builder’s 2x minimum.
            </p>
          )}
          {slip.best_reachable && !belowBuilderMinimum && (
            <div className="builder-cap__number">
              <strong>{slip.best_reachable.toFixed(2)}x</strong>
              <span>{provenMaximum
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
          {isTargetMode && slip.best_reachable && !belowBuilderMinimum && slip.builder_run_id
            && slip.best_reachable_combination && (
            <button
              className="builder-cap__cta"
              type="button"
              onClick={acceptBestReachable}
              disabled={loading || acceptingBest}
            >
              <Target size={17} />
              {acceptingBest ? `Building ${provenMaximum ? "the verified" : "the best reachable"} ${slip.best_reachable.toFixed(2)}x combination…`
                : loading ? "Building verified slip…" :
                `Build ${provenMaximum ? "verified" : "the best reachable"} ${slip.best_reachable.toFixed(2)}x slip`}
            </button>
          )}
          {isTargetMode && !!suggestedTargets(target).length && (
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
                <CheckCircle2 size={14} />
                {resultEyebrow}
              </span>
              <h2>{resultHeading}</h2>
            </div>
            <span className="builder-trust-chip">
              <ShieldCheck size={15} /> Grade {slip.lowest_trust_grade ?? "B"}{" "}
              minimum
            </span>
          </header>
          {(slip.board?.degraded || slip.board?.complete === false) && (
            <p className="builder-board-state">
              {provenMaximum
                ? "This is a verified maximum on the current board."
                : "This is the best found on the current board; a maximum has not been proven."} Some
              competitions were unavailable during this refresh. A later
              complete board may support a stronger combination.
            </p>
          )}
          {isBestAvailable && slip.reason && (
            <p className="builder-explainer">{slip.reason}</p>
          )}

          {(slip.mode === "game_count" || slip.mode === "strongest") &&
            slip.market_distribution &&
            Object.keys(slip.market_distribution).length > 0 && (
              <section
                className="builder-market-mix"
                aria-label="Market distribution"
              >
                <div className="builder-market-mix__heading">
                  <strong>Market mix</strong>
                  <span>
                    {slip.mode === "game_count"
                      ? "Built from your selected market structure"
                      : "Strongest qualifying markets"}
                  </span>
                </div>

                <div className="builder-market-mix__chips">
                  {Object.entries(slip.market_distribution).map(
                    ([market, count]) => (
                      <span key={market}>
                        {marketLabel(market)}
                        <strong>{count}</strong>
                      </span>
                    ),
                  )}
                </div>

                {slip.mode === "game_count" &&
                  slip.market_balance?.applied &&
                  marketShortfalls.length === 0 && (
                    <p>
                      Your selected markets were balanced to the requested mix
                      without lowering BetSightly's quality floor.
                    </p>
                  )}

                {slip.mode === "game_count" &&
                  slip.market_balance?.applied &&
                  marketShortfalls.length > 0 && (
                    <p>
                      {marketShortfalls
                        .map(
                          ([market, count]) =>
                            `${marketLabel(market)} was ${count} ${
                              Number(count) === 1 ? "pick" : "picks"
                            } short of its target share`,
                        )
                        .join("; ")}.
                      {" "}Remaining slots were filled only from your other
                      selected markets that still passed the same quality and
                      SportyBet bookability gates.
                    </p>
                  )}
              </section>
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
            {isBestAvailable && (
              <Stat label="Requested target" value={`${slip.original_requested_target ?? slip.target}x`} />
            )}
            {isBestAvailable && (
              <Stat label={provenMaximum ? "Best verified available" : "Best found available"}
                  value={`${slip.odds?.toFixed(2)}x`} />
            )}
            {slip.mode === "game_count" && slip.requested_game_count != null && (
              <Stat label="Requested games" value={String(slip.requested_game_count)} />
            )}
            {slip.mode === "game_count" && slip.delivered_game_count != null && (
              <Stat label="Delivered games" value={String(slip.delivered_game_count)} />
            )}
            <Stat label="Total odds" value={`${slip.odds?.toFixed(2)}x`} />
            <Stat label="Legs" value={String(slip.legs)} />
            <Stat
              label={hasDnb ? "Target hit chance" : "All legs win"}
              value={formatProbabilityPercent(headlineProbability)}
            />
            <Stat
              label="Bookmaker break-even"
              value={formatProbabilityPercent(1 / (slip.odds || 1))}
            />
          </div>
          {hasDnb ? (
            <p className="builder-explainer">
              This slip includes {dnbLegCount} Draw No Bet {dnbLegCount === 1 ? "leg" : "legs"}.
              {" "}A draw on {dnbLegCount === 1 ? "that leg" : "those legs"} voids it at 1.00x
              instead of losing the ticket.
              {" "}Target hit chance is the probability that the final payout still reaches
              {" "}{slip.target ?? target}x after any DNB pushes.
              {" "}All-win chance: {formatProbabilityPercent(slip.hit_probability ?? 0)}.
              {" "}No-loss chance: {formatProbabilityPercent(
                slip.no_loss_probability ?? slip.hit_probability ?? 0,
              )}.
              {" "}These are evidence-adjusted estimates, not promised results or profit.
            </p>
          ) : (
            <p className="builder-explainer">
              All {slip.legs} legs must win. The probability shown is
              evidence-adjusted and remains an estimate—not a promised result or
              profit.
            </p>
          )}
          {!bookingConfirmed && slip.builder_run_id ? (
            <section className="builder-booking-confirm" aria-live="polite">
              <div>
                <strong>Ready to place this exact combination?</strong>
                <span>
                  We will recheck every event, market and current price before
                  requesting a SportyBet code. Your selections will not be
                  re-optimized into a different slip.
                </span>
              </div>
              <button type="button" className="builder-submit"
                disabled={loading || confirmingBooking}
                onClick={() => void reviseLeg("confirm_booking")}>
                <CheckCircle2 size={18} />
                {confirmingBooking ? "Validating SportyBet…" : "Confirm slip and get code"}
              </button>
            </section>
          ) : (
            <BookingCode
              booking={displayedBooking}
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
              onShowBookable={undefined}
              fallbackActionLabel="Revalidate this slip"
            />
          )}
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
          {!slip.mode && slip.booking?.status === "active" && slip.booking?.actionable !== false && (
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
