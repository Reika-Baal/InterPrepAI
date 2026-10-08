# Backend and assessment

## Request flow

Browser → authenticated Express API → SQLite question/session → OpenAI assessment → schema/evidence validation → server-calculated score → saved feedback.

Question prompts are returned when starting a session. Reference answers and rubrics remain server-side until a review is returned. The grading request includes the trusted rubric as instructions and treats candidate text as untrusted content. The model cannot write to the database, execute code, choose external URLs or set a total score. Supporting links come only from the bank. Prompt injection remains a model-quality risk; run the included live evaluation before relying on results.

The default model is configurable through `OPENAI_MODEL=gpt-4.1-mini`. The implementation uses the Responses API with strict structured output and `store:false`. This does not mean zero data retention by the provider. The app sends a question, rubric and candidate answer, not the account password, email or full workspace. Users are told before requesting assessment.

Official implementation references:
- https://developers.openai.com/api/docs/guides/structured-outputs
- https://developers.openai.com/api/docs/models/gpt-4.1-mini
- https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html
- https://expressjs.com/en/5x/api/

## API

All mutation requests require `Content-Type: application/json` and `Origin` matching `APP_ORIGIN`. Authentication is an opaque seven-day session token in an HttpOnly, SameSite=Strict cookie; only its SHA-256 hash is stored. Production cookies use Secure and a __Host- prefix.

| Method | Route | Use |
| --- | --- | --- |
| GET | /api/health | Availability and whether AI is configured |
| POST | /api/auth/register | name, email, password, confirmPassword, optional accessCode |
| POST | /api/auth/login | email and password |
| POST | /api/auth/logout | Revoke current session |
| GET/PUT | /api/workspace | Read state / save profile, interviews, tasks |
| POST | /api/workspace/reset | Clear account workspace and all practice sessions |
| GET | /api/topics | Available topics and question counts |
| POST | /api/sessions | Start draft using topic |
| GET | /api/sessions/active | Resume draft |
| PUT | /api/sessions/:id/answer | Save index and answer |
| POST | /api/sessions/:id/assess | Assess saved answer by index |
| POST | /api/sessions/:id/complete | Complete only after all reviews exist |
| DELETE | /api/sessions/:id | Discard owned draft |

Scores are never accepted from the browser. Every session lookup checks ownership. Completion is idempotent. Duplicate in-flight requests are rejected and completed unchanged reviews are reused. Requests time out after 45 seconds at the AI provider. An invalid/refused/incomplete model response never becomes a saved score.

Rate limits cover requests and sign-in. Persistent UTC-day quotas cap attempted provider calls globally (200/day by default) and per user (30/day). Failures count toward the cap to bound repeated retries. Configure limits in `.env` and set provider-side spending limits too. Request-rate counters and in-flight locks are in one process; do not run multiple API replicas with this design.

## Deployment

Use one Node 24 process on a host with a persistent disk. Run `npm ci`, `npm run build`, then `npm start`. Express serves `dist` and the API from the same origin, including frontend route fallback. The previous static-only deployment configs were removed because they cannot run this backend.

Set:
- `NODE_ENV=production`
- `APP_ORIGIN=https://your-domain.example` (no trailing slash)
- `REGISTRATION_CODE` to a private invitation code
- `OPENAI_API_KEY` using your host's secret manager
- `DATABASE_PATH` on a persistent volume
- `HOST=0.0.0.0` if required by the container/host; keep the upstream private behind the HTTPS proxy

Terminate HTTPS at your trusted host/reverse proxy. The app intentionally does not blindly trust forwarded IP headers; behind a proxy the IP request limiter is shared unless you implement an exact trusted proxy configuration. Per-user daily limits still apply. Use a single instance. Ephemeral/serverless filesystems will lose SQLite data. Public launch needs an operator review of HTTPS, backups, recovery and abuse controls; it has not been performed here.

A Dockerfile and compose file are provided as a packaging option. Set production secrets and a real HTTPS origin before using them. The compose port is bound to host loopback for a reverse proxy, not directly exposed publicly. Docker packaging has not been executed in this environment.

## Backup and recovery

Stop the server cleanly and back up the entire directory containing the SQLite file, including any WAL/SHM files. Restore to the same configured DATABASE_PATH and start the server. Keep backups private: answers and profile data are not encrypted at rest by this app. Export data in Settings provides a per-account JSON download, but there is no import endpoint yet.

Question seeds upsert on startup. Schema version 1 is recorded using PRAGMA user_version. Future schema changes require explicit migrations and backup testing.

## Known limits

No email verification, password-reset email, MFA, billing, account deletion UI, collaborative editing, hosted deployment, coding sandbox, live source retrieval or automatic employer-specific questions. Forgotten passwords currently require an operator-assisted recovery design, not an existing recovery flow. Workspace writes use last-write-wins across devices. Saved drafts are explicit; unsaved typing can be lost when navigating within the app. Historical data is not paginated yet. These are follow-up product features, not claims of current functionality.

## Verification and model evaluation

`npm test` uses a stubbed provider to exercise transport, ownership, score calculation, response validation and failure handling without charges. Passing these tests does not establish AI accuracy.

`npm run eval:live` makes five real provider calls: correct binary search, false binary search, a prompt-injection attempt, an alternative cycle detection algorithm and Java equality. It checks broad score ranges. Run it with your configured model/key and inspect explanations before release. It is a starter evaluation, not a comprehensive quality benchmark.


## Registration password policy

Registration requires name, password and confirmPassword. Both the form and API use `shared/password-policy.mjs`: at least 7 Unicode characters, a capital letter and a punctuation/symbol character. Spaces alone do not count as symbols. The existing maximum is 128 UTF-16 code units. Password confirmation must match exactly. Passwords are hashed exactly as entered; they are not trimmed or normalised for authentication.

The supplied list of 20 common passwords is checked first, ignoring case and outer whitespace, so these inputs receive exactly `Password is too common`. This is an exact blocklist, not a comprehensive dictionary or a check for every possible variation. Name matching ignores case and punctuation and checks the full name and name parts of two or more characters; individual initials in multi-part names are ignored. The supplied registration name becomes the initial profile name. This check uses the user's supplied name, not independently verified identity.

New registration rules are not applied during sign-in, so existing accounts keep working. Profile name edits do not retroactively validate an existing password. No schema migration or password reset is required.
