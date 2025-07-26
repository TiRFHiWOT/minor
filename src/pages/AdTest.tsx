import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Import components from your forum layout
import { ForumHeader } from "@/components/forum/ForumHeader";
import { ForumSidebarNav } from "@/components/forum/ForumSidebarNav";
import { ForumStats } from "@/components/forum/ForumStats";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/forum/MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";

// Import ForumHome to include its content directly
import { ForumHome } from "@/components/forum/ForumHome";

// Declare the global amp_refreshAllSlots function
declare global {
  interface Window {
    amp_refreshAllSlots?: () => void;
  }
}

const AdTest: React.FC = () => {
  const isMobile = useIsMobile();

  const handleRefreshAds = () => {
    if (window.amp_refreshAllSlots) {
      window.amp_refreshAllSlots();
      console.log("Ads refreshed via button!");
    } else {
      console.log(
        "AdMetricsPro: amp_refreshAllSlots function not yet available. Ensure AdMetricsPro script is loaded in index.html."
      );
    }
  };

  return (
    // This div mimics the main wrapper from ForumLayout.tsx
    <div className="min-h-screen bg-background overflow-x-hidden pb-24 md:pb-0">
      {/* Forum Header - Mimicking ForumLayout */}
      <ForumHeader />

      {/* Main content area wrapper: max-w-7xl, centered, with padding */}
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6 overflow-x-hidden">
        {/* Flex container for sidebar and main content */}
        <div className="flex gap-6 w-full">
          {/* Sidebar - Left side on desktop, hidden on mobile */}
          {!isMobile && (
            <aside className="w-80 flex-shrink-0 space-y-6 overflow-x-hidden">
              {/* Forum Sidebar Navigation - Mimicking ForumLayout */}
              <ForumSidebarNav />
              {/* Forum Stats - Mimicking ForumLayout */}
              <ForumStats />

              {/* Sidebar Left Ad - Placed within the sidebar */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Sidebar Left Ad</h3>
                <div
                  id="div-gpt-ad-1752247623844-0"
                  style={{
                    minWidth: "300px",
                    minHeight: "250px",
                    border: "1px dashed #ccc",
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  <p className="text-center text-sm text-muted-foreground p-4">
                    Sidebar ad placeholder
                  </p>
                </div>
              </Card>

              {/* Sidebar Left2 Ad - Placed within the sidebar */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Sidebar Left2 Ad</h3>
                <div
                  id="div-gpt-ad-1752247724892-0"
                  style={{
                    minWidth: "300px",
                    minHeight: "250px",
                    border: "1px dashed #ccc",
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  <p className="text-center text-sm text-muted-foreground p-4">
                    Sidebar ad placeholder
                  </p>
                </div>
              </Card>
            </aside>
          )}

          {/* Main Content Area - Mimicking ForumLayout's main content */}
          <main className="flex-1 min-w-0 w-full space-y-8 overflow-x-hidden">
            {/* AdTest specific header and refresh button - now at the top of the main content */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">AdMetricsPro Test Page</h1>
              <p className="text-xl text-muted-foreground mb-6">
                Testing ad integration and placement for minorhockeytalks.com
              </p>
              <Button onClick={handleRefreshAds} className="mb-8">
                Test Ad Refresh (amp_refreshAllSlots)
              </Button>
            </div>

            {/* Leaderboard Top Ad - Placed within the main content flow, after the test page header */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Leaderboard Top Ad</h3>
              <div
                id="div-gpt-ad-1715358540790-0"
                style={{
                  minWidth: "300px",
                  minHeight: "50px",
                  border: "1px dashed #ccc",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <p className="text-center text-sm text-muted-foreground p-4">
                  Ad slot placeholder
                </p>
              </div>
            </Card>

            {/* Content One Ad - Interspersed with ForumHome content */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Content One Ad</h3>
              <div
                id="div-gpt-ad-1715358598569-0"
                style={{
                  minWidth: "300px",
                  minHeight: "50px",
                  border: "1px dashed #ccc",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <p className="text-center text-sm text-muted-foreground p-4">
                  Ad slot placeholder
                </p>
              </div>
            </Card>

            {/* ForumHome Content - Mimicking ForumLayout's Outlet */}
            {/* This will render the actual content of your ForumHome page */}
            <ForumHome />

            {/* Content Two Ad - Interspersed with ForumHome content */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Content Two Ad</h3>
              <div
                id="div-gpt-ad-1715358620345-0"
                style={{
                  minWidth: "300px",
                  minHeight: "50px",
                  border: "1px dashed #ccc",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <p className="text-center text-sm text-muted-foreground p-4">
                  Ad slot placeholder
                </p>
              </div>
            </Card>

            {/* Video Unit */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Video Unit</h3>
              <div className="border border-dashed border-gray-300 p-4 bg-gray-50">
                <p className="text-center text-sm text-muted-foreground mb-2">
                  Connatix Video Unit
                </p>
                <script id="c764d7beef4b4321984c2aaa46dd9689">
                  {`console.log("Connatix in-content script found.");`}
                </script>
              </div>
            </Card>

            {/* AdMetricsPro CMP Privacy Policy Div for testing */}
            <Card className="p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
              <h3 className="text-lg font-semibold mb-4">
                Consent Management Platform (CMP) Test
              </h3>
              <p className="text-gray-700 mb-2">
                This div is for testing the CMP functionality on the Privacy Policy
                page. In a real application, this specific div
                (`ampCMP_privacyPolicy`) would reside on your dedicated Privacy
                Policy page.
              </p>
              <div
                id="ampCMP_privacyPolicy"
                className="mt-4 p-2 bg-blue-100 rounded-md border border-blue-300"
              >
                <p className="font-semibold">Privacy Settings Placeholder:</p>
                <p className="text-sm">
                  Expect AdMetricsPro to inject interactive content here.
                </p>
              </div>
            </Card>

            {/* Test Information */}
            <Card className="p-6 bg-blue-50">
              <h3 className="text-lg font-bold mb-4">Test Instructions</h3>
              <div className="space-y-2 text-sm">
                <p>
                  1. Check that the AdMetricsPro script loads successfully (from
                  public/index.html)
                </p>
                <p>
                  2. Verify that ad slots display (they may show as empty initially
                  or with placeholders)
                </p>
                <p>
                  3. Test the "Test Ad Refresh" button to ensure
                  amp_refreshAllSlots() works
                </p>
                <p>
                  4. Navigate to other pages and back to test route change refresh
                  (check console logs in App.tsx)
                </p>
                <p>5. Check browser console for any errors</p>
                <p>
                  6. Verify interstitial ads trigger during navigation (may require
                  multiple navigations)
                </p>
                <p>
                  7. Check that Connatix video unit script loads and logs to console
                </p>
              </div>
            </Card>
          </main>
        </div>
      </div>

      {/* Footer - Mimicking ForumLayout */}
      <Footer />

      {/* Mobile Bottom Navigation - Mimicking ForumLayout */}
      <div className="fixed bottom-0 left-0 right-0 w-full md:hidden z-50">
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default AdTest;
