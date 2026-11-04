// Pages, site settings and redirects. The homepage, cart, checkout and
// account pages are rebuilt in code; only their title and Yoast SEO come
// along. Other pages (About, Contact, Terms, Privacy) keep their HTML, edited
// in the CMS. The unused Maintenance Page is dropped.
import type { Context } from "../lib/context.ts";
import { decodeEntities, wpDate } from "../lib/wp.ts";
import { PAGE_FIELDS, parseTiles } from "../../src/lib/page-fields.ts";
import { seoFrom } from "./seo.ts";

const CODE_PAGES = new Set(["shop", "cart", "checkout", "my-account"]);
const DROPPED_PAGES = new Set(["maintenance-page"]);

export function importSite(ctx: Context) {
  const frontPage = ctx.wp.get(
    "select option_value from wp_options where option_name = 'page_on_front'",
  )?.option_value;
  const pages = ctx.wp
    .all(
      "select * from wp_posts where post_type = 'page' and post_parent = '0' and post_status = 'publish' order by cast(ID as integer)",
    )
    .filter((p) => !DROPPED_PAGES.has(p.post_name!));
  const meta = ctx.wp.postMeta(pages.map((p) => p.ID!));
  const pageRows = pages.map((p) => {
    const isHome = p.ID === frontPage;
    const path = isHome ? "" : p.post_name!;
    const inCode = isHome || CODE_PAGES.has(path);
    return {
      id: ctx.id("pages", p.ID!),
      wp_id: Number(p.ID),
      path,
      title: decodeEntities(p.post_title!),
      content: inCode ? "" : ctx.html(p.post_content),
      status: "published" as const,
      seo: seoFrom(ctx, meta.get(p.ID!), p.post_title ?? ""),
      created_at: wpDate(p.post_date_gmt, p.post_date) ?? undefined,
    };
  });
  ctx.upsert("pages", pageRows, "id");
  ctx.count("pages", pageRows.map((p) => `/${p.path}`).join(", "));

  // Media the homepage layout uses (its fields default to these paths).
  const home = PAGE_FIELDS[""];
  ctx.media.byUrl(home.heroVideo.value.replace(/^wp\//, ""));
  ctx.media.byUrl(home.aboutImage.value.replace(/^wp\//, ""));
  for (const tile of parseTiles(home.courses.value)) {
    // "wp/2023/05/polish-1.webp" was uploaded as 2023/05/polish-1.jpg.
    const base = tile.image.replace(/^wp\/|\.\w+$/g, "");
    const original = ctx.wp.get(
      "select meta_value from wp_postmeta where meta_key = '_wp_attached_file' and meta_value like ?",
      `${base}.%`,
    )?.meta_value;
    if (original) ctx.media.byUrl(original);
    else ctx.warn(`site: no upload for ${base}`);
  }

  ctx.upsert(
    "settings",
    [
      {
        key: "site",
        value: {
          contactEmail: "info@mda.mt",
          phone: "9945 7048",
          Facebook: "https://www.facebook.com/maltadetailingacademy",
          Instagram: "https://www.instagram.com/maltadetailingacademy",
        },
      },
      // Courses are booked, not shipped: one free "method" so the order
      // records how it was fulfilled, and no free-delivery threshold.
      {
        key: "shop",
        value: {
          vat_rate: 0.18,
          prices_include_vat: true,
          free_shipping_min_cents: 0,
          shipping: [
            {
              id: "no-delivery",
              label: "No delivery (course booking)",
              countries: [],
              price_cents: 0,
            },
          ],
        },
      },
    ],
    "key",
  );

  // Redirects: the Redirection plugin's rules, then old product slugs that
  // WooCommerce redirected (`_wp_old_slug`), as on the live site.
  const redirects = new Map<string, string>();
  for (const r of ctx.wp.all(
    "select url, action_data from wp_redirection_items where status = 'enabled' and action_type = 'url'",
  )) {
    const source = `/${r.url!.replace(/^\/+|\/+$/g, "")}/`;
    const destination =
      r.action_data!.replace(/^https?:\/\/(www\.)?mda\.mt/, "") || "/";
    redirects.set(source, destination);
  }
  for (const r of ctx.wp.all(
    "select m.meta_value as old_slug, p.post_name as slug from wp_postmeta m join wp_posts p on p.ID = m.post_id where m.meta_key = '_wp_old_slug' and p.post_type = 'product' and p.post_status = 'publish'",
  )) {
    if (r.old_slug && r.old_slug !== r.slug)
      redirects.set(`/product/${r.old_slug}/`, `/product/${r.slug}/`);
  }
  ctx.upsert(
    "redirects",
    [...redirects].map(([source, destination]) => ({
      source,
      destination,
      permanent: true,
    })),
    "source",
  );
  ctx.count("redirects", [...redirects.keys()].join(", "));
}
