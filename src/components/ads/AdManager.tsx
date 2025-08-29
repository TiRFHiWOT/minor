import React, { createContext, useContext, useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import AdMetricsProBanner from '../AdMetricsProBannerProps/AdMetricsProBannerProps';

// Context to register ad slots
const AdManagerContext = createContext(null);

export function AdManagerProvider({ children }) {
  const slots = useRef({});
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

  return (
    <AdManagerContext.Provider value={{ slots: slots.current, registerSlot, unregisterSlot }}>
      {children}
      {/* Render persistent ads into their slots using portals */}
      {Object.entries(slots.current).map(([name, el]) =>
        el ? createPortal(<AdContent name={name} />, el as Element) : null
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

// The actual ad content (persistent, only rendered once per slot name)
function AdContent({ name }) {
  const adMap = {
    'banner-top': 'div-gpt-ad-1715358540790-0',
    'content-one': 'div-gpt-ad-1715358598569-0',
    'content-two': 'div-gpt-ad-1715358620345-0',
    'sidebar-left': 'div-gpt-ad-1752247623844-0',
    'sidebar-left2': 'div-gpt-ad-1752247724892-0',
    'content-three': 'div-gpt-ad-1753889678213-0',
    'content-four': 'div-gpt-ad-1753889948554-0',
    'content-five': 'div-gpt-ad-1753890381531-0',
  };
  const adId = adMap[name];
  if (adId) {
    // Use minHeight 250 for sidebar, 50 for others
    const minHeight = name.startsWith('sidebar') ? 250 : 20;
    return <AdMetricsProBanner adId={adId} minWidth={300} minHeight={minHeight} />;
  }
  return null;
}
