import type { HarnessAction, HarnessState, ValidationCheck } from "../domain/types";
import { reviewPatch } from "../domain/patch-review";

export function getGuidedAction(state: HarnessState): { label: string; action: HarnessAction | null } {
  switch (state.stage) {
    case "TASK_RECEIVED": return { label: "Investigate Repository", action: { type: "ANALYZE_REPOSITORY" } };
    case "REPOSITORY_ANALYZED": return { label: "Build Context Pack", action: { type: "BUILD_CONTEXT" } };
    case "CONTEXT_READY": return { label: "Generate Implementation Plan", action: { type: "PROPOSE_PLAN" } };
    case "PLAN_PROPOSED": return { label: "Approve Implementation Plan", action: { type: "APPROVE_PLAN" } };
    case "PLAN_APPROVED": return { label: "Generate AI Candidate Patch", action: { type: "GENERATE_PATCH" } };
    case "PATCH_GENERATED": return { label: "Complete Human Patch Review", action: { type: "REVIEW_PATCH" } };
    case "PATCH_REVIEWED": return { label: "Run Pre-check", action: { type: "RUN_PRECHECK" } };
    case "PRECHECK_PASSED": return { label: "Evaluate Production Readiness", action: { type: "EVALUATE_RELEASE" } };
    case "RELEASE_BLOCKED": return { label: "Generate Scoped Fix", action: { type: "PROPOSE_FIX" } };
    case "FIX_PROPOSED": return { label: "Approve Fix", action: { type: "APPROVE_FIX" } };
    case "FIX_APPROVED": return { label: "Re-run Release Gate", action: { type: "REVALIDATE" } };
    case "REVALIDATED": return { label: "Confirm Production Release", action: { type: "CONFIRM_RELEASE" } };
    case "READY_FOR_PRODUCTION": return { label: "Demo Complete", action: null };
  }
}

export const getCurrentDecision = (state: HarnessState) => state.releaseDecisions.at(-1) ?? null;
export const getLatestPatch = (state: HarnessState) => state.patches.at(-1) ?? null;

export const getBlockingFailures = (checks: ValidationCheck[]) => checks.filter((check) => check.result === "FAIL" && check.severity === "BLOCKING");

export function getCurrentPatchReview(state: HarnessState) {
  const patch = getLatestPatch(state);
  if (!patch || !state.contextPack || !state.plan) return null;
  return reviewPatch(patch, state.contextPack, state.plan, state.repository);
}

export { analyzeRepository } from "../domain/repository-analysis";
export { buildReleaseHistory, getCurrentReleaseAnalysis } from "../domain/production-readiness";
