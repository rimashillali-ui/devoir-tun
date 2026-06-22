import { createFileRoute, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";

async function load(slug: string) {
  const { data } = await supabase.from("pages")
    .select("slug,title_ar,title_fr,content_html_ar,content_html_fr").eq("slug", slug).maybeSingle();
  if (!data) throw notFound();
  return data;
}

function CmsView({ data }: { data: any }) {
  const { lang } = useLang();
  const title = lang === "ar" ? data.title_ar : data.title_fr;
  const html = lang === "ar" ? data.content_html_ar : data.content_html_fr;
  return (
    <article dir={lang === "ar" ? "rtl" : "ltr"} className="glass p-6 md:p-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-6">{title}</h1>
      <div className="prose-ar" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}

export { load, CmsView };
