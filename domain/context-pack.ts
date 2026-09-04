import type { BusinessInvariant, ContextPack, EngineeringTask, RepositorySnapshot } from "./types";
import { analyzeRepository } from "./repository-analysis";

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
};

export function buildContextPack(task: EngineeringTask, repository: RepositorySnapshot, invariants: BusinessInvariant[]): ContextPack {
  const analysis = analyzeRepository(task, repository, 5);
  const relevantFiles = analysis.relevantFiles.map((file) => file.path);

  const pack: ContextPack = {
    id: `context-${task.id}-v2`,
    taskId: task.id,
    repositoryId: repository.id,
    relevantFiles,
    selectedFileEvidence: analysis.relevantFiles.map((file) => ({
      path: file.path,
      module: file.module,
      score: file.score,
      matchedSignals: [...file.matchedSignals],
      reasons: [...file.reasons],
    })),
    dependencyPath: [...analysis.dependencyPath],
    affectedModules: [...analysis.affectedModules],
    dependencyEdges: analysis.dependencyEdges.map((edge) => ({ ...edge })),
    taskSignals: [...analysis.taskSignals],
    repositoryFileCount: analysis.totalFiles,
    excludedFileCount: analysis.excludedFileCount,
    contextReductionPct: analysis.contextReductionPct,
    selectionStrategy: analysis.strategyVersion,
    excludedModules: [...analysis.excludedModules],
    invariants: invariants.map((item) => ({ ...item })),
    allowedModules: [...analysis.affectedModules],
    forbiddenAreas: ["business-invariants", "release-policy", "architecture-contract"],
    acceptanceCriteria: [...task.acceptanceCriteria],
    createdAt: "2026-09-04T08:00:00+02:00",
  };

  return deepFreeze(pack);
}
