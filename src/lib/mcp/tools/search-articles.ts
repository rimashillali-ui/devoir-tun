import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "search_articles",
  title: "Search articles",
  description: "Search Devoiratouna's published articles (lessons, guides) by section, subject, level, or free-text query.",
  inputSchema: {
    query: z.string().optional().describe("Free-text query on title (fr/ar)."),
    level: z.string().optional(),
    subject: z.string().optional(),
    section: z.string().optional(),
    limit: z.number().int().min(1).max(50).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, level, subject, section, limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    let q = supabase
      .from("articles")
      .select("id,title_fr,title_ar,subtitle_fr,subtitle_ar,level,subject,track,section,updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit ?? 20);
    if (level) q = q.eq("level", level);
    if (subject) q = q.eq("subject", subject);
    if (section) q = q.eq("section", section);
    if (query) q = q.or(`title_fr.ilike.%${query}%,title_ar.ilike.%${query}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { articles: data ?? [] },
    };
  },
});
