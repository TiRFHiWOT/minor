import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    amp_refreshAllSlots?: () => void;
  }
}

export default function RouteChangeHandler() {
  const location = useLocation();

  // Inject the AdMetricsPro loader script if not already loaded
  useEffect(() => {
    if (!document.getElementById("admetrics-loader")) {
      const script = document.createElement("script");
      script.src = "https://qd.admetricspro.com/js/minorhockeytalks/new-layout-loader.js";
      script.id = "admetrics-loader";
      script.async = true;

      script.onload = () => {
        console.log("[AdMetrics] Loader script loaded.");
      };

      script.onerror = () => {
        console.error("[AdMetrics] Failed to load loader script.");
      };

      document.head.appendChild(script);
    }
  }, []);

  // Refresh ads when route changes
  useEffect(() => {
    const refreshAds = () => {
      if (typeof window.amp_refreshAllSlots === "function") {
        try {
          window.amp_refreshAllSlots();
          console.log("[AdMetrics] Ads refreshed on route change:", location.pathname);
          return true;
        } catch (err) {
          console.error("[AdMetrics] Error refreshing ads:", err);
        }
      }
      return false;
    };

    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(() => {
      attempts++;
      if (refreshAds() || attempts >= maxAttempts) {
        clearInterval(interval);
      } else {
        console.log(`[AdMetrics] Waiting for amp_refreshAllSlots... (Attempt ${attempts})`);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [location.pathname]);

  return null;
}
