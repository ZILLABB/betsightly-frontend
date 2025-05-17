import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  Button,
  Alert,
  Tabs,
  Tab,
  Badge,
  Spinner
} from '../components/ui';
import { getMultiAPIPredictions, refreshPredictions } from '../services/apiService';
import ModernPredictionsList from '../components/ModernPredictionsList';
import DatePicker from '../components/DatePicker';
import RolloverPredictions from '../components/RolloverPredictions';
import { RefreshCw, Calendar, TrendingUp, ArrowRight } from 'lucide-react';

const ModernHomePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('predictions');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Format date for API calls
  const formattedDate = selectedDate.toISOString().split('T')[0];

  // Handle date change
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshPredictions(formattedDate);
      // Force reload the current page
      window.location.reload();
    } catch (err) {
      console.error('Error refreshing predictions:', err);
      setError('Failed to refresh predictions. Please try again later.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-8 py-4">
      {/* Hero Section */}
      <Card className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border-amber-500/20 overflow-hidden">
        <CardContent className="text-center py-12 px-4 relative">
          {/* Background effect */}
          <div className="absolute inset-0 bg-[url('/assets/pattern-dots.svg')] opacity-10"></div>

          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 premium-text">BetSightly</h1>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              AI-powered sports predictions organized by odds categories
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                variant="default"
                className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
                asChild
              >
                <Link to="/predictions" className="flex items-center">
                  View All Predictions
                  <ArrowRight size={16} className="ml-2" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                asChild
              >
                <Link to="/rollover" className="flex items-center">
                  <RefreshCw size={16} className="mr-2" />
                  Rollover Challenge
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date Picker and Refresh Button */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="w-full sm:w-auto">
          <DatePicker
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            minDate={new Date(new Date().setDate(new Date().getDate() - 7))}
            maxDate={new Date(new Date().setDate(new Date().getDate() + 7))}
          />
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="w-full sm:w-auto flex items-center justify-center"
        >
          {refreshing ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw size={16} className="mr-2" />
              Refresh All Predictions
            </>
          )}
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="w-full"
          >
            <Tab eventKey="predictions" title="Today's Predictions">
              <div className="p-6 space-y-6">
                <h2 className="text-2xl font-bold">Predictions for {selectedDate.toLocaleDateString()}</h2>

                {/* 2 Odds Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="flex items-center text-xl">
                      <Badge variant="success" className="mr-2">2 Odds</Badge>
                      Safe Bets
                    </h3>
                  </div>
                  <ModernPredictionsList
                    date={formattedDate}
                    category="2_odds"
                    maxItems={3}
                  />
                </div>

                {/* 5 Odds Section */}
                <div className="space-y-4 mt-8">
                  <div className="flex justify-between items-center">
                    <h3 className="flex items-center text-xl">
                      <Badge variant="warning" className="mr-2">5 Odds</Badge>
                      Balanced Risk
                    </h3>
                  </div>
                  <ModernPredictionsList
                    date={formattedDate}
                    category="5_odds"
                    maxItems={3}
                  />
                </div>

                {/* 10 Odds Section */}
                <div className="space-y-4 mt-8">
                  <div className="flex justify-between items-center">
                    <h3 className="flex items-center text-xl">
                      <Badge variant="danger" className="mr-2">10 Odds</Badge>
                      High Reward
                    </h3>
                  </div>
                  <ModernPredictionsList
                    date={formattedDate}
                    category="10_odds"
                    maxItems={3}
                  />
                </div>
              </div>
            </Tab>

            <Tab eventKey="fixtures" title="Today's Fixtures">
              <div className="p-6 space-y-6">
                <h2 className="text-2xl font-bold">Fixtures for {selectedDate.toLocaleDateString()}</h2>
                <Alert variant="info" className="flex items-start p-4">
                  <Calendar size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                  <span>Click on a fixture to see detailed predictions for that match.</span>
                </Alert>

                {/* Fixtures list placeholder */}
                <div className="text-center py-8 bg-[var(--muted)]/20 rounded-lg">
                  <Spinner size="md" className="mb-4" />
                  <p className="text-[var(--muted-foreground)]">Loading fixtures...</p>
                </div>
              </div>
            </Tab>

            <Tab eventKey="rollover" title="Rollover Challenge">
              <div className="p-6 space-y-6">
                <h2 className="text-2xl font-bold">10-Day Rollover Challenge</h2>
                <Alert variant="info" className="flex items-start p-4">
                  <TrendingUp size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                  <span>The rollover challenge consists of 10 days of carefully selected predictions to maximize your returns.</span>
                </Alert>
                <RolloverPredictions days={10} showGameCode={true} />
              </div>
            </Tab>
          </Tabs>
        </CardContent>
      </Card>

      {/* Footer Section */}
      <Card className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border-amber-500/20">
        <CardContent className="text-center py-8 px-4">
          <h4 className="text-xl font-bold text-white mb-2">Ready to see more predictions?</h4>
          <p className="text-gray-300 mb-6">Check out our detailed predictions page for more options.</p>
          <Button
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
            asChild
          >
            <Link to="/predictions">
              View All Predictions
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernHomePage;
