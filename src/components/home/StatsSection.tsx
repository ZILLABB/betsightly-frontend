import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Calendar, BarChart2 } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const STATS = [
  {
    icon: Trophy,
    value: "78%",
    label: "Success Rate",
    desc: "For 2 odds predictions",
    accent: "#3b82f6",
    accentBg: "rgba(59,130,246,0.1)",
    accentBorder: "rgba(59,130,246,0.25)",
  },
  {
    icon: Users,
    value: "15,000+",
    label: "Active Users",
    desc: "Trusting our predictions daily",
    accent: "#60a5fa",
    accentBg: "rgba(96,165,250,0.1)",
    accentBorder: "rgba(96,165,250,0.25)",
  },
  {
    icon: Calendar,
    value: "365",
    label: "Days / Year",
    desc: "Predictions published every day",
    accent: "#4ade80",
    accentBg: "rgba(74,222,128,0.1)",
    accentBorder: "rgba(74,222,128,0.25)",
  },
  {
    icon: BarChart2,
    value: "25+",
    label: "Leagues",
    desc: "Across multiple sports",
    accent: "#a78bfa",
    accentBg: "rgba(167,139,250,0.1)",
    accentBorder: "rgba(167,139,250,0.25)",
  },
];

const StatsSection: React.FC = () => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={containerVariants}
    className="w-full rounded-2xl overflow-hidden"
    style={{
      background: "linear-gradient(160deg, var(--surface-3) 0%, var(--surface-2) 100%)",
      border: "1px solid var(--border-default)",
    }}
  >
    <div className="px-6 py-10 md:py-14">
      <motion.div className="text-center mb-10" variants={itemVariants}>
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: "var(--brand-500)", fontFamily: "var(--font-body)" }}
        >
          Performance
        </p>
        <h2
          className="text-2xl md:text-3xl font-bold mb-3"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          Prediction Track Record
        </h2>
        <p className="max-w-xl mx-auto text-sm md:text-base" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
          Data-driven analysis with a proven performance history.
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
        variants={containerVariants}
      >
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="rounded-xl p-5 md:p-6 transition-all duration-300"
              style={{
                background: s.accentBg,
                border: `1px solid ${s.accentBorder}`,
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: `${s.accent}22` }}>
                  <Icon size={18} style={{ color: s.accent }} />
                </div>
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
                >
                  {s.label}
                </span>
              </div>
              <p
                className="text-3xl md:text-4xl font-bold mb-1"
                style={{ fontFamily: "var(--font-display)", color: s.accent }}
              >
                {s.value}
              </p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
                {s.desc}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  </motion.div>
);

export default StatsSection;
