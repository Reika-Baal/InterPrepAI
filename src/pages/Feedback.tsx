import { useState } from "react";
import { Link } from "react-router-dom";
import { MessagesSquare, ArrowRight, Sparkles } from "lucide-react";
import { Panel, PageTitle, Ring } from "../components/UI";
import { questions } from "../data";
import { reviewAnswer } from "../review.mjs";
import type { Session } from "../types";
export default function Feedback({ sessions }: { sessions: Session[] }) {
  const [selected, setSelected] = useState("");
  const session = sessions.find((s) => s.id === selected) || sessions[0];
  return (
    <>
      <PageTitle
        title="Reflection becomes progress."
        subtitle="Review your answers and find your next step."
      />
      {!session ? (
        <Panel className="empty-state">
          <MessagesSquare size={36} />
          <h2>Your feedback starts with practice.</h2>
          <p>
            Complete a session to save your answers and see a demo structure
            review.
          </p>
          <Link className="btn primary" to="/practice">
            Start a session <ArrowRight size={16} />
          </Link>
        </Panel>
      ) : (
        <>
          <div className="notice">
            <Sparkles size={16} /> Demo feedback uses simple text rules. Scores
            describe structure signals, not interview readiness or factual
            accuracy.
          </div>
          <label className="session-picker">
            Practice session
            <select
              value={session.id}
              onChange={(e) => setSelected(e.target.value)}
            >
              {sessions.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.topic} · {new Date(s.date).toLocaleString("en-GB")}
                </option>
              ))}
            </select>
          </label>
          <Panel className="feedback-summary">
            <Ring value={session.score} label="Demo structure score" />
            <div>
              <div className="section-label">SESSION REFLECTION</div>
              <h2>{session.topic}</h2>
              <p>
                Five answers saved. Take a moment to check your examples,
                explanations and outcomes.
              </p>
              <Link className="text-link" to="/practice">
                Practise again <ArrowRight size={15} />
              </Link>
            </div>
          </Panel>
          <div className="answers">
            {session.answers.map((a, i) => (
              <Panel key={i}>
                <span className="section-label">QUESTION {i + 1}</span>
                <h3>{questions[session.topic]?.[i] || "Practice question"}</h3>
                <p className="notes">{a}</p>
                <div className="answer-review">
                  <Sparkles size={17} />
                  <div>
                    <strong>
                      Demo structure score: {reviewAnswer(a).score}%
                    </strong>
                    <p>{reviewAnswer(a).advice}</p>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        </>
      )}
    </>
  );
}
