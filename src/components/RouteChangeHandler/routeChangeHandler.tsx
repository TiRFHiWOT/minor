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
     // Inject video script once
    if (!document.getElementById("c764d7beef4b4321984c2aaa46dd9689")) {
      const script = document.createElement("script");
      script.id = "c764d7beef4b4321984c2aaa46dd9689";
      script.innerHTML = `console.log("Connatix in-content script loaded.");`;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
     // Refresh all ads on route change
    const refreshAds = () => {
      if (typeof window.amp_refreshAllSlots === "function") {
        window.amp_refreshAllSlots();
        console.log("Ads refreshed on route change:", location.pathname);
      } else {
        console.log("amp_refreshAllSlots not ready yet");
      }
    };

    refreshAds();
  }, [location.pathname]);

  return null;
}
