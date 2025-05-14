import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import { Button } from '../common/Button';
import { TrendingUp, TrendingDown, BarChart2, PieChart, Filter, Download } from 'lucide-react';
import DatePicker from '../common/DatePicker';
import CurrencyDisplay from '../common/CurrencyDisplay';

// Mock data for analytics
const mockAnalyticsData = {
  totalPredictions: 1248,
  wonPredictions: 723,
  lostPredictions: 412,
  pendingPredictions: 113,
  winRate: 63.7,
  averageOdds: 2.45,
  profitLoss: 1842.50,
  roi: 24.3,
  sportBreakdown: [
    { sport: 'Soccer', count: 782, winRate: 68.2 },
    { sport: 'Basketball', count: 321, winRate: 59.4 },
    { sport: 'Tennis', count: 145, winRate: 52.8 }
  ],
  recentPerformance: [
    { date: '2023-06-01', winRate: 72.4, predictions: 58 },
    { date: '2023-06-02', winRate: 65.3, predictions: 49 },
    { date: '2023-06-03', winRate: 58.7, predictions: 63 },
    { date: '2023-06-04', winRate: 70.1, predictions: 47 },
    { date: '2023-06-05', winRate: 61.9, predictions: 52 },
    { date: '2023-06-06', winRate: 67.8, predictions: 59 },
    { date: '2023-06-07', winRate: 64.2, predictions: 61 }
  ]
};

interface AnalyticsDashboardProps {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  userId,
  startDate: initialStartDate,
  endDate: initialEndDate
}) => {
  const [startDate, setStartDate] = useState<Date>(initialStartDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date>(initialEndDate || new Date());
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [data, setData] = useState(mockAnalyticsData);

  // Simulate data fetching when filters change
  useEffect(() => {
    // In a real app, this would be an API call with the filters
    console.log('Fetching analytics data with filters:', {
      startDate,
      endDate,
      selectedSport,
      userId
    });

    // Simulate loading delay
    const timer = setTimeout(() => {
      // Just using mock data for now
      setData({
        ...mockAnalyticsData,
        // Slightly modify data to simulate filter changes
        winRate: mockAnalyticsData.winRate + (Math.random() * 5 - 2.5),
        profitLoss: mockAnalyticsData.profitLoss + (Math.random() * 200 - 100)
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [startDate, endDate, selectedSport, userId]);

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Performance Analytics</h2>
          <p className="text-[#A1A1AA]">Track your betting performance and insights</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs px-3 py-1 h-auto"
          >
            <Filter size={14} className="mr-1.5" />
            Filters
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-xs px-3 py-1 h-auto"
          >
            <Download size={14} className="mr-1.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-2">Date Range</label>
                <div className="flex items-center gap-2">
                  <DatePicker
                    selectedDate={startDate}
                    onDateChange={setStartDate}
                    maxDate={endDate}
                  />
                  <span>to</span>
                  <DatePicker
                    selectedDate={endDate}
                    onDateChange={setEndDate}
                    minDate={startDate}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-2">Sport</label>
                <select
                  className="w-full bg-[#1A1A27] border border-[#2A2A3C] rounded-lg p-2 text-sm"
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                >
                  <option value="all">All Sports</option>
                  <option value="soccer">Soccer</option>
                  <option value="basketball">Basketball</option>
                  <option value="tennis">Tennis</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[#A1A1AA] text-sm">Win Rate</p>
                <h3 className="text-2xl font-bold mt-1">{data.winRate.toFixed(1)}%</h3>
              </div>
              <div className={`p-2 rounded-full ${data.winRate > 50 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                {data.winRate > 50 ? (
                  <TrendingUp size={20} className="text-green-500" />
                ) : (
                  <TrendingDown size={20} className="text-red-500" />
                )}
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <span className={data.winRate > 60 ? 'text-green-500' : 'text-[#A1A1AA]'}>
                {data.wonPredictions} won
              </span>
              <span className="mx-1 text-[#A1A1AA]">•</span>
              <span className={data.winRate < 40 ? 'text-red-500' : 'text-[#A1A1AA]'}>
                {data.lostPredictions} lost
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[#A1A1AA] text-sm">Profit/Loss</p>
                <h3 className="text-2xl font-bold mt-1">
                  <CurrencyDisplay amount={data.profitLoss} originalCurrency="USD" />
                </h3>
              </div>
              <div className={`p-2 rounded-full ${data.profitLoss > 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                {data.profitLoss > 0 ? (
                  <TrendingUp size={20} className="text-green-500" />
                ) : (
                  <TrendingDown size={20} className="text-red-500" />
                )}
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <span className="text-[#A1A1AA]">ROI:</span>
              <span className={`ml-1 ${data.roi > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {data.roi > 0 ? '+' : ''}{data.roi.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[#A1A1AA] text-sm">Total Predictions</p>
                <h3 className="text-2xl font-bold mt-1">{data.totalPredictions}</h3>
              </div>
              <div className="p-2 rounded-full bg-[#F5A623]/10">
                <BarChart2 size={20} className="text-[#F5A623]" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <span className="text-[#A1A1AA]">
                {data.pendingPredictions} pending
              </span>
              <span className="mx-1 text-[#A1A1AA]">•</span>
              <span className="text-[#A1A1AA]">
                Avg. Odds: {data.averageOdds.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[#A1A1AA] text-sm">Best Sport</p>
                <h3 className="text-2xl font-bold mt-1">
                  {data.sportBreakdown.sort((a, b) => b.winRate - a.winRate)[0].sport}
                </h3>
              </div>
              <div className="p-2 rounded-full bg-[#F5A623]/10">
                <PieChart size={20} className="text-[#F5A623]" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <span className="text-green-500">
                {data.sportBreakdown.sort((a, b) => b.winRate - a.winRate)[0].winRate.toFixed(1)}% win rate
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sport breakdown */}
      <Card>
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-lg">Sport Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-3">
            {data.sportBreakdown.map((sport) => (
              <div key={sport.sport} className="flex items-center">
                <div className="w-24 text-sm">{sport.sport}</div>
                <div className="flex-1 h-2 bg-[#1A1A27] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      sport.winRate > 65 ? 'bg-green-500' :
                      sport.winRate > 50 ? 'bg-[#F5A623]' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${sport.winRate}%` }}
                  ></div>
                </div>
                <div className="w-16 text-right text-sm">{sport.winRate.toFixed(1)}%</div>
                <div className="w-16 text-right text-xs text-[#A1A1AA]">{sport.count} picks</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
