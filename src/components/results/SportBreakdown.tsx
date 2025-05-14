import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../common/Card";
import { Badge } from "../common/Badge";
import { PieChart, Trophy, CircleDot, Dumbbell } from "lucide-react";

interface SportBreakdownProps {
  soccerRate: number;
  basketballRate: number;
  mixedRate: number;
  soccerCount: number;
  basketballCount: number;
  mixedCount: number;
}

const SportBreakdown: React.FC<SportBreakdownProps> = ({
  soccerRate = 68,
  basketballRate = 72,
  mixedRate = 65,
  soccerCount = 120,
  basketballCount = 85,
  mixedCount = 45,
}) => {
  // Calculate total predictions
  const totalCount = soccerCount + basketballCount + mixedCount;

  // Calculate percentages for the pie chart
  const soccerPercentage = (soccerCount / totalCount) * 100;
  const basketballPercentage = (basketballCount / totalCount) * 100;
  const mixedPercentage = (mixedCount / totalCount) * 100;

  // Determine which sport has the highest success rate
  const getHighestRate = () => {
    if (soccerRate >= basketballRate && soccerRate >= mixedRate) {
      return { sport: "Soccer", rate: soccerRate };
    } else if (basketballRate >= soccerRate && basketballRate >= mixedRate) {
      return { sport: "Basketball", rate: basketballRate };
    } else {
      return { sport: "Mixed", rate: mixedRate };
    }
  };

  const highestRate = getHighestRate();

  // Calculate the stroke-dasharray and stroke-dashoffset for the pie chart segments
  // The circle has a circumference of 2 * PI * r = 2 * 3.14159 * 40 = 251.327
  const circumference = 251.327;

  // Calculate the arc length for each segment
  const soccerArc = (soccerPercentage / 100) * circumference;
  const basketballArc = (basketballPercentage / 100) * circumference;
  const mixedArc = (mixedPercentage / 100) * circumference;

  // Calculate the offset for each segment
  const soccerOffset = 0;
  const basketballOffset = soccerArc;
  const mixedOffset = soccerArc + basketballArc;

  return (
    <Card className="w-full bg-[#1A1A27]/80 border border-[#2A2A3C]/20 shadow-lg overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <PieChart size={18} className="mr-2 text-[#F5A623]" />
            Sport Breakdown
          </CardTitle>
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            By Success Rate
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Best performing sport - Moved to top for better visibility */}
        <div className="bg-[#1A1A27]/50 p-3 rounded-lg border border-[#2A2A3C]/10 mb-4">
          <div className="text-xs text-[#A1A1AA] mb-1">Best Performing Sport</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {highestRate.sport === "Soccer" ? (
                <CircleDot size={20} className="text-[#3B82F6] mr-2" />
              ) : highestRate.sport === "Basketball" ? (
                <Trophy size={20} className="text-[#F59E0B] mr-2" />
              ) : (
                <Dumbbell size={20} className="text-[#8B5CF6] mr-2" />
              )}
              <span className="font-medium">{highestRate.sport}</span>
            </div>
            <Badge
              variant="success"
              className="text-xs px-2 py-0.5"
            >
              {highestRate.rate}% Success
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left column - Pie Chart */}
          <div className="flex justify-center items-center">
            <div className="relative w-32 h-32 md:w-36 md:h-36">
              <svg width="100%" height="100%" viewBox="0 0 100 100">
                {/* Soccer segment */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#3B82F6"
                  strokeWidth="20"
                  strokeDasharray={`${soccerArc} ${circumference - soccerArc}`}
                  strokeDashoffset={soccerOffset}
                  transform="rotate(-90 50 50)"
                />

                {/* Basketball segment */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#F59E0B"
                  strokeWidth="20"
                  strokeDasharray={`${basketballArc} ${circumference - basketballArc}`}
                  strokeDashoffset={-basketballOffset}
                  transform="rotate(-90 50 50)"
                />

                {/* Mixed segment */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#8B5CF6"
                  strokeWidth="20"
                  strokeDasharray={`${mixedArc} ${circumference - mixedArc}`}
                  strokeDashoffset={-mixedOffset}
                  transform="rotate(-90 50 50)"
                />

                {/* Inner circle (hole) */}
                <circle
                  cx="50"
                  cy="50"
                  r="30"
                  fill="#1A1A27"
                />

                {/* Center text */}
                <text
                  x="50"
                  y="45"
                  textAnchor="middle"
                  fontSize="10"
                  fill="#A1A1AA"
                >
                  Total
                </text>
                <text
                  x="50"
                  y="60"
                  textAnchor="middle"
                  fontSize="16"
                  fontWeight="bold"
                  fill="white"
                >
                  {totalCount}
                </text>
              </svg>
            </div>
          </div>

          {/* Right columns - Stats */}
          <div className="lg:col-span-2 space-y-3">
            {/* Soccer */}
            <div className="bg-[#1A1A27]/30 p-3 rounded-lg border border-[#2A2A3C]/10">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <CircleDot size={16} className="text-[#3B82F6] mr-2" />
                  <span className="text-sm font-medium">Soccer</span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-[#A1A1AA] mr-2">{soccerCount} predictions</span>
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    {soccerRate}%
                  </Badge>
                </div>
              </div>
              <div className="w-full bg-[#2A2A3C] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#3B82F6]/80 to-[#3B82F6] h-full rounded-full"
                  style={{ width: `${Math.max(5, soccerRate)}%` }}
                ></div>
              </div>
            </div>

            {/* Basketball */}
            <div className="bg-[#1A1A27]/30 p-3 rounded-lg border border-[#2A2A3C]/10">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <Trophy size={16} className="text-[#F59E0B] mr-2" />
                  <span className="text-sm font-medium">Basketball</span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-[#A1A1AA] mr-2">{basketballCount} predictions</span>
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    {basketballRate}%
                  </Badge>
                </div>
              </div>
              <div className="w-full bg-[#2A2A3C] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#F59E0B]/80 to-[#F59E0B] h-full rounded-full"
                  style={{ width: `${Math.max(5, basketballRate)}%` }}
                ></div>
              </div>
            </div>

            {/* Mixed */}
            <div className="bg-[#1A1A27]/30 p-3 rounded-lg border border-[#2A2A3C]/10">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <Dumbbell size={16} className="text-[#8B5CF6] mr-2" />
                  <span className="text-sm font-medium">Mixed</span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-[#A1A1AA] mr-2">{mixedCount} predictions</span>
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    {mixedRate}%
                  </Badge>
                </div>
              </div>
              <div className="w-full bg-[#2A2A3C] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#8B5CF6]/80 to-[#8B5CF6] h-full rounded-full"
                  style={{ width: `${Math.max(5, mixedRate)}%` }}
                ></div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex justify-between pt-2 text-xs text-[#A1A1AA]">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#3B82F6] mr-1"></div>
                <span>Soccer</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#F59E0B] mr-1"></div>
                <span>Basketball</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#8B5CF6] mr-1"></div>
                <span>Mixed</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SportBreakdown;
