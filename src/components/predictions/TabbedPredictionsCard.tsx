import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, BarChart3, Zap, TrendingUp } from 'lucide-react';
import PredictionGrid from './PredictionGrid';
import { useSwipeGestures } from '../../hooks/useSwipeGestures';
import { cn } from '../../utils/cn';
import '../../styles/scrollbar-hide.css';

const cardVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const tabContentVariants = {
  hidden:   { opacity: 0, x: 8 },
  visible:  { opacity: 1, x: 0, transition: { duration: 0.25 } },
  exit:     { opacity: 0, x: -8, transition: { duration: 0.15 } },
};

interface TabbedPredictionsCardProps {
  predictions: Record<string, any[]>;
  onPredictionSelect?: (prediction: any) => void;
  showFilters?: boolean;
}

const CATEGORIES = ['2_odds', '5_odds', '10_odds', 'rollover'];

const CATEGORY_META = {
  '2_odds':   { label: '2 Odds',   subtitle: 'Safe picks · high confidence', icon: CheckCircle, accent: '#22c55e' },
  '5_odds':   { label: '5 Odds',   subtitle: 'Balanced risk & reward',        icon: BarChart3,   accent: '#60a5fa' },
  '10_odds':  { label: '10 Odds',  subtitle: 'High reward accumulator',       icon: Zap,         accent: '#f59e0b' },
  'rollover': { label: 'Rollover', subtitle: 'Multi-day challenge',           icon: TrendingUp,  accent: '#a78bfa' },
} as const;

const TabbedPredictionsCard: React.FC<TabbedPredictionsCardProps> = ({
  predictions,
  onPredictionSelect,
  showFilters = false,
}) => {
  const categories = CATEGORIES.filter(cat =>
    predictions[cat] && Array.isArray(predictions[cat])
  );

  const [activeCategory, setActiveCategory] = useState<string>(categories[0] || '2_odds');

  useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeCategory)) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const { elementRef } = useSwipeGestures({
    onSwipeLeft: () => {
      const idx = categories.indexOf(activeCategory);
      setActiveCategory(categories[(idx + 1) % categories.length]);
    },
    onSwipeRight: () => {
      const idx = categories.indexOf(activeCategory);
      setActiveCategory(categories[idx === 0 ? categories.length - 1 : idx - 1]);
    },
    threshold: 50,
    enabled: true,
    enableHaptic: true,
  });

  if (categories.length === 0) {
    return (
      <motion.div variants={cardVariants} initial="initial" animate="animate" className="w-full">
        <div
          className="rounded-2xl flex flex-col items-center justify-center p-12 gap-4"
          style={{
            background: "linear-gradient(160deg, var(--surface-3), var(--surface-2))",
            border: "1px solid var(--border-default)",
          }}
        >
          <div
            className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: "rgba(245,158,11,0.25)", borderTopColor: "var(--brand-500)" }}
          />
          <div className="text-center">
            <p className="font-medium" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
              Loading predictions…
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
              Fetching the latest betting insights
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const activeMeta = CATEGORY_META[activeCategory as keyof typeof CATEGORY_META];
  const ActiveIcon = activeMeta?.icon ?? CheckCircle;

  return (
    <motion.div variants={cardVariants} initial="initial" animate="animate" className="w-full">
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, var(--surface-3) 0%, var(--surface-2) 100%)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* ── Tab bar ── */}
        <div
          className="flex overflow-x-auto scrollbar-hide"
          style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.2)" }}
        >
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat as keyof typeof CATEGORY_META];
            const Icon = meta?.icon ?? CheckCircle;
            const isActive = cat === activeCategory;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 flex-1 justify-center",
                  isActive ? "border-b-2" : "border-transparent"
                )}
                style={{
                  fontFamily: "var(--font-body)",
                  color: isActive ? meta?.accent ?? "var(--brand-400)" : "var(--text-tertiary)",
                  borderBottomColor: isActive ? (meta?.accent ?? "var(--brand-500)") : "transparent",
                  background: isActive ? `${meta?.accent ?? "var(--brand-500)"}14` : "transparent",
                }}
              >
                <Icon size={15} />
                <span>{meta?.label ?? cat}</span>
              </button>
            );
          })}
        </div>

        {/* ── Category header ── */}
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.1)" }}
        >
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              {activeMeta?.label} Predictions
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
              {activeMeta?.subtitle}
            </p>
          </div>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${activeMeta?.accent ?? "var(--brand-500)"}18` }}
          >
            <ActiveIcon size={18} style={{ color: activeMeta?.accent ?? "var(--brand-400)" }} />
          </div>
        </div>

        {/* ── Content ── */}
        <div className="p-4 md:p-6" ref={elementRef}>
          <AnimatePresence mode="wait">
            {categories.includes(activeCategory) && (
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
        </div>
      </div>
    </motion.div>
  );
};

export default TabbedPredictionsCard;
