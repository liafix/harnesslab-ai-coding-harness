export type HiringQuestionMapping = {
  id: string;
  question: string;
  answer: string;
  harnessEvidence: string[];
  route: string;
};

export type ArchitectureStep = {
  id: string;
  title: string;
  owner: "DEVELOPER" | "AI" | "SHARED";
  artifact: string;
  purpose: string;
};

export type InterviewRouteStep = {
  time: string;
  title: string;
  action: string;
  message: string;
};

export const candidateStory = {
  eyebrow: "Apertia Tech · AI-first developer candidate story",
  title: "I built HarnessLab to show how I use AI without outsourcing engineering judgment.",
  summary:
    "The public Apertia Tech role emphasizes understanding an existing codebase, structuring work for AI, reviewing generated changes and deciding whether a feature is genuinely production-ready. HarnessLab is a synthetic demonstration of that workflow.",
  whyBuilt:
    "Rather than build another chatbot or code generator, I wanted the demo itself to answer the harder engineering question: how do I safely turn an AI-assisted change in an unfamiliar repository into an auditable release decision?",
  boundary:
    "HarnessLab and OpsCore ERP are synthetic. No Apertia proprietary code, client data, repository, architecture or internal process is represented. The mapping is based only on the publicly described role responsibilities and hiring questions.",
  principles: [
    "AI generates candidates; the developer owns the decision.",
    "Context is selected deliberately instead of flooding the model with the whole repository.",
    "Business invariants and release policy are protected from candidate patches.",
    "Passing unit tests is necessary, not sufficient, for production readiness.",
    "Failures create a narrower fix context, followed by a complete release-gate re-run.",
  ],
} as const;

export const hiringQuestionMappings: HiringQuestionMapping[] = [
  {
    id: "tools",
    question: "What AI tools do you use in day-to-day development?",
    answer:
      "I use conversational AI for research, architecture, review and prompt refinement, and repo-scoped coding agents such as Jules when implementation or cloud validation benefits from an agent loop. I treat the provider as replaceable; the important part is the harness around it.",
    harnessEvidence: ["Provider-independent deterministic demo mode", "Explicit human approval gates", "Auditable iteration history"],
    route: "/candidate#q-tools",
  },
  {
    id: "workflow",
    question: "What does your developer + AI workflow look like?",
    answer:
      "I move from problem framing to repository discovery, scoped context, an implementation plan, human approval, candidate patch review, validation, failure feedback and only then a release decision.",
    harnessEvidence: ["Task → Context Pack", "Plan approval before patch generation", "Patch review → Release Gate → Fix loop"],
    route: "/#workflow",
  },
  {
    id: "prompt",
    question: "What makes a recent engineering prompt good?",
    answer:
      "A strong prompt behaves like a task contract: objective, relevant context, acceptance criteria, protected boundaries, allowed changes and a clear stop condition. It reduces ambiguity instead of compensating with more tokens.",
    harnessEvidence: ["Task Contract", "Relevant-file evidence", "Forbidden areas + acceptance criteria"],
    route: "/#context-pack",
  },
  {
    id: "delegate",
    question: "What do you delegate to AI?",
    answer:
      "I delegate candidate work that is easy to verify: repository summarization, plan drafts, implementation drafts, targeted fixes and test suggestions. I keep irreversible or policy-changing decisions behind human review.",
    harnessEvidence: ["Repository relevance analysis", "AI candidate patch", "Scoped fix generation"],
    route: "/architecture#ownership",
  },
  {
    id: "limitations",
    question: "What does AI still not do reliably enough on its own?",
    answer:
      "AI can miss business intent, hidden coupling, architectural trade-offs and production edge cases. It can also optimize toward a passing test rather than the real contract. That is why HarnessLab protects invariants and evaluates release evidence separately from feature completion.",
    harnessEvidence: ["INV-02/INV-03 production blocker", "Protected contracts", "Fail-closed release completeness"],
    route: "/#release-gate",
  },
  {
    id: "harness",
    question: "What is an AI coding harness?",
    answer:
      "To me it is the controlled environment around the model: task contract, repository context, permissions, protected contracts, validation commands, feedback loops and release policy. The model is only one component inside that system.",
    harnessEvidence: ["Context Pack", "State machine", "Patch Review", "Production Release Gate"],
    route: "/architecture",
  },
  {
    id: "first-hour",
    question: "What do you do in the first hour inside a very large existing codebase?",
    answer:
      "I first map the repository and execution path around the task, identify relevant modules, existing tests, dependencies and protected boundaries, then form a small context pack before proposing changes. I do not start by asking AI to edit the whole repository.",
    harnessEvidence: ["42-file synthetic repository", "5-file task-specific context", "Dependency edges + excluded modules"],
    route: "/#repository-discovery",
  },
  {
    id: "production",
    question: "How do you verify that AI-generated code can go to production?",
    answer:
      "I require evidence across static checks, tests, domain invariants, architecture constraints and the production build. Any blocking failure or incomplete gate fails closed. After a fix, the complete gate runs again before the developer confirms release.",
    harnessEvidence: ["13-check final gate", "BLOCKED despite passing pre-checks", "Full re-run before READY_FOR_PRODUCTION"],
    route: "/#release-gate",
  },
];

