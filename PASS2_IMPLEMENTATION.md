# HarnessLab PASS 2 — Repository + Context Engineering

PASS 2 deepens repository discovery and context engineering without changing the hardened state machine or release policy.

## Added

- task-signal extraction from the engineering request and acceptance criteria
- per-file relevance scoring with explainable reasons
- direct dependency/reverse-dependency relevance boosts
- dynamic five-file Context Pack selection
- protected-contract exclusion from AI patch context
- affected-module and excluded-module derivation
- dependency-path evidence
- context reduction calculation from source repository data
- immutable Context Pack evidence snapshots
- alternate-task regression proving context changes with the task
- recruiter-visible relevance scores, task signals and dependency evidence

## Frozen

- `domain/state-machine.ts`
- `domain/release-gate.ts`

PASS 2 does not introduce new states or change release decisions.
