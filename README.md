# Mimaric — Saudi-First Property Management Platform

**Mimaric** is an integrated PropTech platform built for Saudi real estate developers and property management companies. It covers the full property lifecycle — from project planning to sales, leasing, maintenance, and financial reporting — with native compliance for Saudi regulations (RERA, ZATCA, Ejar) and data protection laws (PDPL, NCA).

---

## Key Capabilities

| Module | What It Does |
|--------|-------------|
| **Projects** | Create and manage development projects with type, status, location, and progress tracking |
| **Unit Matrix** | Track units across buildings — area, price, type, availability — with bulk editing |
| **Customer CRM** | Unified customer database with Kanban pipeline (New → Interested → Reserved → Converted) and list view |
| **Reservations** | Temporary unit holds linked to customers with expiry management |
| **Contracts** | Sale and lease contract generation with bilingual templates, status tracking, and document uploads |
| **Rentals** | Full tenancy lifecycle — lease creation, installment schedules, Ejar integration readiness |
| **Finance** | Payment tracking, installment schedules, VAT calculation (ZATCA-compliant) |
| **Maintenance** | Work order management with status badges and technician assignment |
| **Documents** | Centralized document storage per project and customer |
| **Reports** | Downloadable report cards for portfolio analytics |
| **Settings** | Organization setup, team management, user preferences, security, and audit logs |

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
| **Frontend** | Next.js 16, React 19, Tailwind CSS, RTL-first (Arabic/English) |
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
│   └── web/                    # Next.js 16 application
│       ├── app/
│       │   ├── auth/           # Login, register, password recovery
│       │   ├── dashboard/      # All dashboard modules
│       │   └── actions/        # Server actions (customers, contracts, etc.)
│       ├── lib/
│       │   ├── permissions.ts  # Role-based permission matrix
│       │   ├── encryption.ts   # AES-256-GCM encrypt/decrypt
│       │   ├── pii-masking.ts  # PII masking utilities
│       │   ├── pii-crypto.ts   # Customer/org PII crypto layer
│       │   ├── audit.ts        # Audit event logger
│       │   └── password-policy.ts  # NIST password validation
│       └── components/         # Shared React components
├── packages/
│   ├── db/                     # Prisma schema, migrations, seed
│   └── ui/                     # Shared UI component library
└── turbo.json                  # Turborepo configuration
```

---

## Status

**Active Development** — Core modules, PDPL compliance layer, and NIST password policy are operational. Advanced analytics, Ejar API integration, ZATCA e-invoicing, and the Buyer/Tenant portal are in progress.

---

> Built for the Saudi property management market. Compliant with RERA, ZATCA, Ejar, PDPL, and NCA standards.
