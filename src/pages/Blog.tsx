import React from 'react';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBlogPosts } from '@/hooks/useBlogPosts';

const categories = ["All", "Training", "Equipment", "Team Building", "Health", "Safety", "Hockey News"];

const Blog = () => {
  const [selectedCategory, setSelectedCategory] = React.useState("All");

  const { data: blogPosts = [], isLoading } = useBlogPosts({
    category: selectedCategory !== "All" ? selectedCategory : undefined,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Minor Hockey Talks Blog</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Insights, tips, and stories from the world of minor hockey
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Blog Posts Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading blog posts...</p>
        </div>
      ) : blogPosts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No blog posts found for the selected category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {post.featured_image ? (
                <div className="aspect-video bg-muted relative">
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-muted-foreground">
                      {post.category}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-muted relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-muted-foreground">
                      {post.category}
                    </span>
                  </div>
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs">
                    {post.category}
                  </Badge>
                  {post.read_time && (
                    <span className="text-xs text-muted-foreground">
                      {post.read_time} min read
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                  {post.title}
                </h3>
                
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{post.author_username || 'Admin'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" className="w-full group">
                  Read More
                  <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Coming Soon Message - only show if no posts */}
      {!isLoading && blogPosts.length === 0 && (
        <div className="text-center mt-12 p-8 bg-muted/50 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">More Content Coming Soon!</h2>
          <p className="text-muted-foreground mb-6">
            We're working on bringing you more valuable content about minor hockey. 
            Stay tuned for regular updates, expert insights, and community stories.
          </p>
          <Button variant="outline">
            Subscribe for Updates
          </Button>
        </div>
      )}
    </div>
  );
};

export default Blog;