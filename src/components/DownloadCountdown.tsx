import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";

export function DownloadCountdown({ url, seconds }: { url: string; seconds: number }) {
  const { t } = useLang();
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  if (left > 0) {
    return (
      <div className="glass p-8 text-center space-y-4">
        <div className="text-6xl font-bold text-cyan tabular-nums">{left}</div>
        <p className="text-muted-foreground">{t.please_wait} — {left} {t.seconds}</p>
      </div>
    );
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
