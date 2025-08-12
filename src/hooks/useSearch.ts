import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  type: 'topic' | 'post' | 'category';
  author_username: string;
  category_name: string;
  category_color: string;
  category_slug?: string;
  slug?: string;
  topic_title?: string;
  topic_slug?: string;
  reply_count: number;
  view_count: number;
  created_at: string;
}

export type SearchFilter = 'all' | 'categories' | 'topics' | 'posts';

export const useSearch = (query: string, filter: SearchFilter = 'all') => {
  return useQuery({
    queryKey: ['search', query, filter],
    queryFn: async () => {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const searchTerm = query.trim();
      const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
      const results: SearchResult[] = [];
      
      // Search in topics (if filter allows)
      if (filter === 'all' || filter === 'topics') {
        // For multiple words, get broader results and filter client-side
        const searchConditions = searchWords.map(word => 
          `title.ilike.%${word}%,content.ilike.%${word}%`
        ).join(',');
        
        const { data: topicResults, error: topicError } = await supabase
          .from('forum_topics')
          .select(`
            id,
            title,
            content,
            slug,
            created_at,
            reply_count,
            view_count,
            author_id,
            category_id
          `)
          .eq('moderation_status', 'approved')
          .or(searchConditions)
          .order('created_at', { ascending: false })
          .limit(200); // Increased limit for client-side filtering

        if (topicError) {
          console.error('Error searching topics:', topicError);
          throw topicError;
        }

        // Filter results client-side to ensure ALL words are present
        const filteredTopics = topicResults?.filter((topic) => {
          const titleContent = `${topic.title} ${topic.content || ''}`.toLowerCase();
          return searchWords.every(word => 
            titleContent.includes(word.toLowerCase())
          );
        }) || [];

        // Get category data for topics
        const categoryIds = [...new Set(filteredTopics.map(topic => topic.category_id).filter(Boolean))];
        const categoriesData = categoryIds.length > 0 ? await supabase
          .from('categories')
          .select('id, name, color, slug')
          .in('id', categoryIds)
          .then(({ data }) => data || []) : [];

        const categoryMap = new Map();
        categoriesData.forEach(category => {
          categoryMap.set(category.id, category);
        });

        // Get author data for topics
        const topicAuthorIds = [...new Set(filteredTopics.map(topic => topic.author_id).filter(Boolean))];
        const [topicProfilesData, topicTempUsersData] = await Promise.all([
          topicAuthorIds.length > 0 ? supabase
            .from('profiles')
            .select('id, username')
            .in('id', topicAuthorIds)
            .then(({ data }) => data || []) : Promise.resolve([]),
          
          topicAuthorIds.length > 0 ? supabase
            .from('temporary_users')
            .select('id, display_name')
            .in('id', topicAuthorIds)
            .then(({ data }) => data || []) : Promise.resolve([])
        ]);

        // Create user map for topics
        const topicUserMap = new Map();
        topicProfilesData.forEach(profile => {
          topicUserMap.set(profile.id, profile.username);
        });
        topicTempUsersData.forEach(tempUser => {
          topicUserMap.set(tempUser.id, "Guest");
        });

        // Add topic results
        filteredTopics.forEach((topic) => {
          const authorUsername = topic.author_id ? topicUserMap.get(topic.author_id) || 'Anonymous User' : 'Anonymous User';
          const category = categoryMap.get(topic.category_id);
          results.push({
            id: topic.id,
            title: topic.title,
            content: topic.content || '',
            type: 'topic',
            author_username: authorUsername,
            category_name: category?.name || 'Unknown',
            category_color: category?.color || '#3b82f6',
            category_slug: category?.slug,
            slug: topic.slug,
            reply_count: topic.reply_count || 0,
            view_count: topic.view_count || 0,
            created_at: topic.created_at,
          });
        });
      }

      // Search in posts (if filter allows)
      if (filter === 'all' || filter === 'posts') {
        // For posts, search in content field with topic and category joins
        const searchConditions = searchWords.map(word => 
          `content.ilike.%${word}%`
        ).join(',');

        const { data: postResults, error: postError } = await supabase
          .from('forum_posts')
          .select(`
            id,
            content,
            created_at,
            author_id,
            topic_id
          `)
          .eq('moderation_status', 'approved')
          .or(searchConditions)
          .order('created_at', { ascending: false })
          .limit(200);

        if (postError) {
          console.error('Error searching posts:', postError);
          throw postError;
        }

        // Filter results client-side to ensure ALL words are present
        const filteredPosts = postResults?.filter((post) => {
          const content = post.content.toLowerCase();
          return searchWords.every(word => 
            content.includes(word.toLowerCase())
          );
        }) || [];

        // Get author data for posts
        const postAuthorIds = [...new Set(filteredPosts.map(post => post.author_id).filter(Boolean))];
        const [postProfilesData, postTempUsersData] = await Promise.all([
          postAuthorIds.length > 0 ? supabase
            .from('profiles')
            .select('id, username')
            .in('id', postAuthorIds)
            .then(({ data }) => data || []) : Promise.resolve([]),
          
          postAuthorIds.length > 0 ? supabase
            .from('temporary_users')
            .select('id, display_name')
            .in('id', postAuthorIds)
            .then(({ data }) => data || []) : Promise.resolve([])
        ]);

        // Create user map for posts
        const postUserMap = new Map();
        postProfilesData.forEach(profile => {
          postUserMap.set(profile.id, profile.username);
        });
        postTempUsersData.forEach(tempUser => {
          postUserMap.set(tempUser.id, "Guest");
        });

        // Get topic data for posts to get topic titles and categories
        const topicIds = [...new Set(filteredPosts.map(post => post.topic_id).filter(Boolean))];
        const topicsData = topicIds.length > 0 ? await supabase
          .from('forum_topics')
          .select('id, title, slug, category_id')
          .in('id', topicIds)
          .then(({ data }) => data || []) : [];

        const topicMap = new Map();
        topicsData.forEach(topic => {
          topicMap.set(topic.id, topic);
        });

        // Get category data for the topics
        const postCategoryIds = [...new Set(topicsData.map(topic => topic.category_id).filter(Boolean))];
        const postCategoriesData = postCategoryIds.length > 0 ? await supabase
          .from('categories')
          .select('id, name, color, slug')
          .in('id', postCategoryIds)
          .then(({ data }) => data || []) : [];

        const postCategoryMap = new Map();
        postCategoriesData.forEach(category => {
          postCategoryMap.set(category.id, category);
        });

        // Add post results with topic context
        filteredPosts.forEach((post) => {
          const authorUsername = post.author_id ? postUserMap.get(post.author_id) || 'Anonymous User' : 'Anonymous User';
          const topic = topicMap.get(post.topic_id);
          const category = topic ? postCategoryMap.get(topic.category_id) : null;
          const topicTitle = topic?.title || 'Unknown Topic';
          
          results.push({
            id: post.id,
            title: `Post in "${topicTitle}"`,
            content: post.content,
            type: 'post',
            author_username: authorUsername,
            category_name: category?.name || 'Unknown',
            category_color: category?.color || '#3b82f6',
            category_slug: category?.slug,
            topic_title: topicTitle,
            topic_slug: topic?.slug,
            reply_count: 0,
            view_count: 0,
            created_at: post.created_at,
          });
        });
      }

      // Search in categories (if filter allows)
      if (filter === 'all' || filter === 'categories') {
        // For categories, search in name and description
        const searchConditions = searchWords.map(word => 
          `name.ilike.%${word}%,description.ilike.%${word}%`
        ).join(',');

        const { data: categoryResults, error: categoryError } = await supabase
          .from('categories')
          .select(`
            id,
            name,
            description,
            color,
            slug,
            created_at
          `)
          .or(searchConditions)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(100); // Increased limit for client-side filtering

        if (categoryError) {
          console.error('Error searching categories:', categoryError);
          throw categoryError;
        }

        // Filter results client-side to ensure ALL words are present
        const filteredCategories = categoryResults?.filter((category) => {
          const nameDescription = `${category.name} ${category.description || ''}`.toLowerCase();
          return searchWords.every(word => 
            nameDescription.includes(word.toLowerCase())
          );
        }) || [];

        // Add category results
        filteredCategories.forEach((category) => {
          results.push({
            id: category.id,
            title: category.name,
            content: category.description || '',
            type: 'category',
            author_username: 'System',
            category_name: category.name,
            category_color: category.color || '#3b82f6',
            category_slug: category.slug,
            reply_count: 0,
            view_count: 0,
            created_at: category.created_at,
          });
        });
      }

      // Sort by creation date (most recent first)
      return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !!query && query.trim().length >= 2,
  });
};