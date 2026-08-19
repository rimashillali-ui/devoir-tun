import { createFileRoute } from "@tanstack/react-router";
import { SectionContent } from "@/components/SectionContent";

export const Route = createFileRoute("/n/$level/s/$subject/$section")({
  head: ({ params }) => {
    const title = `${params.section} — ${params.subject} — ${params.level} — Devoiratouna`;
    const description = `${params.section} de ${params.subject} pour le niveau ${params.level} : documents PDF gratuits, aperçu en ligne et téléchargement.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `https://devoir-tun.lovable.app/n/${params.level}/s/${params.subject}/${params.section}` },
      ],
      links: [{ rel: "canonical", href: `/n/${params.level}/s/${params.subject}/${params.section}` }],
    };
  },
  component: () => {
    const p = Route.useParams();
    return <SectionContent level={p.level} subject={p.subject} section={p.section} />;
  },
});
