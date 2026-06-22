export function toRawUrl(source: string): string {
  if (!source) return source;
  // GitHub blob → raw
  if (source.includes("github.com") && source.includes("/blob/")) {
    return source.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
  }
  if (source.includes("github.com") && source.includes("/raw/")) {
    return source.replace("github.com", "raw.githubusercontent.com").replace("/raw/", "/");
  }
  return source;
}

export function toPreviewUrl(source: string): string {
  if (!source) return source;
  // Google Drive
  const drive = source.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;
  // OneDrive embed
  if (source.includes("1drv.ms") || source.includes("onedrive.live.com")) {
    if (source.includes("embed=")) return source;
    return source.includes("?")
      ? `${source}&em=2&action=embedview`
      : `${source}?em=2&action=embedview`;
  }
  // Default: use Google Docs viewer for raw PDF
  const raw = toRawUrl(source);
  return `https://docs.google.com/gview?url=${encodeURIComponent(raw)}&embedded=true`;
}

export function toDownloadUrl(source: string): string {
  if (!source) return source;
  const drive = source.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (drive) return `https://drive.google.com/uc?export=download&id=${drive[1]}`;
  return toRawUrl(source);
}

export function toYoutubeEmbed(url: string): string | null {
  if (!url) return null;
  const m1 = url.match(/youtu\.be\/([A-Za-z0-9_-]+)/);
  if (m1) return `https://www.youtube.com/embed/${m1[1]}`;
  const m2 = url.match(/[?&]v=([A-Za-z0-9_-]+)/);
  if (m2) return `https://www.youtube.com/embed/${m2[1]}`;
  const m3 = url.match(/youtube\.com\/embed\/([A-Za-z0-9_-]+)/);
  if (m3) return `https://www.youtube.com/embed/${m3[1]}`;
  return null;
}
