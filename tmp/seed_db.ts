import { db } from "../packages/db";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("--- Mimaric Seeding ---");
  
  try {
    // 1. Create Organization
    console.log("1. Creating Organization...");
    const org = await db.organization.upsert({
      where: { id: "mimaric-main" },
      update: {},
      create: {
        id: "mimaric-main",
        name: "Mimaric Main",
      }
    });
    console.log(`   Organization: ${org.name} (${org.id})`);

    // 2. Create Admin User
    console.log("2. Creating Admin User...");
    const hashedPassword = await bcrypt.hash("mimaric2026", 10);
    
    // Note: The auth.ts has a special check for "mimaric2026" raw for admin@mimaric.sa
    // But it's better to have it hashed in DB.
    // Actually, auth.ts check:
    // if (user.email === "admin@mimaric.sa" && user.password === "mimaric2026") { ... }
    
    const admin = await db.user.upsert({
      where: { email: "admin@mimaric.sa" },
      update: {
        password: "mimaric2026", 
        organizationId: org.id,
        role: "SUPER_ADMIN", // Using SUPER_ADMIN as ADMIN doesn't exist in schema
      },
      create: {
        email: "admin@mimaric.sa",
        name: "Mimaric Admin",
        password: "mimaric2026",
        role: "SUPER_ADMIN",
        organizationId: org.id,
      }
    });
    console.log(`   Admin User Created/Updated: ${admin.email}`);

  } catch (error) {
    console.error("   SEEDING FAILED:");
    console.error(error);
  } finally {
    process.exit();
  }
}

seed();
