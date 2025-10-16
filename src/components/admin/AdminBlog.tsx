import React, { useState } from "react";
import { Plus, Search, Edit, Trash2, Eye, Calendar, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminBlogPosts, useDeleteBlogPost } from "@/hooks/useBlogPosts";
import { useToast } from "@/hooks/use-toast";
import { BlogPostEditor } from "./BlogPostEditor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const categories = [
  "All",
  "Training",
  "Equipment",
  "Team Building",
  "Health",
  "Safety",
];
const statuses = ["All", "draft", "published", "archived"];

export const AdminBlog = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const { toast } = useToast();

  const {
    data: blogPosts = [],
    isLoading,
    error,
    refetch,
  } = useAdminBlogPosts({
    category: selectedCategory !== "All" ? selectedCategory : undefined,
    status: selectedStatus as any,
    search: search || undefined,
  });

  // Debug logging
  console.log("AdminBlog Debug:", {
    blogPosts,
    isLoading,
    error,
    selectedCategory,
    selectedStatus,
    search,
  });

  const deletePostMutation = useDeleteBlogPost();

  const handleDelete = async (id: string) => {
    try {
      await deletePostMutation.mutateAsync(id);
      toast({
        title: "Success",
        description: "Blog post deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete blog post",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isCreateModalOpen || editingPost) {
    return (
      <BlogPostEditor
        post={editingPost}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingPost(null);
        }}
        onSave={() => {
          setIsCreateModalOpen(false);
          setEditingPost(null);
          refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Blog Management</h1>
          <p className="text-muted-foreground">
            Manage your blog posts and content
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "All"
                    ? "All Statuses"
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Blog Posts List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div>Loading...</div>
        ) : blogPosts.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No blog posts found</p>
            <Button onClick={() => setIsCreateModalOpen(true)} className="mt-4">
              Create your first blog post
            </Button>
          </Card>
        ) : (
          blogPosts.map((post) => (
            <Card key={post.id} className="p-6">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold break-words">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(post.published_status)}>
                        {post.published_status}
                      </Badge>
                      <Badge variant="outline" className="whitespace-nowrap">
                        {post.category}
                      </Badge>
                    </div>
                  </div>

                  {post.excerpt && (
                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{post.author_username || "Unknown"}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {post.published_at
                          ? formatDate(post.published_at)
                          : formatDate(post.created_at)}
                      </span>
                    </div>

                    {post.view_count > 0 && (
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{post.view_count} views</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingPost(post)}
                    title="Edit Post"
                    className="shrink-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        title="Delete Post"
                        className="shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{post.title}"? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(post.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
