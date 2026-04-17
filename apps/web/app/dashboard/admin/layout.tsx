import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { isSystemRole } from "../../../lib/permissions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!isSystemRole(session?.user?.role ?? "")) {
    redirect("/dashboard");
  }
  return <>{children}</>;
}
