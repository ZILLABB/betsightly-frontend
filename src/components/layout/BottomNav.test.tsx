import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BottomNav } from "./BottomNav";

jest.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: "/results" }),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

test("mobile product navigation prioritizes verified picks, Builder and transparent Results", () => {
  render(<BottomNav />);
  const nav = screen.getByRole("navigation", { name: "Quick navigation" });
  expect(nav).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Results" }))
    .toHaveAttribute("aria-current", "page");
  for (const name of ["Home", "Picks", "Build", "Results", "Rollover"]) {
    expect(screen.getByRole("link", { name })).toBeInTheDocument();
  }
  expect(screen.queryByRole("link", { name: "Settings" })).not.toBeInTheDocument();
});
