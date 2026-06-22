import { createFileRoute, Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";
import { getTracks, getSubjects } from "@/lib/constants";

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
        <h1 className="text-3xl font-bold mb-2">{t.levels[level]}</h1>
        <p className="text-muted-foreground mb-6">{t.tracks_title}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tracks.map((tr) => (
            <Link
              key={tr}
              to="/n/$level/f/$track"
              params={{ level, track: tr }}
              className="glass glass-hover p-6"
            >
              <div className="text-lg font-bold">{t.tracks[tr] ?? tr}</div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">{t.levels[level]}</h1>
      <p className="text-muted-foreground mb-6">{t.subjects_title}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {subjects.map((s) => (
          <Link
            key={s}
            to="/n/$level/s/$subject"
            params={{ level, subject: s }}
            className="glass glass-hover p-5 text-center"
          >
            <div className="font-bold">{t.subjects[s] ?? s}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
