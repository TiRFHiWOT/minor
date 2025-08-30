import React from 'react';
// Converts plain URLs in text to clickable anchor tags
function linkify(text: string): string {
  // Regex to match URLs (http, https, www)
  const urlPattern = /((https?:\/\/|www\.)[\w\-._~:/?#@!$&'()*+,;=%]+)(?![^<]*>|[^[]*])/gi;
  return text.replace(urlPattern, (url) => {
    let href = url;
    if (!href.startsWith('http')) {
      href = 'https://' + href;
    }
    // Add Tailwind blue color class
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800">${url}</a>`;
  });
}
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';

interface HTMLRendererProps {
  content: string;
  className?: string;
}

export const HTMLRenderer: React.FC<HTMLRendererProps> = ({
  content,
  className,
}) => {
  // Convert URLs to links before sanitizing
  const processedContent = React.useMemo(() => linkify(content), [content]);
  // Create a custom DOMPurify instance with CSS-friendly configuration
  const sanitizedContent = React.useMemo(() => {
    DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
      if (data.attrName === 'style') {
        const dangerousPatterns = [
          /expression\s*\(/i,
          /javascript:/i,
          /data:/i,
          /vbscript:/i,
          /behavior\s*:/i,
          /-moz-binding/i
        ];
        const hasDangerousContent = dangerousPatterns.some(pattern => 
          pattern.test(data.attrValue)
        );
        if (hasDangerousContent) {
          data.keepAttr = false;
        }
      }
      if (data.attrName === 'src' && node.tagName === 'IMG') {
        if (data.attrValue.startsWith('data:image/')) {
          data.keepAttr = true;
        }
      }
    });
    const result = DOMPurify.sanitize(processedContent, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'code', 'pre', 'div', 'span', 'img'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class', 'id', 'src', 'alt', 'width', 'height'],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      ADD_TAGS: ['img'],
      ADD_ATTR: ['src', 'alt', 'width', 'height'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
      FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input']
    });
    DOMPurify.removeHook('uponSanitizeAttribute');
    return result;
  }, [processedContent]);
  return (
    <div 
      className={cn("prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:mb-1", className)}
      style={{
        direction: 'ltr',
        textAlign: 'left',
        unicodeBidi: 'plaintext'
      }}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

export default HTMLRenderer;