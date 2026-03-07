-- Enable RLS on core multi-tenant tables
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lease" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RentInstallment" ENABLE ROW LEVEL SECURITY;

-- Create Policies based on 'app.current_org_id' session variable
-- This assumes the application sets this variable before executing queries.

-- Projects Policy
CREATE POLICY "org_isolation_projects" ON "Project"
  USING ("organizationId" = current_setting('app.current_org_id'));

-- Leads Policy
CREATE POLICY "org_isolation_leads" ON "Lead"
  USING ("organizationId" = current_setting('app.current_org_id'));

-- Leases Policy
-- Note: Lease table doesn't have organizationId directly, but it links to Unit which links to Building which links to Project.
-- However, for performance and simplicity in RLS, it's often better to denormalize organizationId to these tables.
-- RECOMMENDATION: Add organizationId to Lease, Unit, Building, etc. for cleaner RLS.

-- To enable RLS for tables without organizationId, we'd need subqueries:
-- CREATE POLICY "org_isolation_units" ON "Unit"
--   USING (EXISTS (
--     SELECT 1 FROM "Building" b
--     JOIN "Project" p ON b."projectId" = p.id
--     WHERE b.id = "Unit"."buildingId" AND p."organizationId" = current_setting('app.current_org_id')
--   ));

-- Helper Function to set org context
CREATE OR REPLACE FUNCTION set_org_context(org_id TEXT) RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_org_id', org_id, false);
END;
$$ LANGUAGE plpgsql;
