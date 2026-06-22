import { createFileRoute } from "@tanstack/react-router";
import { load, CmsView } from "@/lib/cms";

export const Route = createFileRoute("/terms")({
  loader: () => load("terms"),
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.title_fr ?? "Conditions"} — Devoiratouna` }, { property: "og:url", content: "/terms" }],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: () => <CmsView data={Route.useLoaderData()} />,
  errorComponent: () => <p>Erreur</p>,
  notFoundComponent: () => <p>Page introuvable</p>,
});
