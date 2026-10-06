import type { Assessment } from "../types";
export default function AssessmentView({ value: a }: { value: Assessment }) {
  return (
    <div className="assessment-details">
      <h3>
        {a.kind === "technical"
          ? "Technical assessment"
          : "Behavioural coaching"}
        : {a.score}%
      </h3>
      <p>{a.summary}</p>
      <p className="muted">
        Confidence: {a.confidence}.{" "}
        {a.confidence === "low"
          ? "Treat this score cautiously and check the reference."
          : ""}
      </p>
      {a.criteria.map((c) => (
        <div className="rubric-row" key={c.id}>
          <strong>
            {c.description} — {c.points}/{c.weight}
          </strong>
          <span className="badge">{c.rating}</span>
          {c.evidence && <blockquote>“{c.evidence}”</blockquote>}
          <p>{c.feedback}</p>
        </div>
      ))}
      {!!a.misconceptions.length && (
        <>
          <h4>Corrections</h4>
          <ul>
            {a.misconceptions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </>
      )}
      {!!a.strengths.length && (
        <>
          <h4>What worked</h4>
          <ul>
            {a.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </>
      )}
      <h4>Next steps</h4>
      <ul>
        {a.improvements.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
      <details>
        <summary>
          {a.kind === "technical"
            ? "Reference answer and sources"
            : "Answer guidance"}
        </summary>
        <p>{a.referenceAnswer}</p>
        {a.sources.map((s) => (
          <p key={s.url}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.title} ↗
            </a>
          </p>
        ))}
      </details>
      <small className="muted">
        Rubric v{a.rubricVersion} · {a.model} ·{" "}
        {new Date(a.assessedAt).toLocaleString("en-GB")}
      </small>
    </div>
  );
}
