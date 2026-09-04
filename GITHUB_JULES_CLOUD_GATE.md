# HarnessLab — GitHub + Jules Cloud Validation Gate

## Repository
Recommended public repository name: `harnesslab-ai-coding-harness`

Recommended description:
> Synthetic AI coding harness and production release workbench demonstrating context engineering, human review, protected contracts, and fail-closed release gates.

## Release branch policy
- `main` = reviewed release candidate only
- Jules changes arrive through a PR
- Merge only after full validation is green and the diff is manually reviewed
- Prefer **Squash and merge** for the release-hardening PR

## Required cloud gate
```bash
npm install
npm run validate
npm audit --omit=dev --audit-level=high
```

`npm run validate` executes:
1. `release:smoke`
2. frozen domain + Apertia mapping verification
3. domain TypeScript validation
4. ESLint with zero warnings
5. full TypeScript validation
6. Vitest
7. Next.js production build

## Frozen surfaces
Do not modify:
- `domain/**`
- `presentation/candidate-story.ts`
- golden path semantics

Canonical hashes are stored in:
- `PASS6_FROZEN_DOMAIN_SHA256.txt`
- `PASS6_FROZEN_APERTIA_MAPPING_SHA256.txt`

## PR acceptance criteria
A Jules PR may be merged only when:
- package-lock.json is committed
- `npm run validate` passes from a clean install
- runtime dependency audit has no HIGH/CRITICAL finding that remains unexplained
- GitHub Actions release-gate is green
- frozen hashes pass
- PR diff contains no frozen-domain or candidate-mapping changes
- no product scope or live AI/database/auth dependency was added

## After merge
1. Re-check `main` GitHub Actions.
2. Import the repository into Vercel.
3. Leave Framework Preset as Next.js and all build/install settings on defaults.
4. Add no environment variables; the golden path is deterministic and requires no live LLM/API key.
5. Run the production smoke route through `READY_FOR_PRODUCTION`.
