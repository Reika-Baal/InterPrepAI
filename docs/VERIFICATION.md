# Verification

## Backend update

- TypeScript and Vite production build pass.
- Eleven automated backend/integration test groups pass with no paid API calls.
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


## Guest access update

- Guest entry requires no credentials and provides an isolated server workspace.
- Backend tests cover all workspace capabilities, guest ownership isolation, repeated-entry reuse, configured registration-code independence, assessment quotas, sign-out and expired guest cleanup.
- Existing registered sessions remain registered when the guest entry endpoint is called.
- Chromium checks pass for guest entry, saved draft reload, five reviews and completion, feedback reload, profile updates, interviews, progress, dashboard, mobile layout and exit. The AI provider is stubbed in these checks.
- Guest entry screenshot visually inspected; production build passes.


## Theme toggle update

- Build passes with a moon/sun toggle beside the profile avatar.
- Chromium checks cover icon changes, adjacency, light form/dialog styling, persisted theme after refresh, mobile overflow, keyboard operation, return to dark mode and unavailable browser storage.
- Desktop light dashboard screenshot visually inspected; mobile preview also captured.
- Shared CSS variables cover chart axes, tooltips and ring tracks; light palette covers workspace, authentication and landing surfaces.
