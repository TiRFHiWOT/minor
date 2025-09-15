import React, { useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

declare global {
  interface Window {
    googletag: any;
  }
}

interface BannerAdProps {
  id: string;
  mobileUnitPath: string;
  desktopUnitPath: string;
  className?: string;
}

export const BannerAd: React.FC<BannerAdProps> = ({
  id,
  mobileUnitPath,
  desktopUnitPath,
  className,
}) => {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (typeof window !== "undefined" && window.googletag) {
      window.googletag.cmd.push(() => {
        // Check if slot already exists
        const slots = window.googletag.pubads().getSlots();
        const existingSlot = slots.find(
          (slot) => slot.getSlotElementId() === id
        );

        if (!existingSlot) {
          const adSlot = window.googletag.defineSlot(
            isMobile ? mobileUnitPath : desktopUnitPath,
            isMobile ? [320, 50] : [728, 90],
            id
          );

          if (adSlot) {
            adSlot.addService(window.googletag.pubads());
          }
        }

        window.googletag.display(id);
      });
    }
  }, [id, isMobile, mobileUnitPath, desktopUnitPath]);

  return (
    <div
      className={`bg-card border border-border rounded-lg p-2 my-4 w-full ${
        className || ""
      }`}
    >
      <p className="text-xs text-muted-foreground mb-2 text-center">
        Advertisement
      </p>
      <div id={id} className="w-full flex items-center justify-center"></div>
    </div>
  );
};
