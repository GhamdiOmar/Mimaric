# Mimaric — Saudi-First Property Management Platform

**Mimaric** (ميماريك) is an integrated PropTech platform built for Saudi real estate developers and property management companies. It covers the full property lifecycle — from land acquisition and project planning to sales, leasing, maintenance, and financial reporting — with native compliance for Saudi regulations (RERA, ZATCA, Ejar) and data protection laws (PDPL, NCA).

---

## Key Capabilities

| Module | What It Does |
|--------|-------------|
| **Dashboard** | Real-time analytics with occupancy rates, land pipeline, project status, and maintenance cost trend charts |
| **Land Acquisition** | End-to-end pipeline: Identify → Review → Acquire → Convert to Project, with due diligence checklists |
| **Projects** | Create and manage development projects with type, status, location, building management, and Balady document uploads |
| **Unit Matrix** | Track units across buildings — area, price, type, availability — with bulk editing and SAR currency display |
| **Customer CRM** | Unified customer database with Kanban pipeline (New → Interested → Qualified → Viewing → Reserved) and list view |
| **Reservations** | Temporary unit holds linked to customers with expiry management |
| **Contracts** | Sale and lease contract generation with bilingual templates, status tracking, and document uploads |
| **Rentals** | Full tenancy lifecycle — lease creation, installment schedules, Ejar integration readiness |
| **Finance** | Payment tracking, installment schedules, VAT calculation (ZATCA-compliant) |
| **Maintenance** | Work order management with status transitions, technician assignment, and cost tracking |
| **Preventive Maintenance** | CMMS scheduling with frequency-based plans, auto work-order generation, and category tagging |
| **Reports** | Excel/PDF export for occupancy, financial, maintenance, lease, and customer reports with date range filtering |
| **Site Logs** | Construction progress tracking per project with timestamped entries |
| **Notifications** | In-app notification bell with unread counts and mark-all-read |
| **Settings** | Organization setup, team management, user preferences, security, and audit logs |

---

## Business Value

Mimaric solves key challenges for Saudi property developers:

- **Unified Operations** — One platform replaces disconnected spreadsheets, WhatsApp groups, and paper-based workflows across sales, leasing, maintenance, and finance
- **Saudi Regulatory Compliance** — Built-in alignment with RERA (real estate regulation), ZATCA (tax authority), Ejar (rental platform), and Balady (municipal permits)
- **Data Protection by Design** — PDPL and NCA compliance baked into the architecture, not bolted on — PII encryption, role-based access, and audit trails are core infrastructure
- **Bilingual RTL-First** — Full Arabic/English support with right-to-left layout, Hijri/Gregorian dual dates, and SAR currency formatting
- **Decision Intelligence** — Real-time dashboards with pipeline visualization, cost trends, and occupancy analytics to drive data-informed decisions

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

### NIST SP 800-63B Password Policy
- Minimum 15 characters (no arbitrary complexity rules)
- 10,000-entry common password blocklist
- Contextual rejection (no username/email in password)
- Progressive login rate limiting (30s → 5min → 15min lockout)
- Real-time bilingual strength feedback

---

## Design System

Mimaric uses a purpose-built design system optimized for Arabic RTL layouts:

### Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#182840` | Navigation, headings, primary actions |
| Secondary | `#107840` | Success states, CTA buttons, positive indicators |
| Accent | `#D4AF37` | Gold highlights, reserved/pending states |
| Info | `#3182CE` | Informational badges, early-stage pipeline |
| Warning | `#DD6B20` | Alerts, on-hold states |
| Destructive | `#E53E3E` | Delete actions, errors, cancellations |

### Button Variants
All buttons have visible backgrounds, hover lift effects (`-translate-y-0.5`), and shadow transitions:
- **Primary** — Navy background, white text, shadow lift on hover
- **Secondary** — White with navy border, tints on hover
- **Success** — Green background for positive CTAs
- **Danger** — Red background for destructive actions
- **Ghost** — Subtle muted background, darkens on hover

