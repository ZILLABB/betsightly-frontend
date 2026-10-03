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
  BuilderV2FillStrategy,
  BuilderV2Filters,
  BuilderV2Horizon,
  BuilderV2Mode,
} from "../../api/predictions";
import { useBuilder } from "../../contexts/BuilderContextInstance";
import "../../styles/builder-v2.css";

const TARGETS = [2, 5, 10, 20, 30, 50, 70, 100, 200];
const GAME_COUNTS = [5, 10, 15, 20, 30, 40, 50];
const STRONGEST_COUNTS = [5, 10, 20, 30];
const MANUAL_PAGE_SIZE = 20;

const MODES: Array<{
  key: BuilderV2Mode;
  label: string;
  copy: string;
  icon: typeof Target;
}> = [
  { key: "target_odds", label: "Target Odds", copy: "Choose a multiplier; BetSightly finds the strongest qualifying combination it can support.", icon: Target },
  { key: "game_count", label: "Number of Games", copy: "Choose how many games and, optionally, which markets shape the slip.", icon: ListChecks },
  { key: "strongest", label: "Strongest Picks", copy: "Let BetSightly choose the strongest qualifying market for each fixture.", icon: Sparkles },
  { key: "manual", label: "Pick My Games", copy: "You choose selections; BetSightly validates and books that exact combination.", icon: MousePointer2 },
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

const candidateFixtureId = (candidate?: BuilderV2Candidate) =>
  String(candidate?.match_id || candidate?.fixture_id || "");

const parseFilterList = (value: string) =>
  value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

type ManualRecoveryAction = "REMOVE" | "REPLACE" | "SAFER_MARKET";

interface ManualRecoverySelection {
  selection_id?: string;
  fixture_id?: string;
  reason?: string;
  actions?: ManualRecoveryAction[];
}

interface ManualRecoverySlip {
  mode?: BuilderV2Mode;
  status?: string;
  reason?: string;
  valid_count?: number;
  invalid_selections?: ManualRecoverySelection[];
  actions?: ManualRecoveryAction[];
}

export function BuilderV2Controls() {
  const {
    target,
    horizon,
    slip,
    loading,
    chooseTarget,
    chooseHorizon,
    buildV2,
    clearSlip,
  } = useBuilder();

  const restoredMode: BuilderV2Mode =
    slip?.mode === "manual" ||
    slip?.mode === "game_count" ||
    slip?.mode === "strongest" ||
    slip?.mode === "target_odds"
      ? slip.mode
      : "target_odds";

  const [mode, setMode] = useState<BuilderV2Mode>(restoredMode);
  const [customTarget, setCustomTarget] = useState("");
  const [gameCount, setGameCount] = useState(20);
  const [fillStrategy, setFillStrategy] =
    useState<BuilderV2FillStrategy>("strict_selected_markets");
  const [maxGames, setMaxGames] = useState(10);
  const [markets, setMarkets] = useState<string[]>([]);
  const [minOdds, setMinOdds] = useState("");
  const [maxOdds, setMaxOdds] = useState("");
  const [minProbability, setMinProbability] = useState("");
  const [minTrustGrade, setMinTrustGrade] = useState<"A" | "B">("B");
  const [includeLeagues, setIncludeLeagues] = useState("");
  const [excludeLeagues, setExcludeLeagues] = useState("");
  const [excludeFixtureIds, setExcludeFixtureIds] = useState("");
  const [excludeTeams, setExcludeTeams] = useState("");
  const [candidates, setCandidates] = useState<BuilderV2Candidate[]>([]);
  const [candidateStatus, setCandidateStatus] = useState<string | null>(null);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [recoveryFixtureIds, setRecoveryFixtureIds] = useState<string[]>([]);
  const [manualPage, setManualPage] = useState(1);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [replacementNotice, setReplacementNotice] = useState<string | null>(null);

  const filters = useMemo<BuilderV2Filters>(() => ({
    horizon: backendHorizon(horizon),
    markets,
    min_odds: minOdds ? Number(minOdds) : undefined,
    max_odds: maxOdds ? Number(maxOdds) : undefined,
    min_probability: minProbability ? Number(minProbability) / 100 : undefined,
    min_trust_grade: minTrustGrade,
    include_leagues: parseFilterList(includeLeagues),
    exclude_leagues: parseFilterList(excludeLeagues),
    exclude_fixture_ids: parseFilterList(excludeFixtureIds),
    exclude_team_ids: parseFilterList(excludeTeams),
    require_bookable: true,
  }), [
    horizon,
    markets,
    minOdds,
    maxOdds,
    minProbability,
    minTrustGrade,
    includeLeagues,
    excludeLeagues,
    excludeFixtureIds,
    excludeTeams,
  ]);

  const invalidateManual = () => {
    setCandidates([]);
    setSelectedIds([]);
    setCandidateStatus(null);
    setCandidateSearch("");
    setRecoveryFixtureIds([]);
    setManualPage(1);
    setShowSelectedOnly(false);
    setReplacementNotice(null);
  };

  const advancedFilterCount = [
    minOdds,
    maxOdds,
    minProbability,
    minTrustGrade === "A",
    includeLeagues,
    excludeLeagues,
    excludeFixtureIds,
    excludeTeams,
  ].filter(Boolean).length;

  const resetAdvancedFilters = () => {
    setMinOdds("");
    setMaxOdds("");
    setMinProbability("");
    setMinTrustGrade("B");
    setIncludeLeagues("");
    setExcludeLeagues("");
    setExcludeFixtureIds("");
    setExcludeTeams("");
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
      await buildV2({
        ...filters,
        mode,
        game_count: gameCount,
        fill_strategy: fillStrategy,
      });
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
    setCandidateSearch("");
    setRecoveryFixtureIds([]);
    setManualPage(1);
    setShowSelectedOnly(false);
    setReplacementNotice(null);
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
    const candidate = candidates.find(
      (item) => String(item.selection_id || "") === selectionId,
    );
    if (!candidate) return;

    const fixtureId = candidateFixtureId(candidate);
    const sameFixtureSelection = selectedIds.find((id) => {
      const selected = candidates.find(
        (item) => String(item.selection_id || "") === id,
      );
      return selected && candidateFixtureId(selected) === fixtureId;
    });

    if (sameFixtureSelection === selectionId) {
      setSelectedIds((current) =>
        current.filter((item) => item !== selectionId),
      );
      setReplacementNotice(null);
      return;
    }

    if (!sameFixtureSelection && selectedIds.length >= 50) return;

    if (sameFixtureSelection) {
      const previous = candidates.find(
        (item) => String(item.selection_id || "") === sameFixtureSelection,
      );
      setSelectedIds((current) => [
        ...current.filter((id) => id !== sameFixtureSelection),
        selectionId,
      ]);
      setReplacementNotice(
        `Market changed for ${candidate.home_team} v ${candidate.away_team}: ${previous?.prediction || "previous market"} → ${candidate.prediction || "new market"}.`,
      );
      return;
    }

    setSelectedIds((current) => [...current, selectionId]);
    setReplacementNotice(null);
  };

  const submitManual = async () => {
    if (!selectedIds.length) return;
    await buildV2({
      ...filters,
      mode: "manual",
      selection_ids: selectedIds,
    });
  };

  const recoverySlip = slip as ManualRecoverySlip | null;
  const manualSelectionChanged = Boolean(
    mode === "manual" &&
    recoverySlip?.mode === "manual" &&
    String(recoverySlip?.status || "") === "SELECTIONS_CHANGED",
  );
  const invalidManualSelections = manualSelectionChanged
    ? (recoverySlip?.invalid_selections || [])
    : [];
  const invalidManualIdSet = new Set(
    invalidManualSelections
      .map((item) => String(item.selection_id || ""))
      .filter(Boolean),
  );
  const validSelectedIds = selectedIds.filter(
    (selectionId) => !invalidManualIdSet.has(selectionId),
  );
  const staleFixtureIds = Array.from(new Set(
    invalidManualSelections
      .map((item) => {
        if (item.fixture_id) return String(item.fixture_id);
        const original = candidates.find(
          (candidate) =>
            String(candidate.selection_id || "") ===
            String(item.selection_id || ""),
        );
        return candidateFixtureId(original);
      })
      .filter(Boolean),
  ));
  const manualRecoveryActions = new Set<ManualRecoveryAction>([
    ...(recoverySlip?.actions || []),
    ...invalidManualSelections.flatMap((item) => item.actions || []),
  ]);
  const canRemoveInvalid =
    invalidManualIdSet.size > 0 &&
    (manualRecoveryActions.size === 0 || manualRecoveryActions.has("REMOVE"));
  const canChooseReplacement =
    manualRecoveryActions.size === 0 ||
    manualRecoveryActions.has("REPLACE");
  const canChooseSafer =
    staleFixtureIds.length > 0 &&
    manualRecoveryActions.has("SAFER_MARKET");

  const invalidManualDetails = invalidManualSelections.map((item) => {
    const original = candidates.find((candidate) => {
      if (item.selection_id) {
        return String(candidate.selection_id || "") === String(item.selection_id);
      }
      if (item.fixture_id) {
        return candidateFixtureId(candidate) === String(item.fixture_id);
      }
      return false;
    });
    return {
      key: String(
        item.selection_id ||
        item.fixture_id ||
        item.reason ||
        "changed-selection",
      ),
      label: original
        ? `${original.home_team} v ${original.away_team} · ${original.prediction}`
        : "Selected game",
      reason: item.reason || "NO_LONGER_APPROVED",
    };
  });

  const removeUnavailableManualSelections = () => {
    if (!invalidManualIdSet.size) return;

    setSelectedIds(validSelectedIds);
    setCandidates((current) =>
      current.filter(
        (candidate) =>
          !invalidManualIdSet.has(String(candidate.selection_id || "")),
      ),
    );
    setRecoveryFixtureIds([]);
    setCandidateSearch("");
    setCandidateStatus(
      `${invalidManualIdSet.size} unavailable ${
        invalidManualIdSet.size === 1 ? "selection" : "selections"
      } removed. ${validSelectedIds.length} still selected.`,
    );
    clearSlip();
  };

  const keepRemainingManualSelections = async () => {
    if (!validSelectedIds.length) {
      removeUnavailableManualSelections();
      setCandidateStatus(
        "No valid selections remain. Choose replacements from the approved board.",
      );
      return;
    }

    setSelectedIds(validSelectedIds);
    await buildV2({
      ...filters,
      mode: "manual",
      selection_ids: validSelectedIds,
    });
  };

  const openManualRecoveryBoard = async (
    scope: "replace" | "safer",
  ) => {
    setCandidateLoading(true);
    setCandidateStatus(null);

    try {
      const response = await api.getBuilderV2Candidates(filters);
      const nextCandidates = response.candidates || [];
      const currentIds = new Set(
        nextCandidates.map((candidate) =>
          String(candidate.selection_id || ""),
        ),
      );
      const preservedIds = validSelectedIds.filter((selectionId) =>
        currentIds.has(selectionId),
      );
      const droppedCount = validSelectedIds.length - preservedIds.length;

      setCandidates(nextCandidates);
      setSelectedIds(preservedIds);
      setCandidateSearch("");
      setManualPage(1);
      setShowSelectedOnly(false);
      setReplacementNotice(null);

      if (scope === "safer" && staleFixtureIds.length) {
        const affectedFixtureIds = new Set(staleFixtureIds);
        const alternatives = nextCandidates.filter(
          (candidate) =>
            affectedFixtureIds.has(candidateFixtureId(candidate)) &&
            !invalidManualIdSet.has(String(candidate.selection_id || "")),
        );

        setRecoveryFixtureIds(staleFixtureIds);
        setCandidateStatus(
          alternatives.length
            ? `${alternatives.length} approved ${
                alternatives.length === 1 ? "alternative" : "alternatives"
              } available for the affected game. ${
                preservedIds.length
              } valid selections kept.`
            : `No approved safer market is currently available for the affected game. ${
                preservedIds.length
              } valid selections kept.`,
        );
      } else {
        setRecoveryFixtureIds([]);
        setCandidateStatus(
          response.status === "success"
            ? `Choose a replacement from ${
                response.candidate_count ?? nextCandidates.length
              } approved selections. ${preservedIds.length} valid selections kept.${
                droppedCount
                  ? ` ${droppedCount} additional selection${
                      droppedCount === 1 ? "" : "s"
                    } no longer appears on the refreshed approved board.`
                  : ""
              }`
            : response.reason ||
                "No approved replacement is available right now.",
        );
      }

      clearSlip();
    } catch {
      setCandidateStatus(
        "Could not refresh the approved game board. Your selected games were not changed.",
      );
    } finally {
      setCandidateLoading(false);
    }
  };

  const filteredCandidates = candidates
    .filter(
      (candidate) =>
        !recoveryFixtureIds.length ||
        recoveryFixtureIds.includes(candidateFixtureId(candidate)),
    )
    .filter((candidate) =>
      !candidateSearch.trim() ||
      candidateText(candidate).includes(candidateSearch.trim().toLowerCase()),
    );

  const fixtureGroups = Array.from(
    filteredCandidates.reduce<Map<string, BuilderV2Candidate[]>>(
      (groups, candidate) => {
        const fixtureId =
          candidateFixtureId(candidate) ||
          String(candidate.selection_id || "");
        const group = groups.get(fixtureId) || [];
        group.push(candidate);
        groups.set(fixtureId, group);
        return groups;
      },
      new Map(),
    ),
  ).map(([fixtureId, selections]) => ({
    fixtureId,
    selections,
    lead: selections.find((candidate) => candidate.recommended_for_fixture)
      || selections[0],
  }));

  const selectedFixtureIds = new Set(
    selectedIds
      .map((selectionId) =>
        candidates.find(
          (candidate) =>
            String(candidate.selection_id || "") === selectionId,
        ),
      )
      .filter((candidate): candidate is BuilderV2Candidate => Boolean(candidate))
      .map((candidate) => candidateFixtureId(candidate)),
  );

  const browsableFixtureGroups = showSelectedOnly
    ? fixtureGroups.filter((group) => selectedFixtureIds.has(group.fixtureId))
    : fixtureGroups;

  const browsableSelectionCount = browsableFixtureGroups.reduce(
    (total, group) => total + group.selections.length,
    0,
  );

  const manualPageCount = Math.max(
    1,
    Math.ceil(browsableFixtureGroups.length / MANUAL_PAGE_SIZE),
  );
  const effectiveManualPage = Math.min(manualPage, manualPageCount);
  const visibleFixtureGroups = browsableFixtureGroups.slice(
    (effectiveManualPage - 1) * MANUAL_PAGE_SIZE,
    effectiveManualPage * MANUAL_PAGE_SIZE,
  );

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
              <span>Choose how many matches you want.</span>
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
            <p className="builder-v2-inline-note">
              Quality first: BetSightly may return fewer games when fewer selections qualify.
            </p>

            {markets.length > 0 && (
              <div className="builder-v2-fill-choice">
                <div className="builder-v2-label-row">
                  <strong>Fill strategy</strong>
                  <span>Your selected markets stay first.</span>
                </div>
                <div
                  className="builder-v2-fill-options"
                  role="group"
                  aria-label="Fill strategy"
                >
                  <button
                    type="button"
                    className={fillStrategy === "strict_selected_markets" ? "is-active" : ""}
                    aria-pressed={fillStrategy === "strict_selected_markets"}
                    onClick={() => {
                      setFillStrategy("strict_selected_markets");
                      clearSlip();
                    }}
                  >
                    <span className="builder-v2-choice-copy">
                      <strong>Selected markets only</strong>
                      <small>Use only your selected markets, even if other qualified markets are stronger.</small>
                    </span>
                  </button>
                  <button
                    type="button"
                    className={fillStrategy === "selected_first_then_eligible" ? "is-active" : ""}
                    aria-pressed={fillStrategy === "selected_first_then_eligible"}
                    onClick={() => {
                      setFillStrategy("selected_first_then_eligible");
                      clearSlip();
                    }}
                  >
                    <span className="builder-v2-choice-copy">
                      <strong>Smart fill</strong>
                      <small>Prioritise your choices. Only missing places can use other approved markets.</small>
                    </span>
                  </button>
                </div>
                <p className="builder-v2-inline-note">
                  Smart Fill never replaces an already-qualified selected-market pick. Quality standards are never lowered to fill the slip.
                </p>
              </div>
            )}
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
            Selected markets are balanced where quality allows. Your fill strategy
            decides whether other equally qualified markets may complete the slip.
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
            ["today", "Today", "Fast settlement"],
            ["3_days", "3 days", "More choice"],
            ["week", "7 days", "Deepest board"],
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

          <label>
            <span>Include leagues</span>
            <input
              aria-label="Include leagues"
              type="text"
              value={includeLeagues}
              onChange={(event) => {
                setIncludeLeagues(event.target.value);
                clearSlip();
                invalidateManual();
              }}
              placeholder="Premier League, LaLiga"
            />
          </label>

          <label>
            <span>Exclude leagues</span>
            <input
              aria-label="Exclude leagues"
              type="text"
              value={excludeLeagues}
              onChange={(event) => {
                setExcludeLeagues(event.target.value);
                clearSlip();
                invalidateManual();
              }}
              placeholder="Friendly, league-slug"
            />
          </label>

          <label>
            <span>Exclude fixtures</span>
            <input
              aria-label="Exclude fixtures"
              type="text"
              value={excludeFixtureIds}
              onChange={(event) => {
                setExcludeFixtureIds(event.target.value);
                clearSlip();
                invalidateManual();
              }}
              placeholder="Fixture IDs, comma separated"
            />
          </label>

          <label>
            <span>Exclude teams</span>
            <input
              aria-label="Exclude teams"
              type="text"
              value={excludeTeams}
              onChange={(event) => {
                setExcludeTeams(event.target.value);
                clearSlip();
                invalidateManual();
              }}
              placeholder="Team names or IDs"
            />
          </label>
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
          {manualSelectionChanged && (
            <section
              className="builder-v2-market-note"
              role="alert"
              aria-label="Manual selection recovery"
            >
              <strong>SportyBet changed your selected slip</strong>
              <p>
                {recoverySlip?.reason ||
                  "One or more selected games are no longer approved and exactly bookable."}
              </p>

              {!!invalidManualDetails.length && (
                <ul>
                  {invalidManualDetails.map((item) => (
                    <li key={item.key}>
                      <strong>{item.label}</strong>
                      {" · "}
                      {item.reason.replaceAll("_", " ").toLowerCase()}
                    </li>
                  ))}
                </ul>
              )}

              <p>
                No game has been replaced automatically. Your valid selections
                stay under your control.
              </p>

              <div
                className="builder-v2-pills"
                role="group"
                aria-label="Manual recovery actions"
              >
                {canRemoveInvalid && (
                  <button
                    type="button"
                    onClick={removeUnavailableManualSelections}
                    disabled={loading || candidateLoading}
                  >
                    Remove unavailable
                  </button>
                )}

                {canRemoveInvalid && validSelectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void keepRemainingManualSelections()}
                    disabled={loading || candidateLoading}
                  >
                    Keep remaining
                  </button>
                )}

                {canChooseReplacement && (
                  <button
                    type="button"
                    onClick={() => void openManualRecoveryBoard("replace")}
                    disabled={loading || candidateLoading}
                  >
                    Choose replacement
                  </button>
                )}

                {canChooseSafer && (
                  <button
                    type="button"
                    onClick={() => void openManualRecoveryBoard("safer")}
                    disabled={loading || candidateLoading}
                  >
                    Safer market
                  </button>
                )}
              </div>
            </section>
          )}

          <button className="builder-submit builder-v2-submit" type="button"
              onClick={() => void loadCandidates()} disabled={candidateLoading || loading}>
              <Search size={18} />
              {candidateLoading ? "Loading approved games…" : "Browse approved games"}
            </button>

          {candidateStatus && (
            <p className="builder-v2-candidate-status">{candidateStatus}</p>
          )}

          {!!candidates.length && (
            <>
              <label className="builder-v2-search">
                <Search size={15} />
                <input
                  aria-label="Search approved games"
                  value={candidateSearch}
                  onChange={(event) => {
                    setCandidateSearch(event.target.value);
                    setManualPage(1);
                  }}
                  placeholder="Search team, league or market"
                />
              </label>

              <div className="builder-v2-manual-toolbar">
                <span>
                  {browsableFixtureGroups.length} {browsableFixtureGroups.length === 1 ? "fixture" : "fixtures"}
                  {" · "}
                  {browsableSelectionCount} approved {browsableSelectionCount === 1 ? "market" : "markets"}
                  {" · "}
                  {selectedIds.length} selected
                </span>
                <button
                  type="button"
                  className={showSelectedOnly ? "is-active" : ""}
                  aria-pressed={showSelectedOnly}
                  onClick={() => {
                    setShowSelectedOnly((current) => !current);
                    setManualPage(1);
                  }}
                >
                  Selected games ({selectedIds.length})
                </button>
              </div>

              {replacementNotice && (
                <p className="builder-v2-replacement-notice" role="status">
                  {replacementNotice}
                </p>
              )}

              <div className="builder-v2-fixtures" aria-label="Approved game selections">
                {visibleFixtureGroups.map(({ fixtureId, selections, lead }) => {
                  const selectedId = selectedIds.find((id) => {
                    const selected = candidates.find(
                      (candidate) =>
                        String(candidate.selection_id || "") === id,
                    );
                    return selected && candidateFixtureId(selected) === fixtureId;
                  });
                  const selectedCandidate = selectedId
                    ? candidates.find(
                        (candidate) =>
                          String(candidate.selection_id || "") === selectedId,
                      )
                    : undefined;

                  return (
                    <section
                      key={fixtureId}
                      className={`builder-v2-fixture-card${selectedId ? " is-selected" : ""}`}
                      aria-label={`${lead?.home_team || ""} v ${lead?.away_team || ""}`}
                    >
                      <div className="builder-v2-fixture-header">
                        <div>
                          <strong>{lead?.home_team} v {lead?.away_team}</strong>
                          <small>{lead?.league}</small>
                        </div>
                        {selectedCandidate && (
                          <span className="builder-v2-fixture-selected">
                            <Check size={13} />
                            {selectedCandidate.prediction}
                          </span>
                        )}
                      </div>

                      <div
                        className="builder-v2-fixture-markets"
                        role="group"
                        aria-label={`Markets for ${lead?.home_team || ""} v ${lead?.away_team || ""}`}
                      >
                        {selections.map((candidate) => {
                          const id = String(candidate.selection_id || "");
                          const selected = selectedIds.includes(id);
                          const fixtureAlreadySelected = Boolean(selectedId);
                          return (
                            <button
                              key={id}
                              type="button"
                              className={selected ? "is-selected" : ""}
                              aria-pressed={selected}
                              aria-label={`${candidate.home_team} v ${candidate.away_team} · ${candidate.prediction}`}
                              disabled={
                                !id ||
                                (!selected &&
                                  !fixtureAlreadySelected &&
                                  selectedIds.length >= 50)
                              }
                              onClick={() => toggleCandidate(id)}
                            >
                              <span>
                                {selected && <Check size={13} />}
                                {candidate.prediction}
                              </span>
                              <strong>
                                {candidate.odds?.toFixed?.(2) ?? candidate.odds ?? "—"}
                              </strong>
                              <small>
                                {candidate.trust_grade
                                  ? `Grade ${candidate.trust_grade}`
                                  : ""}
                                {candidate.recommended_for_fixture
                                  ? " · Recommended"
                                  : ""}
                              </small>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>

              {browsableFixtureGroups.length === 0 && (
                <p className="builder-v2-candidate-status">
                  {showSelectedOnly
                    ? "No games selected yet."
                    : "No approved fixtures match this search."}
                </p>
              )}

              {manualPageCount > 1 && (
                <nav
                  className="builder-v2-pagination"
                  aria-label="Approved games pagination"
                >
                  <button
                    type="button"
                    disabled={effectiveManualPage <= 1}
                    onClick={() =>
                      setManualPage((currentPage) => Math.max(1, currentPage - 1))
                    }
                  >
                    Previous
                  </button>
                  <span>
                    Page {effectiveManualPage} of {manualPageCount}
                  </span>
                  <button
                    type="button"
                    disabled={effectiveManualPage >= manualPageCount}
                    onClick={() =>
                      setManualPage((currentPage) =>
                        Math.min(manualPageCount, currentPage + 1),
                      )
                    }
                  >
                    Next
                  </button>
                </nav>
              )}
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
