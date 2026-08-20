import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { resilientRead, unwrap } from "@/lib/resilient-read";

export function TopBanner() {
  const { lang } = useLang();
  const [banner, setBanner] = useState<{ enabled: boolean; text_ar?: string; text_fr?: string } | null>(null);
  useEffect(() => {
    resilientRead(
      "settings:banner",
      () => unwrap(supabase.from("site_settings").select("value_json").eq("key", "banner").maybeSingle()),
      { ttlMs: 10 * 60_000 },
    )
      .then((data: any) => setBanner((data?.value_json as any) ?? null))
      .catch(() => setBanner(null));
  }, []);
  if (!banner?.enabled) return null;
  const text = lang === "ar" ? banner.text_ar : banner.text_fr;
  if (!text) return null;
  return (
    <div className="bg-gradient-to-r from-indigo/30 via-cyan/20 to-emerald/30 border-b border-white/5 text-center py-2 px-4 text-sm">
      {text}
    </div>
  );
}
