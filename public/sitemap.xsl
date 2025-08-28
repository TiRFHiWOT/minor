<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  
  <xsl:template match="/">
    <html lang="en">
      <head>
        <title>Sitemap - Minor Hockey Talks</title>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: hsl(210, 50%, 98%);
            color: hsl(215, 25%, 20%);
            line-height: 1.6;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: hsl(210, 100%, 40%);
            color: white;
            padding: 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .header p {
            margin: 8px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
          }
          .stats {
            background: hsl(210, 60%, 94%);
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 15px;
            border-bottom: 1px solid hsl(210, 35%, 88%);
          }
          .stat {
            text-align: center;
            min-width: 120px;
          }
          .stat-number {
            display: block;
            font-size: 24px;
            font-weight: 700;
            color: hsl(210, 100%, 40%);
          }
          .stat-label {
            font-size: 12px;
            color: hsl(215, 15%, 50%);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .search-container {
            padding: 20px;
            border-bottom: 1px solid hsl(210, 35%, 88%);
          }
          .search-box {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid hsl(210, 35%, 88%);
            border-radius: 6px;
            font-size: 16px;
            background: white;
          }
          .search-box:focus {
            outline: none;
            border-color: hsl(210, 100%, 40%);
            box-shadow: 0 0 0 3px hsla(210, 100%, 40%, 0.1);
          }
          .url-list {
            padding: 0;
            margin: 0;
          }
          .url-item {
            display: block;
            padding: 15px 20px;
            border-bottom: 1px solid hsl(210, 35%, 88%);
            text-decoration: none;
            color: inherit;
            transition: background-color 0.2s;
          }
          .url-item:hover {
            background: hsl(210, 60%, 94%);
          }
          .url-item:last-child {
            border-bottom: none;
          }
          .url-primary {
            color: hsl(210, 100%, 40%);
            font-weight: 500;
            word-break: break-all;
          }
          .url-meta {
            font-size: 12px;
            color: hsl(215, 15%, 50%);
            margin-top: 4px;
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
          }
          .priority-high { color: hsl(142, 76%, 36%); }
          .priority-medium { color: hsl(38, 92%, 50%); }
          .priority-low { color: hsl(215, 15%, 50%); }
          .footer {
            padding: 20px;
            text-align: center;
            background: hsl(210, 50%, 96%);
            font-size: 14px;
            color: hsl(215, 15%, 50%);
          }
          .footer a {
            color: hsl(210, 100%, 40%);
            text-decoration: none;
          }
          .footer a:hover {
            text-decoration: underline;
          }
          @media (max-width: 768px) {
            body { padding: 10px; }
            .header h1 { font-size: 24px; }
            .stats { flex-direction: column; text-align: center; }
            .url-meta { flex-direction: column; gap: 5px; }
          }
        </style>
        <script>
          function filterUrls() {
            const search = document.getElementById('searchBox').value.toLowerCase();
            const items = document.querySelectorAll('.url-item');
            let visibleCount = 0;
            
            items.forEach(item => {
              const url = item.querySelector('.url-primary').textContent.toLowerCase();
              if (url.includes(search)) {
                item.style.display = 'block';
                visibleCount++;
              } else {
                item.style.display = 'none';
              }
            });
            
            document.getElementById('visibleCount').textContent = visibleCount;
          }
        </script>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏒 Minor Hockey Talks Sitemap</h1>
            <p>Explore all pages and content on our hockey community forum</p>
          </div>
          
          <div class="stats">
            <div class="stat">
              <span class="stat-number" id="totalUrls">
                <xsl:value-of select="count(//sitemap:url)"/>
              </span>
              <div class="stat-label">Total URLs</div>
            </div>
            <div class="stat">
              <span class="stat-number" id="visibleCount">
                <xsl:value-of select="count(//sitemap:url)"/>
              </span>
              <div class="stat-label">Visible URLs</div>
            </div>
            <div class="stat">
              <span class="stat-number">
                <xsl:value-of select="format-date(current-date(), '[D] [MNn] [Y]')"/>
              </span>
              <div class="stat-label">Generated</div>
            </div>
          </div>
          
          <div class="search-container">
            <input 
              type="text" 
              id="searchBox" 
              class="search-box" 
              placeholder="Search URLs... (e.g., 'topic', 'category', 'blog')"
              onkeyup="filterUrls()"
            />
          </div>
          
          <div class="url-list">
            <xsl:for-each select="//sitemap:url">
              <xsl:sort select="sitemap:priority" order="descending"/>
              <xsl:sort select="sitemap:lastmod" order="descending"/>
              
              <a class="url-item" href="{sitemap:loc}" target="_blank">
                <div class="url-primary">
                  <xsl:value-of select="sitemap:loc"/>
                </div>
                <div class="url-meta">
                  <xsl:if test="sitemap:lastmod">
                    <span>Last Modified: <xsl:value-of select="substring(sitemap:lastmod, 1, 10)"/></span>
                  </xsl:if>
                  <xsl:if test="sitemap:changefreq">
                    <span>Update Frequency: <xsl:value-of select="sitemap:changefreq"/></span>
                  </xsl:if>
                  <xsl:if test="sitemap:priority">
                    <span>
                      <xsl:attribute name="class">
                        <xsl:choose>
                          <xsl:when test="sitemap:priority &gt;= 0.8">priority-high</xsl:when>
                          <xsl:when test="sitemap:priority &gt;= 0.5">priority-medium</xsl:when>
                          <xsl:otherwise>priority-low</xsl:otherwise>
                        </xsl:choose>
                      </xsl:attribute>
                      Priority: <xsl:value-of select="sitemap:priority"/>
                    </span>
                  </xsl:if>
                </div>
              </a>
            </xsl:for-each>
          </div>
          
          <div class="footer">
            <p>
              This sitemap helps search engines discover and index our content. 
              <a href="/sitemap">View HTML sitemap</a> | 
              <a href="/">Back to forum</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>