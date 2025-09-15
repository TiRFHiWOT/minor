import React, { useEffect } from "react";

declare global {
  interface Window {
    googletag: any;
  }
}

interface BoxAdProps {
  id: string;
  unitPath: string;
  className?: string;
}

export const BoxAd: React.FC<BoxAdProps> = ({ id, unitPath, className }) => {
  useEffect(() => {
    if (typeof window !== "undefined" && window.googletag) {
      window.googletag.cmd.push(() => {
        const slots = window.googletag.pubads().getSlots();
        const existingSlot = slots.find(
          (slot) => slot.getSlotElementId() === id
        );

        if (!existingSlot) {
          const adSlot = window.googletag.defineSlot(
            unitPath,
            [
              [250, 250],
              [200, 200],
              [160, 600],
              [120, 600],
            ],
            id
          );
          if (adSlot) {
            adSlot.addService(window.googletag.pubads());
          }
        }

        window.googletag.display(id);
      });
    }
  }, [id, unitPath]);

  return (
    <div
      className={`bg-card border border-border rounded-lg p-2 w-full my-2 ${
        className || ""
      }`}
      style={{ maxWidth: "288px", margin: "0 auto" }}
    >
      <p className="text-xs text-muted-foreground mb-2 text-center">
        Advertisement
      </p>
      <div id={id} className="w-full flex items-center justify-center"></div>
    </div>
  );
};
