const KEY = "betsightly.anonymous_id.v1";

export const anonymousBuilderId = (): string | undefined => {
  if (typeof window === "undefined") return undefined;
  const existing = window.localStorage.getItem(KEY);
  if (existing) return existing;
  const secure = globalThis.crypto?.randomUUID?.();
  // This identifier is a random local pseudonym, never authentication. The
  // fallback keeps older/test browsers usable when Web Crypto is unavailable.
  const id = `anon_${secure ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`}`;
  window.localStorage.setItem(KEY, id);
  return id;
};
