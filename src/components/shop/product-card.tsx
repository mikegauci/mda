import Link from "next/link";
import Image from "next/image";
import { mediaUrl } from "@/lib/media";
import { formatPrice } from "@/lib/format";
import { gridAction, priceLabel, type Product } from "@/lib/shop-types";
import { AddToCartButton } from "./add-to-cart-button";
import { ProductPlaceholder } from "./product-placeholder";

// A course in the WooCommerce grid ("You may also like", "Related products"):
// square image, the course's seats left in green, name, price and the
// outline button WooCommerce picks for the product type.
export function ProductCard({ product: p }: { product: Product }) {
  const href = `/product/${p.slug}/`;
  const action = gridAction(p);
  const priceText = priceLabel(p, formatPrice);
  const seats =
    p.manage_stock && !p.hide_stock_status && (p.stock_quantity ?? 0) > 0
      ? p.stock_quantity
      : null;
  return (
    <article>
      <Link href={href} className="block">
        {p.image ? (
          <Image
            width={600}
            height={600}
            src={mediaUrl(p.image.path)}
            alt={p.image.alt || p.name}
            sizes="(min-width: 922px) 231px, 50vw"
            className="aspect-square w-full object-cover"
          />
        ) : (
          <ProductPlaceholder className="aspect-square w-full" />
        )}
      </Link>
      {seats !== null && (
        <p className="mt-3 text-[#77a464]">{seats} places available</p>
      )}
      <Link href={href}>
        <h2 className="mt-1 mb-2 text-base leading-[1.3] font-bold lowercase">
          {p.name}
        </h2>
      </Link>
      {priceText && <p className="mb-2 text-[14.4px] font-bold">{priceText}</p>}
      <div className="my-2">
        {action === "cart" ? (
          <AddToCartButton product={p} />
        ) : (
          <Link href={href} className="pill-button">
            {action === "options" ? "Select options" : "Read more"}
          </Link>
        )}
      </div>
    </article>
  );
}
