import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Calendar, BarChart2 } from 'lucide-react';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const StatsSection: React.FC = () => {
  return (
    <motion.div
      className="w-full py-8 md:py-12 bg-gradient-to-r from-gray-900 to-black rounded-xl md:rounded-2xl border border-amber-500/20"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div
          className="text-center mb-8 md:mb-12"
          variants={itemVariants}
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 md:mb-4">Our Prediction Performance</h2>
          <p className="text-white/70 max-w-2xl mx-auto text-sm md:text-base">
            We pride ourselves on delivering accurate predictions backed by data analysis and expert insights.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
          variants={containerVariants}
        >
          <StatCard
            icon={<Trophy className="h-6 w-6 text-amber-400" />}
            value="78%"
            label="Success Rate"
            description="For 2 odds predictions"
            color="amber"
            variants={itemVariants}
          />

          <StatCard
            icon={<Users className="h-6 w-6 text-blue-400" />}
            value="15,000+"
            label="Active Users"
            description="Trusting our predictions"
            color="blue"
            variants={itemVariants}
          />

          <StatCard
            icon={<Calendar className="h-6 w-6 text-green-400" />}
            value="365"
            label="Days/Year"
            description="Daily predictions"
            color="green"
            variants={itemVariants}
          />

          <StatCard
            icon={<BarChart2 className="h-6 w-6 text-purple-400" />}
            value="25+"
            label="Leagues"
            description="Across multiple sports"
            color="purple"
            variants={itemVariants}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  description: string;
  color: 'amber' | 'blue' | 'green' | 'purple';
  variants: any;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, description, color, variants }) => {
  // Define color classes based on the color prop
  const colorClasses = {
    amber: 'bg-amber-500/10 border-amber-500/30',
    blue: 'bg-blue-500/10 border-blue-500/30',
    green: 'bg-green-500/10 border-green-500/30',
    purple: 'bg-purple-500/10 border-purple-500/30',
  };

  return (
    <motion.div
      className={`p-4 md:p-6 rounded-xl border ${colorClasses[color]} transition-all duration-300 hover:shadow-lg`}
      variants={variants}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="flex items-center mb-3 md:mb-4">
        <div className={`p-1.5 md:p-2 rounded-lg bg-${color}-500/20 mr-2 md:mr-3`}>
          {icon}
        </div>
        <h3 className="text-white font-semibold text-sm md:text-base">{label}</h3>
      </div>

      <div className="mt-1 md:mt-2">
        <p className={`text-2xl md:text-4xl font-bold text-${color}-400`}>{value}</p>
        <p className="text-white/60 text-xs md:text-sm mt-1">{description}</p>
      </div>
    </motion.div>
  );
};

export default StatsSection;
