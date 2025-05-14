/**
 * Page Loading Fallback Component
 * 
 * This component is displayed while a page is being loaded asynchronously.
 * It provides a smooth loading experience with a skeleton UI.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

const PageLoadingFallback: React.FC = () => {
  return (
    <div className="w-full h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
      <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
      <h2 className="text-xl font-semibold mb-2">Loading...</h2>
      <p className="text-muted-foreground text-sm">Please wait while we prepare your content</p>
      
      {/* Skeleton UI for better user experience */}
      <div className="w-full max-w-4xl mt-8 px-4">
        <div className="h-8 bg-muted/50 rounded-md w-1/3 mb-6 animate-pulse"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted/50 rounded-lg animate-pulse"></div>
          ))}
        </div>
        
        <div className="h-10 bg-muted/50 rounded-md w-full mb-4 animate-pulse"></div>
        <div className="h-10 bg-muted/50 rounded-md w-full mb-4 animate-pulse"></div>
        <div className="h-10 bg-muted/50 rounded-md w-3/4 animate-pulse"></div>
      </div>
    </div>
  );
};

export default PageLoadingFallback;
