import React from 'react';
import { cn } from '../../lib/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  fluid?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Container: React.FC<ContainerProps> = ({
  fluid = false,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        fluid ? 'w-full px-4' : 'container mx-auto px-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Container;
