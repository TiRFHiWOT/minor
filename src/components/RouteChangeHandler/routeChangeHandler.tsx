import { useEffect } from "react";
import { useLocation } from "react-router-dom";

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

export default function RouteChangeHandler() {
  const location = useLocation();

  // Inject AdMetricsPro script on mount if not present
  useEffect(() => {
    injectAdMetricsProScript();
  }, []);

  // Always try to refresh ads on initial mount and route changes
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
        }
      } else {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(tryRefresh, 500);
        } else {
          console.warn("[RouteChangeHandler] amp_refreshAllSlots not available after max attempts");
        }
      }
    }
    tryRefresh();
    return () => {};
  }, [location.pathname]);

  // (Optional) Inject Connatix script if needed
  useEffect(() => {
    if (!document.getElementById("c764d7beef4b4321984c2aaa46dd9689")) {
      const script = document.createElement("script");
      script.id = "c764d7beef4b4321984c2aaa46dd9689";
      script.innerHTML = `console.log("Connatix in-content script loaded.");`;
      document.body.appendChild(script);
    }
  }, []);

  return null;
}