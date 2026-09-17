import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Trophy } from "lucide-react";
import { SEO } from "../components/common/SEO";
import { BrandLoader } from "../components/ui/BrandLoader";
import { useFormatOdds } from "../hooks/useFormatOdds";
import {
  CalibrationPanel,
  CurrentPolicyPanel,
  groupRolloverChains,
  isSinglesSlip,
  ProductPerformance,
  RecordSummary,
  ResultHistoryItem,
  ResultsFilters,
  ResultsHero,
  RolloverChainResult,
  SinglesHistoryGroup,
  type ResultProductFilter,
  type ResultsRange,
  type ResultStatusFilter,
} from "../components/results/ResultsDashboard";
import "../components/results/results.css";
import {
  api,
  type CalibrationResponse,
  type CurrentPolicyPerformance,
  type LeagueResultsResponse,
} from "../api/predictions";

type ResultsTab = "products" | "rollover";

export function ResultsPage() {
  const { formatOdds, oddsSuffix } = useFormatOdds();
  const [range, setRange] = useState<ResultsRange>(30);
  const [tab, setTab] = useState<ResultsTab>("products");
  const [statusFilter, setStatusFilter] = useState<ResultStatusFilter>("all");
  const [productFilter, setProductFilter] = useState<ResultProductFilter>("all");
  const [results, setResults] = useState<LeagueResultsResponse | null>(null);
  const [calibration, setCalibration] = useState<CalibrationResponse | null>(null);
  const [currentPolicy, setCurrentPolicy] = useState<CurrentPolicyPerformance | null>(null);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [resultsError, setResultsError] = useState(false);
  const [calibrationError, setCalibrationError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    setResultsLoading(true);
    setResultsError(false);
    api.getLeagueResults(range)
      .then(response => {
        if (!active) return;
        setResults(response);
        setLastUpdated(new Date());
      })
      .catch(() => { if (active) setResultsError(true); })
      .finally(() => { if (active) setResultsLoading(false); });
    return () => { active = false; };
  }, [range]);

  useEffect(() => {
    let active = true;
    api.getCalibration(180)
      .then(response => { if (active) setCalibration(response); })
      .catch(() => { if (active) setCalibrationError(true); });
    api.getPerformance(90)
      .then(response => { if (active) setCurrentPolicy(response.current_policy ?? null); })
      .catch(() => { /* Progressive enhancement: older backends omit this endpoint. */ });
    return () => { active = false; };
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setCalibrationError(false);
    const [resultsResponse, calibrationResponse, performanceResponse] = await Promise.allSettled([
      api.getLeagueResults(range),
      api.getCalibration(180),
      api.getPerformance(90),
    ]);
    if (resultsResponse.status === "fulfilled") {
      setResults(resultsResponse.value);
      setResultsError(false);
      setLastUpdated(new Date());
    } else {
      setResultsError(true);
    }
    if (calibrationResponse.status === "fulfilled") {
      setCalibration(calibrationResponse.value);
    } else {
      setCalibrationError(true);
    }
    if (performanceResponse.status === "fulfilled") {
      setCurrentPolicy(performanceResponse.value.current_policy ?? null);
    }
    setRefreshing(false);
  }, [range]);

  const filteredHistory = useMemo(() => {
    const history = [...(results?.history ?? [])].sort((a, b) => b.date.localeCompare(a.date));
    return history.filter(slip =>
      (statusFilter === "all" || slip.status === statusFilter) &&
      (productFilter === "all" || slip.category === productFilter)
    );
  }, [results, statusFilter, productFilter]);

  const rolloverChains = useMemo(() => {
    const chains = groupRolloverChains(results?.rollover_history ?? []);
    return statusFilter === "all" ? chains : chains.filter(chain => chain.status === statusFilter);
  }, [results, statusFilter]);

  return (
    <div className="results-page">
      <SEO
        title="Results"
        description="The public BetSightly track record: settled accumulator slips, Over 1.5 singles, calibration and rollover chains."
        path="/results"
      />

      <ResultsHero range={range} onRangeChange={setRange} refreshing={refreshing} onRefresh={refresh} lastUpdated={lastUpdated} />

      <nav className="results-tabs" aria-label="Results sections">
        <button type="button" className={tab === "products" ? "is-active" : ""} aria-pressed={tab === "products"} onClick={() => setTab("products")}>Product results</button>
        <button type="button" className={tab === "rollover" ? "is-active" : ""} aria-pressed={tab === "rollover"} onClick={() => setTab("rollover")}>Rollover chains</button>
      </nav>

      {resultsError && <div className="results-error" role="alert"><AlertCircle size={17} aria-hidden="true" />Results are unavailable right now. Previously loaded figures remain visible when available.</div>}

      {tab === "products" ? (
        <>
          <RecordSummary results={results} />
          <ProductPerformance summary={results?.summary} />
          <CalibrationPanel calibration={calibration} unavailable={calibrationError} />
          <CurrentPolicyPanel policy={currentPolicy} />

          <section className="results-history" aria-labelledby="results-history-title">
            <div className="results-history__heading">
              <div><p className="results-kicker">Published history</p><h2 id="results-history-title">What happened each day</h2></div>
              <p>Open any row to inspect every selection. Losing legs stay clearly marked.</p>
            </div>
            <ResultsFilters status={statusFilter} product={productFilter} onStatusChange={setStatusFilter} onProductChange={setProductFilter} />
            {resultsLoading && !results ? (
              <BrandLoader message="Loading verified results…">
                <div className="history-list">{[1, 2, 3].map(item => <div className="skeleton" style={{ height: 72, borderRadius: 13 }} key={item} />)}</div>
              </BrandLoader>
            ) : filteredHistory.length ? (
              <div className="history-list">
                {filteredHistory.map((slip, index) => isSinglesSlip(slip)
                  ? <SinglesHistoryGroup key={`${slip.archive_id ?? index}-${slip.date}-${slip.category}`} slip={slip} formatOdds={formatOdds} oddsSuffix={oddsSuffix} />
                  : <ResultHistoryItem key={`${slip.archive_id ?? index}-${slip.date}-${slip.category}`} slip={slip} formatOdds={formatOdds} oddsSuffix={oddsSuffix} />
                )}
              </div>
            ) : (
              <div className="results-empty"><Trophy size={26} aria-hidden="true" /><h3>No matching results</h3><p>{results?.history?.length ? "Try another status or product filter." : "Published selections will appear here as soon as verified results are available."}</p></div>
            )}
          </section>
        </>
      ) : (
        <section className="results-history" aria-labelledby="rollover-history-title">
          <div className="results-history__heading">
            <div><p className="results-kicker">Three-day challenge</p><h2 id="rollover-history-title">Rollover chain history</h2></div>
            <p>Each chain is one challenge. Expand a day to inspect its individual legs.</p>
          </div>
          <ResultsFilters status={statusFilter} product="all" onStatusChange={setStatusFilter} onProductChange={() => undefined} showProduct={false} />
          {resultsLoading && !results ? (
            <BrandLoader message="Loading verified rollover results…" />
          ) : rolloverChains.length ? (
            <div className="rollover-list">{rolloverChains.map(chain => <RolloverChainResult key={chain.chainStart} chain={chain} formatOdds={formatOdds} oddsSuffix={oddsSuffix} />)}</div>
          ) : (
            <div className="results-empty"><Trophy size={26} aria-hidden="true" /><h3>No matching rollover chains</h3><p>Try another status filter, or return after the current three-day chain has begun.</p></div>
          )}
        </section>
      )}
    </div>
  );
}
