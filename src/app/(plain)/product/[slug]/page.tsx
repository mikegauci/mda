import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { ProductCard } from "@/components/shop/product-card";
import { ProductDetail } from "@/components/shop/product-detail";
import { notFoundMetadata, pageMetadata, type Seo } from "@/lib/seo";
import { getMediaPaths, getProduct, getProducts } from "@/lib/shop";
import type { CourseDetail, Product } from "@/lib/shop-types";

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/product/[slug]">) {
  const p = await getProduct((await params).slug);
  if (!p) return notFoundMetadata;
  return pageMetadata({
    name: p.name,
    path: `/product/${p.slug}/`,
    seo: (p.seo ?? {}) as Seo,
    description: p.short_description
      ?.replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160),
    image: p.image?.path,
  });
}

function ProductGrid({
  title,
  products,
}: {
  title: string;
  products: Product[];
}) {
  if (!products.length) return null;
  return (
    <section className="pt-8">
      <h2 className="section-title mb-[22px]">{title}</h2>
      <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
        {products.map((v) => (
          <ProductCard key={v.id} product={v} />
        ))}
      </div>
    </section>
  );
}

async function Content({
  params,
}: Pick<PageProps<"/product/[slug]">, "params">) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  const products = await getProducts();
  const details = (Array.isArray(p.details) ? p.details : []) as CourseDetail[];
  const iconPaths = await getMediaPaths(
    details.map((d) => d.icon_media_id).filter((id) => id !== null),
  );
  const byId = new Map(products.map((v) => [v.id, v]));
  const upsells = p.upsell_ids
    .map((id) => byId.get(id))
    .filter((v) => v !== undefined);
  // WooCommerce's related products: the other courses (none have a
  // category), leaving out the upsells.
  const related = products
    .filter((v) => v.id !== p.id && !p.upsell_ids.includes(v.id))
    .slice(0, 12);
  return (
    <>
      <Container className="pt-[60px] pb-8">
        <ProductDetail product={p} iconPaths={iconPaths} />
      </Container>
      {p.description && (
        <section className="bg-[#f2f2f2] pt-8 pb-10">
          {/* The description starts with its own "More info" heading. */}
          <Container>
            <div
              className="prose-bf"
              dangerouslySetInnerHTML={{ __html: p.description }}
            />
          </Container>
        </section>
      )}
      <Container className="pb-20">
        <ProductGrid title="you may also like…" products={upsells} />
        <ProductGrid title="related products" products={related} />
      </Container>
    </>
  );
}

export default function Page(props: PageProps<"/product/[slug]">) {
  return (
    <Suspense>
      <Content params={props.params} />
    </Suspense>
  );
}
