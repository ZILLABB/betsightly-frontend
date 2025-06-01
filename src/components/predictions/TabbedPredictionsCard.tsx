import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { CheckCircle, BarChart3, Zap, TrendingUp, Info } from 'lucide-react';
import PredictionGrid from './PredictionGrid';
import { cn } from '../../utils/cn';
import '../../styles/scrollbar-hide.css';

// Animation variants
const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const tabContentVariants = {
  hidden: { opacity: 0, x: 10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -10, transition: { duration: 0.2 } }
};

interface EnhancedPredictionsDisplayProps {
  predictions: Record<string, any[]>;
  onPredictionSelect?: (prediction: any) => void;
  showFilters?: boolean;
  initialCategory?: string;
}

const EnhancedPredictionsDisplay: React.FC<EnhancedPredictionsDisplayProps> = ({
  predictions,
  onPredictionSelect,
  showFilters = false,
  initialCategory = '2_odds',
}) => {

  // State to track the active tab
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);

  // Helper function to get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '2_odds':
        return <CheckCircle size={18} />;
      case '5_odds':
        return <BarChart3 size={18} />;
      case '10_odds':
        return <Zap size={18} />;
      case 'rollover':
        return <TrendingUp size={18} />;
      default:
        return <CheckCircle size={18} />;
    }
  };

  // Helper function to get category title
  const getCategoryTitle = (category: string): string => {
    switch (category) {
      case '2_odds':
        return '2 Odds Predictions';
      case '5_odds':
        return '5 Odds Predictions';
      case '10_odds':
        return '10 Odds Predictions';
      case 'rollover':
        return 'Rollover Challenge';
      default:
        return 'Predictions';
    }
  };

  // Helper function to get category description
  const getCategoryDescription = (category: string): string => {
    switch (category) {
      case '2_odds':
        return 'Safe bets with lower odds but higher confidence';
      case '5_odds':
        return 'Balanced bets with medium odds and good confidence';
      case '10_odds':
        return 'High reward bets with higher odds';
      case 'rollover':
        return 'Multi-day challenge to maximize returns';
      default:
        return 'Premium predictions for today';
    }
  };

  // Get the available categories from the predictions object
  // Show all categories even if they're empty, but ensure they're arrays
  const categories = Object.keys(predictions).filter(
    (category) => Array.isArray(predictions[category])
  );

  // If no categories from API, show default categories
  const defaultCategories = ['2_odds', '5_odds', '10_odds', 'rollover'];
  const finalCategories = categories.length > 0 ? categories : defaultCategories;

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      className="w-full"
    >
      <Card className="border border-amber-500/20 bg-gradient-to-b from-gray-900 to-black shadow-xl overflow-hidden rounded-xl">
        {/* Tabs Navigation */}
        <div className="flex overflow-x-auto scrollbar-hide border-b border-amber-500/20 bg-black/40">
          {finalCategories.map((category) => (
            <Button
              key={category}
              variant="ghost"
              size="sm"
              onClick={() => setActiveCategory(category)}
              className={cn(
                "rounded-none border-b-2 px-4 py-2 md:px-6 md:py-3 text-xs md:text-sm font-medium transition-all duration-300",
                activeCategory === category
                  ? "border-amber-500 text-amber-400 bg-black/20"
                  : "border-transparent text-white/70 hover:text-white hover:border-amber-500/50 hover:bg-black/10"
              )}
            >
              <div className="flex items-center space-x-1 md:space-x-2">
                <span className={cn(
                  "transition-all duration-300",
                  activeCategory === category
                    ? category === '2_odds' ? "text-green-500"
                      : category === '5_odds' ? "text-blue-500"
                      : category === '10_odds' ? "text-amber-500"
                      : "text-purple-500"
                    : "text-white/50"
                )}>
                  {getCategoryIcon(category)}
                </span>
                <span>{getCategoryTitle(category).split(' ')[0]}</span>
              </div>
            </Button>
          ))}
        </div>

        {/* Active Category Header with gradient background */}
        <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 to-black p-4 md:p-6 border-b border-amber-500/10">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-16 md:w-24 h-16 md:h-24 bg-amber-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>

          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">{getCategoryTitle(activeCategory)}</h2>
              <p className="text-xs md:text-sm text-white/70 max-w-2xl">{getCategoryDescription(activeCategory)}</p>
            </div>
            <div className={cn(
              "p-1.5 md:p-2 rounded-full",
              activeCategory === '2_odds' ? "bg-green-500/10"
                : activeCategory === '5_odds' ? "bg-blue-500/10"
                : activeCategory === '10_odds' ? "bg-amber-500/10"
                : "bg-purple-500/10"
            )}>
              <span className={cn(
                activeCategory === '2_odds' ? "text-green-500"
                  : activeCategory === '5_odds' ? "text-blue-500"
                  : activeCategory === '10_odds' ? "text-amber-500"
                  : "text-purple-500"
              )}>
                {getCategoryIcon(activeCategory)}
              </span>
            </div>
          </div>
        </div>

        {/* Active Category Content with AnimatePresence for smooth transitions */}
        <CardContent className="p-3 md:p-6 bg-black/20">
          <AnimatePresence mode="wait">
            {finalCategories.includes(activeCategory) && (
              <motion.div
                key={activeCategory}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={tabContentVariants}
              >
                <PredictionGrid
                  title=""
                  predictions={predictions[activeCategory] || []}
                  category={activeCategory}
                  maxItems={6}
                  showViewMore={true}
                  showFilters={showFilters}
                  showSorting={showFilters}
                  onPredictionSelect={onPredictionSelect}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EnhancedPredictionsDisplay;

// Export with legacy name for backward compatibility
export { EnhancedPredictionsDisplay as TabbedPredictionsCard };
