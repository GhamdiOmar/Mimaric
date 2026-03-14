# Mimaric — Saudi-First Property Management Platform

**Mimaric** (ميماريك) is an integrated PropTech platform built for Saudi real estate developers and property management companies. It covers the full property lifecycle — from land acquisition and project planning to sales, leasing, maintenance, and financial reporting — with native compliance for Saudi regulations (RERA, ZATCA, Ejar, Balady) and data protection laws (PDPL, NCA).

---

## Business Value

Mimaric addresses the core operational pain points of Saudi property developers and facility managers:

### Problem
Saudi real estate companies manage property operations across disconnected spreadsheets, WhatsApp groups, paper forms, and multiple government portals. This fragmentation causes data loss, compliance gaps, delayed decision-making, and poor tenant/buyer experience.

### Solution
A single Arabic-first platform that unifies every stage of the property lifecycle under one roof:

- **Eliminate Spreadsheet Chaos** — Centralized data for land, projects, units, customers, contracts, and maintenance replaces scattered files and manual tracking
- **Saudi Regulatory Compliance Built-In** — RERA licensing, ZATCA VAT/e-invoicing, Ejar rental registration, Balady municipal permits, and WATHQ CR verification are integrated into workflows, not afterthoughts
- **Data Protection by Design** — PDPL and NCA compliance baked into the architecture: AES-256-GCM PII encryption, role-based access with 30+ granular permissions, and full audit trails are core infrastructure
- **Bilingual RTL-First** — Full Arabic/English interface with right-to-left layout, Hijri/Gregorian dual dates, SAR currency formatting, and Arabic typography (IBM Plex Arabic)
- **Decision Intelligence** — Real-time dashboards with pipeline visualization, occupancy analytics, cost trends, and exportable reports drive data-informed decisions
- **Multi-Tenant Team Collaboration** — Organization-scoped data isolation, role-based sidebar navigation, team invitations, and CR-based org discovery enable secure multi-user operations

### Target Users
- Real estate developers (مطورون عقاريون)
- Property management companies (شركات إدارة الأملاك)
- Facility management firms (شركات إدارة المرافق)
- Individual property owners managing multiple assets (ملاك عقارات)

---

## Platform Modules

| Module | What It Does |
|--------|-------------|
| **Landing Page** | 11-section bilingual marketing site with glass morphism design, Vision 2030 alignment, tabbed feature showcase, 3-tier pricing, and FAQ |
| **Dashboard** | Real-time KPI cards and analytics — occupancy rates, land pipeline chart, project status distribution, maintenance cost trends |
| **Land Acquisition** | End-to-end pipeline: Identify → Review → Acquire → Convert to Project, with interactive map picker and due diligence |
| **Planning OS** | GIS-integrated subdivision planning with scenarios, feasibility analysis, compliance checking, and "Promote to Project" workflow |
| **Projects** | Development project management with 14-stage lifecycle stepper, P&L financials tab, building/tower management, and Balady document uploads |
| **Unit Matrix** | Track units across buildings — area, price, type (شقة/فيلا/مكتب), availability — with bulk editing and SAR currency display |
| **Customer CRM** | Unified customer database with Kanban pipeline (New → Interested → Qualified → Viewing → Reserved) and list view |
| **Reservations** | Temporary unit holds linked to customers with expiry management |
| **Contracts** | Sale and lease contract generation with bilingual templates, status tracking, and document uploads |
| **Rentals** | Full tenancy lifecycle — lease creation wizard, installment schedules, rent collection, Ejar integration readiness |
| **Finance** | Payment tracking, installment schedules, VAT calculation (ZATCA-compliant), revenue KPIs |
| **Maintenance** | CMMS work order management with status workflow (Open → Assigned → In Progress → On Hold → Resolved → Closed), SLA tracking, technician assignment, and cost tracking |
| **Preventive Maintenance** | Frequency-based scheduling (daily to annual), auto work-order generation, category tagging across 10 maintenance types |
| **Reports** | Excel/PDF export for occupancy, financial, maintenance, lease, and customer reports with date range filtering |
| **Site Logs** | Construction progress tracking per project with timestamped entries |
| **Notifications** | In-app notification bell with unread counts, mark-all-read, and admin alerts for join requests and permission changes |
| **Help Center** | Searchable FAQ (38 items, 7 categories) and 19 step-by-step guides (bilingual), support ticket system with threaded messages, permission request workflow |
| **Billing** | SaaS subscription management — 3-tier plans (Lite/Professional/Enterprise), monthly/annual billing, coupon codes, invoice history with VAT, payment method storage |
| **Platform Admin** | Admin hub for managing subscription plans, monitoring all organization subscriptions, creating coupons, and viewing platform-wide invoices and revenue |
| **Settings** | Organization profile (MOC-aligned), team management with email invitations, user preferences, security settings, and audit log viewer |
| **Onboarding** | 4-step post-registration wizard: org path choice (join/create), organization identity, contact info, team invitations |

