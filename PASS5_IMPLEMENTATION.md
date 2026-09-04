# HarnessLab PASS 5 — Candidate Story + Apertia Mapping

## Scope

PASS 5 is strictly a recruiter/presentation layer over the frozen PASS 0–4 engineering engine. No `domain/*` file, state transition, release-policy rule, patch-review rule, production-readiness rule, Context Pack behavior, scenario value, or golden-path action was changed.

## New recruiter surfaces

### `/candidate`

A candidate-specific explanation of why HarnessLab exists and what it demonstrates. It includes:

- why the demo focuses on engineering judgment rather than code generation
- five AI-first engineering principles
- exactly eight public-role hiring questions mapped to visible HarnessLab proof
- direct links from each question to the relevant demo/architecture evidence
- a focused 3–5 minute interview route
- explicit public-context / synthetic-data credibility boundary

### `/architecture`

A read-only architecture story showing ten ownership steps from Engineering Request through Developer Release Decision. Each step identifies:

- decision owner: Developer / AI / Shared
- artifact produced
- engineering purpose

The page also highlights protected contracts and the principle that passing tests does not automatically mean production readiness.

### `/`

The existing golden demo now gains only a read-only candidate engineering readout derived from the frozen state:

- repository context: `5 / 42` after Context Pack creation
- context reduction: `88%`
- AI iterations: `0 → 2`
- protected contracts: `3`
- blocking issues caught: `0 → 2`
- release status: discovery / in progress / blocked / ready / ready for production

No readout value is hard-coded as a release claim; it is derived from the existing scenario state.

## Eight-question mapping

PASS 5 maps these AI-first interview themes to visible proof:

1. daily AI tools
2. developer + AI workflow
3. what makes an engineering prompt good
4. what is delegated to AI
5. what AI does not reliably own
6. what an AI coding harness is
7. first hour in a large existing codebase
8. production verification of AI-generated code

The answers are written as candidate reasoning, while the proof references existing HarnessLab artifacts: Context Pack, human plan gate, patch review, protected contracts, blocking invariants, full release-gate re-run, and explicit developer release confirmation.

## Interview route

The candidate route stays within the requested interview window:

- `0:00–0:30` frame the thesis
- `0:30–1:15` repository + context engineering
- `1:15–2:00` plan + patch review
- `2:00–3:00` production blocker
- `3:00–4:00` scoped fix loop
- `4:00–4:30` developer release confirmation

## Credibility boundary

The UI explicitly states that HarnessLab/OpsCore ERP are synthetic and that no Apertia proprietary code, client data, repository, architecture, or internal process is represented. The role mapping is based only on publicly described responsibilities and hiring questions.

## Freeze guarantee

`PASS5_FROZEN_DOMAIN_SHA256.txt` records every `domain/*` SHA-256 from the approved PASS 4 base. `npm run release:smoke` now fails if any frozen domain hash differs.
