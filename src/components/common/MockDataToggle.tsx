import React from 'react';
import { Button } from './Button';
import { Database, Wifi, WifiOff } from 'lucide-react';
import { useMockDataToggle } from '../../hooks/useMockData';

interface MockDataToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const MockDataToggle: React.FC<MockDataToggleProps> = ({
  className = '',
  showLabel = true,
  variant = 'outline',
  size = 'sm'
}) => {
  const { isUsingMockData, toggleMockData } = useMockDataToggle();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-xs text-[var(--muted-foreground)] font-medium">
          Data Source:
        </span>
      )}
      
      <Button
        variant={variant}
        size={size}
        onClick={toggleMockData}
        className={`
          flex items-center gap-2 transition-all duration-200
          ${isUsingMockData 
            ? 'border-primary-500/30 text-primary-400 hover:bg-primary-500/10' 
            : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
          }
        `}
        title={isUsingMockData ? 'Switch to Live Data' : 'Switch to Mock Data'}
      >
        {isUsingMockData ? (
          <>
            <Database size={14} />
            {showLabel && <span className="text-xs">Mock</span>}
          </>
        ) : (
          <>
            <Wifi size={14} />
            {showLabel && <span className="text-xs">Live</span>}
          </>
        )}
      </Button>

      {/* Status indicator */}
      <div className={`
        w-2 h-2 rounded-full transition-colors duration-200
        ${isUsingMockData ? 'bg-primary-500' : 'bg-green-500'}
      `} />
    </div>
  );
};

export default MockDataToggle;
