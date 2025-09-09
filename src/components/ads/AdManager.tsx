import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import AdMetricsProBanner from "../AdMetricsProBannerProps/AdMetricsProBannerProps";

// Context to register ad slots
export interface AdManagerContextType {
  slots: Record<string, Element>;
  registerSlot: (name: string, element: Element) => void;
  unregisterSlot: (name: string) => void;
  refreshAllSlots: () => void;
  refreshAllAds: () => void;
}

export const AdManagerContext = createContext<AdManagerContextType | null>(
  null
);

export function AdManagerProvider({ children }) {
  const slots = useRef({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [_, forceUpdate] = useState(0);

  // Register a slot by name
  const registerSlot = (name, element) => {
    slots.current[name] = element;
    forceUpdate((n) => n + 1); // trigger rerender for portals
  };
  // Unregister a slot
  const unregisterSlot = (name) => {
    delete slots.current[name];
    forceUpdate((n) => n + 1);
  };

  // Refresh all ad slots (force rerender of all AdContent)
  const refreshAllSlots = () => {
    setRefreshKey((k) => k + 1);
  };

  // Call the global amp_refreshAllSlots if available
  const refreshAllAds = () => {
    if (
      typeof window !== "undefined" &&
      typeof window.amp_refreshAllSlots === "function"
    ) {
      window.amp_refreshAllSlots();
    }
  };

  return (
    <AdManagerContext.Provider
      value={{
        slots: slots.current,
        registerSlot,
        unregisterSlot,
        refreshAllSlots,
        refreshAllAds,
      }}
    >
      {children}
      {/* Render persistent ads into their slots using portals */}
      {Object.entries(slots.current).map(([name, el]) =>
        el
          ? createPortal(
              <AdContent name={name} key={name + refreshKey} />,
              el as Element
            )
          : null
      )}
    </AdManagerContext.Provider>
  );
}

// Placeholder to be used in the page where the ad should appear
export function AdSlot({ name, className = "" }) {
  const ref = useRef(null);
  const { registerSlot, unregisterSlot } = useContext(AdManagerContext);

  useEffect(() => {
    if (ref.current) registerSlot(name, ref.current);
    return () => unregisterSlot(name);
    // eslint-disable-next-line
  }, [name]);

  return <div ref={ref} className={className} />;
}

// The actual ad content (persistent only rendered once per slot name)
function AdContent({ name }) {
  const adMap = {
    "banner-top": "div-gpt-ad-1715358540790-0",
    "content-one": "div-gpt-ad-1715358598569-0",
    "content-two": "div-gpt-ad-1715358620345-0",
    "sidebar-left": "div-gpt-ad-1752247623844-0",
    "sidebar-left2": "div-gpt-ad-1752247724892-0",
    "content-three": "div-gpt-ad-1753889678213-0",
    "content-four": "div-gpt-ad-1753889948554-0",
    "content-five": "div-gpt-ad-1753890381531-0",
  };
  const adId = adMap[name];

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (
        typeof window !== "undefined" &&
        typeof window.amp_refreshAllSlots === "function"
      ) {
        // Only refresh if the ad slot is visible
        if (document.getElementById(adId)) {
          window.amp_refreshAllSlots();
        }
      }
    }, 500); // delay by 500ms
    return () => clearTimeout(timeout);
  }, [adId]);

  if (adId) {
    const minHeight = name.startsWith("sidebar") ? 250 : 100;
    return (
      <AdMetricsProBanner
        className="z-50"
        adId={adId}
        minWidth={300}
        minHeight={minHeight}
      />
    );
  }
  return null;
}
