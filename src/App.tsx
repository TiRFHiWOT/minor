
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ToastErrorBoundary } from "./components/ToastErrorBoundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "./components/auth/AuthProvider";
import { MetadataProvider } from "./components/seo/MetadataProvider";
import { ScrollToTop } from "./components/ScrollToTop";
import { OnlineUsersProvider } from "./contexts/OnlineUsersContext";
import { ForumLayout } from "./components/forum/ForumLayout";
import { AdminLayout } from "./components/admin/AdminLayout";
import { RedirectHandler } from "./components/RedirectHandler";
import { ForumHome } from "./components/forum/ForumHome";
import { TopicView } from "./components/forum/TopicView";
import { CategoryView } from "./components/forum/CategoryView";
import { CreateTopic } from "./components/forum/CreateTopic";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import ForumRules from "./pages/ForumRules";

import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Sitemap from "./pages/Sitemap";
import Topics from "./pages/Topics";
import Bookmarks from "./pages/Bookmarks";
import { Categories } from "./pages/Categories";
import Search from "./pages/Search";
import NotFound from "./pages/NotFound";
import AdminPage from "./pages/admin/AdminPage";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminContent from "./pages/admin/AdminContent";
import AdminModeration from "./pages/admin/AdminModeration";
import AdminSpam from "./pages/admin/AdminSpam";
import AdminSEO from "./pages/admin/AdminSEO";

import AdminSettings from "./pages/admin/AdminSettings";
import AdminBlogPage from "./pages/admin/AdminBlog";

import { AnalyticsProvider } from "./components/analytics/AnalyticsProvider";
import { CookieConsent } from "./components/cookies/CookieConsent";
import { CookieDebugPanel } from "./components/cookies/CookieDebugPanel";
import { MaintenanceWrapper } from "./components/MaintenanceWrapper";
import { StickyBanner } from "./components/StickyBanner";

import { IPTrackingWrapper } from "./components/IPTrackingWrapper";
import { VPNBlocked } from "./pages/VPNBlocked";
import { VPNGuard } from "./components/VPNGuard";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RSSRedirect } from "./components/RSSRedirect";
import { AdErrorBoundary } from "./components/AdErrorBoundary";

import { SessionTimeout } from "./components/security/SessionTimeout";
import { OldUrlRedirectWrapper } from "./components/OldUrlRedirectWrapper";
import RouteChangeHandler from "./components/RouteChangeHandler/routeChangeHandler";



const queryClient = new QueryClient();

const App = () => (
  <AdErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <AuthProvider>
            <OnlineUsersProvider>
            
            <SessionTimeout timeoutDuration={30} warningTime={5} />
            <StickyBanner />
            
            <CookieConsent />
            <ToastErrorBoundary>
              <Toaster />
              <Sonner />
            </ToastErrorBoundary>
            <BrowserRouter>
              <AnalyticsProvider>
                <IPTrackingWrapper>
                  <CookieDebugPanel />
                  <ScrollToTop />
                  <RouteChangeHandler />
                  <MetadataProvider>
                   <ErrorBoundary>
                    <MaintenanceWrapper>
                 <Routes>
                    {/* Static redirects handled by _redirects file, not React */}
                    
                    
                    {/* VPN blocked page - outside VPN guard */}
                    <Route path="/vpn-blocked" element={<VPNBlocked />} />
                   
                   {/* All other routes wrapped in VPN guard */}
                   <Route path="/*" element={
                      <VPNGuard>
                       <Routes>
                           {/* Special routes */}
                          
                         
                         {/* Authentication routes - standalone pages */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                  
                  {/* Admin routes - wrapped in AdminLayout */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminPage />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="content" element={<AdminContent />} />
                    <Route path="blog" element={<AdminBlogPage />} />
                    <Route path="moderation" element={<AdminModeration />} />
                    <Route path="spam" element={<AdminSpam />} />
                    
                    <Route path="seo" element={<AdminSEO />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>
                  
                   {/* RSS Feed Route */}
                   <Route path="/rss" element={<RSSRedirect />} />
                   
                  
                   {/* Forum routes - wrapped in OldUrlRedirectWrapper and ForumLayout */}
                   <Route path="/" element={<OldUrlRedirectWrapper><ForumLayout /></OldUrlRedirectWrapper>}>
                     <Route index element={<ForumHome />} />
                    {/* New hierarchical URL structure */}
                    <Route path=":categorySlug/:topicSlug" element={
                        <MetadataProvider>
                          <TopicView />
                        </MetadataProvider>
                    } />
                    <Route path=":categorySlug/:subcategorySlug/:topicSlug" element={
                        <MetadataProvider>
                          <TopicView />
                        </MetadataProvider>} />
                    <Route path=":categorySlug" element={
                      <MetadataProvider>
                        <CategoryView />
                      </MetadataProvider>
                    } />
                    <Route path=":categorySlug/:subcategorySlug" element={
                      <MetadataProvider>
                        <CategoryView />
                      </MetadataProvider>
                    } />
                    {/* Legacy UUID-based redirects */}
                    <Route path="topic/:topicId" element={<TopicView />} />
                    <Route path="category/:categoryId" element={
                      <MetadataProvider>
                        <CategoryView />
                      </MetadataProvider>
                    } />
                     <Route path="create" element={<CreateTopic />} />
                     <Route path="topics" element={<Topics />} />
                     <Route path="categories" element={<Categories />} />
                     <Route path="search" element={<Search />} />
                     <Route path="profile" element={<Profile />} />
                     <Route path="bookmarks" element={<Bookmarks />} />
                     <Route path="settings" element={<Settings />} />
                     <Route path="terms" element={<Terms />} />
                     <Route path="privacy" element={<Privacy />} />
                     <Route path="rules" element={<ForumRules />} />
                      <Route path="blog" element={<Blog />} />
                       <Route path="blog/:slug" element={<BlogPost />} />
                      <Route path="sitemap" element={<Sitemap />} />
                    </Route>
                   
                   
                   {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                   {/* RedirectHandler for old URLs - must be before NotFound */}
                   <Route path="*" element={
                     <>
                       <RedirectHandler />
                       <NotFound />
                     </>
                   } />
                      </Routes>
                    </VPNGuard>
                  } />
                </Routes>
                   </MaintenanceWrapper>
                   </ErrorBoundary>
                </MetadataProvider>
                </IPTrackingWrapper>
              </AnalyticsProvider>
            </BrowserRouter>
             </OnlineUsersProvider>
           </AuthProvider>
         </TooltipProvider>
       </HelmetProvider>
     </QueryClientProvider>
   </AdErrorBoundary>
 );

export default App;
