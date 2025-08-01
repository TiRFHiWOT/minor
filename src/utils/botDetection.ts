// Bot detection utilities for preventing VPN blocking of legitimate crawlers

export interface BotInfo {
  isBot: boolean;
  botName?: string;
  botType?: 'search' | 'social' | 'ad' | 'other';
}

// Comprehensive list of known bot user agents
const BOT_USER_AGENTS = [
  // Google bots
  'Googlebot',
  'GoogleAdSenseInfeed', 
  'Mediapartners-Google',
  'GoogleAdSenseBot',
  'GoogleImageProxy',
  'GoogleAdBot',
  'GoogleAssistant',
  
  // Bing
  'bingbot',
  'BingPreview',
  'msnbot',
  
  // Yahoo
  'Slurp',
  'YahooSeeker',
  
  // Social media crawlers
  'facebookexternalhit',
  'Twitterbot',
  'LinkedInBot',
  'WhatsApp',
  'TelegramBot',
  'SkypeUriPreview',
  
  // Apple
  'Applebot',
  
  // Other search engines
  'DuckDuckBot',
  'YandexBot',
  'Baiduspider',
  
  // SEO tools
  'AhrefsBot',
  'SemrushBot',
  'MJ12bot',
  'DotBot',
  
  // Archive crawlers
  'ia_archiver',
  'Wayback',
  
  // Other legitimate bots
  'PingdomBot',
  'UptimeRobot',
  'StatusCake',
  'Site24x7',
  'Lighthouse'
];

// Bot name mapping for better identification
const BOT_NAME_MAPPING: Record<string, { name: string; type: BotInfo['botType'] }> = {
  'Googlebot': { name: 'Google Search', type: 'search' },
  'GoogleAdSenseInfeed': { name: 'Google AdSense', type: 'ad' },
  'Mediapartners-Google': { name: 'Google AdSense', type: 'ad' },
  'GoogleAdSenseBot': { name: 'Google AdSense', type: 'ad' },
  'GoogleAdBot': { name: 'Google Ads', type: 'ad' },
  'bingbot': { name: 'Bing Search', type: 'search' },
  'Slurp': { name: 'Yahoo Search', type: 'search' },
  'facebookexternalhit': { name: 'Facebook', type: 'social' },
  'Twitterbot': { name: 'Twitter', type: 'social' },
  'LinkedInBot': { name: 'LinkedIn', type: 'social' },
  'Applebot': { name: 'Apple Search', type: 'search' },
  'DuckDuckBot': { name: 'DuckDuckGo', type: 'search' },
  'YandexBot': { name: 'Yandex', type: 'search' },
  'Baiduspider': { name: 'Baidu', type: 'search' }
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
  
  // Check against known bot user agents
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
  
  // Additional pattern matching for edge cases
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i
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
 */
export const shouldWhitelistFromVPN = (userAgent?: string): boolean => {
  const botInfo = detectBot(userAgent);
  
  if (botInfo.isBot) {
    console.log(`✅ Whitelisting bot from VPN detection: ${botInfo.botName}`);
    return true;
  }
  
  return false;
};

/**
 * Gets bot information for logging and analytics
 */
export const getBotInfo = (userAgent?: string): BotInfo => {
  return detectBot(userAgent);
};
