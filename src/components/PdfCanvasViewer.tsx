import { useEffect, useRef, useState } from "react";

/**
 * Lecteur PDF maison : rend chaque page dans un <canvas>.
 * Aucune barre d'outils, aucun bouton de téléchargement/impression natif,
 * et l'URL réelle du fichier n'est jamais exposée (on passe par notre proxy).
 */
export function PdfCanvasViewer({ src, title }: { src: string; title?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [pages, setPages] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    (async () => {
      try {
        const pdfjs: any = await import("pdfjs-dist");
        const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

        const res = await fetch(src);
        if (!res.ok) throw new Error("fetch failed");
        const buffer = await res.arrayBuffer();
        if (cancelled) return;

        const pdf = await pdfjs.getDocument({ data: buffer }).promise;
        if (cancelled) return;
        setPages(pdf.numPages);
        container.innerHTML = "";

        const width = Math.min(container.clientWidth || 800, 1100);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const scale = (width / base.width) * dpr;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.style.display = "block";
          canvas.className = "rounded-md bg-white mx-auto";
          container.appendChild(canvas);

          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          await page.render({ canvasContext: ctx, viewport }).promise;
        }
        if (!cancelled) setStatus("ready");
      } catch (e) {

        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    <div
      className="w-full rounded-lg border border-white/10 bg-black/30 p-2 sm:p-3"
      onContextMenu={(e) => e.preventDefault()}
    >
      {status === "loading" && (
        <p className="py-10 text-center text-sm text-muted-foreground">Chargement du document…</p>
      )}
      {status === "error" && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Impossible d'afficher l'aperçu de ce document.
        </p>
      )}
      <div
        ref={containerRef}
        aria-label={title ?? "Document"}
        className="space-y-3 max-h-[calc(100vh-200px)] min-h-[420px] overflow-y-auto select-none"
      />
      {status === "ready" && pages > 0 && (
        <p className="pt-2 text-center text-xs text-muted-foreground">{pages} page(s)</p>
      )}
    </div>
  );
}
