import React from "react";
import { FORUM_NAME } from "@/utils/seoHelpers";

interface TopicPost {
  id: string;
  title?: string;
  content?: string;
  author?: { username?: string; id?: string } | null;
  created_at?: string;
  reply_count?: number;
  url?: string;
}

interface JsonLdProps {
  siteUrl: string;
  pathname: string;
  pageTitle?: string;
  pageDescription?: string;
  breadcrumb?: { name: string; url: string }[];
  topic?: TopicPost | null;
  comments?: Array<{
    id: string;
    author?: { username?: string } | null;
    datePublished?: string;
    text?: string;
  }>;
}

/**
 * JsonLd - renders a single <script type="application/ld+json"> tag
 * Accepts a best-effort JSON-LD payload for common forum pages.
 * It intentionally keeps payloads small and safe to avoid leaking private data.
 */
export const JsonLd: React.FC<JsonLdProps> = ({
  siteUrl,
  pathname,
  pageTitle,
  pageDescription,
  breadcrumb = [],
  topic = null,
  comments = [],
}) => {
  const pageUrl = `${siteUrl.replace(/\/$/, "")}${
    pathname.startsWith("/") ? pathname : `/${pathname}`
  }`;

  // Base WebSite + Organization structured data (site-wide)
  const website: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: siteUrl,
    name: FORUM_NAME,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl.replace(/\/$/, "")}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const organization: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: FORUM_NAME,
    url: siteUrl,
  };

  // BreadcrumbList when provided
  const breadcrumbList = breadcrumb.length
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumb.map((b, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: b.name,
          item: `${siteUrl.replace(/\/$/, "")}${
            b.url.startsWith("/") ? b.url : `/${b.url}`
          }`,
        })),
      }
    : null;

  // DiscussionForumPosting for topic pages
  const discussion = topic
    ? {
        "@context": "https://schema.org",
        "@type": "DiscussionForumPosting",
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": pageUrl,
        },
        headline: topic.title || pageTitle || undefined,
        articleBody: topic.content
          ? topic.content.replace(/<[^>]+>/g, "")
          : pageDescription,
        datePublished: topic.created_at,
        author: topic.author
          ? { "@type": "Person", name: topic.author.username || "Anonymous" }
          : undefined,
        interactionStatistic: topic.reply_count
          ? {
              "@type": "InteractionCounter",
              interactionType: { "@type": "CommentAction" },
              userInteractionCount: topic.reply_count,
            }
          : undefined,
      }
    : null;

  // Comments array
  const commentSchemas = (comments || []).map((c) => ({
    "@type": "Comment",
    author: c.author
      ? { "@type": "Person", name: c.author.username || "Guest" }
      : undefined,
    datePublished: c.datePublished,
    text: c.text ? c.text.replace(/<[^>]+>/g, "") : undefined,
  }));

  // Assemble the final graph - include website & organization always, then page-level items
  const graph: Record<string, unknown>[] = [website, organization];

  if (breadcrumbList) graph.push(breadcrumbList);
  if (discussion) graph.push(discussion);
  if (commentSchemas.length > 0) graph.push(...commentSchemas);

  const jsonLd =
    graph.length === 1
      ? graph[0]
      : { "@context": "https://schema.org", "@graph": graph };

  return <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>;
};

export default JsonLd;
