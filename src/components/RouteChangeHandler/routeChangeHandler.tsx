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
          setTimeout(tryRefresh, 2000);
        } else {
          console.warn("[RouteChangeHandler] amp_refreshAllSlots not available after max attempts");
        }
      }
    }
    tryRefresh();
    return () => {};
  }, [location.pathname]);

  return null;
}