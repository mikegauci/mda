import "server-only";
import { getInternalLinks } from "@/lib/internal-links-server";
import { resolveLinkValue } from "@/lib/internal-links";
import { cacheLife, cacheTag } from "next/cache";
import { publicDb } from "@/lib/supabase/public";
export async function getSiteSettings() {
  "use cache";
  cacheLife("hours");
  cacheTag("site-settings", "pages", "products");
  const { data, error } = await publicDb
    .from("settings")
    .select("value")
    .eq("key", "site")
    .maybeSingle();
  if (error) throw error;
  return resolveLinkValue(
    (data?.value ?? {}) as Record<string, string>,
    await getInternalLinks(),
  );
}

// The year for "{year}" in the footer copyright. Cached for a day, so the
// footer rolls over by itself on 1 January.
export async function currentYear() {
  "use cache";
  cacheLife("days");
  return String(new Date().getFullYear());
}
