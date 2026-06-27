import { translations } from "./translations";

export function generateDevoirTitle(opts: {
  level: string;
  track?: string | null;
  subject: string;
  examSlot: string; // "C1" | "S2" | "C3" | "S3" | "C5" ...
  sortOrder: number; // x
}): { fr: string; ar: string } | null {
  const { level, track, subject, examSlot, sortOrder } = opts;
  if (!examSlot || !subject || !level) return null;
  const kind = examSlot[0]; // C or S
  const y = parseInt(examSlot.slice(1), 10);
  if (!y || (kind !== "C" && kind !== "S")) return null;
  const x = sortOrder && sortOrder > 0 ? sortOrder : 1;

  const fr = translations.fr;
  const ar = translations.ar;
  const subjFr = fr.subjects[subject] ?? subject;
  const subjAr = ar.subjects[subject] ?? subject;
  const lvlFr = fr.levels[level] ?? level;
  const lvlAr = ar.levels[level] ?? level;
  const trkFr = track ? fr.tracks[track] ?? track : "";
  const trkAr = track ? ar.tracks[track] ?? track : "";

  const labelFr = kind === "C" ? "Devoir de contrôle" : "Devoir de synthèse";
  const labelAr = kind === "C" ? "فرض مراقبة" : "فرض تأليفي";

  const frParen = trkFr ? ` (${trkFr})` : "";
  const arParen = trkAr ? ` (${trkAr})` : "";

  return {
    fr: `${labelFr} n°${y}-${x} en ${subjFr} pour ${lvlFr}${frParen}`,
    ar: `${labelAr} عدد ${y}-${x} في ${subjAr} للسنة ${lvlAr}${arParen}`.trim(),
  };
}
