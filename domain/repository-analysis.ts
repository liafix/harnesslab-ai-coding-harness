import type { EngineeringTask, RepositoryFile, RepositorySnapshot } from "./types";

export type FileRelevance = {
  path: string;
  module: string;
  score: number;
  protected: boolean;
  matchedSignals: string[];
  reasons: string[];
};

export type RepositoryAnalysis = {
  taskId: string;
  repositoryId: string;
  totalFiles: number;
  taskSignals: string[];
  rankedFiles: FileRelevance[];
  relevantFiles: FileRelevance[];
  affectedModules: string[];
  moduleInventory: Array<{ module: string; fileCount: number; relevantCount: number; protectedCount: number }>;
  dependencyPath: string[];
  dependencyEdges: Array<{ from: string; to: string }>;
  excludedFileCount: number;
  excludedModules: string[];
  protectedFiles: string[];
  contextReductionPct: number;
  strategyVersion: "relevance-v1";
};

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in", "into", "is", "it", "no", "not", "of", "on", "or", "same", "the", "this", "to", "while", "with", "without",
  "must", "remain", "remains", "every", "exactly", "one", "business", "public", "task", "introduced", "produces", "breaking", "legitimate",
]);

const ALIASES: Record<string, string[]> = {
  invoices: ["invoice"], invoice: ["invoice"],
  exports: ["export"], exported: ["export"], exporting: ["export"], export: ["export"],
  retries: ["retry"], retrying: ["retry"], retry: ["retry"],
  duplicates: ["duplicate"], duplicated: ["duplicate"], duplicate: ["duplicate"],
  audits: ["audit"], auditability: ["audit"], audit: ["audit"],
  notifications: ["notification"], notification: ["notification"], notify: ["notification"],
  orders: ["order"], order: ["order"],
  warehouses: ["warehouse"], warehouse: ["warehouse"],
  erp: ["erp"], api: ["api"], schema: ["schema"], database: ["database"],
};

const normalizeToken = (raw: string): string[] => {
  const token = raw.toLowerCase().replace(/[^a-z0-9_-]/g, "").replace(/^-+|-+$/g, "");
  if (!token || STOP_WORDS.has(token) || token.length < 3) return [];
  return ALIASES[token] ?? [token.replace(/s$/, "")];
};

export function extractTaskSignals(task: EngineeringTask): string[] {
  const text = [task.title, task.request, task.businessObjective, ...task.acceptanceCriteria].join(" ");
  const signals = text.split(/\s+/).flatMap(normalizeToken);
  return [...new Set(signals)].sort();
}

const includesSignal = (value: string, signal: string) => value.toLowerCase().includes(signal);

function scoreFile(file: RepositoryFile, signals: string[]): FileRelevance {
  const matchedSignals = new Set<string>();
  const reasons: string[] = [];
  let score = 0;

  for (const signal of signals) {
    const tagMatches = file.relevanceTags.filter((tag) => includesSignal(tag, signal));
    if (tagMatches.length) {
      score += 10 * tagMatches.length;
      matchedSignals.add(signal);
      reasons.push(`relevance tag: ${tagMatches.join(", ")}`);
    }
    if (includesSignal(file.path, signal)) {
      score += 5;
      matchedSignals.add(signal);
      reasons.push(`path match: ${signal}`);
    }
    if (includesSignal(file.module, signal)) {
      score += 4;
      matchedSignals.add(signal);
      reasons.push(`module match: ${signal}`);
    }
    if (includesSignal(file.contentExcerpt, signal)) {
      score += 2;
      matchedSignals.add(signal);
    }
  }

  if (file.protected) {
    score = Math.max(score, 1);
    reasons.push("protected contract: visible to policy, excluded from patch context");
  }

  return {
    path: file.path,
    module: file.module,
    score,
    protected: Boolean(file.protected),
    matchedSignals: [...matchedSignals].sort(),
    reasons: [...new Set(reasons)].slice(0, 5),
  };
}

