# Changelog — Mimaric PropTech

## [1.1.0] — 2026-03-14

### Added — Planning-to-Execution Lifecycle Bridge

- **Project Lifecycle Stepper** — Visual 14-stage stepper spanning 5 phase groups (Land → Design → Authority → Off-Plan → Execution) with bilingual labels and color-coded progress
- **"Promote to Project" button** — Planning workspaces with approved baseline scenarios can convert directly into active projects
- **"Generate from Plan" button** — Auto-create buildings and units from approved subdivision plots via `generateBuildingsFromPlots()`
- **"Convert Sold to Units" button** — Transform sold off-plan inventory items into delivered Unit records with contracts via `convertInventoryToUnits()`
- **Linked Workspace Detection** — Land and project detail pages detect existing planning workspaces and show "Continue Planning" / "View Planning" instead of duplicating

### Added — Project Financials (P&L)

- **Financials tab** on project detail — Total Costs, Total Revenue, Net P&L summary cards
- **Cost breakdown** — Land acquisition cost, development/infrastructure costs, maintenance costs
- **Revenue breakdown** — Sale revenue from signed contracts, rental income, off-plan sold inventory value
- **`getProjectFinancials()` server action** — Aggregates financial data across land, infrastructure, contracts, installments, maintenance, and inventory

### Added — Decision Gate & Compliance Enforcement

- **Compliance gate for scenario approval** — Blocks approval if any `ComplianceResult` has `result: "FAIL"` with descriptive error
- **Decision gate routing** — Project status transitions now route through `requestStageTransition()` instead of direct updates
- **Post-handover maintenance setup** — On transition to `HANDED_OVER`, auto-creates 5 default preventive maintenance plans (HVAC, Plumbing, Electrical, Fire Safety, General) for every unit

### Added — Landing Page

- **11-section bilingual marketing page** — Header, Hero, LogoBar, Features, Vision 2030, HowItWorks, Stats, Pricing, FAQ, FinalCTA, Footer
- **Glass morphism hero** with animated trust badges (Vision 2030, Balady, ZATCA, Wafi), mesh gradient background, and architectural SVG pattern
- **Tabbed feature showcase** — 5 tabs (Projects, Sales, Rentals, Maintenance, Finance) with checklists and screenshots
- **3-tier pricing display** — Starter (free), Professional (SAR 499/mo), Enterprise (SAR 1,499/mo) with annual toggle
- **100+ bilingual translation keys** covering all landing page content

### Added — Glass Morphism Design System

- **CSS custom properties** — Glass backgrounds, borders, blur levels (light/standard/heavy) with dark mode overrides
- **Gradient mesh** (`mesh-bg`) with radial gradients for hero/dark sections
- **Glass utilities** (`.glass`, `.glass-heavy`) with backdrop-filter blur, borders, and shadows
- **Elevation system** (`--elevation-1/2/3`) replacing flat shadows
- **Glow effects** (`--glow-green`, `--glow-gold`) for accent highlights
- **New animations** — `float`, `pulse-glow`, `gradient-shift`, `mesh-drift`
- **Shadow utilities** added to Tailwind config — `glass`, `glass-hover`, `elevation-1/2/3`, `glow-green`, `glow-gold`

### Added — Auth Page Redesign

- Brand panel uses `mesh-bg` gradient with architectural SVG pattern overlay
- Floating gradient mesh blobs with animation
- Form cards use glass styling (`rounded-2xl border bg-card/80 backdrop-blur-sm`)
- ThemeToggle added to login and register pages
- Error messages styled with `bg-destructive/5`

### Added — New Server Actions

- `inventory-handoff.ts` — `convertInventoryToUnits()` for off-plan to delivery conversion
- `plot-conversion.ts` — `generateBuildingsFromPlots()` for subdivision-to-building generation
- `post-handover.ts` — `setupPostHandoverMaintenance()` for auto-creating preventive plans
- `finance.ts` — `getProjectFinancials()` for project-level P&L aggregation
- `projects.ts` — `uploadDocumentVersion()` for document version management
- `planning-workspaces.ts` — `getLinkedWorkspaces()` for workspace detection
- `contracts.ts` — Auto-post to escrow on sale contract signing

