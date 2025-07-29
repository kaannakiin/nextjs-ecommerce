import { auth } from "@/lib/auth";
import AdminLayoutShell from "./_components/AdminLayoutShell";
import { notFound } from "next/navigation";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();
  if (!session) {
    return notFound();
  }
  return <AdminLayoutShell session={session}>{children}</AdminLayoutShell>;
};

export default AdminLayout;
