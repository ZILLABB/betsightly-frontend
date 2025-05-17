import React from 'react';
import { cn } from '../../lib/utils';

interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

export const Row: React.FC<RowProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-wrap -mx-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface ColProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

export const Col: React.FC<ColProps> = ({
  className,
  children,
  xs,
  sm,
  md,
  lg,
  xl,
  ...props
}) => {
  const colClasses = [];
  
  // Default is full width on mobile
  if (!xs && !sm && !md && !lg && !xl) {
    colClasses.push('w-full');
  }
  
  // Add responsive classes
  if (xs) colClasses.push(`w-${xs}/12`);
  if (sm) colClasses.push(`sm:w-${sm}/12`);
  if (md) colClasses.push(`md:w-${md}/12`);
  if (lg) colClasses.push(`lg:w-${lg}/12`);
  if (xl) colClasses.push(`xl:w-${xl}/12`);
  
  return (
    <div
      className={cn(
        'px-4',
        colClasses.join(' '),
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default { Row, Col };
