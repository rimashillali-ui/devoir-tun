/**
 * Lecture d'un document COURT côté visiteur (élève) :
 * - PDF : jusqu'à MAX_PAGES pages (texte + vision pour les pages scannées)
 * - Word (.docx) : extraction du texte
 * Les livres complets (des centaines de pages) sont réservés à l'administration.
 */

export type ShortDocProgress = { page: number; total: number };

export type ShortDocResult = {
  name: string;
  pages: number;
  text: string;
  images: string[];
  /** Pages au-delà de la limite, non lues. */
  truncatedPages: number;
};

export const MAX_PAGES = 10;
export const MAX_VISION_PAGES = 4;
export const MAX_TEXT_CHARS = 30_000;
export const MAX_SIZE_BYTES = 8 * 1024 * 1024;
const RENDER_WIDTH = 1100;

export function isSupportedDoc(file: File) {
  const n = file.name.toLowerCase();
  return (
    n.endsWith(".pdf") ||
    n.endsWith(".docx") ||
    n.endsWith(".doc") ||
    file.type === "application/pdf" ||
    file.type.includes("word")
  );
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

async function readDocx(file: File): Promise<string> {
  const mammoth: any = await import("mammoth/mammoth.browser.js");
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return String(value ?? "").replace(/[ \t]+/g, " ").trim();
}

export async function readShortDoc(
  file: File,
  onProgress?: (p: ShortDocProgress) => void,
): Promise<ShortDocResult> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".docx") || (!name.endsWith(".pdf") && file.type.includes("word"))) {
    const text = (await readDocx(file)).slice(0, MAX_TEXT_CHARS);
    return { name: file.name, pages: 1, text, images: [], truncatedPages: 0 };
  }

  if (name.endsWith(".doc")) {
    throw new Error("doc-legacy");
  }

  const pdfjs = await loadPdfjs();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const total: number = pdf.numPages;
  const last = Math.min(total, MAX_PAGES);

  const parts: string[] = [];
  const images: string[] = [];
  let chars = 0;

  for (let i = 1; i <= last; i++) {
    onProgress?.({ page: i, total: last });
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
    }
    page.cleanup?.();
  }

  return {
    name: file.name,
    pages: last,
    text: parts.join("").slice(0, MAX_TEXT_CHARS).trim(),
    images,
    truncatedPages: Math.max(0, total - last),
  };
}