### Added — E2E Testing

- **Planning Page Object Model** — Methods for workspace list, detail, map, scenarios, compliance, and feasibility tabs
- **16 Playwright test cases** — 7 workspace list tests + 9 workspace detail tests
- **E2E seed script** (`scripts/e2e-seed.ts`) — Full 17-phase lifecycle simulation with land, planning, subdivision, buildings, units, CRM, contracts, leases, construction, handover, and maintenance

### Added — Document Management Enhancements

- Category filter dropdown with funnel icon
- Version column with expandable version history
- Upload new version inline per document row
- 4 new document categories: GIS, CAD, Planning, Permit

### Changed — UI Improvements

- **Dashboard layout** — Sidebar gradient background, active nav inset glow, glass topbar
- **KPI Cards** — Backdrop blur, semi-transparent background, hover lift effect
- **All 5 chart components** — Colors aligned to HSL design tokens, glass-styled tooltips, reduced grid opacity
- **Dialog component** — Fixed positioning with `translate: "-50% -50%"` style attribute
- **MimaricLogo** — Added `width: auto, height: auto` to prevent layout shift
- **Dashboard spacing** — Increased from `space-y-8` to `space-y-10`

### Fixed

- Leaflet map double-mount in React strict mode (check `_leaflet_id`, cleanup old instance)
- `createLandParcel()` passing empty strings instead of `undefined` for optional fields
- Map z-index stacking with `isolate` class on container

### Schema Changes

- Added `GIS`, `CAD`, `PLANNING`, `PERMIT` to `DocCategory` enum

### Seed Data

- 3 SaaS plans with 11 entitlements each (Starter/Professional/Enterprise)
- Active subscriptions for main and dummy organizations

---

## [1.0.0] — 2026-03-10

### Added — SaaS Commercialization Layer

- **Subscription plans** — 3-tier system (Lite/Professional/Enterprise) with monthly and annual billing, entitlement-based feature gating, and free trial support
- **Coupon system** — Percentage and fixed-amount discount codes with max redemptions, expiry dates, and real-time validation on the plans page
- **Invoice management** — Auto-generated invoices with subtotal, 15% VAT calculation, status tracking (Draft → Issued → Paid → Overdue), and download capability
- **Payment tracking** — Payment method storage, grace period handling for past-due subscriptions, and billing cycle management (monthly/quarterly/semi-annual/annual)
- **Platform admin panel** — 4-section admin hub: Plans Management, Subscriptions monitoring, Coupons CRUD, and Invoices & Payments overview with revenue totals
- **Billing permissions** — `billing:read`, `billing:write`, `billing:admin` permissions with role-based access control

### Added — Wafi Compliance & Escrow

- **Wafi project page** — Off-plan compliance tracking with license management, milestone certification by engineering consultants, and escrow fund monitoring
- **Escrow accounts** — Fund tracking for off-plan sales with deposit/withdrawal logging and balance monitoring
- **Engineering Consultant role** — New `ENGINEERING_CONSULTANT` role for independent milestone certification per Wafi requirements
- **System Support role** — New `SYSTEM_SUPPORT` role for platform operations and ticket management

### Added — Centralized Language System

- `LanguageProvider` context with localStorage persistence and hydration-safe initialization
- Removed ~25 per-page duplicate language toggles — single unified toggle in the topbar
- Fixed hydration mismatch (`dir="rtl"` server vs `dir="ltr"` client) by deferring localStorage read to useEffect

### Added — Dark Mode Polish

- Button CSS overrides for Tailwind v4 monorepo (`.dark .btn-primary` / `.dark .btn-secondary`) — green primary, muted secondary in dark mode
- Chart dark mode colors via shared `useChartTheme` hook across all 4 dashboard charts
- Popover/dropdown solid backgrounds in dark mode (eliminates transparency/readability issues)

### Added — User Profile Popover

- Functional profile menu in the topbar showing user name, role, organization, and email
- Quick-link navigation to Settings, Security, and Help
- Sign Out action accessible from profile popover
- Removed duplicate user info section from sidebar bottom
- Profile button visible on all screen sizes (mobile + desktop)

