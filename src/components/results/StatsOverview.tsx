import React from "react";
import type { StatsOverview as StatsOverviewType } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../common/Card";
import { Badge } from "../common/Badge";
import { TrendingUp, Award, Calendar, Target, BarChart2, Percent } from "lucide-react";

interface StatsOverviewProps {
  stats: StatsOverviewType;
  timeframe?: "week" | "month" | "all" | "custom";
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, timeframe = "week" }) => {
  const {
    totalPredictions,
    wonPredictions,
    lostPredictions,
    pendingPredictions,
    successRate,
    averageOdds,
  } = stats;

  // Calculate ROI (Return on Investment) - this is a simplified calculation
  const roi = ((wonPredictions * averageOdds) - (wonPredictions + lostPredictions)) / (wonPredictions + lostPredictions) * 100;

  // Get timeframe text
  const timeframeText = timeframe === "week" ? "Last 7 Days" : timeframe === "month" ? "Last 30 Days" : "All Time";

  // Determine success rate color
  const getSuccessRateColor = (rate: number) => {
    if (rate >= 70) return "text-[#10B981]";
    if (rate >= 50) return "text-[#F5A623]";
    return "text-[#EF4444]";
  };

  // Determine ROI color
  const getRoiColor = (roiValue: number) => {
    if (roiValue >= 20) return "text-[#10B981]";
    if (roiValue >= 0) return "text-[#F5A623]";
    return "text-[#EF4444]";
  };

  return (
    <div className="space-y-6">
      {/* Main Stats Card */}
      <Card className="w-full bg-[#1A1A27]/80 border border-[#2A2A3C]/20 shadow-lg overflow-hidden light-card-effect">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#F5A623]/10 to-transparent rounded-bl-full"></div>

        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center">
              <TrendingUp size={18} className="mr-2 text-[#F5A623]" />
              Performance Overview
            </CardTitle>
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              {timeframeText}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {/* Success Rate Highlight */}
          <div className="mb-6 bg-[#1A1A27]/50 p-3 rounded-lg border border-[#2A2A3C]/10 dark:bg-[#1A1A27]/50 light:bg-[#F8FAFF]/80 light:border-[#E2E8F0]/30">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <Award size={20} className="text-[#F5A623] mr-2" />
                <span className="text-sm font-medium text-[var(--muted-foreground)]">Success Rate</span>
              </div>
              <div className={`text-2xl font-bold ${getSuccessRateColor(successRate)}`}>
                {successRate.toFixed(1)}%
              </div>
            </div>

            <div className="w-full bg-[#2A2A3C] h-2 rounded-full overflow-hidden dark:bg-[#2A2A3C] light:bg-[#E2E8F0]">
              <div
                className="bg-gradient-to-r from-[#F5A623] to-[#F8BD4F] h-full"
                style={{ width: `${successRate}%` }}
              ></div>
            </div>

            <div className="flex justify-between mt-1 text-xs text-[var(--muted-foreground)]">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-[#1A1A27]/30 p-3 rounded-lg border border-[#2A2A3C]/10 dark:bg-[#1A1A27]/30 light:bg-white light:border-[#E2E8F0]/50 light:shadow-sm">
              <div className="flex items-center mb-1">
                <Calendar size={16} className="text-[var(--muted-foreground)] mr-1" />
                <p className="text-xs font-medium text-[var(--muted-foreground)]">Total Predictions</p>
              </div>
              <p className="text-xl font-bold">{totalPredictions}</p>
            </div>

            <div className="bg-[#1A1A27]/30 p-3 rounded-lg border border-[#2A2A3C]/10 dark:bg-[#1A1A27]/30 light:bg-white light:border-[#E2E8F0]/50 light:shadow-sm">
              <div className="flex items-center mb-1">
                <Target size={16} className="text-[var(--muted-foreground)] mr-1" />
                <p className="text-xs font-medium text-[var(--muted-foreground)]">Average Odds</p>
              </div>
              <p className="text-xl font-bold">{averageOdds.toFixed(2)}x</p>
            </div>

            <div className="bg-[#1A1A27]/30 p-3 rounded-lg border border-[#2A2A3C]/10 dark:bg-[#1A1A27]/30 light:bg-white light:border-[#E2E8F0]/50 light:shadow-sm">
              <div className="flex items-center mb-1">
                <Percent size={16} className="text-[var(--muted-foreground)] mr-1" />
                <p className="text-xs font-medium text-[var(--muted-foreground)]">ROI</p>
              </div>
              <p className={`text-xl font-bold ${getRoiColor(roi)}`}>{roi.toFixed(1)}%</p>
            </div>

            <div className="bg-[#1A1A27]/30 p-3 rounded-lg border border-[#2A2A3C]/10 dark:bg-[#1A1A27]/30 light:bg-white light:border-[#E2E8F0]/50 light:shadow-sm">
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 rounded-full bg-[#10B981] mr-1"></div>
                <p className="text-xs font-medium text-[var(--muted-foreground)]">Won</p>
              </div>
              <p className="text-xl font-bold text-[#10B981]">{wonPredictions}</p>
            </div>

            <div className="bg-[#1A1A27]/30 p-3 rounded-lg border border-[#2A2A3C]/10 dark:bg-[#1A1A27]/30 light:bg-white light:border-[#E2E8F0]/50 light:shadow-sm">
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 rounded-full bg-[#EF4444] mr-1"></div>
                <p className="text-xs font-medium text-[var(--muted-foreground)]">Lost</p>
              </div>
              <p className="text-xl font-bold text-[#EF4444]">{lostPredictions}</p>
            </div>

            <div className="bg-[#1A1A27]/30 p-3 rounded-lg border border-[#2A2A3C]/10 dark:bg-[#1A1A27]/30 light:bg-white light:border-[#E2E8F0]/50 light:shadow-sm">
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 rounded-full bg-[#F5A623] mr-1"></div>
                <p className="text-xs font-medium text-[var(--muted-foreground)]">Pending</p>
              </div>
              <p className="text-xl font-bold text-[#F5A623]">{pendingPredictions}</p>
            </div>
          </div>

          {/* Win/Loss Distribution */}
          <div className="mt-6 pt-4 border-t border-[#2A2A3C]/20 dark:border-[#2A2A3C]/20 light:border-[#E2E8F0]/50">
            <div className="flex items-center mb-2">
              <BarChart2 size={16} className="text-[var(--muted-foreground)] mr-1" />
              <p className="text-xs font-medium text-[var(--muted-foreground)]">Win/Loss Distribution</p>
            </div>

            <div className="h-8 w-full bg-[#1A1A27] rounded-lg overflow-hidden flex dark:bg-[#1A1A27] light:bg-[#F1F5F9]">
              {wonPredictions > 0 && (
                <div
                  className="h-full bg-[#10B981] flex items-center justify-center text-xs font-medium text-black"
                  style={{ width: `${(wonPredictions / totalPredictions) * 100}%` }}
                >
                  {wonPredictions > (totalPredictions * 0.15) ? `${Math.round((wonPredictions / totalPredictions) * 100)}%` : ''}
                </div>
              )}
              {lostPredictions > 0 && (
                <div
                  className="h-full bg-[#EF4444] flex items-center justify-center text-xs font-medium text-black"
                  style={{ width: `${(lostPredictions / totalPredictions) * 100}%` }}
                >
                  {lostPredictions > (totalPredictions * 0.15) ? `${Math.round((lostPredictions / totalPredictions) * 100)}%` : ''}
                </div>
              )}
              {pendingPredictions > 0 && (
                <div
                  className="h-full bg-[#F5A623] flex items-center justify-center text-xs font-medium text-black"
                  style={{ width: `${(pendingPredictions / totalPredictions) * 100}%` }}
                >
                  {pendingPredictions > (totalPredictions * 0.15) ? `${Math.round((pendingPredictions / totalPredictions) * 100)}%` : ''}
                </div>
              )}
            </div>

            <div className="flex justify-between mt-2 text-xs">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-[#10B981] mr-1"></div>
                <span className="text-[var(--muted-foreground)]">Won</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-[#EF4444] mr-1"></div>
                <span className="text-[var(--muted-foreground)]">Lost</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-[#F5A623] mr-1"></div>
                <span className="text-[var(--muted-foreground)]">Pending</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsOverview;
