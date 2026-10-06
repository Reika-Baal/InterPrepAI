import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { Panel, Logo } from "../components/UI";
export default function Auth({
  onSuccess,
}: {
  onSuccess: () => Promise<void>;
}) {
  const [register, setRegister] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <main className="auth-page">
      <Logo />
      <Panel>
        <h1>{register ? "Create your account" : "Welcome back."}</h1>
        <p>Your practice, feedback and progress in one place.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const d = new FormData(e.currentTarget);
            setBusy(true);
            setError("");
            try {
              await api("/auth/" + (register ? "register" : "login"), "POST", {
                email: d.get("email"),
                password: d.get("password"),
                ...(register ? { accessCode: d.get("accessCode") } : {}),
              });
              await onSuccess();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              required
              minLength={12}
              maxLength={128}
            />
          </label>
          <small>At least 12 characters.</small>
          {register && (
            <label>
              Registration code (if required)
              <input name="accessCode" maxLength={200} />
            </label>
          )}
          {error && (
            <p className="danger-text" role="alert">
              {error}
            </p>
          )}
          <button className="btn primary" disabled={busy}>
            {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
          </button>
        </form>
        <button
          className="text-link"
          onClick={() => {
            setRegister(!register);
            setError("");
          }}
          disabled={busy}
        >
          {register
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </button>
        <p>
          <Link to="/">Back to home</Link>
        </p>
      </Panel>
    </main>
  );
}
