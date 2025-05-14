import React, { useEffect, useState } from "react";
import type { RolloverGame } from "../types";
import RolloverTracker from "../components/results/RolloverTracker";
import { Card, CardContent, CardHeader, CardTitle } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { getRolloverGames } from "../services/dataService";
import { format } from "date-fns";

const formatDate = (date: string) => {
  return format(new Date(date), "MMM d, yyyy");
};

const RolloverPage: React.FC = () => {
  const [rolloverGames, setRolloverGames] = useState<RolloverGame[]>([]);
  const [selectedRollover, setSelectedRollover] = useState<RolloverGame | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const games = await getRolloverGames();
        setRolloverGames(games);

        // Set the active rollover as selected by default
        const activeRollover = games.find(game => game.isActive);
        if (activeRollover) {
          setSelectedRollover(activeRollover);
        } else if (games.length > 0) {
          setSelectedRollover(games[0]);
        }
      } catch (error) {
        console.error("Error fetching rollover games:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">10-Day Rollover Challenge</h1>
        <p className="text-sm text-[#A1A1AA]">
          Follow our 10-day rollover challenges where we track a series of premium predictions
          over a 10-day period. See how our expert picks perform over time!
        </p>
      </div>

      {/* Rollover Selector */}
      <Card className="bg-[#1A1A27]/80 border border-[#2A2A3C]/20 shadow-lg">
        <CardHeader className="p-3">
          <CardTitle className="text-base">Select Rollover Challenge</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="flex flex-wrap gap-2">
            {rolloverGames.map((game) => (
              <Button
                key={game.id}
                variant={
                  selectedRollover?.id === game.id ? "premium" : "outline"
                }
                size="sm"
                onClick={() => setSelectedRollover(game)}
                className="text-xs px-2 py-1"
              >
                {formatDate(game.startDate.toString())} - {formatDate(game.endDate.toString())}
                {game.isActive && " (Active)"}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Rollover */}
      {loading ? (
        <div className="text-center py-6 bg-[#1A1A27]/50 rounded-xl border border-[#2A2A3C]/10">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#F5A623] mb-2"></div>
          <p className="text-[#A1A1AA]">Loading rollover challenges...</p>
        </div>
      ) : selectedRollover ? (
        <RolloverTracker rolloverGame={selectedRollover} />
      ) : (
        <div className="text-center py-6 bg-[#1A1A27]/50 rounded-xl border border-[#2A2A3C]/10">
          <p className="text-lg font-semibold mb-1">No Rollover Challenges Available</p>
          <p className="text-sm text-[#A1A1AA]">
            There are no rollover challenges available at the moment.
            Please check back later.
          </p>
        </div>
      )}

      {/* How It Works */}
      <Card className="bg-[#1A1A27]/80 border border-[#2A2A3C]/20 shadow-lg">
        <CardHeader className="p-3">
          <CardTitle className="text-base">How the 10-Day Rollover Challenge Works</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-3">
          <p className="text-sm">
            Our 10-day rollover challenge is a premium feature that showcases the
            potential of our predictions over a 10-day period. Here's how it works:
          </p>

          <ol className="list-decimal pl-4 space-y-1 text-sm">
            <li>
              <strong>Starting Amount:</strong> We start with a base amount (e.g., $100).
            </li>
            <li>
              <strong>Daily Combos:</strong> Each day, we combine 2-3 games to reach approximately 3.0 total odds.
            </li>
            <li>
              <strong>Rolling Over:</strong> We roll over the winnings from each day's combo to the next.
            </li>
            <li>
              <strong>10-Day Period:</strong> The challenge runs for 10 days, after which we calculate the final return.
            </li>
            <li>
              <strong>Performance Tracking:</strong> We track the success rate throughout the challenge.
            </li>
          </ol>

          <div className="bg-[#F5A623]/5 p-3 rounded-lg border border-[#F5A623]/20">
            <h4 className="text-sm font-semibold mb-1">Example Calculation</h4>
            <p className="text-xs text-[#A1A1AA]">
              Starting with $100, if Day 1's combo has 3.0 total odds and wins,
              we now have $300. Day 2's combo also has around 3.0 odds, and if it wins,
              we now have $900. This balanced approach continues for the 10-day period.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RolloverPage;


