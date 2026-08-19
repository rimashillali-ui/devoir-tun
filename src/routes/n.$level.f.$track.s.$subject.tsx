import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/n/$level/f/$track/s/$subject")({
  head: ({ params }) => {
    const title = `${params.subject} — ${params.track} — ${params.level} — Devoiratouna`;
    const description = `Documents de ${params.subject} pour la filière ${params.track} (${params.level}) : cours, séries d'exercices, devoirs et examens gratuits.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        {
          property: "og:url",
          content: `https://devoir-tun.lovable.app/n/${params.level}/f/${params.track}/s/${params.subject}`,
        },
      ],
    };
  },
  component: () => <Outlet />,
});
