import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../common/Button';
import { ArrowRight, TrendingUp, CheckCircle, BarChart3, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const HeroSection: React.FC = () => {
  return (
    <motion.div
      className="relative w-full overflow-hidden bg-gradient-to-b from-black to-gray-900 rounded-2xl border border-amber-500/20"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

      <div className="relative z-10 px-4 py-10 md:px-6 md:py-16 lg:py-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left column - Text content */}
          <motion.div className="space-y-6" variants={itemVariants}>
            <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium mb-2">
              Premium Sports Predictions
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Expert <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Betting Predictions</span> for Today
            </h1>

            <p className="text-lg text-white/70 max-w-xl">
              Get access to data-driven predictions with high confidence levels across multiple sports and leagues. Maximize your chances with our expert analysis.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-medium"
              >
                View All Predictions <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                How It Works
              </Button>
            </div>
          </motion.div>

          {/* Right column - Feature cards */}
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4" variants={itemVariants}>
            <FeatureCard
              icon={<CheckCircle className="h-5 w-5 text-green-500" />}
              title="2 Odds Predictions"
              description="Safe bets with higher confidence"
              color="green"
              link="/predictions/2_odds"
            />

            <FeatureCard
              icon={<BarChart3 className="h-5 w-5 text-blue-500" />}
              title="5 Odds Predictions"
              description="Balanced risk and reward"
              color="blue"
              link="/predictions/5_odds"
            />

            <FeatureCard
              icon={<Zap className="h-5 w-5 text-amber-500" />}
              title="10 Odds Predictions"
              description="High reward opportunities"
              color="amber"
              link="/predictions/10_odds"
            />

            <FeatureCard
              icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
              title="Rollover Challenge"
              description="Multi-day betting strategy"
              color="purple"
              link="/rollover"
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'green' | 'blue' | 'amber' | 'purple';
  link: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color, link }) => {
  // Define color classes based on the color prop
  const colorClasses = {
    green: 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20',
    blue: 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20',
    amber: 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20',
    purple: 'bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20',
  };

  return (
    <Link to={link}>
      <motion.div
        className={`p-4 md:p-5 rounded-xl border ${colorClasses[color]} transition-all duration-300 hover:shadow-lg`}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
      >
        <div className="flex items-start">
          <div className="mr-3 md:mr-4 mt-0.5">{icon}</div>
          <div>
            <h3 className="text-white font-semibold text-base md:text-lg mb-1">{title}</h3>
            <p className="text-white/60 text-xs md:text-sm">{description}</p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default HeroSection;
