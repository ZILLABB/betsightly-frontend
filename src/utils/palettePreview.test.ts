import { resolvePreviewPalette } from "./palettePreview";

describe("official Atlantic-only palette", () => {
  test("Atlantic is always the default", () => {
    expect(resolvePreviewPalette("", null)).toBe("atlantic");
  });
  test("retired palette URLs cannot override the approved brand", () => {
    for (const query of ["?palette=cobalt", "?palette=hybrid", "?palette=neon", "?palette=atlantic"]) {
      expect(resolvePreviewPalette(query, "cobalt")).toBe("atlantic");
    }
  });
  test("stored comparison variants are safely ignored", () => {
    expect(resolvePreviewPalette("", "hybrid")).toBe("atlantic");
    expect(resolvePreviewPalette("", "cobalt")).toBe("atlantic");
  });
});
