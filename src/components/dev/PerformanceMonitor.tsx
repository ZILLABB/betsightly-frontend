import React, { useState, useEffect } from 'react';
import { getPerformanceMetrics } from '../../utils/performanceMonitoring';

/**
 * Performance Monitor component for displaying performance metrics in development
 */
const PerformanceMonitor: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [metrics, setMetrics] = useState(getPerformanceMetrics());
  
  // Update metrics every second
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getPerformanceMetrics());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Styles for the performance monitor
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '10px',
    right: '10px',
    zIndex: 9999,
    fontFamily: 'monospace',
    fontSize: '12px',
  };
  
  const buttonStyle: React.CSSProperties = {
    background: '#333',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '5px 10px',
    cursor: 'pointer',
  };
  
  const panelStyle: React.CSSProperties = {
    background: 'rgba(0, 0, 0, 0.8)',
    color: '#fff',
    borderRadius: '4px',
    padding: '10px',
    marginTop: '5px',
    maxHeight: '300px',
    overflowY: 'auto',
    width: '300px',
  };
  
  const sectionStyle: React.CSSProperties = {
    marginBottom: '10px',
  };
  
  const titleStyle: React.CSSProperties = {
    fontWeight: 'bold',
    marginBottom: '5px',
    color: '#0f0',
  };
  
  // Calculate average times for metrics
  const calculateAverage = (times: number[]): string => {
    if (times.length === 0) return 'N/A';
    const sum = times.reduce((a, b) => a + b, 0);
    return (sum / times.length).toFixed(2) + 'ms';
  };
  
  // Render metrics sections
  const renderMetricsSection = (
    title: string, 
    data: Record<string, number[]>
  ) => {
    const entries = Object.entries(data);
    
    if (entries.length === 0) {
      return (
        <div style={sectionStyle}>
          <div style={titleStyle}>{title}</div>
          <div>No data available</div>
        </div>
      );
    }
    
    return (
      <div style={sectionStyle}>
        <div style={titleStyle}>{title}</div>
        {entries.map(([key, times]) => (
          <div key={key}>
            {key}: {calculateAverage(times)} (count: {times.length})
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div style={containerStyle}>
      <button 
        style={buttonStyle} 
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'Hide' : 'Show'} Performance
      </button>
      
      {isOpen && (
        <div style={panelStyle}>
          <div style={{ ...titleStyle, color: '#fff' }}>
            Performance Monitor (Dev Only)
          </div>
          
          {renderMetricsSection('Page Loads', metrics.pageLoads)}
          {renderMetricsSection('API Calls', metrics.apiCalls)}
          {renderMetricsSection('Render Times', metrics.renderTimes)}
          
          <div style={{ marginTop: '10px', fontSize: '10px', color: '#999' }}>
            This panel is only visible in development mode
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
