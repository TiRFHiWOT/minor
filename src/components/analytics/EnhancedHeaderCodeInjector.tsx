import { useEffect } from 'react';
import { useForumSettings } from '@/hooks/useForumSettings';
import DOMPurify from 'dompurify';

interface HeaderScript {
  id: string;
  name: string;
  description?: string;
  script: string;
  is_active: boolean;
}

export const EnhancedHeaderCodeInjector = () => {
  const { getSetting } = useForumSettings();
  
  // Get header scripts (now the primary header code system)
  const headerScriptsRaw = getSetting('header_scripts', []);

  // Robustly parse header scripts from setting (array or JSON string)
  let headerScripts: HeaderScript[] = [];
  try {
    if (Array.isArray(headerScriptsRaw)) {
      headerScripts = headerScriptsRaw as HeaderScript[];
    } else if (typeof headerScriptsRaw === 'string') {
      const parsed = JSON.parse(headerScriptsRaw);
      if (Array.isArray(parsed)) headerScripts = parsed as HeaderScript[];
    }
  } catch (error) {
    console.error('Error parsing header scripts:', error);
    headerScripts = [];
  }
  
  // Check if advertising is enabled (supports boolean or string)
  const advertisingEnabledRaw = getSetting('advertising_enabled', true);
  const advertisingEnabled = advertisingEnabledRaw === true || advertisingEnabledRaw === 'true' || advertisingEnabledRaw === 1;

  useEffect(() => {
    // Always remove existing custom header elements to avoid duplicates
    const existingElements = document.querySelectorAll('[data-custom-header]');
    existingElements.forEach(el => el.remove());

    // Skip injecting header scripts on specific routes to avoid double-loading vendors
    const path = window.location.pathname;
    const skipPaths = ['/test', '/ad-test-min'];
    if (skipPaths.includes(path) || path.startsWith('/admin')) {
      console.log('[HeaderInjector] Skipping header script injection on route:', path);
      return;
    }

    if (!advertisingEnabled) {
      console.log('[HeaderInjector] Advertising disabled, skipping script injection');
      return;
    }

    // Inject active header scripts by creating real DOM elements so scripts execute
    headerScripts
      .filter(script => script.is_active)
      .forEach((script) => {
        try {
          const sanitizedHtml = DOMPurify.sanitize(script.script, {
            ALLOWED_TAGS: ['script', 'style', 'meta', 'link'],
            ALLOWED_ATTR: ['src', 'href', 'type', 'rel', 'charset', 'name', 'content', 'property', 'async', 'crossorigin']
          });

          const template = document.createElement('template');
          template.innerHTML = sanitizedHtml;

          Array.from(template.content.childNodes).forEach((node, idx) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            const el = node as Element;
            const tag = el.tagName.toLowerCase();

            if (tag === 'script') {
              const s = document.createElement('script');
              // Copy attributes
              Array.from(el.attributes).forEach(attr => {
                if (attr.name === 'async') {
                  (s as HTMLScriptElement).async = true;
                } else {
                  s.setAttribute(attr.name, attr.value);
                }
              });
              // Inline script content
              if (!s.getAttribute('src')) {
                s.textContent = el.textContent || '';
              }
              s.setAttribute('data-custom-header', `script-${script.id}-${idx}`);
              document.head.appendChild(s);
            } else if (tag === 'link' || tag === 'meta' || tag === 'style') {
              const cloned = el.cloneNode(true) as Element;
              cloned.setAttribute('data-custom-header', `script-${script.id}-${idx}`);
              document.head.appendChild(cloned);
            }
          });
        } catch (e) {
          console.error('Failed injecting header script:', script.name, e);
        }
      });

    return () => {
      // Cleanup on unmount or when settings change
      const elements = document.querySelectorAll('[data-custom-header]');
      elements.forEach(el => el.remove());
    };
  }, [headerScripts, advertisingEnabled]);

  return null;
};