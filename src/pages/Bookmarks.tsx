import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTopicBookmarks } from '@/hooks/useTopicBookmarks';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Eye, MessageSquare, Bell, BellOff, Bookmark } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Bookmarks() {
  const { user, loading: authLoading } = useAuth();
  const { bookmarks, isLoading, toggleNotifications } = useTopicBookmarks();
  
  // Debug logging
  console.log('Bookmarks Page - User:', user?.id, 'Auth Loading:', authLoading, 'Bookmarks Loading:', isLoading, 'Bookmarks:', bookmarks?.length || 0);

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              Your Bookmarked Topics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              Your Bookmarked Topics
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <div className="space-y-6">
              <Bookmark className="h-16 w-16 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Save Topics for Later</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Bookmark topics you want to follow and get notified when new replies are posted. 
                  Never miss important conversations!
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/register">Create Account</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              Your Bookmarked Topics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!bookmarks || bookmarks.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              Your Bookmarked Topics
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <div className="space-y-4">
              <Bookmark className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">No bookmarks yet</p>
                <p className="text-muted-foreground">
                  Start bookmarking topics to keep track of conversations you're interested in.
                </p>
              </div>
              <Button asChild>
                <Link to="/">Browse Topics</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleToggleNotifications = (topicId: string, enabled: boolean) => {
    toggleNotifications.mutate({ topicId, enabled });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            Your Bookmarked Topics ({bookmarks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bookmarks.map((bookmark) => {
              const topic = bookmark.topics as any;
              const category = topic?.categories;
              
              return (
                <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {category && (
                            <Badge 
                              variant="secondary" 
                              style={{ backgroundColor: `${category.color}20`, color: category.color }}
                            >
                              {category.name}
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            Bookmarked {formatDistanceToNow(new Date(bookmark.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        
                        <h3 className="font-semibold text-lg mb-2 hover:text-primary">
                          <Link 
                            to={`/${category?.slug}/${topic?.slug}`}
                            className="line-clamp-2"
                          >
                            {topic?.title}
                          </Link>
                        </h3>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {topic?.reply_count || 0} replies
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {topic?.view_count || 0} views
                          </div>
                          {topic?.last_reply_at && (
                            <span>
                              Last activity {formatDistanceToNow(new Date(topic.last_reply_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleNotifications(topic?.id || '', !bookmark.notification_enabled)}
                          disabled={toggleNotifications.isPending}
                          className="flex items-center gap-2"
                        >
                          {bookmark.notification_enabled ? (
                            <>
                              <Bell className="h-4 w-4 text-primary" />
                              <span className="text-sm">Notifications On</span>
                            </>
                          ) : (
                            <>
                              <BellOff className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Notifications Off</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}