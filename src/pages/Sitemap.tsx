import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCategories } from '@/hooks/useCategories';
import { useTopics } from '@/hooks/useTopics';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { Search, ExternalLink, FileText, FolderOpen, PenTool } from 'lucide-react';

interface SitemapSection {
  title: string;
  description: string;
  icon: React.ReactNode;
  items: Array<{
    title: string;
    url: string;
    lastmod?: string;
    priority?: number;
  }>;
}

export default function Sitemap() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSections, setFilteredSections] = useState<SitemapSection[]>([]);
  
  const { data: categories } = useCategories();
  const { data: topics } = useTopics();
  const { data: blogPosts } = useBlogPosts();

  const staticPages = [
    { title: 'Home', url: '/', priority: 1.0 },
    { title: 'Categories', url: '/categories', priority: 0.9 },
    { title: 'All Topics', url: '/topics', priority: 0.8 },
    { title: 'Blog', url: '/blog', priority: 0.8 },
    { title: 'Search', url: '/search', priority: 0.6 },
    { title: 'Rules', url: '/rules', priority: 0.4 },
    { title: 'Terms & Conditions', url: '/terms', priority: 0.2 },
    { title: 'Privacy Policy', url: '/privacy', priority: 0.2 },
  ];

  const sections: SitemapSection[] = [
    {
      title: 'Main Pages',
      description: 'Core pages and navigation',
      icon: <FileText className="h-5 w-5" />,
      items: staticPages,
    },
    {
      title: 'Categories',
      description: 'Forum discussion categories',
      icon: <FolderOpen className="h-5 w-5" />,
      items: (categories || []).map(cat => ({
        title: cat.name,
        url: `/${cat.slug}`,
        lastmod: new Date().toISOString(),
        priority: 0.8,
      })),
    },
    {
      title: 'Topics',
      description: 'Forum discussion topics',
      icon: <FileText className="h-5 w-5" />,
      items: (topics?.data || []).slice(0, 50).map(topic => ({
        title: topic.title,
        url: topic.categories?.slug
          ? `/${topic.categories.slug}/${topic.slug}`
          : `/topic/${topic.slug}`,
        lastmod: topic.updated_at || topic.created_at,
        priority: 0.6,
      })),
    },
    {
      title: 'Blog Posts',
      description: 'Latest blog articles',
      icon: <PenTool className="h-5 w-5" />,
      items: (blogPosts || []).map(post => ({
        title: post.title,
        url: `/blog/${post.slug}`,
        lastmod: post.updated_at || post.published_at,
        priority: 0.7,
      })),
    },
  ];

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSections(sections);
      return;
    }

    const filtered = sections
      .map(section => ({
        ...section,
        items: section.items.filter(item =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.url.toLowerCase().includes(searchTerm.toLowerCase())
        ),
      }))
      .filter(section => section.items.length > 0);

    setFilteredSections(filtered);
  }, [searchTerm, categories, topics, blogPosts]);

  const totalUrls = sections.reduce((sum, section) => sum + section.items.length, 0);
  const visibleUrls = filteredSections.reduce((sum, section) => sum + section.items.length, 0);

  const getPriorityColor = (priority?: number) => {
    if (!priority) return 'secondary';
    if (priority >= 0.8) return 'default';
    if (priority >= 0.5) return 'secondary';
    return 'outline';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <Helmet>
        <title>Sitemap - Minor Hockey Talks</title>
        <meta name="description" content="Complete sitemap of Minor Hockey Talks forum including all categories, topics, and blog posts. Navigate and discover content easily." />
        <link rel="canonical" href={`${window.location.origin}/sitemap`} />
      </Helmet>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">🏒 Site Map</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore all content on Minor Hockey Talks. Find categories, topics, blog posts, and important pages.
          </p>
          
          <div className="flex justify-center gap-8 text-sm text-muted-foreground">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalUrls}</div>
              <div>Total URLs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{visibleUrls}</div>
              <div>Visible URLs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{sections.length}</div>
              <div>Sections</div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Sitemap
            </CardTitle>
            <CardDescription>
              Find specific pages, topics, or categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search URLs, titles, or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {filteredSections.map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {section.icon}
                  {section.title}
                  <Badge variant="secondary">{section.items.length}</Badge>
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              to={item.url}
                              className="font-medium text-primary hover:underline truncate"
                            >
                              {item.title}
                            </Link>
                            <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {item.url}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {item.priority && (
                            <Badge variant={getPriorityColor(item.priority)}>
                              {(item.priority * 100).toFixed(0)}%
                            </Badge>
                          )}
                          {item.lastmod && (
                            <span className="text-xs text-muted-foreground">
                              {formatDate(item.lastmod)}
                            </span>
                          )}
                        </div>
                      </div>
                      {itemIndex < section.items.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSections.length === 0 && searchTerm && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                No results found for "{searchTerm}". Try a different search term.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="bg-muted/50">
          <CardContent className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-4">
              This sitemap helps you discover all content on our forum. For search engines, 
              we also provide XML sitemaps.
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <a 
                href="/sitemap.xml" 
                className="text-primary hover:underline flex items-center gap-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3 w-3" />
                XML Sitemap
              </a>
              <a 
                href="/robots.txt" 
                className="text-primary hover:underline flex items-center gap-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3 w-3" />
                Robots.txt
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}