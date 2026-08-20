import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type TranscribeInput = {
  /** Pages du livre à lire (images JPEG en data URL) avec leur numéro. */
  pages: { page: number; image: string }[];
  title?: string;
};

const MODELS = ["google/gemini-3.7-flash", "google/gemini-2.5-flash"];

const INSTRUCTION = [
  "Tu transcris des pages d'un manuel scolaire tunisien pour constituer une base de cours.",
  "Restitue TOUT le contenu utile de chaque page : titres, définitions, théorèmes, propriétés, formules, énoncés d'exercices, légendes de schémas.",
  "Écris les formules en LaTeX ($...$ ou $$...$$). Décris brièvement les schémas et figures entre crochets.",
  "Structure la sortie en Markdown et préfixe chaque page par « [Page n] ».",
  "N'ajoute aucun commentaire personnel, aucune introduction, aucune conclusion.",
].join("\n");

/** Transcrit par vision (IA) un lot de pages d'un livre PDF. Réservé aux admins. */
export const transcribeBookPages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: TranscribeInput) => {
    const pages = (Array.isArray(input?.pages) ? input.pages : [])
      .filter((p) => typeof p?.image === "string" && p.image.startsWith("data:image/"))
      .slice(0, 8)
      .map((p) => ({ page: Number.isFinite(p.page) ? Math.trunc(p.page) : 0, image: p.image }));
    if (pages.length === 0) throw new Error("Aucune page à transcrire");
    return { pages, title: String(input?.title ?? "").slice(0, 200) };
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (isAdmin !== true) throw new Error("Forbidden");

    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Vision IA indisponible (clé manquante)");

    const messages = [
      { role: "system", content: INSTRUCTION },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Livre : « ${data.title || "manuel"} ». Transcris les pages ${data.pages
              .map((p) => p.page)
              .join(", ")}.`,
          },
          ...data.pages.map((p) => ({ type: "image_url", image_url: { url: p.image } })),
        ],
      },
    ];

    let lastError = "";
    for (const model of MODELS) {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, messages, temperature: 0.1, max_tokens: 8192 }),
      });
      if (res.ok) {
        const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const content = (json.choices?.[0]?.message?.content ?? "").trim();
        if (content) return { text: content, model };
        lastError = "Réponse vide";
        continue;
      }
      const detail = (await res.text()).slice(0, 300);
      lastError = `${res.status} ${detail}`;
      if (res.status === 402) throw new Error("Crédits IA épuisés : rechargez les crédits Lovable AI.");
      if (res.status === 403) throw new Error("Lovable AI bloqué pour cet espace de travail.");
      if (res.status === 400 || res.status === 401) throw new Error(`Vision refusée : ${lastError}`);
    }
    throw new Error(`Transcription impossible : ${lastError}`);
  });
