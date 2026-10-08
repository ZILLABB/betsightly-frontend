import React from "react";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import { api, type NextAvailableResponse } from "../../api/predictions";

const dateLabel = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(
  "en-GB",
  { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" },
);

/** Next match-day quality inventory, never a newly published official ticket.
 * A read-only snapshot is not a bookmaker-verified share code. */
export function NextAvailableNotice({
  enabled,
  publicationDate,
}: {
  enabled: boolean;
  publicationDate?: string;
}) {
  const [preview, setPreview] = React.useState<NextAvailableResponse | null>(null);

  React.useEffect(() => {
    if (!enabled || !publicationDate) {
      setPreview(null);
      return;
    }
    let alive = true;
    api.getNextAvailable()
      .then(result => { if (alive) setPreview(result); })
      .catch(() => { if (alive) setPreview(null); });
    return () => { alive = false; };
  }, [enabled, publicationDate]);

  const next = preview?.next_available;
  if (!enabled || !preview?.available || !next || !next.candidates?.length) {
    return null;
  }

  return (
    <section className="card" aria-label="Next available prediction preview" style={{
      padding: "16px 18px", borderLeft: "4px solid var(--gold)",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <CalendarDays aria-hidden="true" size={19} color="var(--gold)" />
        <div>
          <strong style={{ display: "block", fontSize: 15, color: "var(--text-1)" }}>
            Today's premium slate is thin — see {dateLabel(next.fixture_target_date)}
          </strong>
          <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-2)", marginTop: 4 }}>
            {next.qualified_unique_fixture_count} different fixtures passed our model-value,
            trust and price checks in a prepared future snapshot.
            These are previews, not official published picks or verified SportyBet codes.
          </p>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {next.candidates.slice(0, 3).map(game => (
          <span key={game.match_id} style={{
            padding: "5px 9px", borderRadius: 8, fontSize: 12,
            color: "var(--text-2)", border: "1px solid var(--border)",
          }}>
            {game.home_team} v {game.away_team}
          </span>
        ))}
      </div>
      <Link to="/build-slip" style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 13, fontWeight: 700, color: "var(--gold)", textDecoration: "none",
        alignSelf: "flex-start",
      }}>
        Explore the 3- or 7-day Builder <ArrowRight size={14} />
      </Link>
    </section>
  );
}
