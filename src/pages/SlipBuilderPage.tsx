import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, CheckCircle2, ShieldCheck, Sparkles, Target } from "lucide-react";
import { api, type BuiltSlip } from "../api/predictions";
import { PredictionCard } from "../components/predictions/PredictionCard";
import BookingCode from "../components/predictions/BookingCode";
import { BrandLoader } from "../components/ui/BrandLoader";
import { SEO } from "../components/common/SEO";
import { CATEGORIES, type GamePrediction } from "../types";
import { trackProductEvent } from "../services/bookingTracking";

const TARGETS = [10, 20, 30, 50, 70, 100];
const accent = CATEGORIES.find(c => c.key === "5_odds")!;
const MAX_AUTO_RECOVERY_ATTEMPTS = 3;
const trustBand = (score?: number) => score == null ? "Evidence checked" : score >= 85 ? "Strong evidence" : "Supported evidence";
const marketMix = (games: GamePrediction[] = []) => Object.entries(games.reduce<Record<string, number>>((all, game) => {
  const market = game.prediction_type || game.market || "other";
  all[market] = (all[market] || 0) + 1;
  return all;
}, {})).map(([market, count]) => `${market}:${count}`).join(",");

export default function SlipBuilderPage() {
  const [target, setTarget] = useState(50);
  const [horizon, setHorizon] = useState<"today" | "week">("week");
  const [slip, setSlip] = useState<BuiltSlip | null>(null);
  const [loading, setLoading] = useState(false);
  const [recoveringCode, setRecoveringCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const recoveryAttempts = useRef(0);

  const build = useCallback(async (regenerate = false, targetOverride?: number) => {
    if (inFlight.current) return;
    if (regenerate && !window.confirm("Regenerating creates a fresh SportyBet code and may change the selections or odds. Continue?")) return;
    const requestedTarget = targetOverride ?? target;
    inFlight.current = true;
    const startedAt = performance.now();
    trackProductEvent("builder_generate_requested", { product_area: "builder", source: "generator", tier: horizon, target_odds: requestedTarget, horizon });
    setLoading(true); setError(null); setSlip(null);
    try {
      const result = await api.buildSlip(requestedTarget, horizon, regenerate);
      setSlip(result); recoveryAttempts.current = 0;
      const booking = result.booking;
      if (result.status === "success") {
        trackProductEvent("builder_generated", {
          product_area: "builder", source: "generator", tier: horizon, target_odds: requestedTarget, horizon,
          leg_count: result.legs, booking_status: booking?.booking_status ?? booking?.status ?? "UNAVAILABLE",
          actual_sportybet_odds: booking?.actual_sportybet_odds, duration_ms: Math.round(performance.now() - startedAt),
          cached: result.cached ? 1 : 0, lowest_trust_grade: result.lowest_trust_grade,
          average_trust_band: trustBand(result.average_trust_score), market_mix: marketMix(result.games),
          target_reached: (result.odds ?? 0) >= requestedTarget ? 1 : 0,
        });
      } else trackProductEvent("builder_unavailable", { product_area: "builder", target_odds: requestedTarget, horizon, failure_category: result.status, duration_ms: Math.round(performance.now() - startedAt) });
    } catch (e) {
      const err = e as Error & { name?: string };
      trackProductEvent("builder_failed", { product_area: "builder", target_odds: requestedTarget, horizon, failure_category: err?.name === "AbortError" ? "timeout" : "request_failed", duration_ms: Math.round(performance.now() - startedAt) });
      setError(err?.name === "AbortError" ? "That took longer than expected — the server may be waking up. Try once more." : err?.message ? `Could not build a slip: ${err.message}` : "Could not build a slip just now. Try again in a moment.");
    } finally { inFlight.current = false; setLoading(false); }
  }, [horizon, target]);

  useEffect(() => {
    if (slip?.status !== "success" || slip.booking?.status === "active" || recoveryAttempts.current >= MAX_AUTO_RECOVERY_ATTEMPTS) return;
    let timer: number | undefined;
    const recover = async () => {
      if (document.visibilityState !== "visible" || !navigator.onLine || inFlight.current) return;
      inFlight.current = true; recoveryAttempts.current += 1; setRecoveringCode(true);
      try { setSlip(await api.buildSlip(target, horizon, true)); } catch { /* Never let booking recovery break the page. */ }
      finally { inFlight.current = false; setRecoveringCode(false); }
    };
    const schedule = () => { if (!timer) timer = window.setTimeout(() => { timer = undefined; void recover(); }, 12_000); };
    schedule(); window.addEventListener("focus", schedule); window.addEventListener("online", schedule); document.addEventListener("visibilitychange", schedule);
    return () => { if (timer) window.clearTimeout(timer); window.removeEventListener("focus", schedule); window.removeEventListener("online", schedule); document.removeEventListener("visibilitychange", schedule); };
  }, [slip, target, horizon]);

  const acceptBestReachable = () => {
    if (!slip?.best_reachable) return;
    const closest = Math.max(2, Number(slip.best_reachable.toFixed(2)));
    setTarget(closest); trackProductEvent("best_reachable_accepted", { product_area: "builder", target_odds: closest, horizon }); void build(false, closest);
  };

  return <main className="builder-page page-stack">
    <SEO title="Build a slip · BetSightly" description="Choose your odds and get a qualifying slip with a SportyBet booking code." />
    <section className="builder-hero"><div className="builder-hero__copy"><span className="builder-eyebrow"><Sparkles size={14} /> Smart slip builder</span><h1>Build around your target, not the hype.</h1><p>We combine the strongest supported markets, check live SportyBet availability, and stop when the evidence cannot justify your target.</p><div className="builder-proof"><span><ShieldCheck size={16} /> Evidence screened</span><span><CheckCircle2 size={16} /> Bookability checked</span></div></div><div className="builder-hero__target" aria-label="Selected target"><span>Your target</span><strong>{target}<small>x</small></strong><em>{horizon === "today" ? "Today" : "7-day board"}</em></div></section>

    <section className="builder-config" aria-labelledby="builder-config-title">
      <div className="builder-section-heading"><div><span>01</span><h2 id="builder-config-title">Choose total odds</h2></div><p>Higher targets usually need more legs and have a lower chance of landing.</p></div>
      <div className="builder-targets" role="group" aria-label="Target odds">{TARGETS.map(t => <button key={t} type="button" className={t === target ? "is-active" : ""} aria-pressed={t === target} onClick={() => { setTarget(t); setSlip(null); recoveryAttempts.current = 0; trackProductEvent("builder_target_selected", { product_area: "builder", source: "generator", target_odds: t, tier: horizon, horizon }); }}><strong>{t}x</strong><span>{t <= 20 ? "Lower target" : t <= 50 ? "Balanced" : "High target"}</span></button>)}</div>
      <div className="builder-divider" />
      <div className="builder-section-heading"><div><span>02</span><h2>Choose the window</h2></div><p>A wider window gives the model a deeper board to search.</p></div>
      <div className="builder-horizons" role="group" aria-label="Fixture window"><button type="button" className={horizon === "today" ? "is-active" : ""} aria-pressed={horizon === "today"} onClick={() => { setHorizon("today"); setSlip(null); recoveryAttempts.current = 0; }}><CalendarDays size={22} /><span><strong>Today only</strong><small>All legs settle from today’s fixtures.</small></span></button><button type="button" className={horizon === "week" ? "is-active" : ""} aria-pressed={horizon === "week"} onClick={() => { setHorizon("week"); setSlip(null); recoveryAttempts.current = 0; }}><CalendarDays size={22} /><span><strong>Across 7 days</strong><small>A larger board for stronger combinations.</small></span></button></div>
      <button className="builder-submit" type="button" onClick={() => void build(false)} disabled={loading}><Target size={19} />{loading ? "Searching the board…" : `Build my ${target}x slip`}</button>
      {loading && <div className="builder-loading"><BrandLoader /><span>Checking evidence and current SportyBet availability.</span></div>}
    </section>

    {error && <div className="builder-message builder-message--error" role="alert">{error}</div>}
    {slip && slip.status !== "success" && <section className="builder-message"><h2>We won’t force this target</h2><p>{slip.reason ?? "That target is not responsibly reachable from the available board."}</p>{slip.best_reachable && <button className="btn-ghost" type="button" onClick={acceptBestReachable}>Build the best reachable {slip.best_reachable.toFixed(2)}x slip</button>}</section>}

    {slip?.status === "success" && <section className="builder-results" aria-live="polite">
      <header><div><span className="builder-eyebrow"><CheckCircle2 size={14} /> Combination ready</span><h2>Your {slip.odds?.toFixed(2)}x slip</h2></div><span className="builder-trust-chip"><ShieldCheck size={15} /> Grade {slip.lowest_trust_grade ?? "B"} minimum</span></header>
      <div className="builder-stats"><Stat label="Total odds" value={`${slip.odds?.toFixed(2)}x`} /><Stat label="Legs" value={String(slip.legs)} /><Stat label="All legs land" value={`${((slip.hit_probability ?? 0) * 100).toFixed(2)}%`} /><Stat label="Bookmaker break-even" value={`${(100 / (slip.odds || 1)).toFixed(2)}%`} /></div>
      <p className="builder-explainer">All {slip.legs} legs must land. The probability shown is evidence-adjusted and remains an estimate—not a promised result or profit.</p>
      <div className="builder-warning"><ShieldCheck size={20} /><p><span className="builder-warning__desktop">Review every match and market yourself before staking. Predictions are probability estimates, not guarantees, and team news, line-ups, injuries and odds can change.</span><span className="builder-warning__mobile">Check every match before staking. Predictions are estimates, not guarantees; line-ups, injuries and odds can change.</span></p></div>
      <BookingCode booking={slip.booking} category={accent} tracking={{ source: "generator", tier: `${target}_${horizon}`, legCount: slip.booking?.booked_leg_count ?? slip.legs, fingerprint: slip.booking?.sportybet_selection_fingerprint, targetOdds: target, bookingStatus: slip.booking?.booking_status, actualOdds: slip.booking?.actual_sportybet_odds }} onShowBookable={slip.booking?.status === "active" ? undefined : () => void build(true)} fallbackActionLabel="Try another bookable slip" />
      {recoveringCode && <p className="builder-recovery">Rechecking SportyBet availability…</p>}
      {slip.booking?.status === "active" && <div className="builder-regenerate"><button type="button" className="btn-ghost" onClick={() => void build(true)} disabled={loading}>Regenerate slip and code</button><span>Rechecks live availability and creates a fresh code.</span></div>}
      <div className="builder-leg-list"><h2>Why each leg qualified</h2>{(slip.games ?? []).map((game, index) => <article className="builder-leg" key={`${game.fixture_id}-${index}`}><div className="builder-leg__meta"><span>Leg {String(index + 1).padStart(2, "0")}</span><strong><ShieldCheck size={14} /> {trustBand(game.trust?.score)}</strong><small>{game.trust?.evidence_state === "SUPPORTED" ? "Historical and live evidence checked" : "Conservative evidence threshold passed"}</small></div><PredictionCard game={game} category={accent} /></article>)}</div>
    </section>}
  </main>;
}

function Stat({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
