import { db } from "../packages/db";

async function diagnose() {
  console.log("--- Mimaric Auth Diagnostic ---");
  
  try {
    // Check DB Connection
    console.log("1. Checking Database connection...");
    const userCount = await db.user.count();
    console.log(`   Success! Total users in DB: ${userCount}`);

    // Check for admin user
    console.log("2. Checking for admin@mimaric.sa...");
    const admin = await db.user.findUnique({
      where: { email: "admin@mimaric.sa" }
    });

    if (admin) {
      console.log("   Found admin user!");
      console.log(`   ID: ${admin.id}`);
      console.log(`   Organization ID: ${admin.organizationId}`);
      console.log(`   Has Password: ${!!admin.password}`);
    } else {
      console.log("   CRITICAL: admin@mimaric.sa NOT FOUND in database.");
      
      // Attempt to create it if it doesn't exist?
      // Actually, let's just report for now.
    }

    // Check Organizations
    const orgs = await db.organization.findMany();
    console.log(`3. Organizations found: ${orgs.length}`);
    orgs.forEach(o => console.log(`   - ${o.name} (${o.id})`));

  } catch (error) {
    console.error("   DIAGNOSTIC FAILED:");
    console.error(error);
  } finally {
    process.exit();
  }
}

diagnose();
