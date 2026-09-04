import { ProductNav } from "./ProductNav";
import { ReleaseStrip } from "./ReleaseStrip";
import { architectureSteps, candidateStory } from "../presentation/candidate-story";

const ownerLabel = {
  DEVELOPER: "Developer-owned",
  AI: "AI candidate work",
  SHARED: "Shared loop",
} as const;

export function ArchitectureStory() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to Architecture Story</a>
      <main className="app-shell story-shell" id="main-content">
      <header className="story-hero">
        <div>
          <div className="eyebrow">HarnessLab · candidate architecture</div>
          <h1>AI inside a controlled engineering system</h1>
          <p className="story-lead">The model proposes. Context, contracts, validation and release ownership create the harness around it.</p>
        </div>
        <a className="button primary" href="/candidate">See Role Mapping</a>
      </header>
      <ProductNav active="architecture" />
      <ReleaseStrip />

      <section className="panel architecture-panel" id="ownership">
        <div className="section-title-row">
          <div>
            <span className="label">Ownership architecture</span>
            <h2>Every artifact has a clear decision owner.</h2>
          </div>
          <div className="owner-legend"><span className="owner developer">Developer</span><span className="owner ai">AI</span><span className="owner shared">Shared</span></div>
        </div>
        <div className="architecture-flow">
          {architectureSteps.map((step, index) => (
            <article className={`architecture-step owner-${step.owner.toLowerCase()}`} key={step.id}>
              <div className="architecture-number">{String(index + 1).padStart(2, "0")}</div>
              <div className="architecture-copy">
                <div className="architecture-title"><h3>{step.title}</h3><span>{ownerLabel[step.owner]}</span></div>
                <strong>{step.artifact}</strong>
                <p>{step.purpose}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="story-summary-grid">
        <article className="panel">
          <span className="label">Protected boundaries</span>
          <h2>AI cannot rewrite the rules used to judge its own patch.</h2>
          <div className="protected-contract-list mono">
            <span>/business-invariants</span>
            <span>/release-policy</span>
            <span>/architecture-contract</span>
          </div>
          <p>Candidate patches are checked against real repository paths and frozen policy boundaries, not a self-reported “safe” flag.</p>
        </article>
        <article className="panel">
          <span className="label">Release principle</span>
          <h2>Passing tests ≠ production-ready.</h2>
          <p>HarnessLab deliberately demonstrates a patch that passes pre-checks yet still fails domain invariants. A scoped fix is generated, but the complete release gate runs again before the human confirmation.</p>
          <a className="inline-link" href="/#release-gate">Open Production Release Gate →</a>
        </article>
      </section>

      <section className="credibility-boundary">
        <strong>Architecture disclaimer.</strong>
        <p>{candidateStory.boundary}</p>
      </section>
      <footer><strong>Candidate release boundary.</strong> Synthetic, deterministic and share-by-link. No proprietary Apertia materials were used.</footer>
    </main>
    </>
  );
}
