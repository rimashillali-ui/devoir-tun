import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { Languages, BookOpen, LogIn, LogOut, Shield, Sparkles } from "lucide-react";
import { UserSidebar } from "@/components/UserSidebar";

export function Navbar() {
  const { t, lang, toggle } = useLang();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted) return;
      setUser(data.user ?? null);
      if (data.user) {
        const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
        setIsAdmin(!!r);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setIsAdmin(false);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  return (
    <header className="sticky top-0 z-40 glass border-b border-white/5">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <BookOpen className="h-5 w-5 text-cyan" />
          <span className="bg-gradient-to-r from-cyan to-indigo bg-clip-text text-transparent">{t.site_name}</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link to="/tutor" className="px-2 py-1.5 rounded-md hover:bg-white/5 flex items-center gap-1.5 text-cyan">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Tuteur IA</span>
          </Link>
          <Link to="/about" className="hidden md:inline px-2 py-1.5 rounded-md hover:bg-white/5">{t.about}</Link>

          <Link to="/contact" className="hidden md:inline px-2 py-1.5 rounded-md hover:bg-white/5">{t.contact}</Link>
          <Link to="/privacy" className="hidden lg:inline px-2 py-1.5 rounded-md hover:bg-white/5">{t.privacy}</Link>
          <Link to="/terms" className="hidden lg:inline px-2 py-1.5 rounded-md hover:bg-white/5">{t.terms_page}</Link>
          <button
            onClick={toggle}
            className="px-3 py-1.5 rounded-md hover:bg-white/5 flex items-center gap-1.5"
            aria-label={t.language}
          >
            <Languages className="h-4 w-4" />
            <span>{lang === "ar" ? "FR" : "AR"}</span>
          </button>
          {isAdmin && (
            <Link to="/admin" className="px-3 py-1.5 rounded-md hover:bg-white/5 flex items-center gap-1.5">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">{t.admin}</span>
            </Link>
          )}
          {user && <UserSidebar />}
          {user ? (
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
              className="px-3 py-1.5 rounded-md hover:bg-white/5 flex items-center gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t.logout}</span>
            </button>
          ) : (
            <Link to="/auth" className="px-3 py-1.5 rounded-md hover:bg-white/5 flex items-center gap-1.5">
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">{t.login}</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
