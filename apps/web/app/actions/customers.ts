"use server";

import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requirePermission, getSessionWithPermissions } from "../../lib/auth-helpers";
import { logAuditEvent } from "../../lib/audit";
import { encryptCustomerData, decryptCustomerData, decryptCustomerList } from "../../lib/pii-crypto";
import { maskCustomerPii } from "../../lib/pii-masking";
import { hashForSearch } from "../../lib/encryption";

export async function updateCustomerStatus(customerId: string, status: any) {
  const session = await requirePermission("customers:write");

  const customer = await db.customer.update({
    where: { id: customerId, organizationId: session.organizationId },
    data: { status },
  });

  logAuditEvent({ userId: session.userId, userEmail: session.email, userRole: session.role, action: "UPDATE", resource: "Customer", resourceId: customerId, metadata: { field: "status", newStatus: status }, organizationId: session.organizationId });

  revalidatePath("/dashboard/crm");
  return customer;
}

export async function createCustomer(data: {
  name: string;
  phone: string;
  email?: string;
  source?: string;
  status?: any;
  nationalId?: string;
  nameArabic?: string;
  personType?: any;
  gender?: any;
  dateOfBirth?: string;
  dateOfBirthHijri?: string;
  nationality?: string;
  nationalityCode?: string;
  maritalStatus?: string;
  address?: any;
  documentInfo?: any;
}) {
  const session = await requirePermission("customers:write");

  // Encrypt PII fields before saving
  const encryptedData = encryptCustomerData({
    nationalId: data.nationalId,
    phone: data.phone,
    email: data.email,
  });

  const customer = await db.customer.create({
    data: {
      name: data.name,
      phone: encryptedData.phone,
      email: encryptedData.email || undefined,
      source: data.source || undefined,
      status: data.status || undefined,
      nationalId: encryptedData.nationalId,
      nationalIdHash: encryptedData.nationalIdHash,
      phoneHash: encryptedData.phoneHash,
      emailHash: encryptedData.emailHash,
      nameArabic: data.nameArabic || undefined,
      personType: data.personType || undefined,
      gender: data.gender || undefined,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      dateOfBirthHijri: data.dateOfBirthHijri || undefined,
      nationality: data.nationality || undefined,
      nationalityCode: data.nationalityCode || undefined,
      maritalStatus: data.maritalStatus || undefined,
      address: data.address || undefined,
      documentInfo: data.documentInfo || undefined,
      organizationId: session.organizationId,
    },
  });

  logAuditEvent({ userId: session.userId, userEmail: session.email, userRole: session.role, action: "CREATE", resource: "Customer", resourceId: customer.id, organizationId: session.organizationId });

  revalidatePath("/dashboard/crm");
  return customer;
}

