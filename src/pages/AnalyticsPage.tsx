import React from 'react';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';
import { Card, CardContent } from '../components/common/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/common/Tabs';
import { useBreakpoints } from '../hooks/useMediaQuery';

const AnalyticsPage: React.FC = () => {
  const { isMobile } = useBreakpoints();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground">
          Track your betting performance and get insights to improve your strategy.
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sports">Sports</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="sports" className="mt-0">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <h3 className="text-lg font-medium mb-2">Sports Analytics</h3>
                <p className="text-[#A1A1AA]">
                  Detailed sports analytics will be available soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="mt-0">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <h3 className="text-lg font-medium mb-2">Prediction Analytics</h3>
                <p className="text-[#A1A1AA]">
                  Detailed prediction analytics will be available soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="mt-0">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <h3 className="text-lg font-medium mb-2">Trend Analysis</h3>
                <p className="text-[#A1A1AA]">
                  Detailed trend analysis will be available soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;
