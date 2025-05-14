import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-[#2A2A3C]/40';
  const animationClasses = animation === 'pulse' 
    ? 'animate-pulse' 
    : animation === 'wave' 
      ? 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-[#3A3A4C]/30 before:to-transparent' 
      : '';
  
  const variantClasses = 
    variant === 'text' ? 'h-4 w-full rounded' :
    variant === 'circular' ? 'rounded-full' :
    variant === 'rectangular' ? '' :
    variant === 'rounded' ? 'rounded-lg' : '';
  
  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;
  
  return (
    <div 
      className={`${baseClasses} ${animationClasses} ${variantClasses} ${className}`}
      style={style}
      aria-hidden="true"
      role="presentation"
    />
  );
};

export default Skeleton;
