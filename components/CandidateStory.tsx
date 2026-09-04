import Link from "next/link";
import { ProductNav } from "./ProductNav";
import { ReleaseStrip } from "./ReleaseStrip";
import { candidateStory, hiringQuestionMappings, interviewRoute } from "../presentation/candidate-story";

export function CandidateStory() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to Candidate Story</a>
      <main className="app-shell story-shell" id="main-content">
      <header className="story-hero">
        <div>
          <div className="eyebrow">{candidateStory.eyebrow}</div>
          <h1>Candidate Story</h1>
          <p className="story-lead">{candidateStory.title}</p>
        </div>
        <Link className="button primary" href="/">Open Guided Demo</Link>
      </header>
      <ProductNav active="candidate" />
      <ReleaseStrip />

      <section className="story-summary-grid">
        <article className="panel story-primary">
          <span className="label">Why I built this</span>
          <h2>Engineering judgment is the product.</h2>
          <p>{candidateStory.summary}</p>
          <p>{candidateStory.whyBuilt}</p>
        </article>
        <article className="panel">
          <span className="label">Design principles</span>
          <ul className="principle-list">
            {candidateStory.principles.map((principle) => <li key={principle}>{principle}</li>)}
          </ul>
        </article>
      </section>

      <section className="panel role-map-panel">
        <div className="section-title-row">
          <div>
            <span className="label">Apertia role mapping</span>
            <h2>Eight hiring questions → eight visible engineering proofs</h2>
          </div>
          <span className="chip">PUBLIC ROLE CONTEXT ONLY</span>
        </div>
        <div className="question-grid">
          {hiringQuestionMappings.map((item, index) => (
            <article id={`q-${item.id}`} className="question-card" key={item.id}>
              <div className="question-index">0{index + 1}</div>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
              <div className="evidence-stack">
                <strong>HarnessLab evidence</strong>
                {item.harnessEvidence.map((evidence) => <span key={evidence}>{evidence}</span>)}
              </div>
              <a href={item.route}>Open related proof →</a>
            </article>
          ))}
        </div>
      </section>

      <section className="panel interview-panel">
        <div className="section-title-row">
          <div>
            <span className="label">3–5 minute interview route</span>
            <h2>One narrative, no feature-tour detours.</h2>
          </div>
          <Link className="button ghost" href="/">Start from Task</Link>
        </div>
        <div className="interview-route">
          {interviewRoute.map((step) => (
            <article className="route-step" key={step.time}>
              <span className="mono">{step.time}</span>
              <div><strong>{step.title}</strong><p>{step.action}</p><small>{step.message}</small></div>
            </article>
          ))}
        </div>
      </section>

      <section className="credibility-boundary">
        <strong>Credibility boundary.</strong>
        <p>{candidateStory.boundary}</p>
      </section>
      <footer><strong>Candidate release boundary.</strong> Synthetic, deterministic and share-by-link. No proprietary Apertia materials were used.</footer>
    </main>
    </>
  );
}
