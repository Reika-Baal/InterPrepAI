import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "./api";
import type { Workspace, Session } from "./types";
const empty: Workspace = {
  profile: { name: "Your name", role: "" },
  interviews: [],
  tasks: [false, false, false],
};
export function useBackend() {
  const [workspace, setWorkspace] = useState<Workspace>(empty),
    [sessions, setSessions] = useState<Session[]>([]),
    [status, setStatus] = useState<"loading" | "ready" | "auth" | "error">(
      "loading",
    ),
    [error, setError] = useState(""),
    [isGuest, setIsGuest] = useState(false);
  const current = useRef(workspace),
    queue = useRef<Promise<unknown>>(Promise.resolve());
  async function load() {
    try {
      const d = await api<
        Workspace & { sessions: Session[]; isGuest: boolean }
      >("/workspace");
      current.current = d;
      setWorkspace(d);
      setSessions(d.sessions);
      setIsGuest(d.isGuest);
      setStatus("ready");
      setError("");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setStatus("auth");
      else {
        setError((e as Error).message);
        setStatus("error");
      }
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function update(next: Workspace): Promise<boolean> {
    current.current = next;
    setWorkspace(next);
    const job = queue.current.then(() =>
      api("/workspace", "PUT", {
        profile: next.profile,
        interviews: next.interviews,
        tasks: next.tasks,
      }),
    );
    queue.current = job.catch(() => {});
    try {
      await job;
      setError("");
      return true;
    } catch (e) {
      setError("Changes have not been saved: " + (e as Error).message);
      return false;
    }
  }
  async function reset() {
    await queue.current;
    try {
      await api("/workspace/reset", "POST", {});
      current.current = empty;
      setWorkspace(empty);
      setSessions([]);
      setError("");
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }
  async function logout() {
    await queue.current;
    try {
      await api("/auth/logout", "POST", {});
      current.current = empty;
      setWorkspace(empty);
      setSessions([]);
      setStatus("auth");
      setIsGuest(false);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return {
    workspace,
    isGuest,
    current,
    sessions,
    setSessions,
    status,
    error,
    load,
    update,
    reset,
    logout,
    retry: () => update(current.current),
  };
}
