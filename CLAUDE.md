# Malta Detailing Academy — mda.mt rebuild

Rebuild of mda.mt (Malta Detailing Academy: car detailing courses and gift vouchers) from WordPress/WooCommerce to **Next.js + Supabase on Vercel**, with the custom in-house CMS ported from the Battery Factory rebuild (`~/GitHub/batteryfactory`, itself modelled on `~/GitHub/rotta`). WordPress is retired after launch.

## Ground rules

- **Exact 1:1 design and content** with the live site. When in doubt, compare against https://mda.mt.
- **Never point mda.mt DNS (Cloudflare) at Vercel without explicit go-ahead from Mike.**
- Never commit secrets or anything in `migration/exports/`.
- English only. One admin to start: mikegauci@gmail.com.
- Shop: courses and gift vouchers are WooCommerce variable products with a "Date & Time" option (one variant per session). Prices include 18% VAT. Customers migrated and reset their password by magic link.
- Stripe key is pasted in the admin (Admin → Payments), not env vars: the admin pastes the secret key (restricted keys allowed); on save the server validates it, creates the webhook endpoint via the Stripe API and stores key + signing secret in `stripe_account` (service role only). The key is shown masked. `getStripe()` returns `{ stripe, live, account }`. Cards only (the live site's Klarna is dropped).
- Custom in-house SEO replaces Yoast (carry over Yoast titles, descriptions and OG images).
- Reuse Battery Factory's and Rotta's patterns (auth, admin, media, shop, SEO, email) rather than reinventing them.

## Stack

| Layer               | Choice                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| App                 | Next.js (App Router), TypeScript, Tailwind                                                             |
| Hosting             | Vercel — team "mikegauci's projects"                                                                   |
| DB / Auth / Storage | Supabase project `mda` (ref `mdggdxoymeridyojnzlu`, eu-north-1), same Supabase account as Rotta        |
| Payments            | Stripe — key pasted in Admin → Payments                                                                |
| Email               | Mailjet (new account), sender and admin notifications `info@mda.mt`                                    |
| Repo                | github.com/mikegauci/mda (public)                                                                      |

## Current site (source of truth for migration)

WordPress + Astra (child theme `mda`) + Spectra blocks, WooCommerce + Stripe (cards, Klarna), Contact Form 7, Yoast SEO, Redirection, DNS on Cloudflare (proxied). Font: MADE Outer Sans (Thin/Regular/Black, self-hosted; the files are the "personal use" cut).

| Section | WP implementation                                                                 | Volume                                                 |
| ------- | --------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Pages   | Home (About/Courses/Contact anchors), About, Contact, Terms, Privacy, Shop, Cart, Checkout, My Account | 10 (Maintenance Page dropped)                          |
| Shop    | WooCommerce variable products, attribute "Date & Time"                            | 15 products (courses, gift vouchers, a book), no categories |
| Forms   | Contact Form 7                                                                    |                                                        |
| Blog    | Only the default "Hello world" post — drop it                                     | 1                                                      |

## Commands

```bash
pnpm dev           # local dev server (the Claude preview runs it on port 3003)
pnpm build         # production build (stop `pnpm dev` first: both write to .next)
pnpm lint          # eslint
pnpm typecheck     # next typegen + tsc
pnpm format        # prettier (with Tailwind class sorting)
pnpm migrate       # WordPress import dry run; --apply writes to Supabase
```

## Conventions (inherited from Rotta)

- Next.js 16: middleware is `src/proxy.ts`; `cacheComponents` is on. Read `node_modules/next/dist/docs/` before using unfamiliar APIs.
- `trailingSlash: true` keeps WordPress URLs (`/product/<slug>/`, `/shop/`, `/product-category/<slug>/`). Internal links always end with a slash.
- One header style for every page (`SiteShell`); `(hero)` and `(plain)` route groups are only folders.
- Design tokens live in `src/app/globals.css` (`brand` #000000, `ink` #000000, `panel` #f9fafb). Font is MADE Outer Sans, self-hosted from the live theme. Section titles use `.section-title`, buttons `.bf-button`. Desktop breakpoint is 922px: use the `desk:` variant.
- Homepage text and images are CMS fields in `src/lib/page-fields.ts` (defaults = live content). In text fields `*word*` is a highlight and `**word**` bold (`RichLine`).
- Supabase clients: `@/lib/supabase/server`, `@/lib/supabase/client`; `createAdminClient()` bypasses RLS (server only, validate input). Public data is read through `publicDb` inside `"use cache"` functions tagged by type; admin saves call `revalidateTag`.
- Roles: `profiles.role` is `admin` or `customer`; `admin_capabilities` null = full admin, else a section allowlist (`pages`, `products`, `orders`, `media`).
- DB changes are SQL files in `supabase/migrations/`, applied with the Supabase connector. Every migrated table has a `wp_id`. Money is integer euro cents including 18% VAT.
- Media: public `media` bucket, rows in `public.media`, `mediaUrl(path)`. Imported files are `wp/<yyyy>/<mm>/<name>.webp`. Contact-form files go to the private `contact-uploads` bucket via signed upload URLs.
- Email: `sendEmail()` (`@/lib/email/send`) sends through Mailjet; without keys it logs instead.
- Shop follows WooCommerce: `/shop/` (search `?s=`, sort `?orderby=`), `/product-category/<slug>/` (includes subcategories), `/product/<slug>/`, `/cart/`, `/checkout/`, `/my-account/` (login, `lost-password/`, `reset-password/`). No cart drawer: adding shows WooCommerce's notice. A zero price means "not for sale" (WooCommerce's empty price).
- Checkout: billing/delivery entered on our page and stored on `shop_checkouts.customer_details`; Stripe hosted Checkout takes only the card. Free delivery from `settings.shop.free_shipping_min_cents`, otherwise `shipping[0].price_cents`.
- Products have `contact_button` (WhatsApp "Contact us now", URL in `settings.contact`) and `addons` (Advanced Product Fields checkboxes with a fixed price).
