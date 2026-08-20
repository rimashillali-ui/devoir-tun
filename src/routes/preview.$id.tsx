import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useLang, pickTitle } from "@/lib/i18n";
import { YoutubeEmbed } from "@/components/Media";
import { PdfCanvasViewer } from "@/components/PdfCanvasViewer";
import { toYoutubeEmbed } from "@/lib/url-helpers";
import { AdSlot } from "@/components/AdSlot";
import { Download, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/preview/$id")({
  loader: async ({ params }) => {
    // On ne charge JAMAIS source_url côté client : l'aperçu passe par notre proxy.
    const data = await resilientRead(`preview:${params.id}`, () =>
      unwrap(
        supabase.from("documents")
          .select("id,title_ar,title_fr,video_url").eq("id", params.id).maybeSingle(),
      ),
    );
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.title_fr ?? loaderData?.title_ar ?? "Aperçu"} — Devoiratouna` }],
  }),
  component: PreviewPage,
  errorComponent: () => <p className="text-muted-foreground">Erreur</p>,
  notFoundComponent: () => <p className="text-muted-foreground">Document introuvable</p>,
});

function PreviewPage() {
  const doc = Route.useLoaderData();
  const { lang, t } = useLang();
  const ytEmbed = doc.video_url ? toYoutubeEmbed(doc.video_url) : null;
  const previewSrc = `/api/public/documents/${doc.id}/preview`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> {t.home}
        </Link>
        <h1 className="text-xl font-bold flex-1">{pickTitle(lang, doc.title_ar, doc.title_fr)}</h1>
        <Link to="/download/$id" params={{ id: doc.id }} target="_blank"
          className="bg-emerald text-background font-bold px-4 py-2 rounded-md flex items-center gap-2">
          <Download className="h-4 w-4" /> {t.download}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px] gap-4">
        <div className="space-y-4">
          {ytEmbed && <YoutubeEmbed src={ytEmbed} title={doc.title_fr ?? doc.title_ar} />}
          <PdfCanvasViewer src={previewSrc} title={doc.title_fr ?? doc.title_ar} />
        </div>
        <aside className="space-y-4 hidden lg:block">
          <AdSlot slot="sidebar_left" />
          <AdSlot slot="sidebar_right" />
        </aside>
      </div>
    </div>
  );
}

