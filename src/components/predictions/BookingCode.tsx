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

  const bookingStatus = booking.booking_status ?? (
    booking.status === "active" ? (booking.partial ? "PARTIAL" : "FULL") :
    booking.status === "invalid" ? "VALIDATION_FAILED" :
    booking.status === "failed" ? "BOOKING_FAILED" : "UNAVAILABLE"
  );

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
        {booking.reason || label[booking.status] || "No valid SportyBet ticket could be created for this tier."}
        {!!booking.excluded_legs?.length && (
          <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            {booking.excluded_legs.map((leg, index) => (
              <li key={`${leg.match_id ?? index}-${leg.market ?? "selection"}`}>
                {leg.home_team} vs {leg.away_team} — {leg.prediction ?? leg.market}
                {leg.sportybet_availability?.status ? ` (${leg.sportybet_availability.status})` : ""}
              </li>
            ))}
          </ul>
        )}
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
          SportyBet {booking.ticket_type === "accumulator" ? "accumulator" : "booking"}
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

      {/* Sized to their content on a wide screen and stretched to fill the
          row only once it wraps on a phone — see .booking-actions in
          index.css. Stretching unconditionally made two buttons span the
          whole desktop width. */}
      <div className="booking-actions"
           style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
        <button
          type="button"
          onClick={copy}
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            fontWeight: 600,
            padding: "8px 14px",
            minHeight: 40,
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
              padding: "8px 14px",
              minHeight: 40,
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

      <div style={{ width: "100%", fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-2)" }}>
        {bookingStatus === "FULL" && `${booking.booked_leg_count ?? booking.legs ?? 0}/${booking.original_leg_count ?? booking.legs ?? 0} selections booked.`}
        {bookingStatus === "REBUILT_FULL" && `${booking.booked_leg_count ?? booking.legs ?? 0}/${booking.original_leg_count ?? booking.legs ?? 0} selections booked · ${booking.replacement_count ?? booking.replacements?.length ?? 0} unavailable selection(s) replaced.`}
        {bookingStatus === "PARTIAL" && `${booking.booked_leg_count ?? booking.legs ?? 0}/${booking.original_leg_count ?? 0} selections booked · partial ticket.`}
        {booking.actual_sportybet_odds ? ` Actual SportyBet odds: ${booking.actual_sportybet_odds.toFixed(2)}.` : ""}
      </div>

      {!!booking.replacements?.length && (
        <details style={{ width: "100%", fontFamily: "var(--font-body)", fontSize: 12 }}>
          <summary style={{ cursor: "pointer", color: category.color }}>View replacements</summary>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "var(--text-3)" }}>
            {booking.replacements.map((item, index) => (
              <li key={index}>
                {item.original_leg?.home_team} vs {item.original_leg?.away_team} → {item.replacement_leg?.home_team} vs {item.replacement_leg?.away_team} ({item.reason})
              </li>
            ))}
          </ul>
        </details>
      )}

      {!!booking.excluded_legs?.length && (
        <details style={{ width: "100%", fontFamily: "var(--font-body)", fontSize: 12 }}>
          <summary style={{ cursor: "pointer", color: category.color }}>View excluded selections</summary>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "var(--text-3)" }}>
            {booking.excluded_legs.map((leg, index) => (
              <li key={`${leg.match_id ?? index}-${leg.market ?? "selection"}`}>
                {leg.home_team} vs {leg.away_team} — {leg.prediction ?? leg.market}
                {leg.sportybet_availability?.failure_reason ? `: ${leg.sportybet_availability.failure_reason}` : ""}
              </li>
            ))}
          </ul>
        </details>
      )}

      {(priced || booking.partial) && (
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: "var(--text-3)",
            width: "100%",
          }}
        >
          {bookingStatus === "PARTIAL"
            ? `This code contains only the selections listed as booked above. `
            : ""}
          {priced
            ? `Priced at ${priced}. Odds move — check the slip before you stake.`
            : "Check the slip before you stake."}
        </span>
      )}
    </div>
  );
}
