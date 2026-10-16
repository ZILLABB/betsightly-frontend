import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, CircleDot, Radio, RefreshCw, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { SEO } from "../components/common/SEO";
import { api, type LiveScoresResponse } from "../api/predictions";
import { usePredictions } from "../hooks/usePredictions";
import "./live-scores.css";

type CardMatch = {
  match_id: string;
  home_team: string;
  away_team: string;
  kickoff: string;
  league: string;
};
const isValid = (value: unknown): value is string => typeof value === "string" && value.length > 0;

export function LivePage() {
  const { data: card, loading: cardLoading } = usePredictions();
  const [board, setBoard] = useState<LiveScoresResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const value = await api.getLiveScores();
      setBoard(value);
      setUpdatedAt(new Date().toISOString());
      setError(false);
    } catch {
      setError(true);
      setBoard(prev => prev ? { ...prev, stale: true, scores: Object.fromEntries(
        Object.entries(prev.scores ?? {}).map(([key, value]) => [key, { ...value, stale: true }]),
      ) } : prev);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const poll = () => { if (active && document.visibilityState !== "hidden") void refresh(); };
    poll();
    const timer = window.setInterval(poll, 60_000);
    const onVisibility = () => { if (document.visibilityState === "visible") poll(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  const matches = useMemo(() => {
    const unique = new Map<string, CardMatch>();
    for (const category of Object.values(card?.accumulators ?? {})) {
      if (!category || typeof category !== "object" || !("games" in category)) continue;
      const product = category as { games?: CardMatch[]; chain?: { picks?: CardMatch[] }[] };
      const selections = [...(product.games ?? []), ...(product.chain ?? []).flatMap(d => d.picks ?? [])];
      for (const game of selections) {
        if (!isValid(game.match_id) || unique.has(game.match_id)) continue;
        unique.set(game.match_id, {
          match_id: game.match_id, home_team: game.home_team,
          away_team: game.away_team,
          kickoff: (game as CardMatch).kickoff || (game as unknown as {date:string}).date || "",
          league: game.league || "Football",
        });
      }
    }
    return [...unique.values()].sort((a,b) => {
      const as = board?.scores[a.match_id], bs = board?.scores[b.match_id];
      const rank = (s?: LiveScoresResponse["scores"][string]) => s?.live ? 0 : s?.finished ? 1 : 2;
      return rank(as) - rank(bs) || a.kickoff.localeCompare(b.kickoff);
    });
  }, [card, board]);

  const liveCount = matches.filter(m => board?.scores[m.match_id]?.live && !board?.scores[m.match_id]?.stale).length;
  const scored = matches.filter(m => {
    const s = board?.scores[m.match_id];
    return s?.home_score != null && s?.away_score != null;
  }).length;
  const providerText = (board?.sportybet_source === "live" || board?.sportybet_source === "no_live_games")
    ? "SportyBet supplements ESPN for matched games."
    : "ESPN scores shown where available; SportyBet connection is not active.";

  return (
    <div className="bs-live-page v3-page">
      <SEO title="Live Football Scores" description="In-play scores for BetSightly's published football selections. Live scores are provisional, not settled betting results." path="/live" />
      <section className="bs-live-hero">
        <div className="bs-live-eyebrow"><Radio size={15} aria-hidden="true" /> MATCHDAY DESK</div>
        <h1>Live <span>scores.</span></h1>
        <p>Follow the fixtures on BetSightly's published card. Updated scores remain provisional until an independent final result is verified.</p>
        <div className="bs-live-hero-actions">
          <span><CircleDot size={14} aria-hidden="true" /> {liveCount} in play</span>
          <span>{scored} with scores</span>
          <button type="button" onClick={() => void refresh()} disabled={loading}><RefreshCw size={14} aria-hidden="true" /> Refresh</button>
        </div>
      </section>
      <div className="bs-live-head">
        <div>
          <h2>Published fixtures</h2>
          <p>{providerText}</p>
        </div>
        <span>{board?.fetched_at
          ? `Source snapshot ${new Date(board.fetched_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}`
          : updatedAt ? "No source snapshot available" : "Checking"}</span>
      </div>
      {error && <p role="status" className="bs-live-note">The score feed could not be refreshed. Existing verified results are still available on the Results page.</p>}
      {board?.stale && <p role="status" className="bs-live-note bs-live-note--stale">
        Score feed is delayed{board.cache_age_seconds != null ? ` (${Math.round(board.cache_age_seconds / 60)} min since last update)` : ""}.
        Previously seen scores are displayed as stale and must not be treated as current or settled.
        {board.refreshing ? " Refresh in progress." : ""}
      </p>}
      {loading && !board && <p className="bs-live-note">Checking matchday scores…</p>}
      <div className="bs-live-board" aria-live="off">
        {matches.map(m => {
          const s = board?.scores[m.match_id];
          const haveScore = s?.home_score != null && s?.away_score != null;
          const phase = s?.stale ? "Last observed · delayed" : s?.live ? "In play" : s?.finished ? "Final score reported" : "Awaiting score";
          return <article className={`bs-live-fixture${s?.stale ? " bs-live-fixture--stale" : ""}`} key={m.match_id}>
            <div className="bs-live-fixture-meta">
              <span>{m.league}</span>
              <span className={s?.live && !s?.stale ? "bs-live-indicator" : ""}>{s?.live && !s?.stale ? "● " : ""}{phase}{s?.live && !s?.stale && s?.clock ? ` · ${s.clock}` : ""}</span>
            </div>
            <div className="bs-live-fixture-row">
              <div className="bs-live-names"><strong>{m.home_team}</strong><strong>{m.away_team}</strong></div>
              <div className="bs-live-score" aria-label={haveScore ? `${s?.home_score} to ${s?.away_score}` : "Score unavailable"}>
                <span>{haveScore ? s?.home_score : "–"}</span>
                <span>{haveScore ? s?.away_score : "–"}</span>
              </div>
            </div>
            <div className="bs-live-source">{s?.stale ? "Delayed observation · " : ""}{s?.source === "sportybet-via-parse" ? "SportyBet provisional score" : haveScore ? "ESPN scoreboard observation" : "No available score for this fixture yet"}</div>
          </article>;
        })}
      </div>
      {!cardLoading && matches.length === 0 && <div className="bs-live-empty">No published fixtures on the current card. <Link to="/predictions">View predictions <ArrowRight size={14}/></Link></div>}
      <div className="bs-live-bottom">
        <p><ShieldCheck size={18} aria-hidden="true" /> Live scores can be corrected. Only verified final scores update BetSightly's official win/loss record and calibration.</p>
        <Link to="/results">View official results <ArrowRight size={15}/></Link>
      </div>
    </div>
  );
}
