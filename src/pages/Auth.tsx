import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { registrationPasswordError } from "../../shared/password-policy.mjs";
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
            setError("");
            if (register) {
              const validationError = registrationPasswordError(
                String(d.get("password")),
                String(d.get("confirmPassword")),
                String(d.get("name")),
              );
              if (validationError) {
                setError(validationError);
                return;
              }
            }
            setBusy(true);
            try {
              await api("/auth/" + (register ? "register" : "login"), "POST", {
                email: d.get("email"),
                password: d.get("password"),
                ...(register
                  ? {
                      accessCode: d.get("accessCode"),
                      name: d.get("name"),
                      confirmPassword: d.get("confirmPassword"),
                    }
                  : {}),
              });
              await onSuccess();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {register && (
            <label>
              Your name
              <input
                name="name"
                autoComplete="name"
                required
                maxLength={60}
                pattern=".*\S.*"
              />
            </label>
          )}
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
              aria-describedby={register ? "password-requirements" : undefined}
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              required
              maxLength={128}
            />
          </label>
          {register && (
            <>
              <small id="password-requirements">
                At least 7 characters, including a capital letter and a special
                symbol (such as !, @ or #). Must not contain your name or be a
                common password.
              </small>
              <label>
                Confirm password
                <input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  maxLength={128}
                  aria-describedby="password-requirements"
                />
              </label>
            </>
          )}
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
          type="button"
          className="btn secondary guest-entry"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await api("/auth/guest", "POST", {});
              await onSuccess();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          Continue as guest
        </button>
        <p className="muted guest-help">
          Access all features without an account. Guest progress is available in
          this browser for up to 7 days, unless you sign out or clear cookies.
        </p>
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
