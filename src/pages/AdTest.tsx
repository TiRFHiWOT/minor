import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Declare the global amp_refreshAllSlots function
declare global {
  interface Window {
    amp_refreshAllSlots?: () => void;
  }
}

const AdTest: React.FC = () => {
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
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Leaderboard Top Ad</h3>
        {/* /22404337467,423899568/minorhockeytalks-Leaderboard-Top */}
        <div 
          id='div-gpt-ad-1715358540790-0' 
          style={{ minWidth: '300px', minHeight: '50px' }}
        >
        </div>
      </Card>

      {/* Content Area with Ads */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with Ads */}
        <div className="space-y-6">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Sidebar Left Ad</h3>
            <div 
              id='div-gpt-ad-1752247623844-0' 
              style={{ minWidth: '300px', minHeight: '250px', border: '1px dashed #ccc', backgroundColor: '#f9f9f9' }}
            >
              <p className="text-center text-sm text-muted-foreground p-4">Sidebar ad placeholder</p>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Sidebar Left2 Ad</h3>
            <div 
              id='div-gpt-ad-1752247724892-0' 
              style={{ minWidth: '300px', minHeight: '250px', border: '1px dashed #ccc', backgroundColor: '#f9f9f9' }}
            >
              <p className="text-center text-sm text-muted-foreground p-4">Sidebar ad placeholder</p>
            </div>
          </Card>

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
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Content One Ad</h3>
            {/* /22404337467,423899568/minorhockeytalks-Content-One */}
            <div 
              id='div-gpt-ad-1715358598569-0' 
              style={{ minWidth: '300px', minHeight: '50px' }}
            >
            </div>
          </Card>

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
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Content Two Ad</h3>
            {/* /22404337467,423899568/minorhockeytalks-Content-Two */}
            <div 
              id='div-gpt-ad-1715358620345-0' 
              style={{ minWidth: '300px', minHeight: '50px' }}
            >
            </div>
          </Card>
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

      {/* Test Information */}
      <Card className="p-6 bg-blue-50">
        <h3 className="text-lg font-bold mb-4">Test Instructions</h3>
        <div className="space-y-2 text-sm">
          <p>1. Check that the AdMetricsPro script loads successfully</p>
          <p>2. Verify that ad slots display (they may show as empty initially)</p>
          <p>3. Test the "Test Ad Refresh" button to ensure amp_refreshAllSlots() works</p>
          <p>4. Navigate to other pages and back to test route change refresh</p>
          <p>5. Check browser console for any errors</p>
          <p>6. Verify interstitial ads trigger during navigation</p>
          <p>7. Check that Connatix video unit script loads and logs to console</p>
        </div>
      </Card>
      </div>
    </div>
  );
};

export default AdTest;