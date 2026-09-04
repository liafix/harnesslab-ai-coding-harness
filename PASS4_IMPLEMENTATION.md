# HarnessLab PASS 4 — Production Release Gate + Failure Loop

PASS 4 adds a read-only production-readiness analysis layer over the frozen PASS 0–3 domain. It does not modify Context Pack selection, patch review, the state machine, or the release policy.

## Added
- category-aware validation summaries: STATIC / TEST / DOMAIN / ARCHITECTURE / RELEASE
- explicit BLOCKING vs NON_BLOCKING evidence presentation
- release-run completeness checks
- effective release result that fails closed when a required gate is missing
- scoped failure context derived from failed invariants and patch touchpoints
- fix-iteration history tied to patch IDs and release decisions
- full re-run verification for the final fix iteration
- UI evidence for observed vs expected behavior, missing gates, and iteration progression

## Release semantics
The existing release policy remains authoritative and byte-for-byte frozen. PASS 4 independently verifies that a recorded READY decision is also complete. An incomplete release run is treated as effectively BLOCKED by the analysis layer even if a synthetic/adversarial decision object claims READY.

## Golden scenario
Iteration 1: initial patch -> complete release run -> INV-02 + INV-03 blocking failures -> PRODUCTION BLOCKED.

Failure context narrows to the two files jointly touching both failed invariants:
- services/invoices/invoice-service.ts
- tests/integration/invoice-retry.integration.test.ts

Iteration 2: scoped fix -> full release gate re-run -> all required checks green including regression -> READY. The existing state machine still requires explicit developer confirmation before READY_FOR_PRODUCTION.
