import { useEffect, useState } from "react";
import type { CategoryMeta, TierBooking } from "../../types";
import { trackBookingEvent, type BookingEventContext } from "../../services/bookingTracking";
import { formatLocalTimeWithZone } from "../../utils/formatters";

const availabilityText = (status?: string) => ({
  FIXTURE_NOT_FOUND: "fixture unavailable on the current SportyBet board",
  MARKET_NOT_FOUND: "market unavailable on SportyBet",
  SELECTION_NOT_FOUND: "selection unavailable on SportyBet",
  ODDS_UNAVAILABLE: "odds currently unavailable",
  OUTCOME_SUSPENDED: "selection currently suspended",
  KICKOFF_BUFFER: "too close to kickoff",
  FIXTURE_STARTED: "match already started",
  KICKOFF_MISMATCH: "kickoff could not be verified",
  SPORTYBET_DATA_ERROR: "SportyBet availability could not be verified",
}[String(status || "").toUpperCase()] || "currently unavailable");

const excludedSummary = (booking: TierBooking) => {
  const legs = booking.excluded_legs || [];
  if (!legs.length) return null;
  const statuses = legs.map(leg => String(
    leg.status || leg.sportybet_availability?.status || ""
  ).toUpperCase());
  const near = statuses.filter(status => status === "KICKOFF_BUFFER").length;
  const started = statuses.filter(status => status === "FIXTURE_STARTED").length;
  const unavailable = legs.length - near - started;
  if (unavailable === legs.length) {
    return `${legs.length} ${legs.length === 1 ? "selection" : "selections"} could not be matched on the current SportyBet board.`;
  }
  const parts = [
    near ? `${near} near kickoff` : "",
    started ? `${started} already started` : "",
    unavailable ? `${unavailable} unavailable` : "",
  ].filter(Boolean);
  return `Some selections are no longer placeable: ${parts.join(", ")}.`;
};

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
  tracking,
  onShowBookable,
  fallbackActionLabel = "Show what I can still bet",
}: {
  booking?: TierBooking;
  category: CategoryMeta;
  tracking?: BookingEventContext;
  onShowBookable?: () => void;
  fallbackActionLabel?: string;
}) {
  const [copied, setCopied] = useState(false);
  const actionable = booking?.status === "active" &&
    booking.actionable !== false &&
    (!booking.lifecycle_status || booking.lifecycle_status === "active") &&
    !!booking.share_code;

  useEffect(() => {
    if (actionable && tracking) {
      trackBookingEvent("booking_code_viewed", {
        ...tracking,
        bookingStatus: booking.booking_status,
        actualOdds: booking.actual_sportybet_odds,
      });
    } else if (booking && booking.status !== "active" && tracking) {
      trackBookingEvent("fallback_shown", {
        ...tracking, bookingStatus: booking.booking_status ?? booking.status,
        failure_category: booking.failure_category ?? booking.booking_status ?? booking.status,
      });
    }
  }, [actionable, booking?.share_code, booking?.status, booking?.failure_category,
      tracking?.source, tracking?.tier,
      tracking?.legCount, tracking?.fingerprint]);

  if (!booking) return (
    <div role="status" style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8,
      border: "1px dashed var(--border)", fontFamily: "var(--font-body)",
      fontSize: 13, color: "var(--text-3)" }}>
      <strong style={{ display: "block", color: "var(--text-1)", marginBottom: 4 }}>
        Creating SportyBet code…
      </strong>
      Your predictions are ready. This will update automatically without a refresh.
    </div>
  );

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
    expired: "This SportyBet code has expired and is no longer placeable.",
    started: "This SportyBet code is no longer placeable because one or more matches have started.",
    kickoff_buffer: "This code is no longer placeable because a match starts within 20 minutes.",
    validation_failed: "The code could not be verified against the displayed selections.",
    suspended: "One or more SportyBet selections are currently suspended.",
    bookmaker_error: "SportyBet could not verify this code right now.",
  };

  if (!actionable) {
    const actualFailure = excludedSummary(booking);
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
        <strong style={{ display: "block", color: "var(--text-1)", marginBottom: 4 }}>
          {booking.status === "started" || booking.status === "kickoff_buffer" ||
            booking.status === "expired" ? "Published code no longer placeable" :
            booking.status === "stale" ? "Code outdated — revalidating booking" :
            "Slip ready, code unavailable"}
        </strong>
        {actualFailure || booking.reason || label[booking.status] || "No valid SportyBet ticket could be created for this tier."}
        {!!booking.excluded_legs?.length && (
          <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            {booking.excluded_legs.map((leg, index) => (
              <li key={`${leg.match_id ?? index}-${leg.market ?? "selection"}`}>
                {leg.home_team} vs {leg.away_team} — {leg.prediction ?? leg.market}
                {` (${availabilityText(leg.status || leg.sportybet_availability?.status)})`}
              </li>
            ))}
          </ul>
        )}
        {onShowBookable && (
          <button type="button" onClick={onShowBookable}
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    marginTop: 12, minHeight: 40, padding: "8px 14px", borderRadius: 7,
                    border: `1px solid ${category.color}`, background: category.color,
                    color: "#fff", fontFamily: "var(--font-body)", fontSize: 13,
                    fontWeight: 700, cursor: "pointer",
                  }}>
            {fallbackActionLabel}
          </button>
        )}
      </div>
    );
  }

  const priced = booking.priced_at
    ? formatLocalTimeWithZone(booking.priced_at)
    : null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(booking.share_code as string);
      setCopied(true);
      if (tracking) trackBookingEvent("booking_code_copied", {
        ...tracking, bookingStatus, actualOdds: booking.actual_sportybet_odds,
      });
      if (tracking && bookingStatus === "REBUILT_FULL") {
        const usedAlternativeMarket = booking.replacements?.some((item) =>
          item.original_leg?.fixture_id != null &&
          item.original_leg.fixture_id === item.replacement_leg?.fixture_id,
        ) ?? false;
        trackBookingEvent("replacement_used", {
          ...tracking, bookingStatus, actualOdds: booking.actual_sportybet_odds,
          replacement_type: usedAlternativeMarket ? "same_fixture_market" : "replacement_fixture",
          replacement_count: booking.replacement_count ?? booking.replacements?.length ?? 0,
        });
        if (usedAlternativeMarket) {
          trackBookingEvent("alternative_market_used", {
            ...tracking, bookingStatus, actualOdds: booking.actual_sportybet_odds,
            replacement_type: "same_fixture_market",
            replacement_count: booking.replacement_count ?? booking.replacements?.length ?? 0,
          });
        }
      } else if (tracking && bookingStatus === "PARTIAL") {
        trackBookingEvent("partial_booking_used", {
          ...tracking, bookingStatus, actualOdds: booking.actual_sportybet_odds,
          replacement_type: "partial",
        });
      }
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="booking-code booking-code--verified"
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
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <strong style={{ fontFamily: "var(--font-body)", fontSize: 13,
                         color: "var(--text-1)" }}>
          Code ready
        </strong>
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
          {category.key === "over_1_5" && booking.ticket_type === "accumulator"
            ? "SportyBet accumulator share-code ticket"
            : `SportyBet ${booking.ticket_type === "accumulator" ? "accumulator" : "booking"}`}
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
            onClick={() => tracking && trackBookingEvent("sportybet_opened", {
              ...tracking, bookingStatus, actualOdds: booking.actual_sportybet_odds,
            })}
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

      {category.key === "over_1_5" && (
        <div style={{ width: "100%", fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)" }}>
          Convenience share-code ticket only · the underlying picks are intended as separate singles.
        </div>
      )}

      {!!booking.replacements?.length && (
        <details onToggle={(event) => {
          if ((event.currentTarget as HTMLDetailsElement).open && tracking) {
            trackBookingEvent("replacement_details_opened", {
              ...tracking, bookingStatus, actualOdds: booking.actual_sportybet_odds,
              replacement_count: booking.replacement_count ?? booking.replacements?.length ?? 0,
            });
          }
        }} style={{ width: "100%", fontFamily: "var(--font-body)", fontSize: 12 }}>
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
                {`: ${leg.sportybet_availability?.failure_reason || availabilityText(
                  leg.status || leg.sportybet_availability?.status
                )}`}
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