export async function getCustomer(customerId: string) {
  const session = await getSessionWithPermissions();
  const hasPiiAccess = session.can("customers:read_pii");

  const customer = await db.customer.findFirst({
    where: { id: customerId, organizationId: session.organizationId },
    include: {
      agent: { select: { id: true, name: true, email: true } },
      leases: { include: { unit: true }, orderBy: { createdAt: "desc" } },
      contracts: { include: { unit: true }, orderBy: { createdAt: "desc" } },
      reservations: { include: { unit: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!customer) return null;

  // Decrypt then mask based on permissions
  const decrypted = decryptCustomerData(customer);
  const masked = maskCustomerPii(decrypted, hasPiiAccess);

  logAuditEvent({ userId: session.userId, userEmail: session.email, userRole: session.role, action: hasPiiAccess ? "READ_PII" : "READ", resource: "Customer", resourceId: customerId, organizationId: session.organizationId });

  return JSON.parse(JSON.stringify(masked));
}

export async function updateCustomer(
  customerId: string,
  data: {
    name?: string;
    phone?: string;
    email?: string;
    nationalId?: string;
    nameArabic?: string;
    personType?: any;
    gender?: any;
    dateOfBirth?: string;
    dateOfBirthHijri?: string;
    nationality?: string;
    nationalityCode?: string;
    maritalStatus?: string;
    address?: any;
    documentInfo?: any;
    source?: string;
  }
) {
  const session = await requirePermission("customers:write");

  // Sanitize empty strings to undefined for enum/optional fields
  const updateData: any = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v === "" ? undefined : v])
  );
  if (data.dateOfBirth) updateData.dateOfBirth = new Date(data.dateOfBirth);

  // Encrypt PII fields if being updated
  if (data.nationalId) {
    const enc = encryptCustomerData({ nationalId: data.nationalId });
    updateData.nationalId = enc.nationalId;
    updateData.nationalIdHash = enc.nationalIdHash;
  }
  if (data.phone) {
    const enc = encryptCustomerData({ phone: data.phone });
    updateData.phone = enc.phone;
    updateData.phoneHash = enc.phoneHash;
  }
  if (data.email) {
    const enc = encryptCustomerData({ email: data.email });
    updateData.email = enc.email;
    updateData.emailHash = enc.emailHash;
  }

  const customer = await db.customer.update({
    where: { id: customerId, organizationId: session.organizationId },
    data: updateData,
  });

  logAuditEvent({ userId: session.userId, userEmail: session.email, userRole: session.role, action: "UPDATE", resource: "Customer", resourceId: customerId, metadata: { fields: Object.keys(data) }, organizationId: session.organizationId });

  revalidatePath("/dashboard/crm");
  return customer;
}

export async function getCustomers(filters?: {
  status?: string;
  search?: string;
}) {
  const session = await getSessionWithPermissions();
  const hasPiiAccess = session.can("customers:read_pii");

  const where: any = { organizationId: session.organizationId };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.search) {
    const searchHash = hashForSearch(filters.search);
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { nameArabic: { contains: filters.search, mode: "insensitive" } },
      // Exact match via hash for encrypted fields
      { phoneHash: searchHash },
      { emailHash: searchHash },
      { nationalIdHash: searchHash },
    ];
  }

  const results = await db.customer.findMany({
    where,
    include: {
      agent: { select: { id: true, name: true, email: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Decrypt then mask based on permissions
  const decrypted = decryptCustomerList(results);
  const masked = decrypted.map((c) => maskCustomerPii(c, hasPiiAccess));

  logAuditEvent({ userId: session.userId, userEmail: session.email, userRole: session.role, action: hasPiiAccess ? "READ_PII" : "READ", resource: "Customer", metadata: { filters, count: results.length }, organizationId: session.organizationId });

  return masked;
}

export async function deleteCustomer(customerId: string) {
  const session = await requirePermission("customers:delete");

  await db.customer.delete({
    where: { id: customerId, organizationId: session.organizationId },
  });

  logAuditEvent({ userId: session.userId, userEmail: session.email, userRole: session.role, action: "DELETE", resource: "Customer", resourceId: customerId, organizationId: session.organizationId });

  revalidatePath("/dashboard/crm");
}

export async function getCustomerUnitAssignments(customerId: string) {
  const session = await requirePermission("customers:read");
  const orgId = session.organizationId;

  const customer = await db.customer.findFirst({
    where: { id: customerId, organizationId: orgId },
    include: {
      reservations: {
        where: { status: { in: ["PENDING", "CONFIRMED"] } },
        include: { unit: true },
      },
      contracts: {
        where: { status: "SIGNED" },
        include: { unit: true },
      },
      leases: {
        where: { status: "ACTIVE" },
        include: { unit: true },
      },
    },
  });

  if (!customer) throw new Error("Customer not found or you don't have access. Please verify the customer exists in your organization.");

  const units = [
    ...customer.reservations.map(r => ({ unitId: r.unit.id, unitNumber: r.unit.number, building: r.unit.buildingName ?? r.unit.city ?? "—", type: "reservation" as const, status: r.status })),
    ...customer.contracts.map(c => ({ unitId: c.unit.id, unitNumber: c.unit.number, building: c.unit.buildingName ?? c.unit.city ?? "—", type: "contract" as const, status: c.status })),
    ...customer.leases.map(l => ({ unitId: l.unit.id, unitNumber: l.unit.number, building: l.unit.buildingName ?? l.unit.city ?? "—", type: "lease" as const, status: l.status })),
  ];

  return JSON.parse(JSON.stringify(units));
}

export async function addCustomerActivity(
  customerId: string,
  data: { type: string; note: string }
) {
  const session = await requirePermission("crm:write");

  const customer = await db.customer.findFirst({
    where: { id: customerId, organizationId: session.organizationId },
  });
  if (!customer) throw new Error("Customer not found or you don't have access.");

  const activity = await db.customerActivity.create({
    data: {
      customerId,
      type: data.type as any,
      note: data.note,
      createdById: session.userId,
    },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });

  revalidatePath("/dashboard/crm");
  return JSON.parse(JSON.stringify(activity));
}

export async function getCustomerActivities(customerId: string) {
  const session = await requirePermission("crm:read");

  const customer = await db.customer.findFirst({
    where: { id: customerId, organizationId: session.organizationId },
  });
  if (!customer) throw new Error("Customer not found or you don't have access.");

  const activities = await db.customerActivity.findMany({
    where: { customerId },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return JSON.parse(JSON.stringify(activities));
}

export async function deleteCustomerActivity(activityId: string) {
  const session = await requirePermission("crm:write");

  const activity = await db.customerActivity.findFirst({
    where: { id: activityId },
    include: { customer: { select: { organizationId: true } } },
  });

  if (!activity || activity.customer.organizationId !== session.organizationId) {
    throw new Error("Activity not found or you don't have access.");
  }

  await db.customerActivity.delete({ where: { id: activityId } });
  revalidatePath("/dashboard/crm");
}
