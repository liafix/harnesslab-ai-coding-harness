import type { BusinessInvariant } from "../../domain/types";

export const opsCoreInvariants: BusinessInvariant[] = [
  { id: "INV-01", title: "At-most-once ERP export", rule: "One business invoice may be exported to ERP at most once.", blocking: true },
  { id: "INV-02", title: "Idempotent retry", rule: "A retry of the same request must be idempotent.", blocking: true },
  { id: "INV-03", title: "Exactly-one audit outcome", rule: "Every export decision must produce exactly one audit outcome.", blocking: true },
  { id: "INV-04", title: "Backward-compatible public API", rule: "The public invoice API contract must remain backward compatible.", blocking: true },
  { id: "INV-05", title: "No schema migration", rule: "No database migration is allowed for this task.", blocking: true },
];
