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

export function sectionIcon(section: string): LucideIcon {
  return SECTION_ICONS[section] ?? FolderOpen;
}

export function trackIcon(track: string): LucideIcon {
  return TRACK_ICONS[track] ?? GraduationCap;
}
