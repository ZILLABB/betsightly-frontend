import {
  CalendarDays,
  Check,
  ChevronDown,
  ListChecks,
  MousePointer2,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
} from "lucide-react";
import { useMemo, useState } from "react";

import { api } from "../../api/predictions";
import type {
  BuilderV2Candidate,
  BuilderV2Filters,
  BuilderV2Horizon,
  BuilderV2Mode,
} from "../../api/predictions";
import { useBuilder } from "../../contexts/BuilderContextInstance";
import "../../styles/builder-v2.css";

const TARGETS = [10, 20, 30, 50, 70, 100];
const GAME_COUNTS = [10, 20, 30, 50];
const STRONGEST_COUNTS = [5, 10, 20, 30];

const MODES: Array<{
  key: BuilderV2Mode;
  label: string;
  copy: string;
  icon: typeof Target;
}> = [
  { key: "target_odds", label: "Target Odds", copy: "Build toward a multiplier", icon: Target },
  { key: "game_count", label: "Number of Games", copy: "Choose 1–50 games", icon: ListChecks },
  { key: "strongest", label: "Strongest Picks", copy: "Take the best available", icon: Sparkles },
  { key: "manual", label: "Pick My Games", copy: "Choose from approved picks", icon: MousePointer2 },
];

const MARKETS = [
  ["over_1_5", "Over 1.5"],
  ["over_2_5", "Over 2.5"],
  ["under_3_5", "Under 3.5"],
  ["under_4_5", "Under 4.5"],
  ["home_or_draw", "Home / Draw"],
  ["away_or_draw", "Away / Draw"],
  ["dnb_home", "Home DNB"],
  ["dnb_away", "Away DNB"],
  ["home_win", "Home Win"],
  ["away_win", "Away Win"],
  ["home_over_0_5", "Home O0.5"],
  ["away_over_0_5", "Away O0.5"],
] as const;

const backendHorizon = (value: "today" | "3_days" | "week"): BuilderV2Horizon =>
  value === "week" ? "7_days" : value;

const horizonLabel = (value: "today" | "3_days" | "week") =>
  value === "today" ? "Today" : value === "3_days" ? "3 days" : "7 days";

const candidateText = (candidate: BuilderV2Candidate) =>
  `${candidate.home_team || ""} ${candidate.away_team || ""} ${candidate.league || ""} ${candidate.prediction || ""}`.toLowerCase();

