import "server-only";
import { getInternalLinks } from "@/lib/internal-links-server";
import { resolveLinkValue } from "@/lib/internal-links";
import { cacheLife, cacheTag } from "next/cache";
import { publicDb } from "@/lib/supabase/public";
import type { Category, Product } from "./shop-types";
export const PRODUCT_SELECT =
  "*, image:media!products_featured_media_id_fkey(path,width,height,alt), details_background:media!products_details_background_media_id_fkey(path,width,height,alt), variants:product_variants(*, image:media(path,width,height,alt)), gallery:product_media(sort_order,image:media(path,width,height,alt)), categories:product_category_links(category:product_categories(id,slug,name,parent_id))";

// Published products in WooCommerce's default order (menu order, then name).
export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheTag("products", "pages");
  cacheLife("hours");
  const { data, error } = await publicDb
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "published")
    .order("name");
  if (error) throw error;
  return resolveLinkValue(
    data as unknown as Product[],
    await getInternalLinks(),
  );
}
export async function getProduct(slug: string) {
  "use cache";
  cacheTag("products", `product:${slug}`);
  cacheLife("hours");
  return (await getProducts()).find((p) => p.slug === slug) ?? null;
}

// Media paths by id, for the course details icons.
export async function getMediaPaths(ids: string[]) {
  "use cache";
  cacheTag("products", "media");
  cacheLife("hours");
  if (!ids.length) return {} as Record<string, string>;
  const { data, error } = await publicDb
    .from("media")
    .select("id,path")
    .in("id", ids);
  if (error) throw error;
  return Object.fromEntries(data.map((m) => [m.id, m.path]));
}

// Categories with at least one published product, as in the shop sidebar.
export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheTag("products", "pages");
  cacheLife("hours");
  const used = new Map<string, Category>();
  for (const p of await getProducts())
    for (const { category } of p.categories)
      if (category) used.set(category.id, category);
  return [...used.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export type ShopSettings = {
  vat_rate: number;
  prices_include_vat: boolean;
  shipping: {
    id: string;
    label: string;
    countries: string[];
    price_cents: number;
  }[];
};
export async function getShopSettings() {
  const { data, error } = await publicDb
    .from("settings")
    .select("value")
    .eq("key", "shop")
    .single();
  if (error) throw error;
  return data.value as ShopSettings;
}

export async function getWhatsappUrl() {
  "use cache";
  cacheTag("site-settings");
  cacheLife("hours");
  const { data } = await publicDb
    .from("settings")
    .select("value")
    .eq("key", "contact")
    .maybeSingle();
  const value = (data?.value ?? {}) as { whatsapp_url?: string };
  return value.whatsapp_url || "";
}
