import React from 'react';
import Skeleton from '../common/Skeleton';
import { Card, CardContent, CardHeader } from '../common/Card';

interface GameCodeCardSkeletonProps {
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
  showGameList?: boolean;
  gameCount?: number;
}

const GameCodeCardSkeleton: React.FC<GameCodeCardSkeletonProps> = ({
  className = '',
  animation = 'pulse',
  showGameList = true,
  gameCount = 3
}) => {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="p-3 pb-2 bg-gradient-to-r from-[#1A1A27] to-[#2A2A3C]/50">
        <div className="flex justify-between items-start">
          <div className="w-full">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <Skeleton 
                  variant="rounded" 
                  height={20} 
                  width={60} 
                  animation={animation}
                />
                <Skeleton 
                  variant="rounded" 
                  height={20} 
                  width={80} 
                  animation={animation}
                />
              </div>
              
              <Skeleton 
                variant="circular" 
                height={24} 
                width={24} 
                animation={animation}
              />
            </div>
            
            {/* Game Code Area */}
            <div className="flex items-center justify-between mt-1 bg-[#2A2A3C]/30 p-2 rounded-md border border-[#F5A623]/20">
              <Skeleton 
                variant="text" 
                height={24} 
                width="60%" 
                animation={animation}
                className="mr-2"
              />
              
              <div className="flex items-center space-x-2">
                <Skeleton 
                  variant="circular" 
                  height={28} 
                  width={28} 
                  animation={animation}
                />
                <Skeleton 
                  variant="rounded" 
                  height={28} 
                  width={50} 
                  animation={animation}
                />
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 pt-0">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <Skeleton 
              variant="text" 
              height={16} 
              width="80%" 
              animation={animation}
              className="mb-1"
            />
            <Skeleton 
              variant="text" 
              height={20} 
              width="60%" 
              animation={animation}
            />
          </div>
          <div>
            <Skeleton 
              variant="text" 
              height={16} 
              width="80%" 
              animation={animation}
              className="mb-1"
            />
            <Skeleton 
              variant="text" 
              height={20} 
              width="40%" 
              animation={animation}
            />
          </div>
        </div>
        
        {showGameList && (
          <div className="mt-3 pt-3 border-t border-[#2A2A3C]/20">
            <div className="flex justify-between items-center mb-3">
              <Skeleton 
                variant="text" 
                height={16} 
                width="40%" 
                animation={animation}
              />
              <Skeleton 
                variant="rounded" 
                height={28} 
                width={120} 
                animation={animation}
              />
            </div>
            
            <div className="bg-[#1A1A27]/50 rounded-md border border-[#2A2A3C]/20 overflow-hidden">
              {Array.from({ length: gameCount }).map((_, index) => (
                <div 
                  key={index}
                  className="p-2 border-b border-[#2A2A3C]/10 last:border-0"
                >
                  <div className="flex justify-between items-center mb-1">
                    <Skeleton 
                      variant="text" 
                      height={16} 
                      width="60%" 
                      animation={animation}
                    />
                    <Skeleton 
                      variant="text" 
                      height={16} 
                      width="20%" 
                      animation={animation}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Skeleton 
                      variant="text" 
                      height={14} 
                      width="30%" 
                      animation={animation}
                    />
                    <Skeleton 
                      variant="text" 
                      height={14} 
                      width="25%" 
                      animation={animation}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GameCodeCardSkeleton;
