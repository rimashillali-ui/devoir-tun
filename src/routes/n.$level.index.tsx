import { createFileRoute, Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";
import { getTracks, getSubjects } from "@/lib/constants";
import { trackIcon, subjectIcon } from "@/lib/section-icons";
import { BackButton } from "@/components/BackButton";

export const Route = createFileRoute("/n/$level/")({
  head: ({ params }) => ({
    links: [{ rel: "canonical", href: `/n/${params.level}` }],
  }),
  component: LevelPage,
});

function LevelPage() {
  const { level } = Route.useParams();
  const { t } = useLang();
  const tracks = getTracks(level);
  const subjects = getSubjects(level);

  if (tracks.length > 0) {
    return (
      <div>
        <BackButton to="/" />
        <h1 className="text-3xl font-bold mb-2">{t.levels[level]}</h1>
        <p className="text-muted-foreground mb-6">{t.tracks_title}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tracks.map((tr) => {
            const Icon = trackIcon(tr);
            return (
            <Link
              key={tr}
              to="/n/$level/f/$track"
              params={{ level, track: tr }}
              className="glass glass-hover p-6"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary shrink-0">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="text-lg font-bold">{t.tracks[tr] ?? tr}</div>
              </div>
            </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <BackButton to="/" />
      <h1 className="text-3xl font-bold mb-2">{t.levels[level]}</h1>
      <p className="text-muted-foreground mb-6">{t.subjects_title}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {subjects.map((s) => {
          const Icon = subjectIcon(s);
          return (
            <Link
              key={s}
              to="/n/$level/s/$subject"
              params={{ level, subject: s }}
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
