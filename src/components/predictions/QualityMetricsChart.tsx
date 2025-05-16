import React from "react";
import { safeGet } from "../../utils/nullChecks";
import type { Prediction } from "../../types";

interface QualityMetricsChartProps {
  prediction: Prediction;
  className?: string;
}

/**
 * QualityMetricsChart Component
 * 
 * Displays a radar-like chart visualization of prediction quality metrics
 */
const QualityMetricsChart: React.FC<QualityMetricsChartProps> = ({
  prediction,
  className = ""
}) => {
  // Extract quality metrics with null checks
  const matchResultCertainty = safeGet(prediction, 'match_result_certainty', 0) as number;
  const overUnderCertainty = safeGet(prediction, 'over_under_certainty', 0) as number;
  const bttsCertainty = safeGet(prediction, 'btts_certainty', 0) as number;
  
  // Extract confidence values with null checks
  const matchResultConfidence = safeGet(prediction, 'match_result_confidence', 0) as number;
  const overUnderConfidence = safeGet(prediction, 'over_under_confidence', 0) as number;
  const bttsConfidence = safeGet(prediction, 'btts_confidence', 0) as number;
  
  // If no metrics are available, return null
  if (
    matchResultCertainty <= 0 && 
    overUnderCertainty <= 0 && 
    bttsCertainty <= 0 &&
    matchResultConfidence <= 0 &&
    overUnderConfidence <= 0 &&
    bttsConfidence <= 0
  ) {
    return null;
  }
  
  // Calculate metrics for visualization
  const metrics = [
    { name: "Match Result", value: matchResultCertainty || matchResultConfidence || 0 },
    { name: "Over/Under", value: overUnderCertainty || overUnderConfidence || 0 },
    { name: "BTTS", value: bttsCertainty || bttsConfidence || 0 }
  ];
  
  // Filter out metrics with zero value
  const validMetrics = metrics.filter(m => m.value > 0);
  
  // If no valid metrics, return null
  if (validMetrics.length === 0) {
    return null;
  }
  
  // Calculate chart dimensions
  const size = 120;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.4;
  
  // Generate points for the chart
  const points = validMetrics.map((metric, i) => {
    const angle = (i / validMetrics.length) * Math.PI * 2 - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle) * metric.value;
    const y = centerY + radius * Math.sin(angle) * metric.value;
    return { x, y, name: metric.name, value: metric.value };
  });
  
  // Generate polygon points string
  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');
  
  return (
    <div className={`${className}`}>
      <h4 className="text-xs font-medium text-white/70 mb-2">Quality Metrics</h4>
      <div className="relative w-full flex justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          {/* Background circles */}
          <circle cx={centerX} cy={centerY} r={radius * 0.25} fill="none" stroke="#2A2A3C" strokeWidth="1" />
          <circle cx={centerX} cy={centerY} r={radius * 0.5} fill="none" stroke="#2A2A3C" strokeWidth="1" />
          <circle cx={centerX} cy={centerY} r={radius * 0.75} fill="none" stroke="#2A2A3C" strokeWidth="1" />
          <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="#2A2A3C" strokeWidth="1" />
          
          {/* Axes */}
          {validMetrics.map((metric, i) => {
            const angle = (i / validMetrics.length) * Math.PI * 2 - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            return (
              <line 
                key={`axis-${i}`}
                x1={centerX} 
                y1={centerY} 
                x2={x} 
                y2={y} 
                stroke="#2A2A3C" 
                strokeWidth="1" 
              />
            );
          })}
          
          {/* Data polygon */}
          <polygon 
            points={polygonPoints} 
            fill="rgba(86, 204, 242, 0.2)" 
            stroke="#56CCF2" 
            strokeWidth="2" 
          />
          
          {/* Data points */}
          {points.map((point, i) => (
            <circle 
              key={`point-${i}`}
              cx={point.x} 
              cy={point.y} 
              r="3" 
              fill="#56CCF2" 
            />
          ))}
        </svg>
      </div>
      
      {/* Legend */}
      <div className="mt-2 grid grid-cols-1 gap-1">
        {validMetrics.map((metric, i) => (
          <div key={`legend-${i}`} className="flex justify-between items-center text-xs">
            <span className="text-white/70">{metric.name}:</span>
            <span className="font-medium">{Math.round(metric.value * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QualityMetricsChart;
