import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAdObserver } from '@/hooks/useAdObserver';

// Declare the global amp_refreshAllSlots function
declare global {
  interface Window {
    amp_refreshAllSlots?: () => void;
  }
}

const AdTest: React.FC = () => {
  const [adStates, setAdStates] = useState<Record<string, { loaded: boolean; size?: { width: number; height: number } }>>({});

  // Ad observers for each ad slot
  const leaderboardObserver = useAdObserver('div-gpt-ad-1715358540790-0', {
    onAdLoaded: (element, size) => {
      setAdStates(prev => ({ ...prev, 'div-gpt-ad-1715358540790-0': { loaded: true, size } }));
      console.log('Leaderboard ad loaded:', size);
    },
    onAdEmpty: (element) => {
      setAdStates(prev => ({ ...prev, 'div-gpt-ad-1715358540790-0': { loaded: false } }));
      console.log('Leaderboard ad empty');
    }
  });

  const sidebarLeft1Observer = useAdObserver('div-gpt-ad-1752247623844-0', {
    onAdLoaded: (element, size) => {
      setAdStates(prev => ({ ...prev, 'div-gpt-ad-1752247623844-0': { loaded: true, size } }));
      console.log('Sidebar Left ad loaded:', size);
    },
    onAdEmpty: (element) => {
      setAdStates(prev => ({ ...prev, 'div-gpt-ad-1752247623844-0': { loaded: false } }));
      console.log('Sidebar Left ad empty');
    }
  });

  const sidebarLeft2Observer = useAdObserver('div-gpt-ad-1752247724892-0', {
    onAdLoaded: (element, size) => {
      setAdStates(prev => ({ ...prev, 'div-gpt-ad-1752247724892-0': { loaded: true, size } }));
      console.log('Sidebar Left2 ad loaded:', size);
    },
    onAdEmpty: (element) => {
      setAdStates(prev => ({ ...prev, 'div-gpt-ad-1752247724892-0': { loaded: false } }));
      console.log('Sidebar Left2 ad empty');
    }
  });

  const contentOneObserver = useAdObserver('div-gpt-ad-1715358598569-0', {
    onAdLoaded: (element, size) => {
      setAdStates(prev => ({ ...prev, 'div-gpt-ad-1715358598569-0': { loaded: true, size } }));
      console.log('Content One ad loaded:', size);
    },
    onAdEmpty: (element) => {
      setAdStates(prev => ({ ...prev, 'div-gpt-ad-1715358598569-0': { loaded: false } }));
      console.log('Content One ad empty');
    }
  });

  const contentTwoObserver = useAdObserver('div-gpt-ad-1715358620345-0', {
    onAdLoaded: (element, size) => {
      setAdStates(prev => ({ ...prev, 'div-gpt-ad-1715358620345-0': { loaded: true, size } }));
      console.log('Content Two ad loaded:', size);
    },
    onAdEmpty: (element) => {
      setAdStates(prev => ({ ...prev, 'div-gpt-ad-1715358620345-0': { loaded: false } }));
      console.log('Content Two ad empty');
    }
  });

  useEffect(() => {
    // Add the AdMetricsPro head script
    const script = document.createElement('script');
    script.src = 'https://qd.admetricspro.com/js/minorhockeytalks/new-layout-loader.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script when component unmounts
      const existingScript = document.querySelector(`script[src="https://qd.admetricspro.com/js/minorhockeytalks/new-layout-loader.js"]`);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  const handleRefreshAds = () => {
    if (window.amp_refreshAllSlots) {
      window.amp_refreshAllSlots();
      console.log('Ads refreshed!');
    } else {
      console.log('amp_refreshAllSlots function not yet available');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">AdMetricsPro Test Page</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Testing ad integration and placement for minorhockeytalks.com
        </p>
        <Button onClick={handleRefreshAds} className="mb-8">
          Test Ad Refresh (amp_refreshAllSlots)
        </Button>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 space-y-8">

      {/* Leaderboard Top Ad */}
      <div ref={leaderboardObserver.containerRef} className="overflow-visible">
        <Card className="p-4 transition-all duration-300 w-fit h-fit">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Leaderboard Top Ad</h3>
            <span className={`text-xs px-2 py-1 rounded ${
              adStates['div-gpt-ad-1715358540790-0']?.loaded ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {adStates['div-gpt-ad-1715358540790-0']?.loaded ? 'Loaded' : 'Empty'}
            </span>
          </div>
          {/* /22404337467,423899568/minorhockeytalks-Leaderboard-Top */}
          <div 
            id='div-gpt-ad-1715358540790-0' 
            className="overflow-visible"
            style={{ 
              transition: 'all 0.3s ease',
              backgroundColor: 'transparent'
            }}
          >
          </div>
        </Card>
      </div>

      {/* Content Area with Ads */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with Ads */}
        <div className="space-y-6">
          <div ref={sidebarLeft1Observer.containerRef} className="overflow-visible">
            <Card className="p-4 transition-all duration-300 w-fit h-fit">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Sidebar Left Ad</h3>
                <span className={`text-xs px-2 py-1 rounded ${
                  adStates['div-gpt-ad-1752247623844-0']?.loaded ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {adStates['div-gpt-ad-1752247623844-0']?.loaded ? 'Loaded' : 'Empty'}
                </span>
              </div>
              {/* /22404337467,423899568/minorhockeytalks-Sidebar-Left */}
              <div 
                id='div-gpt-ad-1752247623844-0' 
                className="overflow-visible"
                style={{ 
                  transition: 'all 0.3s ease',
                  backgroundColor: 'transparent'
                }}
              >
              </div>
            </Card>
          </div>

          <div ref={sidebarLeft2Observer.containerRef} className="overflow-visible">
            <Card className="p-4 transition-all duration-300 w-fit h-fit">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Sidebar Left2 Ad</h3>
                <span className={`text-xs px-2 py-1 rounded ${
                  adStates['div-gpt-ad-1752247724892-0']?.loaded ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {adStates['div-gpt-ad-1752247724892-0']?.loaded ? 'Loaded' : 'Empty'}
                </span>
              </div>
              {/* /22404337467,423899568/minorhockeytalks-Sidebar-Left2 */}
              <div 
                id='div-gpt-ad-1752247724892-0' 
                className="overflow-visible"
                style={{ 
                  transition: 'all 0.3s ease',
                  backgroundColor: 'transparent'
                }}
              >
              </div>
            </Card>
          </div>

          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Interstitial Note</h3>
            <p className="text-sm text-muted-foreground">
              Interstitial ads are enabled and don't require a body tag. They should display automatically during navigation.
            </p>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Main Content Area</h2>
            <p className="mb-4">
              This is sample content to simulate a real page. The ads should load around this content.
            </p>
            <p className="mb-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </Card>

          {/* Content One Ad */}
          <div ref={contentOneObserver.containerRef} className="overflow-visible">
            <Card className="p-4 transition-all duration-300 w-fit h-fit">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Content One Ad</h3>
                <span className={`text-xs px-2 py-1 rounded ${
                  adStates['div-gpt-ad-1715358598569-0']?.loaded ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {adStates['div-gpt-ad-1715358598569-0']?.loaded ? 'Loaded' : 'Empty'}
                </span>
              </div>
              {/* /22404337467,423899568/minorhockeytalks-Content-One */}
              <div 
                id='div-gpt-ad-1715358598569-0' 
                className="overflow-visible"
                style={{ 
                  transition: 'all 0.3s ease',
                  backgroundColor: 'transparent'
                }}
              >
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">More Content</h3>
            <p className="mb-4">
              Additional content to test the flow between content and ads.
            </p>
            <p className="mb-4">
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
          </Card>

          {/* Content Two Ad */}
          <div ref={contentTwoObserver.containerRef} className="overflow-visible">
            <Card className="p-4 transition-all duration-300 w-fit h-fit">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Content Two Ad</h3>
                <span className={`text-xs px-2 py-1 rounded ${
                  adStates['div-gpt-ad-1715358620345-0']?.loaded ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {adStates['div-gpt-ad-1715358620345-0']?.loaded ? 'Loaded' : 'Empty'}
                </span>
              </div>
              {/* /22404337467,423899568/minorhockeytalks-Content-Two */}
              <div 
                id='div-gpt-ad-1715358620345-0' 
                className="overflow-visible"
                style={{ 
                  transition: 'all 0.3s ease',
                  backgroundColor: 'transparent'
                }}
              >
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Video Unit */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Video Unit</h3>
        <div className="border border-dashed border-gray-300 p-4 bg-gray-50">
          <p className="text-center text-sm text-muted-foreground mb-2">Connatix Video Unit</p>
          {/* Video code for minorhockeytalks.com */}
          <script id="c764d7beef4b4321984c2aaa46dd9689">
            {`console.log("Connatix in-content script found.");`}
          </script>
          {/* Video code for minorhockeytalks.com */}
        </div>
      </Card>

      {/* Ad States Debug Info */}
      <Card className="p-6 bg-blue-50">
        <h3 className="text-lg font-bold mb-4">Ad Loading Status & Debug Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {Object.entries(adStates).map(([adId, state]) => (
            <div key={adId} className="bg-white p-3 rounded border">
              <div className="font-mono text-xs text-gray-600 mb-1">{adId}</div>
              <div className={`text-sm font-semibold ${state.loaded ? 'text-green-600' : 'text-gray-500'}`}>
                {state.loaded ? 'Loaded' : 'Empty/Not Loaded'}
              </div>
              {state.size && (
                <div className="text-xs text-gray-500">
                  Size: {state.size.width}x{state.size.height}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <h4 className="font-semibold mb-2">Test Instructions</h4>
        <div className="space-y-2 text-sm">
          <p>1. Check that the AdMetricsPro script loads successfully</p>
          <p>2. Watch ad status indicators turn green when ads load</p>
          <p>3. Empty ad slots will be automatically hidden</p>
          <p>4. Test the "Test Ad Refresh" button to ensure amp_refreshAllSlots() works</p>
          <p>5. Ad containers dynamically resize based on actual ad content</p>
          <p>6. Check browser console for ad loading logs</p>
          <p>7. Navigate to other pages and back to test route change refresh</p>
        </div>
      </Card>
      </div>
    </div>
  );
};

export default AdTest;