### Added — Help Center Content Expansion

- **12 new FAQs**: Land Management (2), Document Vault (1), Billing & Subscription (3), Rental Payments (1), Sales Contracts (1), Site Logs (1), Onboarding (2), Platform Administration (1)
- **7 new step-by-step guides**: Add & Manage Land Parcels, Upload & Manage Documents, Track Sales Contracts, Record Rental Payments, Manage Subscription & Billing, Add Site Logs, Complete Account Setup
- Total: 38 FAQs (was 26) and 19 guides (was 12) — ~95% platform coverage (was ~65%)
- Corrected role count from 11 to 13 in FAQ, fixed team management button text

### Added — UI Components

- New shared components in `@repo/ui`: Dialog, EmptyState, KPICard, Popover, Select, Skeleton, Tabs, Toast
- Usage guides section redesigned with numbered badges, accordion expand, and chevron rotation

### Schema Changes

- New models: `Subscription`, `SubscriptionPlan`, `PlanEntitlement`, `Invoice`, `InvoiceItem`, `PaymentMethod`, `Coupon`, `CouponRedemption`, `WafiLicense`, `EscrowAccount`, `EscrowTransaction`, `MilestoneVerification`, `EtmamRequest`
- New enums: `SubscriptionStatus`, `BillingCycle`, `InvoiceStatus`, `PlanTier`, `CouponType`
- New roles: `SYSTEM_SUPPORT`, `ENGINEERING_CONSULTANT` added to `UserRole` enum (13 total roles)

### Fixed

- Hydration mismatch from localStorage language read during SSR
- Build error from orphaned `setLang` references after language centralization
- Tailwind v4 `dark:` utility classes not generating CSS in monorepo package source files
- Unit selection indicator changed from bottom-left circle to top-right checkbox style
- Button text unreadable in dark mode (primary and secondary variants)

---

## [0.9.0] — 2026-03-09

### Added — Dark Mode / Light Mode

- Full dark/light theme system using `next-themes` with CSS custom properties
- `ThemeProvider` and `ThemeToggle` (Sun/Moon) components with hydration-safe mounting
- Restructured `globals.css` with `:root` / `.dark` variable layers and `@custom-variant dark`
- Sidebar stays navy in both themes via fixed `--sidebar-bg` / `--sidebar-deep` tokens
- Replaced ~225 hardcoded `bg-white` across 38+ files with theme-aware `bg-card`
- Dark palette: deep navy backgrounds (`216 55% 9%`), muted borders, adjusted accent colors

### Added — Off-Plan Development System (Stages 7–12)

- **14-tab project detail page**: Feasibility, Concept Plans, Constraints, Approvals, Subdivision, Infrastructure, Inventory, Pricing, Launch Waves, Launch Readiness, Map, Sales Tracking, Analytics, Decision Gates
- **Inventory management**: Full CRUD with 9 product types (VILLA, APARTMENT, TOWNHOUSE, LAND_PLOT, COMMERCIAL, DUPLEX, PENTHOUSE, STUDIO, OTHER), status workflow (UNRELEASED → AVAILABLE → RESERVED → SOLD), and bulk operations
- **Pricing engine**: Rules-based pricing with percentage/fixed adjustments, premium/discount modes, rule priority, and active/inactive toggling
- **Launch waves**: Wave planning, launching, and closing with sequential wave numbering
- **Launch readiness checklist**: 6-point validation (subdivision, approvals, infrastructure ≥70%, inventory, pricing, waves)
- **Reservation from inventory**: "From Inventory" flow in existing reservation page with project → wave → item selection cascade
- **4 modal dialogs**: Add Inventory Item, Add Pricing Rule, Create Launch Wave, Subdivision Plan
- **3 analytics charts**: Pricing Distribution (bar), Sales Funnel (funnel), Wave Performance (composed) — all Recharts

### Added — Cross-Module Off-Plan Awareness

- **Units page**: New "مخزون على الخارطة" (Off-Plan Inventory) tab with 5 KPI cards, searchable/filterable inventory table, and project filter
- **Sales page**: "مسار مبيعات على الخارطة" pipeline section with Pipeline Value, Reserved Value, Sold Value, and Conversion Rate
- **Finance page**: "إيرادات على الخارطة" revenue section with 4-column KPI grid and progress bar
- **Reports**: Development Pipeline report enriched with per-project inventory counts and pipeline values; Pricing Analysis report enriched with per-status value breakdown

