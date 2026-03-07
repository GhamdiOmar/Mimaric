# Mimaric — Real Estate & Facility Management Platform

**Mimaric** is an integrated digital platform purpose-built for Saudi real estate developers and property management companies. It streamlines the full lifecycle of residential and commercial properties — from project inception to contract execution, tenant management, and financial reporting.

---

## 🎯 Business Goals

### 1. Accelerate the Sales Cycle
Mimaric gives sales teams a real-time CRM view of every prospective customer — from first inquiry to signed contract. Leads are tracked through a visual Kanban pipeline (New → Interested → Reserved → Converted), reducing missed opportunities and manual follow-up overhead.

### 2. Centralize Property Inventory
All units across every project and building are managed in a single **Unit Matrix** — with live status tracking (Available, Reserved, Sold, Rented). Decision-makers get instant visibility into inventory without relying on spreadsheets or disconnected systems.

### 3. Automate Contract & Lease Workflows
The platform guides agents through a structured wizard to create sale contracts and tenancy agreements (RERA-compliant), generate installment schedules, and track signature status — eliminating paper-based processes and reducing legal risk.

### 4. Unify Customer Data Across the Business
A single **Customer record** serves all departments: sales teams see the CRM journey, finance teams see payment history, and property managers see lease status — all for the same person, with no data duplication.

### 5. Improve Financial Visibility
Rent installment tracking, VAT calculation (ZATCA-compliant), and payment status dashboards give finance officers a live view of receivables — replacing manual Excel tracking.

### 6. Support Multi-Project Organizations
Mimaric is built for organizations managing multiple projects simultaneously. Each project has its own buildings, units, and teams, while leadership sees consolidated analytics across the entire portfolio.

---

## 🏗️ What the System Does

| Module | Capability |
|--------|-----------|
| **Projects** | Create and manage real estate development projects with type, status, and location |
| **Units** | Track individual units across buildings — area, price, type, and availability |
| **Customers (CRM)** | Unified customer database used across sales, contracts, and rentals |
| **Sales Pipeline** | Kanban board to manage the customer journey from inquiry to conversion |
| **Reservations** | Temporary unit holds linked to customers with expiry management |
| **Contracts** | Sale and lease contract generation with status tracking and file uploads |
| **Rentals** | Full tenancy lifecycle — contract creation, installments, and Ejar integration readiness |
| **Finance** | Payment tracking, installment schedules, VAT application |
| **Maintenance** | Work order management for facilities teams |
| **Documents** | Centralized document storage per project and customer |
| **Settings** | Organization setup, team roles, and permissions |

---

## 🔐 Roles & Access

The platform supports granular role-based access:

- **Dev Admin** — Full system access
- **Project Manager** — Manages projects and units
- **Sales Manager / Agent** — CRM, reservations, and contracts
- **Property Manager** — Rentals and maintenance
- **Finance Officer** — Payments and reporting
- **Buyer / Tenant** — Customer portal access (Owner Portal app)

---

## 🧱 Technical Architecture

Built as a modern monorepo for speed, scalability, and maintainability:

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React, Tailwind CSS, RTL-first (Arabic/English) |
| **Backend** | Next.js Server Actions, Prisma ORM |
| **Database** | Supabase (PostgreSQL) with Row-Level Security |
| **Auth** | NextAuth.js with Supabase adapter |
| **File Storage** | Uploadthing |
| **Monorepo** | Turborepo with shared `@repo/ui`, `@repo/db`, and config packages |
| **Deployment** | Vercel-ready |

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example apps/web/.env

# Generate Prisma client
cd packages/db && npx prisma generate

# Start the development server
npm run dev
```

Visit `http://localhost:3000` for the management dashboard.

---

## 📌 Status

**Active Development** — Core modules are operational. Advanced analytics, Ejar integration, and the Buyer/Tenant portal are in progress.

---

> Built for the Saudi real estate market. Compliant with RERA, ZATCA, and Ejar standards.
