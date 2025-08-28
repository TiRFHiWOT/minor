import React, { useEffect, useRef, useState } from 'react';

interface ResponsiveAdBannerProps {
  format: 'square' | 'horizontal' | 'vertical';
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: any[];
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

  const getDimensions = () => {
    switch (format) {
      case 'square':
        return { width: 300, height: 250 };
      case 'vertical':
        return { width: 160, height: 600 };
      case 'horizontal':
      default:
        return { width: 728, height: 90 };
    }
  };

  const { width, height } = getDimensions();

  return (
    <div ref={containerRef} className={`w-full flex flex-col items-center py-4 ${className}`}>
      <div className="text-xs text-muted-foreground mb-2 text-center">Advertisement</div>
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          minWidth: `${width}px`,
          minHeight: `${height}px`
        }}
        className="flex justify-center items-center bg-muted/20 border border-border rounded-lg"
      >
        {canRender && (
          <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', height: '100%' }}
            data-ad-client={clientId}
            data-ad-slot={slot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        )}
      </div>
    </div>
  );
};