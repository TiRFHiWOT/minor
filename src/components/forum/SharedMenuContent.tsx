import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Rss, Bookmark } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useForumSettings } from '@/hooks/useForumSettings';

interface SharedMenuContentProps {
  onNavigate: () => void;
}

export const SharedMenuContent = ({ onNavigate }: SharedMenuContentProps) => {
  const { user, signOut, isAdmin } = useAuth();
  const { data: mainForums } = useCategories(null, 1);
  const { getSetting } = useForumSettings();
  
  const isRssEnabled = getSetting('rss_enabled', false);

  const handleSignOut = async () => {
    await signOut();
    onNavigate();
  };

  return (
    <>
      {/* Main Forums */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Main Forums</h3>
        <div className="space-y-2">
          {mainForums?.map((forum) => (
            <Link
              key={forum.id}
              to={`/category/${forum.slug}`}
              className="flex items-center p-3 rounded-md hover:bg-accent"
              onClick={onNavigate}
            >
              <div 
                className="w-3 h-3 rounded-sm mr-3"
                style={{ backgroundColor: forum.color }}
              />
              <div>
                <div className="font-medium text-sm">{forum.name}</div>
                {forum.description && (
                  <div className="text-xs text-muted-foreground">{forum.description}</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Community Links */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Community</h3>
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/rules" onClick={onNavigate}>Forum Rules</Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/bookmarks" onClick={onNavigate}>
              <Bookmark className="mr-2 h-4 w-4" />
              Bookmarks
            </Link>
          </Button>
          {isRssEnabled && (
            <Button variant="ghost" className="w-full justify-start" asChild>
              <a href="/rss" target="_blank" rel="noopener noreferrer" onClick={onNavigate}>
                <Rss className="mr-2 h-4 w-4" />
                RSS Feed
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* User Actions */}
      <div className="border-t pt-4">
        {user ? (
          <div className="space-y-2">
            <div className="px-3 py-2 text-sm font-medium">{user.username}</div>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/profile" onClick={onNavigate}>Profile</Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/settings" onClick={onNavigate}>Settings</Link>
            </Button>
            {isAdmin && (
              <Button variant="ghost" className="w-full justify-start text-red-600" asChild>
                <Link to="/admin" onClick={onNavigate}>
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Panel
                </Link>
              </Button>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start p-3 h-auto"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button className="w-full" asChild>
              <Link to="/login" onClick={onNavigate}>Sign In</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/register" onClick={onNavigate}>Register</Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
};