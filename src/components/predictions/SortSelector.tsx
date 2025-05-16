import React from "react";
import { Button } from "../common/Button";
import { Clock, TrendingUp, Award } from "lucide-react";

interface SortSelectorProps {
  sortBy: "time" | "odds" | "quality";
  onSortChange: (sort: "time" | "odds" | "quality") => void;
  className?: string;
}

/**
 * SortSelector Component
 * 
 * Allows users to sort predictions by different criteria
 */
const SortSelector: React.FC<SortSelectorProps> = ({
  sortBy,
  onSortChange,
  className = ""
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs font-medium text-white/70">Sort by:</span>
      <div className="flex rounded-md overflow-hidden">
        <Button
          size="sm"
          variant={sortBy === "time" ? "default" : "outline"}
          onClick={() => onSortChange("time")}
          className="flex items-center gap-1 px-2 py-1 h-8 rounded-r-none"
        >
          <Clock size={14} />
          <span className="hidden sm:inline">Time</span>
        </Button>
        <Button
          size="sm"
          variant={sortBy === "odds" ? "default" : "outline"}
          onClick={() => onSortChange("odds")}
          className="flex items-center gap-1 px-2 py-1 h-8 rounded-none border-l-0 border-r-0"
        >
          <TrendingUp size={14} />
          <span className="hidden sm:inline">Odds</span>
        </Button>
        <Button
          size="sm"
          variant={sortBy === "quality" ? "default" : "outline"}
          onClick={() => onSortChange("quality")}
          className="flex items-center gap-1 px-2 py-1 h-8 rounded-l-none border-l-0"
        >
          <Award size={14} />
          <span className="hidden sm:inline">Quality</span>
        </Button>
      </div>
    </div>
  );
};

export default SortSelector;
