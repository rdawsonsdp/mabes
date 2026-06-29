import { requireAdmin } from "@/app/lib/supabase/admin-auth";
import { getAllCateringMenuItems } from "@/app/lib/catering/admin-queries";
import { AdminNav } from "@/app/components/admin/AdminNav";
import { AdminMenuEditor } from "@/app/components/admin/AdminMenuEditor";

// Auth-gated catering menu editor. requireAdmin() redirects to /admin/login when
// there is no signed-in admin. The catalog is read on the server (all items,
// incl. sold-out) and handed to the client editor.
export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  await requireAdmin();
  const items = await getAllCateringMenuItems();
  return (
    <>
      <AdminNav />
      <AdminMenuEditor initialItems={items} />
    </>
  );
}
