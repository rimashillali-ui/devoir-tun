import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useLang } from "@/lib/i18n";
import { toast } from "sonner";
import { bootstrapAdmin, hasAnyAdmin } from "@/lib/admin.functions";
import { BookOpen, Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — Devoiratouna" },
      { name: "description", content: "Connectez-vous à Devoiratouna avec Google, Apple, Microsoft ou votre e-mail." },
      { property: "og:title", content: "Connexion — Devoiratouna" },
      { property: "og:description", content: "Accédez à votre compte Devoiratouna." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/auth" }],
  }),
  component: AuthPage,
});

const field =
  "w-full bg-white/5 border border-white/10 rounded-lg ps-9 pe-9 py-2.5 text-sm outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/30";

function ProviderButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2.5 text-sm font-medium transition-colors"
    >
      {children}
      {label}
    </button>
  );
}

function frError(err: any) {
  const m = String(err?.message ?? "");
  if (/Invalid login credentials/i.test(m)) return "E-mail ou mot de passe incorrect. Utilisez « Mot de passe oublié ? » ou la connexion par code.";
  if (/Email not confirmed/i.test(m)) return "Votre e-mail n'est pas encore confirmé. Demandez un code de connexion.";
  if (/User already registered/i.test(m)) return "Un compte existe déjà avec cet e-mail. Connectez-vous.";
  if (/rate limit|Too many|429/i.test(m)) return "Trop de tentatives. Réessayez dans quelques minutes.";
  if (/Token has expired|Invalid token|otp_expired/i.test(m)) return "Code invalide ou expiré. Demandez un nouveau code.";
  if (/Password should be/i.test(m)) return "Le mot de passe doit contenir au moins 6 caractères.";
  return m || "Une erreur est survenue.";
}

