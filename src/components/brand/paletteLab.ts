/**
 * Preview-only brand palette comparison.
 * No live prediction, odds, form, settlement or booking preferences change.
 */
export type PaletteChoice = "atlantic" | "cobalt";

export const PALETTE_OPTIONS: { id: PaletteChoice; label: string; subtitle: string }[] = [
  { id: "atlantic", label: "Atlantic Blue", subtitle: "Ocean blue · Copper · Teal" },
  { id: "cobalt", label: "Royal Cobalt", subtitle: "Indigo · Cobalt · Apricot" },
];

export function parsePalette(value: string | null | undefined): PaletteChoice | null {
  return value === "atlantic" || value === "cobalt" ? value : null;
}

/** Avoid accidentally shipping the palette-selection surface to betsightly.com. */
export function isPalettePreviewHost(hostname: string): boolean {
  return hostname.endsWith("-zillabbs-projects.vercel.app") || hostname === "localhost";
}

export function initialPalette(search: string, saved: string | null): PaletteChoice {
  const query = parsePalette(new URLSearchParams(search).get("palette"));
  return query || parsePalette(saved) || "atlantic";
}

export function paletteBrowserChrome(palette: PaletteChoice, theme: "dark" | "light"): string {
  if (theme === "light") return palette === "atlantic" ? "#F3F7FA" : "#F2F5FD";
  return palette === "atlantic" ? "#0B2238" : "#111933";
}
