import { buildContextPack } from "./context-pack";
import { runFinalReleaseGate, runInitialReleaseGate } from "./release-gate";
import { reviewPatch } from "./patch-review";
import type { AuditEvent, HarnessAction, HarnessStage, HarnessState, ImplementationPlan } from "./types";
import { opsCoreInvariants } from "../scenario/opscore/invariants";
import { fixPatchFixture, initialPatchFixture } from "../scenario/opscore/patches";
import { opsCoreRepository } from "../scenario/opscore/repository";
import { opsCoreTask } from "../scenario/opscore/task";

const audit = (type: string, message: string, stage: HarnessStage, n: number): AuditEvent => ({ id: `audit-${n}`, type, message, stage });

const cloneData = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createInitialHarnessState(): HarnessState {
  return {
    stage: "TASK_RECEIVED",
    task: cloneData(opsCoreTask),
    repository: cloneData(opsCoreRepository),
    contextPack: null,
    plan: null,
    patches: [],
    releaseDecisions: [],
    audit: [audit("SCENARIO_RESET", "Synthetic OpsCore ERP scenario loaded.", "TASK_RECEIVED", 1)],
  };
}

const assertStage = (state: HarnessState, allowed: HarnessStage[], action: HarnessAction["type"]) => {
  if (!allowed.includes(state.stage)) throw new Error(`${action} is not allowed from ${state.stage}.`);
};

const nextAudit = (state: HarnessState, type: string, message: string, stage: HarnessStage) => [...state.audit, audit(type, message, stage, state.audit.length + 1)];

