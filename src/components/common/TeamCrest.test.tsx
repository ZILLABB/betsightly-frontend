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
  expect(screen.getByText("SA")).toBeInTheDocument();
});

test("a national team can fall back to its flag when its supplied crest fails", () => {
  const { container } = render(<TeamCrest team="Argentina" national logo="https://bad.example.org/logo.png"/>);
  fireEvent.error(container.querySelector("img")!);
  expect(container.querySelector("img")?.getAttribute("src")).toContain("flagcdn.com");
});


describe("verified club crest recovery for manually published fixtures", () => {
  test.each([
    ["CD Covadonga", "cdcovadonga.com/wp-content/uploads/2023/06/escudo-cd-covadonga-ok.webp"],
    ["Valladolid", "a.espncdn.com/i/teamlogos/soccer/500/95.png"],
    ["Dynamo Dresden", "a.espncdn.com/i/teamlogos/soccer/500/7017.png"],
    ["Schalke", "a.espncdn.com/i/teamlogos/soccer/500/133.png"],
  ])("%s uses the source-verified crest when no publication logo was saved", (team, expected) => {
    const { container } = render(<TeamCrest team={team} national={false}/>);
    expect(container.querySelector("img")?.getAttribute("src")).toContain(expected);
  });

  test("the original fixture's supplied crest always takes priority", () => {
    const { container } = render(
      <TeamCrest team="Schalke" logo="https://fixtures.example.org/schalke.png" national={false}/>
    );
    expect(container.querySelector("img")).toHaveAttribute(
      "src", "https://fixtures.example.org/schalke.png",
    );
  });

  test("a failed supplied crest falls back to the independently verified club source", () => {
    const { container } = render(
      <TeamCrest team="Dynamo Dresden" logo="https://fixtures.example.org/outdated.png" national={false}/>
    );
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")?.getAttribute("src")).toContain(
      "a.espncdn.com/i/teamlogos/soccer/500/7017.png",
    );
  });

  test("failed known sources still resolve to neutral initials, never to a guessed crest", () => {
    const { container } = render(<TeamCrest team="Schalke" national={false}/>);
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("SC")).toBeInTheDocument();
  });

  test("an unknown club never receives an unverified logo", () => {
    const { container } = render(<TeamCrest team="Another Local FC" national={false}/>);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("AL")).toBeInTheDocument();
  });
});
