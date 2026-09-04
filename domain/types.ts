export type HarnessStage =
  | "TASK_RECEIVED"
  | "REPOSITORY_ANALYZED"
  | "CONTEXT_READY"
  | "PLAN_PROPOSED"
  | "PLAN_APPROVED"
  | "PATCH_GENERATED"
  | "PATCH_REVIEWED"
  | "PRECHECK_PASSED"
  | "RELEASE_BLOCKED"
  | "FIX_PROPOSED"
  | "FIX_APPROVED"
  | "REVALIDATED"
  | "READY_FOR_PRODUCTION";

export type CheckResult = "PASS" | "WARN" | "FAIL";
export type CheckSeverity = "BLOCKING" | "NON_BLOCKING";

export type EngineeringTask = {
  id: string;
  title: string;
  request: string;
  businessObjective: string;
  acceptanceCriteria: string[];
  risk: "LOW" | "MEDIUM" | "HIGH";
};

export type RepositoryFile = {
  path: string;
  module: string;
  language: string;
  dependencies: string[];
  relevanceTags: string[];
  protected?: boolean;
  contentExcerpt: string;
};

export type RepositorySnapshot = {
  id: string;
  name: string;
  synthetic: true;
  files: RepositoryFile[];
};

export type BusinessInvariant = {
  id: string;
  title: string;
  rule: string;
  blocking: boolean;
};

export type ContextFileEvidence = {
  path: string;
  module: string;
  score: number;
  matchedSignals: string[];
  reasons: string[];
};

export type ContextPack = {
  id: string;
  taskId: string;
  repositoryId: string;
  relevantFiles: string[];
  selectedFileEvidence: ContextFileEvidence[];
  dependencyPath: string[];
  affectedModules: string[];
  dependencyEdges: Array<{ from: string; to: string }>;
  taskSignals: string[];
  repositoryFileCount: number;
  excludedFileCount: number;
  contextReductionPct: number;
  selectionStrategy: "relevance-v1";
  excludedModules: string[];
  invariants: BusinessInvariant[];
  allowedModules: string[];
  forbiddenAreas: string[];
  acceptanceCriteria: string[];
  createdAt: string;
};

export type ImplementationPlan = {
  id: string;
  contextPackId: string;
  steps: string[];
  expectedFiles: string[];
  impact: Record<string, "MODIFIED" | "UNCHANGED" | "UNTOUCHED">;
  approved: boolean;
};

export type PatchFile = {
  path: string;
  additions: number;
  deletions: number;
  reason: string;
  risk: "LOW" | "MEDIUM" | "HIGH";
  invariantIds: string[];
};

export type Patch = {
  id: string;
  iteration: 1 | 2;
  kind: "INITIAL" | "FIX";
  contextPackId: string;
  files: PatchFile[];
  protectedContractTouched: boolean;
};

export type ValidationCheck = {
  id: string;
  label: string;
  category: "STATIC" | "TEST" | "DOMAIN" | "ARCHITECTURE" | "RELEASE";
  result: CheckResult;
  severity: CheckSeverity;
  evidence?: string;
};

export type ReleaseDecision = {
  patchId: string;
  result: "BLOCKED" | "READY";
  checks: ValidationCheck[];
  decidedAt: string;
};

export type AuditEvent = {
  id: string;
  type: string;
  message: string;
  stage: HarnessStage;
};

export type HarnessState = {
  stage: HarnessStage;
  task: EngineeringTask;
  repository: RepositorySnapshot;
  contextPack: ContextPack | null;
  plan: ImplementationPlan | null;
  patches: Patch[];
  releaseDecisions: ReleaseDecision[];
  audit: AuditEvent[];
};

export type HarnessAction =
  | { type: "ANALYZE_REPOSITORY" }
  | { type: "BUILD_CONTEXT" }
  | { type: "PROPOSE_PLAN" }
  | { type: "APPROVE_PLAN" }
  | { type: "GENERATE_PATCH" }
  | { type: "REVIEW_PATCH" }
  | { type: "RUN_PRECHECK" }
  | { type: "EVALUATE_RELEASE" }
  | { type: "PROPOSE_FIX" }
  | { type: "APPROVE_FIX" }
  | { type: "REVALIDATE" }
  | { type: "CONFIRM_RELEASE" }
  | { type: "RESET" };
