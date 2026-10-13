import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { fetchPrivateBuilderWins, type PrivateWinningPrediction } from "../../api/visitorWins";
import { existingAnonymousBuilderId } from "../../utils/anonymousIdentity";

const SEEN_KEY = "betsightly.private_prediction_wins_seen.v1";
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

function readDismissed(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
    return Array.isArray(value)
      ? value.filter((x: unknown): x is string => typeof x === "string").slice(-100)
      : [];
  } catch {
    return [];
  }
}

function markDismissed(ids: string[]) {
  try {
    localStorage.setItem(
      SEEN_KEY,
      JSON.stringify([...new Set([...readDismissed(), ...ids])].slice(-100)),
    );
  } catch {
    // Private mode/storage restrictions never break the public site.
  }
}

/** A quiet first-party in-app notice; no push permission or wager assertion. */
export function BuilderWinNotice() {
  const [unseen, setUnseen] = useState<PrivateWinningPrediction[]>([]);
  const lastChecked = useRef(0);
  const inflight = useRef(false);

  const refresh = useCallback(async () => {
    const visitor = existingAnonymousBuilderId();
    if (!visitor || inflight.current) return;
    const now = Date.now();
    if (now - lastChecked.current < 25_000) return;
    lastChecked.current = now;
    inflight.current = true;
    try {
      const result = await fetchPrivateBuilderWins(visitor);
      if (result.status === "success" && result.predictions_only) {
        const dismissed = new Set(readDismissed());
        setUnseen(
          (result.notifications || [])
            .filter(ticket => ticket.status === "won" &&
              ticket.wager_confirmed === false &&
              !dismissed.has(ticket.ticket_id)),
        );
      }
    } catch {
      // No toast if service is unavailable. Retry when the visitor returns.
    } finally {
      inflight.current = false;
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onFocus = () => { void refresh(); };
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, REFRESH_INTERVAL_MS);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const dismiss = (id: string) => {
    markDismissed([id]);
    setUnseen(prev => prev.filter(item => item.ticket_id !== id));
  };
  const dismissAll = () => {
    markDismissed(unseen.map(ticket => ticket.ticket_id));
    setUnseen([]);
  };
  if (!unseen.length) return null;

  return (
    <aside aria-label="Your winning prediction updates" role="status"
      style={{
        position: "fixed", right: 16, bottom: 16, zIndex: 70,
        width: "min(410px, calc(100vw - 32px))",
        background: "var(--surface, #11251e)",
        color: "var(--text-1, #f3f5f4)",
        border: "1px solid var(--border, #355444)",
        boxShadow: "0 12px 44px rgba(0,0,0,.25)",
        borderRadius: 15, padding: 18,
        maxHeight: "min(65vh, 520px)", overflow: "auto",
      }}>
      <div style={{ display: "flex", alignItems: "start", gap: 11 }}>
        <CheckCircle2 size={24} color="#30d289" aria-hidden="true" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ fontSize: 16, display: "block" }}>
            {unseen.length === 1
              ? "Your generated prediction won!"
              : `${unseen.length} of your generated predictions won!`}
          </strong>
          <p style={{ color: "var(--text-2, #c9d8d0)", fontSize: 12,
            lineHeight: 1.6, margin: "5px 0 10px" }}>
            Private to this browser. These are BetSightly Builder prediction
            results, not confirmation that you placed a wager.
          </p>
        </div>
        <button type="button" aria-label="Dismiss all winning prediction alerts"
          onClick={dismissAll} style={{ background: "none", border: 0,
            color: "inherit", cursor: "pointer", padding: 3 }}>
          <X size={20} />
        </button>
      </div>
      <div style={{ display: "grid", gap: 9 }}>
        {unseen.slice(0, 4).map(ticket => (
          <div key={ticket.ticket_id} style={{
            display: "flex", gap: 12, alignItems: "center",
            justifyContent: "space-between", padding: "10px 12px",
            borderRadius: 10, background: "rgba(63,172,108,.10)",
          }}>
            <div>
              <strong style={{ fontSize: 13 }}>
                {typeof ticket.prediction_odds === "number"
                  ? `${ticket.prediction_odds.toFixed(2)}x`
                  : "Winning"}{" "}prediction
              </strong>
              <div style={{ fontSize: 12, color: "var(--text-2,#c9d8d0)" }}>
                {ticket.leg_count} selections · Won
              </div>
            </div>
            <button type="button" onClick={() => dismiss(ticket.ticket_id)}
              style={{ background: "transparent",
                color: "inherit", border: "1px solid currentColor",
                borderRadius: 8, padding: "6px 10px", cursor: "pointer",
                fontSize: 12 }}>
              Got it
            </button>
          </div>
        ))}
        {unseen.length > 4 && (
          <div style={{ fontSize: 12, color: "var(--text-2,#c9d8d0)" }}>
            {unseen.length - 4} more winning predictions
          </div>
        )}
      </div>
    </aside>
  );
}
