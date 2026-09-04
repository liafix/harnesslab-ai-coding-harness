import type { ContextPack, ImplementationPlan, Patch, RepositorySnapshot } from "./types";

export type PatchReviewFile = {
  path: string;
  module: string;
  additions: number;
  deletions: number;
  reason: string;
  risk: "LOW" | "MEDIUM" | "HIGH";
  invariantIds: string[];
  inApprovedContext: boolean;
  expectedByPlan: boolean;
  protected: boolean;
  knownRepositoryFile: boolean;
};

export type InvariantTouchpoint = {
  invariantId: string;
  files: string[];
};

export type ModuleImpact = {
  module: string;
  status: "MODIFIED" | "CONTEXT_ONLY" | "UNTOUCHED";
  changedFiles: number;
};

export type PatchReview = {
  patchId: string;
  contextPackId: string;
  verdict: "PASS" | "BLOCKED";
  totals: { files: number; additions: number; deletions: number };
  files: PatchReviewFile[];
  affectedModules: string[];
  moduleImpact: ModuleImpact[];
  invariantTouchpoints: InvariantTouchpoint[];
  protectedChanges: string[];
  protectedFlagRaised: boolean;
  unknownFiles: string[];
  outsideContextFiles: string[];
  unplannedFiles: string[];
  contextBindingValid: boolean;
  riskSummary: { low: number; medium: number; high: number; highest: "LOW" | "MEDIUM" | "HIGH" };
};

const isForbiddenPath = (path: string, contextPack: ContextPack) =>
  contextPack.forbiddenAreas.some((area) => path === area || path.startsWith(`${area}/`));

const highestRisk = (files: PatchReviewFile[]): "LOW" | "MEDIUM" | "HIGH" => {
  if (files.some((file) => file.risk === "HIGH")) return "HIGH";
  if (files.some((file) => file.risk === "MEDIUM")) return "MEDIUM";
  return "LOW";
};

export function reviewPatch(
  patch: Patch,
  contextPack: ContextPack,
  plan: ImplementationPlan,
  repository: RepositorySnapshot,
): PatchReview {
  const repositoryByPath = new Map(repository.files.map((file) => [file.path, file]));
  const contextPaths = new Set(contextPack.relevantFiles);
  const expectedPaths = new Set(plan.expectedFiles);

  const files: PatchReviewFile[] = patch.files.map((patchFile) => {
    const repositoryFile = repositoryByPath.get(patchFile.path);
    const protectedFile = Boolean(repositoryFile?.protected) || isForbiddenPath(patchFile.path, contextPack);
    return {
      ...patchFile,
      module: repositoryFile?.module ?? "unknown",
      inApprovedContext: contextPaths.has(patchFile.path),
      expectedByPlan: expectedPaths.has(patchFile.path),
      protected: protectedFile,
      knownRepositoryFile: Boolean(repositoryFile),
    };
  });

  const affectedModules = [...new Set(files.map((file) => file.module))].sort();
  const contextModules = new Set(contextPack.affectedModules);
  const moduleUniverse = [...new Set([...contextPack.affectedModules, ...affectedModules])].sort();
  const moduleImpact: ModuleImpact[] = moduleUniverse.map((module) => {
    const changedFiles = files.filter((file) => file.module === module).length;
    return {
      module,
      changedFiles,
      status: changedFiles > 0 ? "MODIFIED" : contextModules.has(module) ? "CONTEXT_ONLY" : "UNTOUCHED",
    };
  });

  const invariantMap = new Map<string, Set<string>>();
  for (const file of files) {
    for (const invariantId of file.invariantIds) {
      const paths = invariantMap.get(invariantId) ?? new Set<string>();
      paths.add(file.path);
      invariantMap.set(invariantId, paths);
    }
  }
  const invariantTouchpoints = [...invariantMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([invariantId, paths]) => ({ invariantId, files: [...paths].sort() }));

  const protectedChanges = files.filter((file) => file.protected).map((file) => file.path);
  const unknownFiles = files.filter((file) => !file.knownRepositoryFile).map((file) => file.path);
  const outsideContextFiles = files.filter((file) => !file.inApprovedContext).map((file) => file.path);
  const unplannedFiles = files.filter((file) => !file.expectedByPlan).map((file) => file.path);
  const contextBindingValid = patch.contextPackId === contextPack.id && plan.contextPackId === contextPack.id;

  const protectedFlagRaised = patch.protectedContractTouched;
  const blocking = !contextBindingValid || protectedFlagRaised || protectedChanges.length > 0 || unknownFiles.length > 0 || outsideContextFiles.length > 0;

  return {
    patchId: patch.id,
    contextPackId: patch.contextPackId,
    verdict: blocking ? "BLOCKED" : "PASS",
    totals: {
      files: files.length,
      additions: files.reduce((sum, file) => sum + file.additions, 0),
      deletions: files.reduce((sum, file) => sum + file.deletions, 0),
    },
    files,
    affectedModules,
    moduleImpact,
    invariantTouchpoints,
    protectedChanges,
    protectedFlagRaised,
    unknownFiles,
    outsideContextFiles,
    unplannedFiles,
    contextBindingValid,
    riskSummary: {
      low: files.filter((file) => file.risk === "LOW").length,
      medium: files.filter((file) => file.risk === "MEDIUM").length,
      high: files.filter((file) => file.risk === "HIGH").length,
      highest: highestRisk(files),
    },
  };
}
