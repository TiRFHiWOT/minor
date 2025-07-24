import React from "react";
import { Outlet } from "react-router-dom";
import { RedirectHandler } from "@/components/RedirectHandler";
import { ForumHeader } from "./ForumHeader";
import { ForumSidebarNav } from "./ForumSidebarNav";
import { ForumStats } from "./ForumStats"; // Ensure this component is correctly implemented
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "./MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";

export const ForumLayout = () => {
  const isMobile = useIsMobile();

  return (
    // Increased pb-24 to ensure content clears the fixed MobileBottomNav on small screens.
    // Adjust this value if the MobileBottomNav height changes.
    <div className="min-h-screen bg-background overflow-x-hidden pb-24 md:pb-0">
      {" "}
      {/* Added md:pb-0 to remove padding on larger screens */}
      <RedirectHandler />
      <ForumHeader />
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6 overflow-x-hidden">
        <div className="flex gap-6 w-full">
          {/* Sidebar - Left side on desktop, hidden on mobile */}
          {!isMobile && (
            <aside className="w-80 flex-shrink-0 space-y-6 overflow-x-hidden">
              <ForumSidebarNav />
              {/* ForumStats component uncommented - assuming it should be displayed */}
              <ForumStats />
            </aside>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0 w-full overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>
      {/* Footer - This will scroll up with the content */}
      <Footer />
      {/* Mobile Bottom Navigation - This is likely fixed at the bottom */}
      {/* It's styled to be hidden on medium screens and up (md:hidden) */}
      <div className="fixed bottom-0 left-0 right-0 w-full md:hidden z-50">
        <MobileBottomNav />
      </div>
      {/* Video code for minorhockeytalks.com - Floating Video Ad Unit */}
      {/* Placed here to ensure it's present on all pages using this layout */}
      <script id="c764d7beef4b4321984c2aaa46dd9689">
        {`console.log("Connatix in-content script found.");`}
      </script>
      {/* End Video code */}
    </div>
  );
};
