# HarnessLab PASS 0 + PASS 1 Implementation

## PASS 0 — Foundation + Domain Contract

Status: IMPLEMENTED

- Next.js / React / TypeScript project
- explicit state machine
- 8 hard product invariants represented in executable behavior/tests
- immutable Context Pack snapshot
- protected contracts
- deterministic reset
- synthetic repository marker
- release decision bound to concrete patch ID
- initial/fix iterations stored separately

## PASS 1 — Full Golden Vertical Slice

Status: IMPLEMENTED

Golden path:

`TASK_RECEIVED → REPOSITORY_ANALYZED → CONTEXT_READY → PLAN_PROPOSED → PLAN_APPROVED → PATCH_GENERATED → PATCH_REVIEWED → PRECHECK_PASSED → RELEASE_BLOCKED → FIX_PROPOSED → FIX_APPROVED → REVALIDATED → READY_FOR_PRODUCTION`

Primary demo moment:

- Typecheck: PASS
- Lint: PASS
- Unit tests: PASS
- Feature scenario: PASS
- INV-02 Idempotent retry: FAIL
- INV-03 Exactly-one audit outcome: FAIL
- Release: BLOCKED

After scoped fix:

- all blocking checks: PASS
- release: READY FOR PRODUCTION
