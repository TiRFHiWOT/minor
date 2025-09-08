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
    // Wait until all ad slots are registered and rendered
    const checkSlotsReady = () => {
      if (
        adManager &&
        adManager.slots &&
        Object.keys(adManager.slots).length > 0
      ) {
        console.log(
          "All adsssss slots registered:",
          Object.keys(adManager.slots)
        );
        if (typeof adManager.refreshAllAds === "function") {
          adManager.refreshAllAds();
          console.log(
            "Adsssss refreshed after slots ready on route:",
            location.pathname
          );
        }
      } else {
        console.log("Adsssss slots not ready yet");
      }
    };
    // Check every 100ms for up to 2s
    let tries = 0;
    const interval = setInterval(() => {
      tries++;
      checkSlotsReady();
      if (
        adManager &&
        adManager.slots &&
        Object.keys(adManager.slots).length > 0
      ) {
        clearInterval(interval);
      }
      if (tries > 20) {
        clearInterval(interval);
        console.log("Timeout waiting for ad slots to be ready");
      }
    }, 100);
    return () => clearInterval(interval);
  }, [location.pathname, adManager]);

  return null;
}
