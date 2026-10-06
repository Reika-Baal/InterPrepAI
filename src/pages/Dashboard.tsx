import EnergyOrb from "../components/EnergyOrb";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  MapPin,
  ClipboardCheck,
  Sparkles,
  ListChecks,
  Check,
  Plus,
  Flame,
} from "lucide-react";
import { Panel, PageTitle, Ring, ArrowLink, dateLabel } from "../components/UI";
import type { Interview, Session } from "../types";
const planTasks = [
  "Review the company and job description",
  "Prepare two examples using the STAR method",
  "Complete a focused practice session",
];

export default function Dashboard({
  interviews,
  sessions,
  name,
  tasks,
  toggleTask,
}: {
  interviews: Interview[];
  sessions: Session[];
  name: string;
  tasks: boolean[];
  toggleTask: (i: number) => void;
}) {
  const next = [...interviews]
    .filter((i) => i.status === "Upcoming")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
  const score = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + s.score, 0) / sessions.length)
    : 0;
  const completedTasks = planTasks.filter((_, i) => tasks[i]).length;
  const planPercent = Math.round((completedTasks / planTasks.length) * 100);
  return (
    <>
      <PageTitle
        title={`Let’s get you ready, ${name.split(" ")[0] || "there"}.`}
        subtitle="Your personalised interview preparation workspace."
      >
        <Link className="btn secondary" to="/interviews">
          <Plus size={16} /> Add interview
        </Link>
      </PageTitle>
      <div className="dashboard-banner">
        <div>
          <span className="section-label">ONE STEP CLOSER</span>
          <h2>Your next opportunity deserves your best.</h2>
          <p>Make a little time for practice today.</p>
          <Link to="/practice" className="text-link">
            Start a session <ArrowRight size={16} />
          </Link>
        </div>
        <EnergyOrb className="dashboard-orb" />
      </div>
      <div className="dashboard-top-grid">
        <Panel>
          <div className="panel-heading">
            <h2>Upcoming Interview</h2>
            <span className="badge">
              {next ? "Next up" : "Your next chapter"}
            </span>
          </div>
          {next ? (
            <>
              <div className="interview-feature">
                <div className="company-logo">{next.company.slice(0, 1)}</div>
                <div>
                  <h3>{next.company}</h3>
                  <p>{next.role}</p>
                </div>
                <Link className="btn primary" to={`/interviews/${next.id}`}>
                  Open <ArrowRight size={16} />
                </Link>
              </div>
              <div className="interview-meta">
                <span>
                  <CalendarDays size={16} />
                  {dateLabel(next.date)}
                </span>
                <span>
                  <Clock size={16} />
                  {next.time}
                </span>
                <span>
                  <MapPin size={16} />
                  {next.location}
                </span>
              </div>
            </>
          ) : (
            <div className="empty-inline">
              <p>Add an interview and start preparing for your next role.</p>
              <Link to="/interviews" className="btn primary">
                Add your first interview
              </Link>
            </div>
          )}
        </Panel>
        <Panel>
          <div className="panel-heading">
            <h2>Practice score</h2>
            <ArrowLink to="/progress">Details</ArrowLink>
          </div>
          <div className="preparation">
            <Ring value={score} label="Average rubric score" />
            <div className="score-legend">
              <div>
                <i />
                Practice score <strong>{score}%</strong>
              </div>
              <div>
                <i />
                Sessions completed <strong>{sessions.length}</strong>
              </div>
              <small>
                {sessions.length
                  ? "Based on assessed practice sessions."
                  : "Complete a session to get started."}
              </small>
            </div>
          </div>
        </Panel>
      </div>
      <div className="quick-grid">
        {[
          {
            icon: ClipboardCheck,
            title: "Continue Practising",
            description: "Build confidence, one answer at a time.",
            detail: "Data Structures & Algorithms",
            meta: "5 questions · ~15 min",
            to: "/practice",
          },
          {
            icon: Sparkles,
            title: "Answer Feedback",
            description: `${sessions.length} saved practice ${sessions.length === 1 ? "session" : "sessions"}`,
            detail: "Turn reflection into progress.",
            meta: "Review your answers",
            to: "/feedback",
          },
          {
            icon: ListChecks,
            title: "Preparation Plan",
            description: "3 small steps for your next interview.",
            detail: "Stay focused. Keep moving.",
            meta: `${completedTasks} of ${planTasks.length} tasks complete`,
            to: "#plan",
          },
        ].map((c) => (
          <Panel key={c.title} className="quick-card">
            <div className="quick-heading">
              <div className="icon-box">
                <c.icon size={20} />
              </div>
              <div>
                <h3>{c.title}</h3>
                <p>{c.description}</p>
              </div>
            </div>
            <Link
              to={c.to === "#plan" ? "/dashboard#plan" : c.to}
              onClick={
                c.to === "#plan"
                  ? () =>
                      document
                        .getElementById("plan")
                        ?.scrollIntoView({ behavior: "smooth" })
                  : undefined
              }
            >
              <div>
                <strong>{c.detail}</strong>
                <small>{c.meta}</small>
              </div>
              <ArrowRight size={18} />
            </Link>
          </Panel>
        ))}
      </div>
      <div className="dashboard-bottom">
        <Panel className="plan">
          <div id="plan" className="panel-heading">
            <h2>Your preparation plan</h2>
            <span className="badge">This week</span>
          </div>
          <div className="plan-completion">
            <div className="plan-completion-label" role="status">
              <span>
                Plan completed · {completedTasks}/{planTasks.length} tasks
              </span>
              <strong>{planPercent}%</strong>
            </div>
            <div
              className="plan-progress-track"
              role="progressbar"
              aria-label="Preparation plan completion"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={planPercent}
              aria-valuetext={`${completedTasks} of ${planTasks.length} tasks complete (${planPercent}%)`}
            >
              <span style={{ width: `${planPercent}%` }} />
            </div>
          </div>
          {planTasks.map((t, i) => (
            <label key={t} className={`task ${tasks[i] ? "done" : ""}`}>
              <input
                type="checkbox"
                checked={tasks[i]}
                onChange={() => toggleTask(i)}
              />
              <span className="task-check">
                {tasks[i] && <Check size={14} />}
              </span>
              <span>{t}</span>
            </label>
          ))}
        </Panel>
        <Panel className="momentum">
          <Flame size={25} />
          <h3>Consistency creates confidence.</h3>
          <p>
            You’ve completed <strong>{sessions.length}</strong> practice
            sessions. Your future self will thank you for showing up.
          </p>
          <ArrowLink to="/practice">Make today count</ArrowLink>
        </Panel>
      </div>
    </>
  );
}
