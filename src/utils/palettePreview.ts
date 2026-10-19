export type BetSightlyPalette = "hybrid" | "atlantic" | "cobalt";

/** A deliberate Atlantic/Cobalt blend is the new comparison default.
 * Query-string selection wins over remembered choice. */
export function resolvePreviewPalette(
  search: string,
  storedPalette?: string | null,
): BetSightlyPalette {
  const requested = new URLSearchParams(search).get("palette");
  if (requested === "hybrid" || requested === "atlantic" || requested === "cobalt")
    return requested;
  if (storedPalette === "atlantic" || storedPalette === "cobalt" || storedPalette === "hybrid")
    return storedPalette;
  return "hybrid";
}

/** Set the correct palette before React renders (and persist the comparison). */
export function applyPreviewPalette(): BetSightlyPalette {
  let stored: string | null = null;
  try { stored = window.sessionStorage.getItem("betsightly-preview-palette"); } catch { /* private browsing */ }
  const palette = resolvePreviewPalette(window.location.search, stored);
  document.documentElement.setAttribute("data-bs-palette", palette);
  try { window.sessionStorage.setItem("betsightly-preview-palette", palette); } catch { /* private browsing */ }
  return palette;
}
