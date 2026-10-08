import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { api, type NextAvailableResponse } from "../../api/predictions";
import { NextAvailableNotice } from "./NextAvailableNotice";

const futurePreview: NextAvailableResponse = {
  status: "success",
  publication_date_wat: "2026-10-08",
  available: true,
  preview_only: true,
  official_publication: false,
  bookable_code_verified: false,
  actionable: false,
  reason: "Future quality board",
  minimum_qualified_fixtures: 3,
  evaluated_dates: [],
  next_available: {
    fixture_target_date: "2026-10-10",
    qualified_unique_fixture_count: 3,
    candidates: [{
      match_id: "next-1",
      home_team: "Alpha",
      away_team: "Beta",
      prediction: "Over 1.5 Goals",
      league: "Test League",
      fixture_id: 1,
      date: "2026-10-10T18:00:00Z",
      confidence: .77,
      odds: 1.40,
      market: "over_1_5",
      prediction_type: "goals",
    }] as NextAvailableResponse["next_available"] extends infer T
      ? NonNullable<T>["candidates"]
      : never,
  },
};

describe("NextAvailableNotice", () => {
  afterEach(() => jest.restoreAllMocks());

  it("labels future fixtures as unverified previews and links to Builder", async () => {
    jest.spyOn(api, "getNextAvailable").mockResolvedValue(futurePreview);
    render(
      <MemoryRouter>
        <NextAvailableNotice enabled publicationDate="2026-10-08" />
      </MemoryRouter>,
    );
    expect(await screen.findByText(/Saturday 10 October/)).toBeInTheDocument();
    expect(screen.getByText(/not official published picks or verified SportyBet codes/))
      .toBeInTheDocument();
    expect(screen.getByText(/Alpha v Beta/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Explore the 3- or 7-day Builder/ }))
      .toHaveAttribute("href", "/build-slip");
  });

  it("does not fetch or display preview when official day is healthy", () => {
    const request = jest.spyOn(api, "getNextAvailable");
    render(
      <MemoryRouter>
        <NextAvailableNotice enabled={false} publicationDate="2026-10-08" />
      </MemoryRouter>,
    );
    expect(request).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Next available prediction preview")).toBeNull();
  });

  it("does not advertise a future slate if none meets the quality gate", async () => {
    const request = jest.spyOn(api, "getNextAvailable").mockResolvedValue({
      ...futurePreview, available: false, next_available: null,
    });
    render(
      <MemoryRouter>
        <NextAvailableNotice enabled publicationDate="2026-10-08" />
      </MemoryRouter>,
    );
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    expect(screen.queryByLabelText("Next available prediction preview")).toBeNull();
  });
});