---

## Registration & Organization Management

### Account Types
- **Company** (شركة) — Creates organization with company name, auto-assigned SUPER_ADMIN role
- **Individual** (فرد) — Creates personal workspace, can later join existing organizations via CR number lookup

### CR-Based Organization Discovery
Individual users can search for existing organizations by Commercial Registration (CR) number:
1. Enter 10-digit CR number → platform searches registered organizations
2. If found → see masked org name → submit join request → admin reviews
3. If not found → option to register that CR as a new business

### Token-Based Team Invitations
Admins invite team members via email with role assignment. Invitees receive a secure token link to create their account and join the organization directly.

### Onboarding Wizard
Post-registration, users complete an optional 4-step setup: organization path, business identity (CR/VAT/entity type), contact details, and team invitations. Every step is skippable.

---

## Data Protection & Compliance

Mimaric implements Saudi PDPL (Personal Data Protection Law) and NCA (National Cybersecurity Authority) requirements:

### PII Encryption at Rest
Sensitive personal data — national IDs, phone numbers, email addresses — is encrypted with **AES-256-GCM** before storage. SHA-256 hash columns enable exact-match search on encrypted fields without exposing plaintext.

### Role-Based Permissions
A centralized permission system with 30+ granular permissions controls access to every resource. PII access (`customers:read_pii`) is restricted to authorized roles only. Non-PII users receive pre-masked data from the server.

### PII Masking
Customer personal data is masked by default in the UI (`******6789`, `******4567`, `u***@example.com`). Authorized users can toggle visibility with a Show/Hide PII control. Server-side masking provides defense-in-depth.

### Audit Trail
Every data access, PII read, export, login, and modification is logged with user identity, role, IP address, and timestamp. A dedicated audit log viewer is available to administrators. `READ_PII` and `EXPORT` events are tracked separately per PDPL Article 32.

### Password Policy (NIST SP 800-63B)
- Minimum 10 characters (no arbitrary complexity rules)
- Common password blocklist
- Contextual rejection (no username/email in password)
- Progressive login rate limiting (30s → 5min → 15min lockout)
- Real-time bilingual strength feedback

---

## Roles & Access Control

| Role | Description | PII Access | Export | Finance | Audit |
|------|-------------|:----------:|:------:|:-------:|:-----:|
| **System Admin** | Full platform + all org access | Yes | Yes | Yes | Yes |
| **System Support** | Platform ops, ticket management | Yes | Yes | Yes | Yes |
| **Company Admin** | Full org control, no platform access | Yes | Yes | Yes | Yes |
| **Sales Manager** | CRM, contracts, reservations, customer PII | Yes | Yes | No | No |
| **Sales Agent** | CRM, reservations (no PII, no export) | No | No | No | No |
| **Project Manager** | Projects, units, site logs | No | No | No | No |
| **Property Manager** | Rentals, maintenance, tenant management | No | No | No | No |
| **Finance Officer** | Payments, reporting, financial data | No | No | Yes | No |
| **Technician** | Maintenance work orders only | No | No | No | No |
| **Engineering Consultant** | Wafi milestone certification | No | No | No | No |
| **Buyer** | Purchase tracking, documents | No | No | No | No |
| **Tenant** | Lease viewing, maintenance requests | No | No | No | No |
| **User** | Basic access, profile management | No | No | No | No |

