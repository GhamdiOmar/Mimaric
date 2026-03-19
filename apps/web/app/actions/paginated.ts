"use server";

import { db } from "@repo/db";

export interface PaginatedParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Generic paginated query helper.
 * Wraps Prisma findMany + count in a single Promise.all for efficiency.
 *
 * Usage:
 *   const result = await paginatedQuery("contract", {
 *     where: { organizationId },
 *     include: { customer: true },
 *     orderBy: { createdAt: "desc" },
 *     page: 1,
 *     pageSize: 25,
 *   });
 *
 * Pattern borrowed from getAuditLogs() in /apps/web/app/actions/audit.ts
 */
export async function paginatedQuery<T = any>(
  model: string,
  params: {
    where?: any;
    include?: any;
    select?: any;
    orderBy?: any;
    page?: number;
    pageSize?: number;
  }
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25));
  const skip = (page - 1) * pageSize;

  const prismaModel = (db as any)[model];
  if (!prismaModel) {
    throw new Error("An unexpected error occurred while loading data. Please try again or contact support.");
  }

  const findArgs: any = {
    where: params.where,
    orderBy: params.orderBy ?? { createdAt: "desc" },
    skip,
    take: pageSize,
  };

  // include and select are mutually exclusive in Prisma
  if (params.select) {
    findArgs.select = params.select;
  } else if (params.include) {
    findArgs.include = params.include;
  }

  const [data, total] = await Promise.all([
    prismaModel.findMany(findArgs),
    prismaModel.count({ where: params.where }),
  ]);

  return {
    data: JSON.parse(JSON.stringify(data)) as T[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
