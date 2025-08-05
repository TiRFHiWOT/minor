import React, { useState, useEffect } from 'react';
import { X, Save, Eye, Upload, Image } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WysiwygEditor } from '@/components/ui/wysiwyg-editor';
import { useCreateBlogPost, useUpdateBlogPost } from '@/hooks/useBlogPosts';
import { useAuth } from '@/hooks/useAuth';
import { useBlogImageUpload } from '@/hooks/useBlogImageUpload';
import { ImageUpload } from '@/components/ui/image-upload';
import { useToast } from '@/components/ui/use-toast';

interface BlogPostEditorProps {
  post?: any;
  onClose: () => void;
  onSave: () => void;
}

const categories = ['Training', 'Equipment', 'Team Building', 'Health', 'Safety'];

export const BlogPostEditor: React.FC<BlogPostEditorProps> = ({
  post,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'Training',
    published_status: 'draft' as 'draft' | 'published' | 'archived',
    featured_image: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const { uploadImage } = useBlogImageUpload();
  const createMutation = useCreateBlogPost();
  const updateMutation = useUpdateBlogPost();

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        category: post.category || 'Training',
        published_status: post.published_status || 'draft',
        featured_image: post.featured_image || '',
        meta_title: post.meta_title || '',
        meta_description: post.meta_description || '',
        meta_keywords: post.meta_keywords || '',
      });
    }
  }, [post]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create blog posts",
        variant: "destructive",
      });
      return;
    }

    try {
      const blogData = {
        ...formData,
        author_id: user.id,
        // Auto-generate excerpt if not provided
        excerpt: formData.excerpt || formData.content.substring(0, 150) + '...',
        // Auto-generate meta fields if not provided
        meta_title: formData.meta_title || formData.title,
        meta_description: formData.meta_description || formData.excerpt || formData.content.substring(0, 160),
      };

      if (post) {
        await updateMutation.mutateAsync({ id: post.id, ...blogData });
        toast({
          title: "Success",
          description: "Blog post updated successfully",
        });
      } else {
        await createMutation.mutateAsync(blogData);
        toast({
          title: "Success",
          description: "Blog post created successfully",
        });
      }

      onSave();
    } catch (error) {
      toast({
        title: "Error",
        description: post ? "Failed to update blog post" : "Failed to create blog post",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {post ? 'Edit Blog Post' : 'Create New Blog Post'}
          </h1>
          <p className="text-muted-foreground">
            {post ? 'Update your blog post content' : 'Write and publish a new blog post'}
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          <X className="h-4 w-4 mr-2" />
          Close
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter blog post title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => handleInputChange('excerpt', e.target.value)}
                    placeholder="Brief description of the post (optional - will be auto-generated if empty)"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="content">Content *</Label>
                  <WysiwygEditor
                    value={formData.content}
                    onChange={(value) => handleInputChange('content', value)}
                    placeholder="Write your blog post content here..."
                  />
                </div>
              </div>
            </Card>

            {/* SEO Settings */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">SEO Settings</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    value={formData.meta_title}
                    onChange={(e) => handleInputChange('meta_title', e.target.value)}
                    placeholder="SEO title (optional - uses post title if empty)"
                  />
                </div>

                <div>
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    value={formData.meta_description}
                    onChange={(e) => handleInputChange('meta_description', e.target.value)}
                    placeholder="SEO description (optional - uses excerpt if empty)"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="meta_keywords">Meta Keywords</Label>
                  <Input
                    id="meta_keywords"
                    value={formData.meta_keywords}
                    onChange={(e) => handleInputChange('meta_keywords', e.target.value)}
                    placeholder="Comma-separated keywords"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Publish Settings</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.published_status}
                    onValueChange={(value) => handleInputChange('published_status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Featured Image</h3>
              <ImageUpload
                value={formData.featured_image || undefined}
                onChange={(url) => handleInputChange('featured_image', url || '')}
                onUpload={uploadImage}
                placeholder="Upload featured image or enter URL"
                acceptExternalUrl={true}
              />
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {post ? 'Update Post' : 'Create Post'}
              </Button>
              
              <Button type="button" variant="outline" className="w-full" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};