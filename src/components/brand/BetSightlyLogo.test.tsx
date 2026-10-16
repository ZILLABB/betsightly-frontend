import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BetSightlyLogo } from "./BetSightlyLogo";

test("vector BetSightly mark remains readable without external bitmap", () => {
  const { container } = render(<BetSightlyLogo />);
  expect(container.querySelector(".bs-brand__symbol")).toBeInTheDocument();
  expect(container.querySelector(".bs-brand__name")).toHaveTextContent("BETSIGHTLY");
  expect(screen.getByText(/PREDICT · ANALYZE · TRACK/)).toBeInTheDocument();
  expect(container.querySelector("img")).toBeNull();
});

test("compact wordmark uses the same symbol and accessible outside link label", () => {
  const { container } = render(<BetSightlyLogo compact />);
  expect(container.querySelector(".bs-brand--compact .bs-brand__symbol")).toBeInTheDocument();
});

test("Option B uses the new vector monogram and a unique footer gradient", () => {
  const { container } = render(<><BetSightlyLogo/><BetSightlyLogo compact /></>);
  expect(screen.getAllByText("BET")).toHaveLength(2);
  expect(screen.getAllByText("SIGHTLY")).toHaveLength(2);
  const ids = [...container.querySelectorAll("linearGradient")].map(n => n.id);
  expect(new Set(ids).size).toBe(2);
  expect(container.querySelector(".bs-brand--new")).toBeInTheDocument();
  expect(container.querySelectorAll("img")).toHaveLength(0);
});
