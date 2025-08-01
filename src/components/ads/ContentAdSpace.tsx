import React from 'react';
import { DynamicAdSpace } from './DynamicAdSpace';

interface ContentAdSpaceProps {
  contentId: 1 | 2 | 3 | 4 | 5;
  className?: string;
}

export const ContentAdSpace: React.FC<ContentAdSpaceProps> = ({ contentId, className = '' }) => {
  // Map content IDs to specific ad space locations
  const locationMap = {
    1: 'content_1',
    2: 'content_2', 
    3: 'content_3',
    4: 'content_4',
    5: 'content_5'
  };

  return (
    <div className={`content-ad-space my-6 ${className}`}>
      <DynamicAdSpace location={locationMap[contentId]} />
    </div>
  );
};