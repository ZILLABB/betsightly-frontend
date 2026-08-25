import { useState } from "react";
import type { CategoryMeta, TierBooking } from "../../types";

/**
 * The SportyBet code for a tier, with a copy button.
 *
 * This is the step between reading a card and placing the bet. Without it a
 * reader retypes every fixture and market into another app, which is where
 * most of them stop.
 *
 * Two things are stated rather than assumed. The code was priced at a moment,
 * and prices move — a card locked at 08:00 does not quote the same numbers by
 * evening — so the time is shown instead of implying the odds on screen are
 * live. And a tier that could not be booked says why, because a row that
 * simply vanishes reads as a bug and leaves the reader wondering whether they
 * missed something.
 */
export default function BookingCode({
  booking,
  category,
}: {
  booking?: TierBooking;
  category: CategoryMeta;
}) {
  const [copied, setCopied] = useState(false);

  if (!booking) return null;

  const label: Record<TierBooking["status"], string> = {
    active: "",
    stale: "This tier changed after the code was made — regenerate before staking.",
    unavailable: "No booking code — not every leg is available on SportyBet.",
    failed: "Booking code unavailable right now.",
    invalid: "The code did not match this tier, so it was withheld.",
  };

  if (booking.status !== "active" || !booking.share_code) {
    return (
      <div
        style={{
          marginTop: 12,
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px dashed var(--border)",
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "var(--text-3)",
        }}
      >
        {label[booking.status] ?? "No booking code for this tier."}
      </div>
    );
  }

  const priced = booking.priced_at
    ? new Date(booking.priced_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(booking.share_code as string);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      style={{
        marginTop: 12,
        padding: "12px 14px",
        borderRadius: 8,
        border: `1px solid ${category.color}33`,
        background: category.faint,
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 11,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            color: "var(--text-3)",
            fontWeight: 600,
          }}
        >
          SportyBet
        </span>
        <code
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: ".10em",
            color: category.color,
            userSelect: "all",
            wordBreak: "break-all",
          }}
        >
          {booking.share_code}
        </code>
      </div>

      {/* Grows to fill the row once it wraps, which is what happens on a
          phone. `marginLeft: auto` alone left two 30px-tall buttons stranded
          against the right edge — correct on a desktop, awkward under a
          thumb. */}
      <div style={{ display: "flex", gap: 8, marginLeft: "auto",
                    flex: "1 1 200px", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={copy}
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            fontWeight: 600,
            padding: "10px 16px",
            minHeight: 44,
            flex: "1 1 auto",
            borderRadius: 6,
            border: `1px solid ${category.color}55`,
            background: "transparent",
            color: category.color,
            cursor: "pointer",
          }}
        >
          {copied ? "Copied ✓" : "Copy code"}
        </button>
        {booking.share_url && (
          <a
            href={booking.share_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 600,
              padding: "10px 16px",
              minHeight: 44,
              flex: "1 1 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
              background: category.color,
              color: "#fff",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Open SportyBet
          </a>
        )}
      </div>

      {(priced || booking.partial) && (
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: "var(--text-3)",
            width: "100%",
          }}
        >
          {booking.partial && booking.legs
            ? `Covers ${booking.legs} of ${booking.legs + (booking.unbooked?.length ?? 0)} picks — the rest aren't on SportyBet. `
            : ""}
          {priced
            ? `Priced at ${priced}. Odds move — check the slip before you stake.`
            : "Check the slip before you stake."}
        </span>
      )}
    </div>
  );
}
