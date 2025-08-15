// Utility to detect and handle old URL patterns

export const OLD_URL_PATTERNS = [
  /.*-t\d+\.html$/,    // Pattern: *-t[digits].html
  /.*-p\d+\.html$/,    // Pattern: *-p[digits].html  
  /.*topic-\d+\.html$/ // Pattern: *topic-[digits].html
];

export const isOldUrlPattern = (url: string): boolean => {
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  return OLD_URL_PATTERNS.some(pattern => pattern.test(cleanUrl));
};

export const getCleanPath = (path: string): string => {
  return path.startsWith('/') ? path.slice(1) : path;
};