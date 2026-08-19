import { createFileRoute, Outlet, notFound } from "@tanstack/react-router";
import { LEVELS } from "@/lib/constants";

const LEVEL_LABELS: Record<string, string> = {
  "9eme": "9ème année de base",
  "1sec": "1ère année secondaire",
  "2sc": "2ème année secondaire",
  "3eme": "3ème année secondaire",
  bac: "Baccalauréat",
};

export const Route = createFileRoute("/n/$level")({
  beforeLoad: ({ params }) => {
    if (!(LEVELS as readonly string[]).includes(params.level)) throw notFound();
  },
  head: ({ params }) => {
    const label = LEVEL_LABELS[params.level] ?? params.level;
    const title = `${label} — cours, exercices et devoirs — Devoiratouna`;
    const description = `Documents gratuits pour la ${label} en Tunisie : cours, séries d'exercices, devoirs de contrôle et de synthèse, examens.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `https://devoiratona.lovable.app/n/${params.level}` },
      ],
    };
  },
  component: () => <Outlet />,
});
