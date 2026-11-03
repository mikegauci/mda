import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductEditor } from "@/components/admin/product-editor";
import type { ProductInput } from "../actions";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DuplicateProductButton } from "@/components/admin/duplicate-product-button";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const db = await createClient();
  const { data: p, error } = await db
    .from("products")
    .select(
      "*,variants:product_variants(*),gallery:product_media(media_id,sort_order)",
    )
    .eq("id", (await params).id)
    .maybeSingle();
  if (error) throw error;
  if (!p) notFound();
  const details = (p.details ?? []) as ProductInput["details"];
  const ids = [
    p.featured_media_id,
    p.details_background_media_id,
    ...details.map((d) => d.icon_media_id),
    ...p.variants.map((v) => v.image_media_id),
    ...p.gallery.map((v) => v.media_id),
  ].filter((v): v is string => !!v);
  const [{ data: media }, { data: courses }] = await Promise.all([
    db.from("media").select("id,path,width,height,alt").in("id", ids),
    db.from("products").select("id,name").order("name"),
  ]);
  return (
    <>
      <AdminPageHeader
        title="Edit product"
        actions={<DuplicateProductButton id={p.id} />}
      />
      <ProductEditor
        initial={{
          ...p,
          options: p.options as ProductInput["options"],
          seo: p.seo as ProductInput["seo"],
          details,
          stock_messages: p.stock_messages as ProductInput["stock_messages"],
          gallery: p.gallery
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((v) => v.media_id),
        }}
        media={media ?? []}
        courses={courses ?? []}
      />
    </>
  );
}
