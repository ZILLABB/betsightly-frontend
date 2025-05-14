import React from 'react';
import Skeleton from '../common/Skeleton';
import { Card, CardContent, CardHeader } from '../common/Card';

interface CardSkeletonProps {
  headerHeight?: number;
  contentLines?: number;
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
  withFooter?: boolean;
  withBadge?: boolean;
}

const CardSkeleton: React.FC<CardSkeletonProps> = ({
  headerHeight = 24,
  contentLines = 3,
  className = '',
  animation = 'pulse',
  withFooter = false,
  withBadge = false
}) => {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="p-3 pb-2 bg-gradient-to-r from-[#1A1A27] to-[#2A2A3C]/50">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <Skeleton 
              variant="text" 
              height={headerHeight} 
              width="70%" 
              animation={animation}
            />
            
            {withBadge && (
              <div className="flex mt-2 gap-2">
                <Skeleton 
                  variant="rounded" 
                  height={20} 
                  width={60} 
                  animation={animation}
                  className="mt-1"
                />
                <Skeleton 
                  variant="rounded" 
                  height={20} 
                  width={80} 
                  animation={animation}
                  className="mt-1"
                />
              </div>
            )}
          </div>
          
          <Skeleton 
            variant="circular" 
            height={24} 
            width={24} 
            animation={animation}
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-3 pt-2">
        {Array.from({ length: contentLines }).map((_, index) => (
          <Skeleton 
            key={index}
            variant="text"
            className="mb-2"
            width={index === contentLines - 1 ? '80%' : '100%'}
            animation={animation}
          />
        ))}
        
        {withFooter && (
          <div className="mt-4 pt-2 border-t border-[#2A2A3C]/20">
            <div className="flex justify-between">
              <Skeleton 
                variant="text" 
                width="40%" 
                animation={animation}
              />
              <Skeleton 
                variant="text" 
                width="30%" 
                animation={animation}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CardSkeleton;
