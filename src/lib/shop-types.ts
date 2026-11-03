import type { Tables } from "@/lib/supabase/database.types";
import type { MediaInfo } from "@/lib/media-info";
export type Variant = Tables<"product_variants"> & { image: MediaInfo | null };
export type Category = {
  id: string;
  slug: string;
  name: string;
  parent_id: string | null;
};
export type Addon = { id: string; label: string; price_cents: number };
export type Product = Tables<"products"> & {
  image: MediaInfo | null;
  details_background: MediaInfo | null;
  variants: Variant[];
  gallery: { image: MediaInfo | null; sort_order: number }[];
  categories: { category: Category | null }[];
};
export type CartAddon = { id: string; label: string; price: number };
export type CartItem = {
  productId: string;
  variantId: string | null;
  quantity: number;
  name: string;
  slug: string;
  // Unit price in cents, add-ons included.
  price: number;
  image: string | null;
  options: Record<string, string>;
  addons?: CartAddon[];
};
export const price = (p: {
  price_cents: number | null;
  sale_price_cents: number | null;
}) => p.sale_price_cents ?? p.price_cents ?? 0;
export const available = (
  p: {
    stock_status: string;
    manage_stock: boolean;
    stock_quantity: number | null;
  },
  quantity = 1,
) =>
  p.stock_status !== "out_of_stock" &&
  (!p.manage_stock || (p.stock_quantity ?? 0) >= quantity);

// WooCommerce treats an empty price as "not for sale"; the import stores it
// as 0, so a zero price hides the price and the add to cart button.
export const hasPrice = (p: {
  price_cents: number | null;
  sale_price_cents: number | null;
}) => price(p) > 0;

export function priceLabel(p: Product, format: (n: number) => string) {
  const values = (p.variants.length ? p.variants : [p])
    .filter(hasPrice)
    .map(price);
  if (!values.length) return "";
  const min = Math.min(...values),
    max = Math.max(...values);
  return min === max ? format(min) : `${format(min)} – ${format(max)}`;
}

export const addonsOf = (p: Pick<Product, "addons">) =>
  (Array.isArray(p.addons) ? p.addons : []) as Addon[];

export const categoriesOf = (p: Pick<Product, "categories">) =>
  p.categories.map((c) => c.category).filter((c) => c !== null);

// The button WooCommerce shows under a product in the shop grid.
export function gridAction(
  p: Product,
): "contact" | "options" | "cart" | "more" {
  if (p.contact_button) return "contact";
  if (p.variants.length) return p.variants.some(hasPrice) ? "options" : "more";
  return hasPrice(p) && available(p) ? "cart" : "more";
}

export type CourseDetail = { icon_media_id: string | null; html: string };

const DEFAULT_STOCK_MESSAGES = {
  in_stock: "%s seats available",
  low_stock: "Only 1 seat available",
  backorder: "Available next course",
  out_of_stock: "Course full. Check again soon!",
};

// The seats text WooCommerce shows under the chosen date, from the course's
// own messages (the theme's stock fields). A date that manages its own stock
// uses it; otherwise the course's stock applies, as in WooCommerce.
export function seatsMessage(p: Product, v: Variant | null): string {
  if (p.hide_stock_status) return "";
  const messages = {
    ...DEFAULT_STOCK_MESSAGES,
    ...((p.stock_messages ?? {}) as Partial<typeof DEFAULT_STOCK_MESSAGES>),
  };
  const source = v?.manage_stock ? v : p.manage_stock ? p : null;
  const status =
    v && !v.manage_stock ? v.stock_status : (source ?? p).stock_status;
  if (!source)
    return status === "out_of_stock"
      ? messages.out_of_stock
      : status === "on_backorder"
        ? messages.backorder
        : "";
  const seats = source.stock_quantity ?? 0;
  if (seats <= 0)
    return source.backorders ? messages.backorder : messages.out_of_stock;
  if (seats === 1) return messages.low_stock;
  return messages.in_stock.replace("%s", String(seats));
}

// Whether the course (or the chosen date) can be booked for `quantity` seats.
export function bookable(p: Product, v: Variant | null, quantity = 1) {
  const source = v?.manage_stock ? v : p.manage_stock ? p : null;
  if (!source) return (v ?? p).stock_status !== "out_of_stock";
  return source.backorders || (source.stock_quantity ?? 0) >= quantity;
}
