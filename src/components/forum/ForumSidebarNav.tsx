import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, Star, Plus, Home, Users } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useCategoriesByActivity } from "@/hooks/useCategoriesByActivity";
import { useCategoryStats } from "@/hooks/useCategoryStats";
import { useEnhancedForumStats } from "@/hooks/useEnhancedForumStats";
import { QuickTopicModal } from "./QuickTopicModal"; // Assuming this is used elsewhere or will be removed if not
// import { SidebarAdBanner } from '@/components/ads/SidebarAdBanner'; // This component is being replaced
import { cn } from "@/lib/utils";

// Component to display category stats
const CategoryItem = ({ category }: { category: any }) => {
  // Consider defining a proper type for 'category'
  const { data: stats, isLoading } = useCategoryStats(category.id);

  return (
    <Link
      to={`/category/${category.slug}`}
      className="flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors hover:bg-muted/50 group"
    >
      <div className="flex items-center space-x-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: category.color }}
        />
        <span className="text-foreground group-hover:text-primary transition-colors">
          {category.name}
        </span>
      </div>
      <Badge variant="secondary" className="text-xs">
        {isLoading ? "..." : stats?.topic_count || 0}
      </Badge>
    </Link>
  );
};

export const ForumSidebarNav = () => {
  const location = useLocation();
  const { data: categories } = useCategoriesByActivity(); // All active categories by activity
  const { data: forumStats } = useEnhancedForumStats(); // Assuming this is still used somewhere, otherwise can be removed

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { label: "Home", path: "/", icon: Home },
    { label: "Hot", path: "/?sort=hot", icon: TrendingUp },
    { label: "New", path: "/?sort=new", icon: Clock },
    { label: "Top", path: "/?sort=top", icon: Star },
  ];

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <Card className="p-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
          Browse
        </h3>
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive(item.path)
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </Card>

      {/* Categories */}
      <Card className="p-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
          Categories
        </h3>
        <div className="space-y-2">
          {categories?.slice(0, 8).map((category) => (
            <CategoryItem key={category.id} category={category} />
          ))}

          {categories && categories.length > 8 && (
            <Link to="/categories">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-primary"
              >
                View all categories
              </Button>
            </Link>
          )}
        </div>
      </Card>

      {/* AdMetricsPro Sidebar Left Ad */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Sidebar Ad (Left)</h3>
        <div
          id="div-gpt-ad-1752247623844-0"
          style={{
            minWidth: "300px",
            minHeight: "250px",
            border: "1px dashed #ccc",
            backgroundColor: "#f9f9f9",
          }}
        >
          <p className="text-center text-sm text-muted-foreground p-4">
            Ad slot placeholder
          </p>
        </div>
      </Card>

      {/* AdMetricsPro Sidebar Left2 Ad */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Sidebar Ad (Left2)</h3>
        <div
          id="div-gpt-ad-1752247724892-0"
          style={{
            minWidth: "300px",
            minHeight: "250px",
            border: "1px dashed #ccc",
            backgroundColor: "#f9f9f9",
          }}
        >
          <p className="text-center text-sm text-muted-foreground p-4">
            Ad slot placeholder
          </p>
        </div>
      </Card>
    </div>
  );
};
