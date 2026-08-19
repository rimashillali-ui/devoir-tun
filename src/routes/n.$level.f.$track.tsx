import { createFileRoute, Outlet, notFound } from "@tanstack/react-router";
import { getTracks } from "@/lib/constants";

export const Route = createFileRoute("/n/$level/f/$track")({
  beforeLoad: ({ params }) => {
    if (!getTracks(params.level).includes(params.track)) throw notFound();
  },
  head: ({ params }) => {
    const title = `${params.track} — ${params.level} — Devoiratouna`;
    const description = `Matières de la filière ${params.track} (${params.level}) : cours, exercices, devoirs et examens en PDF, gratuits.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `https://devoiratona.lovable.app/n/${params.level}/f/${params.track}` },
      ],
    };
  },
  component: () => <Outlet />,
});
