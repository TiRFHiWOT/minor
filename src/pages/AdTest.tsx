import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Helmet } from 'react-helmet-async';

// Declare the global functions
declare global {
  interface Window {
    amp_refreshAllSlots?: () => void;
    googletag?: any;
    adMetricsReady?: boolean;
  }
}

const AdTest: React.FC = () => {
  const [refreshCount, setRefreshCount] = useState(0);
  const [adMetricsStatus, setAdMetricsStatus] = useState('loading');

  // Simple ad container refs without complex observers
  const adIds = [
    'div-gpt-ad-1715358540790-0', // Leaderboard Top
    'div-gpt-ad-1752247623844-0', // Sidebar Left
    'div-gpt-ad-1752247724892-0', // Sidebar Left2
    'div-gpt-ad-1715358598569-0', // Content One
    'div-gpt-ad-1715358620345-0', // Content Two
    'div-gpt-ad-1753889678213-0', // Content Three
    'div-gpt-ad-1753889948554-0', // Content Four
    'div-gpt-ad-1753890381531-0'  // Content Five
  ];

  useEffect(() => {
    console.log('=== AdTest Component Mounted ===');
    console.log('Domain:', window.location.hostname);
    console.log('URL:', window.location.href);
    
    let retryCount = 0;
    const maxRetries = 10;
    
    const checkAdMetricsStatus = () => {
      const status = {
        amp_refreshAllSlots: !!window.amp_refreshAllSlots,
        googletag: !!window.googletag,
        adMetricsReady: !!(window as any).adMetricsReady,
        retryCount
      };
      
      console.log('AdMetrics Status Check:', status);
      
      if (window.amp_refreshAllSlots) {
        setAdMetricsStatus('ready');
        console.log('✅ AdMetricsPro is ready!');
        
        // Initial refresh with longer delay
        setTimeout(() => {
          console.log('🔄 First amp_refreshAllSlots call');
          window.amp_refreshAllSlots?.();
          logAdContainers();
        }, 12000); // Increased delay
        
        // Second attempt after 25 seconds
        setTimeout(() => {
          console.log('🔄 Second amp_refreshAllSlots call');
          window.amp_refreshAllSlots?.();
          logAdContainers();
        }, 25000);
        
        // Third attempt after 40 seconds
        setTimeout(() => {
          console.log('🔄 Third amp_refreshAllSlots call');
          window.amp_refreshAllSlots?.();
          logAdContainers();
        }, 40000);
        
      } else if (retryCount < maxRetries) {
        setAdMetricsStatus('checking');
        retryCount++;
        console.log(`❌ AdMetricsPro not ready, retry ${retryCount}/${maxRetries}`);
        setTimeout(checkAdMetricsStatus, 3000);
      } else {
        setAdMetricsStatus('failed');
        console.log('❌ AdMetricsPro failed to load after maximum retries');
      }
    };
    
    const logAdContainers = () => {
      console.log('=== Ad Container Status ===');
      adIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          console.log(`[${id}]:`, {
            exists: true,
            innerHTML: element.innerHTML.substring(0, 100) + (element.innerHTML.length > 100 ? '...' : ''),
            children: element.children.length,
            clientHeight: element.clientHeight,
            clientWidth: element.clientWidth,
            display: getComputedStyle(element).display,
            visibility: getComputedStyle(element).visibility
          });
        } else {
          console.log(`[${id}]: NOT FOUND`);
        }
      });
    };
    
    // Start checking after 5 seconds
    setTimeout(checkAdMetricsStatus, 5000);
    
    // Log containers immediately to see initial state
    setTimeout(logAdContainers, 1000);
  }, []);

  const handleRefreshAds = () => {
    console.log('=== Manual Ad Refresh Triggered ===');
    setRefreshCount(prev => prev + 1);
    
    if (window.amp_refreshAllSlots) {
      window.amp_refreshAllSlots();
      console.log('✅ amp_refreshAllSlots called successfully');
      
      // Log container status after refresh
      setTimeout(() => {
        console.log('=== Post-Refresh Container Status ===');
        adIds.forEach(id => {
          const element = document.getElementById(id);
          console.log(`[${id}]:`, {
            height: element?.clientHeight || 0,
            hasContent: (element?.innerHTML.length || 0) > 0,
            children: element?.children.length || 0
          });
        });
      }, 3000);
    } else {
      console.log('❌ amp_refreshAllSlots not available');
    }
  };

  return (
    <>
      <Helmet>
        <script src="https://qd.admetricspro.com/js/minorhockeytalks/new-layout-loader.js" />
      </Helmet>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">AdMetricsPro Test Page</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Testing ad integration and placement for minorhockeytalks.com
        </p>
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-center gap-4">
            <Button onClick={handleRefreshAds}>
              Manual Refresh (Count: {refreshCount})
            </Button>
            <span className={`px-3 py-1 rounded text-sm ${
              adMetricsStatus === 'ready' ? 'bg-green-100 text-green-800' :
              adMetricsStatus === 'checking' ? 'bg-yellow-100 text-yellow-800' :
              adMetricsStatus === 'failed' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              AdMetrics: {adMetricsStatus}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            All ads kept visible - no automatic hiding. Check console for detailed logs.
          </p>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 space-y-8">
        
        {/* Leaderboard Top Ad - Simplified */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Leaderboard Top Ad</h3>
            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
              Always Visible
            </span>
          </div>
          {/* /22404337467,423899568/minorhockeytalks-Leaderboard-Top */}
          <div 
            id='div-gpt-ad-1715358540790-0' 
            style={{ 
              minWidth: '300px',
              minHeight: '50px',
              backgroundColor: 'rgba(0,0,0,0.02)',
              border: '1px dashed #ccc'
            }}
          >
          </div>
        </Card>

      {/* Content Area with Ads */}
      <div className="grid grid-cols-1 gap-6 lg:gap-6" style={{ gridTemplateColumns: window.innerWidth >= 1024 ? 'minmax(350px, auto) 1fr' : '1fr' }}>
        {/* Sidebar with Ads - Simplified */}
        <div className="space-y-6 lg:order-1">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Sidebar Left Ad</h3>
              <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                Always Visible
              </span>
            </div>
            {/* /22404337467,423899568/minorhockeytalks-Sidebar-Left */}
            <div 
              id='div-gpt-ad-1752247623844-0' 
              style={{ 
                minWidth: '300px',
                minHeight: '250px',
                backgroundColor: 'rgba(0,0,0,0.02)',
                border: '1px dashed #ccc'
              }}
            >
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Sidebar Left2 Ad</h3>
              <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                Always Visible
              </span>
            </div>
            {/* /22404337467,423899568/minorhockeytalks-Sidebar-Left2 */}
            <div 
              id='div-gpt-ad-1752247724892-0' 
              style={{ 
                minWidth: '300px',
                minHeight: '250px',
                backgroundColor: 'rgba(0,0,0,0.02)',
                border: '1px dashed #ccc'
              }}
            >
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

          {/* Content One Ad - Simplified */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Content One Ad</h3>
              <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                Always Visible
              </span>
            </div>
            {/* /22404337467,423899568/minorhockeytalks-Content-One */}
            <div 
              id='div-gpt-ad-1715358598569-0' 
              style={{ 
                minWidth: '300px',
                minHeight: '50px',
                backgroundColor: 'rgba(0,0,0,0.02)',
                border: '1px dashed #ccc'
              }}
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

          {/* Content Two Ad - Simplified */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Content Two Ad</h3>
              <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                Always Visible
              </span>
            </div>
            {/* /22404337467,423899568/minorhockeytalks-Content-Two */}
            <div 
              id='div-gpt-ad-1715358620345-0' 
              style={{ 
                minWidth: '300px',
                minHeight: '50px',
                backgroundColor: 'rgba(0,0,0,0.02)',
                border: '1px dashed #ccc'
              }}
            >
            </div>
          </Card>

          {/* Content Three Ad - Simplified */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Content Three Ad</h3>
              <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                Always Visible
              </span>
            </div>
            {/* /22404337467,423899568/minorhockeytalks-Content-Three */}
            <div 
              id='div-gpt-ad-1753889678213-0' 
              style={{ 
                minWidth: '300px',
                minHeight: '50px',
                backgroundColor: 'rgba(0,0,0,0.02)',
                border: '1px dashed #ccc'
              }}
            >
            </div>
          </Card>

          {/* Content Four Ad - Simplified */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Content Four Ad</h3>
              <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                Always Visible
              </span>
            </div>
            {/* /22404337467,423899568/minorhockeytalks-Content-Four */}
            <div 
              id='div-gpt-ad-1753889948554-0' 
              style={{ 
                minWidth: '300px',
                minHeight: '50px',
                backgroundColor: 'rgba(0,0,0,0.02)',
                border: '1px dashed #ccc'
              }}
            >
            </div>
          </Card>

          {/* Content Five Ad - Simplified */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Content Five Ad</h3>
              <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                Always Visible
              </span>
            </div>
            {/* /22404337467,423899568/minorhockeytalks-Content-Five */}
            <div 
              id='div-gpt-ad-1753890381531-0' 
              style={{ 
                minWidth: '300px',
                minHeight: '50px',
                backgroundColor: 'rgba(0,0,0,0.02)',
                border: '1px dashed #ccc'
              }}
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
          <p className="text-center text-xs text-gray-500">Video ads are handled separately by Connatix</p>
        </div>
      </Card>

      {/* Debug Info */}
      <Card className="p-6 bg-blue-50">
        <h3 className="text-lg font-bold mb-4">Debug Info</h3>
        <div className="space-y-2 text-sm">
          <p><strong>AdMetrics Status:</strong> {adMetricsStatus}</p>
          <p><strong>Manual Refresh Count:</strong> {refreshCount}</p>
          <p><strong>All ads are kept visible</strong> - no automatic hiding</p>
        </div>
        
        <h4 className="font-semibold mb-2 mt-4">Test Instructions</h4>
        <div className="space-y-2 text-sm">
          <p>1. Check console logs for detailed AdMetricsPro status</p>
          <p>2. AdMetricsPro will automatically try 3 refresh attempts</p>
          <p>3. Use Manual Refresh button to trigger additional attempts</p>
          <p>4. All ad containers remain visible for AdMetricsPro to fill</p>
          <p>5. Check network tab for ad request activity</p>
        </div>
      </Card>

      {/* CMP Compliance Divs */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <h3 className="text-lg font-bold mb-4">Consent Management Platform (CMP)</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Footer CMP (for all pages):</p>
            <div id="ampCMP_footer" className="border border-dashed border-yellow-400 p-2 bg-yellow-100">
              <p className="text-xs text-center">CMP Footer Link will appear here</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Privacy Policy CMP:</p>
            <div id="ampCMP_privacyPolicy" className="border border-dashed border-yellow-400 p-2 bg-yellow-100">
              <p className="text-xs text-center">CMP Privacy Policy controls will appear here</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
    </div>
    </>
  );
};

export default AdTest;