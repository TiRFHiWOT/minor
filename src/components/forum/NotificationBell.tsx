import React from 'react';
import { Bell, AlertTriangle, Flag, FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  if (!user) return null;

  const handleNotificationClick = (notificationId: string) => {
    markAsRead.mutate(notificationId);
  };

  const handleMarkAllRead = () => {
    markAllAsRead.mutate();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_report':
        return <Flag className="h-4 w-4 text-orange-500" />;
      case 'content_pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'new_appeal':
        return <FileX className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getNotificationContent = (notification: any) => {
    switch (notification.notification_type) {
      case 'new_report':
        return {
          title: 'New Report Submitted',
          description: `Reason: ${notification.report?.reason || 'Unknown'}`,
          link: '/admin/moderation'
        };
      case 'content_pending':
        return {
          title: 'Content Pending Review',
          description: notification.topic?.title || 'Content requires moderation',
          link: '/admin/moderation'
        };
      case 'new_appeal':
        return {
          title: 'New Appeal Submitted',
          description: 'A user has submitted a moderation appeal',
          link: '/admin/moderation'
        };
      default:
        return {
          title: notification.topic?.title || 'Notification',
          description: 'New activity in a topic you follow',
          link: notification.topic?.categories?.slug && notification.topic?.slug 
            ? `/${notification.topic.categories.slug}/${notification.topic.slug}` 
            : '/'
        };
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-auto p-1 text-xs"
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications && notifications.length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            {notifications.slice(0, 10).map((notification) => {
              const content = getNotificationContent(notification);
              
              return (
                <DropdownMenuItem
                  key={notification.id}
                  asChild
                  className={`p-3 cursor-pointer ${!notification.is_read ? 'bg-muted/50' : ''}`}
                >
                  <Link
                    to={content.link}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      {getNotificationIcon(notification.notification_type)}
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm truncate">
                            {content.title}
                          </span>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {content.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No notifications yet
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};