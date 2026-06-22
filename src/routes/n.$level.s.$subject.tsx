import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/n/$level/s/$subject")({
  head: ({ params }) => ({
    meta: [{ title: `${params.subject} — ${params.level} — Devoiratouna` }],
  }),
  component: () => <Outlet />,
});
