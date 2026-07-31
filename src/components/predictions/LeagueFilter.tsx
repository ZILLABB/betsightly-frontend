import React from "react";
import type { GamePrediction } from "../../types";

/**
 * League chips for the current slip.
 *
 * Hidden when a slip spans fewer than three leagues — with two chips the
 * control costs more attention than the filtering saves.
 */
export function LeagueFilter({
  games,
  active,
  onChange,
  color,
}: {
  games: GamePrediction[];
  active: string | null;
  onChange: (league: string | null) => void;
  color: string;
}) {
  const counts = React.useMemo(() => {
    const map = new Map<string, number>();
    games.forEach(g => {
      if (!g.league) return;
      map.set(g.league, (map.get(g.league) ?? 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [games]);

  // Clear a filter that no longer matches anything (category switched under it)
  React.useEffect(() => {
    if (active && !counts.some(([name]) => name === active)) onChange(null);
  }, [active, counts, onChange]);

  if (counts.length < 3) return null;

  const chip = (label: string, count: number | null, selected: boolean, onClick: () => void) => (
    <button
      key={label}
      onClick={onClick}
      aria-pressed={selected}
      style={{
        padding: "5px 12px", borderRadius: 999, cursor: "pointer",
        border: `1px solid ${selected ? color : "var(--border)"}`,
        background: selected ? `${color}18` : "transparent",
        color: selected ? color : "var(--text-3)",
        fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {label}{count != null && <span style={{ opacity: 0.6 }}> {count}</span>}
    </button>
  );

  return (
    <div
      className="scrollbar-hide"
      style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2 }}
    >
      {chip("All", games.length, active === null, () => onChange(null))}
      {counts.map(([league, n]) => chip(league, n, active === league, () => onChange(league)))}
    </div>
  );
}
