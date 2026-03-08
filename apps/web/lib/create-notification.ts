import { db } from "@repo/db";

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  titleEn: string;
  message: string;
  messageEn: string;
  link?: string;
  organizationId: string;
}) {
  return db.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      titleEn: params.titleEn,
      message: params.message,
      messageEn: params.messageEn,
      link: params.link,
      read: false,
      organizationId: params.organizationId,
    },
  });
}

/**
 * Notify all admins (SUPER_ADMIN, DEV_ADMIN) in an organization.
 */
export async function notifyAdmins(params: {
  type: string;
  title: string;
  titleEn: string;
  message: string;
  messageEn: string;
  link?: string;
  organizationId: string;
}) {
  const admins = await db.user.findMany({
    where: {
      organizationId: params.organizationId,
      role: { in: ["SUPER_ADMIN", "DEV_ADMIN"] },
    },
    select: { id: true },
  });

  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin.id,
        type: params.type,
        title: params.title,
        titleEn: params.titleEn,
        message: params.message,
        messageEn: params.messageEn,
        link: params.link,
        organizationId: params.organizationId,
      })
    )
  );
}
