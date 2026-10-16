import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import { BottomNav } from "./BottomNav";

test("mobile product navigation prioritizes verified picks, Builder and transparent Results", () => {
  render(<MemoryRouter initialEntries={["/results"]}><BottomNav /></MemoryRouter>);
  const nav = screen.getByRole("navigation", { name: "Quick navigation" });
  expect(nav).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Results" }))
    .toHaveAttribute("aria-current", "page");
  for (const name of ["Home", "Picks", "Build", "Results", "Rollover"]) {
    expect(screen.getByRole("link", { name })).toBeInTheDocument();
  }
  expect(screen.queryByRole("link", { name: "Settings" })).not.toBeInTheDocument();
});
