import { createFileRoute, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";

async function loadPage(slug: string) {
  const { data } = await supabase.from("pages")
    .select("slug,title_ar,title_fr,content_html_ar,content_html_fr").eq("slug", slug).maybeSingle();
  if (!data) throw notFound();
  return data;
}

export function PageView({ slug }: { slug: string }) {
  const { lang } = useLang();
  // Loader-fed via dynamic data in route. This is a fallback display helper.
  return null;
}

export { loadPage };
