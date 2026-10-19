import React from "react";
import type { GamePrediction } from "../../types";
import { TeamCrest } from "../common/TeamCrest";
import { ShareButton } from "../common/ShareButton";
import { formatCompetitionContext, formatKickoffDateTime, formatLeagueName, formatLocalTimeWithZone } from "../../utils/formatters";

export interface LiveScore {
  stale?: boolean;
  provisional?: boolean;
  source?: string;
  home_score: number | null;
  away_score: number | null;
  state: "pre" | "in" | "post" | string;
  state_label: string;
  detail?: string | null;
  clock?: string | null;
  live: boolean;
  finished: boolean;
}

interface Props {
  game: GamePrediction;
  color: string;
  faint: string;
  index?: number;
  /** Live score for this fixture, when one is available. Supplied separately
   *  from the card because the card is frozen at 08:00 and a score is not. */
  score?: LiveScore;
}

const FORM_COLORS: Record<string, string> = {
  W: "var(--green)",
  D: "var(--text-3)",
  L: "var(--red)",
};

function FormRun({ form, align = "flex-start" }: { form?: string | null; align?: string }) {
  if (!form) return <span style={{ flex: 1 }} />;
  return (
    <div style={{ flex: 1, display: "flex", gap: 3, justifyContent: align }}>
      {form.split("").slice(-5).map((r, i) => (
        <span
          key={i}
          title={r === "W" ? "Win" : r === "L" ? "Loss" : "Draw"}
          style={{
            width: 14, height: 14, borderRadius: 3,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700,
            color: "#fff", background: FORM_COLORS[r] ?? "var(--text-3)",
            opacity: 0.85,
          }}
        >
          {r}
        </span>
      ))}
    </div>
  );
}

/**
 * Kickoff stamp that becomes a countdown inside the last few hours.
 *
 * A date on its own is nearly useless on a betting card — what a user needs to
 * know is whether there is still time to place the bet. Inside 3 hours this
 * counts down and turns amber; once the match is under way it says so, so a
 * stale card cannot be mistaken for a live one.
 */
function KickoffStamp({ iso }: { iso?: string }) {
  const [now, setNow] = React.useState(() => Date.now());

  const ts = iso ? new Date(iso).getTime() : NaN;
  const mins = Number.isNaN(ts) ? NaN : Math.round((ts - now) / 60000);
  const ticking = !Number.isNaN(mins) && mins >= 0 && mins <= 180;

  React.useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [ticking]);

  if (Number.isNaN(ts)) return null;

  if (mins < 0) {
    // A football match lasts about two hours. Past that with no score in hand
    // the honest label is that we are waiting on the result, not that the game
    // is still being played — a fixture whose score never arrived used to read
    // "in play" indefinitely.
    const overdue = mins < -150;
    return (
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)" }}>
        {overdue ? "awaiting result" : "in play"}
      </span>
    );
  }

  if (mins <= 180) {
    const label = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
    return (
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
        color: "var(--gold)", padding: "2px 6px", borderRadius: 4,
        background: "rgba(245,158,11,0.10)",
      }}>
        {label}
      </span>
    );
  }

  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)" }}>
      {formatKickoffDateTime(new Date(ts))}
    </span>
  );
}

/** Score and match state, shown only once a match is under way or finished. */
function ScoreStamp({ score }: { score: LiveScore }) {
  if (score.home_score == null || score.away_score == null) return null;
  const live = score.live && !score.stale;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
      padding: "2px 8px", borderRadius: 5,
      background: live ? "rgba(239,68,68,0.12)" : "var(--surface-2)",
      color: live ? "var(--red, #ef4444)" : "var(--text-2)",
    }}>
      {live && (
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "var(--red, #ef4444)", flexShrink: 0,
        }} />
      )}
      {score.home_score}–{score.away_score}
      <span style={{ fontWeight: 500, opacity: 0.8 }}>
        {score.stale ? "stale" : live ? (score.clock || "live") : score.finished ? "FT" : "score"}
      </span>
    </span>
  );
}

