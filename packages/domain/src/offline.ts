import type { AgronomicSourceStatus } from "./agronomy.js";

export type OfflineEntity =
  | "library"
  | "region"
  | "crop"
  | "calendar"
  | "sample_draft"
  | "consultation_draft";
export type OfflineSyncStrategy = "prefer-server" | "prefer-local";

export interface OfflineRecordState {
  entity: OfflineEntity;
  status: AgronomicSourceStatus;
  hasPendingLocalChanges: boolean;
}

export function resolveOfflineSyncStrategy(
  input: OfflineRecordState,
): OfflineSyncStrategy {
  if (
    input.entity === "sample_draft" ||
    input.entity === "consultation_draft"
  ) {
    return "prefer-local";
  }

  if (input.hasPendingLocalChanges && input.status === "self_reported") {
    return "prefer-local";
  }

  return "prefer-server";
}
