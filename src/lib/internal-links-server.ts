import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { publicDb } from "@/lib/supabase/public";
import { internalHref, type InternalLink } from "@/lib/internal-links";

export async function getInternalLinks(): Promise<InternalLink[]> {
  "use cache";
  cacheTag("pages", "products");
  cacheLife("hours");
  const [pages, products] = await Promise.all([
    publicDb
      .from("pages")
      .select("id,title,path")
      .eq("status", "published")
      .order("title"),
    publicDb
      .from("products")
      .select("id,name,slug")
      .eq("status", "published")
      .order("name"),
  ]);
  if (pages.error) throw pages.error;
  if (products.error) throw products.error;
  return [
    { label: "Homepage", group: "Pages", href: "/", path: "/" },
    ...["about", "courses", "contact"].map((section): InternalLink => ({
      label: section[0].toUpperCase() + section.slice(1),
      group: "Homepage sections",
      href: `/#${section}`,
      path: `/#${section}`,
    })),
    ...pages.data
      .filter((page) => page.path && page.path !== "shop")
      .map((page): InternalLink => ({
        label: page.title,
        group: "Pages",
        href: internalHref("page", page.id),
        path: `/${page.path}/`,
      })),
    ...products.data.map((product): InternalLink => ({
      label: product.name,
      group: "Products & courses",
      href: internalHref("product", product.id),
      path: `/product/${product.slug}/`,
    })),
  ];
}
