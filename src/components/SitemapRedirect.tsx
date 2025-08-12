import React, { useEffect } from "react";

interface SitemapRedirectProps {
  type?: "index" | "static" | "categories" | "topics" | "blog";
}

export const SitemapRedirect: React.FC<SitemapRedirectProps> = ({ type = "index" }) => {
  useEffect(() => {
    const base = "https://rscowwmoeycyxmfslhme.supabase.co/functions/v1/sitemap";
    const dest = type && type !== "index" ? `${base}?type=${type}` : base;
    // Hard redirect so the browser loads raw XML from the edge function
    window.location.replace(dest);
  }, [type]);

  const base = "https://rscowwmoeycyxmfslhme.supabase.co/functions/v1/sitemap";
  const href = type && type !== "index" ? `${base}?type=${type}` : base;

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-lg font-semibold">Redirecting to sitemap...</h1>
      <p className="mt-2">
        If you are not redirected automatically, open
        {" "}
        <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-primary">
          {href}
        </a>
        .
      </p>
    </main>
  );
};

export default SitemapRedirect;
