import { createContext, useContext } from "react";
import type { BuilderAction, EditableBuiltSlip } from "../api/builderRevisions";
import type { BuilderV2GenerateRequest, BuilderV2ManualRequest } from "../api/predictions";
import type { GamePrediction } from "../types";

export type BuilderHorizon = "today" | "3_days" | "week";

export interface BuilderContextValue {
  target: number;
  horizon: BuilderHorizon;
  slip: EditableBuiltSlip | null;
  loading: boolean;
  recoveringCode: boolean;
  error: string | null;
  editingSelectionId: string | null;
  editingMessage: string | null;
  editingAction: BuilderAction | null;
  revisionFeedback: {
    action: BuilderAction;
    status: "success" | "failure";
    oldGame?: GamePrediction;
    newGame?: GamePrediction;
    message: string;
  } | null;

  chooseTarget: (target: number, preserveSlip?: boolean) => void;
  chooseHorizon: (horizon: BuilderHorizon) => void;

  build: (
    regenerate?: boolean,
    targetOverride?: number,
    preserveSlip?: boolean,
  ) => Promise<void>;
  buildV2: (
    input: BuilderV2GenerateRequest | BuilderV2ManualRequest,
    preserveSlip?: boolean,
  ) => Promise<void>;
  buildAnother: () => Promise<void>;
  retryBuild: () => Promise<void>;
  clearSlip: () => void;
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
