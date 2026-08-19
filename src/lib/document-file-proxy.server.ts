import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { toDownloadUrl, toRawUrl, isDirectFileUrl } from "@/lib/url-helpers";

type FileMode = "preview" | "download";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isMicrosoftUrl(url: string) {
  return /(?:sharepoint\.com|1drv\.ms|onedrive\.live\.com)/i.test(url);
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function withParam(url: string, key: string, value: string) {
  const u = new URL(url);
  u.searchParams.set(key, value);
  return u.toString();
}

function directSharePointPathCandidate(source: string) {
  try {
    const u = new URL(source);
    const match = u.pathname.match(/^\/:[a-z]:\/r\/(.+)$/i);
    if (!match?.[1]) return null;
    const direct = new URL(`/${match[1]}`, u.origin);
    direct.searchParams.set("download", "1");
    return direct.toString();
  } catch {
    return null;
  }
}

function microsoftCandidates(source: string) {
  try {
    const u = new URL(source);
    const download = new URL(u.toString());
    download.searchParams.delete("web");
    download.searchParams.delete("action");
    download.searchParams.delete("mobileredirect");
    download.searchParams.set("download", "1");

    const web0 = new URL(u.toString());
    web0.searchParams.set("web", "0");

    const actionDownload = new URL(u.toString());
    actionDownload.searchParams.set("action", "download");

    return unique([
      directSharePointPathCandidate(source) ?? "",
      download.toString(),
      actionDownload.toString(),
      web0.toString(),
      source,
    ]);
  } catch {
    return [source];
  }
}

function microsoftDownloadUrl(source: string) {
  try {
    const u = new URL(source);
    u.searchParams.set("download", "1");
    return u.toString();
  } catch {
    const sep = source.includes("?") ? "&" : "?";
    return `${source}${sep}download=1`;
  }
}

function microsoftPreviewUrl(source: string) {
  return source;
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeEscapedText(value: string) {
  return decodeHtmlEntities(value)
    .replace(/\\u002[fF]/g, "/")
    .replace(/\\u003[aA]/g, ":")
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/")
    .replace(/\\"/g, '"');
}

function extractDownloadUrlFromHtml(html: string, baseUrl: string) {
  const normalized = normalizeEscapedText(html);
  const patterns = [
    /(?:"|')?(?:downloadUrl|DownloadUrl|@content\.downloadUrl)(?:"|')?\s*:\s*(?:"|')([^"']+)(?:"|')/i,
    /href=(?:"|')([^"']*\/_layouts\/15\/download\.aspx[^"']*)(?:"|')/i,
    /href=(?:"|')([^"']*download=1[^"']*)(?:"|')/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match?.[1]) continue;
    try {
      return new URL(match[1], baseUrl).toString();
    } catch {
      continue;
    }
  }
  return null;
}

function filenameFromTitle(title?: string | null) {
  const base = (title || "document")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "document";
  return base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`;
}

function contentDisposition(mode: FileMode, filename: string) {
  const type = mode === "download" ? "attachment" : "inline";
  return `${type}; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

async function fetchCandidate(url: string, depth = 0): Promise<{ buffer: ArrayBuffer; contentType: string } | null> {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      Accept: "application/pdf,application/octet-stream,*/*;q=0.8",
    },
  });

  if (!response.ok) return null;

  const contentType = response.headers.get("content-type") || "";
  const buffer = await response.arrayBuffer();
  if (!buffer.byteLength) return null;

  const head = new TextDecoder().decode(buffer.slice(0, Math.min(buffer.byteLength, 512))).trimStart();
  const isHtml = contentType.includes("text/html") || /^<!doctype html/i.test(head) || /^<html/i.test(head);

  if (isHtml && depth < 2) {
    const html = new TextDecoder().decode(buffer);
    const extracted = extractDownloadUrlFromHtml(html, response.url || url);
    if (extracted && extracted !== url) return fetchCandidate(extracted, depth + 1);
    return null;
  }

  return {
    buffer,
    contentType: contentType || (head.startsWith("%PDF") ? "application/pdf" : "application/octet-stream"),
  };
}

async function getDocument(id: string) {
  if (!UUID_RE.test(id)) return null;
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await supabase
    .from("documents")
    .select("source_url,title_fr,title_ar")
    .eq("id", id)
    .maybeSingle();

  if (error || !data?.source_url) return null;
  return data;
}

export async function serveDocumentFile(id: string, mode: FileMode) {
  const doc = await getDocument(id);
  if (!doc) return new Response("Document introuvable", { status: 404 });

  const source = doc.source_url;
  if (isMicrosoftUrl(source)) {
    return Response.redirect(mode === "preview" ? microsoftPreviewUrl(source) : microsoftDownloadUrl(source), 302);
  }

  const candidates = isMicrosoftUrl(source) ? microsoftCandidates(source) : [toDownloadUrl(source)];

  for (const candidate of candidates) {
    try {
      const file = await fetchCandidate(candidate);
      if (!file) continue;
      const filename = filenameFromTitle(doc.title_fr ?? doc.title_ar);
      return new Response(file.buffer, {
        headers: {
          "Content-Type": file.contentType,
          "Content-Disposition": contentDisposition(mode, filename),
          "Cache-Control": "public, max-age=300",
          "X-Robots-Tag": "noindex",
        },
      });
    } catch {
      // Essaie le candidat suivant.
    }
  }

  return new Response("Impossible de charger ce fichier. Vérifiez que le lien SharePoint/OneDrive est public.", {
    status: 502,
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" },
  });
}
