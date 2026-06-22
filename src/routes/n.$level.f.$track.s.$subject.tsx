import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/n/$level/f/$track/s/$subject")({
  head: ({ params }) => ({
    meta: [{ title: `${params.subject} — ${params.level}/${params.track} — Devoiratouna` }],
  }),
  component: () => <Outlet />,
});
