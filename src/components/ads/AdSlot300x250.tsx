import React, { useEffect } from "react";

interface AdSlot300x250Props {
  slotId?: string;
}

export const AdSlot300x250: React.FC<AdSlot300x250Props> = ({
  slotId = "300x250-1",
}) => {
  useEffect(() => {
    // Load the GPT script if not already present
    if (!document.getElementById("gpt-script")) {
      const script = document.createElement("script");
      script.id = "gpt-script";
      script.async = true;
      script.src = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
      script.crossOrigin = "anonymous";
      document.body.appendChild(script);
    }

    // Ad slot initialization
    const adScript = document.createElement("script");
    adScript.innerHTML = `window.googletag=window.googletag||{cmd:[]};googletag.cmd.push(function(){googletag.defineSlot('/21849154601,423899568/Ad.Plus-300x250',[300,250],'${slotId}').addService(googletag.pubads());googletag.enableServices();googletag.display('${slotId}');});`;
    document.body.appendChild(adScript);

    return () => {
      // Optionally clean up adScript if needed
      if (adScript.parentNode) {
        adScript.parentNode.removeChild(adScript);
      }
    };
  }, [slotId]);

  return (
    <div className="w-full flex justify-center">
      <div id={slotId} style={{ width: 300, height: 250 }} />
    </div>
  );
};
