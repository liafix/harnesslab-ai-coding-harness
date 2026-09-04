import type { Patch } from "../../domain/types";

export const initialPatchFixture = (contextPackId: string): Patch => ({
  id: "patch-initial-a4d3f9",
  iteration: 1,
  kind: "INITIAL",
  contextPackId,
  protectedContractTouched: false,
  files: [
    { path: "services/invoices/invoice-service.ts", additions: 31, deletions: 6, reason: "Add duplicate detection before the ERP call.", risk: "MEDIUM", invariantIds: ["INV-01", "INV-02", "INV-03"] },
    { path: "domain/billing/invoice-policy.ts", additions: 18, deletions: 2, reason: "Introduce deterministic invoice fingerprinting policy.", risk: "MEDIUM", invariantIds: ["INV-01", "INV-02"] },
    { path: "repositories/invoice.repository.ts", additions: 22, deletions: 3, reason: "Query prior exports by invoice fingerprint.", risk: "MEDIUM", invariantIds: ["INV-01"] },
    { path: "tests/integration/invoice-retry.integration.test.ts", additions: 12, deletions: 0, reason: "Add duplicate-export regression coverage.", risk: "LOW", invariantIds: ["INV-01", "INV-02", "INV-03"] },
  ],
});

export const fixPatchFixture = (contextPackId: string): Patch => ({
  id: "patch-fix-c81b22",
  iteration: 2,
  kind: "FIX",
  contextPackId,
  protectedContractTouched: false,
  files: [
    { path: "services/invoices/invoice-service.ts", additions: 14, deletions: 6, reason: "Move audit creation behind the idempotent export-decision boundary.", risk: "MEDIUM", invariantIds: ["INV-02", "INV-03"] },
    { path: "tests/integration/invoice-retry.integration.test.ts", additions: 7, deletions: 2, reason: "Assert one ERP export and one audit outcome across retries.", risk: "LOW", invariantIds: ["INV-02", "INV-03"] },
  ],
});
