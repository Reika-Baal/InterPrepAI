import { lazy, Suspense } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useBackend } from "./useBackend";
import Auth from "./pages/Auth";
import type { Interview } from "./types";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Interviews, { InterviewDetail } from "./pages/Interviews";
import Practice from "./pages/Practice";
import Feedback from "./pages/Feedback";
const Progress = lazy(() => import("./pages/Progress"));
import Settings from "./pages/Settings";
export default function App() {
  const backend = useBackend();
  const location = useLocation();
  const {
    workspace: { interviews, profile, tasks },
    sessions,
    setSessions,
  } = backend;
  if (location.pathname !== "/" && backend.status !== "ready") {
    if (backend.status === "auth") return <Auth onSuccess={backend.load} />;
    return (
      <div className="empty-state">
        <h2>
          {backend.status === "loading"
            ? "Loading your workspace…"
            : "Unable to load workspace"}
        </h2>
        <p role="alert">{backend.error}</p>
        {backend.status === "error" && (
          <button className="btn primary" onClick={() => void backend.load()}>
            Retry connection
          </button>
        )}
      </div>
    );
  }
  const saveInterview = (i: Interview) => {
    const w = backend.current.current;
    void backend.update({
      ...w,
      interviews: w.interviews.some((x) => x.id === i.id)
        ? w.interviews.map((x) => (x.id === i.id ? i : x))
        : [...w.interviews, i],
    });
  };
  const removeInterview = (id: string) => {
    const w = backend.current.current;
    void backend.update({
      ...w,
      interviews: w.interviews.filter((i) => i.id !== id),
    });
  };
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        element={
          <Layout
            isGuest={backend.isGuest}
            name={profile.name}
            storageError={backend.error}
            retry={() => void backend.retry()}
            logout={() => void backend.logout()}
          />
        }
      >
        <Route
          path="/dashboard"
          element={
            <Dashboard
              interviews={interviews}
              sessions={sessions}
              name={profile.name}
              tasks={tasks}
              toggleTask={(i) =>
                void backend.update({
                  ...backend.current.current,
                  tasks: backend.current.current.tasks.map((v, j) =>
                    i === j ? !v : v,
                  ),
                })
              }
            />
          }
        />
        <Route
          path="/interviews"
          element={
            <Interviews
              interviews={interviews}
              save={saveInterview}
              remove={removeInterview}
            />
          }
        />
        <Route
          path="/interviews/:id"
          element={
            <InterviewDetail
              interviews={interviews}
              save={saveInterview}
              remove={removeInterview}
            />
          }
        />
        <Route
          path="/practice"
          element={
            <Practice
              save={(s) =>
                setSessions((prev) => [s, ...prev.filter((x) => x.id !== s.id)])
              }
            />
          }
        />
        <Route path="/feedback" element={<Feedback sessions={sessions} />} />
        <Route
          path="/progress"
          element={
            <Suspense
              fallback={
                <p className="muted" role="status">
                  Loading progress…
                </p>
              }
            >
              <Progress sessions={sessions} interviews={interviews} />
            </Suspense>
          }
        />
        <Route
          path="/settings"
          element={
            <Settings
              isGuest={backend.isGuest}
              profile={profile}
              save={(profile) =>
                backend.update({ ...backend.current.current, profile })
              }
              interviews={interviews}
              sessions={sessions}
              tasks={tasks}
              reset={backend.reset}
            />
          }
        />
      </Route>
      <Route
        path="*"
        element={
          <div className="empty-state">
            <h1>Page not found</h1>
            <Link className="btn primary" to="/">
              Back to home
            </Link>
          </div>
        }
      />
    </Routes>
  );
}
