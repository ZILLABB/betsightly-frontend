import React from "react";
import { Link } from "react-router-dom";
import { Shield, TrendingUp, Database, Bot, Sparkles, AlertTriangle, Trophy } from "lucide-react";
import { JoinTelegram } from "../components/common/JoinTelegram";

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)",
        }}>{icon}</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800 }}>{title}</h2>
      </div>
      <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-2)", lineHeight: 1.7 }}>
        {children}
      </div>
    </section>
  );
}

function FAQ({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <details className="card" style={{ padding: "16px 20px" }}>
      <summary style={{
        cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14,
        fontWeight: 700, color: "var(--text-1)",
      }}>{q}</summary>
      <div style={{
        marginTop: 12, fontFamily: "var(--font-body)", fontSize: 13,
        color: "var(--text-2)", lineHeight: 1.7,
      }}>{a}</div>
    </details>
  );
}

export function AboutPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36, maxWidth: 760 }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>About</div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, lineHeight: 1.1 }}>
          How <span className="text-brand-gradient">BetSightly</span> works
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-3)", marginTop: 12, lineHeight: 1.7 }}>
          Every pick on the site is generated from real bookmaker odds and statistical models —
          no guesswork, no gut feel. Here's exactly what's under the hood.
        </p>
      </div>

      <Section icon={<Database size={18} />} title="Data sources">
        <p>We use two independent data feeds:</p>
        <ul style={{ marginTop: 8, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
          <li><strong>The Odds API</strong> — live bookmaker odds from UK and EU sportsbooks (Paddy Power, Bet365, Unibet, etc.) across the World Cup, Spanish La Liga 2, Chilean Primera, Finnish Veikkausliiga, League of Ireland, Brazilian Brasileirão, and more.</li>
          <li><strong>API-Football</strong> — fixtures, results, and historical match data used to train and update our ELO and Dixon-Coles models.</li>
        </ul>
      </Section>

      <Section icon={<TrendingUp size={18} />} title="How we pick the safest matches">
        <p>For every match, we run three independent estimates and only show picks where they agree:</p>
        <ol style={{ marginTop: 8, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
          <li><strong>Bookmaker implied probability</strong> — the average of all bookmaker odds, stripped of margin. Aggregating across multiple books cancels out individual mispricings.</li>
          <li><strong>ELO ratings</strong> — a 426-team registry covering Europe's Big-5 leagues, Segunda/Championship/Serie B, the Eredivisie, Primeira Liga, and more.</li>
          <li><strong>Statistical models</strong> — XGBoost, LightGBM, and CatBoost trained on tens of thousands of historical matches for match result, Over 1.5, Over 2.5, and BTTS.</li>
        </ol>
        <p style={{ marginTop: 12 }}>When all three agree on a market (Over 1.5, double chance, or strong favourite Win), the pick is flagged. When they strongly disagree, we drop it entirely.</p>
      </Section>

      <Section icon={<Sparkles size={18} />} title="The categories">
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
          <li><strong>2 Odds</strong> — 2–3 high-confidence picks combining to ~2x</li>
          <li><strong>5 Odds</strong> — 4–5 picks combining to ~5x</li>
          <li><strong>10 Odds</strong> — 5–7 picks combining to ~10x</li>
          <li><strong>Over 1.5</strong> — only goals markets, all very safe</li>
          <li><strong>Rollover</strong> — a 10-day chain. Each day has 1–3 picks; all must hit. Cumulative payout often exceeds 100x if every day wins.</li>
        </ul>
      </Section>

      <Section icon={<Trophy size={18} />} title="World Cup 2026">
        <p>The dedicated World Cup tab covers all 72 matches with predictions, group-stage tables, value bets and an accumulator builder. Picks for WC come from bookmaker odds + tournament-specific base rates.</p>
      </Section>

      <Section icon={<Bot size={18} />} title="The Telegram bot">
        <p>Our Telegram bot posts each day's safest rollover pick automatically. Punters in the group can submit their own codes, which appear on the Punters page with copy-to-clipboard support. Reply "Won" or "Lost" to any code message to update its status.</p>
        <div style={{ marginTop: 14 }}>
          <JoinTelegram variant="banner" />
        </div>
      </Section>

      <Section icon={<Shield size={18} />} title="What we DO NOT do">
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
          <li>We don't accept bets or move money. The site is informational.</li>
          <li>We don't chase value bets where the bookmaker is "wrong" — we only show picks where multiple independent signals agree.</li>
          <li>We don't guarantee results. Probability is probability; even 90% picks lose 1 in 10 times.</li>
        </ul>
      </Section>

      {/* FAQ */}
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, marginBottom: 14 }}>
          Frequently asked questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <FAQ q="Are your picks free?" a="Yes. Every pick on the site is free and there's no signup required." />
          <FAQ q="How often are picks updated?" a="Odds refresh every 6 hours. New matches are pulled into the daily accumulators as soon as they appear in the bookmaker feed." />
          <FAQ q="Why do you sometimes have 0 picks for today?" a="On days with no safe matches (very low odds quality or off-season), we'd rather show nothing than push a bad pick. The Rollover skips ahead to the next available day." />
          <FAQ q="What's the difference between the regular categories and World Cup?" a="The regular categories pull from active club leagues globally. The World Cup tab is the 72 WC 2026 fixtures only. They're independent." />
          <FAQ q="Why is my country/league not shown?" a="We currently cover ~10 active leagues. More will be added as their seasons start. ELO ratings are heavily skewed toward European football." />
          <FAQ q="Do I need to bet to use the site?" a="No. The site is for analysis. If you choose to bet based on what you see, do so responsibly and only with money you can afford to lose." />
        </div>
      </div>

      {/* Responsible gambling */}
      <div className="card" style={{
        padding: "20px 24px", borderLeft: "3px solid var(--red)",
        background: "rgba(248,113,113,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <AlertTriangle size={18} color="var(--red)" />
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>
            Bet responsibly · 18+ only
          </h3>
        </div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-2)", lineHeight: 1.7 }}>
          Sports betting carries financial risk. Only bet what you can afford to lose.
          Predictions on this site are informational and probabilistic — no result is ever
          guaranteed. If you or someone you know struggles with gambling, please contact
          a national helpline:
        </p>
        <ul style={{ marginTop: 10, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4,
          fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", lineHeight: 1.7 }}>
          <li>UK: <strong>GamCare</strong> — 0808 8020 133 · gamcare.org.uk</li>
          <li>Nigeria: <strong>Mental Health Foundation</strong> — 0803 970 0000</li>
          <li>International: <strong>Gamblers Anonymous</strong> — gamblersanonymous.org</li>
        </ul>
      </div>

      <div style={{
        padding: "16px 20px", fontFamily: "var(--font-body)", fontSize: 13,
        color: "var(--text-2)", textAlign: "center", display: "flex",
        flexDirection: "column", gap: 6,
      }}>
        <p>Questions, bug reports, or league requests?</p>
        <p>
          Email us at <a href="mailto:support@betsightly.com" style={{
            color: "var(--brand)", fontWeight: 600, textDecoration: "none",
          }}>support@betsightly.com</a>
        </p>
        <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6 }}>
          <Link to="/" style={{ color: "var(--brand)" }}>Back to home</Link>
        </p>
      </div>
    </div>
  );
}
