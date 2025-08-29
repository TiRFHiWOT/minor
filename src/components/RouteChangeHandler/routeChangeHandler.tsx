import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";

declare global {
  interface Window {
    amp_refreshAllSlots?: () => void;
  }
}

function injectAdMetricsProScript() {
  if (!document.getElementById("admetricspro-script")) {
    const script = document.createElement("script");
    script.id = "admetricspro-script";
    script.src = "https://qd.admetricspro.com/js/minorhockeytalks/new-layout-loader.js";
    script.async = true;
    document.head.appendChild(script);
    console.log("[RouteChangeHandler] AdMetricsPro script injected");
  }
}

function notifyNoAds() {
  if (window && window.document) {
    // You can replace this with a toast or UI notification if you have one
    toast.warning("No ads to be rendered or AdMetricsPro is not available.");
  }
}

export default function RouteChangeHandler() {
  const location = useLocation();

  useEffect(() => {
    injectAdMetricsProScript();
  }, []);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;
    function tryRefresh() {
      if (typeof window.amp_refreshAllSlots === "function") {
        try {
          window.amp_refreshAllSlots();
          console.log("[RouteChangeHandler] amp_refreshAllSlots called on route change:", location.pathname);
        } catch (err) {
          console.error("[RouteChangeHandler] amp_refreshAllSlots error:", err);
          notifyNoAds();
        }
      } else {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(tryRefresh, 2000);
        } else {
          console.warn("[RouteChangeHandler] amp_refreshAllSlots not available after max attempts");
          notifyNoAds();
        }
      }
    }
    tryRefresh();
    return () => {};
  }, [location.pathname]);

  return null;
}