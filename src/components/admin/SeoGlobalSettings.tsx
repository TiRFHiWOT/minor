import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useForumSettings } from '@/hooks/useForumSettings';
import { useToast } from '@/hooks/use-toast';
import { Save, Settings, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FORUM_NAME } from '@/utils/seoHelpers';

export const SeoGlobalSettings: React.FC = () => {
  const { getSetting, updateSetting, isUpdating, settings, isLoading } = useForumSettings();
  const { toast } = useToast();
  const [isDirty, setIsDirty] = useState(false);

  const [globalSettings, setGlobalSettings] = useState(() => ({
    auto_generation_enabled: true,
    forum_name_override: '',
    default_separator: '|'
  }));

  React.useEffect(() => {
    if (!isLoading && settings) {
      setGlobalSettings({
        auto_generation_enabled: getSetting('seo_auto_generation', true),
        forum_name_override: getSetting('seo_forum_name_override', ''),
        default_separator: getSetting('seo_default_separator', '|')
      });
    }
  }, [isLoading, settings]);

  const handleChange = (field: string, value: string | boolean) => {
    setGlobalSettings(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      const settingsToUpdate = [
        { 
          key: 'seo_auto_generation', 
          value: globalSettings.auto_generation_enabled, 
          description: 'Enable automatic SEO metadata generation' 
        },
        { 
          key: 'seo_forum_name_override', 
          value: globalSettings.forum_name_override, 
          description: 'Custom forum name for SEO (overrides default)' 
        },
        { 
          key: 'seo_default_separator', 
          value: globalSettings.default_separator, 
          description: 'Default separator for SEO titles' 
        }
      ];

      for (const setting of settingsToUpdate) {
        await updateSetting({
          key: setting.key,
          value: setting.value,
          type: typeof setting.value === 'boolean' ? 'boolean' : 'string',
          category: 'seo',
          description: setting.description
        });
      }

      setIsDirty(false);
      toast({
        title: 'SEO Settings Updated',
        description: 'Global SEO settings have been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update SEO settings.',
        variant: 'destructive',
      });
    }
  };

  const getEffectiveForumName = () => {
    return globalSettings.forum_name_override.trim() || FORUM_NAME;
  };

  const getPreviewTitle = () => {
    const forumName = getEffectiveForumName();
    const sep = globalSettings.default_separator;
    return `Sample Topic ${sep} ${forumName} ${sep} Sample Category`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <div>
            <CardTitle>Global SEO Settings</CardTitle>
            <CardDescription>
              Configure global SEO behavior and automatic metadata generation
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto-generation toggle */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Automatic Generation</h4>
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-generation"
              checked={globalSettings.auto_generation_enabled}
              onCheckedChange={(checked) => handleChange('auto_generation_enabled', checked)}
            />
            <Label htmlFor="auto-generation" className="text-sm">
              Enable automatic SEO metadata generation
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            When enabled, topics and categories without manual SEO metadata will use automatically generated titles and descriptions
          </p>
        </div>

        {/* Forum name override */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Forum Branding</h4>
          <div className="space-y-2">
            <Label htmlFor="forum-name">Forum Name for SEO</Label>
            <Input
              id="forum-name"
              placeholder={FORUM_NAME}
              value={globalSettings.forum_name_override}
              onChange={(e) => handleChange('forum_name_override', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Custom forum name for SEO titles. Leave empty to use default: "{FORUM_NAME}"
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Current: {getEffectiveForumName()}</Badge>
            </div>
          </div>
        </div>

        {/* Separator settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Title Format</h4>
          <div className="space-y-2">
            <Label htmlFor="separator">Title Separator</Label>
            <Input
              id="separator"
              placeholder="|"
              value={globalSettings.default_separator}
              onChange={(e) => handleChange('default_separator', e.target.value)}
              className="max-w-20"
            />
            <p className="text-xs text-muted-foreground">
              Character used to separate title components
            </p>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <h4 className="text-sm font-medium">Title Preview</h4>
          </div>
          <div className="space-y-2">
            <Badge variant="outline" className="mb-2">Topic Title Format</Badge>
            <p className="text-sm font-mono p-2 bg-background rounded border">
              {getPreviewTitle()}
            </p>
            <Badge variant="outline" className="mb-2">Category Title Format</Badge>
            <p className="text-sm font-mono p-2 bg-background rounded border">
              Sample Category {globalSettings.default_separator} {getEffectiveForumName()}
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isUpdating || !isDirty}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isUpdating ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};