import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";
import { getSubjects, getTracks } from "@/lib/constants";

export const Route = createFileRoute("/n/$level/f/$track")({
  beforeLoad: ({ params }) => {
    if (!getTracks(params.level).includes(params.track)) throw notFound();
  },
  head: ({ params }) => ({
    meta: [{ title: `${params.level} / ${params.track} — Devoiratouna` }],
    links: [{ rel: "canonical", href: `/n/${params.level}/f/${params.track}` }],
  }),
  component: TrackPage,
});

function TrackPage() {
  const { level, track } = Route.useParams();
  const { t } = useLang();
  const subjects = getSubjects(level, track);
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">{t.levels[level]} — {t.tracks[track] ?? track}</h1>
      <p className="text-muted-foreground mb-6">{t.subjects_title}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {subjects.map((s) => (
          <Link
            key={s}
            to="/n/$level/f/$track/s/$subject"
            params={{ level, track, subject: s }}
            className="glass glass-hover p-5 text-center"
          >
            <div className="font-bold">{t.subjects[s] ?? s}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
