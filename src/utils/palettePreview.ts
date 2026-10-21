/** Approved public brand: Atlantic Blue. Old comparison links cannot override it. */
export type BetSightlyPalette = "atlantic";

export function resolvePreviewPalette(_search: string, _storedPalette?: string | null): BetSightlyPalette {
  return "atlantic";
}

export function applyPreviewPalette(): BetSightlyPalette {
  document.documentElement.setAttribute("data-bs-palette", "atlantic");
  try { window.sessionStorage.removeItem("betsightly-preview-palette"); } catch { /* private mode */ }
  return "atlantic";
}
