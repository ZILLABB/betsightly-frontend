import React, { useState } from "react";
import type { CategoryKey, CategoryMeta } from "../../types";
import { CATEGORIES } from "../../types";
import { useFormatOdds } from "../../hooks/useFormatOdds";

interface Props {
  active: CategoryKey;
  onChange: (key: CategoryKey) => void;
  oddsMap?: Partial<Record<CategoryKey, number>>;
}

export function CategoryTabs({ active, onChange, oddsMap = {} }: Props) {
  const [hovered, setHovered] = useState<CategoryKey | null>(null);
  const { formatOdds: fmtOdds, oddsSuffix } = useFormatOdds();

  return (
    <div style={{
      display: "flex",
      gap: 8,
      overflowX: "auto",
      paddingBottom: 4,
      scrollbarWidth: "none",
    }}>
      {CATEGORIES.map((cat: CategoryMeta) => {
        const isActive = cat.key === active;
        const isHov = hovered === cat.key;
        const odds = oddsMap[cat.key];

        return (
          <button
            key={cat.key}
            className="tab-btn"
            data-active={isActive}
            onClick={() => onChange(cat.key)}
            onMouseEnter={() => setHovered(cat.key)}
            onMouseLeave={() => setHovered(null)}
            style={{
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 6,
              padding: "14px 20px",
              borderRadius: "var(--radius-lg)",
              border: `1px solid ${isActive ? cat.color + "55" : isHov ? "var(--border-hover)" : "var(--border)"}`,
              background: isActive
                ? cat.faint
                : isHov
                ? "var(--overlay-1)"
                : "transparent",
              cursor: "pointer",
              transition: "all 180ms var(--ease)",
              outline: "none",
              minWidth: 110,
              color: isActive ? cat.color : "var(--text-3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: isActive ? cat.color : isHov ? "var(--text-2)" : "var(--text-3)",
                transition: "all 180ms var(--ease)",
                flexShrink: 0,
                boxShadow: isActive ? `0 0 8px ${cat.color}66` : "none",
              }} />
              <span style={{
                fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700,
                color: isActive ? cat.color : isHov ? "var(--text-1)" : "var(--text-2)",
                transition: "color 180ms var(--ease)",
              }}>
                {cat.label}
              </span>
            </div>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500,
              color: isActive ? "var(--text-2)" : "var(--text-3)",
              lineHeight: 1.3,
            }}>
              {odds != null
                ? `${fmtOdds(odds)}${oddsSuffix} odds`
                : cat.riskLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}
