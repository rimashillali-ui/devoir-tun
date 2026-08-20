/**
 * Persistance locale du chat IA :
 * - pièces jointes (images compressées + document court) rattachées à chaque
 *   message d'une conversation, pour les retrouver après avoir quitté le site ;
 * - brouillon en cours (texte + pièces jointes non envoyées) ;
 * - purge automatique au bout de 30 jours.
 */

export const TUTOR_RETENTION_DAYS = 30;
const RETENTION_MS = TUTOR_RETENTION_DAYS * 24 * 60 * 60 * 1000;

const ATT_PREFIX = "dvt.tutor.att.v1:";
const DRAFT_KEY = "dvt.tutor.draft.v1";

export type StoredBook = { name: string; pages: number; text: string };
export type StoredAttachment = { images?: string[]; book?: StoredBook | null };
export type StoredAttachments = Record<string, StoredAttachment>;

type AttEntry = { ts: number; items: StoredAttachments };

function ls() {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readEntry(convId: string): AttEntry | null {
  const store = ls();
  if (!store) return null;
  try {
    const raw = store.getItem(ATT_PREFIX + convId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AttEntry;
    if (!parsed || typeof parsed !== "object" || !parsed.items) return null;
    if (Date.now() - (parsed.ts ?? 0) > RETENTION_MS) {
      store.removeItem(ATT_PREFIX + convId);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Supprime les pièces jointes les plus anciennes pour libérer du quota. */
function pruneOldest(keep: string) {
  const store = ls();
  if (!store) return false;
  const rows: { key: string; ts: number }[] = [];
  for (let i = 0; i < store.length; i++) {
    const key = store.key(i);
    if (!key || !key.startsWith(ATT_PREFIX) || key === ATT_PREFIX + keep) continue;
    let ts = 0;
    try {
      ts = (JSON.parse(store.getItem(key) ?? "{}") as AttEntry).ts ?? 0;
    } catch {
      ts = 0;
    }
    rows.push({ key, ts });
  }
  if (rows.length === 0) return false;
  rows.sort((a, b) => a.ts - b.ts);
  store.removeItem(rows[0].key);
  return true;
}

function writeEntry(convId: string, entry: AttEntry) {
  const store = ls();
  if (!store) return;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      store.setItem(ATT_PREFIX + convId, JSON.stringify(entry));
      return;
    } catch {
      if (!pruneOldest(convId)) return;
    }
  }
}

export function loadAttachments(convId: string): StoredAttachments {
  return readEntry(convId)?.items ?? {};
}

/** Enregistre la pièce jointe du message `index` d'une conversation. */
export function saveAttachment(convId: string, index: number, att: StoredAttachment) {
  if (!att.images?.length && !att.book) return;
  const items = loadAttachments(convId);
  items[String(index)] = {
    ...(att.images?.length ? { images: att.images } : {}),
    ...(att.book ? { book: att.book } : {}),
  };
  writeEntry(convId, { ts: Date.now(), items });
}

export function dropAttachments(convId: string) {
  ls()?.removeItem(ATT_PREFIX + convId);
}

/** Supprime toutes les pièces jointes locales de plus de 30 jours. */
export function purgeExpiredAttachments() {
  const store = ls();
  if (!store) return;
  const stale: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const key = store.key(i);
    if (!key || !key.startsWith(ATT_PREFIX)) continue;
    let ts = 0;
    try {
      ts = (JSON.parse(store.getItem(key) ?? "{}") as AttEntry).ts ?? 0;
    } catch {
      ts = 0;
    }
    if (Date.now() - ts > RETENTION_MS) stale.push(key);
  }
  for (const key of stale) store.removeItem(key);
}

export type StoredDraft = { text: string; images: string[]; book: StoredBook | null; convId: string | null };

export function loadDraft(): StoredDraft | null {
  const store = ls();
  if (!store) return null;
  try {
    const raw = store.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft & { ts?: number };
    if (Date.now() - (parsed.ts ?? 0) > RETENTION_MS) {
      store.removeItem(DRAFT_KEY);
      return null;
    }
    return {
      text: String(parsed.text ?? ""),
      images: Array.isArray(parsed.images) ? parsed.images.filter((i) => typeof i === "string") : [],
      book: parsed.book ?? null,
      convId: parsed.convId ?? null,
    };
  } catch {
    return null;
  }
}

export function saveDraft(draft: StoredDraft) {
  const store = ls();
  if (!store) return;
  if (!draft.text && draft.images.length === 0 && !draft.book) {
    store.removeItem(DRAFT_KEY);
    return;
  }
  try {
    store.setItem(DRAFT_KEY, JSON.stringify({ ...draft, ts: Date.now() }));
  } catch {
    if (pruneOldest("")) {
      try {
        store.setItem(DRAFT_KEY, JSON.stringify({ ...draft, ts: Date.now() }));
      } catch {
        /* quota plein : brouillon non conservé */
      }
    }
  }
}

export function clearDraft() {
  ls()?.removeItem(DRAFT_KEY);
}

/** Date limite ISO : tout ce qui est plus vieux doit être supprimé. */
export function retentionCutoffIso() {
  return new Date(Date.now() - RETENTION_MS).toISOString();
}
