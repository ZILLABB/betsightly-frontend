import React from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Info,
  MinusCircle,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { CATEGORIES, type RolloverChainDay } from "../../types";
import type {
  CalibrationResponse,
  CategoryPerformance,
  CurrentPolicyPerformance,
  LeagueResultsResponse,
  ResultTotals,
  SettledLeg,
  SettledSlip,
} from "../../api/predictions";

export type ResultsRange = 7 | 30 | 90;
export type ResultStatusFilter = "all" | "won" | "lost" | "pending";
export type ResultProductFilter = "all" | "banker" | "2_odds" | "5_odds" | "10_odds" | "over_1_5";

const PRODUCT_ORDER: Exclude<ResultProductFilter, "all">[] = ["banker", "2_odds", "5_odds", "10_odds", "over_1_5"];

const STATUS = {
  won: { label: "Won", icon: CheckCircle2 },
  lost: { label: "Lost", icon: XCircle },
  pending: { label: "Pending", icon: Clock3 },
  void: { label: "Void", icon: MinusCircle },
} as const;

const categoryMeta = (key: string) => CATEGORIES.find(category => category.key === key);
const categoryLabel = (key: string) => categoryMeta(key)?.label ?? key.replaceAll("_", " ");

export const isSinglesSlip = (slip: Pick<SettledSlip, "category" | "presentation">) =>
  slip.presentation === "singles" || slip.category === "over_1_5";

const formatDate = (date: string, includeWeekday = true) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    ...(includeWeekday ? { weekday: "short" as const } : {}),
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

const percent = (value: number | null | undefined, digits = 1) =>
  value == null ? "—" : `${(value * 100).toFixed(digits)}%`;

