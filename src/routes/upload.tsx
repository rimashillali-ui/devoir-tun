import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { UploadCloud, ExternalLink, LogIn, Loader2 } from "lucide-react";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Envoyer un document — Devoiratouna" },
      {
        name: "description",
        content:
          "Partagez vos cours, séries d'exercices et devoirs avec Devoiratouna : remplissez le formulaire et joignez votre fichier.",
      },
      { property: "og:title", content: "Envoyer un document — Devoiratouna" },
      {
        property: "og:description",
        content: "Formulaire d'envoi de fichiers (cours, exercices, devoirs) pour les élèves de Devoiratouna.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UploadPage,
});

function normalizeFormUrl(url: string) {
  const clean = url.trim();
  if (!clean) return "";
  return clean.includes("/viewform") ? clean.replace("/viewform", "/viewform?embedded=true") : clean;
}

function UploadPage() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const [email, setEmail] = useState<string | null>(null);
  const [formUrl, setFormUrl] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: u }, { data: s }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("site_settings").select("value_json").eq("key", "upload_form_url").maybeSingle(),
      ]);
      setEmail(u.user?.email ?? null);
      setFormUrl(String((s?.value_json as any) ?? ""));
      setReady(true);
    })();
  }, []);

  if (!ready)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-cyan" />
      </div>
    );

  if (!email)
    return (
      <div className="max-w-xl mx-auto glass p-6 space-y-4 text-center">
        <UploadCloud className="h-8 w-8 text-cyan mx-auto" />
        <h1 className="text-2xl font-bold">{ar ? "إرسال ملف" : "Envoyer un document"}</h1>
        <p className="text-sm text-muted-foreground">
          {ar
            ? "يجب تسجيل الدخول لإرسال ملفاتك."
            : "Connectez-vous à votre compte pour envoyer vos fichiers."}
        </p>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-2 rounded-md"
        >
          <LogIn className="h-4 w-4" />
          {ar ? "تسجيل الدخول" : "Se connecter"}
        </Link>
      </div>
    );

  const src = normalizeFormUrl(formUrl);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="glass p-5 space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UploadCloud className="h-6 w-6 text-cyan" />
          {ar ? "إرسال ملف" : "Envoyer un document"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {ar
            ? `أنت متصل بـ ${email}. املأ الاستمارة وأرفق ملفك (PDF أو صورة)؛ يتم استلامه مباشرة على Google Drive.`
            : `Connecté avec ${email}. Remplissez le formulaire et joignez votre fichier (PDF ou image) : il nous parvient directement sur Google Drive.`}
        </p>
        {src && (
          <a
            href={formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-cyan hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            {ar ? "فتح الاستمارة في نافذة جديدة" : "Ouvrir le formulaire dans un nouvel onglet"}
          </a>
        )}
      </div>

      {src ? (
        <div className="glass overflow-hidden">
          <iframe
            src={src}
            title={ar ? "استمارة إرسال الملفات" : "Formulaire d'envoi de fichiers"}
            className="w-full h-[1200px] border-0 bg-white"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="glass p-5 text-sm text-muted-foreground">
          {ar
            ? "لم تتم إضافة رابط الاستمارة بعد. سيتم تفعيل هذه الخدمة قريبًا."
            : "Le formulaire d'envoi n'est pas encore configuré. Cette fonctionnalité sera disponible très bientôt."}
        </div>
      )}
    </div>
  );
}
