# Off-Plan Development — Pending Work

**Last updated**: 2026-03-09
**Overall progress**: ~75% of 12-stage lifecycle complete

---

## Phase 3 — Remaining (Current Sprint)

### 3A. Modals for Project Detail Page
**File**: `apps/web/app/dashboard/projects/[id]/page.tsx`

4 creation modals need to be added at the bottom of the file (same pattern as existing `ConceptPlanModal`, `SubdivisionPlanModal`, `ApprovalSubmissionModal`):

| Modal | Fields | Server Action |
|-------|--------|---------------|
| `InfrastructureModal` | category (select from 10 enum values), contractor, estimatedCostSar, targetDate, notes, wave | `createInfrastructureItem()` |
| `InventoryModal` | itemNumber, productType (select from 7 enum values), productLabel, areaSqm, basePriceSar, releasePhase, channel | `createInventoryItem()` |
| `PricingRuleModal` | name, nameArabic, type (select from 8 enum values), factor, fixedAmountSar, priority | `createPricingRule()` |
| `LaunchWaveModal` | name, nameArabic, plannedDate, inventoryCount, notes | `createLaunchWave()` |

### 3B. Build Verification
- Run `npx turbo build --filter=@repo/web` and fix any TypeScript errors
- Verify all new Phosphor icon imports exist (`HardHat`, `Package`, `CurrencyDollar`, `Rocket`, `Lightning`, `Drop`, `WifiHigh`, `Broadcast`, `Car`, `CloudRain`, `Tree`, `Wall`, `SignIn`, `Lamp`, `ToggleRight`, `Play`, `Stop`)

### 3C. Database Push
- Run `prisma db push` to sync schema (models were added but may not be pushed yet)

---

## Phase 4 — Launch Readiness, Sales Enablement & Analytics

**BRD Stages**: 11 (Launch Readiness), 12 (Off-Plan Launch)

### 4A. Server Actions

| File | Functions | Description |
|------|-----------|-------------|
| `actions/launch.ts` | `getLaunchReadinessChecklist()` | Check all prerequisites: approved subdivision, approved approvals, infra score >= threshold, inventory created, pricing applied, wave planned |
| | `validateLaunchReadiness()` | Returns pass/fail per prerequisite with blocking reasons |
| | `getMapInventory()` | Get all inventory items with plot coordinates for map display |
| | `reserveInventoryItem()` | Create reservation linked to inventory item (bridges off-plan to existing reservation flow) |
| | `getSalesTracking()` | Sales dashboard: reserved/sold/available per wave |
| `actions/analytics.ts` | `getDevelopmentPipeline()` | All projects by off-plan stage with counts |
| | `getApprovalAnalytics()` | Approval success rates, avg processing time, pending items |
| | `getPricingAnalytics()` | Avg price/sqm by product type, block, phase |
| | `getWavePerformance()` | Per-wave: inventory released, reserved, sold, revenue |

### 4B. UI Pages

| Route | Description | Key Components |
|-------|-------------|----------------|
| Add tab: "Launch Readiness" in project detail | Checklist with pass/fail badges per prerequisite | Green/red status indicators, link to fix blocking items |
| Add tab: "Launch Map" in project detail | Interactive inventory grid showing plots by block | Color-coded by status (available=green, reserved=amber, sold=blue), click to reserve |
| Add tab: "Analytics" in project detail | Sales performance charts | Wave bar chart, pricing scatter plot, conversion funnel |

### 4C. Modify Existing Pages

| Page | Changes |
|------|---------|
| `/dashboard/sales/reservations/new` | Add "From Inventory" flow alongside existing "From Unit" flow; dropdown to select inventory item by project/wave |
| `/dashboard/page.tsx` (main dashboard) | Add off-plan KPI cards: active launches, total inventory, conversion rate, pipeline value |
| `/dashboard/reports` | Add 3 new report types: Development Pipeline, Approval Status, Pricing Analysis |

### 4D. Seed Data
- Add launch readiness test data for Dummy Org projects
- Create sample analytics data for dashboard demo

---

## Deferred / Future Enhancements

These items are noted in the BRD but not critical for MVP:

| Item | BRD Ref | Notes |
|------|---------|-------|
| GIS Layer Management | FR-02 | PostGIS geometry columns, Supabase spatial API, tile servers |
| Spatial Overlays & Analysis | FR-03 | ST_Contains/ST_Intersects, buffer analysis, heatmaps |
| Automated Spatial Validation | Stage 6 | Rule engine for compliance checks against spatial data |
| Document Version History UI | FR-05 | Model exists (DocumentVersion), needs UI in documents tab |
| Interactive Map Inventory View | FR-11 | Leaflet/Mapbox integration showing plot boundaries color-coded by status |
| Advanced Pricing Preview | FR-10 | Real-time price preview when creating/editing inventory items |
| Audit Trail for Off-Plan Actions | FR-13 | `logAuditEvent()` exists but not called from Phase 2-3 server actions |
| Notifications for Stage Transitions | — | Create notifications when decision gates are approved/rejected |
| Export/PDF for Reports | — | Generate PDF reports for development pipeline, pricing analysis |

---

## Files Created (Phases 1-3)

### Server Actions (10 files)
```
apps/web/app/actions/constraints.ts       ✅ Phase 1
apps/web/app/actions/feasibility.ts       ✅ Phase 1
apps/web/app/actions/decision-gates.ts    ✅ Phase 1
apps/web/app/actions/concept-plans.ts     ✅ Phase 2
apps/web/app/actions/subdivision.ts       ✅ Phase 2
apps/web/app/actions/approvals.ts         ✅ Phase 2
apps/web/app/actions/infrastructure.ts    ✅ Phase 3
apps/web/app/actions/inventory.ts         ✅ Phase 3
apps/web/app/actions/pricing.ts           ✅ Phase 3
apps/web/app/actions/launch-waves.ts      ✅ Phase 3
```

### UI Pages (2 files created, 4 modified)
```
apps/web/app/dashboard/projects/[id]/subdivision/[planId]/page.tsx  ✅ Phase 2 (new)
apps/web/app/dashboard/land/[id]/page.tsx                          ✅ Phase 1 (modified - 4 tabs)
apps/web/app/dashboard/land/page.tsx                               ✅ Phase 1 (modified - score column)
apps/web/app/dashboard/projects/[id]/page.tsx                      ✅ Phase 2+3 (modified - 7 new tabs)
```

### Schema & Config (3 modified)
```
packages/db/prisma/schema.prisma    ✅ Phase 1 (17 new models, 8 new enum values)
apps/web/lib/permissions.ts         ✅ Phase 1 (22 new permission types)
packages/db/prisma/seed.ts          ✅ Phase 1 (dummy data)
```

---

## Quick Reference: Off-Plan Status Flow

```
RAW_LAND → LAND_IDENTIFIED → LAND_UNDER_REVIEW → LAND_ACQUIRED
  → CONCEPT_DESIGN → SUBDIVISION_PLANNING → AUTHORITY_SUBMISSION
  → INFRASTRUCTURE_PLANNING → INVENTORY_STRUCTURING → PRICING_PACKAGING
  → LAUNCH_READINESS → OFF_PLAN_LAUNCHED
```

Each transition requires a DecisionGate approval (COMPANY_ADMIN only).
