# InterPrepAI

React/TypeScript frontend with an Express API, SQLite database, account sign-in and rubric-grounded AI answer assessment. The animated 3D orb and existing dashboard are included.

## Start locally

Use **Node.js 24**. Open a terminal in the folder containing this `package.json` (if you use a `frontend` folder in your repository, put this project there).

1. Run `npm install`.
2. Make a copy of `.env.example` named `.env` in this same folder.
3. Set `OPENAI_API_KEY` to your own OpenAI API key in `.env`. Keep it private. Do not paste it into chat or any `VITE_` variable. API billing is separate from a ChatGPT subscription.
4. Run `npm run dev`. This starts both Vite and the backend.
5. Open **http://localhost:5173**, enter the workspace and create an account. Enter your name, then a password of at least 7 characters containing a capital letter and a special symbol, and confirm it. Passwords must not contain your name or match the common-password list. Leave the registration code blank unless you configured one.

The SQLite database and its tables are created automatically at `server/data/interprepai.sqlite`. Keep this directory to preserve accounts and progress. No database installation is needed.

Without an API key, accounts, interviews, tasks and practice drafts work. Assessment clearly reports that it is unavailable; no substitute scores are generated. Restart the backend after changing `.env`.

## What is connected

- Email/password registration, sign-in and sign-out; salted scrypt password hashes and HttpOnly session cookies.
- Per-account database storage for profile, interviews, plan tasks, answer drafts and completed sessions.
- Fifteen original starter questions: five algorithms, five Java and five behavioural. Questions come from the server-side database, not the frontend bundle.
- A session snapshots its questions and rubrics. Editing the bank does not change old feedback.
- Save draft resumes a practice session after refresh or sign-in on another device. Next/Previous/Review also save. Unsaved typing is labelled; use Save draft before navigating away.
- Review invokes the OpenAI Responses API with the reference answer, misconception list and weighted criteria.
- Feedback shows criteria, exact answer quotations, corrections, suggestions, reference guidance and source links.
- The server calculates the score: met = full criterion weight, partial = half, missing/incorrect = zero. It rejects missing criteria and fabricated quotations. Session score is the mean of all five assessments.
- Unchanged assessments are cached. Editing an answer invalidates its previous result. Failed reviews leave the saved answer intact.
- Progress and the dashboard use completed backend assessments. Plan completion remains independent.

## What technical correctness means here

The AI assesses an explanation against curated reference material and a rubric. This is stronger than keyword scoring, but is not a proof of correctness. Valid alternative algorithms are accepted by the grading prompt. References are links attached to the authored question; pages are not fetched live on each review, and this is not a web-search or RAG system.

Behavioural answers receive coaching, not verification of personal stories. Submitted code is **not executed or compiled**. An isolated coding judge with hidden tests would be a separate feature. Do not execute candidate code in this web server.

The starter bank is editable in `server/questions.mjs`. Add a stable ID, topic, prompt, reference answer, criteria totalling 100, misconceptions and supporting links. Bump the question version after a meaningful change, restart the server to seed the updated bank, and start a new session. Five questions are randomly selected from a topic; the starter set has exactly five per topic.

## Commands

```bash
npm run dev       # Frontend and API together
npm run build     # TypeScript check and production frontend build
npm test          # Backend/integration checks, no paid API calls
npm run eval:live # Five paid AI evaluations using your .env key
npm start         # API plus built frontend, after npm run build
```

For a local built-app smoke test, set `APP_ORIGIN=http://localhost:3001` in `.env`, run `npm start`, and open that exact URL. Restore `APP_ORIGIN=http://localhost:5173` when using Vite. Use one hostname consistently: localhost and 127.0.0.1 are different origins.

## Files

| Path | Purpose |
| --- | --- |
| `server/app.mjs` | Authentication, validation, account ownership, routes and limits |
| `server/db.mjs` | SQLite schema and seed |
| `server/questions.mjs` | Original question bank and versioned rubrics |
| `server/assessment.mjs` | Provider request, structured response validation and scoring |
| `src/api.ts` / `src/useBackend.ts` | Frontend API and workspace persistence |
| `src/pages/Practice.tsx` | Drafts, assessment and completion |
| `src/components/AssessmentView.tsx` | Evidence, criteria and reference display |
| `server/tests/` | Automated backend regression tests |
| `scripts/eval-live.mjs` | Live grading quality checks |
| `docs/BACKEND.md` | Deployment, API details, limitations and backup |

## Existing browser data

This version starts each account with an empty workspace. It does not silently upload old localStorage demo data or mix demo scores with AI scores. Export data from the old version's Settings before replacing it if you need that history. There is no backup import UI yet.

## Deployment status

The backend is implemented and locally tested, **not deployed**. Live model quality has not been tested without your API key. This is a single-server foundation for your project, not a completed public SaaS service. See `docs/BACKEND.md` for the remaining deployment requirements and limitations.
