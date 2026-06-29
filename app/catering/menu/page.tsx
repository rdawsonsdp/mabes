import { catalog, groupByMenu } from "@/app/lib/catalog/catalog";
import { CateringCartProvider } from "@/app/components/catering/CateringCartProvider";
import { CateringStore } from "@/app/components/catering/CateringStore";

// Catering catalog is read on the server (Supabase), then handed to the
// client-only catering cart (Context + sessionStorage). The regular cart is
// untouched. The DB is only written at order submit (Subsystem C).
export const dynamic = "force-dynamic";

export default async function CateringMenuPage() {
  const products = await catalog.getCateringProducts();
  const menus = groupByMenu(products);

  return (
    <CateringCartProvider>
      <CateringStore menus={menus} />
    </CateringCartProvider>
  );
}
