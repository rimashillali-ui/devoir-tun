import { createFileRoute, Outlet, notFound } from "@tanstack/react-router";
import { LEVELS } from "@/lib/constants";

export const Route = createFileRoute("/n/$level")({
  beforeLoad: ({ params }) => {
    if (!(LEVELS as readonly string[]).includes(params.level)) throw notFound();
  },
  head: ({ params }) => ({
    meta: [
      { title: `${params.level} — Devoiratouna` },
      { property: "og:url", content: `/n/${params.level}` },
    ],
  }),
  component: () => <Outlet />,
});
