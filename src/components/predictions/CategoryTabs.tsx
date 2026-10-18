import type { CategoryKey, CategoryMeta } from "../../types";
import { CATEGORIES } from "../../types";
import { useFormatOdds } from "../../hooks/useFormatOdds";

interface Props {
  active: CategoryKey;
  onChange: (key: CategoryKey) => void;
  oddsMap?: Partial<Record<CategoryKey, number>>;
  singlesMap?: Partial<Record<CategoryKey, number>>;
  availabilityMap?: Partial<Record<CategoryKey, boolean>>;
}
const TARGETS: Partial<Record<CategoryKey, number>> = {
  "2_odds": 2,
  "5_odds": 5,
  "10_odds": 10,
};

export function CategoryTabs({
  active, onChange, oddsMap = {}, singlesMap = {}, availabilityMap = {},
}: Props) {
  const { formatOdds, oddsSuffix } = useFormatOdds();
  return (
    <nav className="editorial-tiers" aria-label="Prediction categories">
      {CATEGORIES.map((category: CategoryMeta) => {
        const selected = category.key === active;
        const odds = oddsMap[category.key];
        const singlesCount = singlesMap[category.key];
        const target = TARGETS[category.key];
        const belowTarget = target != null && odds != null && odds > 0 && odds < target;
        const available = availabilityMap[category.key] !== false;
        const detail = !available
          ? "Unavailable"
          : singlesCount != null && singlesCount > 0
            ? `${singlesCount} ${singlesCount === 1 ? "single" : "singles"}`
            : odds != null && Number.isFinite(odds) && odds > 0
              ? `${belowTarget ? "Best " : ""}${formatOdds(odds)}${oddsSuffix}`
              : category.riskLabel;
        return (
          <button
            key={category.key}
            type="button"
            className="editorial-tiers__item"
            aria-pressed={selected}
            data-active={selected}
            onClick={() => onChange(category.key)}
          >
            <span className="editorial-tiers__title">{category.label}</span>
            <span className="editorial-tiers__detail">{detail}</span>
          </button>
        );
      })}
    </nav>
  );
}
