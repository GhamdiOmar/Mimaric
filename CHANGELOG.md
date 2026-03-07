# Changelog — Mimaric PropTech

## [0.3.0] — 2026-03-07

### Added
- **Customers Hub** (`/dashboard/sales/customers`) — Unified Kanban and List views replacing former Leads page
- **Rentals New Lease Modal** — Added "Add New Customer" button and popup to create customers on-the-fly
- **Projects page** (`/dashboard/projects`) — Card grid with progress tracking
- **Sales hub page** (`/dashboard/sales`) — Links to Customers, Reservations, Contracts
- **Rentals hub page** (`/dashboard/rentals`) — Links to New Lease, Rent Collection
- **Finance page** (`/dashboard/finance`) — Revenue KPIs, ZATCA placeholder
- **Maintenance page** (`/dashboard/maintenance`) — Service request table with status badges
- **Reports page** (`/dashboard/reports`) — Downloadable report cards
- All sidebar navigation items now route to working pages (was 404 for 6 routes)

### Fixed
- Stabilized `NextAuth` beta type inference portability issues (TS2742).
- Addressed `useSearchParams` un-suspended bailout issue in reservation creation prerendering phase.
- **Build Error**: Register page syntax error in `backgroundImage` SVG data URL (line 23)
- **Build Error**: Stray markdown ` ```typescript ` tag at top of `register/page.tsx`
- **Build Error**: NextAuth v5 TS inference issue in `auth.ts` suppressed and strictly typed
- **Runtime Error**: Missing `Plus` icon import in Unit Matrix page
- **Runtime Error**: Missing `MimaricLogo` import in Contract page
- **Bug**: Login button was not clickable (no `onClick` handler)
- **Bug**: JSX whitespace `< ShieldCheck>` in Team page
- **Bug**: "Add Customer" inline logic in Sales Kanban columns fixed
- **Branding**: Last 2 "AntiGravity" references in Register terms text → "Mimaric"
- **Branding**: Contract signature "AntiGravity CEO" → "Mimaric CEO"
- **Branding**: "AG" avatar initials in Leads Kanban → "M"
- **UI**: Globally modernized Buttons; pure white text on dark backgrounds, `whitespace-nowrap`, and premium design tokens.

### Changed
- Refactored Prisma Schema: `Lead` model and `LeadStatus` renamed globally to `Customer` and `CustomerStatus`.
- Codebase-wide refactor replacing "Leads" logic with "Customers".
- Login button now redirects to `/dashboard/units` for testing.
- Test credentials enabled in `auth.ts`: `admin@mimaric.sa` / `mimaric2026`.

## [0.2.0] — 2026-03-06

### Added
- Mimaric brand integration (logo, colors, typography)
- MimaricLogo component with dark/light variants
- Dashboard layout with collapsible sidebar
- KPI dashboard overview
- Lead management with Kanban and list views
- Reservation wizard (4-step flow)
- Sales contract template (bilingual)
- Lease creation wizard
- Rent collection table
- Organization settings (CR/VAT)
- Team management with roles
- Document vault
- Project creation wizard
- Unit matrix with mass editing

## [0.1.0] — 2026-03-06

### Added
- Initial project scaffolding
- Monorepo structure (Turborepo)
- Next.js 16 app with Turbopack
- Prisma 7 schema
- NextAuth v5 configuration
- Shared UI package (`@repo/ui`)
