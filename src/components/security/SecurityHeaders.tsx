import { useEffect } from 'react';

/**
 * SecurityHeaders Component - Provides client-side security enhancements
 * Implements Content Security Policy and other security headers via meta tags
 */
export const SecurityHeaders = () => {
  useEffect(() => {
    // Add Content Security Policy meta tag for XSS protection
    const csp = document.createElement('meta');
    csp.httpEquiv = 'Content-Security-Policy';
    csp.content = [
      "default-src 'self'",
      "script-src 'self' 'nonce-' https://hcaptcha.com https://*.hcaptcha.com https://lovableproject.com https://*.lovableproject.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co https://ipapi.co https://ipify.org https://api.ipify.org https://hcaptcha.com https://*.hcaptcha.com",
      "frame-src 'self' https://www.google.com https://recaptcha.google.com https://www.recaptcha.net https://hcaptcha.com https://*.hcaptcha.com https://js.hcaptcha.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
    
    // Remove existing CSP meta tag if present
    const existingCsp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingCsp) {
      existingCsp.remove();
    }
    
    document.head.appendChild(csp);

    // Add X-Frame-Options for clickjacking protection (SAMEORIGIN allows Lovable editor)
    const frameOptions = document.createElement('meta');
    frameOptions.httpEquiv = 'X-Frame-Options';
    frameOptions.content = 'SAMEORIGIN';
    document.head.appendChild(frameOptions);

    // Add X-Content-Type-Options for MIME type sniffing protection
    const contentTypeOptions = document.createElement('meta');
    contentTypeOptions.httpEquiv = 'X-Content-Type-Options';
    contentTypeOptions.content = 'nosniff';
    document.head.appendChild(contentTypeOptions);

    // Add Referrer Policy for privacy protection
    const referrerPolicy = document.createElement('meta');
    referrerPolicy.name = 'referrer';
    referrerPolicy.content = 'strict-origin-when-cross-origin';
    document.head.appendChild(referrerPolicy);

    // Cleanup function to remove added meta tags
    return () => {
      const metaTags = [
        'meta[http-equiv="Content-Security-Policy"]',
        'meta[http-equiv="X-Frame-Options"]',
        'meta[http-equiv="X-Content-Type-Options"]',
        'meta[name="referrer"]'
      ];
      
      metaTags.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
          element.remove();
        }
      });
    };
  }, []);

  return null; // This component doesn't render anything visible
};