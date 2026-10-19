import { resolvePreviewPalette } from "./palettePreview";

describe("preview palette selection", () => {
  it("uses Atlantic by default", () => {
    expect(resolvePreviewPalette("", null)).toBe("atlantic");
  });
  it("chooses Royal Cobalt when explicitly requested", () => {
    expect(resolvePreviewPalette("?palette=cobalt", null)).toBe("cobalt");
  });
  it("allows switching back to Atlantic after Cobalt", () => {
    expect(resolvePreviewPalette("?palette=atlantic", "cobalt")).toBe("atlantic");
  });
  it("retains the active palette after navigating or reloading without a query", () => {
    expect(resolvePreviewPalette("", "cobalt")).toBe("cobalt");
  });
  it("does not accept arbitrary or malformed palette names", () => {
    expect(resolvePreviewPalette("?palette=neon", null)).toBe("atlantic");
  });
});
