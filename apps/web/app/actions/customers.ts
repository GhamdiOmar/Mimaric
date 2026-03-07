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
}) {
  const session = await getSessionOrThrow();

  const customer = await db.customer.create({
    data: {
      ...data,
      organizationId: session.organizationId,
    },
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
      { phone: { contains: filters.search } },
      { email: { contains: filters.search, mode: "insensitive" } },
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
