import { useEffect, useRef, useState } from "react";
import {
  Ban,
  CircleHelp,
  Lock,
  LockOpen,
  MoreHorizontal,
  RefreshCw,
  ShieldPlus,
  Trash2,
} from "lucide-react";

import type { BuilderAction } from "../../api/builderRevisions";
import type { CategoryMeta, GamePrediction } from "../../types";
import { PredictionCard } from "../predictions/PredictionCard";

const percent = (value?: number | null) =>
  value == null ? "Unavailable" : `${(value * 100).toFixed(1)}%`;

export function BuilderLeg({
  game,
  index,
  accent,
  locked,
  pending,
  pendingAction,
  replacedFrom,
  feedback,
  onAction,
  onExplanation,
}: {
  game: GamePrediction;
  index: number;
  accent: CategoryMeta;
  locked: boolean;
  pending: boolean;
  pendingAction?: BuilderAction | null;
  replacedFrom?: GamePrediction;
  feedback?: { status: "success" | "failure"; message: string };
  onAction: (action: BuilderAction, game: GamePrediction) => void;
  onExplanation: () => void;
}) {
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showOldCard, setShowOldCard] = useState(false);
  const touchX = useRef<number | null>(null);
  const alternative = game.fixture_alternatives?.find(
    (item) => item.market !== game.market,
  );

  useEffect(() => {
    if (!replacedFrom) {
      setShowOldCard(false);
      return;
    }
    setShowOldCard(true);
    const timer = window.setTimeout(() => setShowOldCard(false), 260);
    return () => window.clearTimeout(timer);
  }, [replacedFrom]);

  const explain = () => {
    setExplanationOpen((open) => !open);
    if (!explanationOpen) onExplanation();
  };

  return (
    <article
      className={`editable-builder-leg${locked ? " is-locked" : ""}${pending ? " is-pending" : ""}${replacedFrom ? " is-replacement-entering" : ""}`}
      onTouchStart={(event) => { touchX.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        if (pending || touchX.current == null) return;
        const distance = (event.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
        touchX.current = null;
        if (distance <= -90) onAction("replace_selection", game);
        if (distance >= 90) onAction(
          locked ? "unlock_selection" : "lock_selection",
          game,
        );
      }}
    >
      <div className="editable-builder-leg__topline">
        <span>Leg {String(index + 1).padStart(2, "0")}</span>
        <strong>
          {locked && <Lock size={13} />}
          {locked
            ? "Locked"
            : (game.trust?.score ?? 0) >= 85
              ? "Strong evidence"
              : "Supported evidence"}
        </strong>
      </div>
      <div className="editable-builder-leg__card-stage">
        {replacedFrom && showOldCard && (
          <div className="editable-builder-leg__old-card" aria-hidden="true">
            <PredictionCard game={replacedFrom} category={accent} />
          </div>
        )}
        <div className={pendingAction === "safer_same_fixture"
          ? "editable-builder-leg__market-changing" : ""}>
          <PredictionCard game={game} category={accent} />
        </div>
        {pending && (
          <div className="editable-builder-leg__overlay" role="status">
            <RefreshCw size={18} aria-hidden="true" />
            <strong>{pendingAction === "replace_selection"
              ? "Finding a different game…"
              : pendingAction === "safer_same_fixture"
                ? "Checking safer markets…" : "Updating this game…"}</strong>
            <span>Checking approved predictions and SportyBet availability.</span>
          </div>
        )}
      </div>

      <div className="editable-builder-leg__actions" aria-label={`Actions for ${game.home_team} vs ${game.away_team}`}>
        <button type="button" onClick={explain} aria-expanded={explanationOpen}>
          <CircleHelp size={16} /> Why this pick?
        </button>
        <button type="button" disabled={pending}
          onClick={() => onAction("safer_same_fixture", game)}>
          <ShieldPlus size={16} /> Safer market
        </button>
        <button type="button" disabled={pending}
          onClick={() => onAction("replace_selection", game)}>
          <RefreshCw size={16} /> Replace
        </button>
        <button type="button" disabled={pending}
          onClick={() => onAction(locked ? "unlock_selection" : "lock_selection", game)}>
          {locked ? <LockOpen size={16} /> : <Lock size={16} />}
          {locked ? "Unlock" : "Lock"}
        </button>
        <button type="button" className="editable-builder-leg__more"
          aria-label="More leg actions" aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}>
          <MoreHorizontal size={17} />
        </button>
      </div>

      {menuOpen && (
        <div className="editable-builder-leg__menu">
          <button type="button" disabled={pending} onClick={() => {
            if (window.confirm("Exclude this entire fixture from every later revision in this Builder run?")) {
              onAction("exclude_fixture", game);
            }
          }}>
            <Ban size={16} /> Don&apos;t use this game
          </button>
          <button type="button" disabled={pending}
            onClick={() => onAction("remove_selection", game)}>
            <Trash2 size={16} /> Remove and rebuild
          </button>
        </div>
      )}

      {feedback && (
        <p className={`editable-builder-leg__feedback is-${feedback.status}`}
          role={feedback.status === "failure" ? "alert" : "status"}>
          {feedback.status === "success" ? "✓ " : ""}{feedback.message}
        </p>
      )}

      {explanationOpen && (
        <section className="builder-pick-explanation">
          <h3>Why BetSightly selected {game.prediction}</h3>
          <dl>
            <div><dt>Conservative probability</dt><dd>{percent(game.evidence_adjusted_probability)}</dd></div>
            <div><dt>Reliability lower bound</dt><dd>{percent(game.trust?.lower_reliability_bound)}</dd></div>
            <div><dt>Evidence</dt><dd>{game.trust?.evidence_level || game.trust?.evidence_state || "Unavailable"}</dd></div>
            <div><dt>Fixture market rank</dt><dd>{game.public_rank ? `#${game.public_rank}` : "Unavailable"}</dd></div>
            <div><dt>SportyBet price</dt><dd>{game.real_odds?.toFixed(2) || "Unavailable"}</dd></div>
            <div><dt>Bookmaker alignment</dt><dd>{game.bookmaker_disagreement == null ? "Unavailable" : game.bookmaker_disagreement <= .08 ? "Close" : "Mixed"}</dd></div>
          </dl>
          <p>
            {alternative
              ? `${game.market} ranked ahead of ${alternative.market} on conservative, evidence-adjusted quality.`
              : "No equally strong public alternative is currently available for this fixture."}
          </p>
          {game.market?.startsWith("dnb_") && (
            <p>A draw is a push: that leg settles at 1.00x instead of winning or losing.</p>
          )}
        </section>
      )}
    </article>
  );
}
