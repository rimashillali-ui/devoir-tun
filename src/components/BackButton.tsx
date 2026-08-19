import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/lib/i18n";

export function BackButton({
  to,
  params,
}: {
  to: any;
  params?: Record<string, string>;
}) {
  const { t, dir } = useLang();
  const Icon = dir === "rtl" ? ArrowRight : ArrowLeft;
  return (
    <Link
      to={to}
      params={params as any}
      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
    >
      <Icon className="h-4 w-4" />
      <span>{t.back}</span>
    </Link>
  );
}
