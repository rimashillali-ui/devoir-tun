import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://devoir-tun.lovable.app";

const STATIC_PATHS = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/n/9eme", changefreq: "weekly", priority: "0.8" },
  { path: "/n/1sec", changefreq: "weekly", priority: "0.8" },
  { path: "/n/2sc", changefreq: "weekly", priority: "0.8" },
  { path: "/n/3eme", changefreq: "weekly", priority: "0.8" },
  { path: "/n/bac", changefreq: "weekly", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
] as const;

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: Array<{ path: string; changefreq?: string; priority?: string }> = [
          ...STATIC_PATHS,
        ];

        try {
          const url = process.env.SUPABASE_URL;
          const key = process.env.SUPABASE_PUBLISHABLE_KEY;
          if (url && key) {
            const sb = createClient(url, key, { auth: { persistSession: false } });
            const [{ data: articles }, { data: docs }] = await Promise.all([
              sb.from("articles").select("id").limit(5000),
              sb.from("documents").select("id").limit(5000),
            ]);
            for (const a of articles ?? []) entries.push({ path: `/article/${a.id}`, changefreq: "monthly", priority: "0.6" });
            for (const d of docs ?? []) entries.push({ path: `/download/${d.id}`, changefreq: "monthly", priority: "0.6" });
          }
        } catch {
          // best-effort: still serve static entries if DB fetch fails
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ].filter(Boolean).join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
