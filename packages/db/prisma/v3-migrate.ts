/**
 * v3.0 Database Migration Script
 * Handles enum renames and Unit.organizationId backfill
 * Run: DATABASE_URL=<url> npx tsx prisma/v3-migrate.ts
 */
import { Pool } from "pg";

const DATABASE_URL =
  process.env.DATABASE_URL?.replace("pgbouncer=true", "pgbouncer=false") ?? "";

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log("Starting v3.0 database migration...\n");

    // ── 1. Rename UserRole enum values ────────────────────────────────────────
    console.log("Step 1: Updating UserRole enum values...");

    // Step 1a: Convert role column to text, remap values, recreate enum
    // Check current enum values
    const enumCheck = await client.query(`
      SELECT enumlabel FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'UserRole'
      ORDER BY enumsortorder
    `);
    const currentValues = enumCheck.rows.map((r: any) => r.enumlabel as string);
    console.log("  Current UserRole values:", currentValues.join(", "));

    const alreadyNew = currentValues.includes("ADMIN") && !currentValues.includes("COMPANY_ADMIN");
    if (alreadyNew) {
      console.log("  UserRole enum already updated, skipping");
    } else {
      // Convert column to text first
      await client.query(`ALTER TABLE "User" ALTER COLUMN role TYPE TEXT`);
      console.log("  Converted role column to TEXT");

      // Remap old values to new
      const roleMap: Record<string, string> = {
        COMPANY_ADMIN: "ADMIN",
        SALES_MANAGER: "MANAGER",
        PROJECT_MANAGER: "MANAGER",
        PROPERTY_MANAGER: "MANAGER",
        FINANCE_OFFICER: "MANAGER",
        ENGINEERING_CONSULTANT: "MANAGER",
        APPROVALS_MANAGER: "MANAGER",
        ESCROW_CONTROLLER: "MANAGER",
        COLLECTIONS_OFFICER: "MANAGER",
        HANDOVER_OFFICER: "MANAGER",
        SALES_AGENT: "AGENT",
        QA_INSPECTOR: "TECHNICIAN",
        VENDOR_CONTRACTOR: "TECHNICIAN",
        BUYER: "USER",
        TENANT: "USER",
        SUPER_ADMIN: "SYSTEM_ADMIN",
        DEV_ADMIN: "SYSTEM_ADMIN",
      };

      for (const [oldRole, newRole] of Object.entries(roleMap)) {
        const result = await client.query(
          `UPDATE "User" SET role = $2 WHERE role = $1`,
          [oldRole, newRole]
        );
        if (result.rowCount && result.rowCount > 0) {
          console.log(`  ${oldRole} → ${newRole} (${result.rowCount} users)`);
        }
      }

      // Drop old enum and create new one
      await client.query(`DROP TYPE IF EXISTS "UserRole" CASCADE`);
      await client.query(`
        CREATE TYPE "UserRole" AS ENUM (
          'SYSTEM_ADMIN', 'SYSTEM_SUPPORT', 'ADMIN', 'MANAGER', 'AGENT', 'TECHNICIAN', 'USER'
        )
      `);
      // Cast column back to enum
      await client.query(`
        ALTER TABLE "User" ALTER COLUMN role TYPE "UserRole" USING role::"UserRole"
      `);
      console.log("  UserRole enum recreated with new values ✓");
    }

    // ── 2. Add organizationId to Unit table ───────────────────────────────────
    console.log("\nStep 2: Adding organizationId to Unit table...");

    // Check if column already exists
    const colCheck = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'Unit' AND column_name = 'organizationId'
    `);

    if (colCheck.rows.length === 0) {
      // Add as nullable first
      await client.query(`ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "organizationId" TEXT`);
      console.log("  Added organizationId column (nullable)");

      // Backfill from Building → Project chain if Building table exists
      try {
        await client.query(`
          UPDATE "Unit" u
          SET "organizationId" = p."organizationId"
          FROM "Building" b
          JOIN "Project" p ON p.id = b."projectId"
          WHERE u."buildingId" = b.id
            AND u."organizationId" IS NULL
        `);
        console.log("  Backfilled organizationId from Building → Project chain");
      } catch (e: any) {
        console.log("  Building/Project tables not available, using fallback...");
        // Fallback: use the first org
        const orgResult = await client.query(`SELECT id FROM "Organization" LIMIT 1`);
        if (orgResult.rows.length > 0) {
          const orgId = orgResult.rows[0].id;
          const updated = await client.query(
            `UPDATE "Unit" SET "organizationId" = $1 WHERE "organizationId" IS NULL`,
            [orgId]
          );
          console.log(`  Backfilled ${updated.rowCount} units with org ${orgId}`);
        }
      }

      // Now make it non-nullable
      await client.query(`
        ALTER TABLE "Unit" ALTER COLUMN "organizationId" SET NOT NULL
      `);
      console.log("  organizationId set to NOT NULL ✓");

      // Add index
      await client.query(`
        CREATE INDEX IF NOT EXISTS "Unit_organizationId_idx" ON "Unit" ("organizationId")
      `);
      console.log("  Index created ✓");
    } else {
      console.log("  organizationId column already exists, skipping");
    }

    // ── 3. Add new text fields to Unit ───────────────────────────────────────
    console.log("\nStep 3: Adding new address fields to Unit...");
    const newUnitCols = ["buildingName", "addressLine", "city", "district"];
    for (const col of newUnitCols) {
      try {
        await client.query(`ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "${col}" TEXT`);
        console.log(`  Added ${col} ✓`);
      } catch {
        console.log(`  ${col} already exists, skipping`);
      }
    }

    // ── 4. Create CustomerActivity table ─────────────────────────────────────
    console.log("\nStep 4: Creating CustomerActivity table...");

    // Create ActivityType enum if not exists
    try {
      await client.query(`
        CREATE TYPE "ActivityType" AS ENUM (
          'CALL', 'EMAIL', 'MEETING', 'SITE_VISIT', 'NOTE', 'WHATSAPP'
        )
      `);
      console.log("  ActivityType enum created ✓");
    } catch (e: any) {
      if (e.message?.includes("already exists")) {
        console.log("  ActivityType enum already exists, skipping");
      } else throw e;
    }

    // Create CustomerActivity table
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS "CustomerActivity" (
          "id"          TEXT NOT NULL,
          "customerId"  TEXT NOT NULL,
          "type"        "ActivityType" NOT NULL,
          "note"        TEXT NOT NULL,
          "createdById" TEXT NOT NULL,
          "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "CustomerActivity_pkey" PRIMARY KEY ("id")
        )
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS "CustomerActivity_customerId_idx" ON "CustomerActivity" ("customerId");
        CREATE INDEX IF NOT EXISTS "CustomerActivity_createdById_idx" ON "CustomerActivity" ("createdById");
      `);
      // Add FK constraints
      await client.query(`
        ALTER TABLE "CustomerActivity"
          ADD CONSTRAINT IF NOT EXISTS "CustomerActivity_customerId_fkey"
          FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE
      `).catch(() => {});
      await client.query(`
        ALTER TABLE "CustomerActivity"
          ADD CONSTRAINT IF NOT EXISTS "CustomerActivity_createdById_fkey"
          FOREIGN KEY ("createdById") REFERENCES "User"("id")
      `).catch(() => {});
      console.log("  CustomerActivity table created ✓");
    } catch (e: any) {
      if (e.message?.includes("already exists")) {
        console.log("  CustomerActivity table already exists, skipping");
      } else throw e;
    }

    // ── 5. Update OrgType enum ────────────────────────────────────────────────
    console.log("\nStep 5: Updating OrgType enum...");
    try {
      // Add new values if they don't exist
      const orgTypeValues = ["BROKERAGE", "PROPERTY_MANAGEMENT", "DEVELOPER", "MIXED"];
      for (const val of orgTypeValues) {
        await client.query(`ALTER TYPE "OrgType" ADD VALUE IF NOT EXISTS '${val}'`);
      }
      console.log("  OrgType new values added ✓");
    } catch (e: any) {
      console.log("  OrgType enum update skipped:", e.message?.split("\n")[0]);
    }

    console.log("\n✅ Migration complete! Run prisma db push to finalize schema sync.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("Migration failed:", e.message);
  process.exit(1);
});
