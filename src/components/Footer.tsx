import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="mt-16 border-t border-white/5 py-8 text-sm text-muted-foreground">
      <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>© {new Date().getFullYear()} {t.site_name}</div>
        <nav className="flex flex-wrap items-center gap-4">
          <Link to="/about" className="hover:text-foreground">{t.about}</Link>
          <Link to="/contact" className="hover:text-foreground">{t.contact}</Link>
          <Link to="/privacy" className="hover:text-foreground">{t.privacy}</Link>
          <Link to="/terms" className="hover:text-foreground">{t.terms_page}</Link>
        </nav>
      </div>
    </footer>
  );
}
