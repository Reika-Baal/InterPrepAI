import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Panel, PageTitle } from "../components/UI";
import AssessmentView from "../components/AssessmentView";
import { api } from "../api";
import type { Assessment, PracticeSession, Session } from "../types";
export default function Practice({ save }: { save: (s: Session) => void }) {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<{ name: string; count: number }[]>([]),
    [session, setSession] = useState<PracticeSession | null>(null),
    [index, setIndex] = useState(0),
    [answer, setAnswer] = useState(""),
    [busy, setBusy] = useState("Loading practice…"),
    [error, setError] = useState(""),
    [configured, setConfigured] = useState(true);
  const dirty = !!session && answer !== session.answers[index];
  async function load() {
    setBusy("Loading practice…");
    setError("");
    try {
      const [t, s, h] = await Promise.all([
        api<{ name: string; count: number }[]>("/topics"),
        api<PracticeSession | null>("/sessions/active"),
        api<{ assessmentConfigured: boolean }>("/health"),
      ]);
      setTopics(t);
      setSession(s);
      setIndex(0);
      setAnswer(s?.answers[0] ?? "");
      setConfigured(h.assessmentConfigured);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  async function persist() {
    if (!session) throw Error("No active session");
    const s = await api<PracticeSession>(
      `/sessions/${session.id}/answer`,
      "PUT",
      { index, answer },
    );
    setSession(s);
    return s;
  }
  async function review() {
    const s = await persist();
    const result = await api<Assessment>(`/sessions/${s.id}/assess`, "POST", {
      index,
    });
    setSession({
      ...s,
      assessments: s.assessments.map((a, i) => (i === index ? result : a)),
    });
  }
  async function next() {
    const s = await persist();
    if (index < 4) {
      setIndex(index + 1);
      setAnswer(s.answers[index + 1]);
      return;
    }
    for (let i = 0; i < 5; i++) {
      if (!s.answers[i].trim()) {
        setIndex(i);
        setAnswer(s.answers[i]);
        throw Error("Answer every question before finishing.");
      }
      if (!s.assessments[i]) {
        setBusy(`Assessing answer ${i + 1} of 5…`);
        s.assessments[i] = await api<Assessment>(
          `/sessions/${s.id}/assess`,
          "POST",
          { index: i },
        );
        setSession({ ...s, assessments: [...s.assessments] });
      }
    }
    const finished = await api<PracticeSession>(
      `/sessions/${s.id}/complete`,
      "POST",
      {},
    );
    save(finished);
    navigate("/feedback");
  }
  const reviewValue = session?.assessments[index];
  return (
    <>
      <PageTitle
        title="Practice with purpose."
        subtitle="Questions from your question bank. Feedback grounded in a scoring rubric."
      />
      <div className="notice">
        <Sparkles size={16} />
        <span>
          {configured
            ? "Reviews send your answer to OpenAI and compare it with the reference and scoring criteria. AI can make mistakes; check the explanation and sources."
            : "AI assessment needs a server API key. You can still practise and save drafts; scores will be available after configuration."}
        </span>
      </div>
      {error && (
        <div className="notice" role="alert">
          {error}{" "}
          {!topics.length && (
            <button className="btn secondary" onClick={() => void load()}>
              Retry
            </button>
          )}
        </div>
      )}
      {busy && (
        <p role="status" aria-live="polite">
          {busy}
        </p>
      )}
      {!session ? (
        <div className="practice-grid">
          {topics.map((t) => (
            <Panel key={t.name}>
              <h2>{t.name}</h2>
              <p>5 questions · self-paced · saved to your workspace</p>
              <button
                className="btn primary"
                disabled={!!busy}
                onClick={() =>
                  void run("Starting practice…", async () => {
                    const s = await api<PracticeSession>("/sessions", "POST", {
                      topic: t.name,
                    });
                    setSession(s);
                    setIndex(0);
                    setAnswer("");
                  })
                }
              >
                Start practice <ArrowRight size={17} />
              </button>
            </Panel>
          ))}
        </div>
      ) : (
        <Panel className="practice-session">
          <div className="panel-heading">
            <span className="badge">{session.topic}</span>
            <span>
              {session.questions[index].kind === "technical"
                ? "Technical knowledge"
                : "Behavioural coaching"}
            </span>
          </div>
          <div className="question-progress">
            <span>Question {index + 1} of 5</span>
            <span>{session.assessments.filter(Boolean).length} reviewed</span>
          </div>
          <div className="progress-track">
            <span style={{ width: `${(index / 5) * 100}%` }} />
          </div>
          <h2 className="question">{session.questions[index].prompt}</h2>
          <label className="answer-label">
            Your answer
            <textarea
              aria-label="Your answer"
              rows={9}
              maxLength={12000}
              disabled={!!busy}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Explain your reasoning, assumptions and trade-offs."
            />
          </label>
          <p className="word-count">
            {answer.trim() ? answer.trim().split(/\s+/).length : 0} words ·{" "}
            {dirty
              ? "Unsaved edits — save before leaving this page"
              : "Draft saved"}
          </p>
          {!dirty && reviewValue && <AssessmentView value={reviewValue} />}
          <div className="form-actions">
            <button
              className="btn secondary"
              disabled={!!busy || index === 0}
              onClick={() =>
                void run("Saving draft…", async () => {
                  const s = await persist();
                  setIndex(index - 1);
                  setAnswer(s.answers[index - 1]);
                })
              }
            >
              Previous
            </button>
            <button
              className="btn secondary"
              disabled={!!busy}
              onClick={() =>
                void run("Saving draft…", async () => {
                  await persist();
                })
              }
            >
              Save draft
            </button>
            <button
              className="btn secondary"
              disabled={!!busy || !answer.trim() || !configured}
              onClick={() => void run("Assessing your answer…", review)}
            >
              Review answer
            </button>
            <button
              className="btn primary"
              disabled={
                !!busy || !answer.trim() || (index === 4 && !configured)
              }
              onClick={() => void run("Saving answer…", next)}
            >
              {index === 4 ? "Finish and assess" : "Next question"}{" "}
              <ArrowRight size={16} />
            </button>
          </div>
          <details className="discard-session">
            <summary>Discard this practice session</summary>
            <p>This permanently removes this draft and its reviews.</p>
            <button
              className="btn danger"
              disabled={!!busy}
              onClick={() =>
                void run("Discarding draft…", async () => {
                  await api(`/sessions/${session.id}`, "DELETE", {});
                  setSession(null);
                  setAnswer("");
                })
              }
            >
              Confirm discard
            </button>
          </details>
        </Panel>
      )}
    </>
  );
}
