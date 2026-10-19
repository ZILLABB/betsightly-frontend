import {
  initialPalette, isPalettePreviewHost, paletteBrowserChrome, parsePalette,
} from "./paletteLab";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(process.cwd(), "src/styles/palette-lab.css"), "utf8");

const tokens = (selector: string): Record<string,string> => {
  const start = css.indexOf(selector + " {");
  if (start === -1) throw new Error("Missing palette selector " + selector);
  const body = css.slice(start + selector.length + 2, css.indexOf("\n}", start));
  return Object.fromEntries([...body.matchAll(/(--[a-z0-9-]+):\s*(#[A-Fa-f0-9]{6})\s*;/g)]
    .map(match => [match[1],match[2]]));
};
const luminance = (hex: string): number => {
  const channels = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255);
  return channels.map(channel => channel <= .04045 ? channel/12.92 : ((channel+.055)/1.055)**2.4)
    .reduce((sum,channel,i) => sum + channel*[.2126,.7152,.0722][i],0);
};
const ratio = (a: string,b: string): number => {
  const [top,bottom] = [luminance(a),luminance(b)].sort((a,b)=>b-a);
  return (top+.05)/(bottom+.05);
};

test("preview palette selection honours shared links and persists sensible choices", () => {
  expect(parsePalette("cobalt")).toBe("cobalt");
  expect(parsePalette("atlantic")).toBe("atlantic");
  expect(parsePalette("neon")).toBeNull();
  expect(initialPalette("?palette=cobalt","atlantic")).toBe("cobalt");
  expect(initialPalette("","cobalt")).toBe("cobalt");
  expect(initialPalette("?palette=invalid",null)).toBe("atlantic");
});

test("comparison panel stays isolated from the production betsightly domain", () => {
  expect(isPalettePreviewHost("betsightly.com")).toBe(false);
  expect(isPalettePreviewHost("www.betsightly.com")).toBe(false);
  expect(isPalettePreviewHost("betsightly-frontend-xyz-zillabbs-projects.vercel.app")).toBe(true);
  expect(isPalettePreviewHost("localhost")).toBe(true);
});

test("browser status bar follows each palette's background in dark/light", () => {
  expect(paletteBrowserChrome("atlantic","dark")).toBe("#0B2238");
  expect(paletteBrowserChrome("cobalt","dark")).toBe("#111933");
  expect(paletteBrowserChrome("atlantic","light")).toBe("#F3F7FA");
  expect(paletteBrowserChrome("cobalt","light")).toBe("#F2F5FD");
});

test.each([
  ['html[data-brand-palette="atlantic"]:not(.light)'],
  ['html.light[data-brand-palette="atlantic"]'],
  ['html[data-brand-palette="cobalt"]:not(.light)'],
  ['html.light[data-brand-palette="cobalt"]'],
])("AA contrast and legibility across product palettes: %s", (selector) => {
  const t = tokens(selector);
  for (const ink of ["--text-1","--text-2","--text-3","--brand"]) {
    expect(ratio(t[ink],t["--surface"])).toBeGreaterThanOrEqual(4.5);
  }
  expect(ratio(t["--accent"],t["--palette-action-ink"])).toBeGreaterThanOrEqual(4.5);
});

test("all core product pages and both modes are styled by the comparison layer", () => {
  for (const className of [".v3-home",".v3-predictions",".v3-builder",".v3-rollover",".mobile-dock__surface"]) {
    expect(css).toContain(className);
  }
  expect(css).toContain("html.light[data-brand-palette=");
  expect(css).toContain("html[data-brand-palette=");
});
