import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "../../../auth";
import { hasPermission } from "../../../lib/permissions";

const f = createUploadthing();

/**
 * Shared auth middleware for all upload routes.
 * Validates session, checks documents:write permission, and returns org-scoped metadata.
 */
async function authMiddleware() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const role = (session.user as any).role ?? "USER";
  const organizationId = (session.user as any).organizationId;

  if (!hasPermission(role, "documents:write")) {
    throw new Error("Insufficient permissions");
  }

  return {
    userId: session.user.id,
    organizationId,
    role,
  };
}

export const ourFileRouter = {
  contractUploader: f({ pdf: { maxFileSize: "16MB" } })
    .middleware(authMiddleware)
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, organizationId: metadata.organizationId };
    }),

  blueprintUploader: f({ image: { maxFileSize: "32MB" }, pdf: { maxFileSize: "32MB" } })
    .middleware(authMiddleware)
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, organizationId: metadata.organizationId };
    }),

  // Balady & project documents: PDF, images, DWG, and common formats
  projectDocumentUploader: f({
    pdf: { maxFileSize: "32MB", maxFileCount: 10 },
    image: { maxFileSize: "16MB", maxFileCount: 10 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { maxFileSize: "16MB", maxFileCount: 5 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "16MB", maxFileCount: 5 },
  })
    .middleware(authMiddleware)
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, organizationId: metadata.organizationId, url: file.url, name: file.name };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
