"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";
import { notifyAdmins } from "../../lib/create-notification";

// ─── Compliance Check Engine ────────────────────────────────────────────────

export async function runComplianceCheck(scenarioId: string) {
  const session = await requirePermission("planning:compliance");
  const orgId = session.organizationId;

  const scenario = await db.planningScenario.findFirst({
    where: { id: scenarioId, organizationId: orgId },
    include: {
      subdivisionPlan: {
        include: { plots: true, roads: true, blocks: true },
      },
      workspace: true,
    },
  });
  if (!scenario) throw new Error("Planning scenario not found. Please refresh and try again.");
  if (!scenario.subdivisionPlan) throw new Error("This scenario does not have a subdivision plan. Please create a subdivision plan first.");

  // Get applicable rules
  const rules = await db.ruleTemplate.findMany({
    where: {
      OR: [
        { organizationId: orgId },
        { isDefault: true, organizationId: null },
      ],
      isActive: true,
    },
  });

  // Clear previous results
  await db.complianceResult.deleteMany({
    where: { scenarioId },
  });

  const results: any[] = [];
  const sp = scenario.subdivisionPlan;

  for (const rule of rules) {
    const ruleScope = rule.landUseScope ?? [];

    // ── Plot-level checks ──
    if (["MIN_AREA", "MAX_AREA", "MIN_FRONTAGE", "MAX_FRONTAGE", "MIN_DEPTH", "MAX_DEPTH"].includes(rule.category)) {
      for (const plot of sp.plots) {
        // Check land use scope
        if (ruleScope.length > 0 && !ruleScope.includes(plot.landUse || "")) continue;

        let actualValue = 0;
        let applies = false;

        if (rule.category === "MIN_AREA" || rule.category === "MAX_AREA") {
          actualValue = plot.areaSqm ?? 0;
          applies = actualValue > 0;
        } else if (rule.category === "MIN_FRONTAGE" || rule.category === "MAX_FRONTAGE") {
          const dims = plot.dimensions as any;
          actualValue = dims?.frontage ?? 0;
          applies = actualValue > 0;
        } else if (rule.category === "MIN_DEPTH" || rule.category === "MAX_DEPTH") {
          const dims = plot.dimensions as any;
          actualValue = dims?.depth ?? 0;
          applies = actualValue > 0;
        }

        if (!applies) continue;

        const passed = evaluateRule(rule.operator, rule.value, rule.valueTo, actualValue);
        const status = passed ? "PASS" : "FAIL";

        results.push({
          scenarioId,
          ruleId: rule.id,
          status,
          actualValue,
          expectedValue: formatExpectedValue(rule),
          featureId: plot.id,
          featureType: "PLOT",
          featureLabel: `Plot ${plot.plotNumber}`,
          organizationId: orgId,
        });
      }
    }

    // ── Road-level checks ──
    if (rule.category === "MIN_ROAD_WIDTH") {
      for (const road of sp.roads) {
        const actualValue = road.widthMeters ?? 0;
        if (actualValue <= 0) continue;

        // Match rule name pattern to road type
        const roadTypeMatches = matchRoadTypeToRule(rule.name, road.type);
        if (!roadTypeMatches) continue;

        const passed = evaluateRule(rule.operator, rule.value, rule.valueTo, actualValue);

        results.push({
          scenarioId,
          ruleId: rule.id,
          status: passed ? "PASS" : "FAIL",
          actualValue,
          expectedValue: formatExpectedValue(rule),
          featureId: road.id,
          featureType: "ROAD",
          featureLabel: road.name || `Road (${road.type})`,
          organizationId: orgId,
        });
      }
    }

    // ── Plan-level checks ──
    if (rule.category === "MIN_OPEN_SPACE" || rule.category === "MAX_COVERAGE" || rule.category === "MAX_DENSITY") {
      const totalArea = sp.totalAreaSqm ?? 0;
      if (totalArea <= 0) continue;

      const plotArea = sp.plots.reduce((sum, p) => sum + (p.areaSqm ?? 0), 0);
      const roadArea = sp.roads.reduce((sum, r) => sum + (r.areaSqm ?? 0), 0);
      const openSpaceArea = totalArea - plotArea - roadArea;

      let actualValue = 0;
      if (rule.category === "MIN_OPEN_SPACE") {
        actualValue = (openSpaceArea / totalArea) * 100;
      } else if (rule.category === "MAX_COVERAGE") {
        actualValue = (plotArea / totalArea) * 100;
      }

      const passed = evaluateRule(rule.operator, rule.value, rule.valueTo, actualValue);

      results.push({
        scenarioId,
        ruleId: rule.id,
        status: passed ? "PASS" : "FAIL",
        actualValue: Math.round(actualValue * 10) / 10,
        expectedValue: formatExpectedValue(rule),
        featureId: null,
        featureType: "PLAN",
        featureLabel: sp.name || "Subdivision Plan",
        organizationId: orgId,
      });
    }
  }

  // Batch insert results
  if (results.length > 0) {
    await db.complianceResult.createMany({ data: results });
  }

  // Send notification
  const failCount = results.filter((r) => r.status === "FAIL").length;
  const passCount = results.filter((r) => r.status === "PASS").length;

  await notifyAdmins({
    type: "PLANNING_COMPLIANCE_COMPLETE",
    title: `اكتمل فحص الامتثال: ${scenario.name}`,
    titleEn: `Compliance check completed: ${scenario.name}`,
    message: `نجح ${passCount}، فشل ${failCount} من أصل ${results.length} اختبار`,
    messageEn: `${passCount} passed, ${failCount} failed out of ${results.length} checks`,
    link: `/dashboard/planning/${scenario.workspaceId}`,
    organizationId: orgId,
  });

  return {
    total: results.length,
    passed: passCount,
    failed: failCount,
    warnings: results.filter((r) => r.status === "WARNING").length,
    complianceScore: results.length > 0 ? Math.round((passCount / results.length) * 100) : 100,
  };
}

