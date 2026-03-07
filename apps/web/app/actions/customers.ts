"use server";

import { db } from "@repo/db";
import { auth } from "../../auth";
import { revalidatePath } from "next/cache";

export async function updateCustomerStatus(customerId: string, status: any) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const customer = await db.customer.update({
    where: { id: customerId },
    data: { status },
  });

  revalidatePath("/dashboard/sales/customers");
  return customer;
}

export async function createCustomer(data: {
  name: string;
  phone: string;
  email?: string;
  status?: any;
}) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { organizationId: true }
  });

  if (!user?.organizationId) throw new Error("User has no organization");

  const customer = await db.customer.create({
    data: {
      ...data,
      organizationId: user.organizationId,
    },
  });

  revalidatePath("/dashboard/sales/customers");
  return customer;
}

export async function getCustomers() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return await db.customer.findMany({
    orderBy: {
      updatedAt: 'desc'
    }
  });
}
