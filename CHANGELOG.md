# Changelog — Mimaric PropTech

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
