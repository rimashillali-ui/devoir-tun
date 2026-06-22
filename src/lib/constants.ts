export const LEVELS = ["9eme", "1sec", "2sc", "3eme", "bac"] as const;
export type Level = (typeof LEVELS)[number];

export const TRACKS_BY_LEVEL: Record<Level, string[]> = {
  "9eme": [],
  "1sec": [],
  "2sc": [],
  "3eme": ["maths", "sciences", "info"],
  bac: ["maths", "sciences", "info", "eco", "tech"],
};

const BAC_COMMON = [
  "math",
  "physique",
  "svt",
  "francais",
  "arabe",
  "anglais",
  "philo",
  "histoire-geo",
  "education-islamique",
  "informatique",
];

export const SUBJECTS_BY_LEVEL_TRACK: Record<string, string[]> = {
  "9eme": ["math", "svt", "francais", "arabe", "anglais"],
  "1sec": ["math", "svt", "physique", "francais", "arabe"],
  "2sc": ["math", "physique", "svt", "francais"],
  "3eme:maths": ["math", "physique", "svt", "francais"],
  "3eme:sciences": ["math", "physique", "svt", "francais"],
  "3eme:info": ["math", "physique", "sti", "algo", "francais"],
  "bac:maths": BAC_COMMON,
  "bac:sciences": BAC_COMMON,
  "bac:info": [...BAC_COMMON, "algo", "sti"],
  "bac:eco": [...BAC_COMMON, "economie", "gestion"],
  "bac:tech": [...BAC_COMMON, "electrique", "mecanique"],
};

export function getTracks(level: string): string[] {
  return TRACKS_BY_LEVEL[level as Level] ?? [];
}

export function getSubjects(level: string, track?: string | null): string[] {
  const key = track ? `${level}:${track}` : level;
  return SUBJECTS_BY_LEVEL_TRACK[key] ?? [];
}

export const SECTIONS = ["cours", "series", "devoirs", "texte", "conseils"] as const;
export type Section = (typeof SECTIONS)[number];

export const ARTICLE_SECTIONS = new Set<string>(["texte", "conseils"]);
export const ARABIC_ONLY_SECTIONS = new Set<string>(["texte"]);
export const TEXTE_ALLOWED_SUBJECTS = new Set<string>(["arabe", "francais"]);

export const TERMS = ["T1", "T2", "T3"] as const;
export type Term = (typeof TERMS)[number];

export function getExamSlots(subject: string, term: Term): string[] {
  if (subject === "math") {
    return term === "T1" ? ["C1", "C2", "S1"] : term === "T2" ? ["C3", "C4", "S2"] : ["C5", "C6", "S3"];
  }
  return term === "T1" ? ["C1", "S1"] : term === "T2" ? ["C3", "S2"] : ["C5", "S3"];
}

export const AD_SLOTS = [
  "header",
  "footer",
  "corner_tl",
  "corner_tr",
  "corner_bl",
  "corner_br",
  "sidebar_left",
  "sidebar_right",
  "inlist",
] as const;
export type AdSlot = (typeof AD_SLOTS)[number];

export const LEVEL_ACCENT: Record<Level, string> = {
  "9eme": "emerald",
  "1sec": "indigo",
  "2sc": "cyan",
  "3eme": "rose",
  bac: "amber",
};
