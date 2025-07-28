import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useForumSettings } from '@/hooks/useForumSettings';
import { useToast } from '@/hooks/use-toast';
import { Rss, ExternalLink, Copy } from 'lucide-react';

export const RSSSettings = () => {
  const { getSetting, updateSetting, isUpdating } = useForumSettings();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    rssEnabled: getSetting('rss_enabled', true),
    rssTitle: getSetting('rss_title', getSetting('forum_name', 'Minor Hockey Talks')),
    rssDescription: getSetting('rss_description', 'Latest topics and discussions'),
    rssItemLimit: getSetting('rss_item_limit', 25),
    siteUrl: getSetting('site_url', 'https://rscowwmoeycyxmfslhme.supabase.co')
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await Promise.all([
        updateSetting({ key: 'rss_enabled', value: formData.rssEnabled, type: 'boolean', category: 'rss' }),
        updateSetting({ key: 'rss_title', value: formData.rssTitle, type: 'string', category: 'rss' }),
        updateSetting({ key: 'rss_description', value: formData.rssDescription, type: 'string', category: 'rss' }),
        updateSetting({ key: 'rss_item_limit', value: formData.rssItemLimit, type: 'number', category: 'rss' }),
        updateSetting({ key: 'site_url', value: formData.siteUrl, type: 'string', category: 'general' })
      ]);

      toast({
        title: "RSS settings updated",
        description: "Your RSS feed settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating RSS settings:', error);
      toast({
        title: "Error",
        description: "Failed to update RSS settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "RSS feed URL copied to clipboard.",
    });
  };

  const rssUrl = `${formData.siteUrl}/rss`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Rss className="h-5 w-5" />
            <CardTitle>RSS Feed Settings</CardTitle>
          </div>
          <CardDescription>
            Configure your RSS feed to syndicate content to feed readers and other websites.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="rss-enabled"
                checked={formData.rssEnabled}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, rssEnabled: checked })
                }
              />
              <Label htmlFor="rss-enabled">Enable RSS Feed</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="site-url">Site URL</Label>
              <Input
                id="site-url"
                value={formData.siteUrl}
                onChange={(e) => setFormData({ ...formData, siteUrl: e.target.value })}
                placeholder="https://yourdomain.com"
                required
              />
              <p className="text-sm text-muted-foreground">
                The base URL of your website (used for generating RSS links)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rss-title">RSS Feed Title</Label>
              <Input
                id="rss-title"
                value={formData.rssTitle}
                onChange={(e) => setFormData({ ...formData, rssTitle: e.target.value })}
                placeholder="My Forum RSS Feed"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rss-description">RSS Feed Description</Label>
              <Textarea
                id="rss-description"
                value={formData.rssDescription}
                onChange={(e) => setFormData({ ...formData, rssDescription: e.target.value })}
                placeholder="Latest topics and discussions from our community"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rss-limit">Items per Feed (max 50)</Label>
              <Input
                id="rss-limit"
                type="number"
                min="5"
                max="50"
                value={formData.rssItemLimit}
                onChange={(e) => setFormData({ ...formData, rssItemLimit: parseInt(e.target.value) || 25 })}
                required
              />
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting || isUpdating}
              className="w-full"
            >
              {isSubmitting ? 'Saving...' : 'Save RSS Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {formData.rssEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>RSS Feed URLs</CardTitle>
            <CardDescription>
              Use these URLs to subscribe to your RSS feeds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Main RSS Feed</Label>
              <div className="flex items-center space-x-2">
                <Input value={rssUrl} readOnly className="flex-1" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(rssUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={rssUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category-specific RSS Feed (example)</Label>
              <div className="flex items-center space-x-2">
                <Input value={`${rssUrl}?category=general-discussion`} readOnly className="flex-1" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(`${rssUrl}?category=general-discussion`)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Replace "general-discussion" with any category slug to get category-specific feeds
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">RSS Feed Features:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Latest {formData.rssItemLimit} topics from your forum</li>
                <li>• Category-specific feeds available</li>
                <li>• Automatic updates when new topics are posted</li>
                <li>• Valid RSS 2.0 format with full metadata</li>
                <li>• Cached for 5 minutes for optimal performance</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};