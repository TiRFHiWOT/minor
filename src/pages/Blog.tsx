import React from "react";
import { Calendar, User, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Blog posts will be loaded from a CMS or database in the future
// For now, adding some dummy data to demonstrate ad placement
const blogPosts: any[] = [
  {
    id: "1",
    title: "Understanding Minor Hockey Leagues",
    excerpt:
      "A deep dive into the different structures and levels of minor hockey leagues across regions.",
    category: "Training",
    readTime: "5 min read",
    author: "Coach Smith",
    date: "2023-01-15",
  },
  {
    id: "2",
    title: "Choosing the Right Hockey Stick",
    excerpt:
      "Tips and advice on selecting the perfect hockey stick for your young player, considering flex, curve, and length.",
    category: "Equipment",
    readTime: "7 min read",
    author: "Gear Guru",
    date: "2023-02-20",
  },
  {
    id: "3",
    title: "Off-Season Training Drills for Young Players",
    excerpt:
      "Essential drills to keep your minor hockey player sharp during the off-season, focusing on agility and stickhandling.",
    category: "Training",
    readTime: "6 min read",
    author: "Coach Smith",
    date: "2023-03-10",
  },
  {
    id: "4",
    title: "The Importance of Team Building in Youth Sports",
    excerpt:
      "Strategies for fostering camaraderie and teamwork among minor hockey players, on and off the ice.",
    category: "Team Building",
    readTime: "8 min read",
    author: "Team Lead",
    date: "2023-04-05",
  },
  {
    id: "5",
    title: "Injury Prevention in Minor Hockey",
    excerpt:
      "Key practices and tips to minimize the risk of common hockey injuries for young athletes.",
    category: "Safety",
    readTime: "6 min read",
    author: "Dr. Hockey",
    date: "2023-05-12",
  },
  {
    id: "6",
    title: "Nutrition for Young Athletes: Fueling Performance",
    excerpt:
      "Guidance on proper nutrition to support energy levels and recovery for minor hockey players.",
    category: "Health",
    readTime: "7 min read",
    author: "Nutritionist Jane",
    date: "2023-06-01",
  },
  {
    id: "7",
    title: "Navigating Tryouts: A Parent's Guide",
    excerpt:
      "Advice for parents on how to support their child through the tryout process, managing expectations and stress.",
    category: "Team Building",
    readTime: "5 min read",
    author: "Parent Guide",
    date: "2023-07-18",
  },
];

const categories = [
  "All",
  "Training",
  "Equipment",
  "Team Building",
  "Health",
  "Safety",
];

const Blog = () => {
  const [selectedCategory, setSelectedCategory] = React.useState("All");

  const filteredPosts =
    selectedCategory === "All"
      ? blogPosts
      : blogPosts.filter((post) => post.category === selectedCategory);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Minor Hockey Talks Blog</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Insights, tips, and stories from the world of minor hockey
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Blog Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post, index) => (
          <React.Fragment key={post.id}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-muted relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-muted-foreground">
                    {post.category}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs">
                    {post.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {post.readTime}
                  </span>
                </div>

                <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                  {post.title}
                </h3>

                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                  </div>
                </div>

                <Button variant="ghost" size="sm" className="w-full group">
                  Read More
                  <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>

            {/* AdMetricsPro Content One Ad - Display after the 2nd post */}
            {index === 1 && ( // Adjust index as needed for desired placement
              <div className="my-6 flex justify-center col-span-1 md:col-span-2 lg:col-span-3">
                {" "}
                {/* Use col-span to make it full width in grid */}
                <div
                  id="div-gpt-ad-1715358598569-0"
                  style={{
                    minWidth: "300px",
                    minHeight: "50px",
                    border: "1px dashed #e0e0e0",
                    backgroundColor: "#f5f5f5",
                  }}
                  className="rounded-lg shadow-sm w-full max-w-lg" // Added max-w-lg for better centering on larger screens
                >
                  <p className="text-center text-xs text-muted-foreground p-2">
                    Advertisement
                  </p>
                </div>
              </div>
            )}

            {/* AdMetricsPro Content Two Ad - Display after the 4th post */}
            {index === 3 && ( // Adjust index as needed for desired placement
              <div className="my-6 flex justify-center col-span-1 md:col-span-2 lg:col-span-3">
                {" "}
                {/* Use col-span to make it full width in grid */}
                <div
                  id="div-gpt-ad-1715358620345-0"
                  style={{
                    minWidth: "300px",
                    minHeight: "50px",
                    border: "1px dashed #e0e0e0",
                    backgroundColor: "#f5f5f5",
                  }}
                  className="rounded-lg shadow-sm w-full max-w-lg" // Added max-w-lg for better centering on larger screens
                >
                  <p className="text-center text-xs text-muted-foreground p-2">
                    Advertisement
                  </p>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Coming Soon Message */}
      <div className="text-center mt-12 p-8 bg-muted/50 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">
          More Content Coming Soon!
        </h2>
        <p className="text-muted-foreground mb-6">
          We're working on bringing you more valuable content about minor
          hockey. Stay tuned for regular updates, expert insights, and community
          stories.
        </p>
        <Button variant="outline">Subscribe for Updates</Button>
      </div>
    </div>
  );
};

export default Blog;
