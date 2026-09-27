import {
  CalendarDays,
  CheckCircle2,
  ListChecks,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  builderV2Api,
  type BuilderV2Candidate,
  type BuilderV2Filters,
  type BuilderV2Horizon,
  type BuilderV2Mode,
  type BuilderV2Response,
} from "../../api/builderV2";
import BookingCode from "../predictions/BookingCode";
import { BrandLoader } from "../ui/BrandLoader";
import { CATEGORIES } from "../../types";
import { trackProductEvent } from "../../services/bookingTracking";

const GAME_COUNTS = [5, 10, 15, 20, 30, 40, 50];
const STRONGEST_COUNTS = [5, 10, 15, 20];
const accent = CATEGORIES.find(
  (category) => category.key === "5_odds",
)!;

const labelMarket = (market: string) =>
  market
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const percent = (value?: number) =>
  value == null
    ? "—"
    : `${(value * 100).toFixed(1)}%`;

type NonTargetMode =
  Exclude<BuilderV2Mode, "target_odds">;

export function BuilderV2Panel({
  mode,
}: {
  mode: NonTargetMode;
}) {
  const [horizon, setHorizon] =
    useState<BuilderV2Horizon>("7_days");
  const [gameCount, setGameCount] = useState(20);
  const [strongestCount, setStrongestCount] =
    useState(10);
  const [customCount, setCustomCount] =
    useState("");
  const [markets, setMarkets] =
    useState<string[]>([]);
  const [league, setLeague] = useState("");
  const [minOdds, setMinOdds] = useState("");
  const [maxOdds, setMaxOdds] = useState("");
  const [minProbability, setMinProbability] =
    useState("");
  const [minTrustGrade, setMinTrustGrade] =
    useState<"A" | "B">("B");

  const [candidates, setCandidates] =
    useState<BuilderV2Candidate[]>([]);
  const [selectedIds, setSelectedIds] =
    useState<string[]>([]);
  const [candidateStatus, setCandidateStatus] =
    useState<BuilderV2Response | null>(null);
  const [result, setResult] =
    useState<BuilderV2Response | null>(null);
  const [loadingBoard, setLoadingBoard] =
    useState(false);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  const filters = useMemo<BuilderV2Filters>(
    () => ({
      horizon,
      markets,
      min_odds: minOdds
        ? Number(minOdds)
        : undefined,
      max_odds: maxOdds
        ? Number(maxOdds)
        : undefined,
      min_probability: minProbability
        ? Number(minProbability) / 100
        : undefined,
      min_trust_grade: minTrustGrade,
      include_leagues: league
        ? [league]
        : [],
      require_bookable: true,
    }),
    [
      horizon,
      markets,
      minOdds,
      maxOdds,
      minProbability,
      minTrustGrade,
      league,
    ],
  );

  useEffect(() => {
    let active = true;

    setLoadingBoard(true);
    setError(null);
    setCandidates([]);

    void builderV2Api
      .candidates({
        horizon,
        min_trust_grade: "B",
        require_bookable: true,
      })
      .then((response) => {
        if (!active) return;
        setCandidateStatus(response);
        setCandidates(response.candidates ?? []);
        if (response.status !== "success") {
          setError(
            response.reason === "board_refreshing"
              ? "The prediction board is updating. Try again shortly."
              : response.reason ||
                  "The approved board is unavailable.",
          );
        }
      })
      .catch((caught: Error) => {
        if (!active) return;
        setError(
          caught.name === "AbortError"
            ? "The approved board took too long to respond."
            : "Could not load the approved Builder board.",
        );
      })
      .finally(() => {
        if (active) setLoadingBoard(false);
      });

    return () => {
      active = false;
    };
  }, [horizon]);

  useEffect(() => {
    setResult(null);
    setError(null);
    if (mode !== "manual") {
      setSelectedIds([]);
    }
    trackProductEvent(
      "builder_v2_mode_selected",
      {
        product_area: "builder",
        source: "generator",
        mode,
      },
    );
  }, [mode]);

  const availableMarkets = useMemo(
    () =>
      [
        ...new Set(
          candidates
            .map((candidate) => candidate.market)
            .filter(
              (value): value is string =>
                Boolean(value),
            ),
        ),
      ].sort(),
    [candidates],
  );

  const availableLeagues = useMemo(
    () =>
      [
        ...new Set(
          candidates
            .map((candidate) => candidate.league)
            .filter(Boolean),
        ),
      ].sort(),
    [candidates],
  );

  const visibleCandidates = useMemo(
    () =>
      candidates.filter((candidate) => {
        if (
          markets.length &&
          !markets.includes(candidate.market || "")
        ) {
          return false;
        }

        if (
          league &&
          candidate.league !== league
        ) {
          return false;
        }

        const odds = candidate.odds ?? 0;
        if (
          minOdds &&
          odds < Number(minOdds)
        ) {
          return false;
        }

        if (
          maxOdds &&
          odds > Number(maxOdds)
        ) {
          return false;
        }

        const probability =
          candidate.selection_probability ??
          candidate.evidence_adjusted_probability ??
          candidate.confidence;

        if (
          minProbability &&
          probability <
            Number(minProbability) / 100
        ) {
          return false;
        }

        if (
          minTrustGrade === "A" &&
          candidate.trust_grade !== "A"
        ) {
          return false;
        }

        return true;
      }),
    [
      candidates,
      markets,
      league,
      minOdds,
      maxOdds,
      minProbability,
      minTrustGrade,
    ],
  );

  const selectedCandidates = useMemo(
    () =>
      selectedIds
        .map((selectionId) =>
          candidates.find(
            (candidate) =>
              candidate.selection_id ===
              selectionId,
          ),
        )
        .filter(
          (
            candidate,
          ): candidate is BuilderV2Candidate =>
            Boolean(candidate),
        ),
    [selectedIds, candidates],
  );

  const manualOdds = useMemo(
    () =>
      selectedCandidates.reduce(
        (total, candidate) =>
          total * (candidate.odds || 1),
        1,
      ),
    [selectedCandidates],
  );

  const manualProbability = useMemo(
    () =>
      selectedCandidates.reduce(
        (total, candidate) =>
          total *
          (
            candidate.selection_probability ??
            candidate.evidence_adjusted_probability ??
            candidate.confidence
          ),
        1,
      ),
    [selectedCandidates],
  );

  const toggleMarket = (market: string) => {
    setMarkets((current) =>
      current.includes(market)
        ? current.filter(
            (value) => value !== market,
          )
        : [...current, market],
    );
    setResult(null);
  };

  const toggleCandidate = (
    candidate: BuilderV2Candidate,
  ) => {
    if (!candidate.selection_id) return;

    setSelectedIds((current) => {
      if (
        current.includes(
          candidate.selection_id!,
        )
      ) {
        return current.filter(
          (value) =>
            value !== candidate.selection_id,
        );
      }

      const sameFixtureIds =
        candidates
          .filter(
            (other) =>
              other.match_id ===
                candidate.match_id &&
              other.selection_id,
          )
          .map(
            (other) =>
              other.selection_id!,
          );

      const next = current.filter(
        (value) =>
          !sameFixtureIds.includes(value),
      );

      if (next.length >= 50) {
        return next;
      }

      return [
        ...next,
        candidate.selection_id!,
      ];
    });

    setResult(null);
  };

  const runBuild = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    const startedAt = performance.now();

    try {
      let response: BuilderV2Response;

      if (mode === "manual") {
        if (!selectedIds.length) {
          setError(
            "Choose at least one approved selection first.",
          );
          return;
        }

        response =
          await builderV2Api.manual({
            ...filters,
            selection_ids: selectedIds,
          });

        trackProductEvent(
          "manual_booking_requested",
          {
            product_area: "builder",
            selected_count:
              selectedIds.length,
            horizon,
          },
        );
      } else if (mode === "game_count") {
        response =
          await builderV2Api.generate({
            ...filters,
            mode,
            game_count: gameCount,
          });

        trackProductEvent(
          "game_count_requested",
          {
            product_area: "builder",
            requested_game_count:
              gameCount,
            horizon,
          },
        );
      } else {
        response =
          await builderV2Api.generate({
            ...filters,
            mode,
            max_games: strongestCount,
          });
      }

      setResult(response);

      trackProductEvent(
        "builder_v2_generated",
        {
          product_area: "builder",
          mode,
          horizon,
          delivered_game_count:
            response.delivered_game_count ??
            response.legs ??
            0,
          shortfall_count:
            response.shortfall ?? 0,
          shortfall_reason:
            response.shortfall_reason ??
            response.reason,
          booking_success:
            response.booking?.status ===
            "active"
              ? 1
              : 0,
          duration_ms: Math.round(
            performance.now() -
              startedAt,
          ),
        },
      );

      if (
        response.status !== "success" &&
        response.status !==
          "SELECTIONS_CHANGED"
      ) {
        setError(
          response.reason ===
            "board_refreshing"
            ? "The prediction board is updating. Try again shortly."
            : response.reason ||
                "No qualifying slip is available.",
        );
      }
    } catch (caught) {
      const failure = caught as Error;
      setError(
        failure.name === "AbortError"
          ? "That build took too long. Try again."
          : "The Builder could not reach the prediction service.",
      );
    } finally {
      setLoading(false);
    }
  };

  const buttonLabel =
    mode === "game_count"
      ? `Build ${gameCount} qualifying games`
      : mode === "strongest"
        ? `Build strongest ${strongestCount}`
        : `Validate ${selectedIds.length} selected ${
            selectedIds.length === 1
              ? "game"
              : "games"
          }`;

  return (
    <section className="builder-v2-panel">
      <div className="builder-v2-panel__top">
        <div>
          <h2>
            {mode === "game_count"
              ? "Choose how many games you want"
              : mode === "strongest"
                ? "Use the strongest available board"
                : "Pick your games and markets"}
          </h2>
          <p>
            Your filters may make the
            requirements stricter. They never
            lower BetSightly’s quality, trust,
            or bookability rules.
          </p>
        </div>
        <span className="builder-v2-quality">
          <ShieldCheck size={15} />
          Quality floor stays on
        </span>
      </div>

      <div className="builder-v2-horizons">
        {(
          [
            ["today", "Today"],
            ["3_days", "3 days"],
            ["7_days", "7 days"],
          ] as Array<
            [BuilderV2Horizon, string]
          >
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={
              horizon === value
                ? "is-active"
                : ""
            }
            onClick={() => {
              setHorizon(value);
              setSelectedIds([]);
              setResult(null);
            }}
          >
            <CalendarDays size={16} />
            {label}
          </button>
        ))}
      </div>

      {mode === "game_count" && (
        <div className="builder-v2-counts">
          {GAME_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              className={
                gameCount === count
                  ? "is-active"
                  : ""
              }
              onClick={() => {
                setGameCount(count);
                setCustomCount("");
                setResult(null);
              }}
            >
              {count}
            </button>
          ))}
          <input
            aria-label="Custom game count"
            type="number"
            min={1}
            max={50}
            value={customCount}
            placeholder="1–50"
            onChange={(event) => {
              const value =
                event.target.value;
              setCustomCount(value);
              const parsed = Number(value);
              if (
                parsed >= 1 &&
                parsed <= 50
              ) {
                setGameCount(parsed);
                setResult(null);
              }
            }}
          />
        </div>
      )}

      {mode === "strongest" && (
        <div className="builder-v2-counts">
          {STRONGEST_COUNTS.map(
            (count) => (
              <button
                key={count}
                type="button"
                className={
                  strongestCount === count
                    ? "is-active"
                    : ""
                }
                onClick={() => {
                  setStrongestCount(count);
                  setResult(null);
                }}
              >
                Top {count}
              </button>
            ),
          )}
        </div>
      )}

      <details className="builder-v2-filters">
        <summary>
          <SlidersHorizontal size={16} />
          Filters
        </summary>

        <div className="builder-v2-filter-grid">
          <label>
            <span>League</span>
            <select
              value={league}
              onChange={(event) => {
                setLeague(
                  event.target.value,
                );
                setResult(null);
              }}
            >
              <option value="">
                All approved leagues
              </option>
              {availableLeagues.map(
                (value) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {value}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            <span>Min odds</span>
            <input
              type="number"
              min="1.01"
              step="0.01"
              value={minOdds}
              placeholder="Any"
              onChange={(event) => {
                setMinOdds(
                  event.target.value,
                );
                setResult(null);
              }}
            />
          </label>

          <label>
            <span>Max odds</span>
            <input
              type="number"
              min="1.01"
              step="0.01"
              value={maxOdds}
              placeholder="Any"
              onChange={(event) => {
                setMaxOdds(
                  event.target.value,
                );
                setResult(null);
              }}
            />
          </label>

          <label>
            <span>Min probability</span>
            <input
              type="number"
              min="65"
              max="99"
              step="1"
              value={minProbability}
              placeholder="65"
              onChange={(event) => {
                setMinProbability(
                  event.target.value,
                );
                setResult(null);
              }}
            />
          </label>

          <label>
            <span>Min trust</span>
            <select
              value={minTrustGrade}
              onChange={(event) => {
                setMinTrustGrade(
                  event.target.value as
                    | "A"
                    | "B",
                );
                setResult(null);
              }}
            >
              <option value="B">
                B or better
              </option>
              <option value="A">
                A only
              </option>
            </select>
          </label>
        </div>

        {!!availableMarkets.length && (
          <div className="builder-v2-markets">
            {availableMarkets.map(
              (market) => (
                <button
                  key={market}
                  type="button"
                  className={
                    markets.includes(market)
                      ? "is-active"
                      : ""
                  }
                  onClick={() =>
                    toggleMarket(market)
                  }
                >
                  {labelMarket(market)}
                </button>
              ),
            )}
          </div>
        )}
      </details>

      {mode === "manual" && (
        <div className="builder-v2-manual">
          <div className="builder-v2-manual__heading">
            <div>
              <h3>Approved board</h3>
              <p>
                Choose one market per fixture.
                Selecting a different market for
                the same match replaces the first.
              </p>
            </div>
            <span>
              {selectedIds.length}/50 selected
            </span>
          </div>

          {loadingBoard ? (
            <div className="builder-loading">
              <BrandLoader />
              <span>
                Loading approved selections…
              </span>
            </div>
          ) : candidateStatus?.reason ===
            "board_refreshing" ? (
            <div className="builder-message">
              The prediction board is refreshing.
            </div>
          ) : (
            <div className="builder-v2-candidates">
              {visibleCandidates
                .slice(0, 120)
                .map((candidate) => {
                  const selected = Boolean(
                    candidate.selection_id &&
                      selectedIds.includes(
                        candidate.selection_id,
                      ),
                  );
                  const probability =
                    candidate.selection_probability ??
                    candidate.evidence_adjusted_probability ??
                    candidate.confidence;

                  return (
                    <button
                      key={
                        candidate.selection_id ||
                        `${candidate.match_id}-${candidate.market}`
                      }
                      type="button"
                      className={`builder-v2-candidate ${
                        selected
                          ? "is-selected"
                          : ""
                      }`}
                      onClick={() =>
                        toggleCandidate(
                          candidate,
                        )
                      }
                    >
                      <span>
                        <strong>
                          {candidate.home_team} vs{" "}
                          {candidate.away_team}
                        </strong>
                        <small>
                          {candidate.league}
                          {candidate.recommended_for_fixture
                            ? " · Recommended"
                            : ""}
                        </small>
                      </span>
                      <span>
                        <strong>
                          {candidate.prediction}
                        </strong>
                        <small>
                          {percent(probability)} ·
                          Grade{" "}
                          {candidate.trust_grade ||
                            "B"}
                        </small>
                      </span>
                      <strong>
                        {candidate.odds?.toFixed(
                          2,
                        ) ?? "—"}
                      </strong>
                      {selected ? (
                        <CheckCircle2
                          size={18}
                        />
                      ) : (
                        <ListChecks size={18} />
                      )}
                    </button>
                  );
                })}
            </div>
          )}

          <div className="builder-v2-tray">
            <div>
              <span>Selected</span>
              <strong>
                {selectedIds.length}/50
              </strong>
            </div>
            <div>
              <span>Total odds</span>
              <strong>
                {manualOdds.toFixed(2)}x
              </strong>
            </div>
            <div>
              <span>
                Estimated all-leg chance
              </span>
              <strong>
                {selectedIds.length
                  ? `${(
                      manualProbability * 100
                    ).toFixed(2)}%`
                  : "—"}
              </strong>
            </div>
            {!!selectedIds.length && (
              <button
                type="button"
                onClick={() =>
                  setSelectedIds([])
                }
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div
          className="builder-message builder-message--error"
          role="alert"
        >
          <p>{error}</p>
        </div>
      )}

      <button
        className="builder-submit"
        type="button"
        disabled={
          loading ||
          (mode === "manual" &&
            selectedIds.length === 0)
        }
        onClick={() => void runBuild()}
      >
        {loading
          ? "Checking the approved board…"
          : buttonLabel}
      </button>

      {loading && (
        <div className="builder-loading">
          <BrandLoader />
          <span>
            Applying your settings without
            weakening the quality floor.
          </span>
        </div>
      )}

      {result?.status ===
        "SELECTIONS_CHANGED" && (
        <section className="builder-v2-changed">
          <strong>
            Some selections changed at SportyBet
          </strong>
          <p>
            BetSightly did not silently replace
            them. Adjust the affected games and
            validate again.
          </p>
          {(result.invalid_selections ??
            []).map((item, index) => (
            <span
              key={`${
                item.selection_id ||
                item.fixture_id ||
                index
              }`}
            >
              {item.selection_id ||
                item.fixture_id ||
                "Selection"}{" "}
              · {labelMarket(item.reason)}
            </span>
          ))}
        </section>
      )}

      {result?.status === "success" && (
        <section className="builder-v2-result">
          <header>
            <div>
              <span className="builder-eyebrow">
                <CheckCircle2 size={14} />
                Combination ready
              </span>
              <h2>
                {result.legs} games ·{" "}
                {result.odds?.toFixed(2)}x
              </h2>
            </div>
            <span className="builder-trust-chip">
              <ShieldCheck size={15} />
              Grade{" "}
              {result.lowest_trust_grade ??
                "B"}{" "}
              minimum
            </span>
          </header>

          {Boolean(result.shortfall) && (
            <div className="builder-v2-shortfall">
              Requested{" "}
              {result.requested_game_count},
              delivered{" "}
              {result.delivered_game_count}.{" "}
              {result.shortfall_reason}
            </div>
          )}

          <div className="builder-stats">
            <div>
              <span>Total odds</span>
              <strong>
                {result.odds?.toFixed(2)}x
              </strong>
            </div>
            <div>
              <span>Games</span>
              <strong>
                {String(result.legs ?? 0)}
              </strong>
            </div>
            <div>
              <span>Lowest probability</span>
              <strong>
                {percent(
                  result.lowest_probability,
                )}
              </strong>
            </div>
            <div>
              <span>
                Estimated all-leg chance
              </span>
              <strong>
                {percent(
                  result.estimated_all_leg_probability,
                )}
              </strong>
            </div>
          </div>

          <p className="builder-explainer">
            Combined probability is an
            approximate independence estimate,
            not a guarantee.
          </p>

          <BookingCode
            booking={result.booking}
            category={accent}
            tracking={{
              source: "generator",
              tier: `v2_${mode}_${horizon}`,
              legCount: result.legs,
              targetOdds: result.odds,
              bookingStatus:
                result.booking?.booking_status,
              actualOdds:
                result.booking
                  ?.actual_sportybet_odds,
            }}
            onShowBookable={undefined}
            fallbackActionLabel="Revalidate selections"
          />

          <div className="builder-v2-result-games">
            {(result.games ?? []).map(
              (game, index) => (
                <div
                  className="builder-v2-result-game"
                  key={
                    game.selection_id ||
                    `${game.fixture_id}-${index}`
                  }
                >
                  <span>
                    <strong>
                      {game.home_team} vs{" "}
                      {game.away_team}
                    </strong>
                    <small>{game.league}</small>
                  </span>
                  <span>
                    <strong>
                      {game.prediction}
                    </strong>
                    <small>
                      {percent(
                        game.selection_probability ??
                          game.evidence_adjusted_probability ??
                          game.confidence,
                      )}
                    </small>
                  </span>
                  <strong>
                    {game.odds?.toFixed(2)}
                  </strong>
                </div>
              ),
            )}
          </div>
        </section>
      )}
    </section>
  );
}
