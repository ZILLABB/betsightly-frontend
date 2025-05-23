import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '../ui';

export type SortField = 'odds' | 'confidence' | 'time';
export type SortOrder = 'asc' | 'desc';

interface PredictionSorterProps {
  onSort: (field: SortField, order: SortOrder) => void;
  className?: string;
}

const PredictionSorter: React.FC<PredictionSorterProps> = ({
  onSort,
  className = ''
}) => {
  const [activeField, setActiveField] = useState<SortField | null>(null);
  const [activeOrder, setActiveOrder] = useState<SortOrder>('desc');
  
  // Handle sort button click
  const handleSort = (field: SortField) => {
    // If clicking the same field, toggle the order
    if (field === activeField) {
      const newOrder = activeOrder === 'asc' ? 'desc' : 'asc';
      setActiveOrder(newOrder);
      onSort(field, newOrder);
    } else {
      // If clicking a different field, set it as active with default desc order
      setActiveField(field);
      setActiveOrder('desc');
      onSort(field, 'desc');
    }
  };
  
  // Get the appropriate icon for a sort button
  const getSortIcon = (field: SortField) => {
    if (field !== activeField) {
      return <ArrowUpDown size={14} />;
    }
    
    return activeOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-white/70 mr-1">Sort by:</span>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleSort('odds')}
        className={`border-amber-500/20 ${
          activeField === 'odds'
            ? 'bg-amber-500/10 text-amber-400'
            : 'text-white/70 hover:text-amber-400 hover:border-amber-500/30'
        }`}
      >
        {getSortIcon('odds')}
        <span className="ml-1.5">Odds</span>
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleSort('confidence')}
        className={`border-amber-500/20 ${
          activeField === 'confidence'
            ? 'bg-amber-500/10 text-amber-400'
            : 'text-white/70 hover:text-amber-400 hover:border-amber-500/30'
        }`}
      >
        {getSortIcon('confidence')}
        <span className="ml-1.5">Confidence</span>
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleSort('time')}
        className={`border-amber-500/20 ${
          activeField === 'time'
            ? 'bg-amber-500/10 text-amber-400'
            : 'text-white/70 hover:text-amber-400 hover:border-amber-500/30'
        }`}
      >
        {getSortIcon('time')}
        <span className="ml-1.5">Time</span>
      </Button>
    </div>
  );
};

export default PredictionSorter;
