import { render, screen, within } from "@testing-library/react";
import { CategoryTabs } from "./CategoryTabs";

jest.mock("../../hooks/useFormatOdds", () => ({
  useFormatOdds: () => ({
    formatOdds: (value: number) => value.toFixed(2),
    oddsSuffix: "x",
  }),
}));

test("unavailable official tier never masquerades as a risk label", () => {
  render(
    <CategoryTabs
      active="2_odds"
      onChange={() => undefined}
      oddsMap={{ "10_odds": 0 }}
      availabilityMap={{ "10_odds": false }}
    />,
  );

  const tenOdds = screen
    .getAllByRole("button")
    .find(button => button.textContent?.includes("10 Odds"));

  expect(tenOdds).toBeDefined();

  if (!tenOdds) {
    throw new Error("10 Odds tab was not rendered");
  }

  expect(within(tenOdds).queryByText("Unavailable")).not.toBeNull();
  expect(within(tenOdds).queryByText("Aggressive")).toBeNull();
});
