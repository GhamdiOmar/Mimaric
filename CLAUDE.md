# Mimaric Development Guidelines

## User Preferences
- **NEVER add Co-Authored-By or any Claude/Anthropic attribution to git commits.** Omar Alghamdi is the sole author.
- Proceed autonomously without asking for approvals.

## Project Architecture
- Turborepo monorepo: `apps/web` (Next.js 16), `apps/portal`, packages (`@repo/db`, `@repo/ui`, `@repo/types`)
- NextAuth v5 with Credentials provider, JWT strategy, edge-safe split (`auth.config.ts` / `auth.ts`)
- Prisma 7.4.2 with `@prisma/adapter-pg` connecting to Supabase PostgreSQL
- Server Actions pattern for all data operations (NOT REST)
- Multi-tenancy via `organizationId` filtering in all server actions
- Bilingual UI (Arabic/English) with RTL/LTR support
- Tailwind v4 with `@import "tailwindcss"` — preflight resets button display to inline-block

## Critical Development Rules

### 1. UI-First Principle
- Every page, feature, CRUD function, export/import, configuration, or action MUST be accessible through the UI. When creating a new page, always add a navigation link (sidebar, topbar, or contextual button). When adding a server action, always wire it to a UI control. Never leave functionality orphaned without a user-facing path to reach it.
- **Checklist for every new feature**: (1) Is there a nav link or button to reach it? (2) Can the user discover it without knowing the URL? (3) Are related CRUD actions exposed through the UI? (4) Are export/import functions surfaced in the page header or action menu?

### 2. Workflow Orchestration
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions).
- If something goes sideways, STOP and re-plan immediately.
- Write detailed specs upfront to reduce ambiguity.
- Use subagents liberally to keep main context window clean — one task per subagent for focused execution.

### 3. Self-Improvement Loop
- After ANY correction from the user, update CLAUDE.md with the lesson learned.
- Write rules that prevent the same mistake from recurring.
- Ruthlessly iterate on these rules until mistake rate drops.

### 4. Verification Before Done
- Never mark a task complete without proving it works (build, preview, or test).
- Diff behavior between main and changes when relevant.
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness.

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution."
- Skip this for simple, obvious fixes — don't over-engineer.
- Challenge your own work before presenting it.

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding.
- Point at logs, errors, failing tests — then resolve them.
- Zero context switching required from the user.
- Go fix failing CI tests without being told how.

### 7. Core Principles
- **Simplicity First**: Make every change as simple as possible. Minimal code impact.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Only touch what's necessary. No side effects with new bugs.

## UI/UX Design Rules

### Visual Hierarchy & Layout
- Use signifiers: button press states, active nav highlights, hover states — every element must communicate what it affords.
- Information priority via size, position, and color contrast. Most important items: large, bold, top of page.
- Group related items with containers or proximity (e.g., related KPIs in one card group).
- Never repeat the same KPI multiple times on a single page.
- Collapse secondary buttons into triple-dot menus; tuck secondary links into popovers to reduce noise.
- Use modals for simple data entry, not full-page layouts that appear sparse.

### Typography & Spacing
- One font family rule: DM Sans (English) + IBM Plex Sans Arabic (Arabic). No mixing extra fonts.
- Professional headers: letter-spacing -2% to -3%, line-height 110-120% for large text.
- 4pt/8pt grid system: all spacing must be multiples of 4 or 8.
- Ample whitespace — let elements breathe, never crowd the interface.

### Color & Depth
- One primary brand color (purple hue 260-270), derive backgrounds/text from it. Never use bright clashing colors.
- Semantic colors only: Blue = trust, Red = danger/urgency, Amber = warning, Green = success. No decorative color.
- Light mode: shadows with low opacity and high blur. Dark mode: NO shadows — create depth by making cards slightly lighter than background.
- Text over images: use linear gradient or progressive blur for readability.

### Interaction & Feedback
- Every button must have 4 states: default, hovered, active/pressed, disabled.
- Micro-interactions: immediate feedback (e.g., "Copied!" chip, success toast, spinner on submit).
- Loading spinners for data fetching, red borders/messages for errors — never leave user without feedback.

### Error Messages (Hard Rule)
- ALL error messages must be customer-facing friendly — never show technical/developer messages to the user.
- Every error must explain WHAT went wrong and WHAT the user should do next.
- Never show: variable names, status codes, stack traces, "undefined", raw exception messages, or internal state names.
- Server action errors should be clear English (UI layer handles display). Example: "Cannot delete this project because it has linked units. Please remove all units first."
- Never use `alert()` for errors — use inline error banners, toast notifications, or field-level validation with red borders.
- Never silently `console.error()` without showing the user something went wrong.

### SaaS-Specific
- Professional icon library (Lucide) only — no emojis in product UI. Size icons to match text line-height.
- Pricing tables: 3-4 plans max. Show annual discount clearly. Show what next tier adds to encourage upgrades.
- Landing pages: focus on presentation, trust signals, and conversion-optimized graphics.

### RTL / Arabic-First (Hard Rule)
- Mimaric is a Saudi-targeted Real Estate Developer platform. RTL/Arabic-first is a non-negotiable rule.
- Every function, component, layout, and flow must work correctly in RTL Arabic FIRST, then LTR English.
- Arabic must feel native, not translated. Proper Arabic typography, Hijri dates, SAR formatting, bilingual labels.
- Never break spacing, alignment, or typography rhythm when switching languages.

### Release Process (After Every Implementation)
- After completing any implementation task: commit, update CHANGELOG.md, push to GitHub, verify CI passes.
- Tag releases with semantic versioning (major.minor.patch).
- Create GitHub release with release notes summarizing changes.
- Never leave uncommitted work at the end of a task session.

## Key Technical Notes
- Use `prisma db push` not migrations (DB has drift from initial setup)
- Prisma Decimal serialization: use `JSON.parse(JSON.stringify())` in server actions
- Button component needs inline `style={{ display: "inline-flex" }}` to override Tailwind v4 preflight
- CI needs `DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST` env vars at job level
- Turbo needs `globalEnv` declaration for env vars to pass through to build tasks

## Saudi Government Schema Alignment
- Customer model aligned with Absher (nationalId, personType, gender, DOB, address, documentInfo)
- Organization model aligned with MOC (entityType, legalForm, registrationStatus, etc.)
- Project model aligned with Balady (parcelNumber, deedNumber, landUse, coordinates, etc.)
