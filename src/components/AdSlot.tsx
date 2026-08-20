import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AdSlot as AdSlotName } from "@/lib/constants";
import { resilientRead, unwrap } from "@/lib/resilient-read";

type Ad = {
  slot: string;
  provider: string;
  code_html: string | null;
  image_url: string | null;
  link_url: string | null;
  enabled: boolean;
};

export function AdSlot({ slot, className }: { slot: AdSlotName; className?: string }) {
  const [ad, setAd] = useState<Ad | null>(null);
  useEffect(() => {
    resilientRead(
      `ads:${slot}`,
      () =>
        unwrap(
          supabase
            .from("ads")
            .select("slot,provider,code_html,image_url,link_url,enabled")
            .eq("slot", slot)
            .eq("enabled", true)
            .maybeSingle(),
        ),
      { ttlMs: 10 * 60_000 },
    )
      .then((data) => setAd((data as Ad | null) ?? null))
      .catch(() => setAd(null));
  }, [slot]);

  if (!ad) return null;
  if (ad.code_html) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: ad.code_html }} />;
  }
  if (ad.image_url) {
    return (
      <a href={ad.link_url ?? "#"} target="_blank" rel="noopener noreferrer" className={className}>
        <img src={ad.image_url} alt="Annonce publicitaire" loading="lazy" className="max-w-full h-auto rounded-md" />
      </a>
    );
  }
  return null;
}
