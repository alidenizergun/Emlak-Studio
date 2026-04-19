# iOS WebView Cookie & Session Persistence Validation (STU-20)

## Scope

This checklist validates auth session behavior when the app runs inside Capacitor iOS (WKWebView), with focus on:

- cookie persistence (`emlak_session` HTTP-only cookie)
- client-side auth flag persistence (`localStorage`)
- cold start / relaunch behavior
- logout/login transition correctness

## Current Auth Model (Web + iOS WebView)

- Server session source of truth: `emlak_session` cookie (HTTP-only, signed token, 30-day maxAge).
- Client convenience cache: `localStorage` keys (`emlak_authed`, `emlak_user_email`, legacy key).
- Session validity endpoint: `GET /api/auth/me`.

## Risk Profile on iOS WKWebView

### Known mismatch risk

In WebView environments, there are edge cases where `localStorage` can outlive or drift from cookie state (or vice versa), especially across app lifecycle transitions.

If UI trusts only local storage, stale sessions can appear as “logged in” until a later API call fails.

### Mitigation implemented in this issue

Protected dashboard surfaces now reconcile local auth cache against the server cookie at boot using `GET /api/auth/me`:

- if session is valid, local cache is refreshed from server identity
- if session is invalid (401/403), local cache is cleared and user is redirected to login
- transient network failures return `unknown` and avoid destructive local logout

This reduces dependence on potentially unstable local-only session state in iOS cold-start scenarios.

## Manual Validation Matrix (iOS Capacitor)

Run all checks on a real iOS device (or simulator) with a production-like HTTPS backend.

### 1) Fresh login persists after background/foreground

1. Launch app, log in.
2. Send app to background for 1-2 minutes.
3. Reopen app.

Expected:
- user remains authenticated
- dashboard/subscription/settings load without forced relogin

### 2) Cold start persistence

1. Log in.
2. Fully terminate app from app switcher.
3. Relaunch app.

Expected:
- server session survives relaunch when cookie persists
- app does not rely only on stale `localStorage` flags

### 3) Forced invalid-session recovery

1. Log in.
2. In backend/admin or dev tooling, invalidate cookie/session.
3. Reopen dashboard/settings/subscription.

Expected:
- app detects invalid server session at bootstrap
- local auth cache is cleared
- user is redirected to login cleanly

### 4) Logout transition

1. Log in.
2. Trigger logout.
3. Attempt to open protected routes.

Expected:
- cookie is cleared server-side
- local auth cache is cleared client-side
- protected routes require new login

### 5) Login switch (account A -> logout -> account B)

1. Login as account A.
2. Logout.
3. Login as account B.

Expected:
- account-dependent UI reads account B identity
- no carry-over from account A local profile/session indicators

## Follow-on Guidance

- Keep server cookie as the only source of truth for auth.
- Continue using `/api/auth/me` bootstrap checks on any newly protected page.
- For future native auth plugins (Apple/Google), preserve this reconciliation step after native token exchange.