### Added — Notification Triggers

- `LAUNCH_READINESS_COMPLETE` — all 6 readiness checks pass (30-day dedup)
- `WAVE_LAUNCHED` — wave status changes to LAUNCHED
- `INVENTORY_MILESTONE_25/50/75/100` — inventory conversion milestones (30-day dedup)
- `INVENTORY_LOW` — less than 10% inventory available in a project (30-day dedup)

### Added — E2E Test Suites

- Playwright test suites: access control, analytics, dashboard, launch readiness, off-plan modals, reports, reservations
- Role-based auth setup files for admin, PM, sales, and tech roles
- Page object models for project detail and dashboard pages

### Schema Changes

- New models: `ConceptPlan`, `RegulatoryConstraint`, `ApprovalSubmission`, `SubdivisionPlan`, `InfrastructureReadiness`, `InventoryItem`, `PricingRule`, `LaunchWave`, `DecisionGate`
- New enums: `InventoryStatus`, `ProductType`, `WaveStatus`, `GateStatus`, `GateType`
- Extended `Reservation` with optional `inventoryItemId` relation
- Extended `Notification` with `titleEn` and `messageEn` for bilingual notifications

### New Server Actions (12 files)

- `analytics.ts`, `approvals.ts`, `concept-plans.ts`, `constraints.ts`, `decision-gates.ts`, `feasibility.ts`, `infrastructure.ts`, `inventory.ts`, `launch.ts`, `launch-waves.ts`, `pricing.ts`, `subdivision.ts`

### Fixed

- Subdivision detail page language toggle was non-functional (`[lang]` → `[lang, setLang]`)
- Added bilingual error messages and RTL `dir` attribute to subdivision detail

---

## [0.8.0] — 2026-03-08

### Added — Registration & Organization Management
- **Individual/Company Registration** — Account type toggle (فرد/شركة) wired to backend; company name used as org name, individual gets personal workspace
- **Auto-Login on Registration** — New users are signed in immediately and redirected to onboarding wizard (no manual login required)
- **SUPER_ADMIN Role for Org Creators** — First user in an organization gets full admin permissions instead of USER role
- **Onboarding Wizard** — 4-step post-registration flow: organization path choice, business identity (CR/VAT/entity type), contact & location, team invitations. Every step is skippable.
- **CR-Based Organization Discovery** — Individual users can search for existing organizations by Commercial Registration number. Found → join request with masked org name. Not found → option to register business with that CR.
- **Join Request System** — Users request to join organizations, admins review/approve/decline from Help Center admin panel. On approval, user moves to target org as USER role with JWT refresh.
- **Token-Based Team Invitations** — Email-based invitations with 7-day expiry, secure token links, role assignment. Replaces password-based invite flow.
- **Invitation Acceptance Page** — `/auth/invite/[token]` — shows org name, role, inviter; new user creates account and auto-joins organization.
- **Help Center** — Searchable FAQ (6 categories, bilingual), guides, support ticket system with threaded messages, permission request workflow, admin panel for managing tickets/join requests/permissions.
- **Support Ticket System** — Users create tickets with categories, admins respond with threaded messages, status tracking (open → in progress → resolved → closed).
- **Permission Request System** — Users request role upgrades, admins review and approve/decline with notifications.
- **Notification Helpers** — `createNotification()` and `notifyAdmins()` utilities for system-wide notification delivery.
- **Password Reveal Toggle** — Show/hide password button on login, register, and invitation acceptance pages.
- **Enter Key Login** — Pressing Enter on the login form submits credentials.

