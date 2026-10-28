import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ManualRemainingOverview } from "./ManualRemainingOverview";

jest.mock("../../hooks/useFormatOdds", () => ({
  useFormatOdds: () => ({ formatOdds: (x: number) => x.toFixed(2), oddsSuffix:"x" }),
}));
jest.mock("../../utils/formatters", () => ({
  formatLocalTimeWithZone: (v: string) => v,
}));
jest.mock("./BookingCode", () => ({
  __esModule: true,
  default: ({booking}:any) => <span>New code: {booking?.share_code}</span>,
}));

const response = {
  status:"success", available:true, date:"2026-10-19",
  official_publication_unchanged:true, record_is_separate:true,
  tiers:{
    "5_odds":{
      selected:true,source:"admin_curated",editorial_manual:true,
      manual_remainder:true,official_publication:false,result_scored:false,
      total_odds:2.19,risk_level:"Manual remainder",
      original_leg_count:6,remaining_leg_count:2,removed_leg_count:4,
      games:[
        {home_team:"Pafos",away_team:"APOEL",match_id:"f1",kickoff:"2099-10-19T18:00:00Z",prediction:"1X",odds:1.4},
        {home_team:"Roma",away_team:"Parma",match_id:"f2",kickoff:"2099-10-19T19:00:00Z",prediction:"Over 1.5",odds:1.57},
      ],
      booking:{status:"active",booking_status:"FULL",readback_validation:"PASSED",
        share_code:"NEW424",actual_sportybet_odds:2.19,booked_leg_count:2},
    },
  },
};

test("shows only rebooked manual legs, counts and the new code", () => {
  render(<ManualRemainingOverview data={response as any} loading={false} error={null} onRefresh={jest.fn()}/>);
  expect(screen.getByText("Still-available manual matches")).toBeInTheDocument();
  expect(screen.getByText(/2 of 6 original games · 4 excluded/)).toBeInTheDocument();
  expect(screen.getByText(/Pafos/)).toBeInTheDocument();
  expect(screen.getByText(/Roma/)).toBeInTheDocument();
  expect(screen.getByText("New code: NEW424")).toBeInTheDocument();
  expect(screen.queryByText("Old code: ORIGINAL")).not.toBeInTheDocument();
  expect(screen.getByText("new")).toBeInTheDocument();
});
test("hides cards if the new code is not verified", () => {
  const {container} = render(<ManualRemainingOverview data={{
    ...response, available:false, tiers:{},
  } as any} loading={false} error={null} onRefresh={jest.fn()}/>);
  expect(container).toHaveTextContent("No reduced manual slip is verifiably bookable right now.");
  expect(screen.queryByText(/New code:/)).not.toBeInTheDocument();
});
test("displays booking verification errors without offering unverified code", () => {
  render(<ManualRemainingOverview data={null} loading={false} error="SportyBet is unavailable." onRefresh={jest.fn()}/>);
  expect(screen.getByRole("status")).toHaveTextContent("SportyBet is unavailable");
  expect(screen.queryByText(/New code/)).toBeNull();
});

test("does not show manual remainder before the visitor requests a check", () => {
  const {container} = render(<ManualRemainingOverview
    data={null} loading={false} error={null} onRefresh={jest.fn()}/>);
  expect(container).toBeEmptyDOMElement();
});

test("hides a reduced code when a fixture is within 10 minutes and offers rechecking", () => {
  const onRefresh = jest.fn();
  const near = {
    ...response,
    tiers: {
      "5_odds": {
        ...response.tiers["5_odds"],
        games: [
          {...response.tiers["5_odds"].games[0],
            kickoff: new Date(Date.now() + 9 * 60_000).toISOString()},
          response.tiers["5_odds"].games[1],
        ],
      },
    },
  };
  render(<ManualRemainingOverview data={near as any}
    loading={false} error={null} onRefresh={onRefresh}/>);
  expect(screen.getByRole("status")).toHaveTextContent("10-minute cutoff");
  expect(screen.queryByText(/New code:/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", {name:"Recheck remaining games"}));
  expect(onRefresh).toHaveBeenCalledTimes(1);
});

test("explains why each manual tier could not be safely rebooked", () => {
  const onRefresh = jest.fn();
  render(<ManualRemainingOverview data={{
    status: "success",
    date: "2026-10-28",
    available: false,
    official_publication_unchanged: true,
    tiers: {},
    reason: "No remaining manual selection set passed live bookmaker verification.",
    tier_reasons: {
      "5_odds": "Too few unstarted manual selections remain.",
      "10_odds": "A new exact SportyBet code could not be verified.",
    },
  }} loading={false} error={null} onRefresh={onRefresh}/>);
  expect(screen.getByText(/No reduced manual slip is verifiably bookable right now/)).toBeInTheDocument();
  expect(screen.getByText(/Too few unstarted manual selections remain/)).toBeInTheDocument();
  expect(screen.getByText(/A new exact SportyBet code could not be verified/)).toBeInTheDocument();
  expect(screen.queryByText(/New code:/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: /check again/i }));
  expect(onRefresh).toHaveBeenCalledTimes(1);
});

test("remaining single is clearly not advertised as the original 10 Odds", () => {
  const one = {
    ...response,
    tiers: {
      "10_odds": {
        ...response.tiers["5_odds"],
        single_remainder: true,
        original_leg_count: 10, remaining_leg_count: 1,
        removed_leg_count: 9,
        games: [response.tiers["5_odds"].games[0]],
      },
    },
  };
  render(<ManualRemainingOverview data={one as any} loading={false}
    error={null} onRefresh={jest.fn()} />);
  expect(screen.getByText(/remaining single \(not original tier odds\)/i)).toBeInTheDocument();
  expect(screen.getByText(/1 of 10 original games/)).toBeInTheDocument();
});

test("closer-odds alternative must disclose supplementary fixtures and use its own code", () => {
  const expanded = {
    ...response,
    near_target_alternatives: {
      "5_odds": {
        selected: true, near_target_alternative: true,
        total_odds: 4.97, target_original_odds: 5.10,
        remaining_original_leg_count: 2, supplemental_leg_count: 1,
        games: [
          ...response.tiers["5_odds"].games,
          { home_team: "Extra", away_team: "Fixture", match_id: "f3",
            kickoff: "2099-10-19T20:00:00Z", prediction: "Over 1.5",
            odds: 2.26, supplemental_model_selection: true },
        ],
        booking: { status: "active", share_code: "OPTION505",
          booking_status: "FULL", readback_validation: "PASSED",
          booked_leg_count: 3, actual_sportybet_odds: 4.97 },
      },
    },
  };
  render(<ManualRemainingOverview data={expanded as any}
    loading={false} error={null} onRefresh={jest.fn()}/>);
  expect(screen.getByText(/Separate alternative · closer to original odds/i)).toBeInTheDocument();
  expect(screen.getByText(/Additional model-qualified selection/i)).toBeInTheDocument();
  expect(screen.getByText("New code: OPTION505")).toBeInTheDocument();
  expect(screen.getByText("New code: NEW424")).toBeInTheDocument();
});

test("alternative search is explicit and requests the displayed tier only", () => {
  const onFindNearTarget = jest.fn();
  render(<ManualRemainingOverview data={response as any} loading={false}
    error={null} onRefresh={jest.fn()} onFindNearTarget={onFindNearTarget}/>);
  fireEvent.click(screen.getByRole("button", { name: /Try closer to original odds/ }));
  expect(onFindNearTarget).toHaveBeenCalledWith("5_odds");
});
