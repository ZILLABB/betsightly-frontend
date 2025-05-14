import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../common/Card";
import { Badge } from "../common/Badge";
import { PieChart, Target, Zap, DollarSign, Award } from "lucide-react";

interface SportBreakdown {
  sport: string;
  totalPredictions: number;
  wonPredictions: number;
  lostPredictions: number;
  pendingPredictions: number;
  successRate: number;
  averageOdds: number;
}

interface OddsBreakdown {
  range: string;
  totalPredictions: number;
  wonPredictions: number;
  lostPredictions: number;
  pendingPredictions: number;
  successRate: number;
}

interface OutcomeAnalysisProps {
  sportBreakdown: SportBreakdown[];
  oddsBreakdown: OddsBreakdown[];
  timeframe?: "week" | "month" | "all" | "custom";
}

const OutcomeAnalysis: React.FC<OutcomeAnalysisProps> = ({
  sportBreakdown = [],
  oddsBreakdown = [],
  timeframe = "week"
}) => {
  // Get timeframe text
  const timeframeText = timeframe === "week" ? "Last 7 Days" : 
                        timeframe === "month" ? "Last 30 Days" : 
                        "All Time";
  
  // Find best performing sport
  const bestSport = sportBreakdown.length > 0
    ? sportBreakdown.reduce((best, current) => 
        current.successRate > best.successRate ? current : best, 
        sportBreakdown[0]
      )
    : null;
  
  // Find best odds range
  const bestOddsRange = oddsBreakdown.length > 0
    ? oddsBreakdown.reduce((best, current) => 
        current.successRate > best.successRate ? current : best, 
        oddsBreakdown[0]
      )
    : null;
  
  return (
    <Card className="w-full bg-[#1A1A27]/80 border border-[#2A2A3C]/20 shadow-lg overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <PieChart size={18} className="mr-2 text-[#F5A623]" />
            Outcome Analysis
          </CardTitle>
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            {timeframeText}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Best Performers */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {bestSport && (
            <div className="bg-[#1A1A27]/50 p-3 rounded-lg border border-[#2A2A3C]/10">
              <div className="flex items-center mb-2">
                <Target size={18} className="text-[#F5A623] mr-2" />
                <span className="text-sm font-medium">Best Sport</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-bold capitalize">{bestSport.sport}</p>
                  <p className="text-xs text-[#A1A1AA]">{bestSport.totalPredictions} predictions</p>
                </div>
                <div>
                  <Badge 
                    variant="success" 
                    className="text-sm px-2 py-1"
                  >
                    {bestSport.successRate.toFixed(1)}% Win Rate
                  </Badge>
                </div>
              </div>
            </div>
          )}
          
          {bestOddsRange && (
            <div className="bg-[#1A1A27]/50 p-3 rounded-lg border border-[#2A2A3C]/10">
              <div className="flex items-center mb-2">
                <Zap size={18} className="text-[#F5A623] mr-2" />
                <span className="text-sm font-medium">Best Odds Range</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-bold">{bestOddsRange.range}</p>
                  <p className="text-xs text-[#A1A1AA]">{bestOddsRange.totalPredictions} predictions</p>
                </div>
                <div>
                  <Badge 
                    variant="success" 
                    className="text-sm px-2 py-1"
                  >
                    {bestOddsRange.successRate.toFixed(1)}% Win Rate
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Sport Breakdown */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <Target size={16} className="text-[#A1A1AA] mr-1" />
            <p className="text-xs font-medium text-[#A1A1AA]">Sport Breakdown</p>
          </div>
          
          <div className="space-y-3">
            {sportBreakdown.map((sport, index) => (
              <div key={index} className="bg-[#1A1A27]/30 p-2 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium capitalize">{sport.sport}</span>
                  <Badge 
                    variant={
                      sport.successRate >= 70 ? "success" :
                      sport.successRate >= 50 ? "warning" :
                      "danger"
                    } 
                    className="text-xs px-1.5 py-0.5"
                  >
                    {sport.successRate.toFixed(1)}%
                  </Badge>
                </div>
                
                <div className="w-full bg-[#2A2A3C] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      sport.successRate >= 70 ? "bg-[#10B981]" :
                      sport.successRate >= 50 ? "bg-[#F5A623]" :
                      "bg-[#EF4444]"
                    }`}
                    style={{ width: `${sport.successRate}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between mt-1 text-xs text-[#A1A1AA]">
                  <span>{sport.totalPredictions} predictions</span>
                  <span>Avg. Odds: {sport.averageOdds.toFixed(2)}x</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Odds Breakdown */}
        <div>
          <div className="flex items-center mb-3">
            <DollarSign size={16} className="text-[#A1A1AA] mr-1" />
            <p className="text-xs font-medium text-[#A1A1AA]">Odds Breakdown</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {oddsBreakdown.map((range, index) => (
              <div key={index} className="bg-[#1A1A27]/30 p-2 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{range.range}</span>
                  <Badge 
                    variant={
                      range.successRate >= 70 ? "success" :
                      range.successRate >= 50 ? "warning" :
                      "danger"
                    } 
                    className="text-xs px-1.5 py-0.5"
                  >
                    {range.successRate.toFixed(1)}%
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-xs text-[#A1A1AA]">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-[#10B981] mr-1"></div>
                    <span>{range.wonPredictions} won</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-[#EF4444] mr-1"></div>
                    <span>{range.lostPredictions} lost</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-[#F5A623] mr-1"></div>
                    <span>{range.pendingPredictions} pending</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OutcomeAnalysis;
