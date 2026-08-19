import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "search_documents",
  title: "Search documents",
  description:
    "Search Devoiratouna's public educational documents (exams, exercises, lessons). Filter by level, subject, track, or free-text query.",
  inputSchema: {
    query: z.string().optional().describe("Free-text query matched against title (fr/ar) and subject."),
    level: z.string().optional().describe("School level slug, e.g. '3eme', '1sec', '2sc'."),
    subject: z.string().optional().describe("Subject slug, e.g. 'math', 'physique'."),
    track: z.string().optional().describe("Track/filière slug, e.g. 'maths', 'sciences'."),
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, level, subject, track, limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    let q = supabase
      .from("documents")
      .select("id,title_fr,title_ar,subject,level,track,section,term,exam_slot")
      .order("sort_order", { ascending: true })
      .limit(limit ?? 20);
    if (level) q = q.eq("level", level);
    if (subject) q = q.eq("subject", subject);
    if (track) q = q.eq("track", track);
    if (query) q = q.or(`title_fr.ilike.%${query}%,title_ar.ilike.%${query}%,subject.ilike.%${query}%`);
    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { documents: data ?? [] },
    };
  },
});
