import React from "react";
import { Badge } from "../common/Badge";

interface QualityFilterProps {
  selectedQuality: string | null;
  onSelectQuality: (quality: string | null) => void;
  className?: string;
}

/**
 * QualityFilter Component
 * 
 * Allows users to filter predictions by quality rating
 */
const QualityFilter: React.FC<QualityFilterProps> = ({
  selectedQuality,
  onSelectQuality,
  className = ""
}) => {
  const qualityOptions = [
    { value: "A+", label: "A+", color: "bg-green-500/20 text-green-500" },
    { value: "A", label: "A", color: "bg-green-400/20 text-green-400" },
    { value: "B+", label: "B+", color: "bg-blue-500/20 text-blue-500" },
    { value: "B", label: "B", color: "bg-blue-400/20 text-blue-400" },
    { value: "C+", label: "C+", color: "bg-yellow-500/20 text-yellow-500" },
    { value: "C", label: "C", color: "bg-yellow-400/20 text-yellow-400" },
    { value: null, label: "All", color: "bg-gray-500/20 text-gray-400" }
  ];

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <span className="text-xs font-medium text-white/70 self-center mr-1">Quality:</span>
      {qualityOptions.map((option) => (
        <Badge
          key={option.value || "all"}
          className={`${option.color} cursor-pointer ${selectedQuality === option.value ? 'ring-2 ring-white/30' : ''}`}
          onClick={() => onSelectQuality(option.value)}
        >
          {option.label}
        </Badge>
      ))}
    </div>
  );
};

export default QualityFilter;
