import { requireAdmin } from "@/app/lib/admin-auth";
import AdminDashboard from "./_components/AdminDashboard";

export default async function AdminPage() {
  await requireAdmin();
  return <AdminDashboard />;
}
