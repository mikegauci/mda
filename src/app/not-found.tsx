import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { NotFoundContent } from "@/components/not-found-content";

export const metadata: Metadata = {
  title: { absolute: "Page not found - Malta Detailing Academy" },
  robots: { index: false },
};

// URLs that match no route. These render in the root layout only, so the
// header and footer come from here; notFound() inside the site's pages uses
// (plain)/not-found.tsx, which is already inside them.
export default function NotFound() {
  return (
    <SiteShell>
      <NotFoundContent />
    </SiteShell>
  );
}
