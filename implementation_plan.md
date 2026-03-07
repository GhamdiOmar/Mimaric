# Mimaric PropTech SaaS Implementation Plan

This plan outlines the transition to the **Mimaric** brand and the continued development of the Saudi-first PropTech platform. Phase 1 focuses on setting up the monorepo, authentication, multi-tenancy, and core project management features.

## Proposed Changes

### Project Foundation [NEW]
Set up the core monorepo structure using Turborepo to manage multiple applications and shared packages.

#### [NEW] [root](file:///Users/omar/AI%20Projects/Facility%20Management/)
- `apps/web`: Next.js 14 dashboard for developers and admins.
- `apps/portal`: Next.js 14 portal for buyers and tenants.
- `packages/db`: Prisma ORM with PostgreSQL schema.
- `packages/ui`: Shared component library using shadcn/ui and Radix UI.
- `packages/config`: Shared ESLint, Tailwind, and TypeScript configurations.
- `packages/types`: Shared TypeScript interface and type definitions.

### Design System Alignment [NEW]
Align the shared UI package with the official AntiGravity Frontend Guidelines.
- **Color Tokens**: Implement "Vision Navy", "Saudi Pulse Green", and "Horizon Gold" as CSS variables.
- **Typography**: Configure IBM Plex Arabic (primary) and DM Sans (Latin) with proper fallback weights.
- **Spacing & Radius**: Standardize on a 4px base unit and architectural border-radii (6px to 24px).
- **Icons**: Standardize on Phosphor Icons (outlined style).
- **RTL-First**: Enforce CSS logical properties and `tailwindcss-rtl` for all components.

### Authentication & Multi-Tenancy
Implement a secure, multi-tenant authentication system using NextAuth.js v5.

#### [NEW] [packages/db/prisma/schema.prisma](file:///Users/omar/AI%20Projects/Facility%20Management/packages/db/prisma/schema.prisma)
- Define `Organization`, `User`, `Project`, `Building`, `Unit`, `Role`, and `Permission` models.
- Implement Row-Level Security (RLS) policies for tenant isolation.

#### [NEW] [apps/web/auth.ts](file:///Users/omar/AI%20Projects/Facility%20Management/apps/web/auth.ts)
- Configure NextAuth.js v5 with credentials and OTP support.
- Handle Individual and Commercial Company registration flows.

### [Mimaric Rebranding]
Transition all UI elements to the Mimaric identity.
- **Visual Pattern**: Center the "PCB Circuit" theme in dashboards and KPI cards.
- **Logo Transition**: Replace "AntiGravity" with Mimaric wordmark (Logo Mark + MIMARIC).
- **Typography Integration**: Ensure **DM Sans** is used specifically for numbers, dates, and English labels.
#### [MODIFY] [globals.css](file:///Users/omar/AI%20Projects/Facility%20Management/packages/ui/src/globals.css)
- Update CSS variables with Mimaric palette (`#182840`, `#107840`, `#D4AF37`).
- Add **DM Sans** as primary English/Number font.
#### [MODIFY] [DashboardLayout](file:///Users/omar/AI%20Projects/Facility%20Management/apps/web/app/dashboard/layout.tsx)
- Replace "AntiGravity" wordmark with Mimaric logo/wordmark.
- Update sidebar active states to Mimaric green (`#107840`).
#### [MODIFY] [LoginPage](file:///Users/omar/AI%20Projects/Facility%20Management/apps/web/app/auth/login/page.tsx) / [RegisterPage](file:///Users/omar/AI%20Projects/Facility%20Management/apps/web/app/auth/register/page.tsx)
- Update naming and visual patterns to match new brand personality.
- Handle Individual and Commercial Company registration flows.

### [Phase 1: Organization & Team Management]
Implement the core tenant administration features.
#### [NEW] [Org Settings](file:///Users/omar/AI%20Projects/Facility%20Management/apps/web/app/dashboard/settings/page.tsx)
- Profile management for Developers/Commercial entities.
- Commercial Registration (CR) and VAT number verification fields.
#### [NEW] [Team Management](file:///Users/omar/AI%20Projects/Facility%20Management/apps/web/app/dashboard/settings/team/page.tsx)
- Invitation system for staff (Sales Agents, Managers, Technicians).
- Role assignment and status tracking (Invited, Active).

