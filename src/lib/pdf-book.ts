/**
 * Lecture d'un livre complet (PDF de plusieurs pages) côté navigateur.
 * - On extrait le texte de chaque page (rapide, économe).
 * - Les pages sans texte (scans / photos) sont converties en images pour la vision.
 */

export type BookProgress = { page: number; total: number };

export type BookResult = {
  name: string;
  pages: number;
  /** Texte complet du livre, pages numérotées. */
  text: string;
  /** Images (data URL JPEG) des pages scannées, pour l'analyse visuelle. */
  images: string[];
  /** Nombre de pages scannées non converties (au-delà de la limite vision). */
  skippedScans: number;
};

const MAX_TEXT_CHARS = 240_000;
const MAX_VISION_PAGES = 12;
const RENDER_WIDTH = 1100;

export type ReadBookOptions = {
  /** "auto" : images seulement pour les pages sans texte. "always" : vision sur toutes les pages. */
  vision?: "auto" | "always";
  /** Nombre maximum de pages converties en images. */
  maxVisionPages?: number;
  /** Ne rend en image qu'à partir de cette page (1-indexé). */
  fromPage?: number;
  /** Dernière page traitée (incluse). */
  toPage?: number;
};

/** Rend une plage de pages d'un PDF en images JPEG (data URL) pour la vision. */
export async function renderBookPages(
  file: File,
  opts: { fromPage: number; toPage: number; onProgress?: (p: BookProgress) => void },
): Promise<{ page: number; image: string }[]> {
  const pdfjs = await loadPdfjs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const total: number = pdf.numPages;
  const last = Math.min(total, opts.toPage);
  const out: { page: number; image: string }[] = [];
  for (let i = Math.max(1, opts.fromPage); i <= last; i++) {
    opts.onProgress?.({ page: i, total: last });
    const page = await pdf.getPage(i);
    const img = await renderPageToJpeg(page);
    if (img) out.push({ page: i, image: img });
    page.cleanup?.();
  }
  return out;
}

/** Nombre de pages d'un PDF. */
export async function countPages(file: File): Promise<number> {
  const pdfjs = await loadPdfjs();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  return pdf.numPages as number;
}


async function loadPdfjs() {
  const pdfjs: any = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjs;
}

async function renderPageToJpeg(page: any): Promise<string | null> {
  const base = page.getViewport({ scale: 1 });
  const scale = Math.min(2, RENDER_WIDTH / base.width);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  await page.render({ canvasContext: ctx, viewport }).promise;
  const url = canvas.toDataURL("image/jpeg", 0.72);
  canvas.width = 0;
  canvas.height = 0;
  return url.startsWith("data:image/") ? url : null;
}

/** Lit un PDF entier (texte + pages scannées en images). */
export async function readBook(file: File, onProgress?: (p: BookProgress) => void): Promise<BookResult> {
  const pdfjs = await loadPdfjs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const total: number = pdf.numPages;

  const parts: string[] = [];
  const images: string[] = [];
  let skippedScans = 0;
  let chars = 0;

  for (let i = 1; i <= total; i++) {
    onProgress?.({ page: i, total });
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((it: any) => it.str ?? "")
      .join(" ")
      .replace(/[ \t]+/g, " ")
      .trim();

    if (text.length > 40) {
      if (chars < MAX_TEXT_CHARS) {
        const block = `\n\n[Page ${i}]\n${text}`;
        parts.push(block);
        chars += block.length;
      }
    } else if (images.length < MAX_VISION_PAGES) {
      const img = await renderPageToJpeg(page);
      if (img) images.push(img);
      else skippedScans += 1;
    } else {
      skippedScans += 1;
    }
    page.cleanup?.();
  }

  return {
    name: file.name,
    pages: total,
    text: parts.join("").slice(0, MAX_TEXT_CHARS).trim(),
    images,
    skippedScans,
  };
}
