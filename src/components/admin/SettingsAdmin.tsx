import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { saveSetting } from "@/lib/admin.functions";
import { toast } from "sonner";

const input = "w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm";

export function SettingsAdmin() {
  const [countdown, setCountdown] = useState(15);
  const [banner, setBanner] = useState<{ enabled: boolean; text_ar: string; text_fr: string }>({ enabled: false, text_ar: "", text_fr: "" });
  const [contactEmail, setContactEmail] = useState("");
  const [uploadForm, setUploadForm] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("*");
      for (const row of data ?? []) {
        if (row.key === "countdown_seconds") setCountdown(Number(row.value_json) || 15);
        if (row.key === "banner") setBanner({ enabled: false, text_ar: "", text_fr: "", ...(row.value_json as any) });
        if (row.key === "contact_email") setContactEmail(String(row.value_json ?? ""));
        if (row.key === "upload_form_url") setUploadForm(String(row.value_json ?? ""));
      }
    })();
  }, []);

  async function save(key: string, value: any) {
    try { await saveSetting({ data: { key, value } }); toast.success("Enregistré"); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-4">
      <div className="glass p-4 space-y-3">
        <h3 className="font-bold">Compte à rebours téléchargement</h3>
        <div className="flex items-center gap-2">
          <input type="number" min={0} max={60} value={countdown}
            onChange={(e) => setCountdown(Number(e.target.value))} className={input + " w-24"} />
          <span className="text-sm text-muted-foreground">secondes</span>
          <button onClick={() => save("countdown_seconds", countdown)} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm">Enregistrer</button>
        </div>
      </div>

      <div className="glass p-4 space-y-3">
        <h3 className="font-bold">Bannière supérieure</h3>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={banner.enabled} onChange={(e) => setBanner({ ...banner, enabled: e.target.checked })} />
          Activée
        </label>
        <input className={input} dir="rtl" placeholder="Texte AR" value={banner.text_ar} onChange={(e) => setBanner({ ...banner, text_ar: e.target.value })} />
        <input className={input} placeholder="Texte FR" value={banner.text_fr} onChange={(e) => setBanner({ ...banner, text_fr: e.target.value })} />
        <button onClick={() => save("banner", banner)} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm">Enregistrer</button>
      </div>

      <div className="glass p-4 space-y-3">
        <h3 className="font-bold">E-mail de contact (affiché)</h3>
        <input className={input} type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
        <button onClick={() => save("contact_email", contactEmail)} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm">Enregistrer</button>
      </div>

      <div className="glass p-4 space-y-3">
        <h3 className="font-bold">Formulaire d'envoi de fichiers (Google Forms)</h3>
        <p className="text-xs text-muted-foreground">
          Colle ici le lien public de ton Google Form (avec une question « Importer un fichier »). Les fichiers envoyés
          par les élèves arrivent dans ton Google Drive et les réponses dans ta feuille de réponses. Le formulaire est
          affiché aux utilisateurs connectés sur la page <span className="font-mono">/upload</span>.
        </p>
        <input
          className={input}
          type="url"
          placeholder="https://docs.google.com/forms/d/e/.../viewform"
          value={uploadForm}
          onChange={(e) => setUploadForm(e.target.value)}
        />
        <button onClick={() => save("upload_form_url", uploadForm.trim())} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm">Enregistrer</button>
      </div>

    </div>
  );
}
