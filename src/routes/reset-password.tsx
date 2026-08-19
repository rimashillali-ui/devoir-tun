import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — Devoiratouna" },
      { name: "description", content: "Définissez un nouveau mot de passe pour votre compte Devoiratouna." },
      { property: "og:title", content: "Nouveau mot de passe — Devoiratouna" },
      { property: "og:description", content: "Réinitialisation du mot de passe Devoiratouna." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const p1 = String(fd.get("p1"));
    const p2 = String(fd.get("p2"));
    if (p1 !== p2) { toast.error("Les mots de passe ne correspondent pas"); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: p1 });
      if (error) throw error;
      toast.success("Mot de passe mis à jour");
      nav({ to: "/auth" });
    } catch (err: any) { toast.error(err.message); } finally { setBusy(false); }
  }

  const field =
    "w-full bg-white/5 border border-white/10 rounded-lg ps-9 pe-3 py-2.5 text-sm outline-none focus:border-cyan/50";

  return (
    <div className="max-w-md mx-auto glass p-6 space-y-4">
      <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>
      <p className="text-sm text-muted-foreground">Ouvrez cette page depuis le lien reçu par e-mail.</p>
      <form onSubmit={submit} className="space-y-4">
        <div className="relative">
          <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input name="p1" type="password" required minLength={6} placeholder="Nouveau mot de passe" className={field} />
        </div>
        <div className="relative">
          <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input name="p2" type="password" required minLength={6} placeholder="Confirmer le mot de passe" className={field} />
        </div>
        <button disabled={busy} className="w-full bg-cyan text-background font-bold py-2.5 rounded-lg disabled:opacity-50">
          {busy ? "..." : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
