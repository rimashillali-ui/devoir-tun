import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AD_SLOTS } from "@/lib/constants";
import { saveAd } from "@/lib/admin.functions";
import { toast } from "sonner";

const input = "w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm";

export function AdsAdmin() {
  const [ads, setAds] = useState<Record<string, any>>({});
  async function load() {
    const { data } = await supabase.from("ads").select("*");
    const m: Record<string, any> = {};
    for (const a of data ?? []) m[a.slot] = a;
    setAds(m);
  }
  useEffect(() => { load(); }, []);

  async function save(slot: string, patch: any) {
    const cur = ads[slot] ?? { slot, provider: "custom", enabled: false };
    const next = { ...cur, ...patch };
    setAds({ ...ads, [slot]: next });
    try {
      await saveAd({ data: {
        slot, provider: next.provider, code_html: next.code_html || null,
        image_url: next.image_url || null, link_url: next.link_url || null,
        enabled: !!next.enabled,
      } });
      toast.success("Pub enregistrée");
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-4">
      {AD_SLOTS.map((slot) => {
        const a = ads[slot] ?? { slot, provider: "custom", enabled: false };
        return (
          <div key={slot} className="glass p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{slot}</h3>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!a.enabled} onChange={(e) => save(slot, { enabled: e.target.checked })} />
                Actif
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Provider</label>
                <select className={input} value={a.provider} onChange={(e) => save(slot, { provider: e.target.value })}>
                  <option value="custom">Bannière personnalisée</option>
                  <option value="propellerads">Code HTML (PropellerAds, etc.)</option>
                </select>
              </div>
              {a.provider === "custom" ? (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground">URL image</label>
                    <input className={input} defaultValue={a.image_url ?? ""} onBlur={(e) => save(slot, { image_url: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">URL lien</label>
                    <input className={input} defaultValue={a.link_url ?? ""} onBlur={(e) => save(slot, { link_url: e.target.value })} />
                  </div>
                </>
              ) : (
                <div className="md:col-span-2">
                  <label className="text-xs text-muted-foreground">Code HTML</label>
                  <textarea className={input + " font-mono"} rows={4} defaultValue={a.code_html ?? ""}
                    onBlur={(e) => save(slot, { code_html: e.target.value })} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
