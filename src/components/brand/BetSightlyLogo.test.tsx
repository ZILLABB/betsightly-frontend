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
