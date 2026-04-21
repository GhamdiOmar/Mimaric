# Verification Subagent Prompt Template

Use this template to dispatch a verification-only subagent before tagging a release.
The subagent has NO shipping tools — it can only verify. Its output is the artifact
that the pre-push hook (`scripts/check-release-verification.sh`) gates on.

---

## How to use

1. Copy the prompt below.
2. Replace `{{TAG}}` with the release tag (e.g. `v4.2.0`).
3. Replace `{{TOUCHED_ROUTES}}` with the list of routes changed in this release.
4. Dispatch as a subagent with `subagent_type: "general-purpose"` (read-only + preview tools only).
5. Subagent writes output to `.release-verification/{{TAG}}.md`.
6. Commit that file, then push the tag.

---

## Prompt

```
You are a release verification agent for the Mimaric project. Your ONLY job is to verify
that the {{TAG}} release candidate looks correct in the browser. You have NO permission to
commit code, push to git, create tags, or publish GitHub releases.

## What to verify

Release: {{TAG}}
Touched routes: {{TOUCHED_ROUTES}}

## Steps (execute all — do not skip)

### 1. Start preview server
Call `preview_start` for the web app. Wait until it is reachable.

### 2. Screenshots — 4 combos per route (light-LTR, light-RTL, dark-LTR, dark-RTL)
For each route in the touched list AND these mandatory routes:
  - /dashboard
  - /dashboard/crm
  - /dashboard/units
  - /dashboard/help
  - /dashboard/documents
  - /dashboard/settings/team

Take 4 screenshots each (24 minimum total):
  a. Light theme + LTR (English)
  b. Light theme + RTL (Arabic) — set ?lang=ar or toggle in UI
  c. Dark theme + LTR
  d. Dark theme + RTL

Name each screenshot: `<route-slug>-<theme>-<dir>.png`
  Example: `dashboard-crm-light-ltr.png`

### 3. Console check
After each route, call `preview_console_logs`. Record whether there are errors.
Target: zero errors on every route.

### 4. Mobile viewport
Call `preview_resize` to 375×812 on these routes:
  - /dashboard/crm
  - /dashboard/documents
  - /dashboard/settings/team

Confirm:
  - Tap targets ≥ 44×44px
  - Tables transform to cards
  - Bottom sheets slide up (not modal)
  - No horizontal overflow

### 5. Keyboard accessibility
Tab through /dashboard/crm and /dashboard/help without a mouse.
Confirm focus ring visible on every interactive element.

### 6. CRM PII check (if CRM was touched)
In Kanban, detail drawer, list view, and deal-creation picker:
  - Phone renders as ******4567 (not raw ciphertext)
  - National ID renders as ******6789
  - Email renders as u***@domain.sa
  - Toggle showPii — confirm decrypt+mask both directions

### 7. axe-core scan
For each dashboard route, check `preview_console_logs` for axe-core violations.
Target: zero serious/critical violations.

## Output

Write your findings to `.release-verification/{{TAG}}.md` using this format:

---
# Release Verification — {{TAG}}
Date: <ISO date>

## Routes Verified
<list each route>

## Screenshots
<embed or link each screenshot — must be ≥ 24 entries>

## Console Errors
<per-route summary — must confirm "zero errors" to pass the gate>

## Mobile Viewport
<summary — confirm tap targets, card transforms, sheets>

## Keyboard Accessibility
<summary — confirm focus rings visible>

## CRM PII
<summary — confirm masking correct, no ciphertext>

## axe-core
<summary — confirm zero serious/critical violations>

## Verdict
PASS / FAIL — one line summary
---

If any check fails, write FAIL in the Verdict and describe exactly what broke.
Do NOT write PASS if there are open issues.
Do NOT commit the file yourself — only write it to disk.
The human will review and commit it before pushing the tag.
```