function AuthPage() {
  const { t } = useLang();
  const nav = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [otpType, setOtpType] = useState<"signup" | "email">("signup");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null);
      if (data.user) {
        const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
        setIsAdmin(!!r);
        hasAnyAdmin().then((v: boolean) => setAdminExists(v)).catch(() => setAdminExists(true));
      } else {
        setAdminExists(true);
      }
    });
  }, []);

  async function oauth(provider: "google" | "apple" | "microsoft") {
    try {
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
      if (result.error) { toast.error(result.error.message ?? "Connexion impossible"); return; }
      if (result.redirected) return;
      nav({ to: "/" });
    } catch (e: any) { toast.error(e.message); }
  }

  async function afterSignedIn() {
    const { data: u } = await supabase.auth.getUser();
    setUser(u.user);
    if (u.user) {
      const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
      if (r) nav({ to: "/admin" });
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    try {
      if (tab === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password, options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setOtpType("signup");
        setPendingEmail(email);
        toast.success("Code de confirmation envoyé par e-mail");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await afterSignedIn();
      }
    } catch (err: any) {
      toast.error(frError(err));
    } finally { setBusy(false); }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingEmail) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email: pendingEmail, token: code.trim(), type: otpType });
      if (error) throw error;
      toast.success("Compte confirmé !");
      setPendingEmail(null);
      await afterSignedIn();
    } catch (err: any) { toast.error(frError(err)); } finally { setBusy(false); }
  }

  async function resendCode() {
    if (!pendingEmail) return;
    try {
      const { error } = otpType === "signup"
        ? await supabase.auth.resend({ type: "signup", email: pendingEmail })
        : await supabase.auth.signInWithOtp({ email: pendingEmail, options: { shouldCreateUser: false } });
      if (error) throw error;
      toast.success("Nouveau code envoyé");
    } catch (err: any) { toast.error(frError(err)); }
  }

  async function loginWithCode() {
    const form = document.getElementById("email") as HTMLInputElement | null;
    const email = (form?.value || "").trim();
    if (!email) { toast.error("Saisissez d'abord votre adresse e-mail."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
      if (error) throw error;
      setOtpType("email");
      setPendingEmail(email);
      toast.success("Code de connexion envoyé par e-mail");
    } catch (err: any) { toast.error(frError(err)); } finally { setBusy(false); }
  }

  async function forgotPassword() {
    const email = prompt("Votre adresse e-mail :");
    if (!email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("E-mail de réinitialisation envoyé");
    } catch (err: any) { toast.error(frError(err)); }
  }

  async function bootstrap() {
    setBusy(true);
    try {
      const res = await bootstrapAdmin();
      if (res.ok) { toast.success("Promu administrateur !"); setIsAdmin(true); }
      else toast.error("Un administrateur existe déjà");
    } catch (err: any) { toast.error(frError(err)); } finally { setBusy(false); }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[70vh]">
      <aside className="hidden lg:flex flex-col items-center text-center gap-4">
        <div className="h-20 w-20 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center">
          <BookOpen className="h-9 w-9 text-cyan" />
        </div>
        <h2 className="text-4xl font-black text-cyan">Devoiratouna</h2>
        <p className="text-muted-foreground max-w-sm">
          La plateforme éducative tunisienne pour tous les élèves de la 9ème au Baccalauréat.
        </p>
      </aside>

      <div className="w-full max-w-md mx-auto space-y-4">
        {user ? (
          <div className="glass p-6 space-y-4 text-center">
            <p>Connecté en tant que <strong>{user.email}</strong></p>
            {isAdmin ? (
              <Link to="/admin" className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-md">{t.admin}</Link>
            ) : adminExists === false ? (
              <button disabled={busy} onClick={bootstrap} className="bg-emerald text-background font-bold px-4 py-2 rounded-md">
                {t.promote_me_admin}
              </button>
            ) : (
              <p className="text-muted-foreground text-sm">Vous n'avez pas les droits administrateur.</p>
            )}
            <button onClick={async () => { await supabase.auth.signOut(); location.reload(); }}
              className="block w-full text-sm text-muted-foreground hover:text-foreground">{t.logout}</button>
          </div>
        ) : pendingEmail ? (
          <form onSubmit={verifyCode} className="glass p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald" />
              <h1 className="text-xl font-bold">Confirmation de l'e-mail</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Saisissez le code envoyé à <strong>{pendingEmail}</strong>.
            </p>
            <input value={code} onChange={(e) => setCode(e.target.value)} required inputMode="numeric"
              placeholder="123456"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-center tracking-[0.4em] text-lg outline-none focus:border-cyan/50" />
            <button disabled={busy} className="w-full bg-cyan text-background font-bold py-2.5 rounded-lg disabled:opacity-50">
              {busy ? "..." : "Valider le code"}
            </button>
            <div className="flex justify-between text-xs text-muted-foreground">
              <button type="button" onClick={resendCode} className="hover:text-foreground">Renvoyer le code</button>
              <button type="button" onClick={() => setPendingEmail(null)} className="hover:text-foreground">Retour</button>
            </div>
          </form>
        ) : (
          <>
            <div className="glass p-1 grid grid-cols-2 rounded-lg">
              {(["signin", "signup"] as const).map((k) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`py-2 rounded-md text-sm font-semibold transition-colors ${tab === k ? "bg-cyan text-background" : "text-muted-foreground hover:text-foreground"}`}>
                  {k === "signin" ? "Connexion" : "Inscription"}
                </button>
              ))}
            </div>

            <div className="glass p-6 space-y-5">
              <div>
                <h1 className="text-2xl font-bold">{tab === "signin" ? t.signin : t.signup}</h1>
                <p className="text-sm text-muted-foreground">
                  {tab === "signin" ? "Accédez à votre compte" : "Créez votre compte gratuitement"}
                </p>
              </div>

              <div className="space-y-2">
                <ProviderButton label="Continuer avec Google" onClick={() => oauth("google")}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1A6.2 6.2 0 0 1 12 5.8c1.6 0 2.7.7 3.3 1.3l2.6-2.5C16.3 3.1 14.4 2.3 12 2.3a9.7 9.7 0 0 0 0 19.4c5.6 0 9.3-3.9 9.3-9.4 0-.7-.1-1.3-.2-1.9H12z" /></svg>
                </ProviderButton>
                <ProviderButton label="Continuer avec Apple" onClick={() => oauth("apple")}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M16.4 12.8c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.3-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.5 0-3 1.2-3.7 3.1-1.1 2.7-.3 6.6 1.4 9 .8 1.1 1.7 2.3 2.9 2.3 1.1 0 1.5-.7 2.9-.7s1.7.7 2.9.7c1.2 0 2-1.1 2.8-2.2.6-.9.9-1.7 1-2-2.1-.8-2.9-2.8-2.9-4.9zM14.6 5.6c.6-.8 1-1.8.9-2.9-1 .1-2.1.7-2.7 1.4-.6.7-1 1.7-.9 2.7 1.1.1 2.1-.5 2.7-1.2z" /></svg>
                </ProviderButton>
                <ProviderButton label="Continuer avec Microsoft" onClick={() => oauth("microsoft")}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path fill="#F25022" d="M3 3h8.5v8.5H3z" /><path fill="#7FBA00" d="M12.5 3H21v8.5h-8.5z" /><path fill="#00A4EF" d="M3 12.5h8.5V21H3z" /><path fill="#FFB900" d="M12.5 12.5H21V21h-8.5z" /></svg>
                </ProviderButton>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-white/10" /> ou <span className="h-px flex-1 bg-white/10" />
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="email">{t.email}</label>
                  <div className="relative">
                    <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input id="email" name="email" type="email" required placeholder="vous@exemple.com" className={field} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium" htmlFor="password">{t.password}</label>
                    {tab === "signin" && (
                      <button type="button" onClick={forgotPassword} className="text-xs text-cyan hover:underline">
                        Mot de passe oublié ?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input id="password" name="password" type={showPass ? "text" : "password"} required minLength={6}
                      placeholder="••••••••" className={field} />
                    <button type="button" onClick={() => setShowPass((v) => !v)}
                      aria-label="Afficher le mot de passe"
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button disabled={busy} className="w-full bg-cyan text-background font-bold py-2.5 rounded-lg disabled:opacity-50">
                  {busy ? "..." : tab === "signin" ? t.signin : t.signup}
                </button>
                {tab === "signin" && (
                  <button type="button" disabled={busy} onClick={loginWithCode}
                    className="w-full text-xs text-cyan hover:underline disabled:opacity-50">
                    Se connecter avec un code envoyé par e-mail
                  </button>
                )}
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
