import { useState } from "react";
import { Link } from "react-router-dom";
import { Panel, PageTitle, Ring } from "../components/UI";
import AssessmentView from "../components/AssessmentView";
import type { Session } from "../types";
export default function Feedback({ sessions }: { sessions: Session[] }) {
  const [selected, setSelected] = useState("");
  const s = sessions.find((s) => s.id === selected) || sessions[0];
  return (
    <>
      <PageTitle
        title="Reflection becomes progress."
        subtitle="Review the evidence behind your score."
      />
      {!s ? (
        <Panel className="empty-state">
          <h2>Your feedback starts with practice.</h2>
          <Link className="btn primary" to="/practice">
            Start a session
          </Link>
        </Panel>
      ) : (
        <>
          <div className="notice">
            Scores reflect the question rubric. Technical reviews can be
            mistaken; behavioural feedback does not verify your personal
            experiences.
          </div>
          <label className="session-picker">
            Practice session
            <select value={s.id} onChange={(e) => setSelected(e.target.value)}>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.topic} · {new Date(s.date).toLocaleString("en-GB")}
                </option>
              ))}
            </select>
          </label>
          <Panel className="feedback-summary">
            <Ring value={s.score} label="Rubric score" />
            <div>
              <h2>{s.topic}</h2>
              <p>
                {s.answers.length} answers assessed and saved to your account.
              </p>
              <Link className="text-link" to="/practice">
                Practise again →
              </Link>
            </div>
          </Panel>
          <div className="answers">
            {s.answers.map((answer, i) => (
              <Panel key={i}>
                <span className="section-label">QUESTION {i + 1}</span>
                <h3>{s.questions?.[i]?.prompt}</h3>
                <p className="notes">{answer}</p>
                {s.assessments?.[i] ? (
                  <AssessmentView value={s.assessments[i]!} />
                ) : (
                  <p>No assessment is available for this answer.</p>
                )}
              </Panel>
            ))}
          </div>
        </>
      )}
    </>
  );
}
