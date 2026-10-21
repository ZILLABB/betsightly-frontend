import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const html = read("index.html");
const startupScript = html.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? "";

function renderHead(search: string, savedTheme?: string, storedPalette?: string, systemDark = true) {
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
      matchMedia: () => ({matches: systemDark}),
    },
  });
  return {attrs,classes,meta,session};
}

test("browser starts in Atlantic even with old comparison links", () => {
  expect(html).toContain('name="viewport"');
  expect(html).toContain('content="#0B2238"');
  const dark = renderHead("?palette=hybrid", "dark", "cobalt");
  expect(dark.attrs["data-bs-palette"]).toBe("atlantic");
  expect(dark.classes).toContain("dark");
  expect(dark.meta.setAttribute).toHaveBeenCalledWith("content", "#0B2238");
  const light = renderHead("?palette=cobalt", "light", "hybrid");
  expect(light.attrs["data-bs-palette"]).toBe("atlantic");
  expect(light.classes).toContain("light");
  expect(light.meta.setAttribute).toHaveBeenCalledWith("content", "#F3F7FA");
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

test("Live Scores uses semantic palette tokens instead of retired emerald hero colors", () => {
  const live = read("src/pages/live-scores.css");
  expect(live).toContain(".bs-live-hero");
  expect(live).toContain("var(--border-brand)");
  expect(live).toContain("var(--surface-2)");
  expect(live).toContain("var(--text-2)");
  expect(live).not.toMatch(/#37e58c|rgba\(56,229,140|rgba\(35,230,140|#071b14|#06130f/i);
});

test("saved system theme keeps Atlantic on an iPhone in light mode", () => {
  const a = renderHead("?palette=cobalt", "system", "hybrid", false);
  expect(a.attrs["data-bs-palette"]).toBe("atlantic");
  expect(a.classes).toContain("light");
  expect(a.meta.setAttribute).toHaveBeenCalledWith("content", "#F3F7FA");
});
