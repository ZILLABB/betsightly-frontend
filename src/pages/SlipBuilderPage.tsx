import { useState } from "react";
import { api, type BuiltSlip } from "../api/predictions";
import { PredictionCard } from "../components/predictions/PredictionCard";
import BookingCode from "../components/predictions/BookingCode";
import { BrandLoader } from "../components/ui/BrandLoader";
import { SEO } from "../components/common/SEO";
import { CATEGORIES } from "../types";

/**
 * Ask for a multiplier; get the qualifying slip most likely to reach it.
 *
 * Deliberately not sold as an edge. A backtest across 393 settled legs found
 * nothing selection can key on that predicts a leg beating its own stated
 * confidence — so this reaches a number honestly, and prints what the number
 * is actually worth beside it.
 *
 * The two figures matter equally and point different ways. "Lands X% of the
 * time" is what happens to this slip; "returns ₦Y per ₦100" is what happens
 * over many of them. A long slip can look generous on the first and be
 * dreadful on the second, which is exactly the trick this page refuses.
 */

const TARGETS = [10, 20, 30, 50, 70, 100];
const accent = CATEGORIES.find(c => c.key === "5_odds")!;

export default function SlipBuilderPage() {
  const [target, setTarget] = useState(50);
  const [horizon, setHorizon] = useState<"today" | "week">("week");
  const [slip, setSlip] = useState<BuiltSlip | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const build = async () => {
    setLoading(true);
    setError(null);
    setSlip(null);
    try {
      setSlip(await api.buildSlip(target, horizon));
    } catch (e) {
      // Say what actually went wrong. A generic line here hid a GET being sent
      // to a POST route for a whole release — the page said "try again in a
      // moment" while every attempt was failing the same way.
      const err = e as Error & { status?: number; name?: string };
      setError(
        err?.name === "AbortError"
          ? "That took longer than expected — the server may be waking up. Try once more."
          : err?.message
            ? `Could not build a slip: ${err.message}`
            : "Could not build a slip just now. Try again in a moment.",
      );
    } finally {
      setLoading(false);
    }
  };

  const pill = (active: boolean) => ({
    padding: "10px 16px",
    minHeight: 44,
    borderRadius: 8,
    fontFamily: "var(--font-body)",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    border: `1px solid ${active ? accent.color : "var(--border)"}`,
    background: active ? accent.faint : "transparent",
    color: active ? accent.color : "var(--text-2)",
  });

  return (
    <div className="page-stack">
      <SEO title="Build a slip · BetSightly"
           description="Choose your odds and get a qualifying slip with a SportyBet booking code." />

      <div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700,
                    letterSpacing: ".1em", textTransform: "uppercase",
                    color: accent.color, margin: "0 0 6px" }}>
          Build a slip
        </p>
        <h1 style={{ margin: "0 0 8px" }}>Pick your odds</h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14,
                    color: "var(--text-3)", maxWidth: "60ch", margin: 0 }}>
          We search every qualifying pick for the combination most likely to
          reach your target, then hand you the SportyBet code for it. Same
          standards as the daily card — nothing is added to make a number.
        </p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {TARGETS.map(t => (
          <button key={t} type="button" onClick={() => setTarget(t)}
                  style={{ ...pill(t === target), minWidth: 68 }}>
            {t} odds
          </button>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
                    letterSpacing: ".06em", textTransform: "uppercase",
                    color: "var(--text-3)", margin: "0 0 8px" }}>
          When it settles
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button type="button" onClick={() => setHorizon("today")}
                  style={pill(horizon === "today")}>
            Today only
          </button>
          <button type="button" onClick={() => setHorizon("week")}
                  style={pill(horizon === "week")}>
            Across the week
          </button>
        </div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13,
                    color: "var(--text-3)", margin: "8px 0 0", maxWidth: "60ch" }}>
          {horizon === "today"
            ? "Every leg kicks off today, so you know tonight. Drawn from one day's fixtures, so the picks are a little weaker."
            : "Legs can spread across seven WAT calendar days. The larger board usually offers higher-confidence choices, but the slip takes longer to resolve."}
        </p>
      </div>

      <button type="button" onClick={build} disabled={loading}
              style={{ padding: "14px 22px", minHeight: 48, borderRadius: 10,
                       border: "none", background: accent.color, color: "#fff",
                       fontFamily: "var(--font-body)", fontSize: 15,
                       fontWeight: 700, cursor: loading ? "wait" : "pointer",
                       alignSelf: "flex-start" }}>
        {loading ? "Building…" : `Build a ${target} odds slip`}
      </button>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BrandLoader />
          <span style={{ fontFamily: "var(--font-body)", fontSize: 13,
                         color: "var(--text-3)" }}>
            Searching {horizon === "week" ? "a week" : "today"}'s fixtures — this
            can take a moment on the first run.
          </span>
        </div>
      )}

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 8,
                      background: "var(--red-faint)", fontFamily: "var(--font-body)",
                      fontSize: 14, color: "var(--text-2)" }}>
          {error}
        </div>
      )}

      {slip && slip.status !== "success" && (
        <div style={{ padding: "16px 18px", borderRadius: 10,
                      border: "1px dashed var(--border)",
                      fontFamily: "var(--font-body)", fontSize: 14,
                      color: "var(--text-2)", maxWidth: "62ch" }}>
          {slip.reason ?? "That target is not reachable from today's board."}
        </div>
      )}

      {slip && slip.status === "success" && (
        <>
          <div style={{ padding: "18px 20px", borderRadius: 12,
                        border: `1px solid ${accent.color}30`, background: accent.faint }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
              <Stat label="Total odds"
                    value={`${slip.odds?.toFixed(2)}x`} big color={accent.color} />
              <Stat label="Legs" value={String(slip.legs)} />
              <Stat label="Lands"
                    value={`${((slip.hit_probability ?? 0) * 100).toFixed(2)}%`} />
              <Stat label="Model-estimated return per ₦100"
                    value={`₦${Math.round((slip.expected_return ?? 0) * 100)}`} />
            </div>
            {/* The sentence the rest of the industry leaves out. */}
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13,
                        color: "var(--text-3)", margin: "14px 0 0", maxWidth: "64ch" }}>
              All {slip.legs} legs must land, which the model estimates happens about{" "}
              {((slip.hit_probability ?? 0) * 100).toFixed(2)}% of the time. Staked
              repeatedly at the displayed prices, that estimate implies around ₦
              {Math.round((slip.expected_return ?? 0) * 100)} returned per ₦100 staked.
              This is a probability estimate, not a promised profit.
            </p>
            {slip.first_kickoff && slip.last_kickoff && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12,
                          color: "var(--text-3)", margin: "8px 0 0" }}>
                Runs from {new Date(slip.first_kickoff).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                {slip.last_kickoff !== slip.first_kickoff && ` to ${new Date(slip.last_kickoff).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`}.
              </p>
            )}
          </div>

          <BookingCode booking={slip.booking} category={accent} />

          <div style={{ display: "grid", gap: 12 }}>
            {(slip.games ?? []).map((g, i) => (
              <PredictionCard key={`${g.fixture_id}-${i}`} game={g}
                              category={accent} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, big, color }: {
  label: string; value: string; big?: boolean; color?: string;
}) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600,
                    letterSpacing: ".08em", textTransform: "uppercase",
                    color: "var(--text-3)", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: big ? 26 : 20,
                    fontWeight: 700, color: color ?? "var(--text-1)" }}>
        {value}
      </div>
    </div>
  );
}
