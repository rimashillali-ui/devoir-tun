import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useLang } from "@/lib/i18n";
import { getDownloadUrl } from "@/lib/downloads.functions";
import { supabase } from "@/integrations/supabase/client";

function makeChallenge() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b, answer: a + b };
}

export function DownloadCountdown({ docId, seconds }: { docId: string; seconds: number }) {
  const { t, lang } = useLang();
  const fetchUrl = useServerFn(getDownloadUrl);
  const [left, setLeft] = useState(seconds);
  const [verified, setVerified] = useState(false);
  const [challenge, setChallenge] = useState(() => makeChallenge());
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (!verified || left <= 0) return;
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left, verified]);

  // Récupère l'URL réelle UNIQUEMENT quand captcha validé + compte à rebours terminé
  useEffect(() => {
    if (!verified || left > 0 || url || loading) return;
    setLoading(true);
    fetchUrl({ data: { id: docId } })
      .then((res) => setUrl(res.url))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [verified, left, url, loading, fetchUrl, docId]);

  const labels = useMemo(
    () =>
      lang === "ar"
        ? {
            title: "تأكيد أنك لست روبوتاً",
            hint: "احسب العملية التالية للمتابعة",
            verify: "تحقق",
            wrong: "إجابة خاطئة، حاول مرة أخرى",
            placeholder: "النتيجة",
            loading: "جاري التحضير…",
            error: "تعذر تحضير الرابط، حاول مجدداً",
          }
        : {
            title: "Vérifiez que vous n'êtes pas un robot",
            hint: "Résolvez l'opération pour continuer",
            verify: "Vérifier",
            wrong: "Réponse incorrecte, réessayez",
            placeholder: "Résultat",
            loading: "Préparation du lien…",
            error: "Impossible de préparer le lien, réessayez",
          },
    [lang]
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (Number(value.trim()) === challenge.answer) {
      setVerified(true);
      setError(false);
    } else {
      setError(true);
      setChallenge(makeChallenge());
      setValue("");
    }
  }

  if (!verified) {
    return (
      <form onSubmit={submit} className="glass p-8 text-center space-y-4">
        <h2 className="text-lg font-semibold">{labels.title}</h2>
        <p className="text-sm text-muted-foreground">{labels.hint}</p>
        <div className="flex items-center justify-center gap-3 text-2xl font-bold tabular-nums">
          <span>{challenge.a}</span>
          <span>+</span>
          <span>{challenge.b}</span>
          <span>=</span>
          <input
            type="number"
            inputMode="numeric"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={labels.placeholder}
            className="w-24 rounded-md bg-background border border-border px-3 py-2 text-center text-lg"
          />
        </div>
        {error && <p className="text-destructive text-sm">{labels.wrong}</p>}
        <button
          type="submit"
          className="bg-primary text-primary-foreground font-semibold py-2 px-6 rounded-md hover:opacity-90 transition"
        >
          {labels.verify}
        </button>
      </form>
    );
  }

  if (left > 0) {
    return (
      <div className="glass p-8 text-center space-y-4">
        <div className="text-6xl font-bold text-cyan tabular-nums">{left}</div>
        <p className="text-muted-foreground">
          {t.please_wait} — {left} {t.seconds}
        </p>
      </div>
    );
  }

  if (fetchError) {
    return <div className="glass p-6 text-center text-destructive">{labels.error}</div>;
  }

  if (!url) {
    return <div className="glass p-6 text-center text-muted-foreground">{labels.loading}</div>;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full text-center bg-emerald text-background font-bold py-4 px-6 rounded-lg hover:opacity-90 transition"
    >
      ⬇ {t.download_now}
    </a>
  );
}
