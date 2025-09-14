import React, { useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

declare global {
  interface Window {
    googletag: any;
  }
}

interface InContentAdProps {
  id: string;
  unitPath: string;
  className?: string;
}

export const InContentAd: React.FC<InContentAdProps> = ({
  id,
  unitPath,
  className,
}) => {
  const isMobile = useIsMobile();

  useEffect(() => {
    // Initialize the ad slot when component mounts
    if (typeof window !== "undefined" && window.googletag) {
      window.googletag.cmd.push(() => {
        // Define ad slot if it doesn't exist
        let adSlot;
        const slots = window.googletag.pubads().getSlots();
        const existingSlot = slots.find(
          (slot) => slot.getSlotElementId() === id
        );

        if (!existingSlot) {
          adSlot = window.googletag.defineSlot(
            unitPath,
            isMobile
              ? [
                  [320, 100],
                  [300, 250],
                ]
              : [
                  [300, 250],
                  [728, 90],
                ],
            id
          );
          if (adSlot) {
            adSlot.addService(window.googletag.pubads());
          }
        }

        // Display the ad
        window.googletag.display(id);
      });
    }
  }, [id, unitPath, isMobile]);

  return (
    <div
      className={`bg-card border border-border rounded-lg p-2 my-4 ${
        className || ""
      }`}
    >
      <p className="text-xs text-muted-foreground mb-2 text-center">
        Advertisement
      </p>
      <div id={id} className={`w-full flex items-center justify-center`} />
    </div>
  );
};
