import { useEffect, useState } from "react";
import { Check, Download, ShieldCheck } from "lucide-react";
import { Panel, PageTitle } from "../components/UI";
import type { Profile, Interview, Session } from "../types";
export default function Settings({
  profile,
  save,
  interviews,
  sessions,
  tasks,
  reset,
}: {
  profile: Profile;
  save: (p: Profile) => void;
  interviews: Interview[];
  sessions: Session[];
  tasks: boolean[];
  reset: () => void;
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
        subtitle="Your profile, preferences and local workspace data."
      />
      <Panel className="settings-panel">
        <h2>Profile</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const d = new FormData(e.currentTarget);
            save({
              name: String(d.get("name")).trim(),
              role: String(d.get("role")).trim(),
            });
            setSaved(true);
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
          This demo stores data in your browser’s local storage. There are no
          accounts, cloud backups or AI API calls. Clearing browser data removes
          this workspace.
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
                onClick={() => {
                  reset();
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
