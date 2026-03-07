"use server";

import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { getSessionOrThrow } from "../../lib/auth-helpers";

export async function updateCustomerStatus(customerId: string, status: any) {
  const session = await getSessionOrThrow();

  const customer = await db.customer.update({
    where: { id: customerId, organizationId: session.organizationId },
    data: { status },
  });

  revalidatePath("/dashboard/sales/customers");
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
  const session = await getSessionOrThrow();

  const customer = await db.customer.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      source: data.source,
      status: data.status,
      nationalId: data.nationalId,
      nameArabic: data.nameArabic,
      personType: data.personType,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      dateOfBirthHijri: data.dateOfBirthHijri,
      nationality: data.nationality,
      nationalityCode: data.nationalityCode,
      maritalStatus: data.maritalStatus,
      address: data.address,
      documentInfo: data.documentInfo,
      organizationId: session.organizationId,
    },
  });

  revalidatePath("/dashboard/sales/customers");
  return customer;
}

export async function getCustomer(customerId: string) {
  const session = await getSessionOrThrow();

  return await db.customer.findFirst({
    where: { id: customerId, organizationId: session.organizationId },
    include: {
      agent: { select: { id: true, name: true, email: true } },
      leases: { include: { unit: true }, orderBy: { createdAt: "desc" } },
      contracts: { include: { unit: true }, orderBy: { createdAt: "desc" } },
      reservations: { include: { unit: true }, orderBy: { createdAt: "desc" } },
    },
  });
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
  const session = await getSessionOrThrow();

  const updateData: any = { ...data };
  if (data.dateOfBirth) updateData.dateOfBirth = new Date(data.dateOfBirth);

  const customer = await db.customer.update({
    where: { id: customerId, organizationId: session.organizationId },
    data: updateData,
  });

  revalidatePath("/dashboard/sales/customers");
  return customer;
}

export async function getCustomers(filters?: {
  status?: string;
  search?: string;
}) {
  const session = await getSessionOrThrow();

  const where: any = { organizationId: session.organizationId };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { nameArabic: { contains: filters.search, mode: "insensitive" } },
      { phone: { contains: filters.search } },
      { email: { contains: filters.search, mode: "insensitive" } },
      { nationalId: { contains: filters.search } },
    ];
  }

  return await db.customer.findMany({
    where,
    include: {
      agent: { select: { id: true, name: true, email: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function deleteCustomer(customerId: string) {
  const session = await getSessionOrThrow();

  await db.customer.delete({
    where: { id: customerId, organizationId: session.organizationId },
  });

  revalidatePath("/dashboard/sales/customers");
}
