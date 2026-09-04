import type { Patch, ReleaseDecision, ValidationCheck } from "./types";

const commonPasses: ValidationCheck[] = [
  { id: "typecheck", label: "Typecheck", category: "STATIC", result: "PASS", severity: "BLOCKING" },
  { id: "lint", label: "Lint", category: "STATIC", result: "PASS", severity: "BLOCKING" },
  { id: "unit", label: "Unit tests", category: "TEST", result: "PASS", severity: "BLOCKING" },
  { id: "integration", label: "Integration tests", category: "TEST", result: "PASS", severity: "BLOCKING" },
  { id: "architecture", label: "Architecture contract", category: "ARCHITECTURE", result: "PASS", severity: "BLOCKING" },
];

export function runInitialReleaseGate(patch: Patch): ReleaseDecision {
  const protectedCheck: ValidationCheck = patch.protectedContractTouched
    ? { id: "protected", label: "Protected contracts", category: "ARCHITECTURE", result: "FAIL", severity: "BLOCKING", evidence: "Candidate patch touched protected contract definitions." }
    : { id: "protected", label: "Protected contracts", category: "ARCHITECTURE", result: "PASS", severity: "BLOCKING" };

  const checks: ValidationCheck[] = [
    ...commonPasses,
    protectedCheck,
    { id: "inv1", label: "INV-01 At-most-once ERP export", category: "DOMAIN", result: "PASS", severity: "BLOCKING" },
    { id: "inv2", label: "INV-02 Idempotent retry", category: "DOMAIN", result: "FAIL", severity: "BLOCKING", evidence: "Retry preserves one ERP record but the current patch records a second audit event." },
    { id: "inv3", label: "INV-03 Exactly-one audit outcome", category: "DOMAIN", result: "FAIL", severity: "BLOCKING", evidence: "Observed: 1 ERP export / 2 audit outcomes. Expected: 1 / 1." },
    { id: "inv4", label: "INV-04 Public API compatibility", category: "DOMAIN", result: "PASS", severity: "BLOCKING" },
    { id: "inv5", label: "INV-05 No schema migration", category: "DOMAIN", result: "PASS", severity: "BLOCKING" },
    { id: "build", label: "Production build", category: "RELEASE", result: "PASS", severity: "BLOCKING" },
  ];

  return {
    patchId: patch.id,
    result: checks.some((check) => check.severity === "BLOCKING" && check.result === "FAIL") ? "BLOCKED" : "READY",
    checks,
    decidedAt: "2026-09-04T08:02:00+02:00",
  };
}

export function runFinalReleaseGate(patch: Patch): ReleaseDecision {
  const checks: ValidationCheck[] = [
    ...commonPasses,
    { id: "protected", label: "Protected contracts", category: "ARCHITECTURE", result: patch.protectedContractTouched ? "FAIL" : "PASS", severity: "BLOCKING" },
    { id: "inv1", label: "INV-01 At-most-once ERP export", category: "DOMAIN", result: "PASS", severity: "BLOCKING" },
    { id: "inv2", label: "INV-02 Idempotent retry", category: "DOMAIN", result: "PASS", severity: "BLOCKING", evidence: "Retry produces 1 ERP export and reuses the original audit outcome." },
    { id: "inv3", label: "INV-03 Exactly-one audit outcome", category: "DOMAIN", result: "PASS", severity: "BLOCKING", evidence: "Observed: 1 ERP export / 1 audit outcome." },
    { id: "inv4", label: "INV-04 Public API compatibility", category: "DOMAIN", result: "PASS", severity: "BLOCKING" },
    { id: "inv5", label: "INV-05 No schema migration", category: "DOMAIN", result: "PASS", severity: "BLOCKING" },
    { id: "regression", label: "Regression coverage", category: "TEST", result: "PASS", severity: "BLOCKING" },
    { id: "build", label: "Production build", category: "RELEASE", result: "PASS", severity: "BLOCKING" },
  ];

  return {
    patchId: patch.id,
    result: checks.some((check) => check.severity === "BLOCKING" && check.result === "FAIL") ? "BLOCKED" : "READY",
    checks,
    decidedAt: "2026-09-04T08:04:00+02:00",
  };
}
