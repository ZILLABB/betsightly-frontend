import React from 'react';
import Skeleton from '../common/Skeleton';
import { Card, CardContent, CardHeader } from '../common/Card';

interface StatsOverviewSkeletonProps {
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
}

const StatsOverviewSkeleton: React.FC<StatsOverviewSkeletonProps> = ({
  className = '',
  animation = 'pulse'
}) => {
  return (
    <Card className={`w-full bg-[#1A1A27]/80 border border-[#2A2A3C]/20 shadow-lg overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Skeleton 
              variant="circular" 
              height={18} 
              width={18} 
              animation={animation}
              className="mr-2"
            />
            <Skeleton 
              variant="text" 
              height={24} 
              width={150} 
              animation={animation}
            />
          </div>
          <Skeleton 
            variant="rounded" 
            height={22} 
            width={80} 
            animation={animation}
          />
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-[#1A1A27]/50 p-3 rounded-lg border border-[#2A2A3C]/10">
              <Skeleton 
                variant="text" 
                height={14} 
                width="60%" 
                animation={animation}
                className="mb-1"
              />
              <Skeleton 
                variant="text" 
                height={28} 
                width="40%" 
                animation={animation}
                className="mb-1"
              />
              <Skeleton 
                variant="text" 
                height={14} 
                width="70%" 
                animation={animation}
              />
            </div>
          ))}
        </div>
        
        {/* Recent Performance */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Skeleton 
              variant="circular" 
              height={16} 
              width={16} 
              animation={animation}
              className="mr-1"
            />
            <Skeleton 
              variant="text" 
              height={16} 
              width={120} 
              animation={animation}
            />
          </div>
          
          <div className="bg-[#1A1A27]/50 p-3 rounded-lg border border-[#2A2A3C]/10">
            <div className="flex justify-between items-center mb-2">
              <Skeleton 
                variant="text" 
                height={16} 
                width={100} 
                animation={animation}
              />
              <Skeleton 
                variant="text" 
                height={16} 
                width={80} 
                animation={animation}
              />
            </div>
            
            <Skeleton 
              variant="rounded" 
              height={8} 
              width="100%" 
              animation={animation}
              className="mb-3"
            />
            
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton 
                  key={index}
                  variant="circular" 
                  height={40} 
                  width={40} 
                  animation={animation}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Odds Distribution */}
        <div>
          <div className="flex items-center mb-2">
            <Skeleton 
              variant="circular" 
              height={16} 
              width={16} 
              animation={animation}
              className="mr-1"
            />
            <Skeleton 
              variant="text" 
              height={16} 
              width={120} 
              animation={animation}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-[#1A1A27]/50 p-3 rounded-lg border border-[#2A2A3C]/10">
              <Skeleton 
                variant="text" 
                height={16} 
                width="70%" 
                animation={animation}
                className="mb-2"
              />
              <Skeleton 
                variant="rounded" 
                height={120} 
                width="100%" 
                animation={animation}
              />
            </div>
            <div className="bg-[#1A1A27]/50 p-3 rounded-lg border border-[#2A2A3C]/10">
              <Skeleton 
                variant="text" 
                height={16} 
                width="70%" 
                animation={animation}
                className="mb-2"
              />
              <Skeleton 
                variant="rounded" 
                height={120} 
                width="100%" 
                animation={animation}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsOverviewSkeleton;
