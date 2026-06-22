import { createFileRoute } from "@tanstack/react-router";
import { load, CmsView } from "@/lib/cms";

export const Route = createFileRoute("/privacy")({
  loader: () => load("privacy"),
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.title_fr ?? "Confidentialité"} — Devoiratouna` }, { property: "og:url", content: "/privacy" }],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: () => <CmsView data={Route.useLoaderData()} />,
  errorComponent: () => <p>Erreur</p>,
  notFoundComponent: () => <p>Page introuvable</p>,
});
