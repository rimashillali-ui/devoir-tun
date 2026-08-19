import { useEffect } from "react";
import { X } from "lucide-react";

export function AdminModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="glass relative z-10 w-full max-w-3xl rounded-xl border border-white/10 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 sticky top-0 glass rounded-t-xl">
          <h2 className="font-bold text-lg">{title}</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-md hover:bg-white/10" aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 max-h-[calc(100vh-9rem)] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
