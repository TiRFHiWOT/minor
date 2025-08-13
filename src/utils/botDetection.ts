// Bot detection utilities for preventing VPN blocking of legitimate crawlers

export interface BotInfo {
  isBot: boolean;
  botName?: string;
  botType?: 'search' | 'social' | 'ad' | 'other';
}

// Comprehensive list of known bot user agents
const BOT_USER_AGENTS = [
  // Google bots (CRITICAL for ad revenue)
  'Googlebot',
  'GoogleImageProxy',
  'GoogleAssistant',
  'GoogleAdSenseInfeed',
  'Mediapartners-Google',
  'AdSense',
  'Google-AMPHTML',
  'Google-Structured-Data-Testing-Tool',
  'GoogleOther',
  'GoogleProducer',
  'GoogleWeblight',
  
  // Bing
  'bingbot',
  'BingPreview',
  'msnbot',
  'AdIdxBot',
  
  // Yahoo
  'Slurp',
  'YahooSeeker',
  
  // Social media crawlers (critical for social sharing)
  'facebookexternalhit',
  'Twitterbot',
  'LinkedInBot',
  'WhatsApp',
  'TelegramBot',
  'SkypeUriPreview',
  'Pinterest',
  'Snapchat',
  'InstagramBot',
  
  // Apple
  'Applebot',
  'AppleNewsBot',
  
  // Other search engines
  'DuckDuckBot',
  'YandexBot',
  'Baiduspider',
  
  // Ad network crawlers (CRITICAL for revenue)
  'AdsBot-Google',
  'AdsBot-Google-Mobile',
  'GoogleBot-Image',
  'GoogleBot-News',
  'GoogleBot-Video',
  'AmazonAdBot',
  'MicrosoftAdBot',
  'FacebookBot',
  'TwitterBot',
  'LinkedInBot',
  
  // SEO tools
  'AhrefsBot',
  'SemrushBot',
  'MJ12bot',
  'DotBot',
  'MozBot',
  'ScreamingFrogSEOSpider',
  
  // Archive crawlers
  'ia_archiver',
  'Wayback',
  'archive.org_bot',
  
  // AI/Claude crawlers
  'ClaudeBot',
  'Claude-Web',
  'anthropic',
  'OpenAI',
  'ChatGPT',
  'GPTBot',
  
  // Cloud services that are often flagged as VPNs
  'AmazonCloudWatch',
  'AWS-Internal',
  'GoogleCloud',
  'MicrosoftAzure',
  'CloudFlare',
  'Fastly',
  
  // Monitoring and uptime bots
  'PingdomBot',
  'UptimeRobot',
  'StatusCake',
  'Site24x7',
  'Lighthouse',
  'PageSpeed',
  'GTmetrix',
  'WebPageTest'
];

// Bot name mapping for better identification
const BOT_NAME_MAPPING: Record<string, { name: string; type: BotInfo['botType'] }> = {
  'Googlebot': { name: 'Google Search', type: 'search' },
  'GoogleAdSenseInfeed': { name: 'Google AdSense', type: 'ad' },
  'Mediapartners-Google': { name: 'Google AdSense', type: 'ad' },
  'AdSense': { name: 'Google AdSense', type: 'ad' },
  'AdsBot-Google': { name: 'Google Ads', type: 'ad' },
  'AdsBot-Google-Mobile': { name: 'Google Ads Mobile', type: 'ad' },
  'bingbot': { name: 'Bing Search', type: 'search' },
  'AdIdxBot': { name: 'Bing Ads', type: 'ad' },
  'Slurp': { name: 'Yahoo Search', type: 'search' },
  'facebookexternalhit': { name: 'Facebook', type: 'social' },
  'FacebookBot': { name: 'Facebook', type: 'social' },
  'Twitterbot': { name: 'Twitter', type: 'social' },
  'TwitterBot': { name: 'Twitter', type: 'social' },
  'LinkedInBot': { name: 'LinkedIn', type: 'social' },
  'Applebot': { name: 'Apple Search', type: 'search' },
  'DuckDuckBot': { name: 'DuckDuckGo', type: 'search' },
  'YandexBot': { name: 'Yandex', type: 'search' },
  'Baiduspider': { name: 'Baidu', type: 'search' },
  'ClaudeBot': { name: 'Claude AI', type: 'other' },
  'Claude-Web': { name: 'Claude AI', type: 'other' },
  'anthropic': { name: 'Anthropic AI', type: 'other' },
  'AmazonAdBot': { name: 'Amazon Ads', type: 'ad' },
  'MicrosoftAdBot': { name: 'Microsoft Ads', type: 'ad' }
};

