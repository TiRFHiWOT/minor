import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useForumSettings } from "@/hooks/useForumSettings";

export function SitemapManager() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [testResults, setTestResults] = useState<
    Record<string, { status: number; urls: number } | null>
  >({});
  const { toast } = useToast();
  const { getSetting } = useForumSettings();

  const siteUrl = (getSetting("site_url", "") ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "https://minorhockeytalks.com")) as string;

  const sitemapTypes = [
    {
      type: "index",
      label: "Sitemap Index",
      description: "Main sitemap index file",
    },
    {
      type: "static",
      label: "Static Pages",
      description: "Homepage, categories, blog, auth pages",
    },
    {
      type: "categories",
      label: "Categories",
      description: "All forum categories and subcategories",
    },
    {
      type: "topics",
      label: "Topics",
      description: "All approved forum topics (limited to 50k)",
    },
    {
      type: "blog",
      label: "Blog Posts",
      description: "All published blog articles",
    },
  ];

  const getSitemapUrl = (type?: string) => {
    const publicBase = String(siteUrl).replace(/\/$/, "");
    switch (type) {
      case undefined:
      case "index":
        return `${publicBase}/sitemap.xml`;
      case "static":
        return `${publicBase}/sitemap-static.xml`;
      case "categories":
        return `${publicBase}/sitemap-categories.xml`;
      case "topics":
        return `${publicBase}/sitemap-topics.xml`;
      case "blog":
        return `${publicBase}/sitemap-blog.xml`;
      default:
        return `${publicBase}/sitemap.xml`;
    }
  };

  const getFunctionUrl = (type?: string) => {
    const base = "https://hockey.minorhockeytalks.com/functions/v1/sitemap";
    switch (type) {
      case undefined:
      case "index":
        return base;
      default:
        return `${base}?type=${type}`;
    }
  };

  const testSitemap = async (type?: string) => {
    setIsGenerating(true);
    try {
      // Use direct fetch to test the actual sitemap endpoints
      const functionUrl = `https://rscowwmoeycyxmfslhme.supabase.co/functions/v1/sitemap${
        type ? `?type=${type}` : ""
      }`;

      const response = await fetch(functionUrl, {
        method: "GET",
        headers: {
          "x-custom-domain": String(siteUrl)
            .replace("https://", "")
            .replace("http://", ""),
          Accept: "application/xml",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlContent = await response.text();
      console.log(
        `Sitemap ${type || "index"} response preview:`,
        xmlContent.substring(0, 300)
      );

      // Validate XML structure
      if (
        !xmlContent.includes("<?xml") ||
        (!xmlContent.includes("<urlset") &&
          !xmlContent.includes("<sitemapindex"))
      ) {
        throw new Error("Invalid XML response format");
      }

      // Count URLs in the response
      const urlCount = (xmlContent.match(/<url>/g) || []).length;
      const sitemapCount = (xmlContent.match(/<sitemap>/g) || []).length;

      setTestResults((prev) => ({
        ...prev,
        [type || "index"]: {
          status: response.status,
          urls: type === "index" ? sitemapCount : urlCount,
        },
      }));

      toast({
        title: "Sitemap tested successfully",
        description: `Generated ${
          type === "index" ? sitemapCount + " sitemaps" : urlCount + " URLs"
        }`,
      });
    } catch (error) {
      console.error("Sitemap test error:", error);
      setTestResults((prev) => ({
        ...prev,
        [type || "index"]: { status: 500, urls: 0 },
      }));
      toast({
        title: "Sitemap test failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const testAllSitemaps = async () => {
    setIsGenerating(true);
    setTestResults({});

    try {
      // Test index first
      await testSitemap();

      // Test all other types
      for (const sitemap of sitemapTypes.slice(1)) {
        await testSitemap(sitemap.type);
        // Small delay to avoid overwhelming the function
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      toast({
        title: "All sitemaps tested",
        description: "Sitemap generation test completed",
      });
    } catch (error) {
      toast({
        title: "Test failed",
        description: "Some sitemaps failed to generate",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusIcon = (type: string) => {
    const result = testResults[type];
    if (!result) return null;

    return result.status === 200 ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (type: string) => {
    const result = testResults[type];
    if (!result) return <Badge variant="secondary">Not tested</Badge>;

    return result.status === 200 ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        {type === "index" ? `${result.urls} sitemaps` : `${result.urls} URLs`}
      </Badge>
    ) : (
      <Badge variant="destructive">Error</Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Sitemap Management</h3>
        <p className="text-sm text-muted-foreground">
          Generate and test XML sitemaps for better search engine indexing
        </p>
      </div>

      <Alert>
        <AlertDescription>
          Sitemaps are automatically generated and cached for 1 hour. The main
          sitemap URL is:{" "}
          <a
            href={getSitemapUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            {getSitemapUrl()}
            <ExternalLink className="h-3 w-3" />
          </a>
        </AlertDescription>
      </Alert>

      <div className="flex gap-2">
        <Button
          onClick={testAllSitemaps}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`}
          />
          Test All Sitemaps
        </Button>
      </div>

      <div className="grid gap-4">
        {sitemapTypes.map((sitemap) => (
          <Card key={sitemap.type}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {sitemap.label}
                    {getStatusIcon(sitemap.type)}
                  </CardTitle>
                  <CardDescription>{sitemap.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(sitemap.type)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testSitemap(sitemap.type)}
                    disabled={isGenerating}
                    className="flex items-center gap-1"
                  >
                    <RefreshCw
                      className={`h-3 w-3 ${
                        isGenerating ? "animate-spin" : ""
                      }`}
                    />
                    Test
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <span>URL:</span>
                <a
                  href={getSitemapUrl(sitemap.type)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-start gap-1"
                >
                  <span className="break-all">
                    {getSitemapUrl(sitemap.type)}
                  </span>
                  <ExternalLink className="h-3 w-3 shrink-0 mt-0.5" />
                </a>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground mt-1">
                <span className="whitespace-nowrap">Function URL:</span>
                <a
                  href={getFunctionUrl(sitemap.type)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all inline-flex gap-1 items-start"
                >
                  <span className="break-all">
                    {getFunctionUrl(sitemap.type)}
                  </span>
                  <ExternalLink className="h-3 w-3 shrink-0 mt-0.5" />
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SEO Information</CardTitle>
          <CardDescription>
            How sitemaps help with search engine optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            • <strong>Discovery:</strong> Helps search engines find all your
            content
          </p>
          <p>
            • <strong>Indexing:</strong> Ensures important pages are crawled
            regularly
          </p>
          <p>
            • <strong>Priority:</strong> Indicates which pages are most
            important
          </p>
          <p>
            • <strong>Freshness:</strong> Shows when content was last updated
          </p>
          <p>
            • <strong>Structure:</strong> Provides clear site hierarchy
            information
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
