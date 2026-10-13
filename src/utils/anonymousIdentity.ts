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


/** Read an existing random browser identity; never create one just to poll. */
export const existingAnonymousBuilderId = (): string | undefined => {
  if (typeof window === "undefined") return undefined;
  try {
    const value = window.localStorage.getItem(KEY) || "";
    // Don't send legacy Math.random IDs for private ticket history.
    return /^anon_[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
      ? value
      : undefined;
  } catch {
    return undefined;
  }
};
