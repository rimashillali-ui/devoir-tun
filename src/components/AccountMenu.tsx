import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, UploadCloud, ListChecks } from "lucide-react";
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
    },
    {
      to: "/upload" as const,
      params: undefined,
      icon: UploadCloud,
      title: lang === "ar" ? "طلب إضافة ملف" : "Demander un upload",
      desc: lang === "ar" ? "أرسل لنا وثيقتك" : "Envoie-nous ton document",
    },
    {
      to: "/quiz/$level/$subject" as const,
      params: { level: firstLevel, subject: "math" },
      icon: ListChecks,
      title: lang === "ar" ? "الاختبارات" : "Quiz",
      desc: lang === "ar" ? "اختبر معارفك" : "Teste tes connaissances",
    },
  ];

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">{lang === "ar" ? "مساحتي" : "Mon espace"}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((it) => (
          <Link
            key={it.title}
            to={it.to}
            params={it.params as never}
            className="glass glass-hover p-5 flex items-center gap-3"
          >
            <div className="p-2.5 rounded-lg bg-cyan/10">
              <it.icon className="h-6 w-6 text-cyan" />
            </div>
            <div>
              <div className="font-bold">{it.title}</div>
              <div className="text-sm text-muted-foreground">{it.desc}</div>
            </div>
          </Link>
        ))}
        <button
          type="button"
          onClick={() =>
            document.getElementById("levels")?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
          className="glass glass-hover p-5 flex items-center gap-3 text-start"
        >
          <div className="p-2.5 rounded-lg bg-indigo/10">
            <GraduationCap className="h-6 w-6 text-indigo" />
          </div>
          <div>
            <div className="font-bold">{lang === "ar" ? "اختر مستواك" : "Choisir un niveau"}</div>
            <div className="text-sm text-muted-foreground">
              {lang === "ar" ? "انزل إلى قائمة المستويات" : "Descendre vers les niveaux"}
            </div>
          </div>
        </button>
      </div>
    </section>
  );

}
