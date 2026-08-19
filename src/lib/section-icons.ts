import {
  BookOpen,
  ListChecks,
  FileCheck2,
  ScrollText,
  Lightbulb,
  Sigma,
  FlaskConical,
  Cpu,
  TrendingUp,
  Wrench,
  FolderOpen,
  GraduationCap,
  Atom,
  Leaf,
  Languages,
  BookMarked,
  Globe,
  Brain,
  Map,
  Moon,
  Code2,
  Server,
  Briefcase,
  Zap,
  Cog,
  type LucideIcon,
} from "lucide-react";

export const SECTION_ICONS: Record<string, LucideIcon> = {
  cours: BookOpen,
  series: ListChecks,
  devoirs: FileCheck2,
  texte: ScrollText,
  conseils: Lightbulb,
};

export const TRACK_ICONS: Record<string, LucideIcon> = {
  maths: Sigma,
  sciences: FlaskConical,
  info: Cpu,
  eco: TrendingUp,
  tech: Wrench,
};

export const SUBJECT_ICONS: Record<string, LucideIcon> = {
  math: Sigma,
  physique: Atom,
  svt: Leaf,
  francais: Languages,
  arabe: BookMarked,
  anglais: Globe,
  philo: Brain,
  "histoire-geo": Map,
  "education-islamique": Moon,
  informatique: Cpu,
  algo: Code2,
  sti: Server,
  economie: TrendingUp,
  gestion: Briefcase,
  electrique: Zap,
  mecanique: Cog,
};

export function subjectIcon(subject: string): LucideIcon {
  return SUBJECT_ICONS[subject] ?? BookOpen;
}

export function sectionIcon(section: string): LucideIcon {
  return SECTION_ICONS[section] ?? FolderOpen;
}

export function trackIcon(track: string): LucideIcon {
  return TRACK_ICONS[track] ?? GraduationCap;
}
