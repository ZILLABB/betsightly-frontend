import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getTeamInfo, getTeamLogo, generateFallbackLogo, getAlternativeLogos } from '../../utils/teamLogos';
import { cn } from '../../lib/utils';

interface TeamLogoProps {
  teamName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'circle' | 'square' | 'rounded';
  showName?: boolean;
  showShortName?: boolean;
  className?: string;
  animate?: boolean;
}

const TeamLogo: React.FC<TeamLogoProps> = ({
  teamName,
  size = 'md',
  variant = 'circle',
  showName = false,
  showShortName = false,
  className = '',
  animate = true
}) => {
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);
  const [allLogosExhausted, setAllLogosExhausted] = useState(false);
  const teamInfo = getTeamInfo(teamName);
  const alternativeLogos = getAlternativeLogos(teamName);

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
    '2xl': 'w-24 h-24'
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl'
  };

  const variantClasses = {
    circle: 'rounded-full',
    square: 'rounded-none',
    rounded: 'rounded-lg'
  };

  const logoVariants = {
    initial: { 
      scale: 0.8, 
      opacity: 0,
      rotate: -10
    },
    animate: { 
      scale: 1, 
      opacity: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        duration: 0.5
      }
    },
    hover: {
      scale: 1.1,
      rotate: 5,
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

  const containerVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const textVariants = {
    initial: { opacity: 0, x: -10 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  // Reset logo attempts when teamName changes
  useEffect(() => {
    setCurrentLogoIndex(0);
    setAllLogosExhausted(false);
  }, [teamName]);

  const handleImageError = () => {
    if (currentLogoIndex < alternativeLogos.length - 1) {
      setCurrentLogoIndex(currentLogoIndex + 1);
    } else {
      setAllLogosExhausted(true);
    }
  };

  const getCurrentLogoSrc = () => {
    if (allLogosExhausted || alternativeLogos.length === 0) {
      return generateFallbackLogo(teamName);
    }
    return alternativeLogos[currentLogoIndex] || generateFallbackLogo(teamName);
  };

  const logoSrc = getCurrentLogoSrc();
  const displayName = showShortName ? teamInfo?.shortName : teamInfo?.name;

  return (
    <motion.div
      variants={animate ? containerVariants : undefined}
      initial={animate ? "initial" : undefined}
      animate={animate ? "animate" : undefined}
      className={cn(
        'flex items-center gap-2',
        className
      )}
    >
      {/* Team Logo */}
      <motion.div
        variants={animate ? logoVariants : undefined}
        whileHover={animate ? "hover" : undefined}
        whileTap={animate ? "tap" : undefined}
        className={cn(
          'relative overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20',
          'flex items-center justify-center',
          sizeClasses[size],
          variantClasses[variant]
        )}
        style={{
          backgroundColor: teamInfo?.primaryColor ? `${teamInfo.primaryColor}20` : undefined,
          borderColor: teamInfo?.primaryColor ? `${teamInfo.primaryColor}40` : undefined
        }}
      >
        {!allLogosExhausted && logoSrc && !logoSrc.startsWith('data:') ? (
          <img
            key={`${teamName}-${currentLogoIndex}`} // Force re-render on logo change
            src={logoSrc}
            alt={`${teamName} logo`}
            className={cn(
              'w-full h-full object-contain',
              variant === 'circle' ? 'rounded-full' : variantClasses[variant]
            )}
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div
            className={cn(
              'w-full h-full flex items-center justify-center text-white font-bold',
              textSizeClasses[size]
            )}
            style={{ color: teamInfo?.primaryColor || '#F59E0B' }}
          >
            {teamInfo?.shortName || teamName.substring(0, 3).toUpperCase()}
          </div>
        )}

        {/* Shine effect on hover */}
        {animate && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
            whileHover={{
              translateX: '200%',
              transition: {
                duration: 0.6,
                ease: "easeInOut"
              }
            }}
          />
        )}
      </motion.div>

      {/* Team Name */}
      {(showName || showShortName) && displayName && (
        <motion.div
          variants={animate ? textVariants : undefined}
          className="flex flex-col"
        >
          <span 
            className={cn(
              'font-semibold',
              textSizeClasses[size]
            )}
            style={{ color: teamInfo?.primaryColor || '#FFFFFF' }}
          >
            {displayName}
          </span>
          {teamInfo?.league && size !== 'xs' && (
            <span className="text-xs text-white/60">
              {teamInfo.league}
            </span>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

// Specialized components for common use cases
export const TeamLogoWithName: React.FC<Omit<TeamLogoProps, 'showName'>> = (props) => (
  <TeamLogo {...props} showName={true} />
);

export const TeamLogoSmall: React.FC<Omit<TeamLogoProps, 'size'>> = (props) => (
  <TeamLogo {...props} size="sm" />
);

export const TeamLogoLarge: React.FC<Omit<TeamLogoProps, 'size'>> = (props) => (
  <TeamLogo {...props} size="lg" />
);

export default TeamLogo;
