import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { DynamicAdSpace } from './DynamicAdSpace';

interface SidebarAdBannerProps {
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export const SidebarAdBanner: React.FC<SidebarAdBannerProps> = ({ className = '' }) => {
  const isMobile = useIsMobile();

  // Hide on mobile devices
  if (isMobile) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      <DynamicAdSpace location="sidebar" />
    </div>
  );
};