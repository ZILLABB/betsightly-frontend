import type { BuiltSlip } from "./predictions";
import type { GamePrediction } from "../types";

const BASE = import.meta.env.VITE_API_BASE_URL ||
  "https://betsightly-api.onrender.com/api";

export type BuilderAction =
  | "replace_selection"
  | "safer_same_fixture"
  | "exclude_fixture"
  | "remove_selection"
  | "lock_selection"
  | "unlock_selection"
  | "accept_best_reachable";

export interface BuilderChangeSummary {
  action: BuilderAction;
  removed: GamePrediction[];
  added: GamePrediction[];
  old_odds?: number;
  new_odds?: number;
  reason?: string;
}

export interface EditableBuiltSlip extends BuiltSlip {
  builder_run_id?: string;
  edit_token?: string;
  revision?: number;
  parent_revision?: number | null;
  revision_status?: "no_change";
  action_error?: string;
  locked_selection_ids?: string[];
  excluded_fixture_ids?: string[];
  excluded_selection_ids?: string[];
  change_summary?: BuilderChangeSummary;
  board?: { ready: boolean; degraded: boolean; complete: boolean };
}

export interface ReviseBuilderRequest {
  runId: string;
  editToken: string;
  revision: number;
  requestId: string;
  action: BuilderAction;
  selectionId?: string;
  fixtureId?: string;
  target?: number;
}

export async function reviseBuilderSlip(
  input: ReviseBuilderRequest,
  signal?: AbortSignal,
): Promise<EditableBuiltSlip> {
  const response = await fetch(
    `${BASE}/leagues/slip-builder/${encodeURIComponent(input.runId)}/revise`,
    {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        revision: input.revision,
        request_id: input.requestId,
        edit_token: input.editToken,
        action: input.action,
        selection_id: input.selectionId,
        fixture_id: input.fixtureId,
        target: input.target,
      }),
    },
  );
  if (!response.ok) {
    let detail: unknown;
    try {
      detail = (await response.json())?.detail;
    } catch {
      detail = null;
    }
    const message = typeof detail === "string"
      ? detail
      : (detail as { code?: string } | null)?.code || `HTTP ${response.status}`;
    const error = new Error(message) as Error & {
      status?: number;
      latestRevision?: number;
    };
    error.status = response.status;
    error.latestRevision = (detail as { latest_revision?: number } | null)
      ?.latest_revision;
    throw error;
  }
  return response.json() as Promise<EditableBuiltSlip>;
}
