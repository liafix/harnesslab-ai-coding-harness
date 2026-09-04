import type { HarnessStage } from "./types";

export const stageOrder: HarnessStage[] = [
  "TASK_RECEIVED",
  "REPOSITORY_ANALYZED",
  "CONTEXT_READY",
  "PLAN_PROPOSED",
  "PLAN_APPROVED",
  "PATCH_GENERATED",
  "PATCH_REVIEWED",
  "PRECHECK_PASSED",
  "RELEASE_BLOCKED",
  "FIX_PROPOSED",
  "FIX_APPROVED",
  "REVALIDATED",
  "READY_FOR_PRODUCTION",
];

export const stageLabel: Record<HarnessStage, string> = {
  TASK_RECEIVED: "Task received",
  REPOSITORY_ANALYZED: "Repository analyzed",
  CONTEXT_READY: "Context ready",
  PLAN_PROPOSED: "Plan proposed",
  PLAN_APPROVED: "Plan approved",
  PATCH_GENERATED: "Patch generated",
  PATCH_REVIEWED: "Patch reviewed",
  PRECHECK_PASSED: "Pre-check passed",
  RELEASE_BLOCKED: "Production blocked",
  FIX_PROPOSED: "Fix proposed",
  FIX_APPROVED: "Fix approved",
  REVALIDATED: "Revalidated",
  READY_FOR_PRODUCTION: "Ready for production",
};
