/**
 * E2E Business Process Seed Script
 * Follows the 17-phase Mimaric lifecycle from Land Identification to Handover.
 *
 * Usage: DATABASE_URL="..." npx tsx scripts/e2e-seed.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

const ORG_ID = "mimaric-main";
const ADMIN_ID = "cmmiisj5d0001popkouzgv37j"; // admin@mimaric.sa
const PM_ID = "cmmiisno00006popkbnc8q9zm"; // pm@mimaric.sa
const SALES_MGR_ID = "cmmiisoj00007popkg9btpqw6"; // sales_mgr@mimaric.sa
const FINANCE_ID = "cmmiisl7m0003popk6ftgxuet"; // fatima@mimaric.sa

async function main() {
  console.log("=== Mimaric E2E Business Process Simulation ===\n");

  // ─── PHASE 1: Land Opportunity Identification ─────────────────────────
  console.log("P1: Creating land record — أرض حي الملقا ...");
  const land = await db.project.create({
    data: {
      name: "أرض حي الملقا - شمال الرياض",
      description:
        "قطعة أرض سكنية في حي الملقا شمال الرياض، مساحة 50,000 متر مربع، مناسبة لمشروع سكني متكامل",
      type: "RESIDENTIAL",
      status: "LAND_IDENTIFIED",
      organizationId: ORG_ID,
      // Balady-aligned fields
      parcelNumber: "3201-7845",
      deedNumber: "410178523",
      landUse: "RESIDENTIAL_LAND",
      totalAreaSqm: 50000,
      region: "الرياض",
      city: "الرياض",
      district: "الملقا",
      streetName: "طريق الملك فهد الفرعي",
      postalCode: "13524",
      latitude: 24.7836,
      longitude: 46.6531,
      estimatedValueSar: 45000000,
    },
  });
  console.log(`  ✓ Land created: ${land.id}\n`);

  // ─── PHASE 2: Due Diligence ───────────────────────────────────────────
  console.log("P2: Adding due diligence data ...");
  const ddCategories = [
    {
      category: "LEGAL",
      items: [
        { label: "Title Deed Verification", checked: true, notes: "Deed verified with MOJ. Clear title, no liens." },
        { label: "Zoning Compliance", checked: true, notes: "Zoned residential R3 — allows multi-story up to 20m height." },
        { label: "Lien/Encumbrance Check", checked: true, notes: "No liens or claims registered." },
      ],
    },
    {
      category: "VALUATION",
      items: [
        { label: "Market Valuation", checked: true, notes: "Appraised at SAR 45M. Comparable sales support asking price." },
        { label: "Revenue Potential Analysis", checked: true, notes: "Estimated SAR 180M in sales revenue." },
      ],
    },
    {
      category: "ENVIRONMENTAL",
      items: [
        { label: "Environmental Assessment", checked: true, notes: "No contamination found. Soil bearing capacity adequate." },
        { label: "Flood Risk Assessment", checked: true, notes: "Site is not in a flood zone." },
      ],
    },
    {
      category: "UTILITY",
      items: [
        { label: "Water Access", checked: true, notes: "Municipal water within 200m." },
        { label: "Electricity Access", checked: true, notes: "SEC transformer within 150m." },
        { label: "Sewage Connection", checked: true, notes: "Main sewer line adjacent to parcel." },
      ],
    },
  ];
  const ddRecords = [];
  for (const dd of ddCategories) {
    const rec = await db.dueDiligence.create({
      data: {
        projectId: land.id,
        organizationId: ORG_ID,
        category: dd.category,
        items: dd.items,
        completedAt: new Date(),
      },
    });
    ddRecords.push(rec);
  }
  console.log(`  ✓ ${ddRecords.length} due diligence categories completed\n`);

  // ─── PHASE 3-5: Planning Workspace + Scenario ─────────────────────────
  console.log("P3: Creating planning workspace ...");
  const workspace = await db.planningWorkspace.create({
    data: {
      name: `${land.name} - Planning`,
      nameArabic: "أرض حي الملقا - التخطيط",
      description: "مساحة العمل التخطيطية لمشروع الملقا السكني",
      status: "ACTIVE",
      landRecordId: land.id,
      organizationId: ORG_ID,
      createdBy: PM_ID,
      siteMetadata: {
        totalAreaSqm: 50000,
        region: "الرياض",
        city: "الرياض",
        district: "الملقا",
        latitude: 24.7836,
        longitude: 46.6531,
        landUse: "RESIDENTIAL_LAND",
      },
    },
  });
  console.log(`  ✓ Workspace created: ${workspace.id}`);

  console.log("P4: Creating subdivision plan ...");
  const subdivisionPlan = await db.subdivisionPlan.create({
    data: {
      name: "الملقا - مخطط التقسيم الرئيسي",
      totalAreaSqm: 50000,
      numberOfPlots: 45,
      workspaceId: workspace.id,
      organizationId: ORG_ID,
    },
  });

  // Create blocks
  const blockA = await db.block.create({
    data: {
      name: "Block A - فلل",
      subdivisionPlanId: subdivisionPlan.id,
      plotCount: 20,
      areaSqm: 20000,
    },
  });
  const blockB = await db.block.create({
    data: {
      name: "Block B - شقق",
      subdivisionPlanId: subdivisionPlan.id,
      plotCount: 15,
      areaSqm: 18000,
    },
  });
  const blockC = await db.block.create({
    data: {
      name: "Block C - تجاري",
      subdivisionPlanId: subdivisionPlan.id,
      plotCount: 10,
      areaSqm: 12000,
    },
  });

  // Create plots
  const plotsA = [];
  for (let i = 1; i <= 20; i++) {
    const p = await db.plot.create({
      data: {
        plotNumber: `A-${String(i).padStart(2, "0")}`,
        blockId: blockA.id,
        subdivisionPlanId: subdivisionPlan.id,
        areaSqm: 500 + Math.floor(Math.random() * 200),
        productType: "VILLA_PLOT",
        status: "APPROVED",
      },
    });
    plotsA.push(p);
  }
  const plotsB = [];
  for (let i = 1; i <= 15; i++) {
    const p = await db.plot.create({
      data: {
        plotNumber: `B-${String(i).padStart(2, "0")}`,
        blockId: blockB.id,
        subdivisionPlanId: subdivisionPlan.id,
        areaSqm: 1200,
        productType: "APARTMENT_PLOT",
        status: "APPROVED",
      },
    });
    plotsB.push(p);
  }
  for (let i = 1; i <= 10; i++) {
    await db.plot.create({
      data: {
        plotNumber: `C-${String(i).padStart(2, "0")}`,
        blockId: blockC.id,
        subdivisionPlanId: subdivisionPlan.id,
        areaSqm: 1200,
        productType: "COMMERCIAL_LOT",
        status: "APPROVED",
      },
    });
  }
  console.log(`  ✓ Subdivision plan with 45 plots across 3 blocks`);

  console.log("P5: Creating planning scenario (baseline) ...");
  const scenario = await db.planningScenario.create({
    data: {
      name: "الملقا - السيناريو الأساسي",
      nameArabic: "السيناريو الأساسي",
      version: 1,
      status: "APPROVED",
      isBaseline: true,
      approvedBy: ADMIN_ID,
      approvedAt: new Date(),
      workspaceId: workspace.id,
      subdivisionPlanId: subdivisionPlan.id,
      organizationId: ORG_ID,
      metrics: {
        totalLandArea: 50000,
        totalBuiltUpArea: 38000,
        greenSpacePercentage: 15,
        roadPercentage: 20,
        utilityPercentage: 5,
        plotEfficiency: 0.76,
        villaPlots: 20,
        apartmentPlots: 15,
        commercialPlots: 10,
        estimatedRevenue: 180000000,
        estimatedCost: 95000000,
        estimatedProfit: 85000000,
        irr: 22.5,
        roi: 89.5,
      },
    },
  });

  // Add feasibility assessment
  await db.feasibilityAssessment.create({
    data: {
      scenarioId: scenario.id,
      organizationId: ORG_ID,
      totalLandCost: 45000000,
      totalDevelopmentCost: 50000000,
      totalProjectCost: 95000000,
      projectedRevenue: 180000000,
      netProfit: 85000000,
      roi: 89.5,
      irr: 22.5,
      paybackPeriodMonths: 36,
      npv: 72000000,
      status: "COMPLETED",
    },
  });

  // Add compliance result
  await db.complianceResult.create({
    data: {
      scenarioId: scenario.id,
      organizationId: ORG_ID,
      ruleKey: "SETBACK_FRONT",
      ruleName: "Front Setback",
      ruleNameArabic: "ارتداد أمامي",
      category: "SETBACK",
      result: "PASS",
      requiredValue: "6m",
      actualValue: "8m",
    },
  });
  await db.complianceResult.create({
    data: {
      scenarioId: scenario.id,
      organizationId: ORG_ID,
      ruleKey: "MAX_HEIGHT",
      ruleName: "Maximum Building Height",
      ruleNameArabic: "أقصى ارتفاع مبنى",
      category: "HEIGHT",
      result: "PASS",
      requiredValue: "20m",
      actualValue: "15m",
    },
  });
  await db.complianceResult.create({
    data: {
      scenarioId: scenario.id,
      organizationId: ORG_ID,
      ruleKey: "FAR",
      ruleName: "Floor Area Ratio",
      ruleNameArabic: "نسبة المساحة الطابقية",
      category: "DENSITY",
      result: "PASS",
      requiredValue: "2.5",
      actualValue: "1.9",
    },
  });
  console.log(`  ✓ Baseline scenario approved with feasibility & compliance\n`);

  // ─── PHASE 6: Acquisition Decision Gate ────────────────────────────────
  console.log("P6: Running acquisition decision gates ...");

  // Gate 1: LAND_IDENTIFIED → LAND_UNDER_REVIEW
  const gate1 = await db.decisionGate.create({
    data: {
      projectId: land.id,
      organizationId: ORG_ID,
      fromStage: "LAND_IDENTIFIED",
      toStage: "LAND_UNDER_REVIEW",
      decision: "APPROVED",
      requestedBy: PM_ID,
      decidedBy: ADMIN_ID,
      decidedAt: new Date(),
      notes: "Due diligence findings satisfactory. Advance to review.",
    },
  });
  await db.project.update({
    where: { id: land.id },
    data: { status: "LAND_UNDER_REVIEW" },
  });

  // Gate 2: LAND_UNDER_REVIEW → LAND_ACQUIRED
  const gate2 = await db.decisionGate.create({
    data: {
      projectId: land.id,
      organizationId: ORG_ID,
      fromStage: "LAND_UNDER_REVIEW",
      toStage: "LAND_ACQUIRED",
      decision: "APPROVED",
      requestedBy: PM_ID,
      decidedBy: ADMIN_ID,
      decidedAt: new Date(),
      notes: "Board approved acquisition at SAR 45M. Proceed.",
    },
  });
  await db.project.update({
    where: { id: land.id },
    data: { status: "LAND_ACQUIRED", acquisitionDate: new Date() },
  });
  console.log(`  ✓ Land acquired via 2 decision gates\n`);

  // ─── PHASE 7-8: Convert Land → Project ─────────────────────────────────
  console.log("P7: Converting land to active project ...");

  // Advance through planning stages
  const stageTransitions = [
    { from: "LAND_ACQUIRED", to: "CONCEPT_DESIGN", note: "Begin concept design phase" },
    { from: "CONCEPT_DESIGN", to: "SUBDIVISION_PLANNING", note: "Concept approved, begin subdivision" },
    { from: "SUBDIVISION_PLANNING", to: "AUTHORITY_SUBMISSION", note: "Subdivision plan submitted to authority" },
    { from: "AUTHORITY_SUBMISSION", to: "INFRASTRUCTURE_PLANNING", note: "Authority approved. Plan infrastructure." },
    { from: "INFRASTRUCTURE_PLANNING", to: "INVENTORY_STRUCTURING", note: "Infrastructure planned. Structure inventory." },
  ];

  for (const t of stageTransitions) {
    await db.decisionGate.create({
      data: {
        projectId: land.id,
        organizationId: ORG_ID,
        fromStage: t.from,
        toStage: t.to,
        decision: "APPROVED",
        requestedBy: PM_ID,
        decidedBy: ADMIN_ID,
        decidedAt: new Date(),
        notes: t.note,
      },
    });
    await db.project.update({
      where: { id: land.id },
      data: { status: t.to },
    });
  }

  // Link workspace to project
  await db.planningWorkspace.update({
    where: { id: workspace.id },
    data: { projectId: land.id, status: "APPROVED" },
  });
  console.log(`  ✓ Project advanced through 5 gates to INVENTORY_STRUCTURING\n`);

  // ─── PHASE 9: Buildings + Units ────────────────────────────────────────
  console.log("P9: Creating buildings and units ...");

  // Building 1: Villa compound (from Block A)
  const villaCompound = await db.building.create({
    data: {
      name: "مجمع الفلل - بلوك A",
      projectId: land.id,
      numberOfFloors: 2,
      buildingAreaSqm: 20000,
      buildingType: "villa_compound",
    },
  });

  // Create 20 villa units
  const villaUnits = [];
  for (let i = 1; i <= 20; i++) {
    const u = await db.unit.create({
      data: {
        number: `VA-${String(i).padStart(3, "0")}`,
        type: "VILLA",
        buildingId: villaCompound.id,
        area: 500 + Math.floor(Math.random() * 200),
        price: 2500000 + Math.floor(Math.random() * 500000),
        status: "AVAILABLE",
      },
    });
    villaUnits.push(u);
  }

  // Building 2: Apartment tower (from Block B)
  const aptTower = await db.building.create({
    data: {
      name: "برج الشقق - بلوك B",
      projectId: land.id,
      numberOfFloors: 8,
      buildingAreaSqm: 18000,
      buildingType: "apartment_tower",
    },
  });

  // Create 60 apartment units (15 plots × 4 units per plot)
  const aptUnits = [];
  for (let i = 1; i <= 60; i++) {
    const floor = Math.ceil(i / 8);
    const u = await db.unit.create({
      data: {
        number: `AP-${String(floor).padStart(2, "0")}${String((i % 8) || 8).padStart(2, "0")}`,
        type: "APARTMENT",
        buildingId: aptTower.id,
        area: 120 + Math.floor(Math.random() * 80),
        price: 650000 + Math.floor(Math.random() * 200000),
        status: "AVAILABLE",
      },
    });
    aptUnits.push(u);
  }

  // Building 3: Commercial strip (from Block C)
  const commercialStrip = await db.building.create({
    data: {
      name: "الشريط التجاري - بلوك C",
      projectId: land.id,
      numberOfFloors: 3,
      buildingAreaSqm: 12000,
      buildingType: "commercial",
    },
  });

  // Create 10 retail units
  const retailUnits = [];
  for (let i = 1; i <= 10; i++) {
    const u = await db.unit.create({
      data: {
        number: `RT-${String(i).padStart(3, "0")}`,
        type: "RETAIL",
        buildingId: commercialStrip.id,
        area: 200 + Math.floor(Math.random() * 300),
        price: 1800000 + Math.floor(Math.random() * 500000),
        status: "AVAILABLE",
      },
    });
    retailUnits.push(u);
  }

  console.log(
    `  ✓ 3 buildings created: ${villaUnits.length} villas, ${aptUnits.length} apartments, ${retailUnits.length} retail`
  );

  // Advance to pricing/launch
  for (const t of [
    { from: "INVENTORY_STRUCTURING", to: "PRICING_PACKAGING", note: "Units structured and priced" },
    { from: "PRICING_PACKAGING", to: "LAUNCH_READINESS", note: "Pricing approved by board" },
    { from: "LAUNCH_READINESS", to: "OFF_PLAN_LAUNCHED", note: "Sales launch approved" },
  ]) {
    await db.decisionGate.create({
      data: {
        projectId: land.id,
        organizationId: ORG_ID,
        fromStage: t.from,
        toStage: t.to,
        decision: "APPROVED",
        requestedBy: PM_ID,
        decidedBy: ADMIN_ID,
        decidedAt: new Date(),
        notes: t.note,
      },
    });
    await db.project.update({
      where: { id: land.id },
      data: { status: t.to },
    });
  }
  console.log(`  ✓ Project advanced to OFF_PLAN_LAUNCHED\n`);

  // ─── PHASE 10: Documents ──────────────────────────────────────────────
  console.log("P10: Uploading project documents ...");
  const docs = [
    { name: "GIS Spatial Analysis Report", category: "GIS", type: "application/pdf" },
    { name: "AutoCAD Master Layout v3", category: "CAD", type: "application/dwg" },
    { name: "Subdivision Planning Approval", category: "PLANNING", type: "application/pdf" },
    { name: "Balady Building Permit", category: "PERMIT", type: "application/pdf" },
    { name: "Environmental Impact Assessment", category: "GENERAL", type: "application/pdf" },
    { name: "Title Deed Copy", category: "LEGAL", type: "application/pdf" },
    { name: "Architectural Blueprint - Block A", category: "BLUEPRINT", type: "application/pdf" },
    { name: "Financial Feasibility Study", category: "FINANCE", type: "application/pdf" },
    { name: "Marketing Brochure", category: "MARKETING", type: "application/pdf" },
  ];
  for (const d of docs) {
    await db.document.create({
      data: {
        name: d.name,
        url: `https://storage.mimaric.sa/projects/${land.id}/${d.category.toLowerCase()}/${d.name.replace(/ /g, "_")}.pdf`,
        type: d.type,
        size: Math.floor(Math.random() * 5000000) + 500000,
        category: d.category as any,
        version: 1,
        projectId: land.id,
        organizationId: ORG_ID,
        userId: PM_ID,
      },
    });
  }
  console.log(`  ✓ ${docs.length} documents uploaded across categories\n`);

  // ─── PHASE 11: CRM — Create Customers ──────────────────────────────────
  console.log("P11: Creating customer leads ...");
  const customers = [
    {
      name: "Abdullah Al-Rashidi",
      nameArabic: "عبدالله الراشدي",
      phone: "+966501234567",
      email: "abdullah.rashidi@email.com",
      source: "WEBSITE",
      status: "QUALIFIED",
      nationalId: "1088765432",
      personType: "NATURAL",
      gender: "MALE",
      nationality: "Saudi",
    },
    {
      name: "Noura Al-Ghamdi",
      nameArabic: "نورة الغامدي",
      phone: "+966559876543",
      email: "noura.g@email.com",
      source: "REFERRAL",
      status: "INTERESTED",
      nationalId: "1092345678",
      personType: "NATURAL",
      gender: "FEMALE",
      nationality: "Saudi",
    },
    {
      name: "Mohammed Al-Otaibi",
      nameArabic: "محمد العتيبي",
      phone: "+966507654321",
      email: "m.otaibi@company.sa",
      source: "WALK_IN",
      status: "VIEWING",
      nationalId: "1076543210",
      personType: "NATURAL",
      gender: "MALE",
      nationality: "Saudi",
    },
    {
      name: "Sara Al-Dosari",
      nameArabic: "سارة الدوسري",
      phone: "+966541112233",
      email: "sara.dosari@email.com",
      source: "SOCIAL_MEDIA",
      status: "QUALIFIED",
      nationalId: "1098765421",
      personType: "NATURAL",
      gender: "FEMALE",
      nationality: "Saudi",
    },
    {
      name: "Al-Faisal Real Estate Corp",
      nameArabic: "مؤسسة الفيصل العقارية",
      phone: "+966112334455",
      email: "info@alfaisal-re.sa",
      source: "BROKER",
      status: "QUALIFIED",
      nationalId: "7001234567",
      personType: "LEGAL",
      nationality: "Saudi",
    },
  ];

  const createdCustomers = [];
  for (const c of customers) {
    const cust = await db.customer.create({
      data: {
        ...c,
        organizationId: ORG_ID,
      },
    });
    createdCustomers.push(cust);
  }
  console.log(`  ✓ ${createdCustomers.length} customers created\n`);

  // ─── PHASE 12: Reservations ────────────────────────────────────────────
  console.log("P12: Creating reservations ...");

  // Customer 1 reserves villa VA-001
  const reservation1 = await db.reservation.create({
    data: {
      customerId: createdCustomers[0].id,
      unitId: villaUnits[0].id,
      userId: SALES_MGR_ID,
      status: "CONFIRMED",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      amount: 100000,
    },
  });
  await db.unit.update({ where: { id: villaUnits[0].id }, data: { status: "RESERVED" } });
  await db.customer.update({ where: { id: createdCustomers[0].id }, data: { status: "RESERVED" } });

  // Customer 2 reserves apartment AP-0101
  const reservation2 = await db.reservation.create({
    data: {
      customerId: createdCustomers[1].id,
      unitId: aptUnits[0].id,
      userId: SALES_MGR_ID,
      status: "CONFIRMED",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      amount: 50000,
    },
  });
  await db.unit.update({ where: { id: aptUnits[0].id }, data: { status: "RESERVED" } });
  await db.customer.update({ where: { id: createdCustomers[1].id }, data: { status: "RESERVED" } });

  // Customer 5 (corporate) reserves 3 retail units
  for (let i = 0; i < 3; i++) {
    await db.reservation.create({
      data: {
        customerId: createdCustomers[4].id,
        unitId: retailUnits[i].id,
        userId: SALES_MGR_ID,
        status: "CONFIRMED",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        amount: 150000,
      },
    });
    await db.unit.update({ where: { id: retailUnits[i].id }, data: { status: "RESERVED" } });
  }
  await db.customer.update({ where: { id: createdCustomers[4].id }, data: { status: "RESERVED" } });

  console.log(`  ✓ 5 reservations created (1 villa, 1 apt, 3 retail)\n`);

  // ─── PHASE 13: Contracting ─────────────────────────────────────────────
  console.log("P13: Creating sale contracts ...");

  // Sale contract for villa — Customer 1
  const contract1 = await db.contract.create({
    data: {
      customerId: createdCustomers[0].id,
      unitId: villaUnits[0].id,
      type: "SALE",
      amount: 2800000,
      status: "SIGNED",
      signedAt: new Date(),
      userId: SALES_MGR_ID,
    },
  });
  await db.unit.update({ where: { id: villaUnits[0].id }, data: { status: "SOLD" } });
  await db.customer.update({ where: { id: createdCustomers[0].id }, data: { status: "CONVERTED" } });

  // Sale contract for apartment — Customer 2
  const contract2 = await db.contract.create({
    data: {
      customerId: createdCustomers[1].id,
      unitId: aptUnits[0].id,
      type: "SALE",
      amount: 750000,
      status: "SIGNED",
      signedAt: new Date(),
      userId: SALES_MGR_ID,
    },
  });
  await db.unit.update({ where: { id: aptUnits[0].id }, data: { status: "SOLD" } });
  await db.customer.update({ where: { id: createdCustomers[1].id }, data: { status: "CONVERTED" } });

  // Sale contracts for 3 retail — Customer 5
  for (let i = 0; i < 3; i++) {
    await db.contract.create({
      data: {
        customerId: createdCustomers[4].id,
        unitId: retailUnits[i].id,
        type: "SALE",
        amount: 2000000 + Math.floor(Math.random() * 300000),
        status: "SIGNED",
        signedAt: new Date(),
        userId: SALES_MGR_ID,
      },
    });
    await db.unit.update({ where: { id: retailUnits[i].id }, data: { status: "SOLD" } });
  }
  await db.customer.update({ where: { id: createdCustomers[4].id }, data: { status: "CONVERTED" } });

  // Draft contract for Customer 3 (viewing stage)
  const contract3 = await db.contract.create({
    data: {
      customerId: createdCustomers[2].id,
      unitId: villaUnits[1].id,
      type: "SALE",
      amount: 2650000,
      status: "DRAFT",
      userId: SALES_MGR_ID,
    },
  });

  console.log(`  ✓ 6 contracts created (5 signed, 1 draft)\n`);

  // ─── PHASE 14: Lease + Installments ────────────────────────────────────
  console.log("P14: Creating leases with installments ...");

  // Customer 4 leases apartment AP-0202
  const leaseStartDate = new Date();
  const leaseEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
  const leaseAmount = 48000; // SAR 48K/year
  const installmentCount = 4; // quarterly

  const lease = await db.lease.create({
    data: {
      unitId: aptUnits[1].id,
      customerId: createdCustomers[3].id,
      startDate: leaseStartDate,
      endDate: leaseEndDate,
      totalAmount: leaseAmount,
      status: "ACTIVE",
    },
  });
  await db.unit.update({ where: { id: aptUnits[1].id }, data: { status: "RENTED" } });
  await db.customer.update({ where: { id: createdCustomers[3].id }, data: { status: "ACTIVE_TENANT" } });

  // Create quarterly installments
  const installmentAmount = leaseAmount / installmentCount;
  for (let i = 0; i < installmentCount; i++) {
    const dueDate = new Date(leaseStartDate);
    dueDate.setMonth(dueDate.getMonth() + i * 3);
    await db.rentInstallment.create({
      data: {
        leaseId: lease.id,
        dueDate,
        amount: installmentAmount,
        status: i === 0 ? "PAID" : "UNPAID", // First installment paid
        paidAt: i === 0 ? new Date() : undefined,
      },
    });
  }

  // Customer 5 also leases a retail unit
  const lease2 = await db.lease.create({
    data: {
      unitId: retailUnits[3].id,
      customerId: createdCustomers[4].id,
      startDate: leaseStartDate,
      endDate: leaseEndDate,
      totalAmount: 120000, // SAR 120K/year for retail
      status: "ACTIVE",
    },
  });
  await db.unit.update({ where: { id: retailUnits[3].id }, data: { status: "RENTED" } });

  // Monthly installments for retail lease
  for (let i = 0; i < 12; i++) {
    const dueDate = new Date(leaseStartDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    await db.rentInstallment.create({
      data: {
        leaseId: lease2.id,
        dueDate,
        amount: 10000,
        status: i < 3 ? "PAID" : "UNPAID", // First 3 months paid
        paidAt: i < 3 ? new Date() : undefined,
      },
    });
  }

  console.log(`  ✓ 2 leases with installments (1 quarterly apt, 1 monthly retail)\n`);

  // ─── PHASE 15: Construction Monitoring ─────────────────────────────────
  console.log("P15: Adding construction site logs ...");
  const siteLogs = [
    {
      description: "Foundation Work Complete — Block A: All 20 villa foundations completed. Soil compaction tests passed at 95%+ density.",
      type: "DAILY_LOG",
      severity: "LOW",
      date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    },
    {
      description: "Structural Framework — Block B Tower: Floors 1-4 concrete poured. Rebar inspection approved by engineer.",
      type: "DAILY_LOG",
      severity: "LOW",
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    },
    {
      description: "Safety Inspection — All Blocks: Ministry of Labor safety inspection passed. All fire exits and scaffolding compliant.",
      type: "INSPECTION",
      severity: "LOW",
      date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    },
    {
      description: "Infrastructure — Roads & Utilities: Internal road network 60% complete. Water and electricity main lines connected.",
      type: "DAILY_LOG",
      severity: "LOW",
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      description: "Delay Notice — Material Supply: Marble facade delivery delayed 2 weeks due to shipping. Adjusted schedule accordingly.",
      type: "SNAG",
      severity: "MEDIUM",
      date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    },
    {
      description: "MEP Installation — Block A: Electrical wiring, plumbing rough-in, and HVAC ductwork in progress for villas 1-10.",
      type: "DAILY_LOG",
      severity: "LOW",
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const log of siteLogs) {
    await db.siteLog.create({
      data: {
        ...log,
        projectId: land.id,
        reportedBy: PM_ID,
        organizationId: ORG_ID,
      },
    });
  }

  // Advance project to UNDER_CONSTRUCTION
  await db.decisionGate.create({
    data: {
      projectId: land.id,
      organizationId: ORG_ID,
      fromStage: "OFF_PLAN_LAUNCHED",
      toStage: "UNDER_CONSTRUCTION",
      decision: "APPROVED",
      requestedBy: PM_ID,
      decidedBy: ADMIN_ID,
      decidedAt: new Date(),
      notes: "Construction commenced. Sales active.",
    },
  });
  await db.project.update({
    where: { id: land.id },
    data: { status: "UNDER_CONSTRUCTION" },
  });

  console.log(`  ✓ ${siteLogs.length} site logs + project advanced to UNDER_CONSTRUCTION\n`);

  // ─── PHASE 16: Handover Preparation ────────────────────────────────────
  console.log("P16: Preparing handover ...");

  // Advance to READY then HANDED_OVER
  await db.decisionGate.create({
    data: {
      projectId: land.id,
      organizationId: ORG_ID,
      fromStage: "UNDER_CONSTRUCTION",
      toStage: "READY",
      decision: "APPROVED",
      requestedBy: PM_ID,
      decidedBy: ADMIN_ID,
      decidedAt: new Date(),
      notes: "Construction complete. Occupancy certificate received.",
    },
  });
  await db.project.update({
    where: { id: land.id },
    data: { status: "READY" },
  });

  await db.decisionGate.create({
    data: {
      projectId: land.id,
      organizationId: ORG_ID,
      fromStage: "READY",
      toStage: "HANDED_OVER",
      decision: "APPROVED",
      requestedBy: PM_ID,
      decidedBy: ADMIN_ID,
      decidedAt: new Date(),
      notes: "All unit handovers scheduled. Maintenance contracts signed.",
    },
  });
  await db.project.update({
    where: { id: land.id },
    data: { status: "HANDED_OVER" },
  });
  console.log(`  ✓ Project advanced to HANDED_OVER\n`);

  // ─── PHASE 17: Create Maintenance Plans ────────────────────────────────
  console.log("P17: Setting up post-handover maintenance ...");

  // Create maintenance requests for common areas
  const maintenanceRequests = [
    {
      title: "HVAC Quarterly Inspection — Block A",
      titleArabic: "فحص التكييف الربعي - بلوك A",
      description: "Quarterly preventive maintenance for all HVAC units in villa compound.",
      type: "PREVENTIVE",
      priority: "MEDIUM",
      status: "OPEN",
      buildingId: villaCompound.id,
    },
    {
      title: "Elevator Annual Service — Block B",
      titleArabic: "صيانة المصاعد السنوية - بلوك B",
      description: "Annual elevator safety inspection and lubrication.",
      type: "PREVENTIVE",
      priority: "HIGH",
      status: "OPEN",
      buildingId: aptTower.id,
    },
    {
      title: "Plumbing Leak — Unit AP-0305",
      titleArabic: "تسرب مياه - وحدة AP-0305",
      description: "Tenant reported water leak in bathroom ceiling. Requires urgent inspection.",
      type: "CORRECTIVE",
      priority: "HIGH",
      status: "IN_PROGRESS",
      buildingId: aptTower.id,
      unitId: aptUnits[4].id,
    },
  ];

  for (const mr of maintenanceRequests) {
    await db.maintenanceRequest.create({
      data: {
        ...mr,
        projectId: land.id,
        organizationId: ORG_ID,
        reportedBy: PM_ID,
      },
    });
  }
  console.log(`  ✓ ${maintenanceRequests.length} maintenance requests created\n`);

  // ─── Create Finance Data ──────────────────────────────────────────────
  console.log("P17b: Creating finance entries ...");

  // Escrow account
  const escrowAccount = await db.escrowAccount.create({
    data: {
      name: "Malqa Project Escrow",
      nameArabic: "حساب ضمان مشروع الملقا",
      bankName: "Al Rajhi Bank",
      accountNumber: "SA12 3456 7890 1234 5678 90",
      projectId: land.id,
      organizationId: ORG_ID,
      balance: 8300000,
      status: "ACTIVE",
    },
  });

  // Escrow transactions from sales
  await db.escrowTransaction.create({
    data: {
      escrowAccountId: escrowAccount.id,
      type: "BUYER_DEPOSIT",
      amount: 2800000,
      description: "Villa VA-001 sale — Abdullah Al-Rashidi",
      reference: `SALE-${contract1.id.slice(-8)}`,
      performedBy: FINANCE_ID,
    },
  });
  await db.escrowTransaction.create({
    data: {
      escrowAccountId: escrowAccount.id,
      type: "BUYER_DEPOSIT",
      amount: 750000,
      description: "Apartment AP-0101 sale — Noura Al-Ghamdi",
      reference: `SALE-${contract2.id.slice(-8)}`,
      performedBy: FINANCE_ID,
    },
  });
  await db.escrowTransaction.create({
    data: {
      escrowAccountId: escrowAccount.id,
      type: "BUYER_DEPOSIT",
      amount: 6300000,
      description: "3 Retail units sale — Al-Faisal Real Estate Corp",
      reference: `SALE-BULK-RETAIL`,
      performedBy: FINANCE_ID,
    },
  });
  await db.escrowTransaction.create({
    data: {
      escrowAccountId: escrowAccount.id,
      type: "DEVELOPER_WITHDRAWAL",
      amount: -1550000,
      description: "Construction milestone payment — Phase 1",
      reference: "CONST-MILESTONE-1",
      performedBy: FINANCE_ID,
    },
  });

  console.log(`  ✓ Escrow account + 4 transactions\n`);

  // ─── Summary ──────────────────────────────────────────────────────────
  console.log("═══════════════════════════════════════════════");
  console.log("✅ E2E Business Process Simulation Complete!");
  console.log("═══════════════════════════════════════════════");
  console.log(`
  Project:      ${land.name} (${land.id})
  Status:       HANDED_OVER
  Buildings:    3 (villa compound, apt tower, commercial strip)
  Units:        90 (20 villas + 60 apartments + 10 retail)
  Customers:    5 (4 individuals + 1 corporate)
  Reservations: 5
  Contracts:    6 (5 signed + 1 draft)
  Leases:       2 (1 quarterly + 1 monthly)
  Documents:    9 (across 7 categories)
  Site Logs:    6
  Decision Gates: 12
  Maintenance:  3 requests
  Escrow:       4 transactions (SAR 8.3M balance)
  `);

  await db.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
