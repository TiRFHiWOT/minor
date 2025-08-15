import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  ExternalLink, 
  Upload, 
  Download, 
  Trash2, 
  Edit, 
  Plus, 
  RefreshCw,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  ChevronUp,
  ChevronDown,
  Filter,
  Settings,
  Eye,
  TrendingUp
} from 'lucide-react';
import { 
  useUrlMigrations, 
  useCreateUrlMigration, 
  useUpdateUrlMigration, 
  useDeleteUrlMigration,
  useBulkCreateUrlMigrations,
  useUrlMigrationQualityMetrics,
  type UrlMigration 
} from '@/hooks/useUrlMigrations';
import { useUrlMigrationStats } from '@/hooks/useUrlMigrationStats';
import { type OldUrlPattern } from '@/utils/sitemapProcessor';
import { supabase } from '@/integrations/supabase/client';
import { UrlMigrationBulkManager } from './UrlMigrationBulkManager';
import { UrlMigrationReviewInterface } from './UrlMigrationReviewInterface';

export const UrlMigrationManager = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sitemapUrl, setSitemapUrl] = useState('https://old.minorhockeytalks.com/sitemap.xml');
  const [isProcessingSitemap, setIsProcessingSitemap] = useState(false);
  const [sitemapData, setSitemapData] = useState<OldUrlPattern[]>([]);
  const [editingMigration, setEditingMigration] = useState<UrlMigration | null>(null);
  
  // Filtering and sorting state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Batch processing state
  const [batchProgress, setBatchProgress] = useState({
    isProcessing: false,
    currentBatch: 0,
    totalBatches: 0,
    processedUrls: 0,
    totalUrls: 0,
    migrationsCreated: 0
  });
  const [newMigration, setNewMigration] = useState({
    old_url: '',
    new_url: '',
    url_type: 'topic' as const,
    priority: 1,
    status: 'pending' as const,
    notes: ''
  });

  // Apply filters to the query
  const migrationFilters = {
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 1000 // Increase limit for better table functionality
  };
  
  const { data: migrations = [], refetch } = useUrlMigrations(migrationFilters);
  const { 
    data: stats, 
    refreshStats, 
    invalidateStats, 
    lastRefreshed,
    isLoading: statsLoading,
    isFetching: statsFetching
  } = useUrlMigrationStats();
  const { data: qualityMetrics } = useUrlMigrationQualityMetrics();
  const createMigration = useCreateUrlMigration();
  const updateMigration = useUpdateUrlMigration();
  const deleteMigration = useDeleteUrlMigration();
  const bulkCreateMigrations = useBulkCreateUrlMigrations();

  // Sort migrations in memory
  const sortedMigrations = [...migrations].sort((a, b) => {
    let aValue: any = a[sortBy as keyof UrlMigration];
    let bValue: any = b[sortBy as keyof UrlMigration];
    
    // Handle different data types
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleProcessSitemap = async () => {
    if (!sitemapUrl.trim()) {
      toast.error('Please enter a sitemap URL');
      return;
    }

    setIsProcessingSitemap(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-sitemap', {
        body: { sitemapUrl }
      });

      if (error) {
        throw new Error(error.message || 'Failed to process sitemap');
      }

      if (!data.success) {
        throw new Error(data.error || 'Unknown error processing sitemap');
      }

      setSitemapData(data.patterns);
      toast.success(`Processed ${data.patterns.length} URLs from sitemap (${data.summary.topics} topics, ${data.summary.posts} posts, ${data.summary.categories} categories)`);
    } catch (error) {
      console.error('Error processing sitemap:', error);
      toast.error(`Failed to process sitemap: ${error.message}`);
    } finally {
      setIsProcessingSitemap(false);
    }
  };

  const handleCreateMigration = async () => {
    if (!newMigration.old_url || !newMigration.new_url) {
      toast.error('Please fill in both old and new URLs');
      return;
    }

    await createMigration.mutateAsync(newMigration);
    setNewMigration({
      old_url: '',
      new_url: '',
      url_type: 'topic',
      priority: 1,
      status: 'pending',
      notes: ''
    });
  };

  const handleUpdateMigration = async () => {
    if (!editingMigration) return;

    await updateMigration.mutateAsync({
      id: editingMigration.id,
      updates: editingMigration
    });
    setEditingMigration(null);
  };

  const handleBulkCreateFromSitemap = async () => {
    if (sitemapData.length === 0) {
      toast.error('No sitemap data to process');
      return;
    }

    try {
      setBatchProgress({
        isProcessing: true,
        currentBatch: 0,
        totalBatches: 0,
        processedUrls: 0,
        totalUrls: 0,
        migrationsCreated: 0
      });

      let batchIndex = 0;
      let hasMore = true;
      let totalMigrationsCreated = 0;

      while (hasMore) {
        try {
          const { data, error } = await supabase.functions.invoke('process-sitemap', {
            body: { 
              sitemapUrl, 
              generateMigrations: true,
              batchSize: 1000,
              batchIndex
            }
          });

          if (error) {
            throw new Error(error.message || 'Failed to generate migrations');
          }

          if (!data.success) {
            throw new Error(data.error || 'Unknown error generating migrations');
          }

          // Update progress
          setBatchProgress(prev => ({
            ...prev,
            currentBatch: data.batchInfo.currentBatch,
            totalBatches: data.batchInfo.totalBatches,
            processedUrls: data.batchInfo.processedUrls,
            totalUrls: data.batchInfo.totalUrls,
            migrationsCreated: prev.migrationsCreated + (data.migrationsCreated || 0)
          }));

          // Create migrations if any were generated
          if (data.migrations && data.migrations.length > 0) {
            await bulkCreateMigrations.mutateAsync(data.migrations);
            totalMigrationsCreated += data.migrations.length;
          }

          hasMore = data.batchInfo.hasMore;
          batchIndex++;

          // Small delay between batches to prevent overwhelming the system
          if (hasMore) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }

        } catch (batchError) {
          console.error(`Error processing batch ${batchIndex + 1}:`, batchError);
          toast.error(`Failed to process batch ${batchIndex + 1}: ${batchError.message}`);
          
          // Ask user if they want to continue with next batch
          const shouldContinue = confirm(`Batch ${batchIndex + 1} failed. Continue with next batch?`);
          if (!shouldContinue) {
            hasMore = false;
          } else {
            batchIndex++;
          }
        }
      }

      setBatchProgress(prev => ({ ...prev, isProcessing: false }));
      
      if (totalMigrationsCreated > 0) {
        toast.success(`Batch processing complete! Created ${totalMigrationsCreated} enhanced migrations with SEO-friendly URLs`);
      } else {
        toast.warning('Batch processing complete, but no migrations were generated');
      }
      
      setSitemapData([]);
      
    } catch (error) {
      setBatchProgress(prev => ({ ...prev, isProcessing: false }));
      console.error('Error in batch processing:', error);
      toast.error(`Failed to process migrations: ${error.message}`);
    }
  };

  const cancelBatchProcessing = () => {
    setBatchProgress(prev => ({ ...prev, isProcessing: false }));
    toast.info('Batch processing cancelled');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'disabled': return <AlertCircle className="h-4 w-4 text-warning" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'disabled': return 'secondary';
      default: return 'outline';
    }
  };

  // Use stats from dedicated hook, fallback to calculated stats if loading
  const displayStats = stats || {
    total: migrations.length,
    active: migrations.filter(m => m.status === 'active').length,
    pending: migrations.filter(m => m.status === 'pending').length,
    totalRedirects: migrations.reduce((sum, m) => sum + m.redirect_count, 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">URL Migration Manager</h2>
          <p className="text-muted-foreground">Manage redirects for old forum URLs</p>
        </div>
        <Button 
          onClick={async () => { 
            refetch(); 
            await refreshStats(); 
            await invalidateStats();
          }}
          disabled={statsLoading || statsFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${statsFetching ? 'animate-spin' : ''}`} />
          Refresh {statsFetching ? 'Stats...' : 'Data'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Migrations</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Redirects</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.totalRedirects}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bulk-manager">
            <Settings className="h-4 w-4 mr-2" />
            Bulk Manager
          </TabsTrigger>
          <TabsTrigger value="review">
            <Eye className="h-4 w-4 mr-2" />
            Review
          </TabsTrigger>
          <TabsTrigger value="quality">
            <TrendingUp className="h-4 w-4 mr-2" />
            Quality
          </TabsTrigger>
          <TabsTrigger value="sitemap">Sitemap Import</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>URL Migrations</CardTitle>
              <CardDescription>
                Manage existing URL redirects and view their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const pendingIds = migrations.filter(m => m.status === 'pending').map(m => m.id);
                        if (pendingIds.length === 0) {
                          toast.info('No pending migrations to approve');
                          return;
                        }
                        pendingIds.forEach(id => {
                          updateMigration.mutate({ id, updates: { status: 'active' } });
                        });
                        toast.success(`Approved ${pendingIds.length} migrations`);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve All Pending
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm('Delete all migrations? This cannot be undone.')) {
                          migrations.forEach(m => deleteMigration.mutate(m.id));
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </div>
                </div>
                
                {/* Filters and Controls */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Showing {sortedMigrations.length} migrations
                  </div>
                </div>
                
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('old_url')}
                    >
                      <div className="flex items-center gap-2">
                        Old URL
                        {sortBy === 'old_url' && (
                          sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('new_url')}
                    >
                      <div className="flex items-center gap-2">
                        New URL
                        {sortBy === 'new_url' && (
                          sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('url_type')}
                    >
                      <div className="flex items-center gap-2">
                        Type
                        {sortBy === 'url_type' && (
                          sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        {sortBy === 'status' && (
                          sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('redirect_count')}
                    >
                      <div className="flex items-center gap-2">
                        Redirects
                        {sortBy === 'redirect_count' && (
                          sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMigrations.map((migration) => (
                    <TableRow key={migration.id}>
                      <TableCell className="font-mono text-sm">
                        {migration.old_url}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {migration.new_url}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{migration.url_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(migration.status)}
                          <Badge variant={getStatusVariant(migration.status)}>
                            {migration.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {migration.match_type && (
                            <Badge variant="secondary" className="text-xs">
                              {migration.match_type}
                            </Badge>
                          )}
                          {migration.match_confidence !== null && (
                            <span className="text-xs text-muted-foreground">
                              {Math.round(migration.match_confidence * 100)}%
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{migration.redirect_count}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {migration.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateMigration.mutate({ 
                                id: migration.id, 
                                updates: { status: 'active' } 
                              })}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {migration.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateMigration.mutate({ 
                                id: migration.id, 
                                updates: { status: 'disabled' } 
                              })}
                            >
                              <AlertCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingMigration(migration)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMigration.mutate(migration.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk-manager">
          <UrlMigrationBulkManager onRefresh={async () => { 
            refetch(); 
            await refreshStats();
            await invalidateStats();
          }} />
        </TabsContent>

        <TabsContent value="review">
          <UrlMigrationReviewInterface onRefresh={async () => { 
            refetch(); 
            await refreshStats();
            await invalidateStats();
          }} />
        </TabsContent>

        <TabsContent value="quality">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Quality Metrics Dashboard
                </CardTitle>
                <CardDescription>
                  Monitor the quality and health of URL migrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {qualityMetrics ? (
                  <div className="space-y-6">
                    {/* Quality Overview */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Needs Review</p>
                              <p className="text-2xl font-bold text-warning">{qualityMetrics.needsReview}</p>
                            </div>
                            <AlertCircle className="h-8 w-8 text-warning" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Undefined URLs</p>
                              <p className="text-2xl font-bold text-destructive">{qualityMetrics.activeWithUndefined}</p>
                            </div>
                            <AlertCircle className="h-8 w-8 text-destructive" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Undefined %</p>
                              <p className="text-2xl font-bold text-destructive">{qualityMetrics.undefinedPercentage}%</p>
                            </div>
                            <BarChart3 className="h-8 w-8 text-destructive" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Confidence Distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Confidence Score Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(qualityMetrics.confidenceRanges).map(([range, count]) => (
                            <div key={range} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Badge variant={
                                  range.startsWith('90') ? 'default' :
                                  range.startsWith('80') ? 'outline' :
                                  range.startsWith('70') ? 'secondary' : 'destructive'
                                }>
                                  {range}
                                </Badge>
                                <span className="text-sm">{count} migrations</span>
                              </div>
                              <div className="w-32">
                                <Progress 
                                  value={(count / qualityMetrics.totalMigrations) * 100} 
                                  className="h-2"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Action Items */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Recommended Actions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {qualityMetrics.activeWithUndefined > 0 && (
                            <div className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 rounded">
                              <div>
                                <div className="font-medium text-destructive">Fix Undefined URLs</div>
                                <div className="text-sm text-muted-foreground">
                                  {qualityMetrics.activeWithUndefined} active migrations have /undefined/ in their URLs
                                </div>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setActiveTab('bulk-manager')}
                              >
                                Fix Now
                              </Button>
                            </div>
                          )}
                          
                          {qualityMetrics.lowConfidenceActive > 0 && (
                            <div className="flex items-center justify-between p-3 bg-warning/10 border border-warning/20 rounded">
                              <div>
                                <div className="font-medium text-warning">Review Low Confidence</div>
                                <div className="text-sm text-muted-foreground">
                                  {qualityMetrics.lowConfidenceActive} active migrations have low confidence scores
                                </div>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setActiveTab('review')}
                              >
                                Review
                              </Button>
                            </div>
                          )}
                          
                          {qualityMetrics.needsReview === 0 && (
                            <div className="flex items-center gap-3 p-3 bg-success/10 border border-success/20 rounded">
                              <CheckCircle className="h-5 w-5 text-success" />
                              <div>
                                <div className="font-medium text-success">All Quality Checks Passed</div>
                                <div className="text-sm text-muted-foreground">
                                  No immediate action items detected
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Loading quality metrics...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sitemap">
          <Card>
            <CardHeader>
              <CardTitle>Sitemap Import</CardTitle>
              <CardDescription>
                Import URLs from old site sitemap for bulk migration setup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter sitemap URL"
                  value={sitemapUrl}
                  onChange={(e) => setSitemapUrl(e.target.value)}
                />
                <Button 
                  onClick={handleProcessSitemap}
                  disabled={isProcessingSitemap}
                >
                  {isProcessingSitemap ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Process Sitemap
                </Button>
              </div>

              {sitemapData.length > 0 && !batchProgress.isProcessing && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Found {sitemapData.length} URLs ({sitemapData.filter(d => d.type === 'topic').length} topics)
                    </p>
                    <Button onClick={handleBulkCreateFromSitemap}>
                      <Upload className="h-4 w-4 mr-2" />
                      Create Enhanced Migrations (Batched)
                    </Button>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>URL</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>ID</TableHead>
                          <TableHead>Title</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sitemapData.slice(0, 100).map((pattern, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-sm">
                              {pattern.path}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{pattern.type}</Badge>
                            </TableCell>
                            <TableCell>
                              {pattern.topicId || pattern.postId || pattern.categoryId || '-'}
                            </TableCell>
                            <TableCell className="truncate max-w-xs">
                              {pattern.title || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Batch Processing Progress */}
              {batchProgress.isProcessing && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Processing Sitemap in Batches</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelBatchProcessing}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Batch Progress</span>
                      <span>{batchProgress.currentBatch} / {batchProgress.totalBatches}</span>
                    </div>
                    <Progress 
                      value={batchProgress.totalBatches > 0 ? (batchProgress.currentBatch / batchProgress.totalBatches) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>URLs Processed</span>
                      <span>{Math.min(batchProgress.processedUrls, batchProgress.totalUrls)} / {batchProgress.totalUrls}</span>
                    </div>
                    <Progress 
                      value={batchProgress.totalUrls > 0 ? (Math.min(batchProgress.processedUrls, batchProgress.totalUrls) / batchProgress.totalUrls) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Migrations Created:</span>
                      <div className="font-medium">{batchProgress.migrationsCreated}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Current Batch:</span>
                      <div className="font-medium">{batchProgress.currentBatch} of {batchProgress.totalBatches}</div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Processing 1,000 URLs per batch to ensure reliable operation. 
                    Each batch includes database lookups for enhanced URL matching.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Manual Migration Entry</CardTitle>
              <CardDescription>
                Create individual URL redirects manually
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="old-url">Old URL</Label>
                  <Input
                    id="old-url"
                    placeholder="/old-topic-t1234.html"
                    value={newMigration.old_url}
                    onChange={(e) => setNewMigration({ ...newMigration, old_url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-url">New URL</Label>
                  <Input
                    id="new-url"
                    placeholder="/category/topic-slug"
                    value={newMigration.new_url}
                    onChange={(e) => setNewMigration({ ...newMigration, new_url: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>URL Type</Label>
                  <Select 
                    value={newMigration.url_type} 
                    onValueChange={(value) => setNewMigration({ ...newMigration, url_type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="topic">Topic</SelectItem>
                      <SelectItem value="post">Post</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={newMigration.status} 
                    onValueChange={(value) => setNewMigration({ ...newMigration, status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={newMigration.priority}
                    onChange={(e) => setNewMigration({ ...newMigration, priority: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Optional notes about this migration..."
                  value={newMigration.notes}
                  onChange={(e) => setNewMigration({ ...newMigration, notes: e.target.value })}
                />
              </div>

              <Button onClick={handleCreateMigration} disabled={createMigration.isPending}>
                <Plus className="h-4 w-4 mr-2" />
                Create Migration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Migration Dialog */}
      {editingMigration && (
        <Dialog open={!!editingMigration} onOpenChange={() => setEditingMigration(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit URL Migration</DialogTitle>
              <DialogDescription>
                Update the migration settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Old URL</Label>
                <Input
                  value={editingMigration.old_url}
                  onChange={(e) => setEditingMigration({ ...editingMigration, old_url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>New URL</Label>
                <Input
                  value={editingMigration.new_url}
                  onChange={(e) => setEditingMigration({ ...editingMigration, new_url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={editingMigration.status} 
                  onValueChange={(value) => setEditingMigration({ ...editingMigration, status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingMigration(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateMigration}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};