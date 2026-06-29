import { CateringCartProvider } from "@/app/components/catering/CateringCartProvider";
import { CheckoutClient } from "./CheckoutClient";

// The catering cart lives in sessionStorage; the provider hydrates from it on
// mount, so the checkout route has the same cart the menu page built.
export const dynamic = "force-dynamic";

export default function CateringCheckoutPage() {
  return (
    <CateringCartProvider>
      <CheckoutClient />
    </CateringCartProvider>
  );
}
