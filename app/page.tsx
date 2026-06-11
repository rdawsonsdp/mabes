import { PromoBar } from "./components/PromoBar";
import { ContactBar } from "./components/ContactBar";
import { CateringModal } from "./components/CateringModal";
import { StickyOrderBar } from "./components/StickyOrderBar";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { FeaturedItems } from "./components/FeaturedItems";
import { Menus } from "./components/Menus";
import { MoreFromMabes } from "./components/MoreFromMabes";
import { CaptionBand } from "./components/CaptionBand";
import { VisitUs } from "./components/VisitUs";
import { Footer } from "./components/Footer";

// Food-first homepage ordered by the LIFT framework: value prop + urgency in
// the hero, featured items (relevance) before anything else, the full menu
// next, then secondary conversions, story, and the trust info (hours, address,
// phone) before the footer.
export default function Home() {
  return (
    <>
      <PromoBar />
      <ContactBar />
      <Header />
      <main>
        <Hero />
        <FeaturedItems />
        <Menus />
        <MoreFromMabes />

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
    </>
  );
}
