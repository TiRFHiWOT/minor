import React, { useEffect, useRef } from "react";

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

  useEffect(() => {
    // Only refresh ads after the div is mounted and only once
    if (!hasRefreshed.current && typeof window.amp_refreshAllSlots === "function") {
      window.amp_refreshAllSlots();
      hasRefreshed.current = true;
      console.log(`[AdMetricsProBanner] amp_refreshAllSlots called for adId: ${adId}`);
    }
  }, [adId]);

  return (
    <div
      id={adId}
      style={{
        width: '100%',
        minWidth: `${minWidth}px`,
        minHeight: `${minHeight}px`,
        height: `100%`,
      }}
      className={`flex justify-center items-center rounded-lg my-4 bg-muted/20 ${className}`}
    >
    </div>
  );
};

export default AdMetricsProBanner;