// Known cloud provider IP ranges that should never be blocked
const CLOUD_PROVIDER_RANGES = [
  // Google IP ranges
  '8.8.8.0/24', '8.8.4.0/24', '192.178.0.0/16', '172.217.0.0/16',
  '216.58.192.0/19', '74.125.0.0/16', '173.194.0.0/16', '64.233.160.0/19',
  
  // AWS IP ranges  
  '52.0.0.0/8', '54.0.0.0/8', '18.0.0.0/8', '34.0.0.0/8',
  
  // Microsoft Azure IP ranges
  '13.0.0.0/8', '20.0.0.0/8', '40.0.0.0/8', '104.0.0.0/8',
  
  // CloudFlare IP ranges
  '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '104.16.0.0/12'
];

/**
 * Checks if an IP address belongs to a known cloud provider
 */
export const isCloudProviderIP = (ipAddress: string): boolean => {
  try {
    // Simple check for known cloud provider patterns
    for (const range of CLOUD_PROVIDER_RANGES) {
      // Basic subnet matching - in production you'd use a proper IP library
      const [network, prefixLength] = range.split('/');
      const networkParts = network.split('.').map(Number);
      const ipParts = ipAddress.split('.').map(Number);
      
      // Simple /16 and /8 subnet checking
      if (prefixLength === '8' && networkParts[0] === ipParts[0]) {
        return true;
      }
      if (prefixLength === '16' && networkParts[0] === ipParts[0] && networkParts[1] === ipParts[1]) {
        return true;
      }
      if (prefixLength === '24' && 
          networkParts[0] === ipParts[0] && 
          networkParts[1] === ipParts[1] && 
          networkParts[2] === ipParts[2]) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.warn('Error checking cloud provider IP:', error);
    return false;
  }
};

/**
 * Detects if the current request is from a legitimate bot/crawler
 * This is critical for SEO and ad functionality
 */
export const detectBot = (userAgent?: string): BotInfo => {
  if (!userAgent) {
    // Try to get user agent from browser if not provided
    userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  }
  
  if (!userAgent) {
    return { isBot: false };
  }
  
  // Check against known bot user agents (exact matches first for precision)
  for (const botPattern of BOT_USER_AGENTS) {
    if (userAgent.includes(botPattern)) {
      const botInfo = BOT_NAME_MAPPING[botPattern];
      console.log(`🤖 Bot detected: ${botInfo?.name || botPattern} (${userAgent})`);
      
      return {
        isBot: true,
        botName: botInfo?.name || botPattern,
        botType: botInfo?.type || 'other'
      };
    }
  }
  
  // Additional pattern matching for edge cases (more conservative now)
  const botPatterns = [
    /\bbot\b/i,           // Word boundary to avoid false positives
    /\bcrawler\b/i,
    /\bspider\b/i,
    /\bscraper\b/i,
    /\bfeed\b/i,          // For RSS/Atom feeds
    /\bapi\b/i            // For API clients
  ];
  
  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      console.log(`🤖 Generic bot detected: ${userAgent}`);
      return {
        isBot: true,
        botName: 'Generic Bot',
        botType: 'other'
      };
    }
  }
  
  return { isBot: false };
};

/**
 * Checks if the request should be whitelisted regardless of VPN detection
 * This prevents blocking of legitimate crawlers and bots
 * CRITICAL: This function protects ad revenue by never blocking legitimate traffic
 */
export const shouldWhitelistFromVPN = (userAgent?: string, ipAddress?: string): boolean => {
  // First check for bots - NEVER block legitimate bots
  const botInfo = detectBot(userAgent);
  
  if (botInfo.isBot) {
    console.log(`✅ Whitelisting bot from VPN detection: ${botInfo.botName} (${botInfo.botType})`);
    return true;
  }
  
  // Check if IP belongs to known cloud providers (Google, AWS, etc.)
  if (ipAddress && isCloudProviderIP(ipAddress)) {
    console.log(`✅ Whitelisting cloud provider IP from VPN detection: ${ipAddress}`);
    return true;
  }
  
  // Additional safety checks for ad-related user agents
  const adNetworkPatterns = [
    /google/i,
    /adsense/i,
    /doubleclick/i,
    /amazon/i,
    /facebook/i,
    /microsoft/i,
    /apple/i
  ];
  
  if (userAgent) {
    for (const pattern of adNetworkPatterns) {
      if (pattern.test(userAgent)) {
        console.log(`✅ Whitelisting potential ad network traffic: ${userAgent}`);
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Gets bot information for logging and analytics
 */
export const getBotInfo = (userAgent?: string): BotInfo => {
  return detectBot(userAgent);
};
