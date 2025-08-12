import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';

// Minimal ad test page with a single leaderboard slot and strong diagnostics
const AdTestMin: React.FC = () => {
  useEffect(() => {
    console.log('=== AdTestMin Mounted ===');
    // Count vendor scripts to ensure no double-loading
    const vendorScripts = Array.from(document.querySelectorAll('script'))
      .map(s => (s as HTMLScriptElement).src)
      .filter(Boolean);
    const ampScripts = vendorScripts.filter(src => src.includes('admetricspro.com'));
    console.log('[AdTestMin] AdMetricsPro scripts found:', ampScripts);

    // Try to attach GPT listeners if available
    const attachGPT = () => {
      const g = (window as any).googletag;
      if (!g) return;
      try {
        g.pubads && g.pubads().addEventListener && g.pubads().addEventListener('slotRenderEnded', (e: any) => console.log('[Min] slotRenderEnded', e));
        g.pubads && g.pubads().addEventListener && g.pubads().addEventListener('impressionViewable', (e: any) => console.log('[Min] impressionViewable', e));
        const slots = g.pubads && g.pubads().getSlots ? g.pubads().getSlots() : [];
        console.log('[Min] GPT slots at attach time:', slots.map((s: any) => ({ id: s.getSlotElementId?.(), path: s.getAdUnitPath?.() })));
      } catch (err) {
        console.warn('[Min] Failed attaching GPT listeners', err);
      }
    };

    if ((window as any).googletag?.cmd?.push) {
      (window as any).googletag.cmd.push(attachGPT);
    } else {
      setTimeout(attachGPT, 4000);
    }

    // Probe refresh API
    setTimeout(() => {
      if ((window as any).amp_refreshAllSlots) {
        console.log('[Min] Calling amp_refreshAllSlots()');
        (window as any).amp_refreshAllSlots();
      } else {
        console.log('[Min] amp_refreshAllSlots not available yet');
      }
    }, 8000);
  }, []);

  return (
    <>
      <Helmet>
        <title>Ad Test Minimal | Minor Hockey Talks</title>
        <meta name="description" content="Minimal ad test page to isolate vendor issues and verify slot rendering." />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : 'https://minorhockeytalks.com/ad-test-min'} />
        <script src="https://qd.admetricspro.com/js/minorhockeytalks/new-layout-loader.js" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <h1 className="text-3xl font-bold">Ad Test Minimal</h1>
          <p className="text-muted-foreground">Single slot with diagnostics. Check console for GPT and AdMetricsPro logs.</p>

          <Card className="p-4">
            <h2 className="font-semibold mb-2">Leaderboard Top</h2>
            <div id="div-gpt-ad-1715358540790-0" style={{ minWidth: '300px', minHeight: '50px', border: '1px dashed #ccc' }} />
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold mb-2">Debug</h2>
            <ul className="text-sm list-disc pl-5 space-y-1">
              <li>Avoids header script injection on this route to prevent duplicates</li>
              <li>Auto-calls amp_refreshAllSlots after 8s if available</li>
              <li>Logs GPT events if googletag is present</li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AdTestMin;
