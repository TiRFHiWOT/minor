import { useEffect } from "react";
import { toast } from "sonner";

declare global {
  interface Window {
    amp_refreshAllSlots?: () => void;
  }
}

function notifyNoAds() {
  if (window && window.document) {
    toast.warning("No ads to be rendered or AdMetricsPro is not available.");
  }
}

export default function RouteChangeHandler() {
  // Video ad slot injection (Connatix or similar)
  useEffect(() => {
    if (!document.getElementById("c764d7beef4b4321984c2aaa46dd9689")) {
      const script = document.createElement("script");
      script.id = "c764d7beef4b4321984c2aaa46dd9689";
      script.innerHTML = `console.log("Connatix in-content script loaded.");`;
      document.body.appendChild(script);
    }
    // After the video ad slot is injected, try to refresh ads
    let attempts = 0;
    const maxAttempts = 10;
    function tryRefresh() {
      if (typeof window.amp_refreshAllSlots === "function") {
        try {
          window.amp_refreshAllSlots();
          console.log("[RouteChangeHandler] amp_refreshAllSlots called for video ad slot");
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
  }, []);

  return null;
}