import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../common/Card";
import { Badge } from "../common/Badge";
import { TrendingUp, TrendingDown, Calendar, BarChart2, ArrowRight } from "lucide-react";

interface TrendPoint {
  date: string;
  successRate: number;
  totalPredictions: number;
}

interface TrendAnalysisProps {
  trends: TrendPoint[];
  timeframe?: "week" | "month" | "all" | "custom";
}

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ 
  trends = [], 
  timeframe = "week" 
}) => {
  // Get timeframe text
  const timeframeText = timeframe === "week" ? "Last 7 Days" : 
                        timeframe === "month" ? "Last 30 Days" : 
                        "All Time";
  
  // Calculate overall trend (up or down)
  const calculateTrend = () => {
    if (trends.length < 2) return "neutral";
    
    const firstRate = trends[0].successRate;
    const lastRate = trends[trends.length - 1].successRate;
    
    if (lastRate > firstRate) return "up";
    if (lastRate < firstRate) return "down";
    return "neutral";
  };
  
  const trend = calculateTrend();
  
  // Calculate average success rate
  const averageSuccessRate = trends.length > 0
    ? trends.reduce((sum, point) => sum + point.successRate, 0) / trends.length
    : 0;
  
  // Find best and worst days
  const bestDay = trends.length > 0
    ? trends.reduce((best, current) => current.successRate > best.successRate ? current : best, trends[0])
    : null;
    
  const worstDay = trends.length > 0
    ? trends.reduce((worst, current) => current.successRate < worst.successRate ? current : worst, trends[0])
    : null;
  
  return (
    <Card className="w-full bg-[#1A1A27]/80 border border-[#2A2A3C]/20 shadow-lg overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <BarChart2 size={18} className="mr-2 text-[#F5A623]" />
            Performance Trends
          </CardTitle>
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            {timeframeText}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Trend Overview */}
        <div className="mb-6 bg-[#1A1A27]/50 p-3 rounded-lg border border-[#2A2A3C]/10">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              {trend === "up" ? (
                <TrendingUp size={20} className="text-[#10B981] mr-2" />
              ) : trend === "down" ? (
                <TrendingDown size={20} className="text-[#EF4444] mr-2" />
              ) : (
                <ArrowRight size={20} className="text-[#F5A623] mr-2" />
              )}
              <span className="text-sm font-medium text-[#A1A1AA]">Overall Trend</span>
            </div>
            <div className={`text-lg font-bold ${
              trend === "up" ? "text-[#10B981]" : 
              trend === "down" ? "text-[#EF4444]" : 
              "text-[#F5A623]"
            }`}>
              {trend === "up" ? "Improving" : 
               trend === "down" ? "Declining" : 
               "Stable"}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-[#1A1A27]/30 p-2 rounded-lg">
              <p className="text-xs text-[#A1A1AA] mb-1">Average Success</p>
              <p className="text-base font-bold">{averageSuccessRate.toFixed(1)}%</p>
            </div>
            
            {bestDay && (
              <div className="bg-[#1A1A27]/30 p-2 rounded-lg">
                <p className="text-xs text-[#A1A1AA] mb-1">Best Day</p>
                <p className="text-base font-bold text-[#10B981]">{bestDay.successRate.toFixed(1)}%</p>
                <p className="text-xs text-[#A1A1AA]">{new Date(bestDay.date).toLocaleDateString()}</p>
              </div>
            )}
            
            {worstDay && (
              <div className="bg-[#1A1A27]/30 p-2 rounded-lg">
                <p className="text-xs text-[#A1A1AA] mb-1">Worst Day</p>
                <p className="text-base font-bold text-[#EF4444]">{worstDay.successRate.toFixed(1)}%</p>
                <p className="text-xs text-[#A1A1AA]">{new Date(worstDay.date).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Trend Chart */}
        <div>
          <div className="flex items-center mb-2">
            <Calendar size={16} className="text-[#A1A1AA] mr-1" />
            <p className="text-xs font-medium text-[#A1A1AA]">Daily Success Rate</p>
          </div>
          
          <div className="relative h-40 mt-4">
            {/* Chart background grid */}
            <div className="absolute inset-0 grid grid-cols-1 grid-rows-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="border-t border-[#2A2A3C]/20 relative">
                  <span className="absolute -top-2.5 -left-6 text-xs text-[#A1A1AA]">
                    {100 - i * 25}%
                  </span>
                </div>
              ))}
            </div>
            
            {/* Chart bars */}
            <div className="absolute inset-0 flex items-end justify-between">
              {trends.map((point, index) => (
                <div key={index} className="flex flex-col items-center w-full">
                  <div 
                    className={`w-4/5 ${
                      point.successRate >= 70 ? "bg-[#10B981]" :
                      point.successRate >= 50 ? "bg-[#F5A623]" :
                      "bg-[#EF4444]"
                    } rounded-t-sm`}
                    style={{ height: `${point.successRate}%` }}
                  ></div>
                  <div className="mt-1 text-[10px] text-[#A1A1AA]">
                    {new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendAnalysis;
