import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAdObserver } from '@/hooks/useAdObserver';

// Declare the global functions
declare global {
  interface Window {
    amp_refreshAllSlots?: () => void;
  }
}

const AdTest: React.FC = () => {
  const [adStates, setAdStates] = useState<Record<string, { loaded: boolean; size?: { width: number; height: number } }>>({});

  // Ad observers for each ad slot
  const leaderboardTopObserver = useAdObserver('div-gpt-ad-1715358540790-0', {
    onAdLoaded: (element, size) => {
      setAdStates(prev => ({ ...prev, 'div-gpt-ad-1715358540790-0': { loaded: true, size } }));
      console.log('Leaderboard Top ad loaded:', size);
    },
    onAdEmpty: (element) => {
      setAdStates(prev => ({ ...prev, 'div-gpt-ad-1715358540790-0': { loaded: false } }));
      console.log('Leaderboard Top ad empty');
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

  const contentThreeObserver = useAdObserver('div-gpt-ad-1753889678213-0', {
    onAdLoaded: (element, size) => {
      setAdStates(prev => ({ ...prev, 'div-gpt-ad-1753889678213-0': { loaded: true, size } }));
      console.log('Content Three ad loaded:', size);
    },
    onAdEmpty: (element) => {
      setAdStates(prev => ({ ...prev, 'div-gpt-ad-1753889678213-0': { loaded: false } }));
      console.log('Content Three ad empty');
    }
  });

  const contentFourObserver = useAdObserver('div-gpt-ad-1753889948554-0', {
    onAdLoaded: (element, size) => {
      setAdStates(prev => ({ ...prev, 'div-gpt-ad-1753889948554-0': { loaded: true, size } }));
      console.log('Content Four ad loaded:', size);
    },
    onAdEmpty: (element) => {
      setAdStates(prev => ({ ...prev, 'div-gpt-ad-1753889948554-0': { loaded: false } }));
      console.log('Content Four ad empty');
    }
  });

  const contentFiveObserver = useAdObserver('div-gpt-ad-1753890381531-0', {
    onAdLoaded: (element, size) => {
      setAdStates(prev => ({ ...prev, 'div-gpt-ad-1753890381531-0': { loaded: true, size } }));
      console.log('Content Five ad loaded:', size);
    },
    onAdEmpty: (element) => {
      setAdStates(prev => ({ ...prev, 'div-gpt-ad-1753890381531-0': { loaded: false } }));
      console.log('Content Five ad empty');
    }
  });

  useEffect(() => {
    console.log('AdTest component mounted. Checking script availability...');
    console.log('Current domain:', window.location.hostname);
    console.log('Current URL:', window.location.href);
    
    // Initialize Google Tag Manager properly for React using type assertions
    const initializeGoogleAds = () => {
      const gtag = (window as any).googletag;
      if (gtag && gtag.cmd) {
        console.log('Initializing Google Ads for React...');
        
        gtag.cmd.push(() => {
          console.log('Google Tag Manager command queue executing...');
          
          // Destroy existing ad slots if they exist to prevent conflicts
          const existingSlots = gtag.pubads().getSlots();
          if (existingSlots.length > 0) {
            console.log('Destroying existing ad slots:', existingSlots.length);
            gtag.destroySlots();
          }
          
          // Define all ad slots properly
          const adSlots = [
            { id: 'div-gpt-ad-1715358540790-0', sizes: [[728, 90], [320, 50]], path: '/22404337467,423899568/minorhockeytalks-Leaderboard-Top' },
            { id: 'div-gpt-ad-1715358598569-0', sizes: [[728, 90], [320, 50]], path: '/22404337467,423899568/minorhockeytalks-Content-One' },
            { id: 'div-gpt-ad-1715358620345-0', sizes: [[300, 250], [320, 50]], path: '/22404337467,423899568/minorhockeytalks-Sidebar-Left' },
            { id: 'div-gpt-ad-1752247623844-0', sizes: [[300, 250], [320, 50]], path: '/22404337467,423899568/minorhockeytalks-Sidebar-Left2' },
            { id: 'div-gpt-ad-1752247724892-0', sizes: [[300, 250], [320, 50]], path: '/22404337467,423899568/minorhockeytalks-Sidebar-Right' },
            { id: 'div-gpt-ad-1753889678213-0', sizes: [[300, 250], [320, 50]], path: '/22404337467,423899568/minorhockeytalks-Sidebar-Right2' },
            { id: 'div-gpt-ad-1753889948554-0', sizes: [[728, 90], [320, 50]], path: '/22404337467,423899568/minorhockeytalks-Content-Two' },
            { id: 'div-gpt-ad-1753890381531-0', sizes: [[640, 360], [320, 180]], path: '/22404337467,423899568/minorhockeytalks-Video-Unit' }
          ];
          
          adSlots.forEach(({ id, sizes, path }) => {
            const element = document.getElementById(id);
            if (element) {
              console.log(`Defining ad slot: ${id} with path: ${path}`);
              const slot = gtag.defineSlot(path, sizes, id);
              if (slot) {
                slot.addService(gtag.pubads());
                console.log(`Ad slot ${id} defined successfully`);
              } else {
                console.error(`Failed to define ad slot: ${id}`);
              }
            } else {
              console.warn(`Ad element not found: ${id}`);
            }
          });
          
          // Configure publisher ads service
          gtag.pubads().enableSingleRequest();
          gtag.pubads().collapseEmptyDivs();
          gtag.pubads().setCentering(true);
          gtag.enableServices();
          
          console.log('Google Ads initialization complete. Displaying ads...');
          
          // Display all ads
          adSlots.forEach(({ id }) => {
            const element = document.getElementById(id);
            if (element) {
              gtag.display(id);
              console.log(`Displaying ad: ${id}`);
            }
          });
        });
      } else {
        console.error('Google Tag Manager not available');
      }
    };
    
    // Check for AdMetricsPro and log status
    const checkAndInitialize = () => {
      console.log('Available global functions:', {
        amp_refreshAllSlots: typeof window.amp_refreshAllSlots,
        googletag: typeof window.googletag
      });
      
      // Initialize Google Ads properly for React
      initializeGoogleAds();
      
      // Also try AdMetricsPro method
      setTimeout(() => {
        if (window.amp_refreshAllSlots) {
          console.log('Triggering amp_refreshAllSlots...');
          window.amp_refreshAllSlots();
        }
      }, 2000);
    };
    
    // Check immediately and also after a delay
    checkAndInitialize();
    const timer = setTimeout(checkAndInitialize, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleRefreshAds = () => {
    console.log('Attempting to refresh ads...');
    console.log('Current ad states:', adStates);
    console.log('Available ad elements:', {
      leaderboard: document.getElementById('div-gpt-ad-1715358540790-0'),
      sidebar1: document.getElementById('div-gpt-ad-1752247623844-0'),
      sidebar2: document.getElementById('div-gpt-ad-1752247724892-0'),
      content1: document.getElementById('div-gpt-ad-1715358598569-0'),
      content2: document.getElementById('div-gpt-ad-1715358620345-0'),
      content3: document.getElementById('div-gpt-ad-1753889678213-0'),
      content4: document.getElementById('div-gpt-ad-1753889948554-0'),
      content5: document.getElementById('div-gpt-ad-1753890381531-0')
    });
    
    if (window.amp_refreshAllSlots) {
      window.amp_refreshAllSlots();
      console.log('amp_refreshAllSlots called successfully');
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
        <div ref={leaderboardTopObserver.containerRef} className="ad-container overflow-visible">
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
              className="ad-slot overflow-visible"
              style={{ 
                minWidth: '300px',
                minHeight: '50px',
                transition: 'all 0.3s ease',
                backgroundColor: 'transparent'
              }}
            >
            </div>
          </Card>
        </div>

      {/* Content Area with Ads */}
      <div className="grid grid-cols-1 gap-6 lg:gap-6" style={{ gridTemplateColumns: window.innerWidth >= 1024 ? 'minmax(350px, auto) 1fr' : '1fr' }}>
        {/* Sidebar with Ads */}
        <div className="space-y-6 lg:order-1">
          <div ref={sidebarLeft1Observer.containerRef} className="ad-container overflow-visible">
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
                className="ad-slot overflow-visible"
                style={{ 
                  minWidth: '300px',
                  minHeight: '250px',
                  transition: 'all 0.3s ease',
                  backgroundColor: 'transparent'
                }}
              >
              </div>
            </Card>
          </div>

          <div ref={sidebarLeft2Observer.containerRef} className="ad-container overflow-visible">
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
                className="ad-slot overflow-visible"
                style={{ 
                  minWidth: '300px',
                  minHeight: '250px',
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
        <div className="space-y-6 lg:order-2">
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
          <div ref={contentOneObserver.containerRef} className="ad-container overflow-visible">
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
                className="ad-slot overflow-visible"
                style={{ 
                  minWidth: '300px',
                  minHeight: '50px',
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
          <div ref={contentTwoObserver.containerRef} className="ad-container overflow-visible">
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
                className="ad-slot overflow-visible"
                style={{ 
                  minWidth: '300px',
                  minHeight: '50px',
                  transition: 'all 0.3s ease',
                  backgroundColor: 'transparent'
                }}
              >
              </div>
            </Card>
          </div>

          {/* Content Three Ad */}
          <div ref={contentThreeObserver.containerRef} className="ad-container overflow-visible">
            <Card className="p-4 transition-all duration-300 w-fit h-fit">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Content Three Ad</h3>
                <span className={`text-xs px-2 py-1 rounded ${
                  adStates['div-gpt-ad-1753889678213-0']?.loaded ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {adStates['div-gpt-ad-1753889678213-0']?.loaded ? 'Loaded' : 'Empty'}
                </span>
              </div>
              {/* /22404337467,423899568/minorhockeytalks-Content-Three */}
              <div 
                id='div-gpt-ad-1753889678213-0' 
                className="ad-slot overflow-visible"
                style={{ 
                  minWidth: '300px',
                  minHeight: '50px',
                  transition: 'all 0.3s ease',
                  backgroundColor: 'transparent'
                }}
              >
              </div>
            </Card>
          </div>

          {/* Content Four Ad */}
          <div ref={contentFourObserver.containerRef} className="ad-container overflow-visible">
            <Card className="p-4 transition-all duration-300 w-fit h-fit">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Content Four Ad</h3>
                <span className={`text-xs px-2 py-1 rounded ${
                  adStates['div-gpt-ad-1753889948554-0']?.loaded ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {adStates['div-gpt-ad-1753889948554-0']?.loaded ? 'Loaded' : 'Empty'}
                </span>
              </div>
              {/* /22404337467,423899568/minorhockeytalks-Content-Four */}
              <div 
                id='div-gpt-ad-1753889948554-0' 
                className="ad-slot overflow-visible"
                style={{ 
                  minWidth: '300px',
                  minHeight: '50px',
                  transition: 'all 0.3s ease',
                  backgroundColor: 'transparent'
                }}
              >
              </div>
            </Card>
          </div>

          {/* Content Five Ad */}
          <div ref={contentFiveObserver.containerRef} className="ad-container overflow-visible">
            <Card className="p-4 transition-all duration-300 w-fit h-fit">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Content Five Ad</h3>
                <span className={`text-xs px-2 py-1 rounded ${
                  adStates['div-gpt-ad-1753890381531-0']?.loaded ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {adStates['div-gpt-ad-1753890381531-0']?.loaded ? 'Loaded' : 'Empty'}
                </span>
              </div>
              {/* /22404337467,423899568/minorhockeytalks-Content-Five */}
              <div 
                id='div-gpt-ad-1753890381531-0' 
                className="ad-slot overflow-visible"
                style={{ 
                  minWidth: '300px',
                  minHeight: '50px',
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
          {Object.entries(adStates).map(([adId, state]) => {
            const getAdName = (id: string) => {
              switch (id) {
                case 'div-gpt-ad-1715358540790-0': return 'Leaderboard Top';
                case 'div-gpt-ad-1752247623844-0': return 'Sidebar Left';
                case 'div-gpt-ad-1752247724892-0': return 'Sidebar Left2';
                case 'div-gpt-ad-1715358598569-0': return 'Content One';
                case 'div-gpt-ad-1715358620345-0': return 'Content Two';
                case 'div-gpt-ad-1753889678213-0': return 'Content Three';
                case 'div-gpt-ad-1753889948554-0': return 'Content Four';
                case 'div-gpt-ad-1753890381531-0': return 'Content Five';
                default: return id;
              }
            };
            
            return (
              <div key={adId} className="bg-white p-3 rounded border">
                <div className="font-semibold text-sm mb-1">{getAdName(adId)}</div>
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
            );
          })}
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