### Changed
- **Password Policy** — Minimum length reduced from 15 to 10 characters (NIST-compliant, common password blocklist and contextual checks remain)
- **Registration Page** — Sends `accountType` to backend, auto-redirects on success instead of showing "registered" message
- **Login Page** — Removed `?registered=true` query param handling (replaced by auto-login)
- **Auth Config** — JWT callback now supports `trigger === "update"` with session parameter for real-time token refresh after onboarding/org changes
- **Dashboard Layout** — Sidebar shows organization name (fetched via lightweight `getOrgName()` that requires only authentication, not `organization:read` permission)
- **Permissions** — Added `invitations:read`, `invitations:write` to ALL_PERMISSIONS matrix
- **Seed Data** — All seed users have `onboardingCompleted: true` and `accountType: "company"` to skip onboarding

### Schema Changes
- **User Model** — Added `accountType` (individual/company), `onboardingCompleted` (boolean), `invitedBy`, `invitedVia` fields
- **Invitation Model** — New model with token-based flow, email, role, organization, expiry, status tracking
- **JoinRequest Model** — New model for CR-based org join requests with status machine (PENDING → APPROVED/DECLINED/EXPIRED/CANCELLED)
- **InvitationStatus Enum** — PENDING, ACCEPTED, EXPIRED, REVOKED
- **JoinRequestStatus Enum** — PENDING, APPROVED, DECLINED, EXPIRED, CANCELLED
- **Organization** — Added `invitations` and `joinRequests` relations
- **Help Models** — SupportTicket, SupportTicketMessage, PermissionRequest models with full CRUD

### Fixed
- Stale JWT after onboarding completion causing infinite redirect loop (now uses `useSession().update()` + `window.location.href`)
- SALES_AGENT users crashing on dashboard due to missing `organization:read` permission (sidebar now uses lightweight `getOrgName()`)
- Registration password validation rejecting passwords containing email substrings correctly

---

## [0.7.0] — 2026-03-08

### Changed
- Button component: ghost variant now has visible `bg-muted/40` background; secondary hover upgraded with shadow lift and `-translate-y-0.5`
- Color-coded hover accents on all action buttons (green for Excel/export, red for PDF/delete, amber for PII toggle)
- Dashboard layout: added `min-w-0` and `overflow-x-hidden` to prevent horizontal scroll in RTL views
- Customers page: compact toolbar with `sm` buttons and shortened labels for RTL fit
- Maintenance detail: per-status colored transition buttons with hover lift effects
- Reports page: export buttons with green/red hover accents
- Land page: View button upgraded from ghost to secondary with green hover
- Contracts page: View button upgraded from ghost to secondary with green hover
- Reservations page: Cancel button with red hover accent
- Projects detail: Delete buttons with red hover accent
- Preventive maintenance: Delete button with red hover accent
- README.md rewritten with full business value, expanded module coverage, design system documentation

### Fixed
- LandPipelineChart Arabic labels overlapping bars (foreignObject HTML rendering)
- Customer page horizontal scroll in full-screen RTL view (min-w-0 on main flex item)
- Chart text unreadable due to similar color shades between labels and backgrounds

---

## [0.6.0] — 2026-03-07

### Added — Comprehensive Maintenance Module (CMMS)
- **Full CRUD** — Create, read, update, and delete maintenance requests with modal forms
- **Status Workflow** — Enforced transitions (OPEN → ASSIGNED → IN_PROGRESS → ON_HOLD → RESOLVED → CLOSED) with validation
- **SLA Tracking** — Auto-computed due dates by priority (URGENT: 2h, HIGH: 24h, MEDIUM: 72h, LOW: 168h)
- **10 Maintenance Categories** — HVAC, Plumbing, Electrical, Structural, Fire Safety, Elevator, Cleaning, Landscaping, Pest Control, General (bilingual AR/EN)
- **5 KPI Dashboard Cards** — Open, Assigned, In Progress, Overdue, Completed This Month
- **Filter Toolbar** — Search by title, filter by status/priority/category
- **Detail Page** — Full work order view with status transition buttons, cost tracking, labor hours, assignment management
- **Preventive Maintenance Plans** — CRUD for recurring schedules (Daily to Annual), auto-generate work orders, toggle active/paused
- **Unit-Maintenance Linking** — Unit detail modal shows maintenance requests with status badges
- **Project-Maintenance Linking** — New "الصيانة" tab on project detail page with KPI summary
- **Assignable Users** — Assign to TECHNICIAN/PROPERTY_MANAGER/PROJECT_MANAGER roles

