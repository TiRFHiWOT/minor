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
  
  let headerScripts: HeaderScript[] = [];
  try {
    headerScripts = Array.isArray(headerScriptsRaw) ? headerScriptsRaw : [];
  } catch (error) {
    console.error('Error parsing header scripts:', error);
    headerScripts = [];
  }
  
  // Check if advertising is enabled
  const advertisingEnabled = getSetting('advertising_enabled', 'true') === 'true';

  useEffect(() => {
    // Remove any existing custom header elements to avoid duplicates
    const existingElements = document.querySelectorAll('[data-custom-header]');
    existingElements.forEach(el => el.remove());

    if (!advertisingEnabled) {
      return;
    }

    // Inject active header scripts
    headerScripts
      .filter(script => script.is_active)
      .forEach((script) => {
        const sanitizedScript = DOMPurify.sanitize(script.script, {
          ALLOWED_TAGS: ['script', 'style', 'meta', 'link', 'ins'],
          ALLOWED_ATTR: ['src', 'href', 'type', 'rel', 'charset', 'name', 'content', 'property', 'async', 'crossorigin', 'class', 'style', 'data-ad-client', 'data-ad-slot', 'data-ad-format', 'data-full-width-responsive'],
          ALLOW_DATA_ATTR: true,
          ALLOW_UNKNOWN_PROTOCOLS: false
        });

        const scriptContainer = document.createElement('div');
        scriptContainer.setAttribute('data-custom-header', `script-${script.id}`);
        scriptContainer.innerHTML = sanitizedScript;
        document.head.appendChild(scriptContainer);
      });

    return () => {
      // Cleanup on unmount or when settings change
      const elements = document.querySelectorAll('[data-custom-header]');
      elements.forEach(el => el.remove());
    };
  }, [headerScripts, advertisingEnabled]);

  return null;
};