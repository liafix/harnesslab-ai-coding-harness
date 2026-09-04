import { describe, expect, it } from "vitest";
import { createInitialHarnessState, harnessReducer } from "../domain/harness-engine";
import { buildContextPack } from "../domain/context-pack";
import { analyzeRepository } from "../domain/repository-analysis";
import { runFinalReleaseGate, runInitialReleaseGate } from "../domain/release-gate";
import { reviewPatch } from "../domain/patch-review";
import { analyzeReleaseRun, buildReleaseHistory, getCurrentReleaseAnalysis } from "../domain/production-readiness";
import { opsCoreInvariants } from "../scenario/opscore/invariants";
import { fixPatchFixture, initialPatchFixture } from "../scenario/opscore/patches";
import { opsCoreRepository } from "../scenario/opscore/repository";
import { opsCoreTask } from "../scenario/opscore/task";
import { architectureSteps, candidateStory, hiringQuestionMappings, interviewRoute } from "../presentation/candidate-story";
import { getExecutiveReadout } from "../presentation/executive-readout";

const advance = (actions: Parameters<typeof harnessReducer>[1][]) => actions.reduce(harnessReducer, createInitialHarnessState());

import { getGuidedDemoProgress } from "../presentation/guided-demo";
import { releaseInfo } from "../presentation/release-info";

describe("HarnessLab domain contract", () => {
  it("starts in a deterministic synthetic state", () => {
    const a = createInitialHarnessState();
    const b = createInitialHarnessState();
    expect(a).toEqual(b);
    expect(a.repository.synthetic).toBe(true);
    expect(a.repository.files).toHaveLength(42);
  });

  it("blocks patch generation before human plan approval", () => {
    const state = advance([{ type: "ANALYZE_REPOSITORY" }, { type: "BUILD_CONTEXT" }, { type: "PROPOSE_PLAN" }]);
    expect(() => harnessReducer(state, { type: "GENERATE_PATCH" })).toThrow(/not allowed/);
  });

  it("freezes the approved context snapshot", () => {
    const pack = buildContextPack(opsCoreTask, opsCoreRepository, opsCoreInvariants);
    expect(Object.isFrozen(pack)).toBe(true);
    expect(Object.isFrozen(pack.relevantFiles)).toBe(true);
    expect(Object.isFrozen(pack.invariants[0])).toBe(true);
  });

  it("blocks a patch that touches protected contracts", () => {
    const pack = buildContextPack(opsCoreTask, opsCoreRepository, opsCoreInvariants);
    const patch = { ...initialPatchFixture(pack.id), protectedContractTouched: true };
    expect(runInitialReleaseGate(patch).result).toBe("BLOCKED");
    expect(runFinalReleaseGate(patch).result).toBe("BLOCKED");
  });

  it("binds release decisions to concrete patch IDs", () => {
    const pack = buildContextPack(opsCoreTask, opsCoreRepository, opsCoreInvariants);
    const patch = initialPatchFixture(pack.id);
    expect(runInitialReleaseGate(patch).patchId).toBe(patch.id);
  });

  it("keeps initial patch and fix patch as separate iterations", () => {
    const state = advance([
      { type: "ANALYZE_REPOSITORY" }, { type: "BUILD_CONTEXT" }, { type: "PROPOSE_PLAN" }, { type: "APPROVE_PLAN" }, { type: "GENERATE_PATCH" }, { type: "REVIEW_PATCH" }, { type: "RUN_PRECHECK" }, { type: "EVALUATE_RELEASE" }, { type: "PROPOSE_FIX" }, { type: "APPROVE_FIX" },
    ]);
    expect(state.patches).toHaveLength(2);
    expect(state.patches.map((p) => p.iteration)).toEqual([1, 2]);
    expect(state.patches[0].id).not.toBe(state.patches[1].id);
  });
});

