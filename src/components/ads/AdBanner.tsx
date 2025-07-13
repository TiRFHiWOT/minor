import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AdBannerProps {
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ className = '' }) => {
  const isMobile = useIsMobile();

  // Hide on mobile devices
  if (isMobile) {
    return null;
  }

  return (
    <div className={`w-full my-6 ${className}`}>
      <div className="flex justify-center">
        <div className="bg-muted/30 border border-border/50 rounded-lg p-4 min-h-[100px] flex items-center justify-center max-w-[728px] w-full">
          {/* Placeholder for Google AdSense code */}
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-2">Advertisement</div>
            <div className="text-sm text-muted-foreground">
              728 x 90 Banner Ad Space
            </div>
            <div className="text-xs text-muted-foreground/70 mt-1">
              Replace this div with your Google AdSense code
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};