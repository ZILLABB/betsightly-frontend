import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TeamCrest } from "./TeamCrest";

test("a club always uses its actual supplied team crest instead of initials", () => {
  const { container } = render(<TeamCrest team="Juventus" logo="https://a.espncdn.com/i/teamlogos/soccer/500/111.png" />);
  expect(container.querySelector("img"))
    .toHaveAttribute("src", "https://a.espncdn.com/i/teamlogos/soccer/500/111.png");
  expect(screen.queryByText("JU")).not.toBeInTheDocument();
});

test("broken images show a legible neutral fallback, not a blank frame", () => {
  const { container } = render(<TeamCrest team="Inter Kashi" logo="https://cdn.example.invalid/team.png" national={false}/>);
  const img = container.querySelector("img")!;
  fireEvent.error(img);
  expect(container.querySelector("img")).toBeNull();
  expect(screen.getByText("IK")).toBeInTheDocument();
});

test("known national teams can use their flag when no official crest is supplied", () => {
  const { container } = render(<TeamCrest team="Brazil" national/>);
  expect(container.querySelector("img")?.getAttribute("src")).toContain("flagcdn.com");
});

test("invalid or non-HTTPS logo URLs are never rendered as image sources", () => {
  const { container } = render(<TeamCrest team="Sample FC" logo="javascript:alert(1)" national={false}/>);
  expect(container.querySelector("img")).toBeNull();
  expect(screen.getByText("SF")).toBeInTheDocument();
});

test("a national team can fall back to its flag when its supplied crest fails", () => {
  const { container } = render(<TeamCrest team="Argentina" national logo="https://bad.example.org/logo.png"/>);
  fireEvent.error(container.querySelector("img")!);
  expect(container.querySelector("img")?.getAttribute("src")).toContain("flagcdn.com");
});
