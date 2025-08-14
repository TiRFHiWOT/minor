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
  Clock
} from 'lucide-react';
import { 
  useUrlMigrations, 
  useCreateUrlMigration, 
  useUpdateUrlMigration, 
  useDeleteUrlMigration,
  useBulkCreateUrlMigrations,
  type UrlMigration 
} from '@/hooks/useUrlMigrations';
import { type OldUrlPattern } from '@/utils/sitemapProcessor';
import { supabase } from '@/integrations/supabase/client';

export const UrlMigrationManager = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sitemapUrl, setSitemapUrl] = useState('https://old.minorhockeytalks.com/sitemap.xml');
  const [isProcessingSitemap, setIsProcessingSitemap] = useState(false);
  const [sitemapData, setSitemapData] = useState<OldUrlPattern[]>([]);
  const [editingMigration, setEditingMigration] = useState<UrlMigration | null>(null);
  const [newMigration, setNewMigration] = useState({
    old_url: '',
    new_url: '',
    url_type: 'topic' as const,
    priority: 1,
    status: 'pending' as const,
    notes: ''
  });

  const { data: migrations = [], refetch } = useUrlMigrations();
  const createMigration = useCreateUrlMigration();
  const updateMigration = useUpdateUrlMigration();
  const deleteMigration = useDeleteUrlMigration();
  const bulkCreateMigrations = useBulkCreateUrlMigrations();

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
      toast.info('Generating enhanced migrations with database lookups...');
      
      const { data, error } = await supabase.functions.invoke('process-sitemap', {
        body: { 
          sitemapUrl, 
          generateMigrations: true,
          batchSize: 500 
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate migrations');
      }

      if (!data.success) {
        throw new Error(data.error || 'Unknown error generating migrations');
      }

      if (data.migrations && data.migrations.length > 0) {
        await bulkCreateMigrations.mutateAsync(data.migrations);
        toast.success(`Created ${data.migrations.length} enhanced migrations with SEO-friendly URLs`);
      } else {
        toast.warning('No migrations were generated from the sitemap data');
      }
      
      setSitemapData([]);
    } catch (error) {
      console.error('Error creating enhanced migrations:', error);
      toast.error(`Failed to create migrations: ${error.message}`);
    }
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

  const stats = {
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
        <Button onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
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
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Redirects</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRedirects}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
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
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Old URL</TableHead>
                    <TableHead>New URL</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead>Redirects</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {migrations.map((migration) => (
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

              {sitemapData.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Found {sitemapData.length} URLs ({sitemapData.filter(d => d.type === 'topic').length} topics)
                    </p>
                    <Button onClick={handleBulkCreateFromSitemap}>
                      <Upload className="h-4 w-4 mr-2" />
                      Create Enhanced Migrations
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