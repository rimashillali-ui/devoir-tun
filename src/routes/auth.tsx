import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { toast } from "sonner";
import { bootstrapAdmin, hasAnyAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Connexion — Devoiratouna" }],
    links: [{ rel: "canonical", href: "/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useLang();
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null);
      if (data.user) {
        const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
        setIsAdmin(!!r);
      }
    });
    hasAnyAdmin().then((v: boolean) => setAdminExists(v)).catch(() => setAdminExists(true));
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password, options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Compte créé. Vous êtes connecté.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      const { data: u } = await supabase.auth.getUser();
      setUser(u.user);
      if (u.user) {
        const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
        if (r) nav({ to: "/admin" });
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally { setBusy(false); }
  }

  async function bootstrap() {
    setBusy(true);
    try {
      const res = await bootstrapAdmin();
      if (res.ok) { toast.success("Promu administrateur !"); setIsAdmin(true); }
      else toast.error("Un administrateur existe déjà");
    } catch (err: any) { toast.error(err.message); } finally { setBusy(false); }
  }

  if (user) {
    return (
      <div className="max-w-md mx-auto glass p-6 space-y-4 text-center">
        <p>Connecté en tant que <strong>{user.email}</strong></p>
        {isAdmin ? (
          <Link to="/admin" className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-md">
            {t.admin}
          </Link>
        ) : adminExists === false ? (
          <button disabled={busy} onClick={bootstrap} className="bg-emerald text-background font-bold px-4 py-2 rounded-md">
            {t.promote_me_admin}
          </button>
        ) : (
          <p className="text-muted-foreground text-sm">Vous n'avez pas les droits administrateur.</p>
        )}
        <button onClick={async () => { await supabase.auth.signOut(); location.reload(); }}
          className="block w-full text-sm text-muted-foreground hover:text-foreground">
          {t.logout}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto glass p-6 space-y-4">
      <h1 className="text-2xl font-bold">{mode === "signin" ? t.signin : t.signup}</h1>
      <form onSubmit={submit} className="space-y-3">
        <input name="email" type="email" required placeholder={t.email}
          className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2" />
        <input name="password" type="password" required minLength={6} placeholder={t.password}
          className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2" />
        <button disabled={busy} className="w-full bg-primary text-primary-foreground font-bold py-2 rounded-md disabled:opacity-50">
          {busy ? "..." : (mode === "signin" ? t.signin : t.signup)}
        </button>
      </form>
      <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="text-sm text-muted-foreground hover:text-foreground">
        {mode === "signin" ? `→ ${t.signup}` : `→ ${t.signin}`}
      </button>
    </div>
  );
}
