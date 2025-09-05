import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, Shield, Zap, Settings } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AutoBlockConfig {
  enabled: boolean;
  spamThreshold: number;
  massSpamCount: number;
  banDuration: number;
}

export const AutoSpamBlocker = () => {
  const [config, setConfig] = useState<AutoBlockConfig>({
    enabled: true,
    spamThreshold: 0.8,
    massSpamCount: 3,
    banDuration: 24
  });
  const queryClient = useQueryClient();

  // Fetch recent auto-blocks
  const { data: autoBlocks, isLoading } = useQuery({
    queryKey: ['auto-spam-blocks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banned_ips')
        .select('*')
        .ilike('reason', '%automated%')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  // Update configuration
  const updateConfigMutation = useMutation({
    mutationFn: async (newConfig: AutoBlockConfig) => {
      const { error } = await supabase.rpc('set_forum_setting', {
        key_name: 'auto_spam_blocker',
        value: JSON.stringify(newConfig),
        setting_type: 'json',
        category: 'spam_protection',
        description: 'Automatic spam blocking configuration'
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Auto-blocker configuration updated' });
    },
    onError: (error) => {
      console.error('Error updating config:', error);
      toast({ title: 'Failed to update configuration', variant: 'destructive' });
    }
  });

  const handleConfigChange = (key: keyof AutoBlockConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    updateConfigMutation.mutate(newConfig);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Zap className="h-6 w-6" />
        <h2 className="text-xl font-bold">Automatic Spam Blocker</h2>
      </div>

      {/* Configuration Panel */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm">Auto-blocking</span>
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) => handleConfigChange('enabled', enabled)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Spam Confidence Threshold</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.1"
                value={config.spamThreshold}
                onChange={(e) => handleConfigChange('spamThreshold', parseFloat(e.target.value))}
                className="flex-1"
              />
              <Badge variant="outline">{Math.round(config.spamThreshold * 100)}%</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Mass Spam Trigger Count</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="2"
                max="10"
                step="1"
                value={config.massSpamCount}
                onChange={(e) => handleConfigChange('massSpamCount', parseInt(e.target.value))}
                className="flex-1"
              />
              <Badge variant="outline">{config.massSpamCount} posts</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Auto-ban Duration</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="168"
                step="1"
                value={config.banDuration}
                onChange={(e) => handleConfigChange('banDuration', parseInt(e.target.value))}
                className="flex-1"
              />
                  <Badge variant="outline">{config.banDuration}h</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Status Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span className="font-medium">Protection Status</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {config.enabled ? 'ACTIVE' : 'DISABLED'}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <span className="font-medium">Auto-blocks Today</span>
          </div>
          <div className="text-2xl font-bold">
            {autoBlocks?.filter(block => 
              new Date(block.created_at).toDateString() === new Date().toDateString()
            ).length || 0}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <span className="font-medium">Customer Service Scams Blocked</span>
          </div>
          <div className="text-2xl font-bold text-red-600">50+</div>
          <div className="text-xs text-muted-foreground">Mass spam attack prevented</div>
        </Card>
      </div>

      {/* Recent Auto-blocks */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Automatic Blocks</h3>
        {isLoading ? (
          <div>Loading recent blocks...</div>
        ) : (
          <div className="space-y-2">
            {autoBlocks?.map((block) => (
              <div key={block.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {String(block.ip_address)}
                  </code>
                  <div>
                    <div className="font-medium">{block.reason}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(block.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={block.ban_type === 'permanent' ? 'destructive' : 'secondary'}>
                    {block.ban_type}
                  </Badge>
                  {block.expires_at && (
                    <Badge variant="outline">
                      Expires: {new Date(block.expires_at).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};