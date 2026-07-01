import { ContactBar } from "./components/ContactBar";
import { CateringModal } from "./components/CateringModal";
import { StickyOrderBar } from "./components/StickyOrderBar";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { FeaturedItems } from "./components/FeaturedItems";
import { Menus } from "./components/Menus";
import { CaptionBand } from "./components/CaptionBand";
import { VisitUs } from "./components/VisitUs";
import { Footer } from "./components/Footer";
import { CartProvider } from "./components/cart/CartProvider";
import { CartDrawer } from "./components/cart/CartDrawer";
import { VipPopup } from "./components/VipPopup";
import { catalog, groupByMenu } from "./lib/catalog/catalog";
import { getCartAction } from "./lib/cart/actions";

// Catalog + cart come from Supabase. Read on the server, then handed to the
// client CartProvider so the whole page shares one cart and ordering happens
// on-site. The DB is the source of truth (Clover sync comes later).
export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await catalog.getProducts();
  const menus = groupByMenu(products);
  const initialCart = await getCartAction();

  return (
    <CartProvider initialCart={initialCart}>
      <ContactBar />
      <Header />
      <main>
        <Hero />
        <FeaturedItems products={products} />
        <Menus menus={menus} />

        <CaptionBand
          id="about"
          image="/img/sandwich-2.jpg"
          alt="Double decker turkey club made fresh at Mabe's"
          caption="Inspired by Our Family & Our Love for Chicago"
          subcaption="Part of the Chatham Heritage Trail · 312 E 75th St"
        />

        <VisitUs />
      </main>
      <Footer />
      {/* spacer so the fixed mobile order bar doesn't cover the footer */}
      <div aria-hidden className="h-[68px] lg:hidden" />
      <StickyOrderBar />
      <CateringModal />
      <CartDrawer />
      <VipPopup />
    </CartProvider>
  );
}
