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

function isSharePoint(url: string) {
  return /sharepoint\.com/i.test(url);
}
function isOneDrive(url: string) {
  return /1drv\.ms/i.test(url) || /onedrive\.live\.com/i.test(url);
}
function setParam(url: string, key: string, value: string) {
  try {
    const u = new URL(url);
    u.searchParams.set(key, value);
    return u.toString();
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}${key}=${value}`;
  }
}

export function toPreviewUrl(source: string): string {
  if (!source) return source;
  // Google Drive
  const drive = source.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;
  // SharePoint / OneDrive: use Office Online viewer with the direct-download URL.
  // SharePoint blocks iframe embedding for anonymous share links, but the
  // Office viewer can fetch the file when `?download=1` is appended.
  if (isSharePoint(source) || isOneDrive(source)) {
    const direct = setParam(source, "download", "1");
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(direct)}`;
  }
  // Default: Google Docs viewer for raw PDF
  const raw = toRawUrl(source);
  return `https://docs.google.com/gview?url=${encodeURIComponent(raw)}&embedded=true`;
}

export function toDownloadUrl(source: string): string {
  if (!source) return source;
  const drive = source.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (drive) return `https://drive.google.com/uc?export=download&id=${drive[1]}`;
  if (isSharePoint(source) || isOneDrive(source)) {
    return setParam(source, "download", "1");
  }
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
