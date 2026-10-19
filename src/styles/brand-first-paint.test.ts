import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const html = read("index.html");
const startupScript = html.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? "";

function renderHead(search: string, savedTheme?: string, storedPalette?: string) {
  const attrs: Record<string, string> = {};
  const classes: string[] = [];
  const session = new Map<string,string>();
  if (storedPalette) session.set("betsightly-preview-palette", storedPalette);
  const meta = { setAttribute: jest.fn() };
  const doc = {
    documentElement: {
      setAttribute: (key: string, val: string) => { attrs[key] = val; },
      classList: { add: (v: string) => classes.push(v) },
    },
    querySelector: () => meta,
  };
  runInNewContext(startupScript, {
    document: doc,
    URLSearchParams,
    sessionStorage: { getItem: (key:string) => session.get(key) ?? null,
      setItem: (key:string,val:string) => session.set(key,val) },
    localStorage: { getItem: () => savedTheme ? JSON.stringify({theme:savedTheme}) : null },
    window: {
      location: {search},
      matchMedia: () => ({matches: true}),
    },
  });
  return {attrs,classes,meta,session};
}

test("initial HTML has an Atlantic background, correct viewport and valid early theme script", () => {
  expect(html).toContain('name="viewport"');
  expect(html).toContain('content="#0B2238"');
  expect(startupScript).toContain("betsightly-preview-palette");
  const a = renderHead("?palette=atlantic");
  expect(a.attrs["data-bs-palette"]).toBe("atlantic");
  expect(a.classes).toContain("dark");
  expect(a.meta.setAttribute).toHaveBeenCalledWith("content", "#0B2238");
});

test("Cobalt light sets iPhone status-bar color without waiting for React", () => {
  const a = renderHead("?palette=cobalt", "light");
  expect(a.attrs["data-bs-palette"]).toBe("cobalt");
  expect(a.classes).toContain("light");
  expect(a.meta.setAttribute).toHaveBeenCalledWith("content", "#F2F5FD");
});
test("palette can be changed explicitly, and a previous choice persists on navigation", () => {
  expect(renderHead("?palette=atlantic","dark","cobalt").attrs["data-bs-palette"]).toBe("atlantic");
  expect(renderHead("","dark","cobalt").attrs["data-bs-palette"]).toBe("cobalt");
  expect(renderHead("?palette=unexpected","dark","cobalt").attrs["data-bs-palette"]).toBe("cobalt");
});
test("the retired neon-green brand is removed from icon, installed app and sharing assets", () => {
  const assets = [
    "public/brand-mark.svg","public/brand-icon.svg",
    "public/favicon.svg","public/brand-logo.svg","public/og-image.svg",
    "public/site.webmanifest","vite.config.ts","scripts/generate-pwa-icons.js",
  ];
  for (const path of assets) {
    const text = read(path);
    expect(text).not.toMatch(/#37E58C|#07100e|55, 229, 140/i);
  }
  expect(read("public/brand-icon.svg")).toContain("#69B0D6");
  expect(read("scripts/generate-pwa-icons.js")).toContain("const blue = [105, 176, 214]");
  expect(read("public/site.webmanifest")).toContain('"theme_color": "#0B2238"');
  expect(read("vite.config.ts")).toContain("theme_color: '#0B2238'");
});
