/**
 * Extraction de texte côté navigateur (PDF via pdfjs, sinon texte brut).
 * Utilisé par l'admin (base de cours du tuteur) et par les élèves (pièce jointe au chat).
 */
export async function extractTextFromFile(file: File, maxChars = 120_000): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const pdfjs: any = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

    const buffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buffer }).promise;
    const parts: string[] = [];
    let total = 0;
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((it: any) => (typeof it.str === "string" ? it.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (text) {
        parts.push(text);
        total += text.length;
        if (total >= maxChars) break;
      }
    }
    const out = parts.join("\n\n").slice(0, maxChars);
    if (!out.trim()) {
      throw new Error("Aucun texte détecté (PDF scanné en image ?). Copie/colle le texte manuellement.");
    }
    return out;
  }

  if (
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    name.endsWith(".csv") ||
    file.type.startsWith("text/")
  ) {
    const text = await file.text();
    return text.replace(/\r\n/g, "\n").slice(0, maxChars);
  }

  throw new Error("Format non supporté. Utilise un PDF, .txt ou .md.");
}
