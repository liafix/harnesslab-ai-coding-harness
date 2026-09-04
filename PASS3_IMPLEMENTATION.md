# HarnessLab PASS 3 — Patch Review + Impact Analysis

Status: IMPLEMENTED

PASS 3 deepens the already-approved golden path without changing the frozen Context Pack engine, repository-analysis engine, state machine, or release policy.

## Added

- `domain/patch-review.ts`
  - derives review evidence from the concrete patch, immutable Context Pack, approved implementation plan, and repository snapshot
  - calculates file totals, risk, affected modules, invariant touchpoints, context alignment, plan alignment, unknown files, and protected-contract changes
  - blocks stale context binding, protected paths, unknown files, and changes outside approved AI context
  - treats plan drift as visible review evidence rather than silently hiding it
- `scenario/opscore/patch-diffs.ts`
  - deterministic synthetic diff previews for the initial candidate patch and scoped fix
- Human review enforcement in `domain/harness-engine.ts`
  - existing `REVIEW_PATCH` transition remains unchanged
  - the transition now requires a PASS patch review before entering `PATCH_REVIEWED`
- Expanded engineering UI
  - why-changed evidence
  - per-file risk and +/- totals
  - synthetic diff previews
  - module impact analysis
  - invariant touchpoints
  - context/plan/protected-boundary indicators
- PASS 3 regression tests
  - initial patch impact derivation
  - scoped-fix context binding
  - plan drift visibility
  - protected-path detection independent of the legacy fixture flag
  - stale-context and unknown-file blocking
  - unchanged hardened golden state sequence

## Frozen files

The following files were intentionally not modified:

- `domain/context-pack.ts`
- `domain/repository-analysis.ts`
- `domain/state-machine.ts`
- `domain/release-gate.ts`

PASS 3 adds review depth around the existing domain contract instead of weakening or redesigning it.
