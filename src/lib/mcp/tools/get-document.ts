import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "get_document",
  title: "Get document",
  description: "Get a single Devoiratouna document by its ID, including preview and download URLs.",
  inputSchema: {
    id: z.string().uuid().describe("Document UUID."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Document not found" }], isError: true };
    const site = "https://devoiratona.lovable.app";
    const enriched = {
      ...data,
      preview_url: `${site}/preview/${data.id}`,
      download_url: `${site}/download/${data.id}`,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(enriched, null, 2) }],
      structuredContent: { document: enriched },
    };
  },
});
