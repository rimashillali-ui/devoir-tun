import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";

export function AiTutorPromo({ className }: { className?: string }) {
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

  return (
    <div className={`glass p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-3 border border-cyan/20 ${className ?? ""}`}>
      <div className="p-2.5 rounded-lg bg-cyan/10 shrink-0 self-start">
        <Sparkles className="h-6 w-6 text-cyan" />
      </div>
      <div className="flex-1">
        <h2 className="font-bold text-base md:text-lg">
          {lang === "ar" ? "لم تفهم هذا الدرس؟ اسأل المعلّم الذكي" : "Tu n'as pas compris ce document ?"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {lang === "ar"
            ? "يشرح لك التمارين خطوة بخطوة، بالعربية أو بالفرنسية، ويمكنك إرسال صورة للتمرين. مجاني وفوري."
            : "Le Tuteur IA t'explique les exercices étape par étape, en français ou en arabe — tu peux même envoyer une photo de ton exercice. Gratuit et instantané."}
        </p>
      </div>
      <Link
        to="/tutor"
        className="bg-cyan text-background font-bold px-4 py-2 rounded-md flex items-center gap-2 justify-center shrink-0"
      >
        {lang === "ar" ? "اسأل المعلّم الذكي" : "Demander au Tuteur IA"}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
