import React from 'react';
import Skeleton from '../common/Skeleton';
import { Card, CardContent, CardHeader, CardFooter } from '../common/Card';

interface PredictionCardSkeletonProps {
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
  withReason?: boolean;
}

const PredictionCardSkeleton: React.FC<PredictionCardSkeletonProps> = ({
  className = '',
  animation = 'pulse',
  withReason = true
}) => {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="p-3 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <Skeleton 
              variant="text" 
              height={20} 
              width="80%" 
              animation={animation}
              className="mb-1"
            />
            <div className="flex items-center gap-2 mt-1">
              <Skeleton 
                variant="text" 
                height={16} 
                width="40%" 
                animation={animation}
              />
              <Skeleton 
                variant="rounded" 
                height={18} 
                width={60} 
                animation={animation}
              />
            </div>
          </div>
          
          <Skeleton 
            variant="circular" 
            height={24} 
            width={24} 
            animation={animation}
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-3 pt-0">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <Skeleton 
              variant="text" 
              height={14} 
              width="80%" 
              animation={animation}
              className="mb-1"
            />
            <Skeleton 
              variant="text" 
              height={18} 
              width="60%" 
              animation={animation}
            />
          </div>
          <div>
            <Skeleton 
              variant="text" 
              height={14} 
              width="80%" 
              animation={animation}
              className="mb-1"
            />
            <Skeleton 
              variant="text" 
              height={18} 
              width="40%" 
              animation={animation}
            />
          </div>
        </div>
        
        {/* Value Rating */}
        <div className="mb-2">
          <Skeleton 
            variant="text" 
            height={14} 
            width="50%" 
            animation={animation}
            className="mb-1"
          />
          <Skeleton 
            variant="text" 
            height={16} 
            width="70%" 
            animation={animation}
          />
        </div>
        
        {/* Detailed Stats */}
        <div className="mb-2 grid grid-cols-2 gap-2">
          <div>
            <Skeleton 
              variant="text" 
              height={14} 
              width="80%" 
              animation={animation}
              className="mb-1"
            />
            <Skeleton 
              variant="rounded" 
              height={6} 
              width="100%" 
              animation={animation}
              className="mb-1"
            />
            <Skeleton 
              variant="text" 
              height={14} 
              width="30%" 
              animation={animation}
            />
          </div>
          <div>
            <Skeleton 
              variant="text" 
              height={14} 
              width="80%" 
              animation={animation}
              className="mb-1"
            />
            <Skeleton 
              variant="rounded" 
              height={6} 
              width="100%" 
              animation={animation}
              className="mb-1"
            />
            <Skeleton 
              variant="text" 
              height={14} 
              width="40%" 
              animation={animation}
            />
          </div>
        </div>
        
        {withReason && (
          <div className="mb-2 p-1.5 bg-[#1A1A27]/50 rounded-md border border-[#2A2A3C]/20">
            <Skeleton 
              variant="text" 
              height={14} 
              width="40%" 
              animation={animation}
              className="mb-1"
            />
            <Skeleton 
              variant="text" 
              height={14} 
              width="100%" 
              animation={animation}
              className="mb-1"
            />
            <Skeleton 
              variant="text" 
              height={14} 
              width="90%" 
              animation={animation}
            />
          </div>
        )}
        
        <Skeleton 
          variant="text" 
          height={14} 
          width="60%" 
          animation={animation}
          className="mb-1"
        />
        <Skeleton 
          variant="text" 
          height={14} 
          width="70%" 
          animation={animation}
        />
        
        <Skeleton 
          variant="rounded" 
          height={32} 
          width="100%" 
          animation={animation}
          className="mt-2"
        />
      </CardContent>
    </Card>
  );
};

export default PredictionCardSkeleton;
