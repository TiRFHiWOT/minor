import React from 'react';

interface AdBannerProps {
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ className = '' }) => {
  return (
    <div className={`w-full my-6 ${className}`}>
      <div className="flex justify-center px-4">
        <div className="w-full min-w-[320px] max-w-[728px]">
          <div className="text-center text-xs text-muted-foreground mb-2">Advertisement</div>
          {/* /22404337467,423899568/minorhockeytalks-Leaderboard-Top */}
          <div id="div-gpt-ad-1715358540790-0" style={{ minWidth: '300px', minHeight: '50px' }}>
          </div>

        </div>
      </div>
    </div>
  );
};