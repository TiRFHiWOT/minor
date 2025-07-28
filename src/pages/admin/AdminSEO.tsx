import React from 'react';
import { CategorySeoManager } from '@/components/admin/CategorySeoManager';
import { TopicSeoManager } from '@/components/admin/TopicSeoManager';
import { HomePageSeoManager } from '@/components/admin/HomePageSeoManager';
import { RSSSettings } from '@/components/admin/RSSSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Tag, Home, Rss } from 'lucide-react';

export default function AdminSEO() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SEO Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage SEO metadata for categories and topics to improve search engine optimization
        </p>
      </div>

      <Tabs defaultValue="home" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-[800px]">
          <TabsTrigger value="home" className="gap-2">
            <Home className="h-4 w-4" />
            Home Page
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <Tag className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="topics" className="gap-2">
            <Search className="h-4 w-4" />
            Topics
          </TabsTrigger>
          <TabsTrigger value="rss" className="gap-2">
            <Rss className="h-4 w-4" />
            RSS Feed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="home" className="space-y-6">
          <HomePageSeoManager />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <CategorySeoManager />
        </TabsContent>

        <TabsContent value="topics" className="space-y-6">
          <TopicSeoManager />
        </TabsContent>

        <TabsContent value="rss" className="space-y-6">
          <RSSSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}