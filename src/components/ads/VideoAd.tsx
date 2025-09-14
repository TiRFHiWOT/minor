import React, { useEffect } from "react";

declare global {
  interface Window {
    googletag: any;
  }
}

interface VideoAdProps {
  id: string;
  className?: string;
}

export const VideoAd: React.FC<VideoAdProps> = ({ id, className }) => {
  useEffect(() => {
    if (typeof window !== "undefined" && window.googletag) {
      window.googletag.cmd.push(() => {
        // Define InPage Video ad slot
        const slots = window.googletag.pubads().getSlots();
        const existingSlot = slots.find(
          (slot) => slot.getSlotElementId() === id
        );

        if (!existingSlot) {
          const videoSlot = window.googletag.defineSlot(
            "/21849154601,423899568/Ad.Plus-InPage-Video",
            [640, 360],
            id
          );
          if (videoSlot) {
            videoSlot.addService(window.googletag.pubads());
          }
        }

        window.googletag.display(id);
      });
    }
  }, [id]);

  return (
    <div
      className={`bg-card border border-border rounded-lg p-2 my-6 ${
        className || ""
      }`}
    >
      <div id={id} className="w-full flex items-center justify-center"></div>
    </div>
  );
};
