import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BetSightlyLogo } from "./BetSightlyLogo";

test("simple geometric B mark remains sharp and retains accessible wordmark", () => {
  const { container } = render(<BetSightlyLogo />);
  const mark = container.querySelector(".bs-brand__symbol");
  expect(mark).toBeInTheDocument();
  expect(mark).toHaveAttribute("viewBox", "0 0 329 467");
  expect(mark?.querySelectorAll("path")).toHaveLength(2);
  expect(container.querySelector(".bs-brand__name")).toHaveTextContent("BETSIGHTLY");
  expect(screen.getByText(/PREDICT · ANALYZE · TRACK/)).toBeInTheDocument();
  expect(container.querySelector("img")).toBeNull();
});

test("header and footer use the same simple monogram, never chart bars or arrowheads", () => {
  const { container } = render(<><BetSightlyLogo/><BetSightlyLogo compact /></>);
  const symbols = [...container.querySelectorAll(".bs-brand__symbol")];
  expect(symbols).toHaveLength(2);
  expect(symbols[0].innerHTML).toEqual(symbols[1].innerHTML);
  expect(container.querySelector(".bs-brand--compact .bs-brand__symbol")).toBeInTheDocument();
  expect(container.querySelectorAll(".bs-brand__symbol linearGradient")).toHaveLength(0);
  expect(container.querySelectorAll(".bs-brand__symbol path")).toHaveLength(4);
});
