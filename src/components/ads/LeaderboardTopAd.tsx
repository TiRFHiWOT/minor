import React from 'react';
import { DynamicAdSpace } from './DynamicAdSpace';

interface LeaderboardTopAdProps {
  className?: string;
}

export const LeaderboardTopAd: React.FC<LeaderboardTopAdProps> = ({ className = '' }) => {
  return (
    <div className={`w-full bg-background border-b border-border ${className}`}>
      <div className="flex justify-center px-2 py-2">
        <div className="w-full max-w-7xl">
          <DynamicAdSpace location="header" />
        </div>
      </div>
    </div>
  );
};