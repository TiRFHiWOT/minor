import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useForumSettings } from '@/hooks/useForumSettings';
import { useAuth } from '@/hooks/useAuth';

interface PageMetadata {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

interface MetadataContextType {
  setPageMetadata: (metadata: PageMetadata) => void;
}

const MetadataContext = createContext<MetadataContextType | null>(null);

export const useMetadata = () => {
  const context = useContext(MetadataContext);
  if (!context) {
    throw new Error('useMetadata must be used within MetadataProvider');
  }
  return context;
};

interface MetadataProviderProps {
  children: ReactNode;
}

export const MetadataProvider: React.FC<MetadataProviderProps> = ({ children }) => {
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { getSetting } = useForumSettings();
  const { user } = useAuth();
  const [customMetadata, setCustomMetadata] = React.useState<PageMetadata>({});

  // Get category metadata if on category page
  const { data: categoryMetadata } = useQuery({
    queryKey: ['category-metadata', params.categorySlug],
    queryFn: async () => {
      if (!params.categorySlug) return null;
      
      const { data, error } = await supabase
        .from('categories')
        .select('name, meta_title, meta_description, meta_keywords, canonical_url, og_title, og_description, og_image')
        .eq('slug', params.categorySlug)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!params.categorySlug
  });

  // Get topic metadata if on topic page - using same logic as useTopicByPath
  const { data: topicMetadata } = useQuery({
    queryKey: ['topic-metadata', params.categorySlug, params.subcategorySlug, params.topicSlug],
    queryFn: async () => {
      console.log('MetadataProvider: Fetching topic metadata for:', { 
        categorySlug: params.categorySlug, 
        subcategorySlug: params.subcategorySlug, 
        topicSlug: params.topicSlug 
      });
      
      if (!params.topicSlug || !params.categorySlug) return null;
      
      // Get category ID first - handle hierarchical structure like useTopicByPath
      let categoryData;
      let categoryError;
      
      if (params.subcategorySlug) {
        // Hierarchical: validate parent-child relationship
        const { data: parentCategory, error: parentError } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', params.categorySlug)
          .single();
        
        if (parentError) {
          console.error('MetadataProvider: Error fetching parent category:', parentError);
          return null;
        }
        
        const { data: childCategory, error: childError } = await supabase
          .from('categories')
          .select('id, parent_category_id')
          .eq('slug', params.subcategorySlug)
          .eq('parent_category_id', parentCategory.id)
          .single();
        
        categoryData = childCategory;
        categoryError = childError;
      } else {
        // Single category
        const { data, error } = await supabase
          .from('categories')
          .select('id, parent_category_id')
          .eq('slug', params.categorySlug)
          .single();
        
        categoryData = data;
        categoryError = error;
      }
      
      if (categoryError) {
        console.error('MetadataProvider: Error fetching category:', categoryError);
        return null;
      }
      
      // Get topic by slug and category
      const { data: topicData, error: topicError } = await supabase
        .from('topics')
        .select('meta_title, meta_description, meta_keywords, canonical_url, og_title, og_description, og_image, title, content')
        .eq('slug', params.topicSlug)
        .eq('category_id', categoryData.id)
        .single();
      
      if (topicError) {
        console.error('MetadataProvider: Error fetching topic:', topicError);
        return null;
      }
      
      console.log('MetadataProvider: Successfully fetched topic metadata:', topicData);
      return topicData;
    },
    enabled: !!params.categorySlug && !!params.topicSlug
  });

  const setPageMetadata = (metadata: PageMetadata) => {
    setCustomMetadata(metadata);
  };

  // Get user profile data for profile page
  const { data: profileData } = useQuery({
    queryKey: ['profile-metadata', user?.id],
    queryFn: async () => {
      if (!user?.id || location.pathname !== '/profile') return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!user?.id && location.pathname === '/profile'
  });

  // Determine page metadata based on current route
  const getPageMetadata = (): PageMetadata => {
    const baseTitle = getSetting('forum_name', 'Minor Hockey Talks');
    const baseSeparator = ' - ';

    // Custom metadata takes highest priority
    if (Object.keys(customMetadata).length > 0) {
      return {
        title: customMetadata.title ? `${customMetadata.title}${baseSeparator}${baseTitle}` : undefined,
        ...customMetadata
      };
    }

    // Topic page metadata
    if (topicMetadata && params.topicSlug) {
      return {
        title: topicMetadata.meta_title || `${topicMetadata.title}${baseSeparator}${baseTitle}`,
        description: topicMetadata.meta_description || (topicMetadata.content ? topicMetadata.content.substring(0, 160) : undefined),
        keywords: topicMetadata.meta_keywords,
        canonical: topicMetadata.canonical_url,
        ogTitle: topicMetadata.og_title || topicMetadata.title,
        ogDescription: topicMetadata.og_description || topicMetadata.meta_description,
        ogImage: topicMetadata.og_image
      };
    }

    // Category page metadata
    if (categoryMetadata && params.categorySlug) {
      return {
        title: categoryMetadata.meta_title || `${categoryMetadata.name || params.categorySlug}${baseSeparator}${baseTitle}`,
        description: categoryMetadata.meta_description,
        keywords: categoryMetadata.meta_keywords,
        canonical: categoryMetadata.canonical_url,
        ogTitle: categoryMetadata.og_title,
        ogDescription: categoryMetadata.og_description,
        ogImage: categoryMetadata.og_image
      };
    }

    // Dynamic route-based titles
    const path = location.pathname;
    const searchQuery = searchParams.get('q');

    // Home page
    if (path === '/') {
      return {
        title: getSetting('seo_home_title', baseTitle),
        description: getSetting('seo_home_description', 'Join the leading online community for minor hockey players, parents, and coaches.'),
        keywords: getSetting('seo_home_keywords', 'minor hockey, youth hockey, hockey community'),
        canonical: getSetting('seo_home_canonical_url', ''),
        ogTitle: getSetting('seo_home_og_title', ''),
        ogDescription: getSetting('seo_home_og_description', ''),
        ogImage: getSetting('seo_home_og_image', '')
      };
    }

    // Search page
    if (path === '/search') {
      const title = searchQuery 
        ? `Search results for "${searchQuery}"${baseSeparator}${baseTitle}`
        : `Search${baseSeparator}${baseTitle}`;
      return {
        title,
        description: searchQuery 
          ? `Search results for "${searchQuery}" on ${baseTitle}`
          : `Search topics and discussions on ${baseTitle}`
      };
    }

    // Profile page
    if (path === '/profile') {
      const username = profileData?.username || 'User';
      return {
        title: `${username}'s Profile${baseSeparator}${baseTitle}`,
        description: `View ${username}'s profile, posts, and activity on ${baseTitle}`
      };
    }

    // Admin pages
    if (path.startsWith('/admin')) {
      const adminSection = path.split('/')[2];
      const sectionTitles: Record<string, string> = {
        users: 'User Management',
        content: 'Content Management',
        moderation: 'Moderation',
        spam: 'Spam Management',
        seo: 'SEO Settings',
        settings: 'Settings'
      };
      
      const sectionTitle = adminSection ? sectionTitles[adminSection] || 'Dashboard' : 'Dashboard';
      return {
        title: `Admin ${sectionTitle}${baseSeparator}${baseTitle}`,
        description: `Admin panel - ${sectionTitle} for ${baseTitle}`
      };
    }

    // Static pages with comprehensive coverage
    const routeTitles: Record<string, { title: string; description: string }> = {
      '/topics': {
        title: `All Topics${baseSeparator}${baseTitle}`,
        description: `Browse all topics and discussions on ${baseTitle}`
      },
      '/categories': {
        title: `Categories${baseSeparator}${baseTitle}`,
        description: `Browse all discussion categories on ${baseTitle}`
      },
      '/settings': {
        title: `Account Settings${baseSeparator}${baseTitle}`,
        description: `Manage your account settings and preferences on ${baseTitle}`
      },
      '/login': {
        title: `Login${baseSeparator}${baseTitle}`,
        description: `Sign in to your ${baseTitle} account`
      },
      '/register': {
        title: `Register${baseSeparator}${baseTitle}`,
        description: `Create a new account on ${baseTitle}`
      },
      '/create': {
        title: `Create Topic${baseSeparator}${baseTitle}`,
        description: `Start a new discussion on ${baseTitle}`
      },
      '/terms': {
        title: `Terms of Service${baseSeparator}${baseTitle}`,
        description: `Terms of service and user agreement for ${baseTitle}`
      },
      '/privacy': {
        title: `Privacy Policy${baseSeparator}${baseTitle}`,
        description: `Privacy policy and data protection information for ${baseTitle}`
      },
      '/blog': {
        title: `Blog${baseSeparator}${baseTitle}`,
        description: `Latest news and updates from ${baseTitle}`
      }
    };

    // Check for exact route match
    if (routeTitles[path]) {
      return routeTitles[path];
    }

    // Default fallback
    return {
      title: baseTitle,
      description: "Join the leading online community for minor hockey players, parents, and coaches."
    };
  };

  const metadata = getPageMetadata();

  return (
    <MetadataContext.Provider value={{ setPageMetadata }}>
      <Helmet>
        {metadata.title && <title>{metadata.title}</title>}
        {metadata.description && <meta name="description" content={metadata.description} />}
        {metadata.keywords && <meta name="keywords" content={metadata.keywords} />}
        {metadata.canonical && <link rel="canonical" href={metadata.canonical} />}
        
        {/* RSS Feed Discovery */}
        <link 
          rel="alternate" 
          type="application/rss+xml" 
          title={`${getSetting('forum_name', 'Minor Hockey Talks')} RSS Feed`}
          href="/rss" 
        />
        {params.categorySlug && (
          <link 
            rel="alternate" 
            type="application/rss+xml" 
            title={`${getSetting('forum_name', 'Minor Hockey Talks')} - ${params.categorySlug} RSS Feed`}
            href={`/rss?category=${params.categorySlug}`}
          />
        )}
        
        {/* Open Graph tags */}
        {metadata.ogTitle && <meta property="og:title" content={metadata.ogTitle} />}
        {metadata.ogDescription && <meta property="og:description" content={metadata.ogDescription} />}
        {metadata.ogImage && <meta property="og:image" content={metadata.ogImage} />}
        
        {/* Twitter Card tags */}
        {metadata.ogTitle && <meta name="twitter:title" content={metadata.ogTitle} />}
        {metadata.ogDescription && <meta name="twitter:description" content={metadata.ogDescription} />}
        {metadata.ogImage && <meta name="twitter:image" content={metadata.ogImage} />}
      </Helmet>
      {children}
    </MetadataContext.Provider>
  );
};