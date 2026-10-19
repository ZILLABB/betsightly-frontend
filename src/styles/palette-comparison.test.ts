import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(process.cwd(), "src/styles/palette-comparison.css"), "utf8");
const getTokens = (start: string): Record<string, string> => {
  const startIndex = css.indexOf(start + " {");
  if (startIndex < 0) throw new Error("Missing palette rules: " + start);
  const rules = css.slice(startIndex).split("{")[1].split("}")[0];
  const tokens: Record<string, string> = {};
  rules.split(";").forEach(declaration => {
    const [key, value] = declaration.split(":");
    if (key && value) tokens[key.trim()] = value.trim();
  });
  return tokens;
};
const luminance = (hex: string): number => {
  const [r,g,b] = [1,3,5].map(index => parseInt(hex.slice(index,index+2),16)/255);
  return [r,g,b].map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4)
    .reduce((total,v,i) => total + v*[.2126,.7152,.0722][i],0);
};
const contrast = (a: string,b: string): number => {
  const [l,h] = [luminance(a),luminance(b)].sort((a,b) => a-b);
  return (h+.05)/(l+.05);
};

describe.each([
  ["Atlantic dark", ':root[data-bs-palette="atlantic"]:not(.light)', false],
  ["Cobalt dark", ':root[data-bs-palette="cobalt"]:not(.light)', false],
  ["Atlantic light", ':root.light[data-bs-palette="atlantic"]', true],
  ["Cobalt light", ':root.light[data-bs-palette="cobalt"]', true],
] as const)("%s comparison palette", (_label, selector, light) => {
  const tokens = getTokens(selector);
  test("has meaningful and distinct background, brand and action tokens", () => {
    for(const variable of ["--bg","--surface","--surface-2","--brand","--accent","--text-1","--text-2","--text-3"]) {
      expect(tokens[variable]).toMatch(/^#[0-9A-F]{6}$/i);
    }
    expect(tokens["--bg"]).not.toBe(tokens["--surface"]);
    expect(tokens["--brand"]).not.toBe(tokens["--accent"]);
  });
  test("maintains readable primary, secondary and tertiary text", () => {
    for(const name of ["--text-1","--text-2","--text-3","--brand"]) {
      expect(contrast(tokens[name], tokens["--surface"])).toBeGreaterThanOrEqual(4.5);
    }
  });
  test("preserves legible action buttons", () => {
    expect(contrast(tokens["--accent"], light ? "#FFFFFF" : "#101925")).toBeGreaterThanOrEqual(4.5);
  });
});
test("both themes keep success and loss colors semantic rather than mixing them with palette accents", () => {
  expect(css).not.toContain("--green:");
  expect(css).not.toContain("--red:");
  expect(css).toContain(".v3-builder");
  expect(css).toContain(".v3-results");
  expect(css).toContain(".v3-rollover");
  expect(css).toContain(".v3-predictions");
  expect(css).toContain(".mobile-dock");
});
