import type { HarnessState, Patch, ReleaseDecision, ValidationCheck } from "./types";

export type ReleasePhase = "INITIAL" | "FINAL";
export type GateStatus = "PASS" | "WARN" | "FAIL";

export type ValidationCategorySummary = {
  category: ValidationCheck["category"];
  label: string;
  status: GateStatus;
  checks: ValidationCheck[];
  blockingFailures: number;
  warnings: number;
};

export type FailureContext = {
  patchId: string;
  failedCheckIds: string[];
  failedInvariantIds: string[];
  relevantFiles: string[];
  failingTests: string[];
  observed: string[];
  expected: string[];
  scopeReason: string;
};

export type ReleaseRunAnalysis = {
  phase: ReleasePhase;
  patchId: string;
  recordedResult: ReleaseDecision["result"];
  effectiveResult: ReleaseDecision["result"];
  complete: boolean;
  fullRerun: boolean;
  expectedCheckIds: string[];
  missingCheckIds: string[];
  unexpectedCheckIds: string[];
  categories: ValidationCategorySummary[];
  blockingFailures: ValidationCheck[];
  warnings: ValidationCheck[];
  failureContext: FailureContext | null;
};

export type ReleaseIteration = {
  iteration: Patch["iteration"];
  patchId: string;
  kind: Patch["kind"];
  filesChanged: number;
  decision: ReleaseDecision["result"] | "PENDING";
  complete: boolean;
  fullRerun: boolean;
  blockingFailures: number;
};

const categoryOrder: ValidationCheck["category"][] = ["STATIC", "TEST", "DOMAIN", "ARCHITECTURE", "RELEASE"];
const categoryLabels: Record<ValidationCheck["category"], string> = {
  STATIC: "Static analysis",
  TEST: "Test evidence",
  DOMAIN: "Business invariants",
  ARCHITECTURE: "Architecture & policy",
  RELEASE: "Release build",
};

const INITIAL_REQUIRED = [
  "typecheck",
  "lint",
  "unit",
  "integration",
  "architecture",
  "protected",
  "inv1",
  "inv2",
  "inv3",
  "inv4",
  "inv5",
  "build",
] as const;

const FINAL_REQUIRED = [...INITIAL_REQUIRED, "regression"] as const;

const invariantIdByCheck: Record<string, string> = {
  inv1: "INV-01",
  inv2: "INV-02",
  inv3: "INV-03",
  inv4: "INV-04",
  inv5: "INV-05",
};

const scenarioEvidence: Record<string, { observed?: string; expected?: string }> = {
  inv2: {
    observed: "Retry preserves one ERP export but creates a second audit outcome.",
    expected: "Retry is idempotent across ERP export and audit outcome.",
  },
  inv3: {
    observed: "1 ERP export / 2 audit outcomes.",
    expected: "1 ERP export / 1 audit outcome.",
  },
};

const rankResult = (checks: ValidationCheck[]): GateStatus => {
  if (checks.some((check) => check.result === "FAIL" && check.severity === "BLOCKING")) return "FAIL";
  if (checks.some((check) => check.result === "WARN" || (check.result === "FAIL" && check.severity === "NON_BLOCKING"))) return "WARN";
  return "PASS";
};

export function expectedReleaseCheckIds(phase: ReleasePhase): string[] {
  return [...(phase === "FINAL" ? FINAL_REQUIRED : INITIAL_REQUIRED)];
}

