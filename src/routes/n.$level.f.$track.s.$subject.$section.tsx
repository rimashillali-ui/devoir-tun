import { createFileRoute } from "@tanstack/react-router";
import { SectionContent } from "@/components/SectionContent";

export const Route = createFileRoute("/n/$level/f/$track/s/$subject/$section")({
  head: ({ params }) => {
    const title = `${params.section} — ${params.subject} — ${params.track} — Devoiratouna`;
    const description = `${params.section} de ${params.subject} (${params.track}, ${params.level}) : documents PDF gratuits, aperçu en ligne et téléchargement.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        {
          property: "og:url",
          content: `https://devoir-tun.lovable.app/n/${params.level}/f/${params.track}/s/${params.subject}/${params.section}`,
        },
      ],
      links: [
        { rel: "canonical", href: `/n/${params.level}/f/${params.track}/s/${params.subject}/${params.section}` },
      ],
    };
  },
  component: () => {
    const p = Route.useParams();
    return <SectionContent level={p.level} track={p.track} subject={p.subject} section={p.section} />;
  },
});
