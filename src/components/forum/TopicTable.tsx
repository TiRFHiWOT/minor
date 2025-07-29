import React from 'react';
import { Link } from 'react-router-dom';
import { Pin, Lock, TrendingUp, MessageSquare, Eye, User, Clock, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AdminControls } from './AdminControls';

interface TopicTableProps {
  topics: any[];
  categorySlug?: string;
  showCategory?: boolean;
  loading?: boolean;
}

export const TopicTable: React.FC<TopicTableProps> = ({ 
  topics, 
  categorySlug, 
  showCategory = false,
  loading 
}) => {
  if (loading) {
    return (
      <div className="forum-spacing">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-muted/50 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (!topics || topics.length === 0) {
    return (
      <div className="text-center py-8 bg-card rounded-lg border">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No topics yet</h3>
        <p className="text-muted-foreground">Be the first to start a discussion!</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      {/* Table Header */}
      <div className="forum-header px-3 py-2 border-b">
        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
          <div className="col-span-8 md:col-span-10">Topic</div>
          <div className="col-span-2 md:col-span-1 text-center">Replies</div>
          <div className="col-span-2 md:col-span-1 text-center">Views</div>
        </div>
      </div>

      {/* Topic Rows */}
      <div className="forum-spacing">
        {topics.map((topic, index) => {
          const isHot = topic.hot_score > 10;
          const isNew = new Date(topic.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
          
          return (
            <div key={topic.id} className="topic-row px-3 py-2">
              <div className="grid grid-cols-12 gap-2 items-start">
                {/* Topic Info */}
                <div className="col-span-8 md:col-span-10 min-w-0">
                  <div className="flex items-start gap-2">
                    {/* Status Icons */}
                    <div className="flex items-center gap-1 mt-0.5 flex-shrink-0">
                      {topic.is_pinned && (
                        <Pin className="h-3 w-3 forum-status-pinned" />
                      )}
                      {topic.is_locked && (
                        <Lock className="h-3 w-3 forum-status-locked" />
                      )}
                      {isHot && (
                        <TrendingUp className="h-3 w-3 forum-status-hot" />
                      )}
                      {isNew && (
                        <Badge variant="secondary" className="text-xs px-1 py-0 forum-status-new">
                          NEW
                        </Badge>
                      )}
                    </div>

                    {/* Topic Details */}
                    <div className="min-w-0 flex-1">
                      <Link
                        to={topic.slug ? `/${categorySlug || topic.category_slug}/${topic.slug}` : `/topic/${topic.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors text-sm"
                        title={topic.title}
                      >
                        {topic.title}
                      </Link>
                      
                      {/* Category and Last Activity */}
                      <div className="mt-1 space-y-1">
                        {showCategory && (topic.category_name || topic.categories?.name) && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Link 
                              to={`/category/${topic.category_slug || topic.categories?.slug}`}
                              className="hover:text-primary transition-colors"
                            >
                              {topic.category_name || topic.categories?.name}
                            </Link>
                          </div>
                        )}
                        
                        {/* Last Activity */}
                        {topic.last_reply_at ? (
                          <Link 
                            to={`${topic.slug ? `/${categorySlug || topic.category_slug}/${topic.slug}` : `/topic/${topic.id}`}${topic.last_post_id ? `#post-${topic.last_post_id}` : ''}`}
                            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Avatar className="h-4 w-4 flex-shrink-0">
                              <AvatarImage src={topic.last_reply_avatar} />
                              <AvatarFallback className="text-xs">
                                {(topic.last_reply_username || 'A').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>
                              {topic.last_reply_username || 'Anonymous'} • {formatDistanceToNow(new Date(topic.last_reply_at))} ago
                            </span>
                          </Link>
                        ) : (
                          <div className="text-xs text-muted-foreground">No replies yet</div>
                        )}
                      </div>
                    </div>

                    {/* Admin Controls */}
                    <AdminControls 
                      content={topic} 
                      contentType="topic"
                    />
                  </div>
                </div>

                {/* Replies and Views with Latest Post Button */}
                <div className="col-span-4 md:col-span-2">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Replies */}
                    <div className="text-center">
                      <div className="text-sm font-medium">{topic.reply_count || 0}</div>
                    </div>
                    
                    {/* Views */}
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">{topic.view_count || 0}</div>
                    </div>
                  </div>
                  
                  {/* Latest Post Button spanning both columns */}
                  {topic.last_reply_at && (
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="text-xs px-2 py-1 h-6 w-full mt-2"
                    >
                      <Link 
                        to={`${topic.slug ? `/${categorySlug || topic.category_slug}/${topic.slug}` : `/topic/${topic.id}`}${topic.last_post_id ? `#post-${topic.last_post_id}` : ''}`}
                      >
                        Latest Post
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};