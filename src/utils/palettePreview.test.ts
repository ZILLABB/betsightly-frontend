import { resolvePreviewPalette } from "./palettePreview";

describe("preview palette selection", () => {
  it("uses Atlantic × Cobalt hybrid by default", () => {
    expect(resolvePreviewPalette("", null)).toBe("hybrid");
  });
  it("lets readers explicitly compare the new blend to both originals", () => {
    expect(resolvePreviewPalette("?palette=hybrid", "cobalt")).toBe("hybrid");
    expect(resolvePreviewPalette("?palette=atlantic", "hybrid")).toBe("atlantic");
    expect(resolvePreviewPalette("?palette=cobalt", "hybrid")).toBe("cobalt");
    expect(resolvePreviewPalette("", "hybrid")).toBe("hybrid");
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
    expect(resolvePreviewPalette("?palette=neon", null)).toBe("hybrid");
  });
});
