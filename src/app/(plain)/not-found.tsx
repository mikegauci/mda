import type { Metadata } from "next";
import { NotFoundContent } from "@/components/not-found-content";

export const metadata: Metadata = {
  title: { absolute: "Page not found - Malta Detailing Academy" },
  robots: { index: false },
};

// notFound() in a page, course or account route: the (plain) layout already
// renders the header and footer.
export default function NotFound() {
  return <NotFoundContent />;
}
