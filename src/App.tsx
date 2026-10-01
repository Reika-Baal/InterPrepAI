import { lazy, Suspense } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { useLocalStorage } from "./useLocalStorage";
import { initialInterviews } from "./data";
import type { Interview, Session, Profile } from "./types";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Interviews, { InterviewDetail } from "./pages/Interviews";
import Practice from "./pages/Practice";
import Feedback from "./pages/Feedback";
const Progress = lazy(() => import("./pages/Progress"));
import Settings from "./pages/Settings";
export default function App() {
  const [interviews, setInterviews, interviewError] = useLocalStorage<
    Interview[]
  >("interprepai.interviews.v1", initialInterviews);
  const [sessions, setSessions, sessionError] = useLocalStorage<Session[]>(
    "interprepai.sessions.v1",
    [],
  );
  const [profile, setProfile, profileError] = useLocalStorage<Profile>(
    "interprepai.profile.v1",
    { name: "Pratik", role: "Graduate Software Engineer" },
  );
  const [tasks, setTasks, taskError] = useLocalStorage<boolean[]>(
    "interprepai.tasks.v1",
    [false, false, false],
  );
  const saveInterview = (i: Interview) =>
    setInterviews((prev) =>
      prev.some((x) => x.id === i.id)
        ? prev.map((x) => (x.id === i.id ? i : x))
        : [...prev, i],
    );
  const removeInterview = (id: string) =>
    setInterviews((prev) => prev.filter((i) => i.id !== id));
  const reset = () => {
    setInterviews([]);
    setSessions([]);
    setProfile({ name: "Your name", role: "" });
    setTasks([false, false, false]);
  };
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        element={
          <Layout
            name={profile.name}
            storageError={
              interviewError || sessionError || profileError || taskError
            }
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
                setTasks((prev) => prev.map((v, j) => (i === j ? !v : v)))
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
            <Practice save={(s) => setSessions((prev) => [s, ...prev])} />
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
              profile={profile}
              save={setProfile}
              interviews={interviews}
              sessions={sessions}
              tasks={tasks}
              reset={reset}
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
