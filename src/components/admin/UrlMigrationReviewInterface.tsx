import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  ThumbsUp, 
  ThumbsDown, 
  SkipForward,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Eye,
  RefreshCw,
  Edit3,
  Wrench,
  Save,
  X
} from 'lucide-react';
import { 
  useUrlMigrations, 
  useUpdateUrlMigration,
  type UrlMigration 
} from '@/hooks/useUrlMigrations';
import { generateTopicUrl, generateCategoryUrl, reconstructPreservingOriginal } from '@/utils/urlHelpers';

interface ReviewInterfaceProps {
  onRefresh: () => void;
}

export const UrlMigrationReviewInterface = ({ onRefresh }: ReviewInterfaceProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUrl, setEditedUrl] = useState('');
  const [isFixing, setIsFixing] = useState(false);

  // Get migrations that need review (high confidence active ones or undefined URLs)
  const { data: allMigrations = [] } = useUrlMigrations({ limit: 2000 });
  const updateMigration = useUpdateUrlMigration();

  const migrationsNeedingReview = allMigrations.filter(migration => {
    // Include active migrations with undefined URLs
    if (migration.status === 'active' && migration.new_url.includes('/undefined/')) {
      return true;
    }
    
    // Include high confidence active migrations that haven't been manually reviewed
    if (migration.status === 'active' && 
        (migration.match_confidence || 0) >= 0.70 && 
        !migration.notes?.includes('reviewed')) {
      return true;
    }
    
    // Include low confidence pending migrations
    if (migration.status === 'pending' && (migration.match_confidence || 0) < 0.50) {
      return true;
    }
    
    return false;
  });

  const currentMigration = migrationsNeedingReview[currentIndex];
  const progress = migrationsNeedingReview.length > 0 ? 
    ((currentIndex + 1) / migrationsNeedingReview.length) * 100 : 0;

  const handleReview = async (action: 'approve' | 'reject' | 'skip') => {
    if (!currentMigration) return;

    setIsReviewing(true);
    try {
      let updates: Partial<UrlMigration> = {};
      let actionNotes = reviewNotes;

      switch (action) {
        case 'approve':
          updates = { 
            status: 'active',
            notes: `${currentMigration.notes || ''}\nManually reviewed and approved: ${actionNotes || 'Good match'}`.trim()
          };
          break;
          
        case 'reject':
          updates = { 
            status: 'disabled',
            notes: `${currentMigration.notes || ''}\nManually reviewed and rejected: ${actionNotes || 'Poor match'}`.trim()
          };
          break;
          
        case 'skip':
          updates = { 
            notes: `${currentMigration.notes || ''}\nSkipped during review: ${actionNotes || 'Needs further investigation'}`.trim()
          };
          break;
      }

      await updateMigration.mutateAsync({
        id: currentMigration.id,
        updates
      });

      moveToNext();
      
    } catch (error) {
      console.error('Review action failed:', error);
      toast.error('Failed to update migration');
    } finally {
      setIsReviewing(false);
    }
  };

  const moveToNext = () => {
    // Reset editing state
    setIsEditing(false);
    setEditedUrl('');
    setReviewNotes('');
    
    // Move to next migration
    if (currentIndex < migrationsNeedingReview.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      toast.success('Review complete! All migrations have been reviewed.');
      setCurrentIndex(0);
    }
    
    onRefresh();
  };

  const handleFixUrl = async () => {
    if (!currentMigration) return;

    setIsFixing(true);
    try {
      let fixedUrl = currentMigration.new_url;
      
      // Try to fix URLs by preserving original structure
      const reconstructedUrl = reconstructPreservingOriginal(currentMigration.old_url);
      
      if (reconstructedUrl) {
        fixedUrl = reconstructedUrl;
      } else {
        // Fallback to original logic for /undefined/ URLs
        if (currentMigration.new_url.includes('/undefined/')) {
          const oldUrl = currentMigration.old_url;
          const filename = oldUrl.split('/').pop()?.replace('.html', '') || '';
          
          // Extract components
          const year = filename.match(/20\d{2}/)?.[0];
          const levelMatch = filename.match(/-a{1,3}(?![a-z])/i);
          const level = levelMatch ? levelMatch[0].replace('-', '').toLowerCase() : null;
          const topicId = filename.match(/-t(\d+)$/)?.[1];
          
          if (year && level && topicId) {
            // Preserve original filename structure with topic ID
            const organization = filename.includes('gthl') ? 'gthl' :
                               filename.includes('alliance') ? 'alliance' :
                               'ontario';
            
            fixedUrl = `/${organization}-${year}-${level}/${filename}`;
          }
        }
      }

      const updates = {
        new_url: fixedUrl,
        match_confidence: 0.75, // Set a reasonable confidence for fixed URLs (75%)
        notes: `${currentMigration.notes || ''}\nURL fixed automatically from /undefined/`.trim()
      };

      await updateMigration.mutateAsync({
        id: currentMigration.id,
        updates
      });

      toast.success('URL fixed successfully!');
      moveToNext();
      
    } catch (error) {
      console.error('Fix URL failed:', error);
      toast.error('Failed to fix URL');
    } finally {
      setIsFixing(false);
    }
  };

  const handleManualEdit = () => {
    setIsEditing(true);
    setEditedUrl(currentMigration?.new_url || '');
  };

  const handleSaveEdit = async () => {
    if (!currentMigration || !editedUrl.trim()) return;

    setIsReviewing(true);
    try {
      const updates = {
        new_url: editedUrl.trim(),
        match_confidence: 0.85, // Manual edits get higher confidence (85%)
        notes: `${currentMigration.notes || ''}\nURL manually edited and corrected`.trim()
      };

      await updateMigration.mutateAsync({
        id: currentMigration.id,
        updates
      });

      toast.success('URL updated successfully!');
      moveToNext();
      
    } catch (error) {
      console.error('Save edit failed:', error);
      toast.error('Failed to save URL edit');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedUrl('');
  };

  const handleFixAndApprove = async () => {
    if (!currentMigration) return;

    setIsFixing(true);
    try {
      // First fix the URL
      await handleFixUrl();
      
      // Then approve it (this will be handled by the fix function's moveToNext)
      
    } catch (error) {
      console.error('Fix and approve failed:', error);
      toast.error('Failed to fix and approve');
      setIsFixing(false);
    }
  };

  const getMatchQualityIssues = (migration: UrlMigration) => {
    const issues = [];
    
    if (migration.new_url.includes('/undefined/')) {
      issues.push('Contains /undefined/ in URL');
    }
    
    if ((migration.match_confidence || 0) < 0.50) {
      issues.push('Low confidence score');
    }
    
    // Check for level mismatches (A vs AA vs AAA)
    const oldLevel = migration.old_url.match(/-a{1,3}(?![a-z])/i)?.[0]?.replace('-', '').toUpperCase();
    const newLevel = migration.new_url.match(/-a{1,3}(?![a-z])/i)?.[0]?.replace('-', '').toUpperCase();
    if (oldLevel && newLevel && oldLevel !== newLevel) {
      issues.push(`Hockey level mismatch (${oldLevel} vs ${newLevel})`);
    }
    
    // Check for year mismatches
    const oldYear = migration.old_url.match(/20\d{2}/)?.[0];
    const newYear = migration.new_url.match(/20\d{2}/)?.[0];
    if (oldYear && newYear && oldYear !== newYear) {
      issues.push(`Year mismatch (${oldYear} vs ${newYear})`);
    }
    
    // Check for missing topic ID preservation
    const oldTopicId = migration.old_url.match(/-t(\d+)/)?.[1];
    const newTopicId = migration.new_url.match(/-t(\d+)/)?.[1];
    if (oldTopicId && !newTopicId) {
      issues.push('Topic ID lost in migration');
    } else if (oldTopicId && newTopicId && oldTopicId !== newTopicId) {
      issues.push(`Topic ID mismatch (t${oldTopicId} vs t${newTopicId})`);
    }
    
    // Check for content type mismatches
    const contentTypes = ['ranking', 'recruit', 'goalie', 'tournament', 'discussion'];
    const oldType = contentTypes.find(type => migration.old_url.toLowerCase().includes(type));
    const newType = contentTypes.find(type => migration.new_url.toLowerCase().includes(type));
    if (oldType && newType && oldType !== newType) {
      issues.push(`Content type mismatch (${oldType} vs ${newType})`);
    }
    
    return issues;
  };

  const parseUrlInformation = (url: string) => {
    const info = {
      year: url.match(/20\d{2}/)?.[0] || 'Unknown',
      level: url.match(/-a{1,3}(?![a-z])/i)?.[0]?.toUpperCase() || 'Unknown',
      region: 'Unknown',
      type: 'Unknown'
    };
    
    // Extract region/league info
    if (url.includes('gthl')) info.region = 'GTHL';
    if (url.includes('ontario')) info.region = 'Ontario';
    if (url.includes('canada')) info.region = 'Canada';
    
    // Extract content type
    if (url.includes('ranking')) info.type = 'Rankings';
    if (url.includes('recruit')) info.type = 'Recruitment';
    if (url.includes('goalie')) info.type = 'Goalie';
    if (url.includes('tournament')) info.type = 'Tournament';
    
    return info;
  };

  if (migrationsNeedingReview.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
          <p className="text-muted-foreground">
            No URL migrations currently need manual review.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!currentMigration) return null;

  const oldInfo = parseUrlInformation(currentMigration.old_url);
  const newInfo = parseUrlInformation(currentMigration.new_url);
  const qualityIssues = getMatchQualityIssues(currentMigration);

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Review Progress</span>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} of {migrationsNeedingReview.length}
            </span>
          </div>
          <Progress value={progress} />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Old URL Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Original URL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted rounded font-mono text-sm break-all">
              {currentMigration.old_url}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium">Year</div>
                <Badge variant="outline">{oldInfo.year}</Badge>
              </div>
              <div>
                <div className="text-sm font-medium">Level</div>
                <Badge variant="outline">{oldInfo.level}</Badge>
              </div>
              <div>
                <div className="text-sm font-medium">Region</div>
                <Badge variant="outline">{oldInfo.region}</Badge>
              </div>
              <div>
                <div className="text-sm font-medium">Type</div>
                <Badge variant="outline">{oldInfo.type}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New URL Analysis with Editing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Matched URL
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleManualEdit}
                  className="ml-auto"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={editedUrl}
                  onChange={(e) => setEditedUrl(e.target.value)}
                  placeholder="Enter new URL..."
                  className="font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveEdit}
                    disabled={isReviewing || !editedUrl.trim()}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-muted rounded font-mono text-sm break-all">
                {currentMigration.new_url}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium">Year</div>
                <Badge variant="outline">{newInfo.year}</Badge>
              </div>
              <div>
                <div className="text-sm font-medium">Level</div>
                <Badge variant="outline">{newInfo.level}</Badge>
              </div>
              <div>
                <div className="text-sm font-medium">Region</div>
                <Badge variant="outline">{newInfo.region}</Badge>
              </div>
              <div>
                <div className="text-sm font-medium">Type</div>
                <Badge variant="outline">{newInfo.type}</Badge>
              </div>
            </div>

            {/* URL Fixing Actions */}
            {!isEditing && qualityIssues.length > 0 && (
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  onClick={handleFixUrl}
                  disabled={isFixing}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Wrench className="h-4 w-4" />
                  {isFixing ? 'Fixing...' : 'Auto Fix'}
                </Button>
                
                {currentMigration.new_url.includes('/undefined/') && (
                  <Button
                    onClick={handleFixAndApprove}
                    disabled={isFixing}
                    variant="default"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Fix & Approve
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Match Quality Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Match Quality Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-sm font-medium">Confidence Score</div>
              <Badge variant={
                (currentMigration.match_confidence || 0) >= 0.80 ? 'default' :
                (currentMigration.match_confidence || 0) >= 0.50 ? 'outline' : 'destructive'
              }>
                {Math.round((currentMigration.match_confidence || 0) * 100)}%
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium">Status</div>
              <Badge variant={currentMigration.status === 'active' ? 'default' : 'outline'}>
                {currentMigration.status}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium">Redirects</div>
              <Badge variant="outline">{currentMigration.redirect_count}</Badge>
            </div>
          </div>

          {qualityIssues.length > 0 && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="font-medium text-destructive">Quality Issues Detected</span>
              </div>
              <ul className="text-sm space-y-1">
                {qualityIssues.map((issue, index) => (
                  <li key={index} className="text-destructive">• {issue}</li>
                ))}
              </ul>
            </div>
          )}

          {currentMigration.notes && (
            <div className="p-3 bg-muted rounded">
              <div className="text-sm font-medium mb-1">Existing Notes</div>
              <div className="text-sm">{currentMigration.notes}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Review Decision</CardTitle>
          <CardDescription>
            {isEditing 
              ? "Edit the URL above, then save your changes."
              : "Evaluate if this URL mapping is appropriate and should remain active."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEditing && (
            <Textarea
              placeholder="Add review notes (optional)..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={3}
            />
          )}
          
          {!isEditing && (
            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={() => handleReview('approve')}
                disabled={isReviewing || isFixing}
                className="flex items-center gap-2"
                variant="default"
              >
                <ThumbsUp className="h-4 w-4" />
                Approve
              </Button>
              
              <Button
                onClick={() => handleReview('reject')}
                disabled={isReviewing || isFixing}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <ThumbsDown className="h-4 w-4" />
                Reject
              </Button>
              
              <Button
                onClick={() => handleReview('skip')}
                disabled={isReviewing || isFixing}
                variant="outline"
                className="flex items-center gap-2"
              >
                <SkipForward className="h-4 w-4" />
                Skip
              </Button>
              
              {/* Quick Fix Actions */}
              {qualityIssues.length > 0 && (
                <>
                  <div className="w-full border-t pt-3 mt-3">
                    <div className="text-sm font-medium mb-2">Quick Actions</div>
                    <div className="flex gap-2 flex-wrap">
                      {currentMigration.new_url.includes('/undefined/') && (
                        <Button
                          onClick={handleFixAndApprove}
                          disabled={isReviewing || isFixing}
                          variant="secondary"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          {isFixing ? 'Fixing...' : 'Fix & Approve'}
                        </Button>
                      )}
                      
                      <Button
                        onClick={handleManualEdit}
                        disabled={isReviewing || isFixing}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Edit3 className="h-4 w-4" />
                        Manual Edit
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};