import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Settings, 
  Play, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Filter,
  ArrowRight
} from 'lucide-react';
import { 
  useUrlMigrations, 
  useBulkUpdateUrlMigrations,
  type UrlMigration 
} from '@/hooks/useUrlMigrations';
import { supabase } from '@/integrations/supabase/client';

interface BulkManagerProps {
  onRefresh: () => void;
}

export const UrlMigrationBulkManager = ({ onRefresh }: BulkManagerProps) => {
  const [selectedMigrations, setSelectedMigrations] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filters, setFilters] = useState({
    status: 'all',
    hasUndefined: false,
    confidenceRange: 'all'
  });

  const { data: migrations = [] } = useUrlMigrations({ limit: 5000 });
  const bulkUpdate = useBulkUpdateUrlMigrations();

  // Filter migrations based on current filters
  const filteredMigrations = migrations.filter(migration => {
    if (filters.status !== 'all' && migration.status !== filters.status) return false;
    if (filters.hasUndefined && !migration.new_url.includes('/undefined/')) return false;
    
    if (filters.confidenceRange !== 'all') {
      const confidence = migration.match_confidence || 0;
      switch (filters.confidenceRange) {
        case 'high': return confidence >= 80;
        case 'medium': return confidence >= 50 && confidence < 80;
        case 'low': return confidence < 50;
        default: return true;
      }
    }
    
    return true;
  });

  const handleSelectAll = () => {
    if (selectedMigrations.size === filteredMigrations.length) {
      setSelectedMigrations(new Set());
    } else {
      setSelectedMigrations(new Set(filteredMigrations.map(m => m.id)));
    }
  };

  const handleSelectMigration = (id: string) => {
    const newSelected = new Set(selectedMigrations);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedMigrations(newSelected);
  };

  const handleBulkAction = async () => {
    if (selectedMigrations.size === 0) {
      toast.error('No migrations selected');
      return;
    }

    if (!bulkAction) {
      toast.error('Please select an action');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const selectedIds = Array.from(selectedMigrations);
      
      switch (bulkAction) {
        case 'activate':
          await bulkUpdate.mutateAsync({
            ids: selectedIds,
            updates: { status: 'active' }
          });
          break;
          
        case 'deactivate':
          await bulkUpdate.mutateAsync({
            ids: selectedIds,
            updates: { status: 'pending' }
          });
          break;
          
        case 'fix-undefined':
          await handleFixUndefinedUrls(selectedIds);
          break;
          
        default:
          toast.error('Invalid action selected');
          return;
      }

      setSelectedMigrations(new Set());
      onRefresh();
      
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast.error('Bulk action failed');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleFixUndefinedUrls = async (migrationIds: string[]) => {
    const batchSize = 100;
    const batches = [];
    
    for (let i = 0; i < migrationIds.length; i += batchSize) {
      batches.push(migrationIds.slice(i, i + batchSize));
    }

    let processed = 0;
    let fixed = 0;

    for (const batch of batches) {
      try {
        // Get migrations in this batch that have /undefined/
        const migrationsToFix = migrations.filter(m => 
          batch.includes(m.id) && m.new_url.includes('/undefined/')
        );

        for (const migration of migrationsToFix) {
          try {
            // Call the fix-undefined-urls function for specific migration
            const { data, error } = await supabase.functions.invoke('fix-undefined-urls', {
              body: { 
                specific_migration_id: migration.id,
                old_url: migration.old_url 
              }
            });

            if (data?.success) {
              fixed++;
            }
          } catch (error) {
            console.error(`Failed to fix migration ${migration.id}:`, error);
          }
        }

        processed += batch.length;
        setProgress((processed / migrationIds.length) * 100);
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error('Batch processing error:', error);
      }
    }

    toast.success(`Fixed ${fixed} undefined URLs out of ${migrationIds.length} selected`);
  };

  const handleReprocessAllUrls = async () => {
    const confirmed = window.confirm(
      'This will disable all existing migrations and reprocess the sitemap with improved logic. All new migrations will be set to "pending" for your manual review. Continue?'
    );
    
    if (!confirmed) return;
    
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Step 1: Disable all existing migrations
      toast.info('Step 1: Disabling existing migrations...');
      await bulkUpdate.mutateAsync({
        ids: migrations.map(m => m.id),
        updates: { status: 'disabled' }
      });
      setProgress(25);
      
      // Step 2: Reprocess sitemap with new logic
      toast.info('Step 2: Reprocessing sitemap with enhanced URL preservation...');
      const { data, error } = await supabase.functions.invoke('process-sitemap', {
        body: { 
          sitemapUrl: 'https://gthl.ca/sitemap.xml',
          generateMigrations: true,
          batchSize: 500
        }
      });
      
      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(`Reprocessing failed: ${error.message || 'Unknown error'}`);
      }
      
      if (!data || !data.success) {
        console.error('❌ Invalid response from process-sitemap:', data);
        throw new Error(`Reprocessing failed: ${data?.error || 'Invalid response'}`);
      }
      
      setProgress(75);
      
      // Step 3: Refresh data
      toast.info('Step 3: Refreshing migration data...');
      onRefresh();
      setProgress(100);
      
      toast.success(`Reprocessing complete! Generated ${data?.migrationsCreated || 0} new migrations with improved URL preservation. All set to "pending" for your review.`);
      
    } catch (error) {
      console.error('Reprocessing failed:', error);
      toast.error('Failed to reprocess URLs. Check console for details.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'secondary';
    if (confidence >= 80) return 'default';
    if (confidence >= 50) return 'outline';
    return 'destructive';
  };

  const undefinedCount = filteredMigrations.filter(m => m.new_url.includes('/undefined/')).length;
  const lowConfidenceCount = filteredMigrations.filter(m => (m.match_confidence || 0) < 50).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Bulk Migration Manager
          </CardTitle>
          <CardDescription>
            Manage multiple URL migrations at once. Fix undefined URLs and update statuses in bulk.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quality Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Undefined URLs</p>
                    <p className="text-2xl font-bold text-destructive">{undefinedCount}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Low Confidence</p>
                    <p className="text-2xl font-bold text-warning">{lowConfidenceCount}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Selected</p>
                    <p className="text-2xl font-bold text-primary">{selectedMigrations.size}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.confidenceRange} onValueChange={(value) => setFilters(prev => ({ ...prev, confidenceRange: value }))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Confidence</SelectItem>
                <SelectItem value="high">High (80%+)</SelectItem>
                <SelectItem value="medium">Medium (50-79%)</SelectItem>
                <SelectItem value="low">Low (&lt;50%)</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="has-undefined"
                checked={filters.hasUndefined}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, hasUndefined: !!checked }))}
              />
              <label htmlFor="has-undefined" className="text-sm">Has /undefined/</label>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="flex flex-wrap gap-4 p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedMigrations.size === filteredMigrations.length && filteredMigrations.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm">Select All ({filteredMigrations.length})</span>
            </div>

            <Select value={bulkAction} onValueChange={setBulkAction}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select bulk action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activate">Set to Active</SelectItem>
                <SelectItem value="deactivate">Set to Pending</SelectItem>
                <SelectItem value="fix-undefined">Fix Undefined URLs</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={handleBulkAction}
              disabled={selectedMigrations.size === 0 || !bulkAction || isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Execute ({selectedMigrations.size})
            </Button>

            <Button 
              onClick={async () => {
                try {
                  await bulkUpdate.mutateAsync({
                    ids: [], // Special case handled in hook
                    updates: { status: 'disabled' }
                  });
                  onRefresh();
                  toast.success('Disabled all active URLs with /undefined/');
                } catch (error) {
                  toast.error('Failed to disable undefined URLs');
                }
              }}
              disabled={isProcessing}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Disable All /undefined/ URLs
            </Button>

            <Button 
              onClick={handleReprocessAllUrls}
              disabled={isProcessing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reprocess All URLs
            </Button>
          </div>

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing migrations...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Migration List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredMigrations.slice(0, 100).map((migration) => (
              <div key={migration.id} className="flex items-center gap-3 p-3 border rounded hover:bg-muted/50">
                <Checkbox
                  checked={selectedMigrations.has(migration.id)}
                  onCheckedChange={() => handleSelectMigration(migration.id)}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={migration.status === 'active' ? 'default' : 'outline'}>
                      {migration.status}
                    </Badge>
                    {migration.match_confidence && (
                      <Badge variant={getConfidenceColor(migration.match_confidence)}>
                        {migration.match_confidence}%
                      </Badge>
                    )}
                    {migration.new_url.includes('/undefined/') && (
                      <Badge variant="destructive">Undefined</Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-muted-foreground truncate">
                    {migration.old_url}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <ArrowRight className="h-3 w-3" />
                    <span className="truncate">{migration.new_url}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredMigrations.length > 100 && (
              <div className="text-center py-4 text-muted-foreground">
                Showing first 100 of {filteredMigrations.length} migrations
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};