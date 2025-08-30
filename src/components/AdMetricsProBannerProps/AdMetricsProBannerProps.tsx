import React from "react";

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

  return (
    <div
      id={adId}
      style={{
        width: '100%',
        minWidth: `${minWidth}px`,
        minHeight: `${minHeight}px`,
      }}
      className={`flex justify-center items-center rounded-lg my-4 bg-muted/20 ${className}`}
    >
    </div>
  );
};

export default AdMetricsProBanner;