export function PredictionCard({ game, score }: Props) {
  const editorial = game.editorial_manual === true || game.model_probability_available === false;
  const hasConfidence = !editorial && typeof game.confidence === "number" &&
    Number.isFinite(game.confidence) && game.confidence >= 0 && game.confidence <= 1;
  const pct = hasConfidence ? Math.round(game.confidence * 100) : null;
  const odds = game.odds ?? game.real_odds ?? game.estimated_odds;
  const displayOdds = typeof odds === "number" && Number.isFinite(odds) && odds > 1
    ? odds.toFixed(2) : "—";
  const selection = game.prediction || game.readable_prediction || game.prediction_value || "Selection unavailable";
  const priceImplied = game.market_implied_probability ??
    (game.odds_are_real && typeof odds === "number" && odds > 1 ? 1 / odds : null);
  const hasScore = Boolean(score && (score.live || score.finished) && score.home_score != null && score.away_score != null);
  const sportyBetUrl = game.bookmaker?.toLowerCase().includes("sportybet")
    ? "https://www.sportybet.com/ng" : null;

  return (
    <article className="editorial-fixture pred-card" data-source={editorial ? "manual" : "model"}>
      <header className="editorial-fixture__top">
        <div className="editorial-fixture__league">
          {game.league_logo && <img src={game.league_logo} alt="" width={17} height={17}
            onError={event => { (event.currentTarget as HTMLImageElement).style.display = "none"; }}/>}
          <span>{formatLeagueName(game.league)}</span>
          {game.competition_context_label && <span className="editorial-fixture__context">
            / {formatCompetitionContext(game.competition_context_label)}
          </span>}
        </div>
        <div className="editorial-fixture__time">
          {hasScore && score ? <ScoreStamp score={score}/> : <KickoffStamp iso={game.kickoff || game.date}/>}
        </div>
      </header>

      <div className="editorial-fixture__body">
        <div className="editorial-fixture__match">
          <div className="editorial-fixture__teams">
            <div><TeamCrest team={game.home_team} logo={game.home_team_logo} national={game.team_type !== "CLUB"} /><strong>{game.home_team}</strong></div>
            <div><TeamCrest team={game.away_team} logo={game.away_team_logo} national={game.team_type !== "CLUB"} /><strong>{game.away_team}</strong></div>
          </div>
          {(game.match_info?.home_form || game.match_info?.away_form) && (
            <div className="editorial-fixture__form" aria-label="Recent team form">
              <FormRun form={game.match_info?.home_form}/>
              <span>FORM</span>
              <FormRun form={game.match_info?.away_form} align="flex-end"/>
            </div>
          )}
        </div>
        <div className="editorial-fixture__selection">
          <span className="editorial-fixture__label">SELECTION</span>
          <strong>{selection}</strong>
          <small>{editorial ? "Admin curated · not model-scored" : pct !== null ? `${pct}% estimated confidence` : "Confidence unavailable"}</small>
        </div>
        <div className="editorial-fixture__price">
          <span className="editorial-fixture__label">DECIMAL ODDS</span>
          <strong>{displayOdds}</strong>
          <small>{game.odds_are_real ? game.odds_provider ?? "Bookmaker price" : "Estimated price"}</small>
        </div>
      </div>

      <footer className="editorial-fixture__footer">
        <details className="editorial-fixture__evidence">
          <summary>Evidence &amp; context</summary>
          <div className="editorial-fixture__evidence-content">
            <dl>
              <div><dt>Our estimate</dt><dd>{pct === null ? "Not model-scored" : `${pct}%`}</dd></div>
              <div><dt>Book price implies</dt><dd>{priceImplied != null ? `${Math.round(priceImplied * 100)}%` : "Not available"}</dd></div>
              <div><dt>Expected goals</dt><dd>{game.expected_goals != null ? game.expected_goals.toFixed(2) : "Not available"}</dd></div>
              <div><dt>Calibration sample</dt><dd>{game.calibration_sample != null ? `${game.calibration_sample} picks` : "Not recorded"}</dd></div>
            </dl>
            {game.added_later && game.added_at && <p>Added after initial publication at {formatLocalTimeWithZone(game.added_at)}.</p>}
            {(game.match_info?.venue || game.match_info?.city) && <p>
              Venue: {[game.match_info.venue, game.match_info.city].filter(Boolean).join(" · ")}
            </p>}
            <p>{editorial
              ? "Entered by an administrator and does not contribute to engine calibration."
              : `Model inputs: ${(game.model_sources?.length ? game.model_sources : [game.model_type === "market_poisson" ? "market + Poisson" : "statistical model"]).join(", ")}.`}
              {" "}Probabilities are estimates, not guarantees.</p>
          </div>
        </details>
        <div className="editorial-fixture__actions">
          {sportyBetUrl && <a href={sportyBetUrl} target="_blank" rel="noopener noreferrer">SportyBet <span aria-hidden="true">↗</span></a>}
          <ShareButton compact text={`${game.home_team} vs ${game.away_team} — ${selection} @${displayOdds} (${editorial ? "admin curated" : pct !== null ? `${pct}% model confidence` : "not scored"}) · BetSightly`}/>
        </div>
      </footer>
    </article>
  );
}
