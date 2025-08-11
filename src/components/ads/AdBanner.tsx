import React from 'react';

interface AdBannerProps {
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ className = '' }) => {
  return (
    <div className={`w-full my-6 ${className}`}>
      <div className="flex justify-center px-4">
        <div className="w-full min-w-[320px] max-w-[728px]">
<div id='div-gpt-ad-1715358540790-0' style='min-width: 300px; min-height: 50px;'>
</div>
          {/* /22404337467,423899568/minorhockeytalks-Content-One */}
          <div 
            id='div-gpt-ad-1715358598569-0' 
            style={{ minWidth: '300px', minHeight: '50px' }}
          >
          </div>
        </div>
      </div>
    </div>
  );
};