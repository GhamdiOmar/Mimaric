# Mimaric — Architecture & Technical Reference

**Platform**: Saudi Real Estate & Facility Management SaaS
**Last Updated**: 2026-03-09

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Monorepo Structure](#monorepo-structure)
3. [Database Schema](#database-schema)
4. [Authentication & Authorization](#authentication--authorization)
5. [Server Actions](#server-actions)
6. [Pages & Routes](#pages--routes)
7. [UI Components](#ui-components)
8. [Lib Utilities](#lib-utilities)
9. [Third-Party Integrations](#third-party-integrations)
10. [Architecture Patterns](#architecture-patterns)
11. [Off-Plan Development Lifecycle](#off-plan-development-lifecycle)
12. [Saudi Government Alignment](#saudi-government-alignment)
13. [Environment Variables](#environment-variables)

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Monorepo** | Turborepo | 2.8.14 |
| **Package Manager** | npm | 11.6.2 |
| **Runtime** | Node.js | >=18 |
| **Framework** | Next.js | 16.1.5 |
| **React** | React | 19.2.0 |
| **Language** | TypeScript | 5.9.2 |
| **Database** | PostgreSQL (Supabase) | — |
| **ORM** | Prisma | 7.4.2 |
| **DB Adapter** | @prisma/adapter-pg | 7.4.2 |
| **Auth** | NextAuth v5 (beta.30) | 5.0.0-beta.30 |
| **Styling** | Tailwind CSS | 4.2.1 |
| **RTL Support** | tailwindcss-rtl | 0.9.0 |
| **Icons** | Phosphor Icons | 2.1.10 |
| **Maps** | Leaflet + React Leaflet | 1.9.4 / 5.0.0 |
| **Charts** | Recharts | 3.8.0 |
| **File Upload** | Uploadthing | 7.7.4 |
| **PDF Export** | jsPDF + html2canvas | 4.2.0 / 1.4.1 |
| **Excel Export** | ExcelJS + file-saver | 4.4.0 / 2.0.5 |
| **Password Hashing** | bcryptjs | 3.0.3 |
| **Supabase Client** | @supabase/supabase-js | 2.98.0 |
| **Linter** | ESLint | 9.39.1 |

---

## Monorepo Structure

```
/
├── apps/
│   ├── web/                    # Main Next.js 16 app (port 3000)
│   │   ├── app/
│   │   │   ├── layout.tsx      # Root layout (fonts, providers)
│   │   │   ├── page.tsx        # Landing page
│   │   │   ├── auth/           # Auth pages (login, register, reset)
│   │   │   ├── dashboard/      # All protected pages
│   │   │   └── api/            # API routes (nextauth, uploadthing)
│   │   ├── components/         # App-specific components
│   │   ├── lib/                # Utilities (auth, crypto, permissions)
│   │   ├── middleware.ts       # Route protection
│   │   ├── auth.ts             # NextAuth full config (Node.js)
│   │   ├── auth.config.ts      # NextAuth edge-safe config
│   │   └── next.config.js
│   │
│   └── portal/                 # Tenant/Buyer portal (port 3001)
│       └── app/
│           ├── layout.tsx
│           ├── page.tsx
│           └── dashboard/leases/page.tsx
│
├── packages/
│   ├── db/                     # @repo/db — Prisma ORM
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # 1500+ lines, 80+ models
│   │   │   └── seed.ts         # Demo data (Mimaric + Dummy Org)
│   │   └── src/index.ts        # DB client export (PrismaPg adapter)
│   │
│   ├── ui/                     # @repo/ui — Shared component library
│   │   └── src/
│   │       ├── components/     # Button, Input, Badge, SARAmount, RiyalIcon
│   │       ├── lib/            # cn(), format-sar
│   │       └── tailwind-config.ts
│   │
│   ├── types/                  # @repo/types — Shared TypeScript types
│   ├── eslint-config/          # Shared ESLint config
│   └── typescript-config/      # Shared tsconfig
│
├── turbo.json                  # Build pipeline config
├── package.json                # Root workspace config
└── ARCHITECTURE.md             # This file
```

### Turbo Config
- **Global env**: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST`, `AUTH_URL`, `PII_ENCRYPTION_KEY`
- **Build env passthrough**: `NEXT_PUBLIC_API_URL`
- **Cache disabled for**: `dev` (persistent), `db:generate`

---

## Database Schema

**Provider**: PostgreSQL on Supabase (transaction pooler + direct URL)
**Schema management**: `prisma db push` (no migrations — DB has drift from initial setup)
**Serialization note**: Decimal fields require `JSON.parse(JSON.stringify())` in server actions

### Models Overview (80+)

#### Organizations & Users

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **Organization** | Multi-tenant org (MOC-aligned) | name, nameArabic, crNumber, unifiedNumber, vatNumber, entityType, legalForm, registrationStatus, contactInfo (JSON), nationalAddress (JSON) |
| **User** | All platform users | email, password (bcrypt), name, role (UserRole), organizationId, onboardingCompleted, invitedBy |

**UserRole enum** (13 roles):
- System tier: `SYSTEM_ADMIN`, `SYSTEM_SUPPORT`
- Customer tier: `COMPANY_ADMIN`, `PROJECT_MANAGER`, `SALES_MANAGER`, `SALES_AGENT`, `PROPERTY_MANAGER`, `FINANCE_OFFICER`, `TECHNICIAN`, `BUYER`, `TENANT`, `USER`

#### Projects & Land

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **Project** | Full lifecycle entity (Balady-aligned) | name, type, status (21 values), parcelNumber, plotNumber, blockNumber, deedNumber, landUse, region/city/district, latitude/longitude, boundaries (JSON), suitabilityScore |
| **Building** | Physical building within project | name, projectId, numberOfFloors, buildingAreaSqm, buildingType |
| **Unit** | Sellable/leasable unit | number, type (6 values), status (5 values), buildingId, area, price, floor, bedrooms, bathrooms, commercialStrategy |
| **Phase** | Project sub-phase | projectId, name, status, startDate, endDate, budgetSar |
| **DueDiligence** | 5-category checklists | projectId, category, items (JSON: [{label, checked, notes}]) |
| **SiteLog** | Daily construction logs | projectId, date, type (5 values), description, severity, photos (JSON) |

**ProjectStatus enum** (21 statuses):
```
LAND_IDENTIFIED → LAND_UNDER_REVIEW → LAND_ACQUIRED
  → CONCEPT_DESIGN → SUBDIVISION_PLANNING → AUTHORITY_SUBMISSION
  → INFRASTRUCTURE_PLANNING → INVENTORY_STRUCTURING → PRICING_PACKAGING
  → LAUNCH_READINESS → OFF_PLAN_LAUNCHED
  → PLANNING → UNDER_CONSTRUCTION → READY → HANDED_OVER
```

**LandUse enum**: `RESIDENTIAL_LAND`, `COMMERCIAL_LAND`, `INDUSTRIAL_LAND`, `AGRICULTURAL_LAND`, `ADMINISTRATIVE_LAND`, `PUBLIC_FACILITY`, `MIXED_USE_LAND`, `OTHER_LAND_USE`

#### Customers & Sales (Absher-aligned, PII Encrypted)

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **Customer** | CRM entity | name, nameArabic, email, phone, nationalId (encrypted), personType, gender, dateOfBirth, nationality, address (JSON), documentInfo (JSON), status, agentId |
| **Reservation** | Temporary unit hold | customerId, unitId, inventoryItemId, status, expiresAt, amount |
| **Contract** | Sale/Lease agreement | customerId, unitId, type, status, fileUrl, amount, signedAt |
| **Lease** | Tenancy agreement | unitId, customerId, startDate, endDate, totalAmount, status, ejarContractId |
| **RentInstallment** | Payment schedule | leaseId, dueDate, amount, status, paidAt, paymentMethod |

**PII Encryption**: AES-256-GCM at rest with hash columns (`nationalIdHash`, `phoneHash`, `emailHash`) for exact-match search.

#### Maintenance & CMMS

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **MaintenanceRequest** | Work order | title, category (10 types), priority (4 levels), status (6 stages), unitId, assignedToId, estimatedCost, actualCost, laborHours |
| **PreventiveMaintenancePlan** | Scheduled maintenance | title, category, recurrenceType (7 options), recurrenceInterval, nextRunDate, assignToId, isActive |

**MaintenanceCategory enum**: `HVAC`, `PLUMBING`, `ELECTRICAL`, `STRUCTURAL`, `FIRE_SAFETY`, `ELEVATORS`, `CLEANING`, `LANDSCAPING_MAINT`, `PEST_CONTROL`, `GENERAL_MAINT`

#### Documents & Audit

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **Document** | File tracking | name, url, type, category (6 types), size, version, projectId/customerId/unitId/buildingId |
| **DocumentVersion** | Version history | documentId, versionNumber, url, size, uploadedBy, changeNote |
| **AuditLog** | PDPL Article 32 compliance | userId, action (8 types), resource, resourceId, metadata, ipAddress |

#### Notifications & Support

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **Notification** | In-app alerts | userId, type, title/titleEn, message/messageEn, link, read |
| **SupportTicket** | Help desk | ticketNumber, subject, category (6 types), priority, status (5 stages), assignedTo |
| **TicketMessage** | Threaded replies | ticketId, userId, message, isStaffReply |

#### Access Control

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **PermissionRequest** | Role elevation | userId, requestedRole, reason, status, reviewedBy |
| **Invitation** | Token-based team invite | email, token, role, organizationId, status, expiresAt |
| **JoinRequest** | CR-based org discovery | userId, targetOrgId, crNumber, reason, status |
| **PasswordResetToken** | NIST SP 800-63B reset | token, userId, expiresAt, usedAt |

#### Off-Plan Development (Stages 2-12)

| Model | Stage | Purpose |
|-------|-------|---------|
| **ConstraintRecord** | 2 | Spatial/regulatory constraints per land parcel |
| **FeasibilityAssessment** | 3 | Weighted scoring (LEGAL 25%, COMMERCIAL 25%, TECHNICAL 20%, ENVIRONMENTAL 15%, FINANCIAL 15%) |
| **DecisionGate** | All | Formal stage-gate approvals (PENDING/APPROVED/REJECTED/DEFERRED) |
| **ConceptPlan** | 4 | Alternative development concepts with comparison |
| **SubdivisionPlan** | 5 | Master plan with versioning |
| **Plot** | 5 | Individual subdivided parcels |
| **Block** | 5 | Plot groupings |
| **Road** | 5 | Road segments (PRIMARY/SECONDARY/LOCAL/SERVICE/CUL_DE_SAC) |
| **UtilityCorridor** | 5 | Infrastructure corridors (7 utility types) |
| **ApprovalSubmission** | 7 | Balady/authority submission tracking |
| **ApprovalComment** | 7 | Authority feedback threads |
| **ApprovalCondition** | 7 | Formal conditions on approvals |
| **InfrastructureReadiness** | 8 | Per-category readiness (10 categories, 7 statuses) |
| **InventoryItem** | 9 | Saleable inventory from plots (7 product types, 6 statuses) |
| **PricingRule** | 10 | Pricing engine rules (8 rule types) |
| **LaunchWave** | 10-12 | Phased release control (4 statuses) |

---

## Authentication & Authorization

### Auth Architecture (Edge-safe split)

```
auth.config.ts    ← Edge-safe (middleware, callbacks, JWT strategy)
auth.ts           ← Node.js full (Prisma adapter, Credentials provider, bcrypt)
middleware.ts     ← Route protection using auth.config.ts
lib/auth-helpers.ts ← Session retrieval + permission check helpers
```

### Auth Flow
1. **Credentials provider**: email + bcrypt password verification
2. **JWT strategy**: role, organizationId, onboardingCompleted stored in token
3. **Rate limiting**: In-memory progressive cooldown (5 attempts→30s, 10→5min, 20→15min)
4. **Audit**: LOGIN action logged on success
5. **Legacy role mapping**: SUPER_ADMIN→COMPANY_ADMIN, DEV_ADMIN→SYSTEM_SUPPORT

### Permission System

**40+ granular permissions** across 15 resource categories:

| Category | Permissions |
|----------|------------|
| Customers | `read`, `read_pii`, `write`, `delete`, `export` |
| Projects | `read`, `write`, `delete` |
| Units | `read`, `write`, `delete` |
| Contracts | `read`, `write`, `delete` |
| Leases | `read`, `write`, `delete` |
| Reservations | `read`, `write`, `delete` |
| Maintenance | `read`, `write`, `delete` |
| Preventive Maintenance | `read`, `write`, `delete` |
| Finance | `read`, `write` |
| Organization | `read`, `write` |
| Team | `read`, `write`, `delete` |
| Documents | `read`, `write`, `delete` |
| Reports | `read`, `export` |
| Land | `read`, `write`, `delete`, `export` |
| Off-Plan | `constraints:r/w`, `feasibility:r/w`, `decision_gates:r/w`, `concept_plans:r/w`, `subdivision:r/w`, `approvals:r/w/submit`, `infrastructure:r/w`, `inventory:r/w`, `pricing:r/w`, `launch:r/w` |
| Help | `read`, `create_ticket`, `manage_tickets`, `manage_permissions` |
| System | `admin`, `support` |

### Role → Permission Matrix

| Role | Scope |
|------|-------|
| **SYSTEM_ADMIN** | All permissions (org + system) |
| **SYSTEM_SUPPORT** | All org permissions + system:support + help:manage_tickets |
| **COMPANY_ADMIN** | All org permissions (no system access) |
| **PROJECT_MANAGER** | Projects R/W, land R/W, off-plan R/W (no decision gate approval), maintenance R/W |
| **SALES_MANAGER** | Customers full, contracts R/W, reservations R/W, inventory/pricing/launch R/W |
| **SALES_AGENT** | Customers R/W, reservations R/W, contracts R |
| **PROPERTY_MANAGER** | Units R/W, leases R/W, maintenance R/W, preventive R/W |
| **FINANCE_OFFICER** | Finance R/W, contracts R, reports R/export, pricing R/W, feasibility R |
| **TECHNICIAN** | Maintenance R/W, preventive R, units R |
| **BUYER** | Units R, contracts R, reservations R |
| **TENANT** | Units R, leases R, maintenance R/W |
| **USER** | Dashboard R, units R, notifications R |

---

## Server Actions

**Pattern**: `"use server"` → `requirePermission()` → `session.organizationId` filtering → Prisma query → `JSON.parse(JSON.stringify())` for Decimal serialization

### All 39 Server Action Files

| File | Permission | Key Functions |
|------|-----------|---------------|
| **auth.ts** | — | `signIn()`, `signUp()`, `forgotPassword()`, `resetPassword()` |
| **onboarding.ts** | — | `updateOnboardingStep()` (path, org, contact, invites) |
| **password.ts** | — | `changePassword()` (bcrypt verify + hash) |
| **dashboard.ts** | dashboard:read | KPI aggregation: units, leases, rent, maintenance |
| **customers.ts** | customers:* | Full CRM CRUD with PII encryption/masking/search |
| **projects.ts** | projects:* | Project CRUD, Balady import, bulk actions |
| **units.ts** | units:* | Unit CRUD, status update, bulk edit |
| **contracts.ts** | contracts:* | Contract create, status change, file upload |
| **leases.ts** | leases:* | Lease create, installment generation, Ejar stub |
| **reservations.ts** | reservations:* | Reservation CRUD with expiry |
| **installments.ts** | finance:read | Installment listing, payment tracking |
| **finance.ts** | finance:* | Revenue KPIs, VAT, rent collection stats |
| **maintenance.ts** | maintenance:* | Work order CRUD, technician assignment |
| **preventive-maintenance.ts** | preventive_maintenance:* | Plan CRUD, auto-generate work orders |
| **documents.ts** | documents:* | Register uploads, version tracking |
| **land.ts** | land:* | Land pipeline, acquisition, status transitions |
| **sales.ts** | — | Sales dashboard KPIs |
| **search.ts** | — | Global search across customers/units/projects/docs |
| **reports.ts** | reports:* | Excel/PDF export (customers, contracts, finance, etc.) |
| **audit.ts** | audit:read | Audit log viewer with filters |
| **notifications.ts** | notifications:read | Get/mark-read notifications |
| **organization.ts** | organization:* | Org profile CRUD |
| **team.ts** | team:* | Team management, role changes, invitations |
| **invitations.ts** | invitations:* | Token-based email invites |
| **permission-requests.ts** | — | Role elevation requests |
| **join-requests.ts** | — | CR-based org join requests |
| **support-tickets.ts** | help:* | Ticket CRUD, messages, staff assignment |
| **preferences.ts** | — | User preferences (language) |
| **site-logs.ts** | projects:read | Site log CRUD per project |
| **constraints.ts** | constraints:* | Spatial constraint CRUD, stats |
| **feasibility.ts** | feasibility:* | Assessment CRUD, `calculateSuitabilityScore()` |
| **decision-gates.ts** | decision_gates:* | Stage transition with VALID_TRANSITIONS map |
| **concept-plans.ts** | concept_plans:* | CRUD, `selectConceptPlan()` |
| **subdivision.ts** | subdivision:* | Plan/Plot/Block/Road/Corridor CRUD, versioning |
| **approvals.ts** | approvals:* | Submission CRUD, comments, conditions, resubmissions |
| **infrastructure.ts** | infrastructure:* | Readiness CRUD, `getOverallReadinessScore()` |
| **inventory.ts** | inventory:* | CRUD, `generateInventoryFromPlots()`, `releaseInventory()`, stats |
| **pricing.ts** | pricing:* | Rule CRUD, `calculatePrice()`, `bulkCalculatePrices()`, summary |
| **launch-waves.ts** | launch:* | Wave CRUD, `launchWave()`, `closeWave()`, analytics |

---

## Pages & Routes

### Auth Routes (`/auth/`)

| Route | Description |
|-------|-------------|
| `/auth/login` | Email/password login form |
| `/auth/register` | Multi-step registration wizard |
| `/auth/forgot-password` | Password reset request |
| `/auth/reset-password` | Token-based password reset form |
| `/auth/invite/[token]` | Accept team invitation (creates account + joins org) |

### Dashboard Routes (`/dashboard/`)

| Route | Description |
|-------|-------------|
| `/dashboard` | Home — KPI cards + Recharts (revenue, occupancy, maintenance, pipeline) |
| `/dashboard/onboarding` | 4-step wizard (path choice, org identity, contact, invitations) |

#### Land Acquisition
| Route | Description |
|-------|-------------|
| `/dashboard/land` | Land pipeline list with suitability scores |
| `/dashboard/land/[id]` | Land detail — 4 tabs: Due Diligence, Constraints, Feasibility, Decision Gates |

#### Projects
| Route | Description |
|-------|-------------|
| `/dashboard/projects` | Project list |
| `/dashboard/projects/new` | Create project form |
| `/dashboard/projects/[id]` | Project detail — 11 tabs: Overview, Buildings, Documents, Maintenance, Concepts, Subdivision, Approvals, Infrastructure, Inventory, Pricing, Launch |
| `/dashboard/projects/[id]/site-logs` | Construction site log entries |
| `/dashboard/projects/[id]/subdivision/[planId]` | Subdivision plan detail — 4 sub-tabs: Plots, Blocks, Roads, Utility Corridors |

#### Units
| Route | Description |
|-------|-------------|
| `/dashboard/units` | Unit matrix / inventory list (filterable by project) |

#### Sales
| Route | Description |
|-------|-------------|
| `/dashboard/sales` | Sales KPI dashboard |
| `/dashboard/sales/customers` | CRM pipeline (kanban/list view) |
| `/dashboard/sales/reservations` | Reservation list |
| `/dashboard/sales/reservations/new` | Create reservation form |
| `/dashboard/sales/contracts` | Contract list |
| `/dashboard/sales/contracts/[id]` | Contract detail with signature view |

#### Rentals
| Route | Description |
|-------|-------------|
| `/dashboard/rentals` | Lease list |
| `/dashboard/rentals/new` | Create lease with installment wizard |
| `/dashboard/rentals/payments` | Installment payment tracking |

#### Finance
| Route | Description |
|-------|-------------|
| `/dashboard/finance` | Financial dashboard (collections, VAT, P&L) |

#### Maintenance
| Route | Description |
|-------|-------------|
| `/dashboard/maintenance` | Work order list (kanban/table) |
| `/dashboard/maintenance/[id]` | Work order detail (assign, track costs) |
| `/dashboard/maintenance/preventive` | Preventive maintenance plans |

#### Other
| Route | Description |
|-------|-------------|
| `/dashboard/documents` | Document library with search/filter |
| `/dashboard/reports` | Report builder (Excel/PDF export) |
| `/dashboard/help` | FAQ + support tickets + permission requests |
| `/dashboard/help/tickets/[id]` | Ticket detail (threaded messages) |
| `/dashboard/settings` | Organization profile |
| `/dashboard/settings/team` | Team management (invite, role, delete) |
| `/dashboard/settings/security` | Password change |
| `/dashboard/settings/audit` | Audit log viewer |

### API Routes

| Route | Handler |
|-------|---------|
| `/api/auth/[...nextauth]` | NextAuth GET/POST |
| `/api/uploadthing` | Uploadthing POST/GET |

### Portal App (port 3001)

| Route | Description |
|-------|-------------|
| `/` | Portal landing |
| `/dashboard/leases` | Tenant lease view |

---

## UI Components

### Shared Library (`packages/ui/src/components/`)

| Component | Description |
|-----------|-------------|
| **Button** | Variants: solid (primary), secondary, ghost, outline. Global `@layer base` fix handles Tailwind v4 preflight |
| **Input** | Text input with validation styling |
| **Badge** | Status badges — variants: draft, available, reserved, sold, maintenance |
| **SARAmount** | Formatted SAR currency with Riyal symbol (ر.س) |
| **RiyalIcon** | Saudi Riyal SVG symbol |

### App Components (`apps/web/components/`)

| Component | Description |
|-----------|-------------|
| **MapPicker** | Interactive Leaflet map for lat/lng selection (readonly mode available) |
| **MapInner** | Leaflet map core (dynamic import, no SSR) |
| **PasswordStrengthHint** | Real-time password strength feedback (NIST SP 800-63B) |
| **MimaricLogo** | Brand logo SVG |

### Chart Components (`apps/web/components/charts/`)

| Component | Library | Description |
|-----------|---------|-------------|
| **LandPipelineChart** | Recharts | Land acquisition stage distribution |
| **ProjectStatusChart** | Recharts | Project status distribution |
| **RevenueTrendChart** | Recharts | Revenue over time (line chart) |
| **MaintenanceCostTrendChart** | Recharts | Maintenance spend trend |
| **OccupancyDonutChart** | Recharts | Occupancy percentage (donut) |

### Tailwind Theme

- **Colors**: Radix UI HSL variables (primary, secondary, destructive, muted, accent, info, warning)
- **Fonts**: IBM Plex Arabic (AR), DM Sans (EN)
- **Shadows**: `card`, `raised` (CSS variables)
- **Plugin**: `tailwindcss-rtl` for automatic RTL flipping
- **Note**: Tailwind v4 uses `@import "tailwindcss"` syntax

---

## Lib Utilities

### `apps/web/lib/`

| File | Purpose | Key Exports |
|------|---------|-------------|
| **auth-helpers.ts** | Session + permission checks | `getSessionOrThrow()`, `requirePermission(perm)`, `getSessionWithPermissions()` |
| **permissions.ts** | RBAC matrix | `Permission` type, `ROLE_PERMISSIONS`, `hasPermission()`, `getPermissions()`, `isSystemRole()` |
| **create-notification.ts** | In-app alerts | `createNotification()`, `notifyAdmins()` |
| **audit.ts** | PDPL compliance logging | `logAuditEvent()` |
| **pii-crypto.ts** | AES-256-GCM encryption | `encryptCustomerData()`, `decryptCustomerData()`, `hashForSearch()` |
| **pii-masking.ts** | UI data masking | `maskCustomerPii()` → `****6789` |
| **encryption.ts** | General encryption utils | — |
| **password-policy.ts** | NIST SP 800-63B | Min 10 chars, blocklist, context check, strength feedback |
| **hijri.ts** | Date conversion | `formatDualDate()` (Gregorian + Hijri display) |
| **help-content.ts** | FAQ data | 6 help categories with Q&A |
| **export.ts** | Report helpers | Excel/PDF/CSV export utilities |
| **report-pdf.ts** | PDF generation | jsPDF + html2canvas |
| **uploadthing.ts** | Upload wrappers | `UploadButton`, `UploadDropzone` |
| **supabase.ts** | Supabase client | Client initialization |
| **notifications.ts** | Notification helpers | UI notification utilities |

---

## Third-Party Integrations

| Service | Purpose | Config |
|---------|---------|--------|
| **Supabase** | PostgreSQL hosting, connection pooling | `DATABASE_URL` (transaction pooler), `DIRECT_URL` (direct) |
| **Uploadthing** | File uploads (contracts, blueprints, project docs) | `UPLOADTHING_SECRET`, `UPLOADTHING_APP_ID` |
| **Leaflet** | Interactive maps (location picker, project maps) | Client-side, dynamic import |
| **Recharts** | Dashboard charts and analytics | Client-side |
| **jsPDF + html2canvas** | PDF report generation | Client-side |
| **ExcelJS** | Excel report export | Client-side |
| **bcryptjs** | Password hashing | Server-side |

### Uploadthing File Router

| Endpoint | Accepts | Max Size |
|----------|---------|----------|
| `contractUploader` | PDF | 16MB |
| `blueprintUploader` | Image + PDF | 32MB |
| `projectDocumentUploader` | PDF, Image, XLSX, DOCX | 32MB (multiple files) |

---

## Architecture Patterns

### 1. Multi-Tenancy
All database queries filter by `organizationId` from the JWT session. No cross-tenant data leakage.

### 2. Server Actions (Not REST)
All data mutations use Next.js Server Actions with `"use server"` directive. No REST API endpoints (except NextAuth and Uploadthing handlers).

**Standard pattern**:
```typescript
"use server";
export async function doSomething(data: {...}) {
  const session = await requirePermission("resource:write");
  const orgId = session.organizationId;
  // ... Prisma query filtered by orgId
  return JSON.parse(JSON.stringify(result)); // Decimal serialization
}
```

### 3. PII Encryption at Rest
Customer PII (nationalId, phone, email) encrypted with AES-256-GCM. Hash columns for exact-match search without decryption.

### 4. PDPL Article 32 Audit Trail
All sensitive operations (READ_PII, EXPORT, CREATE, DELETE, LOGIN) logged to AuditLog table with userId, action, resource, metadata, IP.

### 5. Bilingual UI (Arabic/English)
- RTL/LTR support via `tailwindcss-rtl` plugin
- Dual labels: `{ ar: "...", en: "..." }` pattern throughout
- Hijri + Gregorian date display
- SAR currency formatting with Riyal symbol

### 6. Edge-Safe Auth Split
`auth.config.ts` (edge-compatible) handles JWT callbacks and route authorization. `auth.ts` (Node.js) handles Prisma adapter, bcrypt, and credential verification. This split allows middleware to run on edge while keeping heavy operations server-side.

### 7. Progressive Rate Limiting
In-memory login attempt tracking: 5 attempts → 30s cooldown, 10 → 5min, 20 → 15min.

### 8. Button Display Fix
Tailwind v4 preflight resets `<button>` to `display: inline-block`. Fixed globally via `@layer base { button { display: inline-flex; } }` in `globals.css`. No per-component `style` hack needed.

### 9. Prisma Decimal Handling
Prisma Decimal type doesn't serialize cleanly. All server actions returning Decimal fields must wrap with `JSON.parse(JSON.stringify(result))`.

---

## Off-Plan Development Lifecycle

### 12-Stage Pipeline (BRD Implementation Status)

```
Stage 1:  Raw Land Intake          ✅ Done
Stage 2:  Spatial Screening        ✅ Done (Constraints)
Stage 3:  Due Diligence            ✅ Done (Feasibility + Decision Gates)
Stage 4:  Development Concept      ✅ Done (ConceptPlan)
Stage 5:  Subdivision Design       ✅ Done (Plot/Block/Road/Corridor)
Stage 6:  Spatial Validation       ⚠️ Basic (constraints only, no auto rules)
Stage 7:  Authority Approvals      ✅ Done (Submission/Comment/Condition)
Stage 8:  Infrastructure Readiness ✅ Done (10-category matrix)
Stage 9:  Inventory Structuring    ✅ Done (generateFromPlots + manual)
Stage 10: Pricing & Packaging      ✅ Done (8-type pricing engine)
Stage 11: Launch Readiness         ⚠️ Partial (wave workflow, no gate checklist)
Stage 12: Off-Plan Launch          ⚠️ Partial (wave control, no map inventory)
```

### Stage Transition Flow
Each transition requires a **DecisionGate** approval by COMPANY_ADMIN. Valid transitions enforced via `VALID_TRANSITIONS` map in `decision-gates.ts`.

### Feasibility Scoring Weights
| Type | Weight |
|------|--------|
| LEGAL | 25% |
| COMMERCIAL | 25% |
| TECHNICAL | 20% |
| ENVIRONMENTAL | 15% |
| FINANCIAL | 15% |

---

## Saudi Government Alignment

| System | Model | Aligned Fields |
|--------|-------|----------------|
| **Absher** (MOI) | Customer | nationalId, personType, gender, dateOfBirth, nationality, documentInfo |
| **MOC** (Commerce) | Organization | entityType, legalForm, registrationStatus, crNumber, unifiedNumber, capitalAmountSar |
| **Balady** (Municipal) | Project | parcelNumber, deedNumber, landUse, coordinates, blockNumber, plotNumber |
| **RERA** (Real Estate) | Contract/Lease | Reservation flow, contract types, lease management |
| **Ejar** (Rental) | Lease | ejarContractId field for integration |
| **ZATCA** (Tax) | Organization | vatNumber for VAT compliance |
| **PDPL** (Privacy) | AuditLog | Article 32 compliance logging |
| **NCA** (Cybersecurity) | Password/Auth | NIST SP 800-63B password policy, progressive rate limiting |

---

## Environment Variables

```env
# Database (Supabase PostgreSQL)
DATABASE_URL=postgres://...      # Transaction pooler (port 6543)
DIRECT_URL=postgres://...        # Direct connection (for prisma db push)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Auth
AUTH_SECRET=                     # NextAuth JWT secret
AUTH_URL=http://localhost:3000   # NextAuth URL
AUTH_TRUST_HOST=true             # Trust proxy headers

# File Upload
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=...

# Security
PII_ENCRYPTION_KEY=              # AES-256-GCM key for customer PII
```

### Turbo Global Env (must be declared for build)
`DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST`, `AUTH_URL`, `PII_ENCRYPTION_KEY`

---

## Demo Data

### System Users (Mimaric Organization)
- `admin@mimaric.com` / SYSTEM_ADMIN
- `support@mimaric.com` / SYSTEM_SUPPORT

### Dummy Org Users
| Email | Role | Password |
|-------|------|----------|
| `dummy@demo.sa` | COMPANY_ADMIN | `mimaric2026` |
| `pm@demo.sa` | PROJECT_MANAGER | `mimaric2026` |
| `sales@demo.sa` | SALES_AGENT | `mimaric2026` |
| `tech@demo.sa` | TECHNICIAN | `mimaric2026` |

### Seed Data
- 5 land parcels with varying statuses and due diligence levels
- Dummy organization with MOC-aligned fields
- Run via `npx prisma db seed`
