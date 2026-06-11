import { PromoBar } from "./components/PromoBar";
import { ContactBar } from "./components/ContactBar";
import { CateringModal } from "./components/CateringModal";
import { Header } from "./components/Header";
import { RuleHeading } from "./components/RuleHeading";
import { Hero } from "./components/Hero";
import { VisitUs } from "./components/VisitUs";
import { FeatureColumns } from "./components/FeatureColumns";
import { Menus } from "./components/Menus";
import { CaptionBand } from "./components/CaptionBand";
import { Footer } from "./components/Footer";

export default function Home() {
  return (
    <>
      <PromoBar />
      <ContactBar />
      <Header />
      <main>
        <RuleHeading>Our Love Language Is Freshness</RuleHeading>
        <Hero />
        <VisitUs />
        <FeatureColumns />
        <Menus />

        <CaptionBand
          image="/img/sandwich-2.jpg"
          alt="Made-to-order sandwich at Mabe's"
          caption="Made to Order, Served Fresh Daily"
        />
        <CaptionBand
          image="/img/table-breakfast.jpg"
          alt="Fresh spread on the table"
          caption="Inspired by Our Family & Our Love for Chicago"
        />
        <CaptionBand
          image="/img/food-3029.jpeg"
          alt="Mabe's gift cards"
          caption="Freshness Is the Gift That Keeps on Giving"
        />
        <CaptionBand
          image="/img/menu-photo.jpg"
          alt="Mabe's menu favorites"
          caption={
            <>
              312 E 75th St, Chicago, IL 60619
              <br />
              (773) 891-1798
            </>
          }
          subcaption="Part of the Chatham Heritage Trail"
        />
      </main>
      <Footer />
      <CateringModal />
    </>
  );
}
