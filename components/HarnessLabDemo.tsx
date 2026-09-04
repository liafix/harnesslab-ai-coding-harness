"use client";

import { useMemo, useReducer, useState } from "react";
import { createInitialHarnessState, harnessReducer } from "../domain/harness-engine";
import { stageLabel, stageOrder } from "../domain/state-machine";
import { analyzeRepository, buildReleaseHistory, getBlockingFailures, getCurrentDecision, getCurrentPatchReview, getCurrentReleaseAnalysis, getGuidedAction, getLatestPatch } from "../presentation/selectors";
import { patchDiffPreview } from "../scenario/opscore/patch-diffs";
import { ProductNav } from "./ProductNav";
import { getExecutiveReadout } from "../presentation/executive-readout";
import { getGuidedDemoProgress } from "../presentation/guided-demo";
import { ReleaseStrip } from "./ReleaseStrip";

const statusClass = (value: string) => {
  if (value === "PASS" || value === "READY") return "status pass";
  if (value === "FAIL" || value === "BLOCKED") return "status fail";
  return "status warn";
};

export function HarnessLabDemo() {
  const [state, dispatch] = useReducer(harnessReducer, undefined, createInitialHarnessState);
  const [confirmReset, setConfirmReset] = useState(false);
  const guided = getGuidedAction(state);
  const currentDecision = getCurrentDecision(state);
  const patch = getLatestPatch(state);
  const patchReview = getCurrentPatchReview(state);
  const blockingFailures = currentDecision ? getBlockingFailures(currentDecision.checks) : [];
  const releaseAnalysis = getCurrentReleaseAnalysis(state);
  const releaseHistory = buildReleaseHistory(state);
  const stageIndex = stageOrder.indexOf(state.stage);
  const repositoryAnalysis = useMemo(() => analyzeRepository(state.task, state.repository), [state.task, state.repository]);
  const discoveryVisible = state.stage !== "TASK_RECEIVED";
  const contextReduction = state.contextPack?.contextReductionPct ?? null;
  const patchTotals = useMemo(() => patch ? patch.files.reduce((acc, file) => ({ additions: acc.additions + file.additions, deletions: acc.deletions + file.deletions }), { additions: 0, deletions: 0 }) : null, [patch]);
  const executiveReadout = useMemo(() => getExecutiveReadout(state), [state]);
  const guidedProgress = useMemo(() => getGuidedDemoProgress(state.stage), [state.stage]);

  const guidedNext = () => {
    if (guided.action) dispatch(guided.action);
  };

  const reset = () => {
    if (!confirmReset) return setConfirmReset(true);
    dispatch({ type: "RESET" });
    setConfirmReset(false);
  };

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to HarnessLab demo</a>
      <main className="app-shell" id="main-content">
      <header className="topbar">
        <div>
          <div className="eyebrow">Synthetic candidate demonstration · AI-first engineering</div>
          <h1>HarnessLab</h1>
          <p className="subtitle">AI Coding Harness &amp; Production Release Workbench</p>
        </div>
        <div className="top-actions">
          <button className="button ghost" onClick={reset}>{confirmReset ? "Confirm Reset" : "Reset Scenario"}</button>
          <button className="button primary" onClick={guidedNext} disabled={!guided.action}>{guided.label}</button>
        </div>
      </header>

      <ProductNav active="demo" />
      <ReleaseStrip />

      <section className="guided-controller" aria-label="Guided demo controller">
        <div className="guided-copy">
          <span className="label">Interview guided demo</span>
          <strong>{guidedProgress.complete ? "Golden path complete" : `Step ${guidedProgress.current} of ${guidedProgress.total}`}</strong>
          <small aria-live="polite">Current stage: {guidedProgress.stageLabel}. {guidedProgress.complete ? "Release is ready for production after explicit developer confirmation." : `Next action: ${guided.label}.`}</small>
        </div>
        <div className="guided-progress" role="progressbar" aria-valuemin={1} aria-valuemax={guidedProgress.total} aria-valuenow={guidedProgress.current} aria-label="Golden path progress">
          <span style={{ width: `${guidedProgress.percent}%` }} />
        </div>
        <div className="guided-safety"><strong>Deterministic</strong><span>No API key · no live LLM · reproducible blocker/fix path</span></div>
      </section>

      <section className="thesis-card" id="workflow">
        <div>
          <span className="label">Engineering thesis</span>
          <strong>AI implementation ≠ production approval.</strong>
        </div>
        <p>AI accelerates discovery and implementation. Context, protected contracts, architectural judgment and the release decision remain explicit developer responsibilities.</p>
      </section>

      <section className="executive-readout" aria-label="Candidate engineering readout">
        <div><span>Repository context</span><strong>{executiveReadout.repositoryContext}</strong></div>
        <div><span>Context reduction</span><strong>{executiveReadout.contextReduction}</strong></div>
        <div><span>AI iterations</span><strong>{executiveReadout.aiIterations}</strong></div>
        <div><span>Protected contracts</span><strong>{executiveReadout.protectedContracts}</strong></div>
        <div><span>Blocking issues caught</span><strong>{executiveReadout.blockersCaught}</strong></div>
        <div><span>Release status</span><strong className={executiveReadout.releaseStatus === "READY_FOR_PRODUCTION" || executiveReadout.releaseStatus === "READY" ? "text-pass" : executiveReadout.releaseStatus === "BLOCKED" ? "text-fail" : ""}>{executiveReadout.releaseStatus.replaceAll("_", " ")}</strong></div>
      </section>

      <ol className="stage-rail" aria-label="Harness workflow stages">
        {stageOrder.map((stage, index) => (
          <li
            key={stage}
            className={`stage-dot ${index <= stageIndex ? "active" : ""} ${stage === state.stage ? "current" : ""}`}
            aria-current={stage === state.stage ? "step" : undefined}
            title={`${index + 1}. ${stageLabel[stage]}`}
          >
            <span className="sr-only">{index + 1}. {stageLabel[stage]}{stage === state.stage ? " — current stage" : ""}</span>
          </li>
        ))}
      </ol>

      <div className="grid two">
        <section className="panel">
          <div className="panel-heading"><span className="label">01 · Engineering task</span><span className="risk high">HIGH RISK</span></div>
          <h2>{state.task.title}</h2>
          <p>{state.task.request}</p>
          <div className="callout"><strong>Business objective</strong><span>{state.task.businessObjective}</span></div>
          <ul className="compact-list">{state.task.acceptanceCriteria.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <section className="panel" id="repository-discovery">
          <div className="panel-heading"><span className="label">02 · Repository discovery</span><span className="chip">SYNTHETIC REPOSITORY</span></div>
          <h2>{state.repository.name}</h2>
          <div className="metric-row">
            <div><span>Repository files</span><strong>{state.repository.files.length}</strong></div>
            <div><span>Relevant context</span><strong>{state.contextPack?.relevantFiles.length ?? (discoveryVisible ? repositoryAnalysis.relevantFiles.length : "—")}</strong></div>
            <div><span>Context reduction</span><strong>{contextReduction === null ? (discoveryVisible ? `${repositoryAnalysis.contextReductionPct}%` : "—") : `${contextReduction}%`}</strong></div>
          </div>
          {!discoveryVisible ? (
            <div className="empty">Investigate the repository before selecting AI context.</div>
          ) : (
            <>
              <div className="analysis-meta">
                <div><span>Task signals</span><strong>{repositoryAnalysis.taskSignals.slice(0, 8).join(" · ")}</strong></div>
                <div><span>Excluded from patch context</span><strong>{repositoryAnalysis.excludedFileCount} files</strong></div>
                <div><span>Protected contracts</span><strong>{repositoryAnalysis.protectedFiles.length}</strong></div>
              </div>
              <div className="module-map">
                {repositoryAnalysis.moduleInventory.filter((module) => module.relevantCount > 0 || module.protectedCount > 0).map((module) => (
                  <div key={module.module} className={module.relevantCount ? "module-node relevant" : "module-node protected"}>
                    <span>{module.module}</span><strong>{module.fileCount} file{module.fileCount === 1 ? "" : "s"}</strong>
                    <small>{module.relevantCount ? `${module.relevantCount} selected` : `${module.protectedCount} protected`}</small>
                  </div>
                ))}
              </div>
              <div className="relevance-list">
                {(state.contextPack?.selectedFileEvidence ?? repositoryAnalysis.relevantFiles).map((file) => (
                  <div className="relevance-file" key={file.path}>
                    <div><code>{file.path}</code><span>{file.module}</span></div>
                    <strong>score {file.score}</strong>
                    <small>{file.matchedSignals.length ? `signals: ${file.matchedSignals.join(", ")}` : "dependency-selected"}{file.reasons?.length ? ` · ${file.reasons.slice(0, 2).join(" · ")}` : ""}</small>
                  </div>
                ))}
              </div>
            </>
          )}
          {state.contextPack && (
            <div className="context-box" id="context-pack">
              <strong>Context Pack Ready · immutable snapshot</strong>
              <p>{state.contextPack.relevantFiles.length} task-relevant files selected from {state.contextPack.repositoryFileCount}. {state.contextPack.excludedFileCount} unrelated files stay outside the AI context; protected contracts remain read-only policy boundaries.</p>
              <div className="dependency-path mono">
                {state.contextPack.dependencyEdges.length ? state.contextPack.dependencyEdges.map((edge) => <span key={`${edge.from}->${edge.to}`}>{edge.from} → {edge.to}</span>) : state.contextPack.dependencyPath.map((path) => <span key={path}>{path}</span>)}
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="grid two">
        <section className="panel">
          <div className="panel-heading"><span className="label">03 · Plan + patch review</span>{state.plan?.approved && <span className="status pass">HUMAN APPROVED</span>}</div>
          {state.plan ? (
            <>
              <h2>Implementation plan</h2>
              <ol className="compact-list numbered">{state.plan.steps.map((step) => <li key={step}>{step}</li>)}</ol>
              <div className="impact-grid">
                {Object.entries(state.plan.impact).map(([key, value]) => <div key={key}><span>{key}</span><strong>{value}</strong></div>)}
              </div>
            </>
          ) : <div className="empty">Repository context must be frozen before AI planning.</div>}
          {patch && patchReview && (
            <div className="patch-summary">
              <div className="patch-header">
                <strong>{patch.kind === "INITIAL" ? "AI candidate patch" : "Scoped fix patch"}</strong>
                <span className="mono">{patch.files.length} files · +{patchTotals?.additions} / −{patchTotals?.deletions}</span>
              </div>
              <div className="review-metrics">
                <div><span>Review verdict</span><strong className={patchReview.verdict === "PASS" ? "text-pass" : "text-fail"}>{patchReview.verdict}</strong></div>
                <div><span>Affected modules</span><strong>{patchReview.affectedModules.length}</strong></div>
                <div><span>Invariant touchpoints</span><strong>{patchReview.invariantTouchpoints.length}</strong></div>
                <div><span>Protected changes</span><strong className={patchReview.protectedChanges.length ? "text-fail" : "text-pass"}>{patchReview.protectedChanges.length}</strong></div>
              </div>
              <div className="review-boundaries">
                <span className={patchReview.contextBindingValid ? "status pass" : "status fail"}>CONTEXT {patchReview.contextBindingValid ? "BOUND" : "MISMATCH"}</span>
                <span className={patchReview.outsideContextFiles.length ? "status fail" : "status pass"}>PATCH CONTEXT {patchReview.outsideContextFiles.length ? "VIOLATION" : "ALIGNED"}</span>
                <span className={patchReview.unplannedFiles.length ? "status warn" : "status pass"}>PLAN {patchReview.unplannedFiles.length ? "DRIFT" : "ALIGNED"}</span>
                <span className={patchReview.protectedChanges.length ? "status fail" : "status pass"}>PROTECTED {patchReview.protectedChanges.length ? "TOUCHED" : "CLEAN"}</span>
              </div>
              <div className="patch-review-files">
                {patchReview.files.map((file) => (
                  <article className="patch-review-file" key={`${patch.id}-${file.path}`}>
                    <div className="patch-review-title">
                      <div><code>{file.path}</code><small>{file.module}</small></div>
                      <div className="patch-badges"><span className={`risk ${file.risk.toLowerCase()}`}>{file.risk}</span><span className="chip">+{file.additions} / −{file.deletions}</span></div>
                    </div>
                    <p><strong>Why changed:</strong> {file.reason}</p>
                    <div className="invariant-row">{file.invariantIds.map((id) => <span className="chip" key={`${file.path}-${id}`}>{id}</span>)}</div>
                    <pre className="diff-preview">{(patchDiffPreview[patch.id]?.[file.path] ?? ["Synthetic diff preview unavailable."]).join("\n")}</pre>
                  </article>
                ))}
              </div>
              <div className="impact-analysis">
                <div>
                  <span className="label">Change impact analysis</span>
                  <div className="module-impact-list">{patchReview.moduleImpact.map((item) => <div key={item.module}><span>{item.module}</span><strong>{item.status}</strong><small>{item.changedFiles} changed</small></div>)}</div>
                </div>
                <div>
                  <span className="label">Invariant touchpoints</span>
                  <div className="touchpoint-list">{patchReview.invariantTouchpoints.map((item) => <div key={item.invariantId}><strong>{item.invariantId}</strong><span>{item.files.length} file{item.files.length === 1 ? "" : "s"}</span></div>)}</div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="panel release-panel" id="release-gate">
          <div className="panel-heading"><span className="label">04 · Production release gate</span>{currentDecision && <span className={statusClass(currentDecision.result)}>{currentDecision.result}</span>}</div>
          {!currentDecision ? (
            <div className="empty">Pre-checks can pass without proving production readiness. The release gate evaluates protected contracts and business invariants separately.</div>
          ) : (
            <>
              <div className={`release-banner ${currentDecision.result === "BLOCKED" ? "blocked" : "ready"}`}>
                <span>{currentDecision.result === "BLOCKED" ? "⛔" : "✓"}</span>
                <div><strong>{currentDecision.result === "BLOCKED" ? "PRODUCTION BLOCKED" : "READY FOR PRODUCTION"}</strong><small>{currentDecision.result === "BLOCKED" ? "Feature works, but blocking domain evidence failed." : "All blocking checks and protected contracts are green."}</small></div>
              </div>
              {releaseAnalysis && (
                <>
                  <div className="release-integrity">
                    <div><span>Gate coverage</span><strong className={releaseAnalysis.complete ? "text-pass" : "text-fail"}>{releaseAnalysis.complete ? "COMPLETE" : "INCOMPLETE"}</strong></div>
                    <div><span>Blocking failures</span><strong className={releaseAnalysis.blockingFailures.length ? "text-fail" : "text-pass"}>{releaseAnalysis.blockingFailures.length}</strong></div>
                    <div><span>Full re-run</span><strong>{releaseAnalysis.fullRerun ? "VERIFIED" : releaseAnalysis.phase === "FINAL" ? "MISSING" : "N/A"}</strong></div>
                    <div><span>Effective decision</span><strong className={releaseAnalysis.effectiveResult === "READY" ? "text-pass" : "text-fail"}>{releaseAnalysis.effectiveResult}</strong></div>
                  </div>
                  {!releaseAnalysis.complete && <div className="gate-missing"><strong>Fail-closed gate coverage</strong><span>Missing: {releaseAnalysis.missingCheckIds.join(", ")}</span></div>}
                  <div className="validation-groups">
                    {releaseAnalysis.categories.map((group) => (
                      <div className="validation-group" key={group.category}>
                        <div className="validation-group-title"><strong>{group.label}</strong><span className={statusClass(group.status)}>{group.status}</span></div>
                        {group.checks.map((check) => (
                          <div className="check" key={`${currentDecision.patchId}-${check.id}`}>
                            <span>{check.label}</span>
                            <div className="check-status"><span className={`severity ${check.severity === "BLOCKING" ? "blocking" : "nonblocking"}`}>{check.severity}</span><span className={statusClass(check.result)}>{check.result}</span></div>
                            {check.evidence && <small>{check.evidence}</small>}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {blockingFailures.length > 0 && releaseAnalysis?.failureContext && (
                <div className="failure-evidence">
                  <strong>Failure context narrowed</strong>
                  <p>{releaseAnalysis.failureContext.scopeReason}</p>
                  <div className="failure-grid">
                    <div><span>Failed invariants</span><strong>{releaseAnalysis.failureContext.failedInvariantIds.join(" · ")}</strong></div>
                    <div><span>Scoped files</span><strong>{releaseAnalysis.failureContext.relevantFiles.length}</strong></div>
                    <div><span>Failing tests</span><strong>{releaseAnalysis.failureContext.failingTests.length}</strong></div>
                    <div><span>Whole repo re-fed</span><strong className="text-pass">NO</strong></div>
                  </div>
                  <div className="evidence-pair"><div><span>Observed</span>{releaseAnalysis.failureContext.observed.map((item) => <small key={item}>{item}</small>)}</div><div><span>Expected</span>{releaseAnalysis.failureContext.expected.map((item) => <small key={item}>{item}</small>)}</div></div>
                  <div className="scoped-files mono">{releaseAnalysis.failureContext.relevantFiles.map((file) => <span key={file}>{file}</span>)}</div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <section className="panel iteration-panel">
        <div className="panel-heading"><span className="label">Release iteration history</span><span className="chip">FAILURE → SCOPED FIX → FULL RE-RUN</span></div>
        <div className="iteration-history">
          {releaseHistory.map((item) => (
            <div className="iteration-card" key={item.patchId}>
              <div><span className="mono">ITERATION {item.iteration}</span><strong>{item.kind === "INITIAL" ? "Initial AI patch" : "Scoped fix"}</strong></div>
              <div><span>Changed files</span><strong>{item.filesChanged}</strong></div>
              <div><span>Gate</span><strong className={item.complete ? "text-pass" : ""}>{item.complete ? "COMPLETE" : item.decision === "PENDING" ? "PENDING" : "INCOMPLETE"}</strong></div>
              <div><span>Decision</span><strong className={item.decision === "READY" ? "text-pass" : item.decision === "BLOCKED" ? "text-fail" : ""}>{item.decision}</strong></div>
              {item.kind === "FIX" && <div><span>Full re-run</span><strong className={item.fullRerun ? "text-pass" : ""}>{item.fullRerun ? "VERIFIED" : "PENDING"}</strong></div>}
            </div>
          ))}
        </div>
      </section>

      <section className="panel audit-panel">
        <div className="panel-heading"><span className="label">Audit trail</span><span className="chip">{state.patches.length} AI iteration{state.patches.length === 1 ? "" : "s"}</span></div>
        <div className="audit-list">{state.audit.slice(-6).map((event) => <div key={event.id}><span className="mono">{event.stage}</span><p>{event.message}</p></div>)}</div>
      </section>

      <footer>
        <strong>Candidate demo disclaimer.</strong> HarnessLab and OpsCore ERP are synthetic demonstrations inspired only by the public Apertia Tech role description. No Apertia proprietary code, client data, repository or internal process is represented here. <span className="footer-separator">•</span> <strong>Release candidate:</strong> deterministic, no live LLM required, intentionally noindex.
      </footer>
      <div className="sr-only" aria-live="polite">Harness stage changed to {guidedProgress.stageLabel}. Release status {executiveReadout.releaseStatus.replaceAll("_", " ")}.</div>
    </main>
    </>
  );
}
