import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/n/$level/s/$subject")({
  head: ({ params }) => {
    const title = `${params.subject} — ${params.level} — Devoiratouna`;
    const description = `Cours, exercices et devoirs de ${params.subject} pour le niveau ${params.level} : documents PDF gratuits à consulter ou télécharger.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `https://devoiratona.lovable.app/n/${params.level}/s/${params.subject}` },
      ],
    };
  },
  component: () => <Outlet />,
});