### Added — Land & Project Enhancements
- **Land Map Integration** — Interactive Leaflet map picker on creation, read-only map on detail page
- **Import Acquired Land into Projects** — Auto-fill project form from acquired land parcels
- **Arabic Unit Labels** — Types (شقة, فيلا, مكتب, etc.) and statuses (متاح, محجوز, مباع, etc.)
- **Unit Detail Modal** — Expand unit card to see info + maintenance requests
- **5 Arabic Sample Lands** — Seed data with real Riyadh coordinates

### Schema Changes
- Added `MaintenanceCategory` enum (10 categories), `RecurrenceType` enum (7 types)
- Added `ASSIGNED`, `ON_HOLD` to `MaintenanceStatus`
- Enhanced `MaintenanceRequest` with category, scheduledDate, dueDate, completedAt, costs, laborHours, notes, preventive link
- New `PreventiveMaintenancePlan` model with recurrence scheduling, scope, cost estimation

## [0.5.0] — 2026-03-07

### Added
- Dashboard analytics with LandPipelineChart, ProjectStatusChart, and MaintenanceCostTrendChart (Recharts + foreignObject for Arabic SVG rendering)
- SAR currency formatting component (`SARAmount`) with Hala font and bilingual display
- Reports module with Excel/PDF export, date range filtering, and 5 report types (occupancy, financial, maintenance, lease, customer)
- Hijri/Gregorian dual date display across all modules
- Notification bell with unread count and mark-all-read functionality
- Site construction logs with timestamped entries per project

---

## [0.4.0] — 2026-03-07

### Added — PDPL & NCA Compliance
- **Role-Based Permission System** — Centralized `permissions.ts` with 30+ granular permissions (`customers:read`, `customers:read_pii`, `customers:export`, `audit:read`, etc.) mapped to 8 user roles
- **PII Encryption at Rest** — AES-256-GCM encryption for national IDs, phone numbers, and emails in the Customer model; SHA-256 hash columns for exact-match search on encrypted fields
- **PII Masking UI** — Customer page masks sensitive data by default; authorized users can toggle visibility with Show/Hide PII button
- **Audit Trail** — `AuditLog` model tracking all data access, PII reads, exports, logins, and modifications with user, IP, and timestamp; dedicated audit log viewer at `/dashboard/settings/audit`
- **NIST SP 800-63B Password Policy** — Minimum length enforcement, common password blocklist, contextual checks (no username/email in password), real-time bilingual strength hints
- **Login Rate Limiting** — Progressive throttling: 30s after 5 failures, 5min after 10, 15min after 20
- **Self-Registration** — `/auth/register` page with password policy enforcement and automatic org creation
- **Password Recovery** — `/auth/forgot-password` and `/auth/reset-password` pages with time-limited tokens
- **Change Password** — `/dashboard/settings/security` page for authenticated password changes
- **Password Strength Hint Component** — Reusable bilingual `PasswordStrengthHint` component used across registration, reset, invite, and change password flows
- **User Preferences** — `preferences` JSON field on User model; configurable default landing page via Settings dropdown
- **Landing Page Selector** — Settings page dropdown to choose default post-login destination from 10 allowed pages
- **Navigation Filtering** — Sidebar links filtered by role permissions (e.g., Technicians only see Maintenance and Units)
- **Permission Badges** — Team page shows visual role capability badges (PII Access, Export, Finance)

### Changed
- Default post-login redirect changed from `/dashboard/units` to `/dashboard`
- Login action reads user's preferred landing page from preferences before redirect
- All server actions now use centralized `requirePermission()` instead of manual role checks
- Customer server actions encrypt PII on write, decrypt on read, mask based on caller's permissions
- Organization actions encrypt/decrypt manager national ID
- CI workflow updated with `PII_ENCRYPTION_KEY` env var for build compatibility

### Security
- Server-side PII masking as defense-in-depth (non-PII roles receive pre-masked data)
- Audit logging for all `READ_PII` and `EXPORT` events per PDPL Article 32
- `PasswordResetToken` model with 1-hour expiry and single-use enforcement
- bcrypt cost factor 12 for all password hashing

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
