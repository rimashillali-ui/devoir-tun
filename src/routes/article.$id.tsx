import { createFileRoute, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useLang, pickTitle } from "@/lib/i18n";
import { ARABIC_ONLY_SECTIONS } from "@/lib/constants";

export const Route = createFileRoute("/article/$id")({
  loader: async ({ params }) => {
    const { data } = await supabase.from("articles")
      .select("id,section,title_ar,title_fr,content_html_ar,content_html_fr")
      .eq("id", params.id).maybeSingle();
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.title_fr ?? loaderData?.title_ar} — Devoiratouna` }],
  }),
  component: ArticlePage,
  errorComponent: () => <p>Erreur</p>,
  notFoundComponent: () => <p>Article introuvable</p>,
});

function ArticlePage() {
  const a = Route.useLoaderData();
  const { lang } = useLang();
  const forceAr = ARABIC_ONLY_SECTIONS.has(a.section);
  const useAr = forceAr || lang === "ar";
  const title = useAr ? a.title_ar : pickTitle("fr", a.title_ar, a.title_fr);
  const html = useAr ? a.content_html_ar : (a.content_html_fr || a.content_html_ar);
  return (
    <article dir={useAr ? "rtl" : "ltr"} className="glass p-6 md:p-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-6">{title}</h1>
      <div className="prose-ar" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
