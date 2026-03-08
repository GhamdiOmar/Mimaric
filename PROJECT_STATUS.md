# Mimaric PropTech — Project Status

> Last updated: 2026-03-08

## Brand Identity
- **App Name**: Mimaric
- **Logo**: `Mimaric Official Logo.png` (root) → copied to `public/assets/brand/logo.png`
- **Colors**: Navy `#0A1628`, Green `#107840`, Gold `#C8A951`
- **Typography**: IBM Plex Arabic (primary), DM Sans (latin)
- **Theme**: PCB Circuit geometric patterns

## Tech Stack
| Layer | Technology | Status |
|-------|------------|--------|
| Framework | Next.js 16 + Turbopack | ✅ |
| Auth | NextAuth.js v5 (JWT + Credentials) | ✅ |
| ORM | Prisma 7 | ✅ |
| Database | Supabase PostgreSQL | ✅ |
| Logic | Next.js Server Actions | ✅ |
| Styling | Tailwind CSS v4 | ✅ |
| Icons | Phosphor Icons | ✅ |
| UI Kit | shadcn/ui (`@repo/ui`) | ✅ |
| Monorepo | Turborepo | ✅ |

## Test Credentials
- **Email**: `admin@mimaric.sa`
- **Password**: `mimaric2026`

---

## Pages Implemented

### Auth
| Page | Route | Status |
|------|-------|--------|
| Login | `/auth/login` | ✅ Complete |
| Register | `/auth/register` | ✅ Complete |
| Invitation Acceptance | `/auth/invite/[token]` | ✅ Complete |

### Dashboard
| Page | Route | Status |
|------|-------|--------|
| Overview (KPIs) | `/dashboard` | ✅ Complete |
| Projects | `/dashboard/projects` | ✅ Complete |
| New Project Wizard | `/dashboard/projects/new` | ✅ Complete |
| Unit Matrix | `/dashboard/units` | ✅ Complete |
| Sales Hub | `/dashboard/sales` | ✅ Complete |
| Customer Management (Kanban) | `/dashboard/sales/customers` | ✅ Complete |
| Reservation Flow | `/dashboard/sales/reservations/new` | ✅ Complete |
| Contract Template | `/dashboard/sales/contracts/[id]` | ✅ Complete |
| Rentals Hub | `/dashboard/rentals` | ✅ Complete |
| New Lease Wizard | `/dashboard/rentals/new` | ✅ Complete |
| Rent Collection | `/dashboard/rentals/payments` | ✅ Complete |
| Finance | `/dashboard/finance` | ✅ Complete |
| Maintenance | `/dashboard/maintenance` | ✅ Complete |
| Reports | `/dashboard/reports` | ✅ Complete |
| Help Center | `/dashboard/help` | ✅ Complete |
| Ticket Detail | `/dashboard/help/tickets/[id]` | ✅ Complete |
| Onboarding Wizard | `/dashboard/onboarding` | ✅ Complete |
| Org Settings | `/dashboard/settings` | ✅ Complete |
| Team Management | `/dashboard/settings/team` | ✅ Complete |
| Document Vault | `/dashboard/documents` | ✅ Complete |

### Shared Components
| Component | Path | Purpose |
|-----------|------|---------|
| MimaricLogo | `components/brand/MimaricLogo.tsx` | Brand logo with dark/light variants |
| Dashboard Layout | `app/dashboard/layout.tsx` | Sidebar + topbar shell |
| globals.css | `packages/ui/src/globals.css` | Design tokens & base styles |

---

## Phase Completion

### Phase 1 — Foundation ✅
- [x] Project scaffolding (monorepo, Next.js, Prisma)
- [x] Auth system (login/register pages, NextAuth config)
- [x] Dashboard layout with sidebar navigation
- [x] Multi-tenant RLS migration script
- [x] Organization profile (CR/VAT fields)
- [x] Team management UI (invitations, roles)
- [x] Project creation flow (step-by-step wizard)
- [x] Building & tower management
- [x] Advanced unit matrix (mass editing)
- [x] Document vault for blueprints

### Phase 2 — Sales Engine ✅
- [x] CRM / Customer management (Kanban + list views)
- [x] Unit availability board
- [x] Reservation flow (4-step wizard)
- [x] Sales contract template (bilingual, signature slots)

### Phase 3 — Rental Management ✅
- [x] Lease creation wizard (4-step)
- [x] Rent collection & payment tracking
- [x] Rental hub navigation

### Phase 4 — Operations ✅
- [x] Finance dashboard with KPIs
- [x] Maintenance request management
- [x] Reports & analytics hub
- [x] ZATCA e-invoicing placeholder

### Mimaric Rebranding ✅
- [x] All pages updated from "AntiGravity" → "Mimaric"
- [x] Logo integrated across login, register, dashboard, contracts
- [x] Color tokens set in globals.css
- [x] Typography configured (IBM Plex Arabic, DM Sans)
- [x] Zero remaining "AntiGravity" references

### Phase 5 — Registration & Org Management ✅
- [x] Individual/Company registration with accountType toggle
- [x] Auto-login after registration
- [x] SUPER_ADMIN role for org creators
- [x] 4-step onboarding wizard (skippable)
- [x] CR-based organization discovery
- [x] Join request system with admin review
- [x] Token-based team invitations
- [x] Invitation acceptance page
- [x] Help center with FAQ, guides, support tickets
- [x] Permission request workflow
- [x] Password reveal toggle on auth pages
- [x] Password policy updated to 10-char minimum

---

## Known Issues
- Some Tailwind v4 CSS rules (`@theme`, `@apply`) flagged by IDE (works at runtime)

## Next Steps
- [x] Implement Real Authentication (Bcrypt + Prisma)
- [x] Create CRUD Server Actions (Projects, Customers, Units)
- [x] Connect to Supabase PostgreSQL
- [x] Registration & Organization Management
- [ ] Team settings: email-based invitation UI (replace password-based)
- [ ] ZATCA Phase 2 API integration
- [ ] Ejar platform integration
- [ ] Payment gateway (Mada/SADAD)
- [ ] Buyer/Tenant portal
- [ ] Mobile responsive polish pass
