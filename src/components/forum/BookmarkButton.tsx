import React from 'react';
import { Bookmark, BookmarkCheck, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTopicBookmarks } from '@/hooks/useTopicBookmarks';
import { useAuth } from '@/hooks/useAuth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface BookmarkButtonProps {
  topicId: string;
  variant?: 'default' | 'icon';
  showCount?: boolean;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({ 
  topicId, 
  variant = 'default',
  showCount = false 
}) => {
  const { user } = useAuth();
  const { isBookmarked, bookmarkCount, toggleBookmark, toggleNotifications, isToggling, bookmarks } = useTopicBookmarks(topicId);
  
  if (!user) return null;

  const bookmark = bookmarks?.find(b => b.topic_id === topicId);
  const notificationsEnabled = bookmark?.notification_enabled ?? true;

  const handleToggleBookmark = () => {
    toggleBookmark(topicId);
  };

  const handleToggleNotifications = () => {
    if (bookmark) {
      toggleNotifications.mutate({ 
        topicId, 
        enabled: !notificationsEnabled 
      });
    }
  };

  if (variant === 'icon') {
    return (
      <TooltipProvider>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={isToggling}
              className="h-8 w-8 p-0"
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-4 w-4 text-primary" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleToggleBookmark}>
              {isBookmarked ? (
                <>
                  <BookmarkCheck className="mr-2 h-4 w-4" />
                  Remove Bookmark
                </>
              ) : (
                <>
                  <Bookmark className="mr-2 h-4 w-4" />
                  Bookmark Topic
                </>
              )}
            </DropdownMenuItem>
            {isBookmarked && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleToggleNotifications}>
                  {notificationsEnabled ? (
                    <>
                      <BellOff className="mr-2 h-4 w-4" />
                      Disable Notifications
                    </>
                  ) : (
                    <>
                      <Bell className="mr-2 h-4 w-4" />
                      Enable Notifications
                    </>
                  )}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isBookmarked ? "default" : "outline"}
        size="sm"
        onClick={handleToggleBookmark}
        disabled={isToggling}
        className="flex items-center gap-2"
      >
        {isBookmarked ? (
          <BookmarkCheck className="h-4 w-4" />
        ) : (
          <Bookmark className="h-4 w-4" />
        )}
        {isBookmarked ? 'Bookmarked' : 'Bookmark'}
        {showCount && bookmarkCount > 0 && (
          <span className="text-xs opacity-75">({bookmarkCount})</span>
        )}
      </Button>

      {isBookmarked && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleNotifications}
                disabled={toggleNotifications.isPending}
                className="h-8 w-8 p-0"
              >
                {notificationsEnabled ? (
                  <Bell className="h-4 w-4 text-primary" />
                ) : (
                  <BellOff className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {notificationsEnabled ? 'Notifications enabled' : 'Notifications disabled'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};