13 roles with granular permission mapping. Sidebar navigation and data access are automatically filtered based on role permissions.

---

## Design System

### Glass Morphism Design System
Layered glass-effect UI with backdrop blur, semi-transparent backgrounds, and elevation shadows. Includes gradient mesh backgrounds for hero sections, glow accents (`--glow-green`, `--glow-gold`), and animations (`float`, `pulse-glow`, `gradient-shift`). Auth pages feature architectural SVG patterns with animated mesh blobs.

### Dark Mode / Light Mode
Full theme system with CSS custom properties and `.dark` class toggling. Sidebar stays dark navy in both themes. Charts, buttons, popovers, and all UI elements adapt with dedicated dark overrides.

### Color Palette
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| Primary | `#182840` | `hsl(214 32% 89%)` | Navigation, headings, primary text |
| Secondary | `#107840` | `hsl(148 67% 42%)` | CTA buttons, success states |
| Accent | `#D4AF37` | `#D4AF37` | Gold highlights, reserved/pending states |
| Info | `#3182CE` | `#3182CE` | Informational badges |
| Warning | `#DD6B20` | `#DD6B20` | Alerts, on-hold states |
| Destructive | `#E53E3E` | `#E53E3E` | Delete actions, errors |

### Button System
All buttons use visible backgrounds with hover lift effects (`-translate-y-0.5`) and shadow transitions:
- **Primary** — Navy in light mode, green in dark mode (CSS overrides for Tailwind v4 monorepo)
- **Secondary** — White/navy border in light, muted with green accent hover in dark
- **Ghost** — Subtle muted background
- Action buttons use color-coded hover accents: green for export/Excel, red for PDF/delete, amber for PII toggles

---

## Technical Architecture

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS v4, RTL-first |
| **Charts** | Recharts with foreignObject for Arabic SVG text |
| **Currency** | SAR formatting with Hala font |
| **Dates** | Hijri/Gregorian dual display |
| **Backend** | Next.js Server Actions (no REST API) |
| **ORM** | Prisma 7 with `@prisma/adapter-pg` |
| **Database** | Supabase PostgreSQL (connection pooler) |
| **Auth** | NextAuth.js v5 (JWT strategy, Credentials provider) |
| **Encryption** | AES-256-GCM (Node.js crypto), bcrypt (cost 12) |
| **File Storage** | Uploadthing |
| **Monorepo** | Turborepo with `@repo/ui`, `@repo/db`, shared configs |
| **CI/CD** | GitHub Actions (lint → type-check → build) |
| **Deployment** | Vercel-ready |

---

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example apps/web/.env

# Generate Prisma client
cd packages/db && npx prisma generate

# Push schema to database
npx prisma db push

# Seed the database
npx tsx prisma/seed.ts

# Start the development server
cd ../.. && npm run dev
```

Visit `http://localhost:3000` for the management dashboard.

### Required Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (Supabase pooler) |
| `AUTH_SECRET` | NextAuth.js session signing key |
| `AUTH_TRUST_HOST` | Set to `true` for local development |
| `PII_ENCRYPTION_KEY` | 32-byte hex string for AES-256-GCM PII encryption |
| `UPLOADTHING_SECRET` | File upload service credentials |

---

## Project Structure