export function harnessReducer(state: HarnessState, action: HarnessAction): HarnessState {
  if (action.type === "RESET") return createInitialHarnessState();

  switch (action.type) {
    case "ANALYZE_REPOSITORY": {
      assertStage(state, ["TASK_RECEIVED"], action.type);
      return { ...state, stage: "REPOSITORY_ANALYZED", audit: nextAudit(state, "REPOSITORY_ANALYZED", `Repository mapped: ${state.repository.files.length} files, dependency graph identified.`, "REPOSITORY_ANALYZED") };
    }
    case "BUILD_CONTEXT": {
      assertStage(state, ["REPOSITORY_ANALYZED"], action.type);
      const contextPack = buildContextPack(state.task, state.repository, opsCoreInvariants);
      return { ...state, stage: "CONTEXT_READY", contextPack, audit: nextAudit(state, "CONTEXT_READY", `Context pack frozen with ${contextPack.relevantFiles.length} relevant files.`, "CONTEXT_READY") };
    }
    case "PROPOSE_PLAN": {
      assertStage(state, ["CONTEXT_READY"], action.type);
      if (!state.contextPack) throw new Error("Context pack is required before planning.");
      const plan: ImplementationPlan = {
        id: "plan-invoice-export-v1",
        contextPackId: state.contextPack.id,
        steps: [
          "Generate a deterministic invoice fingerprint.",
          "Query the prior ERP export by fingerprint.",
          "Block duplicate ERP submission.",
          "Preserve auditability and retry behavior.",
          "Add regression coverage for duplicate export and retry.",
        ],
        expectedFiles: [
          "services/invoices/invoice-service.ts",
          "domain/billing/invoice-policy.ts",
          "repositories/invoice.repository.ts",
          "tests/integration/invoice-retry.integration.test.ts",
        ],
        impact: {
          "Billing domain": "MODIFIED",
          "Invoice repository": "MODIFIED",
          "ERP integration": "MODIFIED",
          "Public API": "UNCHANGED",
          "Database schema": "UNCHANGED",
          Authentication: "UNTOUCHED",
        },
        approved: false,
      };
      return { ...state, stage: "PLAN_PROPOSED", plan, audit: nextAudit(state, "PLAN_PROPOSED", "AI-assisted implementation plan proposed; human approval required.", "PLAN_PROPOSED") };
    }
    case "APPROVE_PLAN": {
      assertStage(state, ["PLAN_PROPOSED"], action.type);
      if (!state.plan) throw new Error("Plan is required.");
      return { ...state, stage: "PLAN_APPROVED", plan: { ...state.plan, approved: true }, audit: nextAudit(state, "PLAN_APPROVED", "Implementation plan approved by human reviewer.", "PLAN_APPROVED") };
    }
    case "GENERATE_PATCH": {
      assertStage(state, ["PLAN_APPROVED"], action.type);
      if (!state.plan?.approved || !state.contextPack) throw new Error("Approved plan and context snapshot are required before patch generation.");
      const patch = initialPatchFixture(state.contextPack.id);
      if (patch.protectedContractTouched) throw new Error("Candidate patch attempted to modify protected contracts.");
      return { ...state, stage: "PATCH_GENERATED", patches: [patch], audit: nextAudit(state, "PATCH_GENERATED", "Initial candidate patch generated from the approved context snapshot.", "PATCH_GENERATED") };
    }
    case "REVIEW_PATCH": {
      assertStage(state, ["PATCH_GENERATED"], action.type);
      const patch = state.patches.at(-1);
      if (!patch || !state.contextPack || !state.plan) throw new Error("Patch, context snapshot and approved plan are required for review.");
      const review = reviewPatch(patch, state.contextPack, state.plan, state.repository);
      if (review.verdict === "BLOCKED") {
        throw new Error(`Patch review blocked: protected/context boundary violation (${[...review.protectedChanges, ...review.outsideContextFiles, ...review.unknownFiles].join(", ") || "context binding mismatch"}).`);
      }
      return { ...state, stage: "PATCH_REVIEWED", audit: nextAudit(state, "PATCH_REVIEWED", `Patch impact reviewed: ${review.totals.files} files, ${review.affectedModules.length} modules, ${review.invariantTouchpoints.length} invariant touchpoints, no protected changes.`, "PATCH_REVIEWED") };
    }
    case "RUN_PRECHECK": {
      assertStage(state, ["PATCH_REVIEWED"], action.type);
      return { ...state, stage: "PRECHECK_PASSED", audit: nextAudit(state, "PRECHECK_PASSED", "Typecheck, lint, unit tests and feature scenario passed.", "PRECHECK_PASSED") };
    }
    case "EVALUATE_RELEASE": {
      assertStage(state, ["PRECHECK_PASSED"], action.type);
      const patch = state.patches.at(-1);
      if (!patch) throw new Error("Patch is required before release evaluation.");
      const decision = runInitialReleaseGate(patch);
      if (decision.result !== "BLOCKED") throw new Error("Synthetic golden path must surface the production blocker.");
      return { ...state, stage: "RELEASE_BLOCKED", releaseDecisions: [...state.releaseDecisions, decision], audit: nextAudit(state, "RELEASE_BLOCKED", "Production blocked: idempotency and audit invariants failed.", "RELEASE_BLOCKED") };
    }
    case "PROPOSE_FIX": {
      assertStage(state, ["RELEASE_BLOCKED"], action.type);
      return { ...state, stage: "FIX_PROPOSED", audit: nextAudit(state, "FIX_PROPOSED", "Scoped fix proposed from failing invariant evidence only.", "FIX_PROPOSED") };
    }
    case "APPROVE_FIX": {
      assertStage(state, ["FIX_PROPOSED"], action.type);
      if (!state.contextPack) throw new Error("Original context snapshot is required for fix auditability.");
      const fix = fixPatchFixture(state.contextPack.id);
      return { ...state, stage: "FIX_APPROVED", patches: [...state.patches, fix], audit: nextAudit(state, "FIX_APPROVED", "Scoped fix approved and recorded as iteration 2.", "FIX_APPROVED") };
    }
    case "REVALIDATE": {
      assertStage(state, ["FIX_APPROVED"], action.type);
      const fixPatch = state.patches.at(-1);
      if (!fixPatch || fixPatch.kind !== "FIX") throw new Error("Approved fix patch is required before revalidation.");
      const decision = runFinalReleaseGate(fixPatch);
      if (decision.result !== "READY") throw new Error("Final release gate did not reach READY.");
      return { ...state, stage: "REVALIDATED", releaseDecisions: [...state.releaseDecisions, decision], audit: nextAudit(state, "REVALIDATED", "Full release gate re-run after scoped fix; all blocking checks are green.", "REVALIDATED") };
    }
    case "CONFIRM_RELEASE": {
      assertStage(state, ["REVALIDATED"], action.type);
      const decision = state.releaseDecisions.at(-1);
      if (!decision || decision.result !== "READY") throw new Error("A green release decision is required before production confirmation.");
      return { ...state, stage: "READY_FOR_PRODUCTION", audit: nextAudit(state, "READY_FOR_PRODUCTION", "Developer confirmed the green release decision; scenario is READY FOR PRODUCTION.", "READY_FOR_PRODUCTION") };
    }
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}
