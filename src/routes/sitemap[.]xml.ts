import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  LEVELS,
  getTracks,
  getSubjects,
  getSections,
  ARABIC_ONLY_SECTIONS,
  TEXTE_ALLOWED_SUBJECTS,
} from "@/lib/constants";

const BASE_URL = "https://devoiratona.lovable.app";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [];
        const now = new Date().toISOString();

        // Pages statiques publiques (admin et auth exclus)
        const staticPaths: Array<[string, string]> = [
          ["/", "1.0"],
          ["/about", "0.5"],
          ["/contact", "0.5"],
          ["/privacy", "0.3"],
          ["/terms", "0.3"],
        ];
        for (const [path, priority] of staticPaths) {
          entries.push({ path, changefreq: "weekly", priority, lastmod: now });
        }

        // Arbre pédagogique: niveaux → filières → matières → sections
        for (const level of LEVELS) {
          entries.push({ path: `/n/${level}`, changefreq: "weekly", priority: "0.8", lastmod: now });
          const tracks = getTracks(level);
          if (tracks.length === 0) {
            const subjects = getSubjects(level);
            for (const subject of subjects) {
              entries.push({ path: `/n/${level}/s/${subject}`, changefreq: "weekly", priority: "0.7" });
              for (const section of getSections(level, subject)) {
                if (ARABIC_ONLY_SECTIONS.has(section) && !TEXTE_ALLOWED_SUBJECTS.has(subject)) continue;
                entries.push({
                  path: `/n/${level}/s/${subject}/${section}`,
                  changefreq: "weekly",
                  priority: "0.6",
                });
              }
            }
          } else {
            for (const track of tracks) {
              entries.push({ path: `/n/${level}/f/${track}`, changefreq: "weekly", priority: "0.7" });
              const subjects = getSubjects(level, track);
              for (const subject of subjects) {
                entries.push({
                  path: `/n/${level}/f/${track}/s/${subject}`,
                  changefreq: "weekly",
                  priority: "0.6",
                });
                for (const section of getSections(level, subject)) {
                  if (ARABIC_ONLY_SECTIONS.has(section) && !TEXTE_ALLOWED_SUBJECTS.has(subject)) continue;
                  entries.push({
                    path: `/n/${level}/f/${track}/s/${subject}/${section}`,
                    changefreq: "weekly",
                    priority: "0.5",
                  });
                }
              }
            }
          }
        }

        // Contenu dynamique depuis la base
        try {
          const supabase = createClient<Database>(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_PUBLISHABLE_KEY!,
            { auth: { persistSession: false, autoRefreshToken: false } },
          );

          const [{ data: documents }, { data: articles }] = await Promise.all([
            supabase.from("documents").select("id, updated_at"),
            supabase.from("articles").select("id, updated_at"),
          ]);

          for (const doc of documents ?? []) {
            entries.push({
              path: `/preview/${doc.id}`,
              lastmod: doc.updated_at ?? undefined,
              changefreq: "monthly",
              priority: "0.6",
            });
            entries.push({
              path: `/download/${doc.id}`,
              lastmod: doc.updated_at ?? undefined,
              changefreq: "monthly",
              priority: "0.5",
            });
          }
          for (const art of articles ?? []) {
            entries.push({
              path: `/article/${art.id}`,
              lastmod: art.updated_at ?? undefined,
              changefreq: "monthly",
              priority: "0.7",
            });
          }
        } catch (e) {
          // En cas d'erreur DB, on renvoie quand même les routes statiques
          console.error("sitemap: erreur lors de la lecture du contenu dynamique", e);
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
