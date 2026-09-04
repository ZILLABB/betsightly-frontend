import { createContext, useContext } from "react";
import type { BuiltSlip } from "../api/predictions";

export type BuilderHorizon = "today" | "week";

export interface BuilderContextValue {
  target: number;
  horizon: BuilderHorizon;
  slip: BuiltSlip | null;
  loading: boolean;
  recoveringCode: boolean;
  error: string | null;

  chooseTarget: (target: number) => void;
  chooseHorizon: (horizon: BuilderHorizon) => void;

  build: (
    regenerate?: boolean,
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