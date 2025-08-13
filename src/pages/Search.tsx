
import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MessageSquare, User, Clock, FileText, FolderOpen } from 'lucide-react';
import { useSearch, SearchFilter } from '@/hooks/useSearch';
import { formatDistanceToNow } from 'date-fns';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const filterParam = searchParams.get('filter') as SearchFilter || 'all';
  const [searchTerm, setSearchTerm] = useState(query);
  const [filter, setFilter] = useState<SearchFilter>(filterParam);
  
  const { data: searchResults = [], isLoading, error } = useSearch(query, filter);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const params = new URLSearchParams();
      params.set('q', searchTerm);
      if (filter !== 'all') {
        params.set('filter', filter);
      }
      window.location.href = `/search?${params.toString()}`;
    }
  };

  const handleFilterChange = (newFilter: SearchFilter) => {
    setFilter(newFilter);
    if (query) {
      const params = new URLSearchParams();
      params.set('q', query);
      if (newFilter !== 'all') {
        params.set('filter', newFilter);
      }
      window.location.href = `/search?${params.toString()}`;
    }
  };

  const getPlaceholderText = () => {
    switch (filter) {
      case 'categories':
        return 'Search categories...';
      case 'topics':
        return 'Search topics...';
      case 'posts':
        return 'Search posts...';
      default:
        return 'Search topics, posts, and categories...';
    }
  };

  const getFilteredResultsText = () => {
    if (!query || isLoading) return '';
    
    const count = searchResults.length;
    const filterText = filter === 'all' ? '' : ` ${filter}`;
    return `(${count}${filterText} results found)`;
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Search Results</h1>
        {query && (
          <p className="text-muted-foreground">
            Showing results for "{query}" {getFilteredResultsText()}
          </p>
        )}
      </div>

      {/* Search Form */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={getPlaceholderText()}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filter:</span>
              <Select value={filter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="categories">Categories</SelectItem>
                  <SelectItem value="topics">Topics</SelectItem>
                  <SelectItem value="posts">Posts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Search</Button>
          </div>
        </form>
      </Card>


      {/* Search Results */}
      {query && (
        <Card className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Searching...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Search Error</h3>
              <p className="text-muted-foreground mb-4">
                There was an error performing your search. Please try again.
              </p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-4">
              {searchResults.map((result) => (
                <div key={`${result.type}-${result.id}`} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-start justify-between">
                    <div className="flex-1">
                       <div className="flex items-center space-x-2 mb-2">
                        {result.type === 'post' ? (
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        ) : result.type === 'category' ? (
                          <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Badge variant="outline" className="text-xs">
                          {result.type === 'post' ? 'Post' : result.type === 'category' ? 'Category' : 'Topic'}
                        </Badge>
                        {result.type === 'post' && result.topic_title && (
                          <span className="text-xs text-muted-foreground">
                            in {result.category_name} › {result.topic_title}
                          </span>
                        )}
                      </div>
                      <Link 
                        to={result.type === 'category' 
                          ? `/category/${result.category_slug || result.id}` 
                          : result.type === 'post' && result.topic_slug
                          ? `/${result.category_slug}/${result.topic_slug}#post-${result.id}`
                          : (result.category_slug && result.slug 
                            ? `/${result.category_slug}/${result.slug}` 
                            : `/topic/${result.id}`)
                        }
                        className="font-medium text-foreground hover:text-primary text-lg"
                      >
                        {result.title}
                      </Link>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {truncateContent(result.content)}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                        {result.type !== 'category' && <span>by {result.author_username}</span>}
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{ color: result.category_color }}
                        >
                          {result.category_name}
                        </Badge>
                        {result.type === 'topic' && (
                          <>
                            <div className="flex items-center space-x-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>{result.reply_count} replies</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{result.view_count} views</span>
                            </div>
                          </>
                        )}
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDistanceToNow(new Date(result.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No results found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or browse our categories
              </p>
              <Button asChild>
                <Link to="/">Browse Forum</Link>
              </Button>
            </div>
          )}
        </Card>
      )}


      {/* No Search Query */}
      {!query && (
        <Card className="p-6 text-center">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Search the Forum</h3>
          <p className="text-muted-foreground mb-4">
            Enter your search terms above to find topics, posts, and discussions
          </p>
          <Button asChild>
            <Link to="/">Back to Forum</Link>
          </Button>
        </Card>
      )}
    </div>
  );
};

export default SearchPage;
