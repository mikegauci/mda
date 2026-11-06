import { getInternalLinks } from "@/lib/internal-links-server";
import { internalHref } from "@/lib/internal-links";

// Saved HTML and admin previews can contain references before public rendering
// resolves them. Keep these URLs usable without caching an old destination.
export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ type: string; id: string }>;
  },
) {
  const { type, id } = await params;
  if (!["page", "product"].includes(type) || !/^[\da-f-]{36}$/i.test(id))
    return new Response("Page not found", { status: 404 });
  const href = internalHref(type as "page" | "product", id);
  const link = (await getInternalLinks()).find((item) => item.href === href);
  if (!link) return new Response("Page not found", { status: 404 });
  return new Response(null, {
    status: 307,
    headers: { Location: link.path, "Cache-Control": "no-store" },
  });
}