function buildFailureContext(decision: ReleaseDecision, patch: Patch, blockingFailures: ValidationCheck[]): FailureContext | null {
  if (blockingFailures.length === 0) return null;

  const failedCheckIds = blockingFailures.map((check) => check.id);
  const failedInvariantIds = failedCheckIds.map((id) => invariantIdByCheck[id]).filter((id): id is string => Boolean(id));

  // Narrow to files that touch every failed invariant when possible. This yields the smallest
  // evidence-backed slice for the default retry/audit failure instead of re-feeding the whole patch.
  const invariantRelevant = failedInvariantIds.length
    ? patch.files.filter((file) => failedInvariantIds.every((id) => file.invariantIds.includes(id)))
    : [];
  const relevantFiles = (invariantRelevant.length ? invariantRelevant : patch.files.filter((file) => file.invariantIds.some((id) => failedInvariantIds.includes(id))))
    .map((file) => file.path);

  const failingTests = relevantFiles.filter((path) => /(^|\/)tests?\//.test(path) || /\.test\./.test(path));
  const observed = failedCheckIds.map((id) => scenarioEvidence[id]?.observed).filter((value): value is string => Boolean(value));
  const expected = failedCheckIds.map((id) => scenarioEvidence[id]?.expected).filter((value): value is string => Boolean(value));

  return {
    patchId: patch.id,
    failedCheckIds,
    failedInvariantIds,
    relevantFiles,
    failingTests,
    observed,
    expected,
    scopeReason: failedInvariantIds.length
      ? `Context narrowed to files jointly touching ${failedInvariantIds.join(" + ")}; unrelated repository context is excluded from the fix loop.`
      : "Context narrowed to the files directly implicated by blocking validation evidence.",
  };
}

export function analyzeReleaseRun(decision: ReleaseDecision, patch: Patch, phase: ReleasePhase): ReleaseRunAnalysis {
  if (decision.patchId !== patch.id) throw new Error(`Release decision ${decision.patchId} does not belong to patch ${patch.id}.`);

  const expectedCheckIds = expectedReleaseCheckIds(phase);
  const actualIds = decision.checks.map((check) => check.id);
  const missingCheckIds = expectedCheckIds.filter((id) => !actualIds.includes(id));
  const unexpectedCheckIds = actualIds.filter((id) => !expectedCheckIds.includes(id));
  const complete = missingCheckIds.length === 0;
  const blockingFailures = decision.checks.filter((check) => check.result === "FAIL" && check.severity === "BLOCKING");
  const warnings = decision.checks.filter((check) => check.result === "WARN" || (check.result === "FAIL" && check.severity === "NON_BLOCKING"));

  const categories = categoryOrder.map((category) => {
    const checks = decision.checks.filter((check) => check.category === category);
    return {
      category,
      label: categoryLabels[category],
      status: rankResult(checks),
      checks,
      blockingFailures: checks.filter((check) => check.result === "FAIL" && check.severity === "BLOCKING").length,
      warnings: checks.filter((check) => check.result === "WARN" || (check.result === "FAIL" && check.severity === "NON_BLOCKING")).length,
    } satisfies ValidationCategorySummary;
  });

  const effectiveResult: ReleaseDecision["result"] = complete && blockingFailures.length === 0 ? "READY" : "BLOCKED";

  return {
    phase,
    patchId: patch.id,
    recordedResult: decision.result,
    effectiveResult,
    complete,
    fullRerun: phase === "FINAL" && complete,
    expectedCheckIds,
    missingCheckIds,
    unexpectedCheckIds,
    categories,
    blockingFailures,
    warnings,
    failureContext: buildFailureContext(decision, patch, blockingFailures),
  };
}

export function buildReleaseHistory(state: HarnessState): ReleaseIteration[] {
  return state.patches.map((patch) => {
    const decision = state.releaseDecisions.find((item) => item.patchId === patch.id);
    if (!decision) {
      return {
        iteration: patch.iteration,
        patchId: patch.id,
        kind: patch.kind,
        filesChanged: patch.files.length,
        decision: "PENDING",
        complete: false,
        fullRerun: false,
        blockingFailures: 0,
      };
    }
    const phase: ReleasePhase = patch.kind === "FIX" ? "FINAL" : "INITIAL";
    const analysis = analyzeReleaseRun(decision, patch, phase);
    return {
      iteration: patch.iteration,
      patchId: patch.id,
      kind: patch.kind,
      filesChanged: patch.files.length,
      decision: analysis.effectiveResult,
      complete: analysis.complete,
      fullRerun: analysis.fullRerun,
      blockingFailures: analysis.blockingFailures.length,
    };
  });
}

export function getCurrentReleaseAnalysis(state: HarnessState): ReleaseRunAnalysis | null {
  const decision = state.releaseDecisions.at(-1);
  if (!decision) return null;
  const patch = state.patches.find((item) => item.id === decision.patchId);
  if (!patch) throw new Error(`Release decision references missing patch ${decision.patchId}.`);
  return analyzeReleaseRun(decision, patch, patch.kind === "FIX" ? "FINAL" : "INITIAL");
}
