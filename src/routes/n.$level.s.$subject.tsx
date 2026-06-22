import { createFileRoute } from "@tanstack/react-router";
import { SectionGrid } from "@/components/SectionGrid";

export const Route = createFileRoute("/n/$level/s/$subject")({
  head: ({ params }) => ({
    meta: [{ title: `${params.subject} — ${params.level} — Devoiratouna` }],
    links: [{ rel: "canonical", href: `/n/${params.level}/s/${params.subject}` }],
  }),
  component: () => {
    const { level, subject } = Route.useParams();
    return <SectionGrid level={level} subject={subject} />;
  },
});
