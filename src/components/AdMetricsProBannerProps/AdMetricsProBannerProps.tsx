import React from "react";

interface AdMetricsProBannerProps {
  adId: string;
  minWidth?: number;
  minHeight?: number;
  className?: string;
}

export const AdMetricsProBanner: React.FC<AdMetricsProBannerProps> = ({
  adId,
  minWidth,
  minHeight,
  className = "",
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (containerRef.current) {
      // Inject AdMetricsPro script for this slot
      // Clear previous content
      containerRef.current.innerHTML = "";
      const script = document.createElement("script");
      script.src =
        "https://qd.admetricspro.com/js/minorhockeytalks/new-layout-loader.js";
      script.async = true;
      containerRef.current.appendChild(script);
    }
  }, [adId]);

  return (
    <div
      id={adId}
      ref={containerRef}
      style={{
        width: "100%",
        height: "auto",
        minWidth: `${minWidth}px`,
        minHeight: `${minHeight}px`,
      }}
      className={`flex justify-center items-center rounded-lg my-4 bg-muted/20 ${className}`}
    ></div>
  );
};

export default AdMetricsProBanner;
