import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { LEVELS, getTracks, getSubjects, SECTIONS } from "@/lib/constants";
import { submitUpload } from "@/lib/uploads.functions";
import { UploadCloud, LogIn, Loader2, CheckCircle2, FileUp, AlertCircle } from "lucide-react";

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

const LEVEL_LABELS: Record<string, { fr: string; ar: string }> = {
  "9eme": { fr: "9ème année de base", ar: "التاسعة أساسي" },
  "1sec": { fr: "1ère année secondaire", ar: "الأولى ثانوي" },
  "2sc": { fr: "2ème année secondaire", ar: "الثانية ثانوي" },
  "3eme": { fr: "3ème année secondaire", ar: "الثالثة ثانوي" },
  bac: { fr: "Baccalauréat", ar: "بكالوريا" },
};

const SECTION_LABELS: Record<string, { fr: string; ar: string }> = {
  cours: { fr: "Cours", ar: "دروس" },
  series: { fr: "Séries d'exercices", ar: "تمارين" },
  devoirs: { fr: "Devoirs", ar: "فروض" },
  texte: { fr: "شرح نص", ar: "شرح نص" },
  conseils: { fr: "Conseils", ar: "نصائح" },
};

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
    reader.readAsDataURL(file);
  });
}

function UploadPage() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const send = useServerFn(submitUpload);

  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const [level, setLevel] = useState<string>("9eme");
  const [track, setTrack] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [section, setSection] = useState<string>("cours");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
      setReady(true);
    })();
  }, []);

  const tracks = useMemo(() => getTracks(level), [level]);
  const subjects = useMemo(() => getSubjects(level, track || null), [level, track]);

  useEffect(() => {
    setTrack(tracks[0] ?? "");
  }, [level]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!subjects.includes(subject)) setSubject(subjects[0] ?? "");
  }, [subjects]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError(ar ? "أرفق ملفًا." : "Joignez un fichier.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError(ar ? "الملف كبير جدًا (25 ميغا كأقصى حد)." : "Fichier trop volumineux (max 25 Mo).");
      return;
    }
    setBusy(true);
    try {
      const fileBase64 = await fileToBase64(file);
      await send({
        data: {
          level,
          track: track || null,
          subject,
          section,
          title: title.trim(),
          note: note.trim(),
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          fileBase64,
        },
      });
      setDone(true);
      setTitle("");
      setNote("");
      setFile(null);
    } catch (err: any) {
      setError(err?.message ?? (ar ? "فشل الإرسال." : "L'envoi a échoué."));
    } finally {
      setBusy(false);
    }
  }

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
          {ar ? "يجب تسجيل الدخول لإرسال ملفاتك." : "Connectez-vous à votre compte pour envoyer vos fichiers."}
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

  const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5";
  const inputCls =
    "w-full bg-background/60 border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-cyan/60";

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="glass p-5 space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UploadCloud className="h-6 w-6 text-cyan" />
          {ar ? "إرسال ملف" : "Envoyer un document"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {ar
            ? "املأ الاستمارة وأرفق ملفك (PDF أو صورة)؛ يُرسَل مباشرة إلى فريق ديفواراتونا."
            : "Remplissez le formulaire et joignez votre fichier (PDF ou image) : il nous parvient directement."}
        </p>
      </div>

      {done ? (
        <div className="glass p-6 space-y-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
          <p className="font-bold text-lg">{ar ? "تم الإرسال بنجاح 🎉" : "Fichier envoyé avec succès 🎉"}</p>
          <p className="text-sm text-muted-foreground">
            {ar
              ? "سنراجع الملف ثم ننشره على المنصة. شكرًا لمساهمتك!"
              : "Nous vérifions le document puis le publions sur la plateforme. Merci pour ta contribution !"}
          </p>
          <button
            onClick={() => setDone(false)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-2 rounded-md"
          >
            <FileUp className="h-4 w-4" />
            {ar ? "إرسال ملف آخر" : "Envoyer un autre fichier"}
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="glass p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{ar ? "المستوى" : "Niveau"}</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputCls}>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {ar ? LEVEL_LABELS[l].ar : LEVEL_LABELS[l].fr}
                  </option>
                ))}
              </select>
            </div>

            {tracks.length > 0 && (
              <div>
                <label className={labelCls}>{ar ? "الشعبة" : "Filière"}</label>
                <select value={track} onChange={(e) => setTrack(e.target.value)} className={inputCls}>
                  {tracks.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className={labelCls}>{ar ? "المادة" : "Matière"}</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls}>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>{ar ? "النوع" : "Type de document"}</label>
              <select value={section} onChange={(e) => setSection(e.target.value)} className={inputCls}>
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    {ar ? SECTION_LABELS[s].ar : SECTION_LABELS[s].fr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>{ar ? "العنوان" : "Titre du document"}</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={ar ? "مثال: فرض مراقبة عدد 1" : "Ex : Devoir de contrôle n°1"}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>{ar ? "ملاحظة (اختياري)" : "Remarque (optionnel)"}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className={inputCls}
              placeholder={ar ? "معلومات إضافية…" : "Informations complémentaires…"}
            />
          </div>

          <div>
            <label className={labelCls}>{ar ? "الملف (PDF أو صورة، 25 ميغا كأقصى حد)" : "Fichier (PDF ou image, max 25 Mo)"}</label>
            <label className="flex items-center gap-3 border border-dashed border-border rounded-md px-4 py-6 cursor-pointer hover:border-cyan/60 transition-colors">
              <FileUp className="h-5 w-5 text-cyan shrink-0" />
              <span className="text-sm text-muted-foreground truncate">
                {file ? file.name : ar ? "اختر ملفًا…" : "Choisir un fichier…"}
              </span>
              <input
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {error && (
            <p className="flex items-start gap-2 text-sm text-rose-400">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-md disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {busy ? (ar ? "جارٍ الإرسال…" : "Envoi en cours…") : ar ? "إرسال" : "Envoyer"}
          </button>
        </form>
      )}
    </div>
  );
}
