import React from 'react';
import { AlertCircle, RefreshCw, Settings } from 'lucide-react';
import { Button } from './Button';
import { Link } from 'react-router-dom';

interface NoDataStateProps {
  title?: string;
  message?: string;
  showRefresh?: boolean;
  showSettings?: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const NoDataState: React.FC<NoDataStateProps> = ({
  title = 'No Data Available',
  message = 'There are no fixtures available for the selected date.',
  showRefresh = true,
  showSettings = true,
  isLoading = false,
  onRefresh
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-sm">
      <div className="w-16 h-16 mb-4 rounded-full bg-[var(--secondary)] flex items-center justify-center">
        <AlertCircle size={32} className="text-[var(--secondary-foreground)]" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-[var(--muted-foreground)] mb-6 max-w-md">{message}</p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {showRefresh && (
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            {isLoading ? "Refreshing..." : "Refresh Data"}
          </Button>
        )}
        
        {showSettings && (
          <Button
            variant="default"
            asChild
            className="flex items-center gap-2"
          >
            <Link to="/settings">
              <Settings size={16} />
              Configure API Key
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default NoDataState;
