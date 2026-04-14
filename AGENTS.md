# AGENTS.md

## Purpose
This repository uses Codex agents to implement work from Linear.

The current execution plan lives in the Linear project:
- `iOS App + Store Billing Migration`

Agents must treat Linear child issues as the unit of implementation.
Do not implement parent issues directly.

## Source Of Truth
Use these sources in this order:
1. The assigned Linear child issue
2. The parent issue for scope context
3. The project execution document in Linear
4. This file

If these conflict, stop and ask for clarification instead of guessing.

If the written execution order and the Linear `blockedBy` graph diverge:
1. Trust the Linear blocker graph
2. Treat written order as advisory unless it matches the blocker graph

## Issue Selection
1. Only work on assigned child issues such as `STU-9`, `STU-10`, etc.
2. Do not start a blocked issue.
3. Respect the `blockedBy` graph in Linear.
4. If an issue is a parent/coordinator ticket, do not code against it. Pick the first unblocked child.

Current migration first wave starts in parallel with:
1. `STU-9`
2. `STU-12`
3. `STU-15`
4. `STU-18`

Second wave opens as first-wave blockers clear:
1. `STU-10` and `STU-11` after `STU-9`
2. `STU-13` and `STU-14` after `STU-12`
3. `STU-16` after `STU-15`
4. `STU-19` and `STU-20` after `STU-18`

## Branch And PR Workflow
1. The integration branch for this migration is:
   - `feat/ios-app-store-billing-migration`
2. Create each child-issue branch from `feat/ios-app-store-billing-migration`, not from `main`.
3. Use one branch per child issue.
4. Branch naming:
   - `stu-9-auth-shortcuts`
   - `stu-10-api-me-bootstrap`
   - `stu-22-google-native-login`
5. Do not mix unrelated child issues in one branch.
6. Open one PR per child issue into `feat/ios-app-store-billing-migration` unless the user explicitly asks to bundle issues.
7. Keep one long-lived integration PR from `feat/ios-app-store-billing-migration` into `main`.
8. Link the Linear issue in the PR title or body.

Branching summary:
1. `main` stays production-safe
2. `feat/ios-app-store-billing-migration` is the migration integration branch
3. child issue branches base on `feat/ios-app-store-billing-migration`
4. child issue branches merge back into `feat/ios-app-store-billing-migration`

Commit format:
1. Use conventional commit prefixes when they fit the change:
   - `feat`
   - `fix`
   - `test`
   - `docs`
   - `refactor`
   - `chore`
2. Include the Linear issue key in the commit subject, preferably as a suffix in parentheses.
3. Preferred examples:
   - `fix: remove insecure auth shortcuts (STU-9)`
   - `feat: add trusted /api/me bootstrap (STU-10)`
   - `test: cover history persistence regression (STU-12)`
   - `docs: clarify agent branch workflow (STU-18)`
4. Pick the prefix that matches the actual change. Do not label bug fixes as `feat` or tests as `fix`.
5. Do not combine multiple issue keys in one commit unless the user explicitly approved bundled work.

## GitHub Review Handling
1. When addressing PR reviews, evaluate whether each review comment is valid for the current issue scope and current app behavior.
2. If a review is valid, add a thumbs-up reaction to the review comment.
3. If the valid review is addressed in code, do not reply in the thread; resolve it after the fix lands.
4. If the review should remain open because the behavior is intentional, expected at the current app stage, or out of the current issue scope, reply in the thread with a comment that starts with `@codex` and explain why no code change is being made.

## Scope Control
1. Change only the files required for the assigned issue.
2. Do not perform opportunistic refactors outside the issue scope.
3. If you find a separate bug, note it and stop unless it blocks the assigned issue.
4. Keep migrations additive and backward-compatible.
5. Do not silently rewrite large product flows without the issue explicitly calling for it.

## Repo-Specific Guardrails

### Authentication
1. Never add passwordless admin or owner login behavior.
2. Never mint a session from an unverified email alone.
3. Never use `localStorage` as a trust boundary for auth.
4. Server session state is the source of truth.

