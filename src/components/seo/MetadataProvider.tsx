import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useForumSettings } from '@/hooks/useForumSettings';
import { useAuth } from '@/hooks/useAuth';
import { htmlToText } from '@/utils/htmlToText';
import { 
  generateTopicTitle, 
  generateCategoryTitle, 
  generateTopicDescription, 
  generateCategoryDescription,
  shouldUseAutoGeneration,
  FORUM_NAME
} from '@/utils/seoHelpers';

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
  
  // Get forum settings for SEO
  const forumName = getSetting('forum_name_override', 'Minor Hockey Talks');
  const titleSeparator = getSetting('seo_title_separator', ' | ');
  const autoGenerationEnabled = getSetting('seo_auto_generate_topic_titles', true);

  // Get topic metadata if on topic page
  const { data: topicMetadata } = useQuery({
    queryKey: ['topic-metadata', params.topicSlug],
    queryFn: async () => {
      console.log('🔍 MetadataProvider: Fetching topic metadata for:', { 
        topicSlug: params.topicSlug,
        currentPath: location.pathname,
        allParams: params
      });
      
      if (!params.topicSlug) {
        console.log('❌ No topicSlug found in params');
        return null;
      }
      
      // Get topic by slug first, then get its category info
      const { data: topic, error: topicError } = await supabase
        .from('topics')
        .select(`
          id,
          title,
          content,
          slug,
          category_id,
          meta_title,
          meta_description,
          meta_keywords,
          canonical_url,
          og_title,
          og_description,
          og_image,
          categories (
            id,
            name,
            slug
          )
        `)
        .eq('slug', params.topicSlug)
        .maybeSingle();
      
      console.log('📊 Supabase topic query result:', { 
        data: topic, 
        error: topicError,
        searchedSlug: params.topicSlug 
      });
      
      if (topicError) {
        console.error('❌ MetadataProvider: Error fetching topic:', topicError);
        return null;
      }

      if (!topic) {
        console.warn('⚠️ MetadataProvider: No topic found for slug:', params.topicSlug);
        
        // Try fallback search by title if slug doesn't match
        console.log('🔄 Attempting fallback search by title...');
        const titleSearch = params.topicSlug.split('-').join(' ');
        
        const { data: fallbackTopic, error: fallbackError } = await supabase
          .from('topics')
          .select(`
            id,
            title,
            content,
            slug,
            category_id,
            meta_title,
            meta_description,
            meta_keywords,
            canonical_url,
            og_title,
            og_description,
            og_image,
            categories (
              id,
              name,
              slug
            )
          `)
          .ilike('title', `%${titleSearch}%`)
          .limit(1)
          .maybeSingle();
          
        console.log('📊 Fallback search result:', { 
          data: fallbackTopic, 
          error: fallbackError,
          searchedTitle: titleSearch
        });
        
        if (fallbackTopic) {
          return {
            ...fallbackTopic,
            category_name: fallbackTopic.categories?.name
          };
        }
        
        return null;
      }

      console.log('✅ MetadataProvider: Found topic:', {
        title: topic.title,
        slug: topic.slug,
        category: topic.categories?.name,
        meta_title: topic.meta_title
      });
      
      // Add category name to topic data for easy access
      return {
        ...topic,
        category_name: topic.categories?.name
      };
    },
    enabled: !!params.topicSlug
  });

  // Get category metadata if on category page (and not topic page)
  const { data: categoryMetadata } = useQuery({
    queryKey: ['category-metadata', params.categorySlug, params.subcategorySlug],
    queryFn: async () => {
      if (!params.categorySlug || params.topicSlug) return null;
      
      // Handle hierarchical structure
      let categorySlug = params.subcategorySlug || params.categorySlug;
      
      const { data, error } = await supabase
        .from('categories')
        .select('name, meta_title, meta_description, meta_keywords, canonical_url, og_title, og_description, og_image')
        .eq('slug', categorySlug)
        .single();
      
      if (error) {
        console.error('MetadataProvider: Error fetching category:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!params.categorySlug && !params.topicSlug
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

  // Helpers for formatting
  const formatSlug = (slug?: string) => {
    if (!slug) return '';
    return slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
  };
  const truncate = (s: string, len = 160) => (s.length > len ? s.slice(0, len - 1).trimEnd() + '…' : s);

  // Determine page metadata based on current route
  const getPageMetadata = (): PageMetadata => {

    // Custom metadata takes highest priority
    if (Object.keys(customMetadata).length > 0) {
      return {
        title: customMetadata.title ? `${customMetadata.title}${titleSeparator}${forumName}` : undefined,
        ...customMetadata
      };
    }

    // Topic page metadata - Database first approach
    if (topicMetadata && params.topicSlug) {
      const catName = (topicMetadata as any).category_name || formatSlug(params.subcategorySlug || params.categorySlug || '');
      
      console.log('🏷️ MetadataProvider: Generating topic title with components:', {
        topicTitle: topicMetadata.title,
        categoryName: catName,
        forumName,
        separator: titleSeparator,
        existingMetaTitle: topicMetadata.meta_title,
        autoGenerationEnabled
      });
      
      // Use database meta_title if it exists, otherwise auto-generate with all 3 components
      let title;
      if (topicMetadata.meta_title) {
        title = topicMetadata.meta_title;
        console.log('✅ Using database meta_title:', title);
      } else if (autoGenerationEnabled) {
        title = generateTopicTitle({
          topicTitle: topicMetadata.title || formatSlug(params.topicSlug!),
          categoryName: catName,
          forumName,
          separator: titleSeparator
        });
        console.log('✅ Auto-generated title with all components:', title);
      } else {
        title = `${topicMetadata.title || formatSlug(params.topicSlug!)}${titleSeparator}${forumName}`;
        console.log('✅ Basic title (auto-generation disabled):', title);
      }
      
      const description = topicMetadata.meta_description || generateTopicDescription({
        topicTitle: topicMetadata.title || formatSlug(params.topicSlug!),
        categoryName: catName,
        topicContent: topicMetadata.content,
        forumName
      });
      
      console.log('📄 Final topic metadata:', { 
        title, 
        description,
        components: {
          topicTitle: topicMetadata.title,
          categoryName: catName,
          forumName: forumName
        }
      });
      
      return {
        title,
        description,
        keywords: topicMetadata.meta_keywords,
        canonical: topicMetadata.canonical_url,
        ogTitle: topicMetadata.og_title || title,
        ogDescription: topicMetadata.og_description || description,
        ogImage: topicMetadata.og_image
      };
    }

    // Fallback while topic/category data loads
    if (params.topicSlug) {
      const cat = formatSlug(params.subcategorySlug || params.categorySlug || '');
      const t = formatSlug(params.topicSlug);
      const fallbackTitle = generateTopicTitle({
        topicTitle: t,
        categoryName: cat,
        forumName,
        separator: titleSeparator
      });
      
      console.log('MetadataProvider: Using fallback topic title:', fallbackTitle);
      
      // Set fallback title immediately for analytics
      if (document.title !== fallbackTitle) {
        document.title = fallbackTitle;
      }
      
      return {
        title: fallbackTitle,
        description: generateTopicDescription({
          topicTitle: t,
          categoryName: cat,
          forumName
        })
      };
    }

    // Category page metadata - Database first approach
    if (categoryMetadata && params.categorySlug && !params.topicSlug) {
      const categoryName = categoryMetadata.name || formatSlug(params.categorySlug);
      
      // Use database meta_title if it exists, otherwise auto-generate
      const title = categoryMetadata.meta_title || generateCategoryTitle(categoryName, forumName, titleSeparator);
      const description = categoryMetadata.meta_description || generateCategoryDescription(categoryName, forumName);
      
      return {
        title,
        description,
        keywords: categoryMetadata.meta_keywords,
        canonical: categoryMetadata.canonical_url,
        ogTitle: categoryMetadata.og_title || title,
        ogDescription: categoryMetadata.og_description || description,
        ogImage: categoryMetadata.og_image
      };
    }

    // Fallback while category loads
    if (params.categorySlug && !params.topicSlug) {
      const c = formatSlug(params.categorySlug);
      return {
        title: generateCategoryTitle(c, forumName, titleSeparator),
        description: generateCategoryDescription(c, forumName)
      };
    }

    // Dynamic route-based titles
    const path = location.pathname;
    const searchQuery = searchParams.get('q');

    // Home page
    if (path === '/') {
      return {
        title: getSetting('seo_home_title', forumName),
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
        ? `Search results for "${searchQuery}"${titleSeparator}${forumName}`
        : `Search${titleSeparator}${forumName}`;
      return {
        title,
        description: searchQuery 
          ? `Search results for "${searchQuery}" on ${forumName}`
          : `Search topics and discussions on ${forumName}`
      };
    }

    // Profile page
    if (path === '/profile') {
      const username = profileData?.username || 'User';
      return {
        title: `${username}'s Profile${titleSeparator}${forumName}`,
        description: `View ${username}'s profile, posts, and activity on ${forumName}`
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
        title: `Admin ${sectionTitle}${titleSeparator}${forumName}`,
        description: `Admin panel - ${sectionTitle} for ${forumName}`
      };
    }

    // Static pages with comprehensive coverage
    const routeTitles: Record<string, { title: string; description: string }> = {
      '/topics': {
        title: `All Topics${titleSeparator}${forumName}`,
        description: `Browse all topics and discussions on ${forumName}`
      },
      '/categories': {
        title: `Categories${titleSeparator}${forumName}`,
        description: `Browse all discussion categories on ${forumName}`
      },
      '/settings': {
        title: `Account Settings${titleSeparator}${forumName}`,
        description: `Manage your account settings and preferences on ${forumName}`
      },
      '/login': {
        title: `Login${titleSeparator}${forumName}`,
        description: `Sign in to your ${forumName} account`
      },
      '/register': {
        title: `Register${titleSeparator}${forumName}`,
        description: `Create a new account on ${forumName}`
      },
      '/create': {
        title: `Create Topic${titleSeparator}${forumName}`,
        description: `Start a new discussion on ${forumName}`
      },
      '/terms': {
        title: `Terms of Service${titleSeparator}${forumName}`,
        description: `Terms of service and user agreement for ${forumName}`
      },
      '/privacy': {
        title: `Privacy Policy${titleSeparator}${forumName}`,
        description: `Privacy policy and data protection information for ${forumName}`
      },
      '/blog': {
        title: `Blog${titleSeparator}${forumName}`,
        description: `Latest news and updates from ${forumName}`
      }
    };

    // Check for exact route match
    if (routeTitles[path]) {
      return routeTitles[path];
    }

    // Default fallback
    return {
      title: forumName,
      description: "Join the leading online community for minor hockey players, parents, and coaches."
    };
  };

  const metadata = getPageMetadata();
  
  // Debug logging for title tracking
  console.log('🏷️ MetadataProvider computed metadata:', metadata);
  console.log('📄 Current document.title:', document.title);
  console.log('🔍 Current pathname:', location.pathname);
  console.log('🔗 URL params:', { 
    topicSlug: params.topicSlug, 
    categorySlug: params.categorySlug, 
    subcategorySlug: params.subcategorySlug 
  });
  console.log('💾 Topic metadata state:', !!topicMetadata ? 'LOADED' : 'NULL');
  console.log('💾 Category metadata state:', !!categoryMetadata ? 'LOADED' : 'NULL');

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
          title={`${forumName} RSS Feed`}
          href="/rss" 
        />
        {params.categorySlug && (
          <link 
            rel="alternate" 
            type="application/rss+xml" 
            title={`${forumName} - ${params.categorySlug} RSS Feed`}
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