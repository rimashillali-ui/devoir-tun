import { createFileRoute, Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";
import { getSubjects } from "@/lib/constants";
import { subjectIcon } from "@/lib/section-icons";
import { BackButton } from "@/components/BackButton";

export const Route = createFileRoute("/n/$level/f/$track/")({
  head: ({ params }) => ({
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
      <BackButton to="/n/$level" params={{ level }} />
      <h1 className="text-3xl font-bold mb-2">{t.levels[level]} — {t.tracks[track] ?? track}</h1>
      <p className="text-muted-foreground mb-6">{t.subjects_title}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {subjects.map((s) => {
          const Icon = subjectIcon(s);
          return (
            <Link
              key={s}
              to="/n/$level/f/$track/s/$subject"
              params={{ level, track, subject: s }}
              className="glass glass-hover p-5 flex flex-col items-center gap-2 text-center"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div className="font-bold">{t.subjects[s] ?? s}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
