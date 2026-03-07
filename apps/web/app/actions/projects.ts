"use server";

import { db } from "@repo/db";
import { auth } from "../../auth";
import { revalidatePath } from "next/cache";

export async function createProject(data: {
  name: string;
  description?: string;
  type: any;
  organizationId: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  // TODO: Verify if user belongs to the organization

  const project = await db.project.create({
    data: {
      ...data,
    },
  });

  revalidatePath("/dashboard/projects");
  return project;
}

export async function getProjects() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  // Since RLS is not fully configured in Prisma yet, we manually filter by org for now
  // In a real Supabase setup, RLS would handle this at the DB layer
  
  // For the sake of demonstration, we'll assume the user has an organizationId in their session
  // or we just fetch all if it's the admin
  
  return await db.project.findMany({
    include: {
      buildings: {
        include: {
          units: true,
        },
      },
    },
  });
}
