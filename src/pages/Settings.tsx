import { useEffect, useState } from "react";
import { Check, Download, ShieldCheck } from "lucide-react";
import { Panel, PageTitle } from "../components/UI";
import type { Profile, Interview, Session } from "../types";
export default function Settings({
  profile,
  isGuest,
  save,
  interviews,
  sessions,
  tasks,
  reset,
}: {
  profile: Profile;
  isGuest: boolean;
  save: (p: Profile) => Promise<boolean>;
  interviews: Interview[];
  sessions: Session[];
  tasks: boolean[];
  reset: () => Promise<boolean>;
}) {
  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState(profile.role);
  useEffect(() => {
    setName(profile.name);
    setRole(profile.role);
  }, [profile]);
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(false);
  function exportData() {
    const blob = new Blob(
      [
        JSON.stringify(
          { version: 1, profile, interviews, sessions, tasks },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "interprepai-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <PageTitle
        title="Make this space yours."
        subtitle="Your profile, preferences and saved workspace data."
      />
      <Panel className="settings-panel">
        <h2>Profile</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const d = new FormData(e.currentTarget);
            const ok = await save({
              name: String(d.get("name")).trim(),
              role: String(d.get("role")).trim(),
            });
            setSaved(ok);
          }}
          onChange={() => setSaved(false)}
        >
          <label>
            Your name
            <input
              name="name"
              required
              pattern=".*\S.*"
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Target role
            <input
              name="role"
              maxLength={100}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </label>
          <button className="btn primary" type="submit">
            {saved ? (
              <>
                <Check size={16} /> Saved
              </>
            ) : (
              "Save profile"
            )}
          </button>
          <span role="status" className="save-status">
            {saved ? "Your profile has been saved." : ""}
          </span>
        </form>
      </Panel>
      <Panel className="settings-panel">
        <div className="panel-heading">
          <h2>Your data</h2>
          <ShieldCheck size={20} />
        </div>
        <p>
          {isGuest
            ? "You are using a guest workspace. It is available through this browser for up to 7 days. Ending your guest session or clearing cookies removes access to this data. Export anything you want to keep before leaving."
            : "Your workspace is saved to the backend database under your account."}
          Requesting a review sends that answer and its question rubric to
          OpenAI. Personal stories are coached, not independently verified.
        </p>
        <button className="btn secondary" onClick={exportData}>
          <Download size={16} /> Export data
        </button>
        <div className="delete-area">
          {confirm ? (
            <>
              <p>
                Reset your profile, interviews, sessions and plan? This cannot
                be undone.
              </p>
              <button
                className="btn danger"
                onClick={async () => {
                  if (!(await reset())) return;
                  setConfirm(false);
                  setSaved(false);
                }}
              >
                Reset workspace
              </button>
              <button
                className="btn secondary"
                onClick={() => setConfirm(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="text-link danger-text"
              onClick={() => setConfirm(true)}
            >
              Reset workspace
            </button>
          )}
        </div>
      </Panel>
    </>
  );
}