describe("PASS 1 golden vertical slice", () => {
  it("runs Task → Context → Patch → BLOCKED → Fix → READY", () => {
    const final = advance([
      { type: "ANALYZE_REPOSITORY" },
      { type: "BUILD_CONTEXT" },
      { type: "PROPOSE_PLAN" },
      { type: "APPROVE_PLAN" },
      { type: "GENERATE_PATCH" },
      { type: "REVIEW_PATCH" },
      { type: "RUN_PRECHECK" },
      { type: "EVALUATE_RELEASE" },
      { type: "PROPOSE_FIX" },
      { type: "APPROVE_FIX" },
      { type: "REVALIDATE" },
      { type: "CONFIRM_RELEASE" },
    ]);
    expect(final.stage).toBe("READY_FOR_PRODUCTION");
    expect(final.releaseDecisions).toHaveLength(2);
    expect(final.releaseDecisions[0].result).toBe("BLOCKED");
    expect(final.releaseDecisions[1].result).toBe("READY");
    expect(final.patches.map((patch) => patch.kind)).toEqual(["INITIAL", "FIX"]);
  });

  it("cannot jump directly from generated patch to production ready", () => {
    const state = advance([{ type: "ANALYZE_REPOSITORY" }, { type: "BUILD_CONTEXT" }, { type: "PROPOSE_PLAN" }, { type: "APPROVE_PLAN" }, { type: "GENERATE_PATCH" }]);
    expect(() => harnessReducer(state, { type: "REVALIDATE" })).toThrow(/not allowed/);
  });

  it("reset restores the exact seeded scenario", () => {
    const progressed = advance([{ type: "ANALYZE_REPOSITORY" }, { type: "BUILD_CONTEXT" }, { type: "PROPOSE_PLAN" }]);
    expect(harnessReducer(progressed, { type: "RESET" })).toEqual(createInitialHarnessState());
  });
});


describe("PASS 2 repository + context engineering", () => {
  it("selects the default five-file invoice context from task evidence", () => {
    const analysis = analyzeRepository(opsCoreTask, opsCoreRepository);
    expect(analysis.totalFiles).toBe(42);
    expect(analysis.relevantFiles).toHaveLength(5);
    expect(analysis.relevantFiles.map((file) => file.path)).toEqual(expect.arrayContaining([
      "services/invoices/invoice-service.ts",
      "domain/billing/invoice-policy.ts",
      "repositories/invoice.repository.ts",
      "integrations/erp/erp-adapter.ts",
      "tests/integration/invoice-retry.integration.test.ts",
    ]));
    expect(analysis.contextReductionPct).toBe(88);
    expect(analysis.protectedFiles).toHaveLength(3);
  });

  it("stores auditable relevance evidence in the immutable context snapshot", () => {
    const pack = buildContextPack(opsCoreTask, opsCoreRepository, opsCoreInvariants);
    expect(pack.selectionStrategy).toBe("relevance-v1");
    expect(pack.repositoryFileCount).toBe(42);
    expect(pack.contextReductionPct).toBe(88);
    expect(pack.selectedFileEvidence).toHaveLength(5);
    expect(pack.selectedFileEvidence.every((file) => file.score > 0)).toBe(true);
    expect(pack.dependencyPath).toContain("services/invoices/invoice-service.ts");
    expect(Object.isFrozen(pack.selectedFileEvidence)).toBe(true);
  });

  it("changes selected context when the engineering task changes", () => {
    const alternateTask = {
      ...opsCoreTask,
      id: "task-order-reservation-alert",
      title: "Notify on failed warehouse order reservation",
      request: "Add a notification when an order cannot reserve warehouse stock.",
      businessObjective: "Surface failed order reservations without changing the public order API.",
      acceptanceCriteria: ["Failed warehouse reservations create one notification.", "Order processing remains backward compatible."],
    };
    const analysis = analyzeRepository(alternateTask, opsCoreRepository);
    const selected = analysis.relevantFiles.map((file) => file.path);
    expect(selected).toContain("modules/orders/order-service.ts");
    expect(selected).toContain("modules/warehouse/reservation-service.ts");
    expect(selected).toContain("modules/notifications/notification-service.ts");
    expect(selected).not.toEqual(analyzeRepository(opsCoreTask, opsCoreRepository).relevantFiles.map((file) => file.path));
  });

  it("never places protected contracts into AI patch context", () => {
    const analysis = analyzeRepository(opsCoreTask, opsCoreRepository);
    expect(analysis.relevantFiles.some((file) => file.protected)).toBe(false);
    expect(analysis.protectedFiles).toEqual(expect.arrayContaining([
      "business-invariants/invoice-export.ts",
      "release-policy/policy.ts",
      "architecture-contract/public-api.ts",
    ]));
  });
});


