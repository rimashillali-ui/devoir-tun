import { createFileRoute } from "@tanstack/react-router";
import { SectionGrid } from "@/components/SectionGrid";

export const Route = createFileRoute("/n/$level/f/$track/s/$subject")({
  head: ({ params }) => ({
    meta: [{ title: `${params.subject} — ${params.level}/${params.track} — Devoiratouna` }],
    links: [{ rel: "canonical", href: `/n/${params.level}/f/${params.track}/s/${params.subject}` }],
  }),
  component: () => {
    const { level, track, subject } = Route.useParams();
    return <SectionGrid level={level} track={track} subject={subject} />;
  },
});
