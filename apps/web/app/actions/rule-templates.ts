"use server";

import { db } from "@repo/db";
import { requirePermission } from "../../lib/auth-helpers";

// ─── Rule Templates CRUD ────────────────────────────────────────────────────

export async function getRuleTemplates() {
  const session = await requirePermission("planning:compliance");
  const orgId = session.organizationId;

  // Get org-specific and system default templates
  const templates = await db.ruleTemplate.findMany({
    where: {
      OR: [
        { organizationId: orgId },
        { isDefault: true, organizationId: null },
      ],
      isActive: true,
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return JSON.parse(JSON.stringify(templates));
}

export async function createRuleTemplate(data: {
  name: string;
  nameArabic?: string;
  description?: string;
  category: string;
  operator: string;
  value: number;
  valueTo?: number;
  unit: string;
  landUseScope?: string[];
  regionScope?: string;
}) {
  const session = await requirePermission("planning:compliance");
  const orgId = session.organizationId;

  const template = await db.ruleTemplate.create({
    data: {
      name: data.name,
      nameArabic: data.nameArabic,
      description: data.description,
      category: data.category as any,
      operator: data.operator as any,
      value: data.value,
      valueTo: data.valueTo,
      unit: data.unit,
      landUseScope: data.landUseScope ?? [],
      regionScope: data.regionScope,
      isDefault: false,
      organizationId: orgId,
    },
  });

  return JSON.parse(JSON.stringify(template));
}

export async function updateRuleTemplate(
  id: string,
  data: {
    name?: string;
    nameArabic?: string;
    description?: string;
    value?: number;
    valueTo?: number;
    isActive?: boolean;
    landUseScope?: string[];
    regionScope?: string;
  }
) {
  const session = await requirePermission("planning:compliance");
  const orgId = session.organizationId;

  const existing = await db.ruleTemplate.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Rule template not found. You can only edit organization-specific rules.");

  const updated = await db.ruleTemplate.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.nameArabic !== undefined && { nameArabic: data.nameArabic }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.value !== undefined && { value: data.value }),
      ...(data.valueTo !== undefined && { valueTo: data.valueTo }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.landUseScope !== undefined && { landUseScope: data.landUseScope }),
      ...(data.regionScope !== undefined && { regionScope: data.regionScope }),
    },
  });

  return JSON.parse(JSON.stringify(updated));
}

export async function deleteRuleTemplate(id: string) {
  const session = await requirePermission("planning:compliance");
  const orgId = session.organizationId;

  const existing = await db.ruleTemplate.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Rule template not found. You can only delete organization-specific rules.");

  await db.ruleTemplate.delete({ where: { id } });
}

// ─── Seed Default Saudi Planning Rules ──────────────────────────────────────

export async function seedDefaultRules() {
  const session = await requirePermission("planning:compliance");

  const existingDefaults = await db.ruleTemplate.count({ where: { isDefault: true } });
  if (existingDefaults > 0) return { message: "Default rules already exist" };

  const defaults = [
    { name: "Minimum Residential Plot Area", nameArabic: "الحد الأدنى لمساحة القطعة السكنية", category: "MIN_AREA", operator: "MIN", value: 200, unit: "SQM", landUseScope: ["RESIDENTIAL"] },
    { name: "Minimum Commercial Plot Area", nameArabic: "الحد الأدنى لمساحة القطعة التجارية", category: "MIN_AREA", operator: "MIN", value: 100, unit: "SQM", landUseScope: ["COMMERCIAL"] },
    { name: "Maximum Residential Plot Area", nameArabic: "الحد الأقصى لمساحة القطعة السكنية", category: "MAX_AREA", operator: "MAX", value: 2500, unit: "SQM", landUseScope: ["RESIDENTIAL"] },
    { name: "Minimum Plot Frontage", nameArabic: "الحد الأدنى لواجهة القطعة", category: "MIN_FRONTAGE", operator: "MIN", value: 10, unit: "METERS", landUseScope: [] },
    { name: "Minimum Plot Depth", nameArabic: "الحد الأدنى لعمق القطعة", category: "MIN_DEPTH", operator: "MIN", value: 15, unit: "METERS", landUseScope: [] },
    { name: "Minimum Primary Road Width", nameArabic: "الحد الأدنى لعرض الشارع الرئيسي", category: "MIN_ROAD_WIDTH", operator: "MIN", value: 30, unit: "METERS", landUseScope: [] },
    { name: "Minimum Secondary Road Width", nameArabic: "الحد الأدنى لعرض الشارع الفرعي", category: "MIN_ROAD_WIDTH", operator: "MIN", value: 15, unit: "METERS", landUseScope: [] },
    { name: "Minimum Local Road Width", nameArabic: "الحد الأدنى لعرض الشارع المحلي", category: "MIN_ROAD_WIDTH", operator: "MIN", value: 10, unit: "METERS", landUseScope: [] },
    { name: "Minimum Open Space Percentage", nameArabic: "الحد الأدنى لنسبة المساحات المفتوحة", category: "MIN_OPEN_SPACE", operator: "MIN", value: 10, unit: "PERCENT", landUseScope: [] },
    { name: "Maximum FAR Residential", nameArabic: "الحد الأقصى لمعامل البناء السكني", category: "MAX_FAR", operator: "MAX", value: 2.5, unit: "RATIO", landUseScope: ["RESIDENTIAL"] },
    { name: "Maximum FAR Commercial", nameArabic: "الحد الأقصى لمعامل البناء التجاري", category: "MAX_FAR", operator: "MAX", value: 4.0, unit: "RATIO", landUseScope: ["COMMERCIAL"] },
    { name: "Maximum Ground Coverage", nameArabic: "الحد الأقصى لنسبة البناء الأرضية", category: "MAX_COVERAGE", operator: "MAX", value: 60, unit: "PERCENT", landUseScope: [] },
  ];

  for (const rule of defaults) {
    await db.ruleTemplate.create({
      data: {
        ...rule,
        category: rule.category as any,
        operator: rule.operator as any,
        isDefault: true,
        isActive: true,
        organizationId: null,
      },
    });
  }

  return { message: `Created ${defaults.length} default rules` };
}
