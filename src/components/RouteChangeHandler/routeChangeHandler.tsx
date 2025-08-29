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
    if (!document.getElementById("c764d7beef4b4321984c2aaa46dd9689")) {
      try {
        const script = document.createElement("script");
        script.id = "c764d7beef4b4321984c2aaa46dd9689";
        script.innerHTML = `console.log("Connatix in-content script loaded.");`;
        document.body.appendChild(script);
      } catch (error) {
        console.warn("[RouteChangeHandler] Connatix script error:", error);
      }
    }
  }, []);

  useEffect(() => {
    const safeRefreshAds = () => {
      if (typeof window.amp_refreshAllSlots === "function") {
        try {
          window.amp_refreshAllSlots();
          console.log("Ads refreshed on route change:", location.pathname);
        } catch (err) {
          console.error("amp_refreshAllSlots threw an error:", err);
        }
      } else {
        console.log("amp_refreshAllSlots not ready yet");
      }
    };
    const timeout = setTimeout(safeRefreshAds, 500);
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return null;
}
