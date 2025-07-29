import React, { useEffect } from 'react';

interface LeaderboardTopAdProps {
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export const LeaderboardTopAd: React.FC<LeaderboardTopAdProps> = ({ className = '' }) => {
  useEffect(() => {
    try {
      // Initialize AdSense ad
      if (window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('Error loading ad:', error);
    }
  }, []);

  return (
    <div className={`w-full bg-background border-b border-border ${className}`}>
      <div className="flex justify-center px-2 py-2">
        <div className="w-full max-w-7xl">
          <div className="text-center text-xs text-muted-foreground mb-1">Advertisement</div>
          {/* /22404337467,423899568/minorhockeytalks-Leaderboard-Top */}
          <div 
            id='div-gpt-ad-1715358540790-0' 
            style={{ minWidth: '300px', minHeight: '50px' }}
            className="flex justify-center"
          />
        </div>
      </div>
    </div>
  );
};