describe("PASS 3 patch review + impact analysis", () => {
  const createApprovedInputs = () => {
    const contextPack = buildContextPack(opsCoreTask, opsCoreRepository, opsCoreInvariants);
    const state = advance([
      { type: "ANALYZE_REPOSITORY" },
      { type: "BUILD_CONTEXT" },
      { type: "PROPOSE_PLAN" },
      { type: "APPROVE_PLAN" },
    ]);
    if (!state.plan) throw new Error("Expected approved plan fixture.");
    return { contextPack, plan: state.plan };
  };

  it("derives file-level risk, module impact and invariant touchpoints from the initial patch", () => {
    const { contextPack, plan } = createApprovedInputs();
    const review = reviewPatch(initialPatchFixture(contextPack.id), contextPack, plan, opsCoreRepository);
    expect(review.verdict).toBe("PASS");
    expect(review.totals).toEqual({ files: 4, additions: 83, deletions: 11 });
    expect(review.affectedModules).toEqual(expect.arrayContaining(["billing-domain", "integration-tests", "invoice-repository", "invoice-service"]));
    expect(review.invariantTouchpoints.map((item) => item.invariantId)).toEqual(["INV-01", "INV-02", "INV-03"]);
    expect(review.protectedChanges).toEqual([]);
    expect(review.outsideContextFiles).toEqual([]);
    expect(review.unplannedFiles).toEqual([]);
    expect(review.riskSummary).toEqual({ low: 1, medium: 3, high: 0, highest: "MEDIUM" });
  });

  it("keeps the scoped fix review bound to the original approved context", () => {
    const { contextPack, plan } = createApprovedInputs();
    const review = reviewPatch(fixPatchFixture(contextPack.id), contextPack, plan, opsCoreRepository);
    expect(review.verdict).toBe("PASS");
    expect(review.contextBindingValid).toBe(true);
    expect(review.totals).toEqual({ files: 2, additions: 21, deletions: 8 });
    expect(review.invariantTouchpoints.map((item) => item.invariantId)).toEqual(["INV-02", "INV-03"]);
  });

  it("surfaces plan drift without silently treating it as a protected/context violation", () => {
    const { contextPack, plan } = createApprovedInputs();
    const drift = initialPatchFixture(contextPack.id);
    drift.files = [...drift.files, {
      path: "integrations/erp/erp-adapter.ts",
      additions: 3, deletions: 1, reason: "Adjust ERP request metadata.", risk: "MEDIUM", invariantIds: ["INV-01"],
    }];
    const review = reviewPatch(drift, contextPack, plan, opsCoreRepository);
    expect(review.verdict).toBe("PASS");
    expect(review.outsideContextFiles).toEqual([]);
    expect(review.unplannedFiles).toContain("integrations/erp/erp-adapter.ts");
  });

  it("detects protected-contract changes from repository paths even when the patch flag lies", () => {
    const { contextPack, plan } = createApprovedInputs();
    const malicious = initialPatchFixture(contextPack.id);
    malicious.protectedContractTouched = false;
    malicious.files = [...malicious.files, {
      path: "release-policy/policy.ts",
      additions: 2, deletions: 1,
      reason: "Weaken release policy to make the patch pass.",
      risk: "HIGH",
      invariantIds: [],
    }];
    const review = reviewPatch(malicious, contextPack, plan, opsCoreRepository);
    expect(review.verdict).toBe("BLOCKED");
    expect(review.protectedChanges).toContain("release-policy/policy.ts");
    expect(review.outsideContextFiles).toContain("release-policy/policy.ts");
  });

  it("blocks stale context binding and unknown repository files", () => {
    const { contextPack, plan } = createApprovedInputs();
    const stale = initialPatchFixture("context-stale-v0");
    stale.files = [...stale.files, {
      path: "services/invoices/ghost-export.ts",
      additions: 4, deletions: 0, reason: "Unknown file injection.", risk: "HIGH", invariantIds: ["INV-01"],
    }];
    const review = reviewPatch(stale, contextPack, plan, opsCoreRepository);
    expect(review.verdict).toBe("BLOCKED");
    expect(review.contextBindingValid).toBe(false);
    expect(review.unknownFiles).toContain("services/invoices/ghost-export.ts");
  });

  it("records human patch review evidence without changing the hardened state sequence", () => {
    const reviewed = advance([
      { type: "ANALYZE_REPOSITORY" }, { type: "BUILD_CONTEXT" }, { type: "PROPOSE_PLAN" }, { type: "APPROVE_PLAN" }, { type: "GENERATE_PATCH" }, { type: "REVIEW_PATCH" },
    ]);
    expect(reviewed.stage).toBe("PATCH_REVIEWED");
    expect(reviewed.audit.at(-1)?.message).toMatch(/4 files, 4 modules, 3 invariant touchpoints, no protected changes/);
  });
});


