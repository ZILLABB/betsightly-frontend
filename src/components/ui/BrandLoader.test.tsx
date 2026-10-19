import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BetSightlyLogo } from "../brand/BetSightlyLogo";
import { BrandLoader } from "./BrandLoader";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("the loading logo matches the official BetSightly geometric B mark exactly", () => {
  const { container: official } = render(<BetSightlyLogo compact />);
  const { container: loading } = render(<BrandLoader message="Loading today's picks…" />);
  const mark = loading.querySelector(".brand-loader .bs-brand__symbol");

  expect(mark).toBeInTheDocument();
  expect(mark?.innerHTML).toEqual(official.querySelector(".bs-brand__symbol")?.innerHTML);
  expect(mark).toHaveAttribute("viewBox", "0 0 329 467");
  expect(loading.querySelector(".brand-loader img")).toBeNull();
  expect(loading.textContent).toContain("BETSIGHTLY");
  expect(within(screen.getByRole("status")).getByText("Loading today's picks…")).toBeInTheDocument();
});

test("loader supports original skeleton children and does not claim false progress", () => {
  const { container } = render(
    <BrandLoader message="Checking bookmaker prices…">
      <div data-testid="fixture-placeholder"/>
    </BrandLoader>
  );
  expect(screen.getByTestId("fixture-placeholder")).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  expect(container.querySelector(".brand-loader-track")).toHaveAttribute("aria-hidden", "true");
  expect(container.querySelector(".brand-loader-track__indicator")).toBeInTheDocument();
});

test("loading design is theme-aware and respects reduced motion", () => {
  const css = readFileSync(resolve(process.cwd(),"src/styles/brand-loader.css"),"utf8");
  const app = readFileSync(resolve(process.cwd(),"src/App.tsx"),"utf8");
  expect(css).toContain(".light .brand-loader--editorial");
  expect(css).toContain("prefers-reduced-motion: reduce");
  expect(css).toContain("var(--accent)");
  expect(app).toContain('<BrandLoader message="Opening page…" />');
  expect(app).not.toContain("<Spinner size={32}");
});
