import type { HarnessState } from "../domain/types";
import { analyzeReleaseRun } from "../domain/production-readiness";

export type ExecutiveReadout = {
  repositoryContext: string;
  contextReduction: string;
  aiIterations: number;
  protectedContracts: number;
  blockersCaught: number;
  releaseStatus: "DISCOVERY" | "IN_PROGRESS" | "BLOCKED" | "READY" | "READY_FOR_PRODUCTION";
};

export function getExecutiveReadout(state: HarnessState): ExecutiveReadout {
  const relevant = state.contextPack?.relevantFiles.length ?? 0;
  const total = state.repository.files.length;
  const contextReduction = state.contextPack ? `${state.contextPack.contextReductionPct}%` : "—";
  const protectedContracts = state.repository.files.filter((file) => file.protected).length;
  const blockersCaught = state.releaseDecisions.reduce((sum, decision, index) => {
    const patch = state.patches.find((candidate) => candidate.id === decision.patchId);
    if (!patch) return sum;
    const phase = patch.kind === "FIX" ? "FINAL" : "INITIAL";
    const analysis = analyzeReleaseRun(decision, patch, phase);
    if (index > 0 && analysis.effectiveResult === "READY") return sum;
    return sum + analysis.blockingFailures.length;
  }, 0);

  let releaseStatus: ExecutiveReadout["releaseStatus"] = "DISCOVERY";
  if (state.stage === "READY_FOR_PRODUCTION") releaseStatus = "READY_FOR_PRODUCTION";
  else if (state.stage === "REVALIDATED") releaseStatus = "READY";
  else if (state.stage === "RELEASE_BLOCKED" || state.stage === "FIX_PROPOSED" || state.stage === "FIX_APPROVED") releaseStatus = "BLOCKED";
  else if (state.stage !== "TASK_RECEIVED") releaseStatus = "IN_PROGRESS";

  return {
    repositoryContext: `${relevant || "—"} / ${total}`,
    contextReduction,
    aiIterations: state.patches.length,
    protectedContracts,
    blockersCaught,
    releaseStatus,
  };
}