describe("PASS 4 production release gate + failure loop", () => {
  it("groups the initial gate by category and narrows blocking failure context", () => {
    const pack = buildContextPack(opsCoreTask, opsCoreRepository, opsCoreInvariants);
    const patch = initialPatchFixture(pack.id);
    const decision = runInitialReleaseGate(patch);
    const analysis = analyzeReleaseRun(decision, patch, "INITIAL");

    expect(analysis.complete).toBe(true);
    expect(analysis.effectiveResult).toBe("BLOCKED");
    expect(analysis.blockingFailures.map((check) => check.id)).toEqual(["inv2", "inv3"]);
    expect(analysis.categories.find((group) => group.category === "DOMAIN")?.status).toBe("FAIL");
    expect(analysis.categories.find((group) => group.category === "STATIC")?.status).toBe("PASS");
    expect(analysis.failureContext?.failedInvariantIds).toEqual(["INV-02", "INV-03"]);
    expect(analysis.failureContext?.relevantFiles).toEqual([
      "services/invoices/invoice-service.ts",
      "tests/integration/invoice-retry.integration.test.ts",
    ]);
    expect(analysis.failureContext?.failingTests).toEqual(["tests/integration/invoice-retry.integration.test.ts"]);
  });

  it("verifies that the fix receives a complete full release-gate re-run", () => {
    const pack = buildContextPack(opsCoreTask, opsCoreRepository, opsCoreInvariants);
    const fix = fixPatchFixture(pack.id);
    const decision = runFinalReleaseGate(fix);
    const analysis = analyzeReleaseRun(decision, fix, "FINAL");

    expect(analysis.complete).toBe(true);
    expect(analysis.fullRerun).toBe(true);
    expect(analysis.effectiveResult).toBe("READY");
    expect(analysis.blockingFailures).toEqual([]);
    expect(analysis.expectedCheckIds).toEqual(expect.arrayContaining(["typecheck", "lint", "unit", "integration", "inv1", "inv2", "inv3", "inv4", "inv5", "protected", "architecture", "regression", "build"]));
  });

  it("fails closed when an adversarial READY decision omits a required final gate", () => {
    const pack = buildContextPack(opsCoreTask, opsCoreRepository, opsCoreInvariants);
    const fix = fixPatchFixture(pack.id);
    const decision = runFinalReleaseGate(fix);
    const incomplete = { ...decision, result: "READY" as const, checks: decision.checks.filter((check) => check.id !== "build") };
    const analysis = analyzeReleaseRun(incomplete, fix, "FINAL");

    expect(analysis.complete).toBe(false);
    expect(analysis.missingCheckIds).toContain("build");
    expect(analysis.effectiveResult).toBe("BLOCKED");
    expect(analysis.fullRerun).toBe(false);
  });

  it("keeps release decisions bound to the patch they validated", () => {
    const pack = buildContextPack(opsCoreTask, opsCoreRepository, opsCoreInvariants);
    const initial = initialPatchFixture(pack.id);
    const fix = fixPatchFixture(pack.id);
    const decision = runInitialReleaseGate(initial);
    expect(() => analyzeReleaseRun(decision, fix, "FINAL")).toThrow(/does not belong to patch/);
  });

  it("records iteration 1 BLOCKED and iteration 2 READY after a full re-run", () => {
    const final = advance([
      { type: "ANALYZE_REPOSITORY" },
      { type: "BUILD_CONTEXT" },
      { type: "PROPOSE_PLAN" },
      { type: "APPROVE_PLAN" },
      { type: "GENERATE_PATCH" },
      { type: "REVIEW_PATCH" },
      { type: "RUN_PRECHECK" },
      { type: "EVALUATE_RELEASE" },
      { type: "PROPOSE_FIX" },
      { type: "APPROVE_FIX" },
      { type: "REVALIDATE" },
    ]);
    const history = buildReleaseHistory(final);
    expect(history).toHaveLength(2);
    expect(history[0]).toMatchObject({ iteration: 1, kind: "INITIAL", decision: "BLOCKED", complete: true, fullRerun: false, blockingFailures: 2 });
    expect(history[1]).toMatchObject({ iteration: 2, kind: "FIX", decision: "READY", complete: true, fullRerun: true, blockingFailures: 0 });
    expect(getCurrentReleaseAnalysis(final)?.effectiveResult).toBe("READY");
    expect(final.stage).toBe("REVALIDATED");
  });
});

