import React, { useEffect, useRef, useState } from 'react';

interface ResponsiveAdBannerProps {
  format: 'square' | 'horizontal' | 'vertical';
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export const ResponsiveAdBanner: React.FC<ResponsiveAdBannerProps> = ({
  format,
  className = ''
}) => {
  const adSlots = {
    square: '2493498407',
    horizontal: '6641175715',
    vertical: '2701930702'
  };
  const slot = adSlots[format];
  const clientId = 'ca-pub-5447109336224364';

  const containerRef = useRef<HTMLDivElement>(null);
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      if (containerRef.current && containerRef.current.offsetWidth > 0) {
        setCanRender(true);
      }
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  useEffect(() => {
    if (canRender) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error('AdSense error:', error);
      }
    }
  }, [canRender]);

  // Reserve space for each ad format to prevent layout shift
  const minHeights: Record<string, number> = {
    square: 300,      // 300px for square
    horizontal: 90,   // 90px for horizontal (e.g., 728x90)
    vertical: 600     // 600px for vertical (e.g., 160x600)
  };
  const minHeight = minHeights[format] || 90;

  return (
    <div
      ref={containerRef}
      className={`w-full flex flex-col items-center py-4 ${className}`}
      style={{ minHeight }}
    >
      <div className="text-xs text-muted-foreground mb-2 text-center">Advertisement</div>
      {canRender && (
        <ins
          className="adsbygoogle"
          style={{ display: 'block', minHeight }}
          data-ad-client={clientId}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      )}
    </div>
  );
};