import { useRef, useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Plus,
  Search,
  CalendarDays,
  Clock,
  MapPin,
  ArrowRight,
  X,
  Trash2,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { Panel, PageTitle, dateLabel } from "../components/UI";
import type { Interview } from "../types";
type Props = {
  interviews: Interview[];
  save: (i: Interview) => void;
  remove: (id: string) => void;
};
export function InterviewForm({
  initial,
  save,
  close,
}: {
  initial?: Interview;
  save: (i: Interview) => void;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    save({
      id: initial?.id || crypto.randomUUID(),
      company: String(d.get("company")).trim(),
      role: String(d.get("role")).trim(),
      date: String(d.get("date")),
      time: String(d.get("time")),
      location: String(d.get("location")).trim(),
      type: d.get("type") as Interview["type"],
      notes: String(d.get("notes")),
      status: initial?.status || "Upcoming",
    });
    close();
  }
  return (
    <dialog
      className="modal"
      ref={dialog}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="panel-heading">
        <h2>{initial ? "Edit interview" : "Add an interview"}</h2>
        <button
          autoFocus
          className="icon-btn"
          aria-label="Close dialog"
          onClick={close}
        >
          <X size={20} />
        </button>
      </div>
      <p className="muted">A new opportunity. Let’s make a plan.</p>
      <form onSubmit={submit}>
        <label>
          Company
          <input
            name="company"
            required
            pattern=".*\S.*"
            maxLength={100}
            defaultValue={initial?.company}
            placeholder="e.g. McLaren"
          />
        </label>
        <label>
          Role
          <input
            name="role"
            required
            pattern=".*\S.*"
            maxLength={150}
            defaultValue={initial?.role}
            placeholder="e.g. Graduate Software Engineer"
          />
        </label>
        <div className="form-row">
          <label>
            Date
            <input
              name="date"
              type="date"
              required
              defaultValue={initial?.date}
            />
          </label>
          <label>
            Time
            <input
              name="time"
              type="time"
              required
              defaultValue={initial?.time || "10:00"}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Location
            <input
              name="location"
              required
              pattern=".*\S.*"
              defaultValue={initial?.location || "Online"}
            />
          </label>
          <label>
            Interview type
            <select name="type" defaultValue={initial?.type || "Mixed"}>
              <option>Mixed</option>
              <option>Technical</option>
              <option>Behavioural</option>
            </select>
          </label>
        </div>
        <label>
          Preparation notes
          <textarea
            name="notes"
            rows={3}
            defaultValue={initial?.notes}
            placeholder="What would you like to prepare?"
          />
        </label>
        <div className="form-actions">
          <button type="button" className="btn secondary" onClick={close}>
            Cancel
          </button>
          <button className="btn primary" type="submit">
            Save interview <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </dialog>
  );
}
export default function Interviews({ interviews, save }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [adding, setAdding] = useState(false);
  const filtered = interviews
    .filter(
      (i) =>
        `${i.company} ${i.role}`.toLowerCase().includes(search.toLowerCase()) &&
        (filter === "All" || i.status === filter),
    )
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return (
    <>
      <PageTitle
        title="My Interviews"
        subtitle="Every opportunity, organised. Every next step, clearer."
      >
        <button className="btn primary" onClick={() => setAdding(true)}>
          <Plus size={17} /> Add interview
        </button>
      </PageTitle>
      <div className="list-toolbar">
        <div className="search">
          <Search size={18} />
          <input
            aria-label="Search interviews"
            placeholder="Search company or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="tabs" role="group" aria-label="Filter interviews">
          {["All", "Upcoming", "Completed"].map((t) => (
            <button
              className={filter === t ? "active" : ""}
              onClick={() => setFilter(t)}
              key={t}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="interview-list">
        {filtered.map((i) => (
          <Panel key={i.id}>
            <div className="interview-feature">
              <div className="company-logo">{i.company.slice(0, 1)}</div>
              <div>
                <h3>{i.company}</h3>
                <p>{i.role}</p>
              </div>
              <span
                className={`badge ${i.status === "Completed" ? "success" : ""}`}
              >
                {i.status}
              </span>
            </div>
            <div className="interview-meta">
              <span>
                <CalendarDays size={16} />
                {dateLabel(i.date)}
              </span>
              <span>
                <Clock size={16} />
                {i.time}
              </span>
              <span>
                <MapPin size={16} />
                {i.location}
              </span>
            </div>
            <div className="list-card-bottom">
              <span className="muted">{i.type} interview</span>
              <Link className="text-link" to={`/interviews/${i.id}`}>
                View preparation <ArrowRight size={17} />
              </Link>
            </div>
          </Panel>
        ))}
      </div>
      {!filtered.length && (
        <Panel className="empty-state">
          <CalendarDays size={35} />
          <h2>No interviews found</h2>
          <p>
            {interviews.length
              ? "Try another search or filter."
              : "Add your first interview to start preparing."}
          </p>
          <button className="btn primary" onClick={() => setAdding(true)}>
            Add interview
          </button>
        </Panel>
      )}
      {adding && <InterviewForm save={save} close={() => setAdding(false)} />}
    </>
  );
}
export function InterviewDetail({ interviews, save, remove }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const i = interviews.find((x) => x.id === id);
  if (!i)
    return (
      <Panel className="empty-state">
        <h1>Interview not found</h1>
        <Link to="/interviews" className="btn primary">
          Back to interviews
        </Link>
      </Panel>
    );
  return (
    <>
      <Link className="back-link" to="/interviews">
        <ArrowLeft size={16} /> All interviews
      </Link>
      <PageTitle title={i.company} subtitle={i.role}>
        <button className="btn secondary" onClick={() => setEditing(true)}>
          Edit interview
        </button>
      </PageTitle>
      <Panel>
        <div className="panel-heading">
          <h2>Interview details</h2>
          <span className="badge">{i.status}</span>
        </div>
        <div className="interview-meta">
          <span>
            <CalendarDays size={17} />
            {dateLabel(i.date)}
          </span>
          <span>
            <Clock size={17} />
            {i.time}
          </span>
          <span>
            <MapPin size={17} />
            {i.location}
          </span>
        </div>
        <h3 className="spaced">Preparation notes</h3>
        <p className="notes">
          {i.notes ||
            "No notes yet. Edit this interview to add a preparation plan."}
        </p>
        <div className="form-actions">
          <Link className="btn primary" to="/practice">
            Start practising <ArrowRight size={16} />
          </Link>
          <button
            className="btn secondary"
            onClick={() =>
              save({
                ...i,
                status: i.status === "Upcoming" ? "Completed" : "Upcoming",
              })
            }
          >
            <CheckCircle2 size={16} />
            {i.status === "Upcoming" ? "Mark completed" : "Mark upcoming"}
          </button>
        </div>
      </Panel>
      <div className="delete-area">
        {confirming ? (
          <>
            <span>Delete this interview permanently?</span>
            <button
              className="btn danger"
              onClick={() => {
                remove(i.id);
                navigate("/interviews");
              }}
            >
              Delete
            </button>
            <button
              className="btn secondary"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            className="text-link danger-text"
            onClick={() => setConfirming(true)}
          >
            <Trash2 size={15} /> Delete interview
          </button>
        )}
      </div>
      {editing && (
        <InterviewForm
          initial={i}
          save={save}
          close={() => setEditing(false)}
        />
      )}
    </>
  );
}
