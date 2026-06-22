import { createFileRoute } from "@tanstack/react-router";
import { load, CmsView } from "@/lib/cms";

export const Route = createFileRoute("/about")({
  loader: () => load("about"),
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title_fr ?? "À propos"} — Devoiratouna` },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: () => <CmsView data={Route.useLoaderData()} />,
  errorComponent: () => <p>Erreur</p>,
  notFoundComponent: () => <p>Page introuvable</p>,
});
