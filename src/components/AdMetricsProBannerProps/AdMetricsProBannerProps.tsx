import React, { useEffect, useRef, useState } from "react";

interface AdMetricsProBannerProps {
  adId: string;
  minWidth?: number;
  minHeight?: number;
  className?: string;
}

export const AdMetricsProBanner: React.FC<AdMetricsProBannerProps> = ({
  adId,
  minWidth = 250,
  minHeight = 250,
  className = "",
}) => {
  const hasRefreshed = useRef(false);
  const [loading, setLoading] = useState(true);
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only refresh ads after the div is mounted and only once
    if (!hasRefreshed.current && typeof window.amp_refreshAllSlots === "function") {
      window.amp_refreshAllSlots();
      hasRefreshed.current = true;
      console.log(`[AdMetricsProBanner] amp_refreshAllSlots called for adId: ${adId}`);
    }
    // Set up a MutationObserver to detect when the ad is rendered
    const observer = new MutationObserver(() => {
      if (adRef.current && adRef.current.children.length > 0) {
        setLoading(false);
        observer.disconnect();
      }
    });
    if (adRef.current) {
      observer.observe(adRef.current, { childList: true, subtree: true });
    }
    // Fallback: hide loading after 5s
    const timeout = setTimeout(() => setLoading(false), 5000);
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [adId]);

  return (
    <div
      id={adId}
      ref={adRef}
      style={{
        width: '100%',
        minWidth: `${minWidth}px`,
        minHeight: `${minHeight}px`,
        height: `100%`,
        position: 'relative',
      }}
      className={`flex justify-center items-center rounded-lg my-4 bg-muted/20 ${className}`}
    >
      {loading && (
        <div style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2}}>
          <span>Loading ad…</span>
        </div>
      )}
    </div>
  );
};

export default AdMetricsProBanner;
