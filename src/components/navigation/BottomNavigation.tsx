import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  TrendingUp, 
  BarChart3, 
  Trophy,
  Settings,
  Zap
} from 'lucide-react';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import { HapticInteractions } from '../../utils/hapticFeedback';
import { cn } from '../../lib/utils';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path: string;
  badge?: number;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    path: '/'
  },
  {
    id: 'predictions',
    label: 'Predictions',
    icon: TrendingUp,
    path: '/predictions'
  },
  {
    id: 'results',
    label: 'Results',
    icon: Trophy,
    path: '/results'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    path: '/analytics'
  },
  {
    id: 'rollover',
    label: 'Rollover',
    icon: Zap,
    path: '/rollover'
  }
];

interface BottomNavigationProps {
  className?: string;
  showLabels?: boolean;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  className = '',
  showLabels = true
}) => {
  const { isMobile } = useBreakpoints();
  const location = useLocation();
  const navigate = useNavigate();

  // Only show on mobile devices
  if (!isMobile) {
    return null;
  }

  const handleNavigation = (item: NavigationItem) => {
    // Trigger haptic feedback
    HapticInteractions.tabSwitch();
    
    // Navigate to the selected path
    navigate(item.path);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const containerVariants = {
    hidden: { 
      y: 100,
      opacity: 0
    },
    visible: { 
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { 
      y: 20,
      opacity: 0,
      scale: 0.8
    },
    visible: { 
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1
      }
    }
  };

  const activeIndicatorVariants = {
    hidden: { 
      scale: 0,
      opacity: 0
    },
    visible: { 
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-lg border-t border-amber-500/20',
        'safe-area-inset-bottom', // Handle iPhone safe area
        className
      )}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-transparent" />
      
      {/* Navigation items */}
      <div className="relative flex items-center justify-around px-2 py-2 pb-safe">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <motion.button
              key={item.id}
              variants={itemVariants}
              whileTap="tap"
              onClick={() => handleNavigation(item)}
              className={cn(
                'nav-item relative flex flex-col items-center justify-center p-3 rounded-xl',
                'min-w-[64px] min-h-[64px]',
                active
                  ? 'text-amber-400'
                  : 'text-white/60 hover:text-white/80'
              )}
            >
              {/* Active indicator background */}
              <AnimatePresence>
                {active && (
                  <motion.div
                    variants={activeIndicatorVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="absolute inset-0 bg-amber-500/10 rounded-xl border border-amber-500/20"
                  />
                )}
              </AnimatePresence>

              {/* Icon container */}
              <div className="relative flex items-center justify-center mb-1">
                <Icon 
                  size={22} 
                  className={cn(
                    'transition-all duration-200',
                    active ? 'scale-110' : 'scale-100'
                  )}
                />
                
                {/* Badge */}
                {item.badge && item.badge > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </motion.div>
                )}
              </div>

              {/* Label */}
              {showLabels && (
                <span 
                  className={cn(
                    'text-xs font-medium transition-all duration-200',
                    active ? 'text-amber-400' : 'text-white/60'
                  )}
                >
                  {item.label}
                </span>
              )}

              {/* Active indicator dot */}
              <AnimatePresence>
                {active && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                    className="absolute -bottom-1 w-1 h-1 bg-amber-400 rounded-full"
                  />
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default BottomNavigation;