export const architectureSteps: ArchitectureStep[] = [
  { id: "request", title: "Engineering Request", owner: "DEVELOPER", artifact: "Task Contract", purpose: "Clarify the business objective, risk and acceptance criteria." },
  { id: "discovery", title: "Repository Discovery", owner: "SHARED", artifact: "Repository Map", purpose: "Find the execution path, dependencies, tests and protected boundaries." },
  { id: "context", title: "Context Engineering", owner: "DEVELOPER", artifact: "Immutable Context Pack", purpose: "Give AI the smallest sufficient, auditable task context." },
  { id: "plan", title: "Implementation Plan", owner: "AI", artifact: "Candidate Plan", purpose: "Propose changed files, steps and impact before implementation." },
  { id: "approval", title: "Human Plan Gate", owner: "DEVELOPER", artifact: "Approved Plan", purpose: "Prevent implementation before the plan and scope are reviewed." },
  { id: "patch", title: "Candidate Patch", owner: "AI", artifact: "Patch Iteration", purpose: "Generate a bounded implementation candidate tied to the frozen context." },
  { id: "review", title: "Patch + Impact Review", owner: "DEVELOPER", artifact: "Review Evidence", purpose: "Inspect why files changed, affected modules, invariant touchpoints and policy violations." },
  { id: "gate", title: "Production Release Gate", owner: "SHARED", artifact: "Release Decision", purpose: "Evaluate static, test, domain, architecture and build evidence with fail-closed semantics." },
  { id: "fix", title: "Scoped Failure Loop", owner: "SHARED", artifact: "Fix Context + Patch", purpose: "Narrow failure context, implement a targeted fix and then re-run the complete gate." },
  { id: "release", title: "Developer Release Decision", owner: "DEVELOPER", artifact: "READY_FOR_PRODUCTION", purpose: "Keep final production responsibility explicit and human-owned." },
];

export const interviewRoute: InterviewRouteStep[] = [
  {
    time: "0:00–0:30",
    title: "Frame the engineering thesis",
    action: "Open the Task view and show the high-risk duplicate-invoice request.",
    message: "AI-first development should increase throughput without making production judgment implicit.",
  },
  {
    time: "0:30–1:15",
    title: "Show repository + context engineering",
    action: "Investigate the 42-file repo, then freeze the 5-file Context Pack.",
    message: "I first understand the execution path and reduce context instead of handing the whole repository to AI.",
  },
  {
    time: "1:15–2:00",
    title: "Approve the plan and review the patch",
    action: "Generate the plan, approve it, inspect the candidate patch and impact evidence.",
    message: "The AI can draft the implementation; scope, risk and protected boundaries remain reviewable.",
  },
  {
    time: "2:00–3:00",
    title: "Trigger the main production blocker",
    action: "Run pre-checks, then evaluate Production Readiness.",
    message: "The feature works and normal checks pass, but idempotency and audit invariants still block production.",
  },
  {
    time: "3:00–4:00",
    title: "Run the scoped fix loop",
    action: "Generate the 2-file failure context, approve the fix and re-run the full gate.",
    message: "I feed the failure back narrowly, but I do not validate narrowly—the complete release gate runs again.",
  },
  {
    time: "4:00–4:30",
    title: "Confirm production release",
    action: "Show all 13 required checks green and perform the explicit developer confirmation.",
    message: "AI accelerates the loop; the developer still owns the final release decision.",
  },
];
