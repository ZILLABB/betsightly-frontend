export type BetSightlyPalette = "atlantic" | "cobalt";

/** Query-string selection takes priority over the user's previous comparison. */
export function resolvePreviewPalette(
  search: string,
  storedPalette?: string | null,
): BetSightlyPalette {
  const requested = new URLSearchParams(search).get("palette");
  if (requested === "cobalt" || requested === "atlantic") return requested;
  if (storedPalette === "cobalt") return "cobalt";
  return "atlantic";
}

/** Sets the theme before React is mounted so navigation does not flash Slate. */
export function applyPreviewPalette(): BetSightlyPalette {
  let stored: string | null = null;
  try { stored = window.sessionStorage.getItem("betsightly-preview-palette"); } catch { /* private browsing */ }
  const palette = resolvePreviewPalette(window.location.search, stored);
  document.documentElement.setAttribute("data-bs-palette", palette);
  try { window.sessionStorage.setItem("betsightly-preview-palette", palette); } catch { /* private browsing */ }
  return palette;
}
