# HarnessLab PASS 3 Re-Audit

## Verdict

**PASS 3 — PASS**

Patch Review + Impact Analysis is implemented while the approved Context Pack source-of-truth, repository analysis, state machine, and release policy remain byte-for-byte frozen.

## Frozen SHA-256 verification

| File | SHA-256 | Result |
|---|---|---|
| `domain/context-pack.ts` | `3e09115360ecf66aca7b17ddfa3890315b96bd107879743e04a9cdde0b0e71f7` | unchanged |
| `domain/repository-analysis.ts` | `b3ca684c6703d0e9f7dea0e2b64c6a49e1662de8ac9e76bf1ed764960299bffa` | unchanged |
| `domain/state-machine.ts` | `26ff53cab16669eae98785780fb459474bfe46c1600e3d1fdaf7115b7ccfe904` | unchanged |
| `domain/release-gate.ts` | `b60c795fa5a3c0e0d5f9a346a1295dab66893ebe7a6898d3406b1a5fcd8d3741` | unchanged |

## PASS 3 behavior verified

### Default initial patch

- 4 changed files
- +83 / -11
- affected modules:
  - billing-domain
  - integration-tests
  - invoice-repository
  - invoice-service
- invariant touchpoints:
  - INV-01
  - INV-02
  - INV-03
- risk profile: 3 MEDIUM / 1 LOW
- protected changes: 0
- files outside immutable AI context: 0
- plan drift: 0
- review verdict: PASS

### Scoped fix

- 2 changed files
- +21 / -8
- remains bound to the original Context Pack
- touches INV-02 and INV-03
- review verdict: PASS

### Adversarial protected-contract probe

A synthetic patch was deliberately modified to touch:

`release-policy/policy.ts`

while its legacy `protectedContractTouched` flag was deliberately left `false`.

The new review engine derived the violation from the repository path / protected contract boundary itself and returned:

- protected change detected: PASS
- outside approved AI context detected: PASS
- review verdict: BLOCKED

This prevents an AI patch from bypassing review merely by falsifying a fixture-level boolean.

### Stale / unknown change probe

A patch bound to `context-stale-v0` and containing `services/invoices/ghost-export.ts` was rejected:

- context binding mismatch detected: PASS
- unknown repository file detected: PASS
- review verdict: BLOCKED

### Plan drift probe

A context-approved but not plan-approved change to `integrations/erp/erp-adapter.ts` remains visible as `PLAN DRIFT` while not being misclassified as a protected or context violation.

## Golden-path regression

The hardened workflow remains:

`TASK_RECEIVED → REPOSITORY_ANALYZED → CONTEXT_READY → PLAN_PROPOSED → PLAN_APPROVED → PATCH_GENERATED → PATCH_REVIEWED → PRECHECK_PASSED → RELEASE_BLOCKED → FIX_PROPOSED → FIX_APPROVED → REVALIDATED → READY_FOR_PRODUCTION`

Runtime regression result:

`BLOCKED → READY → READY_FOR_PRODUCTION`

## Validation performed in this runner

- `node scripts/release-smoke.mjs` — PASS
- strict domain TypeScript (`tsc -p tsconfig.domain.json`) — PASS
- test-source TypeScript probe with a local Vitest declaration stub — PASS
- UI/TSX semantic TypeScript probe with local React/Next declarations — PASS
- compiled runtime PASS 3 behavior probe — PASS
- frozen-file SHA-256 comparison — PASS

## Dependency-backed gate

`npm install --no-audit --no-fund` timed out in the current execution environment and did not leave `node_modules` or `package-lock.json`. Therefore the following are **not falsely claimed as executed here**:

- real ESLint package execution
- real Vitest package execution
- Next.js production build

The repository retains the existing full gate:

```bash
npm install
npm run validate
```

where `validate` runs release smoke, domain typecheck, ESLint, full typecheck, Vitest, and Next.js production build.

## Scope integrity

No authentication, database, live Git provider, arbitrary code execution, Docker runner, live LLM dependency, or Apertia proprietary data was introduced.