export async function getComplianceResults(scenarioId: string) {
  const session = await requirePermission("planning:read");
  const orgId = session.organizationId;

  const results = await db.complianceResult.findMany({
    where: { scenarioId, organizationId: orgId },
    include: { rule: true },
    orderBy: [{ status: "asc" }, { featureType: "asc" }, { featureLabel: "asc" }],
  });

  return JSON.parse(JSON.stringify(results));
}

export async function getComplianceSummary(scenarioId: string) {
  const session = await requirePermission("planning:read");
  const orgId = session.organizationId;

  const results = await db.complianceResult.findMany({
    where: { scenarioId, organizationId: orgId },
    select: { status: true },
  });

  const total = results.length;
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const warnings = results.filter((r) => r.status === "WARNING").length;

  return {
    total,
    passed,
    failed,
    warnings,
    complianceScore: total > 0 ? Math.round((passed / total) * 100) : 100,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function evaluateRule(operator: string, value: number, valueTo: number | null, actual: number): boolean {
  switch (operator) {
    case "MIN": return actual >= value;
    case "MAX": return actual <= value;
    case "EQUALS": return actual === value;
    case "BETWEEN": return actual >= value && actual <= (valueTo ?? Infinity);
    default: return true;
  }
}

function formatExpectedValue(rule: any): string {
  const unitLabel: Record<string, string> = {
    SQM: "m²",
    METERS: "m",
    RATIO: "",
    PERCENT: "%",
    UNITS_PER_HA: "units/ha",
  };
  const u = unitLabel[rule.unit] || rule.unit;

  switch (rule.operator) {
    case "MIN": return `≥ ${rule.value} ${u}`;
    case "MAX": return `≤ ${rule.value} ${u}`;
    case "EQUALS": return `= ${rule.value} ${u}`;
    case "BETWEEN": return `${rule.value}–${rule.valueTo} ${u}`;
    default: return `${rule.value} ${u}`;
  }
}

function matchRoadTypeToRule(ruleName: string, roadType: string): boolean {
  const nameLower = ruleName.toLowerCase();
  if (nameLower.includes("primary") && roadType === "PRIMARY") return true;
  if (nameLower.includes("secondary") && roadType === "SECONDARY") return true;
  if (nameLower.includes("local") && roadType === "LOCAL") return true;
  if (nameLower.includes("service") && roadType === "SERVICE") return true;
  // If rule doesn't specify a road type, apply to all
  if (!nameLower.includes("primary") && !nameLower.includes("secondary") && !nameLower.includes("local") && !nameLower.includes("service")) {
    return true;
  }
  return false;
}
