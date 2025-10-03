import React, { useEffect } from "react";

type GPTResponsiveAdProps = {
  slotId?: string;
};

const GPTResponsiveAd: React.FC<GPTResponsiveAdProps> = ({
  slotId = "responsive-1",
}) => {
  useEffect(() => {
    try {
      // 1) Load external GPT script
      const s1 = document.createElement("script");
      s1.async = true;
      s1.src = "https://www.googletagservices.com/tag/js/gpt.js";
      document.body.appendChild(s1);

      // 2) Inline config script
      const s2 = document.createElement("script");
      s2.innerHTML = `var gptadslots = [];\nvar googletag = googletag || {cmd:[]};\ngoogletag.cmd.push(function() {\nvar responsiveads = googletag.sizeMapping()\n.addSize([0,0],[[336,280],[300,250],[250,250],[320,250],[320,100],[320,50],[300,100],[300,50]])\n.addSize([750,200],[[728,90],[336,280],[300,250],[400,300],[480,320],[320,250]])\n.addSize([975,200],[[728,90],[970,250],[336,280],[300,250],[400,300],[480,320],[320,250],[980,90],[980,120]])\n.build();\ngptadslots.push(googletag.defineSlot('/21849154601,423899568/Ad.Plus-AI-Responsive', [[336,280]], '${slotId}')\n.defineSizeMapping(responsiveads)\n.addService(googletag.pubads()));\ngoogletag.pubads().setTargeting('site', ['minorhockeytalks.com']);\ngoogletag.enableServices(); });`;
      document.body.appendChild(s2);

      // 3) Display call script
      const s3 = document.createElement("script");
      s3.innerHTML = `googletag.cmd.push(function() { googletag.display('${slotId}'); });`;
      document.body.appendChild(s3);

      return () => {
        // cleanup injected scripts and clear slot div
        s1.remove();
        s2.remove();
        s3.remove();
        const div = document.getElementById(slotId);
        if (div) div.innerHTML = "";
      };
    } catch (err) {
      // fail silently
      console.error("GPTResponsiveAd injection error:", err);
    }
  }, [slotId]);

  return (
    <div style={{ textAlign: "center" }}>
      <div id={slotId} />
    </div>
  );
};

export default GPTResponsiveAd;
