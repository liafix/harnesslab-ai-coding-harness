# HarnessLab

**AI Coding Harness & Production Release Workbench**

HarnessLab is a synthetic candidate demonstration built around one engineering thesis:

> **AI implementation ≠ production approval.**

It models a controlled developer + AI workflow over a synthetic existing ERP repository:

`Task → Repository discovery → Context Pack → Human-approved plan → AI candidate patch → Pre-check → Production BLOCKED → Scoped fix → Full revalidation → Developer release confirmation → READY FOR PRODUCTION`

## Candidate context

This repository is a candidate demonstration inspired only by the publicly available Apertia Tech AI-First Developer role description. It does **not** reproduce or represent Apertia proprietary code, customers, repositories, systems, or internal processes.

## PASS 0–5 scope

Implemented:

- explicit HarnessLab state machine
- synthetic 42-file OpsCore ERP repository
- immutable task-specific Context Pack
- human plan approval gate
- protected-contract policy
- initial AI candidate patch
- production release gate
- deterministic idempotency/audit blocker
- scoped fix iteration
- final READY release decision
- audit trail
- resettable demo
- guided UI path
- unit/domain/golden-path tests
- offline release smoke
- task-driven repository relevance scoring
- auditable immutable Context Pack evidence
- dependency-path and affected-module discovery
- protected-contract exclusion from AI context

## Commands

```bash
npm install
npm run validate
npm run dev
```

`npm run validate` runs:

1. release smoke
2. domain TypeScript
3. ESLint
4. full TypeScript
5. Vitest
6. Next.js production build

## Synthetic scenario

**OpsCore ERP** contains exactly 42 structured repository files. The task is to prevent duplicate invoice exports to ERP while preserving retry idempotency and exactly-one audit outcomes.

The initial patch passes static and basic feature checks but fails two blocking domain invariants. A scoped second iteration fixes the idempotency boundary, after which the full release gate becomes READY.


## PASS 3 — Patch Review + Impact Analysis

PASS 3 adds a deterministic engineering review layer around the frozen golden path. Every candidate patch is compared with the immutable Context Pack, approved implementation plan, repository snapshot, protected contracts and business-invariant touchpoints. The UI exposes why each file changed, its risk, synthetic diff preview, affected modules and review boundaries. Protected/out-of-context/unknown changes are blocked before the existing pre-check and release policy.

Current milestone: **PASS 0 + PASS 1 + PASS 2 + PASS 3 complete.**

## PASS 4 — Production Release Gate + Failure Loop

PASS 4 adds a fail-closed production-readiness analysis layer without changing the frozen PASS 0–3 Context Pack, patch review, state machine, or release policy. The UI now groups validation evidence by category, exposes BLOCKING severity, narrows failed-invariant context to the smallest relevant file slice, tracks patch iterations, and verifies that the scoped fix receives a complete full gate re-run before the developer can confirm production readiness.


## PASS 5 — Candidate Story + Apertia Mapping

PASS 5 is presentation-only. The complete `domain/*` directory remains SHA-256 frozen against PASS 4 and the golden release path is unchanged.

Added recruiter-facing surfaces:

- `/candidate` — why HarnessLab was built, eight public-role hiring questions mapped to visible proof, and a focused 3–5 minute interview route
- `/architecture` — developer/AI/shared ownership model, protected boundaries and release philosophy
- `/` — read-only engineering readout derived from the existing scenario state: repository context, context reduction, AI iterations, protected contracts, blockers caught and release status
- explicit credibility boundary stating that no Apertia proprietary code, client data, repository, architecture or internal process is represented

PASS 5 does not modify the frozen domain, release gate, state machine or golden path.

Current milestone: **PASS 0 through PASS 5 complete.**

## PASS 6 — Release Candidate

PASS 6 freezes the PASS 0–4 domain and the PASS 5 eight-question Apertia mapping, then hardens the recruiter/interview surface only.

Release-candidate additions:
- state-machine-derived guided-demo progress
- release-candidate/runtime disclosure strip
- keyboard focus, skip links, `aria-current`, live stage status
- reduced-motion, forced-colors, responsive and touch-target hardening
- share-by-link `noindex` metadata
- deterministic/no-live-LLM disclosure
- frozen SHA-256 manifests enforced by `npm run release:smoke`

Local dependency installation is not considered verified in the artifact runner because registry installation timed out. Final dependency-backed validation remains:

```bash
npm install
npm run validate
```

Recommended final gate: push this release candidate to GitHub, run the full validation in Jules/cloud CI, review the diff, merge, then deploy to Vercel.
