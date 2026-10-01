import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  BrainCircuit,
  MessagesSquare,
  Code2,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { Panel, PageTitle } from "../components/UI";
import { topics, questions } from "../data";
import { reviewAnswer } from "../review.mjs";
import type { Session } from "../types";
export default function Practice({ save }: { save: (s: Session) => void }) {
  const navigate = useNavigate();
  const [topic, setTopic] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(5).fill(""));
  const [review, setReview] = useState(false);
  const [error, setError] = useState("");
  const icons = [BrainCircuit, MessagesSquare, Code2];
  function start(t: string) {
    setTopic(t);
    setIndex(0);
    setAnswers(Array(5).fill(""));
    setReview(false);
    setError("");
  }
  function next() {
    if (!answers[index].trim()) {
      setError("Write an answer before continuing.");
      return;
    }
    if (index === 4) {
      save({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        topic: topic!,
        answers,
        score: Math.round(
          answers.reduce((a, s) => a + reviewAnswer(s).score, 0) / 5,
        ),
      });
      navigate("/feedback");
    } else {
      setIndex(index + 1);
      setReview(false);
      setError("");
    }
  }
  return (
    <>
      <PageTitle
        title="Practice with purpose."
        subtitle="A safe space to think, try, and get a little better."
      />
      <div className="notice">
        <Sparkles size={16} />
        <span>
          Offline demo: reviews check answer length and example/outcome
          keywords. They don’t assess technical correctness. Connect a backend
          for real AI feedback.
        </span>
      </div>
      {!topic ? (
        <>
          <h2 className="spaced">What would you like to work on?</h2>
          <div className="practice-grid">
            {topics.map((t, i) => {
              const Icon = icons[i];
              return (
                <Panel key={t}>
                  <div className="icon-box">
                    <Icon size={26} />
                  </div>
                  <span className="section-label">
                    {i === 1 ? "TELL YOUR STORY" : "BUILD YOUR KNOWLEDGE"}
                  </span>
                  <h2>{t}</h2>
                  <p>
                    {
                      [
                        "Think through core concepts, problem solving and trade-offs.",
                        "Turn your experience into clear, confident interview answers.",
                        "Explain the decisions behind well-structured Java code.",
                      ][i]
                    }
                  </p>
                  <div className="muted">5 questions · self-paced</div>
                  <button className="btn primary" onClick={() => start(t)}>
                    Start practice <ArrowRight size={17} />
                  </button>
                </Panel>
              );
            })}
          </div>
        </>
      ) : (
        <Panel className="practice-session">
          <div className="panel-heading">
            <span className="badge">{topic}</span>
            <button
              className="text-link"
              onClick={() => {
                setTopic(null);
                setReview(false);
              }}
            >
              <RotateCcw size={14} /> Choose topic
            </button>
          </div>
          <div className="question-progress">
            <span>Question {index + 1} of 5</span>
            <span>{Math.round((index / 5) * 100)}% complete</span>
          </div>
          <div className="progress-track">
            <span style={{ width: `${(index / 5) * 100}%` }} />
          </div>
          <h2 className="question">{questions[topic][index]}</h2>
          <label className="answer-label">
            Your answer
            <textarea
              rows={9}
              value={answers[index]}
              onChange={(e) => {
                const next = [...answers];
                next[index] = e.target.value;
                setAnswers(next);
                setReview(false);
                setError("");
              }}
              placeholder="Take your time. Explain your thinking and include a specific example where possible."
            />
          </label>
          <div className="word-count">
            {reviewAnswer(answers[index]).words} words · Your answer stays in
            this browser
          </div>
          {error && (
            <p role="alert" className="danger-text">
              {error}
            </p>
          )}
          {review && (
            <div className="answer-review">
              <Sparkles size={18} />
              <div>
                <strong>
                  Demo structure score: {reviewAnswer(answers[index]).score}%
                </strong>
                <p>{reviewAnswer(answers[index]).advice}</p>
              </div>
            </div>
          )}
          <div className="form-actions">
            <button
              className="btn secondary"
              disabled={index === 0}
              onClick={() => {
                setIndex(index - 1);
                setReview(false);
                setError("");
              }}
            >
              <ArrowLeft size={16} /> Previous
            </button>
            <button
              className="btn secondary"
              disabled={!answers[index].trim()}
              onClick={() => setReview(true)}
            >
              <Sparkles size={16} /> Review answer
            </button>
            <button className="btn primary" onClick={next}>
              {index === 4 ? "Finish session" : "Next question"}{" "}
              <ArrowRight size={16} />
            </button>
          </div>
        </Panel>
      )}
    </>
  );
}
