import { ProductEditor, blankProduct } from "@/components/admin/product-editor";
import { AdminPageHeader } from "@/components/admin/page-header";
import { createClient } from "@/lib/supabase/server";
export default async function Page() {
  const db = await createClient();
  const { data: courses } = await db
    .from("products")
    .select("id,name")
    .order("name");
  return (
    <>
      <AdminPageHeader title="New product" />
      <ProductEditor initial={blankProduct} courses={courses ?? []} />
    </>
  );
}
