
import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Clock, Star, MessageSquare, User as UserIcon, Facebook, Instagram, Twitter, Youtube, Rss } from 'lucide-react';
import { useHotTopics } from '@/hooks/useHotTopics';
import { useTopics } from '@/hooks/useTopics';
import { useHotTopicsLegacy } from '@/hooks/useHotTopicsLegacy';
import { useMostCommentedTopics } from '@/hooks/useMostCommentedTopics';
import { useMostViewedTopics } from '@/hooks/useMostViewedTopics';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useForumSettings } from '@/hooks/useForumSettings';
import { PaginationControls } from '@/components/ui/pagination-controls';

import { TopicTable } from './TopicTable';
import { ReportModal } from './ReportModal';
import { QuickTopicModal } from './QuickTopicModal';
import { ResponsiveAdBanner } from '@/components/ads/ResponsiveAdBanner';
import AdMetricsProBanner from '../AdMetricsProBannerProps/AdMetricsProBannerProps';

export const ForumHome = () => {
  const { user } = useAuth();
  const { getSetting } = useForumSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    topicId?: string;
  }>({
    isOpen: false,
  });
  
  // Pagination state for each tab
  const [hotPage, setHotPage] = useState(1);
  const [newPage, setNewPage] = useState(1);
  const [topPage, setTopPage] = useState(1);
  
  const sortBy = searchParams.get('sort') || 'new';
  
  // Paginated data hooks
  const { data: hotTopicsData, isLoading: hotTopicsLoading } = useMostCommentedTopics(hotPage, 10);
  const { data: newTopicsData, isLoading: newTopicsLoading } = useTopics(undefined, newPage, 10, 'last_reply_at');
  const { data: topTopicsData, isLoading: topTopicsLoading } = useMostViewedTopics(topPage, 10);
  
  const { data: level1Forums } = useCategories(null, 1); // Only Level 1 forums
  const { data: level2Forums } = useCategories(undefined, 2); // Province/State forums
  

  const handleSortChange = (value: string) => {
    if (value === 'new') {
      setSearchParams({});
    } else {
      setSearchParams({ sort: value });
    }
    // Reset pagination when changing sort
    setHotPage(1);
    setNewPage(1);
    setTopPage(1);
  };

  const handleReport = (topicId: string) => {
    setReportModal({
      isOpen: true,
      topicId,
    });
  };

  const isLoading = hotTopicsLoading || newTopicsLoading || topTopicsLoading;

  return (
    <div className="forum-spacing relative w-full overflow-x-hidden max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {getSetting('forum_name', 'Minor Hockey Talks')}
        </h1>
        <p className="text-muted-foreground">
          {getSetting('forum_description', 'A community forum for minor hockey discussions')}
        </p>
        
        {/* Social Media Links */}
        {(() => {
          // Clean URLs by removing JSON encoding quotes
          const cleanUrl = (url: string) => {
            if (!url || typeof url !== 'string') return '';
            return url.replace(/^"(.*)"$/, '$1').trim();
          };

          const facebookUrl = cleanUrl(getSetting('social_facebook', ''));
          const twitterUrl = cleanUrl(getSetting('social_twitter', ''));
          const instagramUrl = cleanUrl(getSetting('social_instagram', ''));
          const youtubeUrl = cleanUrl(getSetting('social_youtube', ''));
          const isRssEnabled = getSetting('rss_enabled', false);

          // Validate URLs start with http/https
          const isValidUrl = (url: string) => {
            return url && (url.startsWith('http://') || url.startsWith('https://'));
          };

          const validFacebook = isValidUrl(facebookUrl);
          const validTwitter = isValidUrl(twitterUrl);
          const validInstagram = isValidUrl(instagramUrl);
          const validYoutube = isValidUrl(youtubeUrl);

          // Only show if at least one valid social link exists or RSS is enabled
          const hasValidSocialLinks = validFacebook || validTwitter || validInstagram || validYoutube || isRssEnabled;

          if (!hasValidSocialLinks) return null;

          return (
            <div className="flex items-center gap-3 mt-3">
              <span className="text-sm text-muted-foreground">Follow us:</span>
              {validFacebook && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {validTwitter && (
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {validInstagram && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {validYoutube && (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Youtube className="h-5 w-5" />
                </a>
              )}
              {isRssEnabled && (
                <a
                  href="/rss"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Rss className="h-5 w-5" />
                </a>
              )}
            </div>
          );
        })()}
      </div>

      {/* Ad Banner - Above Content */}
      {/* <ResponsiveAdBanner 
        format="horizontal"
        className="border-b border-border"
      /> */}

      {/* Leaderboard Top */}
      <AdMetricsProBanner adId="div-gpt-ad-1715358540790-0" minWidth={300} minHeight={50} />

      {/* Sort Tabs */}
      <Tabs value={sortBy} onValueChange={handleSortChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="new" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>New</span>
          </TabsTrigger>
          <TabsTrigger value="hot" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Hot</span>
          </TabsTrigger>
          <TabsTrigger value="top" className="flex items-center space-x-2">
            <Star className="h-4 w-4" />
            <span>Top</span>
          </TabsTrigger>
        </TabsList>

        {/* Hot Posts */}
        <TabsContent value="hot" className="forum-spacing">
          <TopicTable 
            topics={hotTopicsData?.data || []}
            loading={hotTopicsLoading}
            showCategory={true}
          />
          {hotTopicsData && hotTopicsData.data.length > 0 && (
            <PaginationControls
              currentPage={hotPage}
              totalPages={hotTopicsData.totalPages}
              totalItems={hotTopicsData.totalCount}
              itemsPerPage={10}
              onPageChange={setHotPage}
              loading={hotTopicsLoading}
            />
          )}
        </TabsContent>

        {/* New Posts */}
        <TabsContent value="new" className="forum-spacing">
          <TopicTable 
            topics={newTopicsData?.data?.map(topic => ({
              ...topic,
              username: topic.profiles?.username || null,
              avatar_url: topic.profiles?.avatar_url || null,
              category_name: topic.categories?.name || 'General',
              category_color: topic.categories?.color || '#3b82f6',
              category_slug: topic.categories?.slug || '',
              slug: topic.slug,
              hot_score: 0,
              last_post_id: topic.last_post_id,
              parent_category_id: topic.categories?.parent_category_id || null,
              parent_category_slug: null,
              last_reply_username: topic.last_reply_username,
              last_reply_avatar: topic.last_reply_avatar
            })) || []}
            loading={newTopicsLoading}
            showCategory={true}
          />
          {newTopicsData && newTopicsData.data.length > 0 && (
            <PaginationControls
              currentPage={newPage}
              totalPages={newTopicsData.totalPages}
              totalItems={newTopicsData.totalCount}
              itemsPerPage={10}
              onPageChange={setNewPage}
              loading={newTopicsLoading}
            />
          )}
        </TabsContent>

        {/* Top Posts */}
        <TabsContent value="top" className="forum-spacing">
          <TopicTable 
            topics={topTopicsData?.data || []}
            loading={topTopicsLoading}
            showCategory={true}
          />
          {topTopicsData && topTopicsData.data.length > 0 && (
            <PaginationControls
              currentPage={topPage}
              totalPages={topTopicsData.totalPages}
              totalItems={topTopicsData.totalCount}
              itemsPerPage={10}
              onPageChange={setTopPage}
              loading={topTopicsLoading}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Ad Banner - Between Sections */}
      {/* <ResponsiveAdBanner 
        format="square"
        className="my-6"
      /> */}

      {/* Content One */}
      <AdMetricsProBanner adId="div-gpt-ad-1715358598569-0" minWidth={300} minHeight={50} />

      {/* Forums Section */}
      <div className="forum-spacing">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Browse Main Forums</h2>
        </div>
        
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" style={{ minHeight: '200px' }}>
          {level1Forums?.map((forum) => (
            <Link
              key={forum.id}
              to={`/category/${forum.slug}`}
              className="block"
            >
              <Card className="p-3 hover:bg-forum-row-hover transition-colors cursor-pointer border border-forum-border-subtle" style={{ minHeight: '80px' }}>
                <div className="flex items-center space-x-2 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: forum.color }}
                  />
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors text-sm">
                    {forum.name}
                  </h3>
                </div>
                {forum.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {forum.description}
                  </p>
                )}
              </Card>
            </Link>
          ))}
        </div>
        
        {(!level1Forums || level1Forums.length === 0) && (
          <Card className="p-6 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-semibold mb-2">No forums available</h3>
            <p className="text-muted-foreground text-sm">Forums will appear here once they are created.</p>
          </Card>
        )}
      </div>

      {/* Ad Banner - Between Forum Sections */}
      {/* <ResponsiveAdBanner 
        format="horizontal"
        className="my-6"
      /> */}

      {/* Content Two */}
      <AdMetricsProBanner adId="div-gpt-ad-1715358620345-0" minWidth={300} minHeight={50} />

      {/* Province/State Forums Section */}
      <div className="forum-spacing">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Browse Province / State Forums</h2>
        </div>
        
        {level2Forums && level2Forums.length > 0 ? (
          <div className="forum-spacing">
            {(() => {
              // Filter out tournament forums and group by country using parent_category_id
              const canadianForums = level2Forums.filter(forum => 
                forum.parent_category_id === '11111111-1111-1111-1111-111111111111'
              ).sort((a, b) => (a.region || '').localeCompare(b.region || ''));
              
              const usaForums = level2Forums.filter(forum => 
                forum.parent_category_id === '22222222-2222-2222-2222-222222222222'
              ).sort((a, b) => (a.region || '').localeCompare(b.region || ''));
              
              const countries = [];
              if (canadianForums.length > 0) {
                countries.push({ name: 'Canada', forums: canadianForums });
              }
              if (usaForums.length > 0) {
                countries.push({ name: 'USA', forums: usaForums });
              }
              
              return countries.map((country, index) => (
                <div key={country.name}>
                   
                  <div className="forum-spacing">
                    <h3 className="text-base font-semibold text-foreground border-b pb-1 forum-header">
                      {country.name}
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {country.forums.map((forum) => (
                        <Link
                          key={forum.id}
                          to={`/category/${forum.slug}`}
                          className="block"
                        >
                          <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center space-x-2 mb-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: forum.color }}
                              />
                              <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                                {forum.name}
                              </h4>
                            </div>
                            {forum.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {forum.description}
                              </p>
                            )}
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                     {index === 0 && (
                      <div>
                        {/* Content Three */}
                        <AdMetricsProBanner
                          adId="div-gpt-ad-1753889678213-0"
                          minWidth={300}
                          minHeight={50}
                        />
                      </div>
                    )}
                </div>
                
              ));
            })()}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No province/state forums available</h3>
            <p className="text-muted-foreground">Province and state forums will appear here once they are created.</p>
          </Card>
        )}
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ isOpen: false })}
        topicId={reportModal.topicId}
        contentType="topic"
      />
    </div>
  );
};