### [Phase 1: Project & Unit Registry]
Build the inventory foundation.
#### [NEW] [Project Creation](file:///Users/omar/AI%20Projects/Facility%20Management/apps/web/app/dashboard/projects/new/page.tsx)
- Multi-step flow for defining projects (Residential, Commercial, Mixed).
- Document vault foundation for project blueprints.
#### [MODIFY] [Unit Matrix](file:///Users/omar/AI%20Projects/Facility%20Management/apps/web/app/dashboard/units/page.tsx)
- Enhance the matrix with Mimaric "Building + PCB" visual theme.
- Add bulk unit configuration tools.
d pill badges (Available, Reserved, Sold, etc.).

### Core Project Management & UI
Build the essential modules and high-polish screens.
- **Authentication Screens**: Split-screen design with brand visual panel and multi-step registration (Individual vs Company).
- **Dashboard Layout**: Fixed root sidebar with Lucide/Phosphor icons and topbar breadcrumbs.
- **Project Registry**: Unit matrix with status-colored pill badges (Available, Reserved, Sold, etc.).

---

---

## Phase 3: Rental & Leasing [DONE]

### Tenancy Agreement Builder
Implement a compliant leasing module for residential and commercial units.
- **Templates**: Standardized Ejar-aligned tenancy contracts.
- **Lease Model**: Link `Lease` to `Tenant` (User/Org), `Unit`, and `PaymentSchedule`.
- **Status Workflow**: Draft -> Pending Signatures -> Active -> Expired/Terminated.

### Ejar Integration (KSA Compliance)
Foundational work for Ejar API connectivity.
- **Schema Mapping**: Map internal unit/tenant data to Ejar XML/JSON requirements.
- **Unified Dashboard**: View Ejar contract status directly within AntiGravity.

### Rent Collection & Invoicing
Manage the financial lifecycle of a lease.
- **Payment Schedules**: Automatic generation of payment milestones (monthly, quarterly, annually).
- **ZATCA Phase 1**: Basic PDF invoice generation compliant with Saudi tax laws.
- **Tracking**: Dashboard for Overdue, Paid, and Upcoming installments.

### Tenant Portal UI
Start building the experience for the end-user (Portal App).
- **Lease Overview**: View active contracts and payment history.
- **Service Requests**: Integrated maintenance ticketing for tenants.

---

## Recent Major Updates [DONE]
### Lead & Customer Unification
Unify the data model to treat prospective leads and finalized buyers/tenants as a single entity.
- Rename `Lead` to `Customer` in Prisma schema.
- Update sidebar navigation from Sales > Leads to Sales > Customers.
- Implement "Add Customer" modal functionality in the Rentals flow.

---

## Data Export & Reporting [UPCOMING]
### Universal Export Functionality
Implement a fully localized system to export application data while strictly adhering to Mimaric's brand identity.
- **Excel Export**: Export data tables (customers, units, properties, finance) as structured `.xlsx` files.
- **PDF Reports**: Generate highly polished PDF reports containing the Mimaric logo, brand colors, and typography.
- **Bilingual Support**: Fully support both Arabic (RTL) and English (LTR) generation.
- **RTL Compliance**: Ensure layout, text alignment, and tables correctly mirror for Arabic in generated PDFs.

---

## Technical Debt & Maintenance [FIXED]
- **Tailwind v4 Migration**: Successfully migrated to Tailwind CSS v4 with `@theme` variables.
- **Monorepo Resolution**: Optimized `@repo/ui` exports to prevent subpath resolution errors.
- **Build Optimization**: Switched to `@tailwindcss/postcss` for Turbopack stability.

## Verification Plan

### Automated Tests
- **Database Schema**: Run `npx prisma validate` after Phase 2 model additions.
- **Sales Logic**: Test reservation expiry and unit status transitions.

### Manual Verification
- **Lead Creation**: Manually enter leads and verify status transitions.
- **Reservation Flow**: Test reserving a unit and ensuring it reflects across the dashboard.

### Manual Verification
- **Project Setup**: Verify that `npm install` and `npm run dev` work correctly in the monorepo.
- **Registration Flow**: Test the Individual and Commercial Company registration forms manually.
- **Dashboard Navigation**: Ensure the dashboard layout is responsive and supports RTL (Arabic).
- **Project Creation**: Manually create a test project, building, and units to verify the registry logic.