function dependencyBoost(repository: RepositorySnapshot, base: FileRelevance[]): FileRelevance[] {
  const byPath = new Map(base.map((item) => [item.path, { ...item, reasons: [...item.reasons] }]));
  const directlyRelevant = base.filter((item) => !item.protected && item.score >= 10);
  const relevantPaths = new Set(directlyRelevant.map((item) => item.path));

  for (const file of repository.files) {
    const ranked = byPath.get(file.path);
    if (!ranked || ranked.protected) continue;

    const dependedOnByRelevant = repository.files.some((candidate) => relevantPaths.has(candidate.path) && candidate.dependencies.includes(file.path));
    if (dependedOnByRelevant) {
      ranked.score += 6;
      ranked.reasons.push("direct dependency of a task-relevant file");
    }

    const dependsOnRelevant = file.dependencies.some((dependency) => relevantPaths.has(dependency));
    if (dependsOnRelevant) {
      ranked.score += 4;
      ranked.reasons.push("directly depends on a task-relevant file");
    }
  }

  return [...byPath.values()];
}

function deriveDependencyPath(repository: RepositorySnapshot, selectedPaths: string[]): string[] {
  const selected = new Set(selectedPaths);
  const roots = repository.files.filter((file) => selected.has(file.path) && file.dependencies.some((dependency) => selected.has(dependency)));
  const path: string[] = [];
  const visited = new Set<string>();

  const walk = (filePath: string) => {
    if (visited.has(filePath) || !selected.has(filePath)) return;
    visited.add(filePath);
    path.push(filePath);
    const file = repository.files.find((item) => item.path === filePath);
    file?.dependencies.filter((dependency) => selected.has(dependency)).forEach(walk);
  };

  (roots.length ? roots : repository.files.filter((file) => selected.has(file.path))).forEach((file) => walk(file.path));
  return path;
}

export function analyzeRepository(task: EngineeringTask, repository: RepositorySnapshot, maxContextFiles = 5): RepositoryAnalysis {
  const signals = extractTaskSignals(task);
  const rankedFiles = dependencyBoost(repository, repository.files.map((file) => scoreFile(file, signals)))
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));

  const relevantFiles = rankedFiles
    .filter((item) => !item.protected && item.score > 0)
    .slice(0, maxContextFiles);
  const relevantPaths = new Set(relevantFiles.map((item) => item.path));
  const affectedModules = [...new Set(relevantFiles.map((item) => item.module))].sort();
  const allModules = [...new Set(repository.files.map((file) => file.module))].sort();
  const moduleInventory = allModules.map((module) => {
    const files = repository.files.filter((file) => file.module === module);
    return {
      module,
      fileCount: files.length,
      relevantCount: files.filter((file) => relevantPaths.has(file.path)).length,
      protectedCount: files.filter((file) => file.protected).length,
    };
  });
  const dependencyEdges = repository.files
    .filter((file) => relevantPaths.has(file.path))
    .flatMap((file) => file.dependencies
      .filter((dependency) => relevantPaths.has(dependency))
      .map((dependency) => ({ from: file.path, to: dependency })));
  const excludedFiles = repository.files.filter((file) => !relevantPaths.has(file.path) && !file.protected);
  const excludedModules = [...new Set(excludedFiles.map((file) => file.module))].sort();
  const protectedFiles = repository.files.filter((file) => file.protected).map((file) => file.path).sort();
  const contextReductionPct = Math.round((1 - relevantFiles.length / repository.files.length) * 100);

  return {
    taskId: task.id,
    repositoryId: repository.id,
    totalFiles: repository.files.length,
    taskSignals: signals,
    rankedFiles,
    relevantFiles,
    affectedModules,
    moduleInventory,
    dependencyPath: deriveDependencyPath(repository, relevantFiles.map((item) => item.path)),
    dependencyEdges,
    excludedFileCount: excludedFiles.length,
    excludedModules,
    protectedFiles,
    contextReductionPct,
    strategyVersion: "relevance-v1",
  };
}
