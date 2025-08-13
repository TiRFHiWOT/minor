import React from 'react';

interface ContentBannerProps {
  bannerId: 'one' | 'two' | 'three' | 'four' | 'five';
}

const bannerConfig = {
  one: {
    id: 'div-gpt-ad-1715358598569-0',
    comment: '<!-- /22404337467,423899568/minorhockeytalks-Content-One -->'
  },
  two: {
    id: 'div-gpt-ad-1715358620345-0',
    comment: '<!-- /22404337467,423899568/minorhockeytalks-Content-Two -->'
  },
  three: {
    id: 'div-gpt-ad-1753889678213-0',
    comment: '<!-- /22404337467,423899568/minorhockeytalks-Content-Three -->'
  },
  four: {
    id: 'div-gpt-ad-1753889948554-0',
    comment: '<!-- /22404337467,423899568/minorhockeytalks-Content-Four -->'
  },
  five: {
    id: 'div-gpt-ad-1753890381531-0',
    comment: '<!-- /22404337467,423899568/minorhockeytalks-Content-Five -->'
  }
};

export const ContentBanner: React.FC<ContentBannerProps> = ({ bannerId }) => {
  const config = bannerConfig[bannerId];
  
  return (
    <div className="w-full my-4 flex justify-center">
      <div 
        dangerouslySetInnerHTML={{ 
          __html: `${config.comment}\n<div id='${config.id}' style='min-width: 300px; min-height: 50px;'></div>` 
        }}
        className="max-w-full"
      />
    </div>
  );
};