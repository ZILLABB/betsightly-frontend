import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BottomNav } from "./BottomNav";

jest.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: "/results" }),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

test("mobile dock keeps five actions with Build emphasized and Results in More", () => {
  render(<BottomNav />);
  const nav = screen.getByRole("navigation", { name: "Quick navigation" });
  expect(nav).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Results" })).not.toBeInTheDocument();
  for (const label of ["Home", "Picks", "Build", "Rollover"]) {
    expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
  }
  expect(screen.getByRole("link", { name: "Rollover" })).toHaveAttribute("href", "/rollover");
  expect(screen.getByRole("link", { name: "Build" }))
    .toHaveAttribute("href", "/build-slip");
  expect(screen.getByRole("button", { name: "More pages" }))
    .toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("link", { name: /Live scores/ })).not.toBeInTheDocument();
});

test("More sheet contains Results, Live and settings without duplicating Rollover", () => {
  render(<BottomNav />);
  fireEvent.click(screen.getByRole("button", { name: "More pages" }));
  expect(screen.getByRole("dialog", { name: "More BetSightly pages" })).toBeInTheDocument();
  const more = screen.getByRole("navigation", { name: "More navigation" });
  for (const label of [/Results/, /Live scores/, /Punters/, /Settings/]) {
    expect(more.querySelector("a")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
  }
  expect(screen.getByRole("link", { name: /^Results / })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Rollover" })).toHaveAttribute("href", "/rollover");
  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "More pages" }))
    .toHaveAttribute("aria-expanded", "false");
});

test("More sheet closes when a destination is selected", () => {
  render(<BottomNav />);
  fireEvent.click(screen.getByRole("button", { name: "More pages" }));
  fireEvent.click(screen.getByRole("link", { name: /Live scores/ }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
