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

export function generateDocTitle(opts: {
  level: string;
  track?: string | null;
  subject: string;
  section: string;
  term?: string | null;
  examSlot?: string | null;
  sortOrder: number;
}): { fr: string; ar: string } | null {
  const { level, track, subject, section, term, examSlot, sortOrder } = opts;
  if (!level || !subject || !section) return null;

  if (section === "devoirs") {
    if (!examSlot) return null;
    return generateDevoirTitle({ level, track, subject, examSlot, sortOrder });
  }

  const fr = translations.fr;
  const ar = translations.ar;
  const subjFr = fr.subjects[subject] ?? subject;
  const subjAr = ar.subjects[subject] ?? subject;
  const lvlFr = fr.levels[level] ?? level;
  const lvlAr = ar.levels[level] ?? level;
  const trkFr = track ? ` (${fr.tracks[track] ?? track})` : "";
  const trkAr = track ? ` (${ar.tracks[track] ?? track})` : "";
  const n = sortOrder && sortOrder > 0 ? sortOrder : 1;

  const labels: Record<string, { fr: string; ar: string }> = {
    cours: { fr: "Cours", ar: "درس" },
    series: { fr: "Série d'exercices", ar: "سلسلة تمارين" },
    texte: { fr: "Étude de texte", ar: "شرح نص" },
    conseils: { fr: "Conseils", ar: "نصائح" },
  };
  const lab = labels[section];
  if (!lab) return null;

  const termFr = term ? ` — ${term}` : "";
  const termAr = term ? ` — ${term}` : "";

  return {
    fr: `${lab.fr} n°${n} en ${subjFr} pour ${lvlFr}${trkFr}${termFr}`,
    ar: `${lab.ar} عدد ${n} في ${subjAr} للسنة ${lvlAr}${trkAr}${termAr}`.trim(),
  };
}
