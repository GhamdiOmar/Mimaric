import { db } from "@repo/db";

export async function createNotification({
  userId,
  type,
  title,
  titleEn,
  message,
  messageEn,
  link,
  organizationId,
}: {
  userId: string;
  type: string;
  title: string;
  titleEn?: string;
  message: string;
  messageEn?: string;
  link?: string;
  organizationId: string;
}) {
  try {
    await db.notification.create({
      data: { userId, type, title, titleEn, message, messageEn, link, organizationId },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}
