import { LEVELS, getTracks, getSubjects } from "@/lib/constants";

export const TUTOR_LEVELS = LEVELS as readonly string[];

export const LEVEL_LABELS: Record<string, string> = {
  "9eme": "9ème année de base",
  "1sec": "1ère année secondaire",
  "2sc": "2ème année secondaire",
  "3eme": "3ème année secondaire",
  bac: "Baccalauréat",
};

export const SUBJECT_LABELS: Record<string, string> = {
  math: "Mathématiques",
  physique: "Physique-Chimie",
  svt: "Sciences de la vie et de la Terre",
  francais: "Français",
  arabe: "Arabe",
  anglais: "Anglais",
  philo: "Philosophie",
  "histoire-geo": "Histoire-Géographie",
  informatique: "Informatique",
  algo: "Algorithmique",
  sti: "STI",
  economie: "Économie",
  gestion: "Gestion",
  electrique: "Génie électrique",
  mecanique: "Génie mécanique",
};

/** Toutes les matières d'un niveau (union de ses filières). */
export function subjectsForLevel(level: string): string[] {
  const tracks = getTracks(level);
  const all = tracks.length === 0 ? getSubjects(level) : tracks.flatMap((t) => getSubjects(level, t));
  return Array.from(new Set(all));
}

export function subjectLabel(id: string) {
  return SUBJECT_LABELS[id] ?? id;
}
