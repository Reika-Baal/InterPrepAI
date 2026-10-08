# Verification

## Backend update

- TypeScript and Vite production build pass.
- Nine automated backend/integration test groups pass with no paid API calls.
- Coverage includes registration, duplicate account rejection, password hashing, login/logout, owner isolation, cross-origin mutation rejection, input bounds, private rubric filtering, saved drafts, server-computed scores, cached assessment reuse, invalidation after editing, idempotent completion, reset, missing key, provider failure, quota enforcement, database reopen and concurrent assessment locks.
- Provider adapter tests verify structured requests and reject malformed, incomplete or refused responses and fabricated answer quotations.
- The AI provider is stubbed in automated integration checks. These tests do not establish semantic grading accuracy.
- Live grading evaluations are supplied via `npm run eval:live` but have not been run with a real API key.
- Headless Chromium passed registration, draft save/reload, review display, five-answer completion, feedback reload, profile persistence, dashboard navigation, mobile overflow and logout with no page errors. Browser grading used a test fixture, clearly labelled in the included screenshots.
- Desktop review screenshot visually inspected.
- Docker deployment has not been run. No hosted service has been deployed.

## Existing animated orb

The Three.js ribbon/particle scene is retained. Previous rendering checks covered moving pixels, reduced motion, dashboard/mobile rendering and the CSS fallback. The lazy rendering chunk remains approximately 521 kB and produces a Vite size warning; it is loaded separately from the main app.

## Registration password update

- Shared frontend/backend policy rejects all 20 listed passwords case-insensitively with `Password is too common`.
- Tests cover the seven-character minimum, capital letter, symbol, name matching and exact confirmation.
- API checks reject bypassed client validation; existing passwords remain valid for sign-in.
- Chromium form checks pass for all validation messages, mismatched confirmation, seven-character registration and subsequent sign-in.
- Registration screenshot visually inspected.
