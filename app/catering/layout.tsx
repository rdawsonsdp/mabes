import { CateringSiteNav } from "@/app/components/catering/CateringSiteNav";

// Consistent site navigation across every catering route (menu, checkout,
// confirmation). The nav is dependency-free so it renders regardless of which
// cart context a given catering page provides.
export default function CateringLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CateringSiteNav />
      {children}
    </>
  );
}
