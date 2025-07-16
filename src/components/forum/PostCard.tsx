import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, ArrowUp, ArrowDown, Pin, Lock, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { HotTopic } from '@/hooks/useHotTopics';
import { useIsMobile } from '@/hooks/use-mobile';
import { AdminControls } from './AdminControls';
import { AdminTempUserInfo } from '@/components/admin/AdminTempUserInfo';
import { generateCategoryUrl } from '@/utils/urlHelpers';
import { htmlToText } from '@/utils/htmlToText';

interface PostCardProps {
  topic: HotTopic;
  onReport?: (topicId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = React.memo(({ topic, onReport }) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Generate the category URL for the clickable badge
  const categoryUrl = generateCategoryUrl({
    slug: topic.category_slug,
    parent_category_id: topic.parent_category_id,
    parent_category: topic.parent_category_slug ? {
      slug: topic.parent_category_slug
    } : undefined
  });

  return (
    <div className="bg-card border-b border-border hover:bg-muted/50 transition-colors">
      <div className="p-3 md:p-4">
        {/* Mobile-first layout */}
        <div className="flex space-x-3">
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Category and meta info */}
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <Link 
                to={categoryUrl}
                className="inline-block hover:opacity-80 transition-opacity"
              >
                <Badge 
                  variant="secondary" 
                  className="text-xs px-2 py-0.5 cursor-pointer"
                  style={{ 
                    borderColor: topic.category_color,
                    color: topic.category_color,
                    backgroundColor: `${topic.category_color}10`
                  }}
                >
                  {topic.category_name}
                </Badge>
              </Link>
              {topic.is_pinned && (
                <div className="flex items-center space-x-1 text-green-600">
                  <Pin className="h-3 w-3" />
                  <span className="text-xs font-medium">Pinned</span>
                </div>
              )}
              {topic.is_locked && (
                <div className="flex items-center space-x-1 text-red-600">
                  <Lock className="h-3 w-3" />
                  <span className="text-xs font-medium">Locked</span>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="flex items-start justify-between mb-2">
              <Link 
                to={topic.category_slug && topic.slug ? `/${topic.category_slug}/${topic.slug}` : `/topic/${topic.id}`}
                className="block group flex-1"
              >
                <h3 className="text-base md:text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                  {topic.title}
                </h3>
              </Link>
              <AdminControls 
                content={topic} 
                contentType="topic"
              />
            </div>

            {/* Content preview - only on desktop */}
            {!isMobile && topic.content && (
              <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed mb-3">
                {htmlToText(topic.content)}
              </p>
            )}

            {/* Admin tracking info for temporary users */}
            {user?.role === 'admin' && !topic.username && (
              <AdminTempUserInfo userId={topic.author_id} className="mb-3" />
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-3">
                <span className="font-medium">
                  {topic.username || 'Guest'}
                </span>
                <span>Created {formatDistanceToNow(new Date(topic.created_at))} ago</span>
                {topic.last_reply_at && topic.reply_count > 0 && (
                  <>
                    <span>•</span>
                    {topic.last_post_id ? (
                      <Link
                        to={`${topic.category_slug && topic.slug ? `/${topic.category_slug}/${topic.slug}` : `/topic/${topic.id}`}#post-${topic.last_post_id}`}
                        className="hover:text-primary transition-colors"
                      >
                        Last reply {formatDistanceToNow(new Date(topic.last_reply_at))} ago
                      </Link>
                    ) : (
                      <span>Last reply {formatDistanceToNow(new Date(topic.last_reply_at))} ago</span>
                    )}
                  </>
                )}
                <Link 
                  to={topic.category_slug && topic.slug ? `/${topic.category_slug}/${topic.slug}` : `/topic/${topic.id}`}
                  className="flex items-center space-x-1 hover:text-primary transition-colors"
                >
                  <MessageSquare className="h-3 w-3" />
                  <span>{topic.reply_count}</span>
                </Link>
              </div>

              {/* Report button - mobile friendly */}
              {onReport && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    onReport(topic.id);
                  }}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-orange-500"
                  title="Report"
                >
                  <Flag className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});