export function BuilderV2Controls() {
  const {
    target,
    horizon,
    loading,
    chooseTarget,
    chooseHorizon,
    buildV2,
    clearSlip,
  } = useBuilder();

  const [mode, setMode] = useState<BuilderV2Mode>("target_odds");
  const [customTarget, setCustomTarget] = useState("");
  const [gameCount, setGameCount] = useState(20);
  const [maxGames, setMaxGames] = useState(10);
  const [markets, setMarkets] = useState<string[]>([]);
  const [minOdds, setMinOdds] = useState("");
  const [maxOdds, setMaxOdds] = useState("");
  const [minProbability, setMinProbability] = useState("");
  const [minTrustGrade, setMinTrustGrade] = useState<"A" | "B">("B");
  const [candidates, setCandidates] = useState<BuilderV2Candidate[]>([]);
  const [candidateStatus, setCandidateStatus] = useState<string | null>(null);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [candidateSearch, setCandidateSearch] = useState("");

  const filters = useMemo<BuilderV2Filters>(() => ({
    horizon: backendHorizon(horizon),
    markets,
    min_odds: minOdds ? Number(minOdds) : undefined,
    max_odds: maxOdds ? Number(maxOdds) : undefined,
    min_probability: minProbability ? Number(minProbability) / 100 : undefined,
    min_trust_grade: minTrustGrade,
    require_bookable: true,
  }), [horizon, markets, minOdds, maxOdds, minProbability, minTrustGrade]);

   const invalidateManual = () => {
    setCandidates([]);
    setSelectedIds([]);
    setCandidateStatus(null);
  };

  const advancedFilterCount = [
    minOdds,
    maxOdds,
    minProbability,
    minTrustGrade === "A",
  ].filter(Boolean).length;

  const resetAdvancedFilters = () => {
    setMinOdds("");
    setMaxOdds("");
    setMinProbability("");
    setMinTrustGrade("B");
    clearSlip();
    invalidateManual();
  };

  const changeMode = (next: BuilderV2Mode) => {
    setMode(next);
    clearSlip();
    invalidateManual();
  };

  const changeHorizon = (next: "today" | "3_days" | "week") => {
    chooseHorizon(next);
    invalidateManual();
  };

  const toggleMarket = (market: string) => {
    setMarkets((current) =>
      current.includes(market)
        ? current.filter((item) => item !== market)
        : [...current, market],
    );
    clearSlip();
    invalidateManual();
  };

  const submitAuto = async () => {
    if (mode === "target_odds") {
      await buildV2({
        ...filters,
        mode,
        target_odds: target,
      });
      return;
    }
    if (mode === "game_count") {
      await buildV2({ ...filters, mode, game_count: gameCount });
      return;
    }
    if (mode === "strongest") {
      await buildV2({ ...filters, mode, max_games: maxGames });
    }
  };

  const loadCandidates = async () => {
    setCandidateLoading(true);
    setCandidateStatus(null);
    setSelectedIds([]);
    try {
      const response = await api.getBuilderV2Candidates(filters);
      setCandidates(response.candidates || []);
      setCandidateStatus(
        response.status === "success"
          ? `${response.candidate_count ?? response.candidates.length} approved selections available`
          : response.reason || "No approved selections are available right now.",
      );
    } catch {
      setCandidates([]);
      setCandidateStatus("Could not load the approved game board. Try again.");
    } finally {
      setCandidateLoading(false);
    }
  };

  const toggleCandidate = (selectionId: string) => {
    setSelectedIds((current) => {
      if (current.includes(selectionId)) {
        return current.filter((item) => item !== selectionId);
      }

      if (current.length >= 50) return current;

      const candidate = candidates.find(
        (item) => String(item.selection_id || "") === selectionId,
      );

      if (!candidate) return current;

      const fixtureId = String(
        candidate.match_id || candidate.fixture_id || "",
      );

      const sameFixtureSelection = current.find((id) => {
        const selected = candidates.find(
          (item) => String(item.selection_id || "") === id,
        );

        return selected && String(
          selected.match_id || selected.fixture_id || "",
        ) === fixtureId;
      });

      // Manual Builder allows only one market per fixture. Selecting another
      // approved market for the same game replaces the previous UI selection
      // instead of sending an invalid duplicate-fixture request to the server.
      if (sameFixtureSelection) {
        return [
          ...current.filter((id) => id !== sameFixtureSelection),
          selectionId,
        ];
      }

      return [...current, selectionId];
    });
  };

  const submitManual = async () => {
    if (!selectedIds.length) return;
    await buildV2({
      ...filters,
      mode: "manual",
      selection_ids: selectedIds,
    });
  };

  const visibleCandidates = candidates
    .filter((candidate) =>
      !candidateSearch.trim() ||
      candidateText(candidate).includes(candidateSearch.trim().toLowerCase()),
    )
    .slice(0, 120);

  const submitLabel =
    mode === "target_odds"
      ? `Build my ${target}x slip`
      : mode === "game_count"
        ? `Build best ${gameCount} games`
        : `Build strongest ${maxGames} picks`;

  return (
    <section className="builder-config builder-v2-config" aria-labelledby="builder-config-title">
      <div className="builder-v2-heading">
        <div>
          <span className="builder-eyebrow">Builder V2</span>
          <h2 id="builder-config-title">Choose how you want to build</h2>
        </div>
        <p>Structure is your choice. Quality and exact SportyBet bookability stay enforced.</p>
      </div>

      <div className="builder-v2-modes" role="group" aria-label="Builder mode">
        {MODES.map(({ key, label, copy, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={mode === key ? "is-active" : ""}
            aria-pressed={mode === key}
            onClick={() => changeMode(key)}
          >
            <Icon size={17} />
            <span><strong>{label}</strong><small>{copy}</small></span>
          </button>
        ))}
      </div>

      <div className="builder-v2-panel">
        {mode === "target_odds" && (
          <>
            <div className="builder-v2-label-row">
              <strong>Target odds</strong>
              <span>2x–200x · best reachable is shown honestly</span>
            </div>
            <div className="builder-targets builder-v2-targets" role="group" aria-label="Target odds">
              {TARGETS.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={value === target ? "is-active" : ""}
                  aria-pressed={value === target}
                  onClick={() => {
                    chooseTarget(value);
                    setCustomTarget("");
                  }}
                >
                  <strong>{value}x</strong>
                  <span>{value <= 20 ? "Lower target" : value <= 50 ? "Balanced" : "High target"}</span>
                </button>
              ))}
            </div>
            <div className="builder-custom-target builder-v2-custom">
              <label htmlFor="builder-custom-target">Custom target (2x–200x)</label>
              <div>
                <input
                  id="builder-custom-target"
                  type="number"
                  min="2"
                  max="200"
                  step="0.01"
                  inputMode="decimal"
                  value={customTarget}
                  placeholder="e.g. 125"
                  onChange={(event) => setCustomTarget(event.target.value)}
                />
                <button
                  type="button"
                  disabled={loading || Number(customTarget) < 2 || Number(customTarget) > 200}
                  onClick={() => {
                    chooseTarget(Number(customTarget));
                    setCustomTarget("");
                  }}
                >
                  Use target
                </button>
              </div>
              {!TARGETS.includes(target) && (
                <span className="builder-v2-active-custom">
                  Active custom target · {target}x
                </span>
              )}
            </div>
          </>
        )}

        {mode === "game_count" && (
          <div className="builder-v2-number">
            <div className="builder-v2-label-row">
              <label htmlFor="builder-game-count"><strong>Number of games</strong></label>
              <span>If fewer qualify, BetSightly returns fewer.</span>
            </div>
            <input
              id="builder-game-count"
              aria-label="Number of games"
              type="number"
              min="1"
              max="50"
              value={gameCount}
              onChange={(event) => setGameCount(Math.max(1, Math.min(50, Number(event.target.value) || 1)))}
            />
            <div className="builder-v2-pills">
              {GAME_COUNTS.map((value) => (
                <button key={value} type="button" className={gameCount === value ? "is-active" : ""}
                  onClick={() => setGameCount(value)}>{value}</button>
              ))}
            </div>
          </div>
        )}

        {mode === "strongest" && (
          <div className="builder-v2-number">
            <div className="builder-v2-label-row">
              <label htmlFor="builder-strongest-count"><strong>Maximum picks</strong></label>
              <span>Ranked by conservative probability and trust.</span>
            </div>
            <input
              id="builder-strongest-count"
              aria-label="Maximum strongest picks"
              type="number"
              min="1"
              max="50"
              value={maxGames}
              onChange={(event) => setMaxGames(Math.max(1, Math.min(50, Number(event.target.value) || 1)))}
            />
            <div className="builder-v2-pills">
              {STRONGEST_COUNTS.map((value) => (
                <button key={value} type="button" className={maxGames === value ? "is-active" : ""}
                  onClick={() => setMaxGames(value)}>{value}</button>
              ))}
            </div>
          </div>
        )}

        {mode === "manual" && (
          <div className="builder-v2-manual-intro">
            <MousePointer2 size={18} />
            <div>
              <strong>Choose only from approved selections</strong>
              <span>One market per fixture. Up to 50 selections. No client-entered odds.</span>
            </div>
          </div>
        )}
      </div>

      <div className="builder-v2-section">
        <div className="builder-v2-label-row">
          <strong>Markets</strong>
          <span>{markets.length ? `${markets.length} selected` : "All eligible markets"}</span>
        </div>
        <div className="builder-v2-market-grid" role="group" aria-label="Markets">
          <button
            type="button"
            className={!markets.length ? "is-active" : ""}
            aria-pressed={!markets.length}
            onClick={() => { setMarkets([]); clearSlip(); invalidateManual(); }}
          >
            All eligible markets
          </button>
          {MARKETS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={markets.includes(key) ? "is-active" : ""}
              aria-pressed={markets.includes(key)}
              onClick={() => toggleMarket(key)}
            >
              {markets.includes(key) && <Check size={13} />}{label}
            </button>
          ))}
        </div>

        {mode === "game_count" && markets.length > 1 && (
          <p className="builder-v2-market-note">
            BetSightly will balance these markets as evenly as quality and exact
            SportyBet availability allow. If one market has too few qualifying
            selections, the remaining slots stay within your other selected markets.
          </p>
        )}

        {mode === "strongest" && markets.length > 1 && (
          <p className="builder-v2-market-note">
            These markets are allowed, but Strongest Picks remains quality-first.
            BetSightly will not force an artificial market split.
          </p>
        )}
      </div>

      <div className="builder-v2-section">
        <div className="builder-v2-label-row">
          <strong>Fixture window</strong>
          <span>{horizonLabel(horizon)}</span>
        </div>
        <div className="builder-horizons builder-v2-horizons" role="group" aria-label="Fixture window">
          {([
            ["today", "Today only", "Fastest settlement"],
            ["3_days", "Across 3 days", "More games, still compact"],
            ["week", "Across 7 days", "Deepest qualifying board"],
          ] as const).map(([value, label, copy]) => (
            <button
              key={value}
              type="button"
              className={horizon === value ? "is-active" : ""}
              aria-pressed={horizon === value}
              onClick={() => changeHorizon(value)}
            >
              <CalendarDays size={18} />
              <span><strong>{label}</strong><small>{copy}</small></span>
            </button>
          ))}
        </div>
      </div>

      <details className="builder-v2-advanced">
        <summary>
          <SlidersHorizontal size={16} />
          <span>Advanced filters</span>
          {advancedFilterCount > 0 && (
            <span className="builder-v2-filter-count">{advancedFilterCount}</span>
          )}
          <ChevronDown size={15} />
        </summary>

        <div className="builder-v2-advanced-toolbar">
          <span>
            Optional refinements. BetSightly's system quality floor still applies.
          </span>

          {advancedFilterCount > 0 && (
            <button type="button" onClick={resetAdvancedFilters}>
              <RotateCcw size={13} />
              Reset filters
            </button>
          )}
        </div>

        <div className="builder-v2-advanced-grid">
          <label>
            <span>Min odds</span>
            <input
              type="number"
              min="1.01"
              step="0.01"
              value={minOdds}
              onChange={(event) => {
                setMinOdds(event.target.value);
                clearSlip();
                invalidateManual();
              }}
              placeholder="Any"
            />
          </label>

          <label>
            <span>Max odds</span>
            <input
              type="number"
              min="1.01"
              step="0.01"
              value={maxOdds}
              onChange={(event) => {
                setMaxOdds(event.target.value);
                clearSlip();
                invalidateManual();
              }}
              placeholder="Any"
            />
          </label>

          <label>
            <span>Min probability %</span>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={minProbability}
              onChange={(event) => {
                setMinProbability(event.target.value);
                clearSlip();
                invalidateManual();
              }}
              placeholder="System floor"
            />
          </label>

          <div className="builder-v2-trust-field">
            <span>Trust grade</span>
            <div
              className="builder-v2-segmented"
              role="group"
              aria-label="Minimum trust grade"
            >
              <button
                type="button"
                className={minTrustGrade === "B" ? "is-active" : ""}
                aria-pressed={minTrustGrade === "B"}
                onClick={() => {
                  setMinTrustGrade("B");
                  clearSlip();
                  invalidateManual();
                }}
              >
                A or B
              </button>

              <button
                type="button"
                className={minTrustGrade === "A" ? "is-active" : ""}
                aria-pressed={minTrustGrade === "A"}
                onClick={() => {
                  setMinTrustGrade("A");
                  clearSlip();
                  invalidateManual();
                }}
              >
                A only
              </button>
            </div>
          </div>
        </div>
      </details>

      {mode !== "manual" ? (
        <button className="builder-submit builder-v2-submit" type="button"
          onClick={() => void submitAuto()} disabled={loading}>
          <Target size={18} />
          {loading ? "Checking the board…" : submitLabel}
        </button>
      ) : (
        <div className="builder-v2-manual">
          <button className="builder-submit builder-v2-submit" type="button"
            onClick={() => void loadCandidates()} disabled={candidateLoading || loading}>
            <Search size={18} />
            {candidateLoading ? "Loading approved games…" : "Browse approved games"}
          </button>
          {candidateStatus && <p className="builder-v2-candidate-status">{candidateStatus}</p>}
          {!!candidates.length && (
            <>
              <label className="builder-v2-search">
                <Search size={15} />
                <input
                  aria-label="Search approved games"
                  value={candidateSearch}
                  onChange={(event) => setCandidateSearch(event.target.value)}
                  placeholder="Search team, league or market"
                />
              </label>
              <div className="builder-v2-candidates" aria-label="Approved game selections">
                {visibleCandidates.map((candidate) => {
                  const id = String(candidate.selection_id || "");
                  const selected = selectedIds.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      className={selected ? "is-selected" : ""}
                      aria-pressed={selected}
                      disabled={!id || (!selected && selectedIds.length >= 50)}
                      onClick={() => toggleCandidate(id)}
                    >
                      <span className="builder-v2-candidate-check">{selected ? <Check size={14} /> : null}</span>
                      <span className="builder-v2-candidate-main">
                        <strong>{candidate.home_team} v {candidate.away_team}</strong>
                        <small>{candidate.league} · {candidate.prediction}</small>
                      </span>
                      <span className="builder-v2-candidate-meta">
                        <strong>{candidate.odds?.toFixed?.(2) ?? candidate.odds ?? "—"}</strong>
                        <small>
                          {candidate.trust_grade ? `Grade ${candidate.trust_grade}` : ""}
                          {candidate.recommended_for_fixture ? " · Recommended" : ""}
                        </small>
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                className="builder-submit builder-v2-submit"
                type="button"
                disabled={loading || selectedIds.length === 0}
                onClick={() => void submitManual()}
              >
                <ListChecks size={18} />
                {loading
                  ? "Validating your games…"
                  : `Build ${selectedIds.length} selected ${selectedIds.length === 1 ? "game" : "games"}`}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
