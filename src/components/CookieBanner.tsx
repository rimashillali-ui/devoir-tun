import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";

const STORAGE_KEY = "dv_cookie_consent_v1";

export function CookieBanner() {
  const { lang } = useLang();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  function decide(value: "accepted" | "rejected") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ value, at: Date.now() }));
    } catch {}
    setShow(false);
  }

  if (!show) return null;

  const ar = lang === "ar";
  const t = ar
    ? {
        title: "🍪 نحن نستخدم ملفات تعريف الارتباط",
        body:
          "نستخدم ملفات تعريف الارتباط لتحسين تجربتك وعرض إعلانات مخصصة. يمكنك القبول أو الرفض في أي وقت.",
        accept: "قبول الكل",
        reject: "رفض",
        more: "سياسة الخصوصية",
      }
    : {
        title: "🍪 Nous utilisons des cookies",
        body:
          "Nous utilisons des cookies pour améliorer votre expérience et afficher des publicités personnalisées. Vous pouvez accepter ou refuser à tout moment.",
        accept: "Tout accepter",
        reject: "Refuser",
        more: "Politique de confidentialité",
      };

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[9999] p-3 sm:p-4"
      role="dialog"
      aria-live="polite"
      aria-label={t.title}
      dir={ar ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-4xl rounded-xl border border-border bg-background/95 backdrop-blur shadow-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold mb-1">{t.title}</p>
          <p className="text-sm text-muted-foreground">
            {t.body}{" "}
            <a href="/privacy" className="underline text-primary">
              {t.more}
            </a>
            .
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => decide("rejected")}
            className="px-4 py-2 rounded-md border border-border text-sm hover:bg-muted transition"
          >
            {t.reject}
          </button>
          <button
            onClick={() => decide("accepted")}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
