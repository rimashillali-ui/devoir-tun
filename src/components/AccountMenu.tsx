import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, UploadCloud, ListChecks, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { QUIZ_MENU } from "@/lib/quizzes";

export function AccountMenu() {
  const { lang } = useLang();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setSignedIn(!!data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session?.user));
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  if (!signedIn) return null;
  const firstLevel = QUIZ_MENU[0]?.level ?? "9eme";

  const items = [
    {
      to: "/tutor" as const,
      params: undefined,
      icon: Sparkles,
      title: lang === "ar" ? "المعلّم الذكي" : "Tuteur IA",
      desc: lang === "ar" ? "شرح التمارين خطوة بخطوة" : "Explications pas à pas",
      accent: "cyan",
    },
    {
      to: "/upload" as const,
      params: undefined,
      icon: UploadCloud,
      title: lang === "ar" ? "طلب إضافة ملف" : "Demander un upload",
      desc: lang === "ar" ? "أرسل لنا وثيقتك" : "Envoie-nous ton document",
      accent: "cyan",
    },
    {
      to: "/quiz/$level/$subject" as const,
      params: { level: firstLevel, subject: "math" },
      icon: ListChecks,
      title: lang === "ar" ? "الاختبارات" : "Quiz",
      desc: lang === "ar" ? "اختبر معارفك" : "Teste tes connaissances",
      accent: "cyan",
    },
  ];

  const scrollToLevels = () => {
    document.getElementById("levels")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">{lang === "ar" ? "مساحتي" : "Mon espace"}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {items.map((it) => {
          const accentBg = it.accent === "cyan" ? "bg-cyan/10" : "bg-indigo/10";
          const accentText = it.accent === "cyan" ? "text-cyan" : "text-indigo";
          return (
            <Link
              key={it.title}
              to={it.to}
              params={it.params as never}
              className="glass glass-hover p-6 flex items-center gap-4 transition-transform duration-200 hover:-translate-y-1"
            >
              <div className={`p-3 rounded-xl ${accentBg} shrink-0`}>
                <it.icon className={`h-7 w-7 ${accentText}`} />
              </div>
              <div className="min-w-0">
                <div className="font-bold truncate">{it.title}</div>
                <div className="text-sm text-muted-foreground truncate">{it.desc}</div>
              </div>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={scrollToLevels}
          className="glass glass-hover p-6 flex items-center gap-4 text-start transition-transform duration-200 hover:-translate-y-1"
        >
          <div className="p-3 rounded-xl bg-indigo/10 shrink-0">
            <GraduationCap className="h-7 w-7 text-indigo" />
          </div>
          <div className="min-w-0">
            <div className="font-bold truncate">{lang === "ar" ? "اختر مستواك" : "Choisir un niveau"}</div>
            <div className="text-sm text-muted-foreground truncate">
              {lang === "ar" ? "انزل إلى قائمة المستويات" : "Descendre vers les niveaux"}
            </div>
          </div>
        </button>
      </div>
    </section>
  );
}
