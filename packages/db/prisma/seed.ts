import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not defined");

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // 1. Organization
  const org = await prisma.organization.upsert({
    where: { crNumber: "1010342981" },
    update: {},
    create: {
      name: "Mimaric Development",
      crNumber: "1010342981",
      vatNumber: "310452938100003",
      type: "DEVELOPER",
    },
  });
  console.log("Organization:", org.name);

  // 2. Admin User
  const hashedPassword = await bcrypt.hash("mimaric2026", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@mimaric.sa" },
    update: { password: hashedPassword },
    create: {
      email: "admin@mimaric.sa",
      name: "Omar Al-Ghamdi",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      organizationId: org.id,
    },
  });
  console.log("Admin user:", admin.email);

  // 3. Team members
  const salesPassword = await bcrypt.hash("sales2026", 12);
  const financePassword = await bcrypt.hash("finance2026", 12);

  await prisma.user.upsert({
    where: { email: "ahmed@mimaric.sa" },
    update: {},
    create: {
      email: "ahmed@mimaric.sa",
      name: "Ahmed Al-Harbi",
      password: salesPassword,
      role: "SALES_AGENT",
      organizationId: org.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "fatima@mimaric.sa" },
    update: {},
    create: {
      email: "fatima@mimaric.sa",
      name: "Fatima Al-Rashid",
      password: financePassword,
      role: "FINANCE_OFFICER",
      organizationId: org.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "khalid@mimaric.sa" },
    update: {},
    create: {
      email: "khalid@mimaric.sa",
      name: "Khalid Al-Otaibi",
      password: salesPassword,
      role: "TECHNICIAN",
      organizationId: org.id,
    },
  });

  // 4. Projects
  const project1 = await prisma.project.create({
    data: {
      name: "Al Arjuan Towers",
      description: "Premium residential towers in North Riyadh",
      type: "RESIDENTIAL",
      status: "UNDER_CONSTRUCTION",
      organizationId: org.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: "Horizon Business Park",
      description: "Modern commercial complex in KAFD area",
      type: "COMMERCIAL",
      status: "PLANNING",
      organizationId: org.id,
    },
  });

  // 5. Buildings
  const building1 = await prisma.building.create({
    data: { name: "Tower A", projectId: project1.id },
  });
  const building2 = await prisma.building.create({
    data: { name: "Tower B", projectId: project1.id },
  });
  const building3 = await prisma.building.create({
    data: { name: "Block 1", projectId: project2.id },
  });
  const building4 = await prisma.building.create({
    data: { name: "Block 2", projectId: project2.id },
  });

  // 6. Units — 12 total across buildings
  const unitData = [
    // Tower A — apartments
    { number: "A-101", type: "APARTMENT" as const, buildingId: building1.id, area: 120, price: 850000, status: "AVAILABLE" as const },
    { number: "A-102", type: "APARTMENT" as const, buildingId: building1.id, area: 95, price: 720000, status: "SOLD" as const },
    { number: "A-201", type: "APARTMENT" as const, buildingId: building1.id, area: 140, price: 980000, status: "RESERVED" as const },
    // Tower B — apartments + villa
    { number: "B-101", type: "APARTMENT" as const, buildingId: building2.id, area: 110, price: 800000, status: "AVAILABLE" as const },
    { number: "B-102", type: "APARTMENT" as const, buildingId: building2.id, area: 160, price: 1100000, status: "RENTED" as const },
    { number: "B-201", type: "VILLA" as const, buildingId: building2.id, area: 320, price: 2500000, status: "AVAILABLE" as const },
    // Block 1 — offices
    { number: "C1-01", type: "OFFICE" as const, buildingId: building3.id, area: 80, price: 450000, status: "AVAILABLE" as const },
    { number: "C1-02", type: "OFFICE" as const, buildingId: building3.id, area: 120, price: 680000, status: "RESERVED" as const },
    { number: "C1-03", type: "RETAIL" as const, buildingId: building3.id, area: 200, price: 1200000, status: "AVAILABLE" as const },
    // Block 2 — retail + warehouse
    { number: "C2-01", type: "RETAIL" as const, buildingId: building4.id, area: 150, price: 900000, status: "AVAILABLE" as const },
    { number: "C2-02", type: "WAREHOUSE" as const, buildingId: building4.id, area: 500, price: 1800000, status: "SOLD" as const },
    { number: "C2-03", type: "OFFICE" as const, buildingId: building4.id, area: 90, price: 520000, status: "RENTED" as const },
  ];

  for (const unit of unitData) {
    await prisma.unit.create({ data: unit });
  }
  console.log("Created 12 units across 4 buildings");

  // 7. Customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: { name: "Mohammed Al-Qahtani", phone: "+966501234567", email: "m.qahtani@gmail.com", status: "QUALIFIED", source: "Website", organizationId: org.id },
    }),
    prisma.customer.create({
      data: { name: "Noura Al-Dosari", phone: "+966559876543", email: "noura.d@outlook.com", status: "VIEWING", source: "Referral", organizationId: org.id },
    }),
    prisma.customer.create({
      data: { name: "Abdullah Al-Shehri", phone: "+966541112233", email: "a.shehri@yahoo.com", status: "NEW", source: "Exhibition", organizationId: org.id },
    }),
    prisma.customer.create({
      data: { name: "Sara Al-Mutairi", phone: "+966567778899", status: "INTERESTED", source: "Social Media", organizationId: org.id },
    }),
    prisma.customer.create({
      data: { name: "Fahad Al-Tamimi", phone: "+966523334455", email: "f.tamimi@gmail.com", status: "ACTIVE_TENANT", source: "Walk-in", organizationId: org.id },
    }),
  ]);
  console.log("Created 5 customers");

  // 8. A sample lease with installments (Fahad as active tenant)
  const rentedUnit = await prisma.unit.findFirst({ where: { number: "B-102" } });
  if (rentedUnit) {
    const lease = await prisma.lease.create({
      data: {
        unitId: rentedUnit.id,
        customerId: customers[4]!.id, // Fahad
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        totalAmount: 48000,
        status: "ACTIVE",
      },
    });

    // Monthly installments
    for (let i = 0; i < 12; i++) {
      const dueDate = new Date(2025, i, 1);
      const isPast = dueDate < new Date();
      await prisma.rentInstallment.create({
        data: {
          leaseId: lease.id,
          dueDate,
          amount: 4000,
          status: isPast ? "PAID" : "UNPAID",
          paidAt: isPast ? new Date(2025, i, 3) : null,
          paymentMethod: isPast ? "Bank Transfer" : null,
        },
      });
    }
    console.log("Created lease with 12 installments for Fahad");
  }

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