Action buttons use color-coded hover accents: green for export/Excel, red for PDF/delete, amber for PII toggles.

---

## Roles & Access Control

| Role | Description | PII Access | Export | Finance | Audit |
|------|-------------|:----------:|:------:|:-------:|:-----:|
| **Super Admin** | Full system access | Yes | Yes | Yes | Yes |
| **Dev Admin** | Full system access | Yes | Yes | Yes | Yes |
| **Sales Manager** | CRM, contracts, reservations | Yes | Yes | No | No |
| **Sales Agent** | CRM, reservations | No | No | No | No |
| **Project Manager** | Projects, units | No | No | No | No |
| **Property Manager** | Rentals, maintenance | No | No | No | No |
| **Finance Officer** | Payments, reporting | No | No | Yes | No |
| **Technician** | Maintenance requests | No | No | No | No |

Sidebar navigation is automatically filtered based on role permissions.

---

## Technical Architecture

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS v4, RTL-first (Arabic/English) |
| **Charts** | Recharts with foreignObject for Arabic SVG text rendering |
| **Currency** | SAR formatting with Hala font and bilingual display |
| **Dates** | Hijri/Gregorian dual date display across all modules |
| **Backend** | Next.js Server Actions, Prisma ORM v7 |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | NextAuth.js v5 (JWT strategy, Credentials provider) |
| **Encryption** | AES-256-GCM (Node.js crypto), bcrypt (cost 12) |
| **File Storage** | Uploadthing |
| **Monorepo** | Turborepo with `@repo/ui`, `@repo/db`, and shared config packages |
| **CI/CD** | GitHub Actions (lint → type-check → build → Playwright tests) |
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
npx prisma db seed

# Start the development server
cd ../.. && npm run dev
```

Visit `http://localhost:3000` for the management dashboard.

### Required Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | NextAuth.js session signing key |
| `AUTH_TRUST_HOST` | Set to `true` for local development |
| `PII_ENCRYPTION_KEY` | 32-byte hex string for AES-256-GCM PII encryption |

---

## Project Structure

```
mimaric/
├── apps/
│   └── web/                        # Next.js 16 application
│       ├── app/
│       │   ├── auth/               # Login, register, password recovery
│       │   ├── dashboard/          # All dashboard modules
│       │   │   ├── land/           # Land acquisition pipeline
│       │   │   ├── projects/       # Project & building management
│       │   │   ├── units/          # Unit matrix
│       │   │   ├── sales/          # CRM, contracts, reservations
│       │   │   ├── rentals/        # Lease management & payments
│       │   │   ├── maintenance/    # Work orders & preventive CMMS
│       │   │   ├── finance/        # Financial overview
│       │   │   ├── reports/        # Excel/PDF report generation
│       │   │   └── settings/       # Team, security, audit logs
│       │   └── actions/            # Server actions (data layer)
│       ├── components/
│       │   └── charts/             # Dashboard chart components
│       └── lib/
│           ├── permissions.ts      # Role-based permission matrix
│           ├── encryption.ts       # AES-256-GCM encrypt/decrypt
│           ├── pii-masking.ts      # PII masking utilities
│           ├── pii-crypto.ts       # Customer/org PII crypto layer
│           ├── audit.ts            # Audit event logger
│           ├── hijri.ts            # Hijri/Gregorian date formatting
│           ├── export.ts           # Excel/PDF export utilities
│           └── password-policy.ts  # NIST password validation
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

**v0.5.0** — All core modules operational including land acquisition, preventive maintenance (CMMS), dashboard analytics, reporting, and full UI polish. PDPL compliance layer and NIST password policy are production-ready.

**Upcoming:** Ejar API integration, ZATCA e-invoicing, Buyer/Tenant portal, advanced analytics, and mobile-responsive optimization.

---

> Built for the Saudi property management market. Compliant with RERA, ZATCA, Ejar, PDPL, and NCA standards.
