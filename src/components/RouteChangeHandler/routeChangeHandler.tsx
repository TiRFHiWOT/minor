import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    amp_refreshAllSlots?: () => void;
  }
}


export default function RouteChangeHandler() {
  const location = useLocation();

  useEffect(() => {
    if (!document.getElementById("admetricspro-script")) {
      const script = document.createElement("script");
      script.id = "admetricspro-script";
      script.src = "https://qd.admetricspro.com/js/minorhockeytalks/new-layout-loader.js";
      script.async = true;
      document.body.appendChild(script);
      console.log("[RouteChangeHandler] AdMetricsPro script injected");
    }

  }, []);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;
    const tryRefresh = () => {
      if (typeof window.amp_refreshAllSlots === "function") {
        // Check if any ad slots exist before calling refresh
        const adSlots = document.querySelectorAll('[id*="div-gpt-ad"]');
        if (adSlots.length > 0) {
          try {
            window.amp_refreshAllSlots();
            console.log("[RouteChangeHandler] amp_refreshAllSlots called on route change:", location.pathname);
          } catch (error) {
            console.error("[RouteChangeHandler] Error calling amp_refreshAllSlots:", error);
          }
        } else {
          console.log("[RouteChangeHandler] No ad slots found, skipping refresh");
        }
      } else {
        attempts++;
        console.log(`[RouteChangeHandler] amp_refreshAllSlots not ready on route change (attempt ${attempts})`);
        if (attempts < maxAttempts) {
          setTimeout(tryRefresh, 500);
        }
      }
    };
    
    // Delay to ensure DOM is ready after route change
    const timeoutId = setTimeout(tryRefresh, 1000);
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

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
