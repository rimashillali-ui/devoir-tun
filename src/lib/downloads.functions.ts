import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { toDownloadUrl } from "@/lib/url-helpers";

export const getDownloadUrl = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => {
    if (!input?.id || typeof input.id !== "string") throw new Error("id requis");
    return { id: input.id };
  })
  .handler(async ({ data }) => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: doc, error } = await supabase
      .from("documents")
      .select("source_url")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !doc?.source_url) throw new Error("Document introuvable");
    return { url: toDownloadUrl(doc.source_url) };
  });

