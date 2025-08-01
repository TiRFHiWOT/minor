import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home, ChevronRight } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useCategoryStats } from '@/hooks/useCategoryStats';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ContentAdSpace } from '@/components/ads/ContentAdSpace';

const CategoryCard = ({ category }: { category: any }) => {
  const { data: stats } = useCategoryStats(category.id);
  
  return (
    <Link to={`/${category.slug}`}>
      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: category.color }}
            />
            <h3 className="font-semibold text-foreground">{category.name}</h3>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        {category.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {category.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            {category.region && <span>Region: {category.region}</span>}
            {category.birth_year && <span>Birth Year: {category.birth_year}</span>}
            {category.play_level && <span>Level: {category.play_level}</span>}
          </div>
          <Badge variant="secondary" className="text-xs">
            {stats?.topic_count || 0} topics
          </Badge>
        </div>
      </Card>
    </Link>
  );
};

export const Categories = () => {
  const { data: level1Categories } = useCategories(null, 1);
  const { data: level2Categories } = useCategories(undefined, 2);
  const { data: level3Categories } = useCategories(undefined, 3);

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">
                <Home className="h-4 w-4" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>All Categories</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">All Categories</h1>
        <p className="text-muted-foreground">Browse all forum categories and discussions</p>
      </div>

      {/* Content Ad 1 - After header */}
      <ContentAdSpace contentId={1} />

      {/* Main Forums */}
      {level1Categories && level1Categories.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Main Forums</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {level1Categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      )}

      {/* Content Ad 2 - Between sections */}
      <ContentAdSpace contentId={2} />

      {/* Province/State Forums */}
      {level2Categories && level2Categories.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Province & State Forums</h2>
          <div className="space-y-6">
            {(() => {
              // Group by country using parent_category_id
              const canadianForums = level2Categories.filter(category => 
                category.parent_category_id === '11111111-1111-1111-1111-111111111111'
              ).sort((a, b) => (a.region || '').localeCompare(b.region || ''));
              
              const usaForums = level2Categories.filter(category => 
                category.parent_category_id === '22222222-2222-2222-2222-222222222222'
              ).sort((a, b) => (a.region || '').localeCompare(b.region || ''));

              const tournamentForums = level2Categories.filter(category => 
                category.parent_category_id === '44444444-4444-4444-4444-444444444444'
              ).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
              
              const generalForums = level2Categories.filter(category => 
                category.parent_category_id === '33333333-3333-3333-3333-333333333333'
              ).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
              
              const importantForums = level2Categories.filter(category => 
                category.parent_category_id === '234392cf-f9a4-4371-bba4-18a16d449f9f'
              ).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
              
              const countries = [];
              if (canadianForums.length > 0) {
                countries.push({ name: 'Canada', forums: canadianForums });
              }
              if (usaForums.length > 0) {
                countries.push({ name: 'USA', forums: usaForums });
              }
              if (tournamentForums.length > 0) {
                countries.push({ name: 'Tournaments', forums: tournamentForums });
              }
              if (generalForums.length > 0) {
                countries.push({ name: 'General Discussion', forums: generalForums });
              }
              if (importantForums.length > 0) {
                countries.push({ name: 'Important', forums: importantForums });
              }
              
              return countries.map(country => (
                <div key={country.name} className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                    {country.name}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {country.forums.map((category) => (
                      <CategoryCard key={category.id} category={category} />
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Age Group & Skill Level Categories */}
      {level3Categories && level3Categories.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Age Group & Skill Level Categories</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {level3Categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};