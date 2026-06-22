import { Link } from "@tanstack/react-router";
import { SECTIONS, ARABIC_ONLY_SECTIONS, TEXTE_ALLOWED_SUBJECTS } from "@/lib/constants";
import { useLang } from "@/lib/i18n";

export function SectionGrid({ level, track, subject }: { level: string; track?: string; subject: string }) {
  const { t } = useLang();
  const sections = SECTIONS.filter((s) => {
    if (s === "texte") return TEXTE_ALLOWED_SUBJECTS.has(subject);
    return true;
  });
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">{t.subjects[subject] ?? subject}</h1>
      <p className="text-muted-foreground mb-6">{t.sections_title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => {
          const arabicOnly = ARABIC_ONLY_SECTIONS.has(s);
          const params = track
            ? { level, track, subject, section: s }
            : { level, subject, section: s };
          const to = track
            ? "/n/$level/f/$track/s/$subject/$section"
            : "/n/$level/s/$subject/$section";
          return (
            <Link
              key={s}
              to={to as any}
              params={params as any}
              className="glass glass-hover p-6"
              dir={arabicOnly ? "rtl" : undefined}
            >
              <div className="text-xl font-bold">{t.sections[s] ?? s}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
