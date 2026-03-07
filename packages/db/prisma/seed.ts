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

  // 1. Organization (MOC-aligned)
  const org = await prisma.organization.upsert({
    where: { crNumber: "1010342981" },
    update: {
      nameArabic: "شركة معماري للتطوير العقاري",
      nameEnglish: "Mimaric Real Estate Development Co.",
      tradeNameArabic: "معماري",
      tradeNameEnglish: "Mimaric",
      entityType: "COMPANY",
      legalForm: "LIMITED_LIABILITY_COMPANY",
      registrationStatus: "ACTIVE_REG",
      registrationDate: new Date("2020-03-15"),
      expiryDate: new Date("2028-03-14"),
      capitalAmountSar: 5000000,
      mainActivityCode: "411001",
      mainActivityNameAr: "التطوير العقاري",
      contactInfo: {
        mobileNumber: "0551234567",
        phoneNumber: "0112345678",
        email: "info@mimaric.sa",
        websiteUrl: "https://mimaric.sa",
      },
      nationalAddress: {
        region: "منطقة الرياض",
        city: "الرياض",
        district: "العليا",
        streetName: "طريق الملك فهد",
        buildingNumber: "2345",
        postalCode: "12211",
        additionalNumber: "8765",
        shortAddress: "RRAA2345",
      },
      managerInfo: {
        managerName: "عمر الغامدي",
        managerId: "1098765432",
        managerRole: "المدير العام",
      },
    },
    create: {
      name: "Mimaric Development",
      nameArabic: "شركة معماري للتطوير العقاري",
      nameEnglish: "Mimaric Real Estate Development Co.",
      tradeNameArabic: "معماري",
      tradeNameEnglish: "Mimaric",
      crNumber: "1010342981",
      unifiedNumber: "7001234567",
      vatNumber: "310452938100003",
      type: "DEVELOPER",
      entityType: "COMPANY",
      legalForm: "LIMITED_LIABILITY_COMPANY",
      registrationStatus: "ACTIVE_REG",
      registrationDate: new Date("2020-03-15"),
      expiryDate: new Date("2028-03-14"),
      capitalAmountSar: 5000000,
      mainActivityCode: "411001",
      mainActivityNameAr: "التطوير العقاري",
      contactInfo: {
        mobileNumber: "0551234567",
        phoneNumber: "0112345678",
        email: "info@mimaric.sa",
        websiteUrl: "https://mimaric.sa",
      },
      nationalAddress: {
        region: "منطقة الرياض",
        city: "الرياض",
        district: "العليا",
        streetName: "طريق الملك فهد",
        buildingNumber: "2345",
        postalCode: "12211",
        additionalNumber: "8765",
        shortAddress: "RRAA2345",
      },
      managerInfo: {
        managerName: "عمر الغامدي",
        managerId: "1098765432",
        managerRole: "المدير العام",
      },
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

  // 4. Projects (Balady-aligned)
  const project1 = await prisma.project.create({
    data: {
      name: "Al Arjuan Towers",
      description: "أبراج سكنية فاخرة في شمال الرياض",
      type: "RESIDENTIAL",
      status: "UNDER_CONSTRUCTION",
      organizationId: org.id,
      parcelNumber: "P-2458-17",
      plotNumber: "117",
      blockNumber: "B12",
      deedNumber: "DEED-1445-998877",
      landUse: "RESIDENTIAL_LAND",
      totalAreaSqm: 4500,
      region: "منطقة الرياض",
      city: "الرياض",
      district: "الملقا",
      streetName: "طريق أنس بن مالك",
      postalCode: "13521",
      latitude: 24.7942,
      longitude: 46.6265,
      boundaries: {
        north: "شارع 12 متر",
        south: "قطعة مجاورة 2459",
        east: "ممر خدمي",
        west: "قطعة مجاورة 2457",
      },
      utilities: {
        electricityConnected: true,
        waterConnected: true,
        sewageConnected: true,
        roadAccess: true,
      },
      estimatedValueSar: 45000000,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: "Horizon Business Park",
      description: "مجمع تجاري حديث في منطقة كافد",
      type: "COMMERCIAL",
      status: "PLANNING",
      organizationId: org.id,
      parcelNumber: "P-3102-08",
      deedNumber: "DEED-1446-112233",
      landUse: "COMMERCIAL_LAND",
      totalAreaSqm: 8200,
      region: "منطقة الرياض",
      city: "الرياض",
      district: "حطين",
      latitude: 24.7636,
      longitude: 46.6534,
      utilities: {
        electricityConnected: true,
        waterConnected: true,
        sewageConnected: false,
        roadAccess: true,
      },
      estimatedValueSar: 82000000,
    },
  });

  // 4b. Land Parcels (Projects with LAND_* statuses)
  await prisma.project.create({
    data: {
      name: "أرض حي الياسمين",
      description: "أرض سكنية في حي الياسمين شمال الرياض بمساحة كبيرة مناسبة لمجمع سكني",
      type: "RESIDENTIAL",
      status: "LAND_ACQUIRED",
      organizationId: org.id,
      parcelNumber: "P-5520-03",
      plotNumber: "42",
      blockNumber: "B7",
      deedNumber: "DEED-1446-554433",
      landUse: "RESIDENTIAL_LAND",
      totalAreaSqm: 6200,
      region: "منطقة الرياض",
      city: "الرياض",
      district: "الياسمين",
      streetName: "شارع الأمير محمد بن سلمان",
      postalCode: "13325",
      latitude: 24.8231,
      longitude: 46.6018,
      estimatedValueSar: 31000000,
      landOwner: "صالح بن عبدالله العتيبي",
      landOwnerType: "INDIVIDUAL",
      acquisitionPrice: 28500000,
      acquisitionDate: new Date("2025-11-20"),
    },
  });

  await prisma.project.create({
    data: {
      name: "أرض طريق الملك سلمان التجارية",
      description: "أرض تجارية على طريق الملك سلمان مناسبة لمجمع مكاتب أو مركز تجاري",
      type: "COMMERCIAL",
      status: "LAND_UNDER_REVIEW",
      organizationId: org.id,
      parcelNumber: "P-7801-15",
      deedNumber: "DEED-1447-887766",
      landUse: "COMMERCIAL_LAND",
      totalAreaSqm: 12500,
      region: "منطقة الرياض",
      city: "الرياض",
      district: "العارض",
      streetName: "طريق الملك سلمان",
      postalCode: "13336",
      latitude: 24.8456,
      longitude: 46.6342,
      estimatedValueSar: 95000000,
      landOwner: "شركة الوطنية للاستثمار العقاري",
      landOwnerType: "COMPANY",
    },
  });

  await prisma.project.create({
    data: {
      name: "أرض حي النرجس",
      description: "أرض سكنية في حي النرجس مناسبة لبناء فلل",
      type: "VILLA_COMPOUND",
      status: "LAND_IDENTIFIED",
      organizationId: org.id,
      parcelNumber: "P-9102-22",
      deedNumber: "DEED-1447-223344",
      landUse: "RESIDENTIAL_LAND",
      totalAreaSqm: 8700,
      region: "منطقة الرياض",
      city: "الرياض",
      district: "النرجس",
      latitude: 24.8102,
      longitude: 46.6189,
      estimatedValueSar: 52000000,
      landOwner: "عبدالرحمن بن محمد الشمري",
      landOwnerType: "INDIVIDUAL",
    },
  });

  await prisma.project.create({
    data: {
      name: "أرض مخطط الخير",
      description: "أرض متعددة الاستخدام في مخطط الخير شمال الرياض",
      type: "MIXED_USE",
      status: "LAND_ACQUIRED",
      organizationId: org.id,
      parcelNumber: "P-6340-09",
      plotNumber: "88",
      blockNumber: "B15",
      deedNumber: "DEED-1446-667788",
      landUse: "MIXED_USE_LAND",
      totalAreaSqm: 15000,
      region: "منطقة الرياض",
      city: "الرياض",
      district: "الخير",
      streetName: "طريق الأمير فيصل بن بندر",
      postalCode: "13341",
      latitude: 24.8675,
      longitude: 46.5890,
      estimatedValueSar: 75000000,
      landOwner: "مؤسسة الراجحي الخيرية",
      landOwnerType: "COMPANY",
      acquisitionPrice: 70000000,
      acquisitionDate: new Date("2025-09-10"),
    },
  });

  await prisma.project.create({
    data: {
      name: "أرض حي الرمال",
      description: "أرض صناعية في حي الرمال شرق الرياض قرب المنطقة الصناعية",
      type: "COMMERCIAL",
      status: "LAND_UNDER_REVIEW",
      organizationId: org.id,
      parcelNumber: "P-4210-31",
      deedNumber: "DEED-1447-112299",
      landUse: "INDUSTRIAL_LAND",
      totalAreaSqm: 22000,
      region: "منطقة الرياض",
      city: "الرياض",
      district: "الرمال",
      latitude: 24.7340,
      longitude: 46.8120,
      estimatedValueSar: 44000000,
      landOwner: "شركة المدار للتطوير",
      landOwnerType: "COMPANY",
    },
  });

  console.log("Created 5 land parcels");

  // 5. Buildings (Balady building details)
  const building1 = await prisma.building.create({
    data: {
      name: "Tower A",
      projectId: project1.id,
      numberOfFloors: 15,
      buildingAreaSqm: 1800,
      constructionYear: 1445,
      buildingType: "residential",
      occupancyStatus: "partially_occupied",
      electricityConnected: true,
      waterConnected: true,
    },
  });
  const building2 = await prisma.building.create({
    data: {
      name: "Tower B",
      projectId: project1.id,
      numberOfFloors: 12,
      buildingAreaSqm: 1500,
      constructionYear: 1445,
      buildingType: "residential",
      occupancyStatus: "under_construction",
      electricityConnected: true,
      waterConnected: true,
    },
  });
  const building3 = await prisma.building.create({
    data: {
      name: "Block 1",
      projectId: project2.id,
      numberOfFloors: 5,
      buildingAreaSqm: 2200,
      buildingType: "commercial",
      occupancyStatus: "vacant",
    },
  });
  const building4 = await prisma.building.create({
    data: {
      name: "Block 2",
      projectId: project2.id,
      numberOfFloors: 3,
      buildingAreaSqm: 3000,
      buildingType: "commercial",
      occupancyStatus: "vacant",
    },
  });

  // 6. Units — with floor, bedrooms, bathrooms
  const unitData = [
    // Tower A — apartments
    { number: "A-101", type: "APARTMENT" as const, buildingId: building1.id, area: 120, price: 850000, status: "AVAILABLE" as const, floor: 1, bedrooms: 3, bathrooms: 2 },
    { number: "A-102", type: "APARTMENT" as const, buildingId: building1.id, area: 95, price: 720000, status: "SOLD" as const, floor: 1, bedrooms: 2, bathrooms: 2 },
    { number: "A-201", type: "APARTMENT" as const, buildingId: building1.id, area: 140, price: 980000, status: "RESERVED" as const, floor: 2, bedrooms: 3, bathrooms: 3 },
    // Tower B — apartments + villa
    { number: "B-101", type: "APARTMENT" as const, buildingId: building2.id, area: 110, price: 800000, status: "AVAILABLE" as const, floor: 1, bedrooms: 2, bathrooms: 2 },
    { number: "B-102", type: "APARTMENT" as const, buildingId: building2.id, area: 160, price: 1100000, status: "RENTED" as const, floor: 1, bedrooms: 4, bathrooms: 3 },
    { number: "B-201", type: "VILLA" as const, buildingId: building2.id, area: 320, price: 2500000, status: "AVAILABLE" as const, floor: 1, bedrooms: 5, bathrooms: 4 },
    // Block 1 — offices
    { number: "C1-01", type: "OFFICE" as const, buildingId: building3.id, area: 80, price: 450000, status: "AVAILABLE" as const, floor: 1 },
    { number: "C1-02", type: "OFFICE" as const, buildingId: building3.id, area: 120, price: 680000, status: "RESERVED" as const, floor: 2 },
    { number: "C1-03", type: "RETAIL" as const, buildingId: building3.id, area: 200, price: 1200000, status: "AVAILABLE" as const, floor: 0 },
    // Block 2 — retail + warehouse
    { number: "C2-01", type: "RETAIL" as const, buildingId: building4.id, area: 150, price: 900000, status: "AVAILABLE" as const, floor: 0 },
    { number: "C2-02", type: "WAREHOUSE" as const, buildingId: building4.id, area: 500, price: 1800000, status: "SOLD" as const, floor: 0 },
    { number: "C2-03", type: "OFFICE" as const, buildingId: building4.id, area: 90, price: 520000, status: "RENTED" as const, floor: 1 },
  ];

  for (const unit of unitData) {
    await prisma.unit.create({ data: unit });
  }
  console.log("Created 12 units across 4 buildings");

  // 7. Customers (Absher-aligned)
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: "Mohammed Al-Qahtani",
        nameArabic: "محمد عبدالله القحطاني",
        phone: "0501234567",
        email: "m.qahtani@gmail.com",
        nationalId: "1023456789",
        personType: "SAUDI_CITIZEN",
        gender: "MALE",
        dateOfBirth: new Date("1985-03-14"),
        nationality: "سعودي",
        nationalityCode: "SA",
        address: {
          region: "منطقة الرياض",
          city: "الرياض",
          district: "النرجس",
          streetName: "شارع الأمير سلطان",
          buildingNumber: "4567",
          postalCode: "13434",
        },
        documentInfo: {
          documentType: "national_id",
          documentNumber: "1023456789",
          issueDate: "2020-01-10",
          expiryDate: "2030-01-09",
          issuingAuthority: "الأحوال المدنية",
        },
        status: "QUALIFIED",
        source: "Website",
        organizationId: org.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: "Noura Al-Dosari",
        nameArabic: "نورة سعد الدوسري",
        phone: "0559876543",
        email: "noura.d@outlook.com",
        nationalId: "1034567890",
        personType: "SAUDI_CITIZEN",
        gender: "FEMALE",
        dateOfBirth: new Date("1992-07-22"),
        nationality: "سعودية",
        nationalityCode: "SA",
        status: "VIEWING",
        source: "Referral",
        organizationId: org.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: "Abdullah Al-Shehri",
        nameArabic: "عبدالله محمد الشهري",
        phone: "0541112233",
        email: "a.shehri@yahoo.com",
        nationalId: "1045678901",
        personType: "SAUDI_CITIZEN",
        gender: "MALE",
        nationality: "سعودي",
        nationalityCode: "SA",
        status: "NEW",
        source: "Exhibition",
        organizationId: org.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: "Sara Al-Mutairi",
        nameArabic: "سارة خالد المطيري",
        phone: "0567778899",
        nationalId: "1056789012",
        personType: "SAUDI_CITIZEN",
        gender: "FEMALE",
        status: "INTERESTED",
        source: "Social Media",
        organizationId: org.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: "Fahad Al-Tamimi",
        nameArabic: "فهد عبدالرحمن التميمي",
        phone: "0523334455",
        email: "f.tamimi@gmail.com",
        nationalId: "2087654321",
        personType: "RESIDENT",
        gender: "MALE",
        dateOfBirth: new Date("1988-11-05"),
        nationality: "أردني",
        nationalityCode: "JO",
        address: {
          region: "منطقة الرياض",
          city: "الرياض",
          district: "الملقا",
          buildingNumber: "1234",
          postalCode: "13521",
        },
        documentInfo: {
          documentType: "iqama",
          documentNumber: "2087654321",
          issueDate: "2023-06-15",
          expiryDate: "2026-06-14",
          issuingAuthority: "الجوازات",
        },
        status: "ACTIVE_TENANT",
        source: "Walk-in",
        organizationId: org.id,
      },
    }),
  ]);
  console.log("Created 5 customers with Absher-aligned data");

  // 8. A sample lease with installments (Fahad as active tenant)
  const rentedUnit = await prisma.unit.findFirst({ where: { number: "B-102" } });
  if (rentedUnit) {
    const lease = await prisma.lease.create({
      data: {
        unitId: rentedUnit.id,
        customerId: customers[4]!.id,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        totalAmount: 48000,
        status: "ACTIVE",
      },
    });

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

  // 9. Sample maintenance requests
  const units = await prisma.unit.findMany({ take: 3 });
  if (units.length >= 3) {
    await prisma.maintenanceRequest.create({
      data: {
        title: "تسريب مياه في الحمام",
        description: "يوجد تسريب مياه من السقف في الحمام الرئيسي",
        type: "plumbing",
        status: "OPEN",
        priority: "HIGH",
        unitId: units[0]!.id,
        organizationId: org.id,
      },
    });
    await prisma.maintenanceRequest.create({
      data: {
        title: "عطل في التكييف",
        description: "التكييف لا يعمل في غرفة المعيشة",
        type: "hvac",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        unitId: units[1]!.id,
        organizationId: org.id,
      },
    });
    await prisma.maintenanceRequest.create({
      data: {
        title: "مشكلة كهربائية",
        description: "انقطاع متكرر للكهرباء في المطبخ",
        type: "electrical",
        status: "RESOLVED",
        priority: "URGENT",
        unitId: units[2]!.id,
        organizationId: org.id,
        resolvedAt: new Date("2025-02-15"),
      },
    });
    console.log("Created 3 maintenance requests");
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
