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
    try {
      if (!document.getElementById("admetricspro-script")) {
        const script = document.createElement("script");
        script.id = "admetricspro-script";
        script.src = "https://qd.admetricspro.com/js/minorhockeytalks/new-layout-loader.js";
        script.async = true;
        
        // Add error handling for script loading
        script.onerror = (error) => {
          console.warn("[RouteChangeHandler] AdMetricsPro script failed to load:", error);
        };
        
        script.onload = () => {
          console.log("[RouteChangeHandler] AdMetricsPro script loaded successfully");
        };
        
        document.body.appendChild(script);
        console.log("[RouteChangeHandler] AdMetricsPro script injected");
      }
    } catch (error) {
      console.warn("[RouteChangeHandler] Error injecting AdMetricsPro script:", error);
    }
  }, []);

  useEffect(() => {
    try {
      let attempts = 0;
      const maxAttempts = 10;
      const tryRefresh = () => {
        try {
          if (typeof window.amp_refreshAllSlots === "function") {
            window.amp_refreshAllSlots();
            console.log("[RouteChangeHandler] amp_refreshAllSlots called on route change:", location.pathname);
          } else {
            attempts++;
            console.log(`[RouteChangeHandler] amp_refreshAllSlots not ready on route change (attempt ${attempts})`);
            if (attempts < maxAttempts) {
              setTimeout(tryRefresh, 500);
            }
          }
        } catch (error) {
          console.warn("[RouteChangeHandler] Error calling amp_refreshAllSlots:", error);
        }
      };
      tryRefresh();
    } catch (error) {
      console.warn("[RouteChangeHandler] Error in route change handler:", error);
    }
    return () => {};
  }, [location.pathname]);

  useEffect(() => {
    try {
      if (!document.getElementById("c764d7beef4b4321984c2aaa46dd9689")) {
        const script = document.createElement("script");
        script.id = "c764d7beef4b4321984c2aaa46dd9689";
        script.innerHTML = `console.log("Connatix in-content script loaded.");`;
        document.body.appendChild(script);
      }
    } catch (error) {
      console.warn("[RouteChangeHandler] Error injecting Connatix script:", error);
    }
  }, []);

  return null;
}
