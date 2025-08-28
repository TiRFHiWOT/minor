export interface SitemapValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  urlCount: number;
  sitemapCount: number;
  lastModified?: string;
}

export class SitemapValidator {
  static async validateSitemapUrl(url: string): Promise<SitemapValidationResult> {
    const result: SitemapValidationResult = {
      isValid: false,
      errors: [],
      warnings: [],
      urlCount: 0,
      sitemapCount: 0,
    };

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml, text/xml',
        },
      });

      if (!response.ok) {
        result.errors.push(`HTTP Error: ${response.status} ${response.statusText}`);
        return result;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('xml')) {
        result.warnings.push(`Content-Type is '${contentType}', expected XML`);
      }

      const xmlContent = await response.text();
      
      // Basic XML validation
      if (!xmlContent.includes('<?xml')) {
        result.errors.push('Missing XML declaration');
      }

      // Check for sitemap structure
      const isSitemapIndex = xmlContent.includes('<sitemapindex');
      const isUrlset = xmlContent.includes('<urlset');

      if (!isSitemapIndex && !isUrlset) {
        result.errors.push('Invalid sitemap structure - missing <sitemapindex> or <urlset>');
        return result;
      }

      // Count elements
      if (isSitemapIndex) {
        result.sitemapCount = (xmlContent.match(/<sitemap>/g) || []).length;
        if (result.sitemapCount === 0) {
          result.warnings.push('Sitemap index contains no sitemap entries');
        }
      } else {
        result.urlCount = (xmlContent.match(/<url>/g) || []).length;
        if (result.urlCount === 0) {
          result.warnings.push('Sitemap contains no URL entries');
        }
      }

      // Check for required namespace
      if (!xmlContent.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) {
        result.errors.push('Missing required sitemap namespace');
      }

      // Validate URLs format
      const urlMatches = xmlContent.match(/<loc>(.*?)<\/loc>/g);
      if (urlMatches) {
        const invalidUrls = urlMatches.filter(match => {
          const url = match.replace(/<\/?loc>/g, '');
          try {
            new URL(url);
            return false;
          } catch {
            return true;
          }
        });

        if (invalidUrls.length > 0) {
          result.errors.push(`Found ${invalidUrls.length} invalid URLs`);
        }
      }

      // Check lastmod format
      const lastmodMatches = xmlContent.match(/<lastmod>(.*?)<\/lastmod>/g);
      if (lastmodMatches) {
        const invalidDates = lastmodMatches.filter(match => {
          const dateStr = match.replace(/<\/?lastmod>/g, '');
          return isNaN(Date.parse(dateStr));
        });

        if (invalidDates.length > 0) {
          result.warnings.push(`Found ${invalidDates.length} invalid lastmod dates`);
        }
      }

      result.isValid = result.errors.length === 0;
      result.lastModified = response.headers.get('last-modified') || undefined;

    } catch (error) {
      result.errors.push(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  static async validateAllSitemaps(baseUrl: string): Promise<Record<string, SitemapValidationResult>> {
    const sitemapTypes = ['', 'static', 'categories', 'topics', 'blog'];
    const results: Record<string, SitemapValidationResult> = {};

    for (const type of sitemapTypes) {
      const sitemapUrl = type 
        ? `${baseUrl}/sitemap-${type}.xml`
        : `${baseUrl}/sitemap.xml`;
      
      const key = type || 'index';
      results[key] = await this.validateSitemapUrl(sitemapUrl);
      
      // Add small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return results;
  }
}