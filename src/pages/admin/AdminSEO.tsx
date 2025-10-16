import React from "react";
import { CategorySeoManager } from "@/components/admin/CategorySeoManager";
import { TopicSeoManager } from "@/components/admin/TopicSeoManager";
import { HomePageSeoManager } from "@/components/admin/HomePageSeoManager";
import { SeoGlobalSettings } from "@/components/admin/SeoGlobalSettings";
import { RSSSettings } from "@/components/admin/RSSSettings";
import { SitemapManager } from "@/components/admin/SitemapManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Tag, Home, Rss, Map, Settings } from "lucide-react";

export default function AdminSEO() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SEO Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage SEO metadata for categories and topics to improve search engine
          optimization
        </p>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList
          className="w-full flex items-center justify-between overflow-x-auto scrollbar-hide"
          style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
        >
          <TabsTrigger value="settings" className="gap-2 w-full">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="home" className="gap-2 w-full">
            <Home className="h-4 w-4" />
            Home Page
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2 w-full">
            <Tag className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="topics" className="gap-2 w-full">
            <Search className="h-4 w-4" />
            Topics
          </TabsTrigger>
          <TabsTrigger value="sitemap" className="gap-2 w-full">
            <Map className="h-4 w-4" />
            Sitemap
          </TabsTrigger>
          <TabsTrigger value="rss" className="gap-2 w-full">
            <Rss className="h-4 w-4" />
            RSS Feed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <SeoGlobalSettings />
        </TabsContent>

        <TabsContent value="home" className="space-y-6">
          <HomePageSeoManager />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <CategorySeoManager />
        </TabsContent>

        <TabsContent value="topics" className="space-y-6">
          <TopicSeoManager />
        </TabsContent>

        <TabsContent value="sitemap" className="space-y-6">
          <SitemapManager />
        </TabsContent>

        <TabsContent value="rss" className="space-y-6">
          <RSSSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
