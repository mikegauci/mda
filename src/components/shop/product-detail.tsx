"use client";
import Image from "next/image";
import { useState } from "react";
import { mediaUrl } from "@/lib/media";
import { formatPrice } from "@/lib/format";
import {
  addonsOf,
  bookable,
  hasPrice,
  price,
  priceLabel,
  seatsMessage,
  type CourseDetail,
  type Product,
} from "@/lib/shop-types";
import { useCart } from "./cart";
import { ProductPlaceholder } from "./product-placeholder";
import { WooNotice } from "./woo-notice";

const select =
  "w-full appearance-none rounded-[3px] border border-[#e2e8f0] bg-white p-2 pr-8 text-base font-light text-[#666] focus:border-black focus:outline-none";

// The live course page: gallery on the left; title, short description, the
// details panel (icons on a darkened photo), price, the "Date & Time" choice
// with seats left, quantity and "add to cart" on the right.
export function ProductDetail({
  product: p,
  iconPaths,
}: {
  product: Product;
  iconPaths: Record<string, string>;
}) {
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [chosen, setChosen] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [photo, setPhoto] = useState<string | null>(null);
  const { add, added } = useCart();
  const options = p.options as { name: string; values: string[] }[];
  const addons = addonsOf(p);
  const details = (Array.isArray(p.details) ? p.details : []) as CourseDetail[];
  const complete = options.every((o) => selection[o.name]);
  const variant = complete
    ? ([...p.variants]
        .sort((a, b) => a.sort_order - b.sort_order)
        .find((v) =>
          Object.entries(v.option_values as Record<string, string>).every(
            ([k, v]) => !v || selection[k] === v,
          ),
        ) ?? null)
    : null;
  const variable = p.variants.length > 0;
  const base = variable ? variant : p;
  const ready = !!base && hasPrice(base) && bookable(p, variant, quantity);
  const addonTotal = addons
    .filter((a) => chosen.includes(a.id))
    .reduce((n, a) => n + a.price_cents, 0);
  const gallery = [
    p.image,
    ...[...p.gallery]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((g) => g.image),
  ].filter((i) => i !== null);
  const image = photo ?? variant?.image?.path ?? p.image?.path;
  const priceText = priceLabel(p, formatPrice);
  const purchasable = variable
    ? p.variants.some(hasPrice)
    : hasPrice(p) && bookable(p, null);
  const seats = variable
    ? variant
      ? seatsMessage(p, variant)
      : ""
    : seatsMessage(p, null);

  return (
    <>
      {added?.slug === p.slug && (
        <WooNotice action={{ label: "View cart", href: "/cart/" }}>
          “{p.name}” has been added to your cart.
        </WooNotice>
      )}
      <div className="grid gap-x-[39px] gap-y-8 md:grid-cols-[492fr_453fr]">
        <div>
          <div className="relative">
            {image ? (
              <Image
                width={1200}
                height={1200}
                priority
                src={mediaUrl(image)}
                alt={p.image?.alt || p.name}
                sizes="(min-width: 768px) 492px, 100vw"
                className="aspect-square w-full object-cover"
              />
            ) : (
              <ProductPlaceholder className="aspect-square w-full" />
            )}
            {image && (
              <a
                href={mediaUrl(image)}
                target="_blank"
                rel="noopener"
                aria-label="View full-size image"
                className="absolute top-4 right-4 grid size-9 place-items-center rounded-full bg-white"
              >
                <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                  <circle
                    cx="10.5"
                    cy="10.5"
                    r="6.5"
                    fill="none"
                    stroke="#3b3b3b"
                    strokeWidth="2"
                  />
                  <path d="m15.5 15.5 5 5" stroke="#3b3b3b" strokeWidth="2" />
                </svg>
              </a>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-4">
              {gallery.map((im, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPhoto(im.path)}
                  aria-label={`View photo ${i + 1}`}
                  className={
                    (photo ?? p.image?.path) === im.path
                      ? ""
                      : "opacity-50 hover:opacity-100"
                  }
                >
                  <Image
                    width={300}
                    height={300}
                    src={mediaUrl(im.path)}
                    alt={im.alt}
                    className="aspect-square w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="mb-[13px] text-[26px] leading-[1.2] font-bold lowercase">
            {p.name}
          </h1>
          {p.short_description && (
            <div
              className="prose-bf"
              dangerouslySetInnerHTML={{ __html: p.short_description }}
            />
          )}

          {details.length > 0 && (
            <div className="relative mt-4 mb-10 bg-cover bg-center p-5 text-white">
              {p.details_background && (
                <Image
                  src={mediaUrl(p.details_background.path)}
                  alt=""
                  fill
                  sizes="453px"
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 bg-black/[0.52]" />
              <ul className="relative">
                {details.map((d, i) => (
                  <li
                    key={i}
                    className="mb-[18px] flex items-center gap-4 font-medium last:mb-0"
                  >
                    {d.icon_media_id && iconPaths[d.icon_media_id] ? (
                      // eslint-disable-next-line @next/next/no-img-element -- SVG icon from the media library
                      <img
                        src={mediaUrl(iconPaths[d.icon_media_id])}
                        alt=""
                        width={30}
                        height={30}
                        className="size-[30px] shrink-0"
                      />
                    ) : (
                      <span className="size-[30px] shrink-0" />
                    )}
                    <span
                      className="lowercase [&_a]:text-white [&_a]:underline"
                      dangerouslySetInnerHTML={{ __html: d.html }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {priceText && (
            <p className="mb-[25px] text-2xl leading-[1.1] font-bold">
              {variant && hasPrice(variant)
                ? formatPrice(price(variant))
                : priceText}
            </p>
          )}

          {purchasable && (
            <div>
              {options.map((o) => (
                <label key={o.name} className="mb-4 block">
                  <span className="mb-3 block leading-5 font-bold lowercase">
                    {o.name}
                  </span>
                  <span className="relative block">
                    <select
                      value={selection[o.name] ?? ""}
                      onChange={(e) => {
                        setSelection({
                          ...selection,
                          [o.name]: e.target.value,
                        });
                        setPhoto(null);
                      }}
                      className={select}
                    >
                      <option value="">Choose an option</option>
                      {o.values.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <svg
                      viewBox="0 0 20 20"
                      className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
                      aria-hidden
                    >
                      <path
                        d="m5 8 5 5 5-5"
                        fill="none"
                        stroke="#3b3b3b"
                        strokeWidth="1.6"
                      />
                    </svg>
                  </span>
                </label>
              ))}
              {variable && Object.values(selection).some(Boolean) && (
                <button
                  type="button"
                  onClick={() => setSelection({})}
                  className="mb-2 text-sm underline"
                >
                  Clear
                </button>
              )}
              {variable && complete && !variant && (
                <p className="mb-4">
                  Sorry, this product is unavailable. Please choose a different
                  combination.
                </p>
              )}
              {seats && (
                <p
                  className={`mb-4 ${variant && !bookable(p, variant) ? "text-coral" : "text-[#77a464]"}`}
                >
                  {seats}
                </p>
              )}
              {addons.length > 0 && (
                <div className="mt-2 space-y-1.5 border-t border-[#e2e8f0] pt-6">
                  {addons.map((a) => (
                    <label key={a.id} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={chosen.includes(a.id)}
                        onChange={(e) =>
                          setChosen(
                            e.target.checked
                              ? [...chosen, a.id]
                              : chosen.filter((id) => id !== a.id),
                          )
                        }
                      />
                      <span>
                        {a.label}{" "}
                        <span className="text-muted">
                          (+{formatPrice(a.price_cents)})
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <div
                className={`flex items-center gap-4 ${
                  options.length || addons.length
                    ? "mt-6 border-t border-[#e2e8f0] pt-3"
                    : ""
                }`}
              >
                <input
                  type="number"
                  min="1"
                  max="99"
                  aria-label={`${p.name} quantity`}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      Math.max(1, Math.min(99, Number(e.target.value) || 1)),
                    )
                  }
                  className="ml-[38px] h-[38px] w-[42px] border border-[#e2e8f0] text-center text-[#666]"
                />
                <button
                  type="button"
                  disabled={!ready}
                  className="pill-button flex-1"
                  onClick={() => {
                    if (!base) return;
                    add({
                      productId: p.id,
                      variantId: variant?.id ?? null,
                      quantity,
                      name: p.name,
                      slug: p.slug,
                      price: price(base) + addonTotal,
                      image: image ? mediaUrl(image) : null,
                      options: selection,
                      addons: addons
                        .filter((a) => chosen.includes(a.id))
                        .map((a) => ({
                          id: a.id,
                          label: a.label,
                          price: a.price_cents,
                        })),
                    });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Add to cart
                </button>
              </div>
            </div>
          )}
          {!purchasable && seats && <p className="text-coral mt-6">{seats}</p>}
        </div>
      </div>
    </>
  );
}

// WooCommerce's quantity box with "-" and "+" buttons (used in the cart).
export function Quantity({
  value,
  onChange,
  label = "Quantity",
}: {
  value: number;
  onChange: (n: number) => void;
  label?: string;
}) {
  const set = (n: number) => onChange(Math.max(1, Math.min(99, n || 1)));
  const button =
    "grid h-10 w-[38px] place-items-center border border-[#e2e8f0] text-sm";
  return (
    <span className="inline-flex">
      <button
        type="button"
        className={button}
        aria-label="Minus Quantity"
        onClick={() => set(value - 1)}
      >
        -
      </button>
      <input
        type="number"
        min="1"
        max="99"
        aria-label={label}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        className="h-10 w-10 [appearance:textfield] border-y border-[#e2e8f0] text-center text-sm [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        className={button}
        aria-label="Plus Quantity"
        onClick={() => set(value + 1)}
      >
        +
      </button>
    </span>
  );
}
