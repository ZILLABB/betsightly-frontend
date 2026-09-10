import { createContext, useContext } from "react";
import type { BuilderAction, EditableBuiltSlip } from "../api/builderRevisions";
import type { GamePrediction } from "../types";

export type BuilderHorizon = "today" | "week";

export interface BuilderContextValue {
  target: number;
  horizon: BuilderHorizon;
  slip: EditableBuiltSlip | null;
  loading: boolean;
  recoveringCode: boolean;
  error: string | null;
  editingSelectionId: string | null;
  editingMessage: string | null;

  chooseTarget: (target: number, preserveSlip?: boolean) => void;
  chooseHorizon: (horizon: BuilderHorizon) => void;

  build: (
    regenerate?: boolean,
    targetOverride?: number,
    preserveSlip?: boolean,
  ) => Promise<void>;
  reviseLeg: (
    action: BuilderAction,
    game?: GamePrediction,
    targetOverride?: number,
  ) => Promise<void>;
}

export const BuilderContext =
  createContext<BuilderContextValue | null>(null);

export function useBuilder(): BuilderContextValue {
  const context = useContext(BuilderContext);

  if (!context) {
    throw new Error(
      "useBuilder must be used inside BuilderProvider",
    );
  }

  return context;
}
