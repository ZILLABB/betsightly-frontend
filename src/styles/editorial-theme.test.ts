import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(process.cwd(), "src/styles/editorial-system.css"), "utf8");
const mobileCSS = readFileSync(resolve(process.cwd(), "src/styles/mobile-qa.css"), "utf8");
const light = css.split(".light {")[1]?.split("\n}")[0] || "";
const token = (name: string): string => light.split("\n")
  .map(line => line.trim())
  .find(line => line.startsWith(name + ":"))
  ?.split(":")[1]?.replace(";", "").trim() || "";

const luminance = (hex: string): number => {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error("Invalid color " + hex);
  const [r,g,b] = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255);
  return [r,g,b].map(x => x <= .04045 ? x/12.92 : ((x+.055)/1.055)**2.4)
    .reduce((sum,x,i) => sum + x*[.2126,.7152,.0722][i],0);
};
const contrast = (a: string,b: string): number => {
  const [hi,lo] = [luminance(a),luminance(b)].sort((a,b) => b-a);
  return (hi+.05)/(lo+.05);
};

test("light theme text and semantic status colors have AA contrast on ivory and white", () => {
  for (const name of ["--text-1","--text-2","--text-3","--brand","--accent","--red","--green"]) {
    for (const bg of ["--bg","--surface"]) {
      expect(contrast(token(name),token(bg))).toBeGreaterThanOrEqual(4.5);
    }
  }
});

test("mobile light navigation and result statuses have explicit light-theme treatments", () => {
  expect(mobileCSS).toContain(".light .mobile-dock__surface");
  expect(mobileCSS).toContain(".light .mobile-dock__sheet");
  for (const status of ["won","lost","pending"]) {
    expect(mobileCSS).toContain(".manual-history-item .results-status--" + status);
  }
  expect(css).toContain("--surface: #ffffff;");
  expect(css).toContain("--bg: #f4f5f3;");
});
