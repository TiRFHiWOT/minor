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
        // Single category - build complete hierarchy recursively
        const buildCategoryHierarchy = async (slug: string): Promise<any> => {
          const { data, error } = await supabase
            .from('categories')
            .select('*, parent_category:categories!parent_category_id(id, name, slug)')
            .eq('slug', slug)
            .single();
          
          if (error) {
            console.error('Error fetching category by slug:', error);
            throw error;
          }
          
          // If this category has a parent, recursively fetch the parent hierarchy
          if (data.parent_category) {
            const parentWithHierarchy = await buildCategoryHierarchy(data.parent_category.slug);
            return {
              ...data,
              parent_category: parentWithHierarchy
            };
          }
          
          return data;
        };
        
        const categoryWithHierarchy = await buildCategoryHierarchy(categorySlug);
        console.log('Category fetched by slug with hierarchy:', categoryWithHierarchy);
        return categoryWithHierarchy;
      }
    },
    enabled: !!categorySlug,
  });
};