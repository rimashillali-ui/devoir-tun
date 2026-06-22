import { createFileRoute, Outlet, notFound } from "@tanstack/react-router";
import { getTracks } from "@/lib/constants";

export const Route = createFileRoute("/n/$level/f/$track")({
  beforeLoad: ({ params }) => {
    if (!getTracks(params.level).includes(params.track)) throw notFound();
  },
  head: ({ params }) => ({
    meta: [{ title: `${params.level} / ${params.track} — Devoiratouna` }],
  }),
  component: () => <Outlet />,
});