describe("PASS 5 candidate story + Apertia mapping", () => {
  it("maps exactly eight public-role hiring questions to visible HarnessLab evidence", () => {
    expect(hiringQuestionMappings).toHaveLength(8);
    expect(new Set(hiringQuestionMappings.map((item) => item.id)).size).toBe(8);
    expect(hiringQuestionMappings.every((item) => item.harnessEvidence.length >= 3)).toBe(true);
    expect(hiringQuestionMappings.every((item) => item.route.startsWith("/"))).toBe(true);
    expect(hiringQuestionMappings.find((item) => item.id === "first-hour")?.answer).toMatch(/map the repository/i);
    expect(hiringQuestionMappings.find((item) => item.id === "production")?.answer).toMatch(/complete gate/i);
  });

  it("keeps the candidate story inside a public-context credibility boundary", () => {
    expect(candidateStory.boundary).toMatch(/synthetic/i);
    expect(candidateStory.boundary).toMatch(/No Apertia proprietary code/i);
    expect(candidateStory.boundary).toMatch(/publicly described role/i);
  });

  it("keeps final production ownership explicit in the architecture story", () => {
    expect(architectureSteps[0]).toMatchObject({ title: "Engineering Request", owner: "DEVELOPER" });
    expect(architectureSteps.some((step) => step.title === "Candidate Patch" && step.owner === "AI")).toBe(true);
    expect(architectureSteps.at(-1)).toMatchObject({ title: "Developer Release Decision", owner: "DEVELOPER", artifact: "READY_FOR_PRODUCTION" });
  });

  it("defines a focused interview route that ends inside the 3–5 minute target", () => {
    expect(interviewRoute).toHaveLength(6);
    expect(interviewRoute[0].time).toBe("0:00–0:30");
    expect(interviewRoute.at(-1)?.time).toBe("4:00–4:30");
    expect(interviewRoute.some((step) => /production blocker/i.test(step.title))).toBe(true);
    expect(interviewRoute.some((step) => /scoped fix/i.test(step.title))).toBe(true);
  });

  it("derives recruiter-facing engineering evidence from the existing frozen state", () => {
    const final = advance([
      { type: "ANALYZE_REPOSITORY" },
      { type: "BUILD_CONTEXT" },
      { type: "PROPOSE_PLAN" },
      { type: "APPROVE_PLAN" },
      { type: "GENERATE_PATCH" },
      { type: "REVIEW_PATCH" },
      { type: "RUN_PRECHECK" },
      { type: "EVALUATE_RELEASE" },
      { type: "PROPOSE_FIX" },
      { type: "APPROVE_FIX" },
      { type: "REVALIDATE" },
      { type: "CONFIRM_RELEASE" },
    ]);
    expect(getExecutiveReadout(final)).toEqual({
      repositoryContext: "5 / 42",
      contextReduction: "88%",
      aiIterations: 2,
      protectedContracts: 3,
      blockersCaught: 2,
      releaseStatus: "READY_FOR_PRODUCTION",
    });
  });
});


describe("PASS 6 UX + QA + release candidate", () => {
  it("derives guided-demo progress from the frozen state-machine order", () => {
    expect(getGuidedDemoProgress("TASK_RECEIVED")).toMatchObject({ current: 1, total: 13, complete: false });
    expect(getGuidedDemoProgress("RELEASE_BLOCKED").stageLabel).toMatch(/Production blocked/i);
    expect(getGuidedDemoProgress("READY_FOR_PRODUCTION")).toMatchObject({ current: 13, total: 13, percent: 100, complete: true });
  });

  it("publishes deterministic release-candidate boundaries without requiring a live provider", () => {
    expect(releaseInfo.label).toBe("Release Candidate");
    expect(releaseInfo.mode).toMatch(/Deterministic synthetic harness/i);
    expect(releaseInfo.providerRequirement).toBe("No live LLM required");
    expect(releaseInfo.visibility).toMatch(/noindex/i);
  });
});