const units = (value: number | null | undefined) => {
  if (value == null) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}u`;
};

function StatusBadge({ status }: { status: SettledSlip["status"] }) {
  const meta = STATUS[status] ?? STATUS.pending;
  const Icon = meta.icon;
  return (
    <span className={`results-status results-status--${status}`} aria-label={`Status: ${meta.label}`}>
      <Icon size={13} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function ResultsHero({
  range,
  onRangeChange,
  refreshing,
  onRefresh,
  lastUpdated,
}: {
  range: ResultsRange;
  onRangeChange: (range: ResultsRange) => void;
  refreshing: boolean;
  onRefresh: () => void;
  lastUpdated?: Date | null;
}) {
  return (
    <section className="results-hero" aria-labelledby="results-title">
      <div className="results-hero__copy">
        <p className="results-eyebrow"><BarChart3 size={14} aria-hidden="true" /> Track record</p>
        <h1 id="results-title">Results that stay on the record.</h1>
        <p>Every published BetSightly selection is archived and settled. Wins and losses remain visible.</p>
      </div>
      <div className="results-hero__controls">
        <fieldset className="results-range" aria-label="Results time period">
          <legend>Time period</legend>
          <div>
            {([7, 30, 90] as ResultsRange[]).map(days => (
              <button
                key={days}
                type="button"
                className={range === days ? "is-active" : ""}
                aria-pressed={range === days}
                onClick={() => onRangeChange(days)}
              >
                {days}D
              </button>
            ))}
          </div>
        </fieldset>
        <button className="results-refresh" type="button" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw size={14} className={refreshing ? "is-spinning" : ""} aria-hidden="true" />
          {refreshing ? "Refreshing…" : "Refresh results"}
        </button>
        <p className="results-updated" aria-live="polite">
          {lastUpdated
            ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : `Showing the last ${range} days`}
        </p>
      </div>
    </section>
  );
}

function RecordCard({ title, subtitle, totals, kind }: {
  title: string;
  subtitle: string;
  totals?: ResultTotals;
  kind: "slips" | "singles";
}) {
  if (!totals) {
    return (
      <article className="record-card">
        <p className="record-card__kind">{kind}</p>
        <h3>{title}</h3>
        <p className="record-card__empty">Awaiting verified totals from the results API.</p>
      </article>
    );
  }
  return (
    <article className="record-card">
      <div className="record-card__head">
        <div>
          <p className="record-card__kind">{kind}</p>
          <h3>{title}</h3>
        </div>
        <span className={`record-card__trend ${totals.profit > 0 ? "is-positive" : totals.profit < 0 ? "is-negative" : ""}`}>
          {totals.profit > 0 ? <TrendingUp size={14} /> : totals.profit < 0 ? <TrendingDown size={14} /> : <MinusCircle size={14} />}
          {units(totals.profit)}
        </span>
      </div>
      <div className="record-card__primary">
        <strong>{totals.settled}</strong>
        <span>settled {kind}</span>
      </div>
      <dl className="record-card__metrics">
        <div><dt>Record</dt><dd>{totals.won}W · {totals.lost}L</dd></div>
        <div><dt>{kind === "singles" ? "Hit rate" : "Win rate"}</dt><dd>{percent(totals.win_rate)}</dd></div>
        <div><dt>ROI</dt><dd>{percent(totals.roi)}</dd></div>
      </dl>
      <p className="record-card__note">{subtitle}</p>
    </article>
  );
}

export function RecordSummary({ results }: { results: LeagueResultsResponse | null }) {
  const totals = results?.totals;
  return (
    <section className="results-section" aria-labelledby="record-summary-title">
      <div className="results-section__heading">
        <div>
          <p className="results-kicker">Performance overview</p>
          <h2 id="record-summary-title">Two records, measured correctly</h2>
        </div>
        <p>One unit is tracked per published slip or independent single.</p>
      </div>
      <div className="record-grid">
        <RecordCard
          kind="slips"
          title="Accumulator record"
          subtitle="Banker, 2 Odds, 5 Odds and 10 Odds are settled as complete slips."
          totals={totals?.slips}
        />
        <RecordCard
          kind="singles"
          title="Over 1.5 singles"
          subtitle="Each Over 1.5 match is an independent one-unit selection."
          totals={totals?.picks}
        />
      </div>
      {totals && (
        <div className="combined-profit">
          <span>Total profit across both unit types</span>
          <strong className={totals.combined_profit > 0 ? "is-positive" : totals.combined_profit < 0 ? "is-negative" : ""}>
            {units(totals.combined_profit)}
          </strong>
          <small>Profit is additive; slip and singles win rates are never combined.</small>
        </div>
      )}
    </section>
  );
}

function ProductRow({ category, performance }: { category: string; performance: CategoryPerformance }) {
  const isSingles = performance.unit === "pick" || category === "over_1_5";
  return (
    <div className="product-row">
      <div className="product-row__name">
        <span className={`product-dot product-dot--${category}`} aria-hidden="true" />
        <div><strong>{categoryLabel(category)}</strong><small>{isSingles ? "Singles" : "Accumulator"}</small></div>
      </div>
      <div><span>Settled</span><strong>{performance.settled}</strong></div>
      <div><span>Record</span><strong>{performance.won}W–{performance.lost}L</strong></div>
      <div><span>{isSingles ? "Hit rate" : "Win rate"}</span><strong>{percent(performance.win_rate)}</strong></div>
      <div><span>Profit</span><strong className={performance.profit > 0 ? "is-positive" : performance.profit < 0 ? "is-negative" : ""}>{units(performance.profit)}</strong></div>
      <div><span>ROI</span><strong className={performance.roi > 0 ? "is-positive" : performance.roi < 0 ? "is-negative" : ""}>{percent(performance.roi)}</strong></div>
    </div>
  );
}

export function ProductPerformance({ summary }: { summary?: Record<string, CategoryPerformance> }) {
  const rows = PRODUCT_ORDER.flatMap(key => summary?.[key] ? [[key, summary[key]] as const] : []);
  if (!rows.length) return null;
  const maxAbsRoi = Math.max(...rows.map(([, row]) => Math.abs(row.roi || 0)), 0.01);
  return (
    <section className="results-section product-performance" aria-labelledby="product-performance-title">
      <div className="results-section__heading">
        <div><p className="results-kicker">By product</p><h2 id="product-performance-title">Performance comparison</h2></div>
        <p>Product type stays visible so high-odds slips are not compared like-for-like with singles.</p>
      </div>
      <div className="product-table" role="table" aria-label="Performance by product">
        {rows.map(([category, performance]) => <ProductRow key={category} category={category} performance={performance} />)}
      </div>
      <div className="roi-chart" role="img" aria-label="Return on investment comparison by product">
        <p className="roi-chart__title">ROI comparison</p>
        {rows.map(([category, performance]) => {
          const value = performance.roi || 0;
          const size = `${Math.max(2, Math.abs(value) / maxAbsRoi * 50)}%`;
          return (
            <div className="roi-bar" key={category} aria-label={`${categoryLabel(category)} ROI ${percent(value)}`}>
              <span>{categoryLabel(category)}</span>
              <div className="roi-bar__track">
                <i className={value >= 0 ? "is-positive" : "is-negative"} style={{ "--roi-size": size } as React.CSSProperties} />
              </div>
              <strong className={value > 0 ? "is-positive" : value < 0 ? "is-negative" : ""}>{percent(value)}</strong>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function calibrationLabel(predicted: number, actual: number | null, sample: number) {
  if (actual == null || sample < 30) return "Not enough data";
  const difference = actual - predicted;
  if (Math.abs(difference) <= 0.03) return "Well calibrated";
  return difference > 0 ? "Slightly conservative" : "Slightly overconfident";
}

export function CalibrationPanel({ calibration, unavailable }: { calibration: CalibrationResponse | null; unavailable?: boolean }) {
  return (
    <section className="results-section calibration-panel" aria-labelledby="calibration-title">
      <div className="results-section__heading">
        <div><p className="results-kicker">Model reliability</p><h2 id="calibration-title">How reliable are our confidence scores?</h2></div>
        <span className="window-badge">180-day calibration window</span>
      </div>
      <p className="calibration-intro">When BetSightly says a selection has a 70–80% chance, how often does that group actually win?</p>
      {!calibration || !calibration.buckets?.some(bucket => bucket.sample > 0) ? (
        <div className="section-notice" role="status">
          <Info size={16} aria-hidden="true" />
          {unavailable ? "Calibration is unavailable right now. The verified results above are unaffected." : "Calibration will appear after enough selections have settled."}
        </div>
      ) : (
        <div className="calibration-grid">
          {calibration.buckets.filter(bucket => bucket.sample > 0).map(bucket => {
            const difference = bucket.actual == null ? null : bucket.actual - bucket.predicted;
            return (
              <article className="calibration-bucket" key={bucket.range}>
                <div className="calibration-bucket__head"><strong>{bucket.range}</strong><span>{calibrationLabel(bucket.predicted, bucket.actual, bucket.sample)}</span></div>
                <dl>
                  <div><dt>Expected</dt><dd>{percent(bucket.predicted, 0)}</dd></div>
                  <div><dt>Actual</dt><dd>{percent(bucket.actual, 0)}</dd></div>
                  <div><dt>Sample</dt><dd>{bucket.sample} picks</dd></div>
                  <div><dt>Difference</dt><dd>{difference == null ? "—" : `${difference > 0 ? "+" : ""}${(difference * 100).toFixed(0)} pp`}</dd></div>
                </dl>
                <div className="calibration-bars" aria-label={`${bucket.range}: expected ${percent(bucket.predicted, 0)}, actual ${percent(bucket.actual, 0)}`}>
                  <span style={{ width: `${bucket.predicted * 100}%` }} />
                  <i style={{ width: `${(bucket.actual ?? 0) * 100}%` }} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function CurrentPolicyPanel({ policy }: { policy?: CurrentPolicyPerformance | null }) {
  if (!policy) return null;
  return (
    <details className="policy-panel">
      <summary><ShieldCheck size={15} aria-hidden="true" /><span>Methodology / Current engine</span><ChevronDown size={15} aria-hidden="true" /></summary>
      <div>
        <span className="policy-badge">Current selection policy</span>
        <strong>{policy.policy_version}</strong>
        <p>{policy.settled_slips} settled slips · {policy.settled_unique_forecasts} unique settled forecasts</p>
        <span className="sample-badge">{policy.readiness_label || `${policy.readiness} sample`}</span>
        {policy.message && <small>{policy.message}</small>}
      </div>
    </details>
  );
}

export function ResultsFilters({
  status,
  product,
  onStatusChange,
  onProductChange,
  showProduct = true,
}: {
  status: ResultStatusFilter;
  product: ResultProductFilter;
  onStatusChange: (status: ResultStatusFilter) => void;
  onProductChange: (product: ResultProductFilter) => void;
  showProduct?: boolean;
}) {
  return (
    <div className="results-filters">
      <fieldset><legend>Status</legend><div className="filter-chips">
        {(["all", "won", "lost", "pending"] as ResultStatusFilter[]).map(value => (
          <button key={value} type="button" aria-pressed={status === value} className={status === value ? "is-active" : ""} onClick={() => onStatusChange(value)}>{value[0].toUpperCase() + value.slice(1)}</button>
        ))}
      </div></fieldset>
      {showProduct && <fieldset><legend>Product</legend><div className="filter-chips">
        {(["all", ...PRODUCT_ORDER] as ResultProductFilter[]).map(value => (
          <button key={value} type="button" aria-pressed={product === value} className={product === value ? "is-active" : ""} onClick={() => onProductChange(value)}>{value === "all" ? "All products" : categoryLabel(value)}</button>
        ))}
      </div></fieldset>}
    </div>
  );
}

function ResultLeg({ leg, formatOdds, oddsSuffix }: { leg: SettledLeg; formatOdds: (odds: number) => string; oddsSuffix: string }) {
  const status = STATUS[leg.status] ?? STATUS.pending;
  const Icon = status.icon;
  return (
    <div className={`result-leg result-leg--${leg.status}`} aria-label={`${leg.home_team} vs ${leg.away_team}: ${leg.prediction}, ${status.label}`}>
      <div className="result-leg__fixture"><strong>{leg.home_team} <span>vs</span> {leg.away_team}</strong>{leg.league && <small>{leg.league}</small>}</div>
      <div className="result-leg__market"><span>{leg.prediction}</span>{leg.odds != null && <small>{formatOdds(leg.odds)}{oddsSuffix}</small>}</div>
      <span className="result-leg__outcome"><Icon size={15} aria-hidden="true" /> {status.label}</span>
    </div>
  );
}

export function ResultHistoryItem({ slip, formatOdds, oddsSuffix }: { slip: SettledSlip; formatOdds: (odds: number) => string; oddsSuffix: string }) {
  return (
    <details className={`history-item history-item--${slip.status}`}>
      <summary>
        <div className="history-date"><CalendarDays size={15} aria-hidden="true" /><span>{formatDate(slip.date)}</span></div>
        <div className="history-product"><strong>{categoryLabel(slip.category)}</strong><small>Accumulator</small></div>
        <div className="history-facts"><span>{slip.picks.length} leg{slip.picks.length === 1 ? "" : "s"}</span><span>{formatOdds(slip.total_odds)}{oddsSuffix}</span>{slip.hit_probability > 0 && <span>Expected {percent(slip.hit_probability, 0)}</span>}</div>
        <StatusBadge status={slip.status} />
        <ChevronDown className="history-chevron" size={17} aria-hidden="true" />
      </summary>
      <div className="history-legs">
        {slip.picks.map((leg, index) => <ResultLeg key={`${leg.match_id ?? index}-${leg.market ?? leg.prediction}`} leg={leg} formatOdds={formatOdds} oddsSuffix={oddsSuffix} />)}
      </div>
    </details>
  );
}

export function SinglesHistoryGroup({ slip, formatOdds, oddsSuffix }: { slip: SettledSlip; formatOdds: (odds: number) => string; oddsSuffix: string }) {
  const won = slip.picks.filter(pick => pick.status === "won").length;
  const lost = slip.picks.filter(pick => pick.status === "lost").length;
  const settled = won + lost;
  const pending = slip.picks.some(pick => pick.status === "pending");
  return (
    <details className={`history-item history-item--singles history-item--${slip.status}`}>
      <summary>
        <div className="history-date"><CalendarDays size={15} aria-hidden="true" /><span>{formatDate(slip.date)}</span></div>
        <div className="history-product"><strong>Over 1.5 singles</strong><small>Independent selections</small></div>
        <div className="history-facts"><span>{won} won</span><span>{lost} lost</span><span>{settled ? `${Math.round(won / settled * 100)}% hit rate` : "Awaiting results"}</span></div>
        <StatusBadge status={pending ? "pending" : slip.status} />
        <ChevronDown className="history-chevron" size={17} aria-hidden="true" />
      </summary>
      <div className="history-legs">
        {slip.picks.map((leg, index) => <ResultLeg key={`${leg.match_id ?? index}-${leg.market ?? leg.prediction}`} leg={leg} formatOdds={formatOdds} oddsSuffix={oddsSuffix} />)}
      </div>
    </details>
  );
}

export interface RolloverChainGroup {
  chainStart: string;
  days: RolloverChainDay[];
  status: "won" | "lost" | "pending";
}

export function groupRolloverChains(days: RolloverChainDay[]): RolloverChainGroup[] {
  const grouped = new Map<string, RolloverChainDay[]>();
  days.forEach(day => {
    const key = day.chain_start_date || `legacy-${day.date}`;
    grouped.set(key, [...(grouped.get(key) || []), day]);
  });
  return [...grouped.entries()].map(([key, chainDays]) => {
    const sorted = chainDays.sort((a, b) => a.day_number - b.day_number);
    const status = sorted.some(day => day.status === "lost")
      ? "lost"
      : sorted.length >= 3 && sorted.slice(0, 3).every(day => day.status === "won") ? "won" : "pending";
    return { chainStart: key.startsWith("legacy-") ? sorted[0].date : key, days: sorted, status };
  }).sort((a, b) => b.chainStart.localeCompare(a.chainStart));
}

export function RolloverChainResult({ chain, formatOdds, oddsSuffix }: { chain: RolloverChainGroup; formatOdds: (odds: number) => string; oddsSuffix: string }) {
  const wonDays = chain.days.filter(day => day.status === "won").length;
  const failedDay = chain.days.find(day => day.status === "lost");
  const activeDay = Math.min(3, chain.days.find(day => day.status === "pending")?.day_number ?? wonDays + 1);
  const headline = chain.status === "won"
    ? "3 / 3 days won · Chain completed"
    : chain.status === "lost"
      ? `Chain failed on Day ${failedDay?.day_number ?? "—"}`
      : `Day ${activeDay} of 3 · ${Math.max(0, 3 - activeDay)} day${3 - activeDay === 1 ? "" : "s"} remaining`;
  return (
    <article className={`rollover-chain rollover-chain--${chain.status}`}>
      <header><div><p>Rollover</p><h3>Started {formatDate(chain.chainStart, false)}</h3><span>{headline}</span></div><StatusBadge status={chain.status} /></header>
      <div className="rollover-days">
        {chain.days.map(day => (
          <details key={`${chain.chainStart}-${day.day_number}-${day.date}`}>
            <summary>
              <span className={`rollover-day-number rollover-day-number--${day.status}`}>Day {day.day_number}</span>
              <strong>{formatDate(day.date)}</strong>
              <span>{day.picks.length} pick{day.picks.length === 1 ? "" : "s"}</span>
              <span>{formatOdds(day.combined_odds)}{oddsSuffix}</span>
              <StatusBadge status={day.status} />
              <ChevronDown size={16} aria-hidden="true" />
            </summary>
            <div className="history-legs">
              {day.picks.map((pick, index) => <ResultLeg key={`${pick.match_id}-${index}`} leg={{ ...pick, status: pick.status ?? "pending" }} formatOdds={formatOdds} oddsSuffix={oddsSuffix} />)}
            </div>
          </details>
        ))}
      </div>
    </article>
  );
}
