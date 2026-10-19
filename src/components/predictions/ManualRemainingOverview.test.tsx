import { render, screen } from "@testing-library/react";
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
        {home_team:"Pafos",away_team:"APOEL",match_id:"f1",kickoff:"2026-10-19T18:00:00Z",prediction:"1X",odds:1.4},
        {home_team:"Roma",away_team:"Parma",match_id:"f2",kickoff:"2026-10-19T19:00:00Z",prediction:"Over 1.5",odds:1.57},
      ],
      booking:{status:"active",booking_status:"FULL",readback_validation:"PASSED",
        share_code:"NEW424",actual_sportybet_odds:2.19,booked_leg_count:2},
    },
  },
};

test("shows only rebooked manual legs, counts and the new code", () => {
  render(<ManualRemainingOverview data={response as any} loading={false} error={null}/>);
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
  } as any} loading={false} error={null}/>);
  expect(container).toBeEmptyDOMElement();
});
test("displays booking verification errors without offering unverified code", () => {
  render(<ManualRemainingOverview data={null} loading={false} error="SportyBet is unavailable."/>);
  expect(screen.getByRole("status")).toHaveTextContent("SportyBet is unavailable");
  expect(screen.queryByText(/New code/)).toBeNull();
});
