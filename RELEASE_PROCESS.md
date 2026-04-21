# Mimaric Release Process

> Tracked in the repo so every session, agent, and collaborator sees the same rules.
> Source of truth. If `CLAUDE.md` diverges, reconcile here.

---

## § 3.4 — Verification Before Done

Never mark a UI task complete without proving it works.

**UI Testing is mandatory for every change that touches a page, component, or server action wired to the UI:**

1. Start or reload the preview server
2. Navigate to the affected page(s)
3. Exercise the golden path AND at least one edge case
4. Take a screenshot as proof and include it in the response
5. Check browser console for errors — zero errors = done

**Cross-theme verification:** for any UI change, test BOTH light + dark and BOTH Arabic + English (minimum 4 screenshots).

NEVER report a UI task as complete based on TypeScript compilation alone. A clean build ≠ a working UI.

---

## § 3.9 — Release-Gate Rule (Hard Stop)

**Context:** v4.1.0 was shipped (merge + tag + GitHub release + push) on typecheck-green alone. No preview walk. No screenshots. No console-log check. No axe scan. No mobile viewport pass. This violated § 3.4 and broke the working agreement.

**Rule — for any release tag `vX.Y.Z` (major OR minor OR patch that touches UI):**

Before `git tag`, `git push origin vX.Y.Z`, or `gh release create`, ALL of the following MUST be done AND evidenced in chat:

1. `npm run build` green locally (not just `check-types` — the full production build).
2. Preview server started (`pnpm dev` or `preview_start`) and reachable.
3. For every route listed in the plan's verification section (and at minimum the top 6 touched routes):
   - 4 screenshots: light-LTR, light-RTL, dark-LTR, dark-RTL.
   - `preview_console_logs` → zero errors.
   - Keyboard Tab-through — focus ring visible on every interactive target.
4. Mobile viewport pass (`preview_resize` 375×812) on at least 3 touched routes — tap targets ≥ 44×44 confirmed visually, bottom sheets render correctly, tables → cards.
5. Any claim-specific verification the plan calls out (e.g., "CRM PII renders as `******4567` in Kanban + drawer + list + picker").
6. **The screenshots and console output are posted in the chat before the tag command runs.** Not summarized — posted.

**If any step cannot be completed** (preview won't start, no MCP preview tools available, etc.) — STOP, surface the blocker, and ask the user whether to proceed. Do NOT rationalize past the block.

**No exceptions for:**
- "The subagents all reported green." Subagent reports cover file-level correctness, not rendered UI.
- "It's just a coherence/palette/refactor release." Palette changes are the single highest-risk category for dark-mode regressions.
- "The plan said preview verification is a step; I'll do it after." The tag command ships the release. After-the-fact verification is not verification.
- "CI is green." CI runs typecheck/lint/cspell — it does not render the UI.

**Violating this rule is worse than missing a feature.** A tagged release the team can't trust is a compounding liability. If in doubt, ship the feature branch as a preview deployment for review and defer the tag.

---

## § 7 — Release Process (After Every Implementation)

- After completing any implementation task: commit, update CHANGELOG.md, push to GitHub, verify CI passes.
- Tag releases with semantic versioning (major.minor.patch).
- Create GitHub release with release notes summarizing changes.
- Never leave uncommitted work at the end of a task session.

---

## § 7.1 — Release Notes Discipline (Hard Rule)

- **Every tagged version MUST have a matching GitHub release** at `https://github.com/GhamdiOmar/Mimaric/releases/tag/<vX.Y.Z>`. A tag without a published release is a failure.
- **CHANGELOG.md is the source; the GitHub release mirrors it.** Update `CHANGELOG.md` as part of the same commit that bumps the version — never after the fact.

**When the merge that ships a release lands on `main`:**

1. Tag the merge commit: `git tag -a vX.Y.Z <sha> -m "vX.Y.Z — <headline>"` then `git push origin vX.Y.Z`.
2. Create (or edit) the release: `gh release create vX.Y.Z --title "..." --notes-file <path> --latest` (or `gh release edit vX.Y.Z --notes-file <path>` if the tag/release already exists).
3. Release notes derive from the matching `CHANGELOG.md` section, reformatted for GitHub: headline paragraph, grouped headline changes, deferred items, upgrade notes, and a `compare` link to the previous tag.

**Every subsequent commit that is user-visible under a released version** (hotfix, follow-up a11y fix, copy change) — update the release notes for that version via `gh release edit` the same day.

**Patch-level bumps (`vX.Y.Z+1`)** — a new tag + new release, not an edit of the previous one.

**No "Generated with Claude Code" or Co-Authored-By lines** in release notes or commit messages.

**Compare link convention:** every release body ends with `**Full diff:** https://github.com/GhamdiOmar/Mimaric/compare/<prev-tag>...<this-tag>`.

---

## Pre-Release Checklist

Copy this block into the release PR description and check every item before merging:

```
Pre-release verification — vX.Y.Z

[ ] npm run build — green locally
[ ] Preview server started and reachable
[ ] Screenshots posted in chat: light-LTR, light-RTL, dark-LTR, dark-RTL (min 6 routes × 4 = 24)
[ ] preview_console_logs — zero errors on all touched routes
[ ] Keyboard Tab-through — focus ring visible on every target (min 2 routes)
[ ] Mobile viewport 375×812 — tap targets ≥ 44×44, tables → cards (min 3 routes)
[ ] Any plan-specific verification completed and evidenced (CRM PII, etc.)
[ ] CHANGELOG.md updated with this version's section
[ ] .release-verification/vX.Y.Z.md committed with screenshot paths
[ ] No Co-Authored-By / attribution in commits or release notes
[ ] Compare link appended to release body
```

---

## Verification Subagent

For any release, dispatch a dedicated verification subagent BEFORE tagging. The subagent:
- Runs `preview_start` + walks routes + posts screenshots + runs axe + checks console
- Has NO shipping tools — verification only
- Outputs `.release-verification/vX.Y.Z.md` (required by the pre-push hook)

Template: `docs/agents/verification-subagent-prompt.md`
