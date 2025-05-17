import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
import PredictionsGrid from '../components/PredictionsGrid';
import DatePicker from '../components/ui/DatePicker';
import RolloverPredictions from '../components/RolloverPredictions';
import {
  RefreshCw,
  Calendar,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Zap,
  BarChart3,
  Trophy
} from 'lucide-react';
import { fadeVariants, pageVariants } from '../utils/animations';

const MainPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('predictions');
  const [oddsTab, setOddsTab] = useState<string>('2_odds');
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
    <motion.div
      className="space-y-8 py-4"
      initial="initial"
      animate="animate"
      variants={pageVariants}
    >
      {/* Hero Section */}
      <motion.div variants={fadeVariants} custom={0}>
        <Card className="premium-card overflow-hidden shadow-2xl">
          <CardContent className="text-center py-20 px-4 relative">
            {/* Background effect */}
            <div className="absolute inset-0 bg-[url('/assets/pattern-dots.svg')] opacity-10"></div>

            {/* Premium animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10 animate-gradient-x"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/50"></div>

            {/* Subtle floating particles */}
            <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-amber-500/30 animate-float"></div>
            <div className="absolute top-3/4 left-1/3 w-3 h-3 rounded-full bg-amber-500/20 animate-float" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full bg-amber-500/30 animate-float" style={{ animationDelay: '2s' }}></div>

            <motion.div
              className="relative z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.div
                className="mb-2 flex justify-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-black/30 border border-amber-500/30 text-amber-400 text-xs font-medium mb-4">
                  <Trophy size={12} className="mr-1.5" />
                  PREMIUM PREDICTIONS
                </div>
              </motion.div>

              <motion.h1
                className="text-4xl md:text-7xl font-bold mb-6 premium-text"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                BetSightly
              </motion.h1>
              <motion.p
                className="text-lg md:text-xl text-amber-100/80 mb-10 max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                AI-powered sports predictions with unmatched accuracy
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row justify-center gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <Button
                  variant="default"
                  className="premium-button py-6 px-8 text-lg"
                  asChild
                >
                  <Link to="/predictions" className="flex items-center">
                    View All Predictions
                    <ArrowRight size={18} className="ml-2" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-amber-500/30 text-amber-400 hover:bg-black/20 hover:border-amber-500/50 transition-all duration-300 py-6 px-8 text-lg"
                  asChild
                >
                  <Link to="/rollover" className="flex items-center">
                    <RefreshCw size={18} className="mr-2" />
                    Rollover Challenge
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Date Picker and Refresh Button */}
      <motion.div
        variants={fadeVariants}
        custom={1}
        className="bg-gradient-to-r from-gray-900 to-black border border-amber-500/20 rounded-xl p-5 shadow-lg"
      >
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="w-full sm:w-auto flex items-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/10 mr-4">
              <Calendar size={18} className="text-amber-400" />
            </div>
            <div>
              <div className="text-sm font-medium mb-1 text-amber-400">Select Date</div>
              <DatePicker
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                minDate={new Date(new Date().setDate(new Date().getDate() - 7))}
                maxDate={new Date(new Date().setDate(new Date().getDate() + 7))}
              />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full sm:w-auto flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300 border-amber-500/30 text-amber-400 hover:border-amber-500/50 hover:bg-black/20 py-2.5 px-4"
          >
            {refreshing ? (
              <>
                <Spinner size="sm" className="mr-2" />
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <RefreshCw size={16} className="mr-2" />
                <span>Refresh Predictions</span>
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div variants={fadeVariants} custom={2}>
        <Card className="shadow-xl border border-amber-500/20 overflow-hidden bg-gradient-to-b from-gray-900 to-black">
          <CardContent className="p-0">
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="w-full premium-tabs"
            >
              <Tab
                eventKey="predictions"
                title={
                  <div className="flex items-center space-x-2 py-1.5">
                    <Trophy size={16} className="text-amber-400" />
                    <span>Today's Picks</span>
                  </div>
                }
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`predictions-${activeTab === 'predictions'}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-8 space-y-10"
                  >
                    <motion.div
                      className="flex items-center justify-between"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <h2 className="text-2xl font-bold text-amber-400">
                        Premium Picks <span className="text-white/70">• {selectedDate.toLocaleDateString()}</span>
                      </h2>

                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-sm text-white/70">Live Updates</span>
                      </div>
                    </motion.div>

                    {/* Simplified Odds Tabs */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="bg-black/30 rounded-xl p-6 border border-amber-500/10"
                    >
                      <Tabs
                        activeKey={oddsTab}
                        onSelect={(k) => setOddsTab(k)}
                        className="w-full premium-inner-tabs"
                      >
                        <Tab
                          eventKey="2_odds"
                          title={
                            <div className="flex items-center space-x-2 py-1">
                              <CheckCircle size={14} className="text-green-500" />
                              <span>2 Odds</span>
                              <Badge variant="success" className="ml-1 text-xs">Safe</Badge>
                            </div>
                          }
                        >
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={`2_odds-${oddsTab === '2_odds'}`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="pt-6"
                            >
                              <PredictionsGrid
                                date={formattedDate}
                                category="2_odds"
                                maxItems={3}
                                showGameCode={true}
                              />
                            </motion.div>
                          </AnimatePresence>
                        </Tab>

                        <Tab
                          eventKey="5_odds"
                          title={
                            <div className="flex items-center space-x-2 py-1">
                              <BarChart3 size={14} className="text-blue-500" />
                              <span>5 Odds</span>
                              <Badge variant="info" className="ml-1 text-xs">Balanced</Badge>
                            </div>
                          }
                        >
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={`5_odds-${oddsTab === '5_odds'}`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="pt-6"
                            >
                              <PredictionsGrid
                                date={formattedDate}
                                category="5_odds"
                                maxItems={3}
                                showGameCode={true}
                              />
                            </motion.div>
                          </AnimatePresence>
                        </Tab>

                        <Tab
                          eventKey="10_odds"
                          title={
                            <div className="flex items-center space-x-2 py-1">
                              <Zap size={14} className="text-amber-500" />
                              <span>10 Odds</span>
                              <Badge variant="warning" className="ml-1 text-xs">High Reward</Badge>
                            </div>
                          }
                        >
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={`10_odds-${oddsTab === '10_odds'}`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="pt-6"
                            >
                              <PredictionsGrid
                                date={formattedDate}
                                category="10_odds"
                                maxItems={3}
                                showGameCode={true}
                              />
                            </motion.div>
                          </AnimatePresence>
                        </Tab>
                      </Tabs>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </Tab>

              <Tab
                eventKey="fixtures"
                title={
                  <div className="flex items-center space-x-2 py-1.5">
                    <Calendar size={16} className="text-amber-400" />
                    <span>Fixtures</span>
                  </div>
                }
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`fixtures-${activeTab === 'fixtures'}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-8 space-y-6"
                  >
                    <motion.h2
                      className="text-2xl font-bold text-amber-400"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      Today's Fixtures <span className="text-white/70">• {selectedDate.toLocaleDateString()}</span>
                    </motion.h2>

                    <Alert variant="info" className="flex items-start p-4 shadow-md bg-black/30 border-blue-500/20 text-blue-400">
                      <Calendar size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                      <span>Click on a fixture to see detailed predictions for that match.</span>
                    </Alert>

                    {/* Fixtures list placeholder */}
                    <motion.div
                      className="text-center py-16 bg-black/20 rounded-xl border border-amber-500/10"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                    >
                      <Spinner size="lg" variant="primary" className="mb-4" />
                      <p className="text-white/70">Loading fixtures...</p>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </Tab>

              <Tab
                eventKey="rollover"
                title={
                  <div className="flex items-center space-x-2 py-1.5">
                    <TrendingUp size={16} className="text-amber-400" />
                    <span>Rollover</span>
                  </div>
                }
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`rollover-${activeTab === 'rollover'}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-8 space-y-8"
                  >
                    <motion.div
                      className="flex items-center justify-between"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <h2 className="text-2xl font-bold text-amber-400">
                        10-Day Rollover Challenge
                      </h2>

                      <Badge variant="outline" className="border-amber-500/30 text-amber-400 px-3 py-1">
                        Premium
                      </Badge>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="bg-black/30 rounded-xl p-6 border border-amber-500/10"
                    >
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10">
                          <TrendingUp size={24} className="text-amber-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">Maximize Your Returns</h3>
                          <p className="text-white/70">Carefully selected predictions over 10 days</p>
                        </div>
                      </div>

                      <RolloverPredictions days={10} showGameCode={true} />
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </Tab>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer Section */}
      <motion.div variants={fadeVariants} custom={3}>
        <Card className="premium-card shadow-2xl overflow-hidden">
          <CardContent className="text-center py-16 px-6 relative">
            {/* Background effect */}
            <div className="absolute inset-0 bg-[url('/assets/pattern-dots.svg')] opacity-10"></div>

            {/* Premium animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10 animate-gradient-x"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/50"></div>

            {/* Subtle floating particles */}
            <div className="absolute bottom-1/4 left-1/3 w-2 h-2 rounded-full bg-amber-500/30 animate-float"></div>
            <div className="absolute top-1/3 right-1/3 w-3 h-3 rounded-full bg-amber-500/20 animate-float" style={{ animationDelay: '1.5s' }}></div>

            <motion.div
              className="relative z-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="mb-8 flex justify-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-black/30 border border-amber-500/30 text-amber-400 text-sm font-medium">
                  <Trophy size={14} className="mr-2" />
                  PREMIUM ACCESS
                </div>
              </motion.div>

              <motion.h4
                className="text-3xl font-bold text-amber-400 mb-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Unlock More Premium Predictions
              </motion.h4>
              <motion.p
                className="text-amber-100/80 mb-10 max-w-xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                Access our full range of AI-powered predictions and advanced betting strategies
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-col sm:flex-row justify-center gap-4"
              >
                <Button
                  variant="default"
                  className="premium-button py-6 px-8 text-lg"
                  asChild
                >
                  <Link to="/predictions" className="flex items-center">
                    View All Predictions
                    <ArrowRight size={18} className="ml-2" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-amber-500/30 text-amber-400 hover:bg-black/20 hover:border-amber-500/50 transition-all duration-300 py-6 px-8 text-lg"
                  asChild
                >
                  <Link to="/rollover" className="flex items-center">
                    <RefreshCw size={18} className="mr-2" />
                    Rollover Challenge
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default MainPage;
