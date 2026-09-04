import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "domain/harness-engine.ts",
  "domain/release-gate.ts",
  "domain/context-pack.ts",
  "domain/repository-analysis.ts",
  "domain/patch-review.ts",
  "domain/production-readiness.ts",
  "domain/state-machine.ts",
  "domain/types.ts",
  "scenario/opscore/repository.ts",
  "scenario/opscore/invariants.ts",
  "scenario/opscore/patch-diffs.ts",
  "components/HarnessLabDemo.tsx",
  "components/CandidateStory.tsx",
  "components/ArchitectureStory.tsx",
  "components/ProductNav.tsx",
  "components/ReleaseStrip.tsx",
  "presentation/candidate-story.ts",
  "presentation/executive-readout.ts",
  "presentation/guided-demo.ts",
  "presentation/release-info.ts",
  "app/layout.tsx",
  "app/globals.css",
  "app/candidate/page.tsx",
  "app/architecture/page.tsx",
  "tests/harness.test.ts",
  "PASS6_FROZEN_DOMAIN_SHA256.txt",
  "PASS6_FROZEN_APERTIA_MAPPING_SHA256.txt",
  "PASS6_RELEASE_METADATA.md",
];
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) throw new Error(`Missing release file: ${rel}`);
}

const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const verifyManifest = (manifestRel, label) => {
  const lines = fs.readFileSync(path.join(root, manifestRel), "utf8").trim().split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    const match = line.match(/^([a-f0-9]{64})\s+(.+)$/);
    if (!match) throw new Error(`Invalid ${label} manifest line: ${line}`);
    const [, expected, rel] = match;
    const actual = sha256(path.join(root, rel));
    if (actual !== expected) throw new Error(`${label} changed during PASS 6: ${rel}`);
  }
};
verifyManifest("PASS6_FROZEN_DOMAIN_SHA256.txt", "frozen PASS 0–4 domain");
verifyManifest("PASS6_FROZEN_APERTIA_MAPPING_SHA256.txt", "frozen PASS 5 Apertia mapping");

const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const ui = read("components/HarnessLabDemo.tsx");
const repo = read("scenario/opscore/repository.ts");
const candidate = read("presentation/candidate-story.ts");
const candidateUi = read("components/CandidateStory.tsx");
const architectureUi = read("components/ArchitectureStory.tsx");
const layout = read("app/layout.tsx");
const css = read("app/globals.css");
const releaseStrip = read("components/ReleaseStrip.tsx");
const releaseInfo = read("presentation/release-info.ts");
const guided = read("presentation/guided-demo.ts");

const requireText = (source, needle, message) => {
  if (!source.includes(needle)) throw new Error(message);
};

requireText(ui, "AI implementation ≠ production approval", "Engineering thesis missing from UI.");
requireText(ui, "Synthetic candidate demonstration", "Synthetic candidate label missing from UI.");
requireText(ui, "No Apertia proprietary code", "Candidate credibility disclaimer missing.");
requireText(ui, "Change impact analysis", "PASS 3 impact analysis UI missing.");
requireText(ui, "Protected changes", "PASS 3 protected-change evidence missing.");
requireText(ui, "Invariant touchpoints", "PASS 3 invariant touchpoint UI missing.");
requireText(ui, "Gate coverage", "PASS 4 release completeness UI missing.");
requireText(ui, "Failure context narrowed", "PASS 4 failure context UI missing.");
requireText(ui, "Release iteration history", "PASS 4 iteration history UI missing.");
requireText(ui, "Full re-run", "PASS 4 full re-run evidence missing.");
requireText(ui, "Candidate engineering readout", "PASS 5 engineering readout missing.");
requireText(candidateUi, "Eight hiring questions", "PASS 5 Apertia question mapping UI missing.");
requireText(candidateUi, "3–5 minute interview route", "PASS 5 interview route missing.");
requireText(architectureUi, "Every artifact has a clear decision owner", "PASS 5 architecture ownership story missing.");
requireText(candidate, "publicly described role responsibilities", "PASS 5 public-context credibility boundary missing.");
requireText(repo, "synthetic: true", "Synthetic repository marker missing.");

requireText(ui, "Interview guided demo", "PASS 6 guided-demo controller missing.");
requireText(ui, "role=\"progressbar\"", "PASS 6 guided progress semantics missing.");
requireText(ui, "aria-current={stage === state.stage ? \"step\"", "PASS 6 workflow aria-current semantics missing.");
requireText(ui, "skip-link", "PASS 6 skip link missing from live harness.");
requireText(candidateUi, "skip-link", "PASS 6 skip link missing from candidate story.");
requireText(architectureUi, "skip-link", "PASS 6 skip link missing from architecture story.");
requireText(releaseStrip, "Release candidate information", "PASS 6 recruiter release strip missing.");
requireText(releaseInfo, "No live LLM required", "PASS 6 deterministic runtime disclosure missing.");
requireText(layout, "index: false", "PASS 6 noindex metadata missing.");
requireText(layout, "noimageindex: true", "PASS 6 crawler hardening missing.");
requireText(css, "prefers-reduced-motion:reduce", "PASS 6 reduced-motion support missing.");
requireText(css, ":focus-visible", "PASS 6 keyboard focus styles missing.");
requireText(css, "forced-colors:active", "PASS 6 forced-colors support missing.");
requireText(guided, "stageOrder", "PASS 6 guided progress is not state-machine derived.");

const hiringQuestionCount = (candidate.match(/id: "(?:tools|workflow|prompt|delegate|limitations|harness|first-hour|production)"/g) ?? []).length;
if (hiringQuestionCount !== 8) throw new Error(`Expected 8 frozen Apertia hiring mappings, found ${hiringQuestionCount}.`);

console.log("RELEASE_SMOKE_PASS");
console.log("Frozen PASS 0–4 domain: PASS");
console.log("Frozen PASS 5 eight-question mapping: PASS");
console.log("Golden engineering thesis + synthetic boundary: PASS");
console.log("Repository/context + patch impact + production gate: PASS");
console.log("Candidate story + architecture ownership: PASS");
console.log("Guided-demo state-machine derivation: PASS");
console.log("Accessibility semantics + focus + reduced motion: PASS");
console.log("Responsive/release candidate UI markers: PASS");
console.log("Noindex + deterministic/no-live-LLM disclosure: PASS");
