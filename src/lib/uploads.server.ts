const GATEWAY = "https://connector-gateway.lovable.dev/google_drive";
const FOLDER_NAME = "Devoiratouna — Envois élèves";

export type UploadSubmission = {
  level: string;
  track?: string | null;
  subject: string;
  section: string;
  title: string;
  note?: string;
  fileName: string;
  mimeType: string;
  fileBase64: string;
};

function headers() {
  const lovable = process.env["LOVABLE_API_KEY"];
  const conn = process.env["GOOGLE_DRIVE_API_KEY"];
  if (!lovable || !conn) throw new Error("Google Drive n'est pas connecté sur ce projet.");
  return {
    Authorization: `Bearer ${lovable}`,
    "X-Connection-Api-Key": conn,
  };
}

async function gatewayJson(url: string, init: RequestInit) {
  const res = await fetch(url, { ...init, headers: { ...headers(), ...(init.headers ?? {}) } });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Drive request failed [${res.status}]: ${text}`);
    throw new Error(`Google Drive a refusé la requête [${res.status}]: ${text.slice(0, 400)}`);
  }
  return text ? JSON.parse(text) : {};
}

async function ensureFolder(): Promise<string> {
  const q = encodeURIComponent(
    `mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME.replace(/'/g, "\\'")}' and trashed=false`,
  );
  const found = await gatewayJson(`${GATEWAY}/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=1`, {
    method: "GET",
  });
  if (found.files?.[0]?.id) return found.files[0].id as string;

  const created = await gatewayJson(`${GATEWAY}/drive/v3/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }),
  });
  return created.id as string;
}

export async function submitUploadToDrive(data: UploadSubmission, senderEmail: string | null) {
  const clean = (s: string, max = 120) => String(s ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, max);
  const title = clean(data.title);
  if (!title) throw new Error("Titre manquant.");
  if (!data.fileBase64) throw new Error("Fichier manquant.");

  const approxBytes = Math.floor((data.fileBase64.length * 3) / 4);
  if (approxBytes > 25 * 1024 * 1024) throw new Error("Fichier trop volumineux (max 25 Mo).");

  const folderId = await ensureFolder();
  const ext = (data.fileName.match(/\.[a-zA-Z0-9]{1,6}$/)?.[0] ?? "").toLowerCase();
  const parts = [data.level, data.track, data.subject, data.section].filter(Boolean).join("-");
  const name = `${parts} — ${title}${ext}`.replace(/[\\/:*?"<>|]/g, "-");

  const description = [
    `Titre : ${title}`,
    `Niveau : ${data.level}`,
    data.track ? `Filière : ${data.track}` : null,
    `Matière : ${data.subject}`,
    `Type : ${data.section}`,
    `Envoyé par : ${senderEmail ?? "inconnu"}`,
    data.note ? `Remarque : ${clean(data.note, 600)}` : null,
    `Date : ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join("\n");

  const boundary = `dvt${Math.random().toString(36).slice(2)}`;
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify({ name, description, parents: [folderId] }) +
    `\r\n--${boundary}\r\nContent-Type: ${data.mimeType || "application/octet-stream"}\r\n` +
    `Content-Transfer-Encoding: base64\r\n\r\n${data.fileBase64}\r\n--${boundary}--`;

  const file = await gatewayJson(
    `${GATEWAY}/upload/drive/v3/files?uploadType=multipart&fields=id,name`,
    {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    },
  );

  return { ok: true as const, fileName: file.name as string };
}
