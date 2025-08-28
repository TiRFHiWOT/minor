import React from "react";

interface AdMetricsProBannerProps {
  adId: string;
  minWidth?: number;
  minHeight?: number;
  className?: string;
}

export const AdMetricsProBanner: React.FC<AdMetricsProBannerProps> = ({
  adId,
  minWidth = 300,
  minHeight = 50,
  className = "",
}) => {
  return (
    <div
      id={adId}
      style={{ minWidth, minHeight }}
      className={`flex justify-center items-center rounded-lg my-4 border border-gray-200 ${className}`}
    />
  );
};

export default AdMetricsProBanner;
