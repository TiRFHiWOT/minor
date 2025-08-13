
import React from 'react';
import { Outlet } from 'react-router-dom';
import { RedirectHandler } from '@/components/RedirectHandler';
import { ForumHeader } from './ForumHeader';
import { ForumSidebarNav } from './ForumSidebarNav';
import { ForumStats } from './ForumStats';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileErrorBoundary } from '@/components/MobileErrorBoundary';
import { ErrorBoundaryEnhanced } from '@/components/ErrorBoundaryEnhanced';
import { useIsMobile } from '@/hooks/use-mobile';

export const ForumLayout = () => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden pb-16">
      <RedirectHandler />
      <ForumHeader />

      <div className="w-full max-w-7xl mx-auto px-2 sm:px-3 py-1 sm:py-2 overflow-x-hidden">
        <div className="flex gap-3 w-full">
          {/* Sidebar - Left side on desktop, hidden on mobile */}
          {!isMobile && (
            <aside className="w-72 flex-shrink-0 forum-spacing overflow-x-hidden">
              <ForumSidebarNav />
            </aside>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0 w-full overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Footer */}
      <Footer />
      
      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNav />}
    </div>
  );
};
