import { createFileRoute } from "@tanstack/react-router";

const TM_URL = "https://ads.themoneytizer.com/ads_txt.php?site_id=141630&id=131734";

export const Route = createFileRoute("/api/ads/txt")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const res = await fetch(TM_URL);
          const text = await res.text();
          return new Response(text, {
            headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
          });
        } catch {
          return new Response("", { headers: { "Content-Type": "text/plain" } });
        }
      },
    },
  },
});