### Credits And Billing
1. Never expose credit mutation to self-service clients.
2. Admin credit changes must stay admin-only.
3. App Store billing must map to explicit entitlements and credit grants.
4. Do not infer subscription state from current credit balance.
5. Native iOS flows must not route digital purchases to manual billing/contact flows.

### Persistence
1. Production source of truth is Postgres.
2. SQLite may remain only as an explicit local-development fallback.
3. Do not add new production-critical persistence on filesystem-backed SQLite.
4. History, downloads, and adaptive-policy data must be durable in production.

### Mobile Scope
1. Current iOS scope is:
   - email/password
   - Google native login
   - Sign in with Apple
   - App Store subscriptions
   - App Store consumable credit packs
2. Out of scope unless explicitly added:
   - yearly plans
   - full native upload/camera flow
   - Android work

## Testing And Verification
Run the smallest set that proves the issue is correct.

Default checks:
1. `npm run lint`
2. `npm run build` for changes affecting app wiring, routing, auth, billing, or shared runtime behavior

Run targeted scripts when relevant:
1. `npm run test:stage-regression`
2. `npm run test:enhance-regression`
3. `npm run test:stage-prompt-snapshots`

For iOS-native work:
1. Verify the web app still works in browser context.
2. Note clearly if native iOS verification was not run.
3. Do not claim sandbox purchase/auth verification unless it was actually performed.

If a command cannot run because of environment limits:
1. Say exactly what was not run
2. Say why
3. Do not hide the gap

## File Change Expectations By Track

### Auth Hardening
Likely files:
- `app/api/auth/login/route.ts`
- `app/api/auth/social/session/route.ts`
- `app/login/LoginClient.tsx`
- `app/[lang]/auth/callback/page.tsx`
- `lib/session.ts`
- `lib/client-auth.ts`
- new auth helper files

### Persistence Migration
Likely files:
- `lib/persistent-db.ts`
- `lib/db.ts`
- `lib/work-history.ts`
- `lib/history-download.ts`
- history image/download routes
- adaptive runtime files

### Billing Refactor
Likely files:
- `lib/credits.ts`
- `lib/subscriptions.ts`
- `lib/pricing-policy.ts`
- `app/api/credits/route.ts`
- `app/api/subscription/route.ts`
- new billing helper files

### iOS Shell / Native Auth / RevenueCat
Likely files:
- `package.json`
- `capacitor.config.ts`
- `ios/`
- native runtime helpers
- new native auth routes
- new RevenueCat integration files

## Linear Workflow
1. Work from the assigned child issue only.
2. Respect blockers before starting implementation.
3. When you start active implementation on an assigned issue, move it to `In Progress`.
4. If implementation is blocked, move the issue to the appropriate blocked state if the team uses one; otherwise leave the state unchanged and add a blocker comment immediately.
5. When implementation is complete but the work is still awaiting review or merge, move the issue to `In Review`.
6. Move an issue to `Done` only after the work is merged or the user explicitly says to treat it as landed.
7. When work is complete, add a concise issue comment with:
   - what changed
   - files changed
   - verification run
   - remaining risks or follow-ups
8. If blocked, comment with the exact blocker and stop.

## Done Criteria
An issue is done only when:
1. The code change is complete for the assigned scope
2. Required checks were run, or the exact verification gap is documented
3. The diff stays within issue scope
4. Any schema or API contract changes are backward-compatible or intentionally documented
5. The Linear issue state reflects reality (`In Review` for completed but unmerged work, `Done` only for landed work, or the appropriate blocked/in-progress state)
6. A Linear update or handoff note is ready

## Escalation Rules
Stop and ask before proceeding if:
1. The issue requires changing scope across multiple child tickets
2. You discover conflicting Linear requirements
3. A migration would be destructive or irreversible
4. You encounter unexpected unrelated changes in the same files
5. The implementation requires secrets, Apple configuration, or storefront credentials that are not available