```
mimaric/
├── apps/
│   └── web/                        # Next.js 16 application
│       ├── app/
│       │   ├── auth/               # Login, register, invitation acceptance
│       │   │   └── invite/         # Token-based team invitation flow
│       │   ├── landing/            # Marketing landing page (11 sections, bilingual)
│       │   ├── dashboard/          # All dashboard modules
│       │   │   ├── land/           # Land acquisition pipeline
│       │   │   ├── projects/       # Project & building management
│       │   │   ├── units/          # Unit matrix
│       │   │   ├── sales/          # CRM, contracts, reservations
│       │   │   ├── rentals/        # Lease management & payments
│       │   │   ├── planning/        # Planning OS — GIS, subdivision, scenarios
│       │   │   ├── maintenance/    # Work orders & preventive CMMS
│       │   │   ├── finance/        # Financial overview
│       │   │   ├── reports/        # Excel/PDF report generation
│       │   │   ├── help/           # Help center, tickets, admin panel
│       │   │   ├── billing/        # Subscription plans, invoices, payments
│       │   │   ├── admin/          # Platform admin: plans, subscriptions, coupons, payments
│       │   │   ├── onboarding/     # Post-registration setup wizard
│       │   │   └── settings/       # Team, security, audit logs
│       │   └── actions/            # Server actions (data layer)
│       │       ├── auth.ts         # Registration, login
│       │       ├── onboarding.ts   # Onboarding wizard + CR lookup
│       │       ├── invitations.ts  # Team invitation management
│       │       ├── join-requests.ts # CR-based org join requests
│       │       ├── support-tickets.ts # Help center tickets
│       │       └── permission-requests.ts # Role upgrade requests
│       ├── components/
│       │   ├── charts/             # Dashboard chart components + useChartTheme
│       │   ├── ProjectLifecycleStepper.tsx # 14-stage visual stepper (5 phase groups)
│       │   ├── LanguageProvider.tsx # Centralized bilingual context (AR/EN)
│       │   ├── ThemeProvider.tsx    # Dark/light mode provider
│       │   └── PasswordStrengthHint.tsx # Reusable password strength UI
│       └── lib/
│           ├── permissions.ts      # Role-based permission matrix
│           ├── encryption.ts       # AES-256-GCM encrypt/decrypt
│           ├── pii-masking.ts      # PII masking utilities
│           ├── pii-crypto.ts       # Customer/org PII crypto layer
│           ├── audit.ts            # Audit event logger
│           ├── hijri.ts            # Hijri/Gregorian date formatting
│           ├── export.ts           # Excel/PDF export utilities
│           ├── password-policy.ts  # NIST password validation
│           ├── create-notification.ts # Notification helper
│           └── help-content.ts     # FAQ and guides data
├── packages/
│   ├── db/                         # Prisma schema & seed data
│   └── ui/                         # Shared UI component library
│       └── src/
│           ├── components/
│           │   ├── Button.tsx       # Multi-variant button system
│           │   ├── Badge.tsx        # Status badge component
│           │   └── SARAmount.tsx    # SAR currency display
│           └── lib/
│               └── format-sar.ts   # SAR number formatting
└── turbo.json                      # Turborepo configuration
```

---

## Status

**v1.1.0** — Planning-to-execution lifecycle bridge: 14-stage project lifecycle stepper, project P&L financials tab, compliance-gated scenario approval, decision gate routing, post-handover maintenance automation. Full marketing landing page (11 sections, bilingual). Glass morphism design system with backdrop blur, elevation shadows, and gradient mesh backgrounds. Auth page redesign. E2E test suite for Planning OS. Document versioning and 4 new categories (GIS, CAD, Planning, Permit).

**v1.0.0** — SaaS commercialization: 3-tier subscription plans, coupon system, invoice management with VAT, platform admin panel. Centralized bilingual language system, user profile popover, help center (38 FAQs + 19 guides). Wafi compliance and escrow tracking. 13 user roles.

**v0.9.0** — Dark mode system, off-plan development (stages 7-12), cross-module awareness, analytics dashboards.

**v0.8.0** — Registration, organization management, onboarding wizard, help center, support tickets.

**v0.5.0–v0.7.0** — Core modules: land acquisition, CMMS maintenance, dashboard analytics, PDPL compliance, UI polish.

**Upcoming:** Ejar API integration, ZATCA e-invoicing, Buyer/Tenant portal, payment gateway (Mada/SADAD), mobile-responsive optimization.

---

> Built for the Saudi property management market. Compliant with RERA, ZATCA, Ejar, Balady, PDPL, and NCA standards.
