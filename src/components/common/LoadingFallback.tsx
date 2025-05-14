import React from 'react';

interface LoadingFallbackProps {
  message?: string;
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  message = 'Loading content...' 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full">
      <div className="relative w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-[#F5A623]/20 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-[#F5A623] rounded-full animate-spin"></div>
      </div>
      <p className="mt-4 text-[#A1A1AA] text-sm">{message}</p>
    </div>
  );
};

export default LoadingFallback;
