import { useEffect, useRef, useState } from "react";

/**
 * Lecteur PDF maison : rend chaque page dans un <canvas>.
 * Aucune barre d'outils, aucun bouton de téléchargement/impression natif,
 * et l'URL réelle du fichier n'est jamais exposée (on passe par notre proxy).
 *
 * Optimisations : chargement en flux (pdf.js télécharge progressivement),
 * la première page s'affiche dès qu'elle est prête, les suivantes sont
 * rendues à la demande quand elles approchent de l'écran.
 */
export function PdfCanvasViewer({ src, title }: { src: string; title?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [pages, setPages] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;
    let observer: IntersectionObserver | null = null;

    (async () => {
      try {
        const [pdfjs, worker] = await Promise.all([
          import("pdfjs-dist") as Promise<any>,
          import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
        ]);
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

        // Chargement en flux : pas d'attente du fichier complet.
        const pdf = await pdfjs.getDocument({
          url: src,
          disableStream: false,
          disableAutoFetch: false,
        }).promise;
        if (cancelled) return;

        setPages(pdf.numPages);
        container.innerHTML = "";

        const width = Math.min(container.clientWidth || 800, 1100);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rendered = new Set<number>();

        const renderPage = async (index: number, canvas: HTMLCanvasElement) => {
          if (cancelled || rendered.has(index)) return;
          rendered.add(index);
          try {
            const page = await pdf.getPage(index);
            if (cancelled) return;
            const base = page.getViewport({ scale: 1 });
            const scale = (width / base.width) * dpr;
            const viewport = page.getViewport({ scale });
            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            await page.render({ canvasContext: ctx, viewport }).promise;
          } catch {
            rendered.delete(index);
          }
        };

        // Ratio de la première page pour réserver la place des placeholders.
        const first = await pdf.getPage(1);
        if (cancelled) return;
        const firstView = first.getViewport({ scale: 1 });
        const ratio = firstView.height / firstView.width;

        const canvases: HTMLCanvasElement[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const canvas = document.createElement("canvas");
          canvas.width = 1;
          canvas.height = Math.max(1, Math.floor(ratio * 1));
          canvas.style.width = "100%";
          canvas.style.aspectRatio = `1 / ${ratio}`;
          canvas.style.height = "auto";
          canvas.style.display = "block";
          canvas.className = "rounded-md bg-white mx-auto";
          canvas.dataset["page"] = String(i);
          container.appendChild(canvas);
          canvases.push(canvas);
        }

        // Rendu immédiat des premières pages visibles.
        const firstCanvas = canvases[0];
        if (firstCanvas) await renderPage(1, firstCanvas);
        if (cancelled) return;
        setStatus("ready");
        const secondCanvas = canvases[1];
        if (secondCanvas) void renderPage(2, secondCanvas);

        observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              const el = entry.target as HTMLCanvasElement;
              const index = Number(el.dataset["page"]);
              if (index) void renderPage(index, el);
            }
          },
          { root: container, rootMargin: "800px 0px" },
        );
        canvases.forEach((c) => observer?.observe(c));
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      observer?.disconnect();
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
