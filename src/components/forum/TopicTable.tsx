import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Pin,
  Lock,
  TrendingUp,
  MessageSquare,
  Eye,
  User,
  Clock,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminControls } from "./AdminControls";
import { MoveTopicModal } from "@/components/admin/MoveTopicModal";
import { useCanMoveTopic } from "@/hooks/useCanMoveTopic";
import { useIsMobile } from "@/hooks/use-mobile";

declare global {
  interface Window {
    googletag: any;
  }
}

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
  loading,
}) => {
  const { canMoveTopic } = useCanMoveTopic();
  const isMobile = useIsMobile();
  const [moveTopicModal, setMoveTopicModal] = useState<{
    isOpen: boolean;
    topic: any;
  }>({
    isOpen: false,
    topic: null,
  });
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
        <p className="text-muted-foreground">
          Be the first to start a discussion!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      {/* Table Header - Hidden on mobile */}
      <div className="forum-header px-3 py-2 border-b hidden md:block">
        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
          <div className="col-span-10">Topic</div>
          <div className="col-span-1 text-center">Replies</div>
          <div className="col-span-1 text-center">Views</div>
        </div>
      </div>

      {/* Topic Rows */}
      <div className="forum-spacing">
        {topics.map((topic, index) => {
          const isHot = topic.hot_score > 10;
          const isNew =
            new Date(topic.created_at) >
            new Date(Date.now() - 24 * 60 * 60 * 1000);

          return (
            <React.Fragment key={topic.id}>
              <div className="topic-row px-2 md:px-3 py-1">
                {/* Mobile Layout */}
                <div className="md:hidden">
                  <div className="flex flex-col space-y-1">
                    {/* Topic Header */}
                    <div className="flex items-start gap-1">
                      {/* Status Icons */}
                      <div className="flex items-center gap-0.5 mt-0.5 flex-shrink-0">
                        {topic.is_pinned && (
                          <Pin className="h-2.5 w-2.5 forum-status-pinned" />
                        )}
                        {topic.is_locked && (
                          <Lock className="h-2.5 w-2.5 forum-status-locked" />
                        )}
                        {isHot && (
                          <TrendingUp className="h-2.5 w-2.5 forum-status-hot" />
                        )}
                      </div>

                      {/* Topic Title and Category */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <Link
                            to={
                              topic.slug
                                ? `/${categorySlug || topic.category_slug}/${
                                    topic.slug
                                  }`
                                : `/topic/${topic.id}`
                            }
                            className="font-medium text-foreground hover:text-primary transition-colors text-sm min-w-0 flex-1 line-clamp-2"
                            title={topic.title}
                          >
                            {topic.title}
                          </Link>
                          {isNew && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-1 py-0 forum-status-new flex-shrink-0"
                            >
                              NEW
                            </Badge>
                          )}
                        </div>

                        {/* Category */}
                        {showCategory &&
                          (topic.category_name || topic.categories?.name) && (
                            <div className="text-xs text-muted-foreground">
                              <Link
                                to={`/category/${
                                  topic.category_slug || topic.categories?.slug
                                }`}
                                className="hover:text-primary transition-colors"
                              >
                                {topic.category_name || topic.categories?.name}
                              </Link>
                            </div>
                          )}
                      </div>

                      {/* Mobile Admin Controls */}
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {canMoveTopic(topic) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setMoveTopicModal({
                                isOpen: true,
                                topic: {
                                  id: topic.id,
                                  title: topic.title,
                                  currentCategoryId: topic.category_id,
                                  currentCategoryName:
                                    topic.category_name ||
                                    topic.categories?.name,
                                },
                              })
                            }
                            className="h-5 w-5 p-0"
                            title="Move topic"
                          >
                            <ArrowRight className="h-2.5 w-2.5" />
                          </Button>
                        )}
                        <AdminControls content={topic} contentType="topic" />
                      </div>
                    </div>

                    {/* Compact Stats and Last Activity with Latest Post Button */}
                    <div className="flex items-center justify-between text-xs">
                      {/* Stats */}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="flex items-center gap-0.5">
                          <MessageSquare className="h-2.5 w-2.5" />
                          <span>{topic.reply_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Eye className="h-2.5 w-2.5" />
                          <span>{topic.view_count || 0}</span>
                        </div>
                      </div>

                      {/* Last Activity with Latest Post Button */}
                      {topic.last_reply_at ? (
                        <div className="flex items-center gap-1">
                          <Link
                            to={`${
                              topic.slug
                                ? `/${categorySlug || topic.category_slug}/${
                                    topic.slug
                                  }`
                                : `/topic/${topic.id}`
                            }${
                              topic.last_post_id
                                ? `#post-${topic.last_post_id}`
                                : ""
                            }`}
                            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Avatar className="h-2.5 w-2.5">
                              <AvatarImage src={topic.last_reply_avatar} />
                              <AvatarFallback className="text-xs">
                                {(topic.last_reply_username || "A")
                                  .charAt(0)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate max-w-16 text-xs">
                              {topic.last_reply_username || "Latest post"}
                            </span>
                            <span>•</span>
                            <span className="text-xs">
                              {formatDistanceToNow(
                                new Date(topic.last_reply_at),
                                { addSuffix: false }
                              )}
                            </span>
                          </Link>
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="text-xs px-1 py-0 h-5 ml-1"
                          >
                            <Link
                              to={`${
                                topic.slug
                                  ? `/${categorySlug || topic.category_slug}/${
                                      topic.slug
                                    }`
                                  : `/topic/${topic.id}`
                              }${
                                topic.last_post_id
                                  ? `#post-${topic.last_post_id}`
                                  : ""
                              }`}
                            >
                              <ChevronRight className="h-2.5 w-2.5" />
                            </Link>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          No replies
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:block">
                  <div className="grid grid-cols-12 gap-1 items-center">
                    {/* Topic Info */}
                    <div className="col-span-10 min-w-0">
                      <div className="flex items-center gap-1">
                        {/* Status Icons */}
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          {topic.is_pinned && (
                            <Pin className="h-2.5 w-2.5 forum-status-pinned" />
                          )}
                          {topic.is_locked && (
                            <Lock className="h-2.5 w-2.5 forum-status-locked" />
                          )}
                          {isHot && (
                            <TrendingUp className="h-2.5 w-2.5 forum-status-hot" />
                          )}
                        </div>

                        {/* Topic Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <Link
                              to={
                                topic.slug
                                  ? `/${categorySlug || topic.category_slug}/${
                                      topic.slug
                                    }`
                                  : `/topic/${topic.id}`
                              }
                              className="font-medium text-foreground hover:text-primary transition-colors text-sm min-w-0 flex-1"
                              title={topic.title}
                            >
                              {topic.title}
                            </Link>
                            {isNew && (
                              <Badge
                                variant="secondary"
                                className="text-xs px-1 py-0 forum-status-new flex-shrink-0"
                              >
                                NEW
                              </Badge>
                            )}
                          </div>

                          {/* Category and Last Activity - Inline */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {showCategory &&
                              (topic.category_name ||
                                topic.categories?.name) && (
                                <>
                                  <Link
                                    to={`/category/${
                                      topic.category_slug ||
                                      topic.categories?.slug
                                    }`}
                                    className="hover:text-primary transition-colors"
                                  >
                                    {topic.category_name ||
                                      topic.categories?.name}
                                  </Link>
                                  <span>•</span>
                                </>
                              )}

                            {/* Last Activity with Latest Post Navigation */}
                            {topic.last_reply_at ? (
                              <Link
                                to={`${
                                  topic.slug
                                    ? `/${
                                        categorySlug || topic.category_slug
                                      }/${topic.slug}`
                                    : `/topic/${topic.id}`
                                }${
                                  topic.last_post_id
                                    ? `#post-${topic.last_post_id}`
                                    : ""
                                }`}
                                className="flex items-center gap-1 hover:text-primary transition-colors"
                                title="Go to latest post"
                              >
                                <Avatar className="h-3 w-3 flex-shrink-0">
                                  <AvatarImage src={topic.last_reply_avatar} />
                                  <AvatarFallback className="text-xs">
                                    {(topic.last_reply_username || "A")
                                      .charAt(0)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span>
                                  {topic.last_reply_username || "Latest post"} •{" "}
                                  {formatDistanceToNow(
                                    new Date(topic.last_reply_at),
                                    { addSuffix: false }
                                  )}
                                </span>
                                <ChevronRight className="h-2.5 w-2.5 ml-1" />
                              </Link>
                            ) : (
                              <span>No replies yet</span>
                            )}
                          </div>
                        </div>

                        {/* Admin Controls */}
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          {canMoveTopic(topic) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setMoveTopicModal({
                                  isOpen: true,
                                  topic: {
                                    id: topic.id,
                                    title: topic.title,
                                    currentCategoryId: topic.category_id,
                                    currentCategoryName:
                                      topic.category_name ||
                                      topic.categories?.name,
                                  },
                                })
                              }
                              className="h-5 w-5 p-0"
                              title="Move topic"
                            >
                              <ArrowRight className="h-2.5 w-2.5" />
                            </Button>
                          )}
                          <AdminControls content={topic} contentType="topic" />
                        </div>
                      </div>
                    </div>

                    {/* Compact Replies and Views */}
                    <div className="col-span-2">
                      <div className="grid grid-cols-2 gap-1 text-center">
                        {/* Replies */}
                        <div className="text-xs font-medium">
                          {topic.reply_count || 0}
                        </div>
                        {/* Views */}
                        <div className="text-xs text-muted-foreground">
                          {topic.view_count || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Move Topic Modal */}
      <MoveTopicModal
        topic={moveTopicModal.topic}
        isOpen={moveTopicModal.isOpen}
        onClose={() => setMoveTopicModal({ isOpen: false, topic: null })}
      />
    </div>
  );
};
