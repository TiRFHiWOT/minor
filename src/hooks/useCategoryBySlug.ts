import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCategoryBySlug = (categorySlug: string, subcategorySlug?: string) => {
  return useQuery({
    queryKey: ['category-by-slug', categorySlug, subcategorySlug],
    queryFn: async () => {
      console.log('Fetching category by slug:', { categorySlug, subcategorySlug });
      
      if (subcategorySlug) {
        // Hierarchical: validate parent-child relationship
        const { data: parentCategory, error: parentError } = await supabase
          .from('categories')
          .select('id, slug, name')
          .eq('slug', categorySlug)
          .single();
        
        if (parentError) {
          console.error('Error fetching parent category:', parentError);
          throw parentError;
        }
        
        const { data: childCategory, error: childError } = await supabase
          .from('categories')
          .select(`
            *,
            parent_category:categories!parent_category_id(
              id, name, slug,
              parent_category:categories!parent_category_id(
                id, name, slug,
                parent_category:categories!parent_category_id(
                  id, name, slug
                )
              )
            )
          `)
          .eq('slug', subcategorySlug)
          .eq('parent_category_id', parentCategory.id)
          .single();
        
        if (childError) {
          console.error('Error fetching subcategory:', childError);
          throw childError;
        }
        
        console.log('Subcategory fetched by slug:', childCategory);
        return childCategory;
      } else {
        // Single category with complete hierarchy
        const { data, error } = await supabase
          .from('categories')
          .select(`
            *,
            parent_category:categories!parent_category_id(
              id, name, slug,
              parent_category:categories!parent_category_id(
                id, name, slug,
                parent_category:categories!parent_category_id(
                  id, name, slug
                )
              )
            )
          `)
          .eq('slug', categorySlug)
          .single();
        
        if (error) {
          console.error('Error fetching category by slug:', error);
          throw error;
        }
        
        console.log('Category fetched by slug:', data);
        return data;
      }
    },
    enabled: !!categorySlug,
  });
};