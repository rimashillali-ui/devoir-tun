import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { savePage } from "@/lib/admin.functions";
import { toast } from "sonner";

const input = "w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm";
const PAGES = [
  { slug: "about", label: "Qui sommes-nous" },
  { slug: "privacy", label: "Politique de confidentialité" },
  { slug: "terms", label: "Conditions d'utilisation" },
];

export function PagesAdmin() {
  const [data, setData] = useState<Record<string, any>>({});
  async function load() {
    const { data: rows } = await supabase.from("pages").select("*");
    const m: Record<string, any> = {};
    for (const r of rows ?? []) m[r.slug] = r;
    setData(m);
  }
  useEffect(() => { load(); }, []);

  async function save(slug: string) {
    const p = data[slug];
    try {
      await savePage({ data: {
        slug, title_ar: p.title_ar, title_fr: p.title_fr,
        content_html_ar: p.content_html_ar, content_html_fr: p.content_html_fr,
      } });
      toast.success("Page enregistrée");
    } catch (e: any) { toast.error(e.message); }
  }

  function set(slug: string, k: string, v: string) {
    setData({ ...data, [slug]: { ...(data[slug] ?? { slug, title_ar: "", title_fr: "", content_html_ar: "", content_html_fr: "" }), [k]: v } });
  }

  return (
    <div className="space-y-4">
      {PAGES.map((pg) => {
        const p = data[pg.slug] ?? { title_ar: "", title_fr: "", content_html_ar: "", content_html_fr: "" };
        return (
          <details key={pg.slug} className="glass p-4">
            <summary className="cursor-pointer font-bold">{pg.label}</summary>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input className={input} placeholder="Titre AR" dir="rtl" value={p.title_ar}
                  onChange={(e) => set(pg.slug, "title_ar", e.target.value)} />
                <input className={input} placeholder="Titre FR" value={p.title_fr}
                  onChange={(e) => set(pg.slug, "title_fr", e.target.value)} />
              </div>
              <textarea className={input + " font-mono"} rows={8} dir="rtl" placeholder="Contenu HTML AR"
                value={p.content_html_ar} onChange={(e) => set(pg.slug, "content_html_ar", e.target.value)} />
              <textarea className={input + " font-mono"} rows={8} placeholder="Contenu HTML FR"
                value={p.content_html_fr} onChange={(e) => set(pg.slug, "content_html_fr", e.target.value)} />
              <button onClick={() => save(pg.slug)} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">Enregistrer</button>
            </div>
          </details>
        );
      })}
    </div>
  );
}
