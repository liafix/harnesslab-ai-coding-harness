# HarnessLab PASS 2 — Repository + Context Engineering Re-Audit

## Verdict

**PASS 2 product/domain gate: PASS**

PASS 2 deepens repository discovery and context engineering while preserving the hardened PASS 0 + PASS 1 release behavior.

## Frozen contract verification

The two explicitly frozen files remain unchanged from the PASS 0 + PASS 1 baseline:

- `domain/state-machine.ts` — SHA-256 `26ff53cab16669eae98785780fb459474bfe46c1600e3d1fdaf7115b7ccfe904`
- `domain/release-gate.ts` — SHA-256 `b60c795fa5a3c0e0d5f9a346a1295dab66893ebe7a6898d3406b1a5fcd8d3741`

No new HarnessStage was introduced and no release-policy outcome was changed.

## Implemented in PASS 2

### Task-driven repository analysis

New `domain/repository-analysis.ts` derives context from the engineering task instead of a hard-coded list. It:

- extracts normalized task signals from title, request, business objective and acceptance criteria,
- scores files by relevance tags, path, module and content evidence,
- applies direct dependency/reverse-dependency relevance boosts,
- excludes protected contracts from AI patch context,
- derives affected modules, excluded modules and protected files,
- captures dependency edges between selected files,
- calculates context reduction from source repository data.

### Immutable Context Pack evidence

`ContextPack` now snapshots:

- relevant file paths,
- per-file relevance scores,
- matched task signals,
- explainable selection reasons,
- dependency edges,
- affected modules,
- repository file count,
- excluded file count,
- context reduction percentage,
- selection strategy version.

The snapshot remains deeply frozen.

### Dynamic synthetic repository coverage

The 42-file OpsCore ERP fixture now contains additional order/warehouse/notification files used only to prove that a different task yields different repository context. The default invoice golden path remains unchanged.

## Runtime probe

### Default invoice task

Repository files: **42**

Selected context: **5 files**

Context reduction: **88%**

Selected files and scores:

1. `services/invoices/invoice-service.ts` — 63
2. `integrations/erp/erp-adapter.ts` — 51
3. `tests/integration/invoice-retry.integration.test.ts` — 46
4. `repositories/invoice.repository.ts` — 39
5. `domain/billing/invoice-policy.ts` — 35

Protected contract files: **3** and none enters the selected AI patch context.

Dependency evidence:

- invoice service → billing policy
- invoice service → invoice repository
- invoice service → ERP adapter
- retry integration test → invoice service

### Alternate task probe

Task: warehouse order reservation failure notification.

Selected files changed to:

- `modules/warehouse/reservation-service.ts`
- `modules/orders/order-service.ts`
- `modules/notifications/notification-service.ts`

This confirms the Context Pack reacts to the engineering task instead of replaying a fixed five-file selection.

## Golden path regression

Existing PASS 1 path remains:

`TASK_RECEIVED → ... → PRECHECK_PASSED → RELEASE_BLOCKED → ... → REVALIDATED → READY_FOR_PRODUCTION`

Release decisions remain exactly:

`BLOCKED → READY`

Patch iterations remain **2**.

## Validation executed

- Offline release smoke: **PASS**
- Strict domain TypeScript (`tsc -p tsconfig.domain.json`): **PASS**
- Domain + test-source TypeScript with local Vitest declaration shim: **PASS**
- TSX syntax/transpile probe: **PASS**
- Repository/context runtime probe: **PASS**
- Alternate-task context probe: **PASS**
- Context deep-freeze probe: **PASS**
- Golden-path reducer runtime probe: **PASS**
- Frozen state-machine hash: **PASS**
- Frozen release-policy hash: **PASS**
- Stale hard-coded context-selection source scan: **PASS**

## Dependency-backed build gate

`npm install --no-audit --no-fund` was attempted in the runner and timed out before creating `node_modules` or a lockfile. Therefore ESLint/Vitest/Next production build are **not** claimed as executed in this environment.

Networked gate remains:

```bash
npm install
npm run validate
```

## PASS 3 readiness

**READY** for PASS 3 — Patch Review + Impact Analysis.

PASS 3 should consume the new immutable Context Pack and repository evidence but must not modify the frozen state machine or release policy unless a proven regression requires an explicit new approval gate.
