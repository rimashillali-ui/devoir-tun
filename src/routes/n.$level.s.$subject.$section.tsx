import { createFileRoute } from "@tanstack/react-router";
import { SectionContent } from "@/components/SectionContent";

export const Route = createFileRoute("/n/$level/s/$subject/$section")({
  head: ({ params }) => ({
    meta: [{ title: `${params.section} — ${params.subject} — Devoiratouna` }],
    links: [{ rel: "canonical", href: `/n/${params.level}/s/${params.subject}/${params.section}` }],
  }),
  component: () => {
    const p = Route.useParams();
    return <SectionContent level={p.level} subject={p.subject} section={p.section} />;
  },
});
