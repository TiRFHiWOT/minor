import { useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import { AdManagerContext, AdManagerContextType } from "../ads/AdManager";

declare global {
  interface Window {
    amp_refreshAllSlots?: () => void;
  }
}

export default function RouteChangeHandler() {
  const location = useLocation();
  const adManager = useContext(AdManagerContext) as AdManagerContextType | null;

  useEffect(() => {
    if (!document.getElementById("c764d7beef4b4321984c2aaa46dd9689")) {
      const script = document.createElement("script");
      script.id = "c764d7beef4b4321984c2aaa46dd9689";
      script.innerHTML = `console.log("Connatix in-content script loaded.");`;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const safeRefreshAds = () => {
      if (adManager && typeof adManager.refreshAllAds === "function") {
        try {
          adManager.refreshAllAds();
          console.log("Ads refreshed on route change:", location.pathname);
        } catch (err) {
          console.error("refreshAllAds threw an error:", err);
        }
      } else {
        console.log("refreshAllAds not ready yet");
      }
    };
    const timeout = setTimeout(safeRefreshAds, 500);
    return () => clearTimeout(timeout);
  }, [location.pathname, adManager]);

  return null;
}
