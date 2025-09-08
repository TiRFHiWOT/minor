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
    let tries = 0;
    const interval = setInterval(() => {
      if (
        adManager &&
        adManager.slots &&
        Object.keys(adManager.slots).length > 0
      ) {
        try {
          adManager.refreshAllAds();
          console.log(
            "Ads refreshed after slots ready on route:",
            location.pathname
          );
        } catch (err) {
          console.error("refreshAllAds threw an error:", err);
        }
        clearInterval(interval);
      } else {
        tries++;
        if (tries > 20) {
          clearInterval(interval);
          console.log("Timeout waiting for ad slots to be ready");
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, [location.pathname, adManager]);

  return null;
}
