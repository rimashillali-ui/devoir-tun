import { createFileRoute, Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";
import { LEVELS, LEVEL_ACCENT } from "@/lib/constants";
import { AccountMenu } from "@/components/AccountMenu";
import { UploadCloud } from "lucide-react";
import { GraduationCap, BookOpen, FlaskConical, Calculator, Award } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Devoiratouna — دوفواراتنا" },
      { name: "description", content: "Cours, exercices, devoirs et examens gratuits pour tous les niveaux." },
      { property: "og:title", content: "Devoiratouna" },
      { property: "og:description", content: "Plateforme éducative tunisienne gratuite" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

const ICONS: Record<string, any> = {
  "9eme": BookOpen,
  "1sec": Calculator,
  "2sc": FlaskConical,
  "3eme": GraduationCap,
  bac: Award,
};

function Home() {
  const { t, lang } = useLang();
  return (
    <div className="space-y-12">
      <section className="relative rounded-2xl overflow-hidden border border-white/10 shadow-lg">
        <img
          src="/cover.png"
          alt="Devoiratouna — دوفواراتنا"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
          loading="eager"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background" />
        <div className="relative text-center px-5 py-14 md:py-20">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Devoiratouna logo" className="h-20 w-20 rounded-full" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-br from-cyan via-indigo to-emerald bg-clip-text text-transparent">
            {t.site_name} — {t.site_name === "Devoiratouna" ? "Plateforme éducative tunisienne" : "المنصة التربوية التونسية"}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{t.tagline}</p>
        </div>
      </section>


      <AccountMenu />

      <section className="glass p-5 flex flex-col sm:flex-row sm:items-center gap-3 border border-emerald/20">
        <div className="p-2.5 rounded-lg bg-emerald/10 shrink-0 self-start">
          <UploadCloud className="h-6 w-6 text-emerald" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-lg">
            {lang === "ar" ? "لديك درس أو فرض غير موجود هنا؟" : "Un cours ou un devoir manquant ?"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "ar"
              ? "اطلب إضافة ملف: أرسل لنا وثيقتك وسننشرها لفائدة كل التلاميذ."
              : "Demande un upload : envoie-nous ton document, nous le publierons pour tous les élèves."}
          </p>
        </div>
        <Link to="/upload" className="bg-emerald text-background font-bold px-4 py-2 rounded-md text-center shrink-0">
          {lang === "ar" ? "طلب إضافة ملف" : "Demander un upload"}
        </Link>
      </section>



      <section>
        <h2 className="text-2xl font-bold mb-2">{t.levels_title}</h2>
        <p className="text-muted-foreground mb-6">{t.levels_subtitle}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEVELS.map((lv) => {
            const Icon = ICONS[lv];
            const accent = LEVEL_ACCENT[lv];
            return (
              <Link
                key={lv}
                to="/n/$level"
                params={{ level: lv }}
                className="glass glass-hover p-6 flex items-center gap-4"
              >
                <div className={`p-3 rounded-lg bg-${accent}/10 text-${accent}`}>
                  <Icon className="h-8 w-8" style={{ color: `var(--accent-${accent})` }} />
                </div>
                <div>
                  <div className="text-xl font-bold">{t.levels[lv]}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
