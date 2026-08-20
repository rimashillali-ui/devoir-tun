// Lectures résilientes : cache mémoire à durée de vie + réessais avec back-off.
// But : moins de requêtes vers la base (listes qui changent rarement) et, en cas
// d'indisponibilité passagère, on ressert la dernière valeur connue au lieu d'un écran vide.

type Entry = { value: unknown; at: number };

const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

const DEFAULT_TTL = 60_000; // 1 minute
const STORE_PREFIX = "dvt.cache.v1:"; // stockage navigateur (localStorage) versionné
const STALE_MAX = 30 * 60_000; // on accepte une valeur périmée jusqu'à 30 min en secours

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- Persistance navigateur -------------------------------------------------
// On utilise localStorage plutôt que les cookies : même effet (survit au
// rechargement, zéro requête) sans alourdir chaque requête HTTP de 4 Ko
// d'en-têtes. Aucune donnée personnelle n'y est stockée : uniquement des
// listes publiques (documents, bannière, annonces, pages, quiz).
const canStore = () => typeof window !== "undefined" && !!window.localStorage;

function readStore(key: string): Entry | null {
  if (!canStore()) return null;
  try {
    const raw = window.localStorage.getItem(STORE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Entry;
    if (typeof parsed?.at !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStore(key: string, entry: Entry) {
  if (!canStore()) return;
  try {
    window.localStorage.setItem(STORE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // quota atteint : on purge notre espace puis on abandonne silencieusement
    try {
      for (const k of Object.keys(window.localStorage)) {
        if (k.startsWith(STORE_PREFIX)) window.localStorage.removeItem(k);
      }
    } catch { /* ignore */ }
  }
}

function clearStore(prefix?: string) {
  if (!canStore()) return;
  try {
    for (const k of Object.keys(window.localStorage)) {
      if (!k.startsWith(STORE_PREFIX)) continue;
      if (!prefix || k.slice(STORE_PREFIX.length).startsWith(prefix)) window.localStorage.removeItem(k);
    }
  } catch { /* ignore */ }
}

export function invalidateReads(prefix?: string) {
  clearStore(prefix);
  if (!prefix) return cache.clear();
  for (const key of [...cache.keys()]) if (key.startsWith(prefix)) cache.delete(key);
}

/**
 * Exécute `fn` avec cache + réessais.
 * - Résultat frais en cache (< ttl) → renvoyé immédiatement, aucune requête.
 * - Requête identique déjà en cours → mutualisée (pas de doublon).
 * - Échec → 3 tentatives (300ms, 900ms), puis valeur périmée si disponible.
 */
export async function resilientRead<T>(
  key: string,
  fn: () => Promise<T>,
  opts: { ttlMs?: number; retries?: number; persist?: boolean } = {},
): Promise<T> {
  const ttl = opts.ttlMs ?? DEFAULT_TTL;
  const retries = opts.retries ?? 2;
  const persist = opts.persist !== false; // persistant par défaut

  let hit = cache.get(key);
  if (!hit && persist) {
    const stored = readStore(key);
    if (stored) {
      cache.set(key, stored);
      hit = stored;
    }
  }
  if (hit && Date.now() - hit.at < ttl) return hit.value as T;

  const running = inflight.get(key);
  if (running) return running as Promise<T>;

  const task = (async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const value = await fn();
        const entry: Entry = { value, at: Date.now() };
        cache.set(key, entry);
        if (persist) writeStore(key, entry);
        return value;
      } catch (err) {
        lastError = err;
        if (attempt < retries) await sleep(300 * 3 ** attempt);
      }
    }
    const stale = cache.get(key);
    if (stale && Date.now() - stale.at < STALE_MAX) {
      console.warn(`[resilient-read] ${key} : base indisponible, valeur en cache utilisée`);
      return stale.value as T;
    }
    throw lastError;
  })().finally(() => inflight.delete(key));

  inflight.set(key, task);
  return task as Promise<T>;
}

/** Enveloppe une réponse Supabase : transforme `error` en exception réessayable. */
export async function unwrap<T>(p: PromiseLike<{ data: T; error: { message: string } | null }>) {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data;
}
