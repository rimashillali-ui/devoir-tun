import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resilientRead, unwrap } from "@/lib/resilient-read";
import { useLang, pickTitle } from "@/lib/i18n";
import { AdSlot } from "@/components/AdSlot";
import { DownloadCountdown } from "@/components/DownloadCountdown";

export const Route = createFileRoute("/download/$id")({
  loader: async ({ params }) => {
    const data = await resilientRead(`download:${params.id}`, () =>
      unwrap(
        supabase.from("documents").select("id,title_ar,title_fr").eq("id", params.id).maybeSingle(),
      ),
    );
    if (!data) throw notFound();
    return data;
  },
  head: ({ params, loaderData }) => {
    const title = loaderData?.title_fr ?? loaderData?.title_ar ?? "";
    const url = `https://devoiratona.lovable.app/download/${params.id}`;
    return {
      meta: [
        { title: `Téléchargement — ${title}` },
        { name: "description", content: `Téléchargez gratuitement : ${title}` },
        { property: "og:title", content: title },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LearningResource",
            name: title,
            description: `Ressource éducative gratuite : ${title}`,
            url,
            inLanguage: ["fr", "ar"],
            learningResourceType: "Document",
            isAccessibleForFree: true,
            provider: {
              "@type": "EducationalOrganization",
              name: "Devoiratouna",
              url: "https://devoiratona.lovable.app",
            },
          }),
        },
      ],
    };
  },
  component: DownloadPage,
  errorComponent: () => <p>Erreur</p>,
  notFoundComponent: () => <p>Document introuvable</p>,
});

function DownloadPage() {
  const doc = Route.useLoaderData();
  const { lang } = useLang();
  const [seconds, setSeconds] = useState(15);
  useEffect(() => {
    supabase.from("site_settings").select("value_json").eq("key", "countdown_seconds").maybeSingle()
      .then(({ data }) => {
        const v = data?.value_json;
        if (typeof v === "number" && v >= 0) setSeconds(v);
      });
  }, []);

  return (
    <div className="relative max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center">{pickTitle(lang, doc.title_ar, doc.title_fr)}</h1>

      <AdSlot slot="header" className="flex justify-center" />

      <DownloadCountdown docId={doc.id} seconds={seconds} />

      <AdSlot slot="inlist" className="flex justify-center" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AdSlot slot="sidebar_left" />
        <AdSlot slot="sidebar_right" />
      </div>

      <AdSlot slot="footer" className="flex justify-center" />

      <AdSlot slot="corner_tl" className="fixed top-20 left-2 z-30 max-w-[160px]" />
      <AdSlot slot="corner_tr" className="fixed top-20 right-2 z-30 max-w-[160px]" />
      <AdSlot slot="corner_bl" className="fixed bottom-2 left-2 z-30 max-w-[160px]" />
      <AdSlot slot="corner_br" className="fixed bottom-2 right-2 z-30 max-w-[160px]" />
    </div>
  );
}
