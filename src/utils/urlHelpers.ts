export const generateTopicUrl = (topic: {
  slug: string;
  categories?: {
    slug: string;
    parent_category_id?: string;
    parent_category?: {
      slug: string;
    };
  };
}) => {
  if (!topic.categories) return `/topic/${topic.slug}`;
  
  // For hierarchical structure based on category level
  if (topic.categories.parent_category_id && topic.categories.parent_category) {
    // Level 3 category: /parent-slug/subcategory-slug/topic-slug
    return `/${topic.categories.parent_category.slug}/${topic.categories.slug}/${topic.slug}`;
  } else {
    // Level 2 category: /category-slug/topic-slug
    return `/${topic.categories.slug}/${topic.slug}`;
  }
};

export const generateCategoryUrl = (category: {
  slug: string;
  parent_category_id?: string;
  parent_category?: {
    slug: string;
  };
}) => {
  // For hierarchical structure based on category level
  if (category.parent_category_id && category.parent_category) {
    // Level 3 category: /parent-slug/subcategory-slug
    return `/${category.parent_category.slug}/${category.slug}`;
  } else {
    // Level 2 category: /category-slug
    return `/${category.slug}`;
  }
};

export const generateSlugFromTitle = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .trim();
};

// Enhanced URL reconstruction that preserves original structure
export const reconstructPreservingOriginal = (oldUrl: string): string | null => {
  // Extract topic ID (critical for preservation)
  const topicIdMatch = oldUrl.match(/-t(\d+)\.html$/);
  if (!topicIdMatch) return null;
  
  const topicId = topicIdMatch[1];
  
  // Extract components while preserving original structure
  const filename = oldUrl.split('/').pop()?.replace('.html', '') || '';
  const year = filename.match(/20\d{2}/)?.[0];
  const levelMatch = filename.match(/-a{1,3}(?![a-z])/i);
  const level = levelMatch ? levelMatch[0].replace('-', '').toLowerCase() : null;
  
  // Extract organization
  const organization = filename.includes('gthl') ? 'gthl' :
                      filename.includes('alliance') ? 'alliance' :
                      filename.includes('ontario') ? 'ontario' : null;
  
  if (year && level) {
    // Build category path
    const categoryPath = organization ? 
      `${organization}-${year}-${level}` : 
      `ontario-${year}-${level}`;
    
    // Build topic slug preserving most of original filename with topic ID
    const topicSlug = `${filename}-t${topicId}`;
    
    return `/${categoryPath}/${topicSlug}`;
  }
  
  return null;
};