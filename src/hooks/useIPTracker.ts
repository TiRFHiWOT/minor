import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getUserIP, getIPGeolocation } from '@/utils/ipUtils';
import { sessionManager } from '@/utils/sessionManager';
import { useForumSettings } from '@/hooks/useForumSettings';

export const useIPTracker = () => {
  const location = useLocation();
  const { getSetting } = useForumSettings();

  useEffect(() => {
    const trackPageVisit = async () => {
      try {
        const ip = await getUserIP();
        const sessionId = sessionManager.getSessionId();
        
        if (!ip || !sessionId) return;

        // Get geolocation data
        const geoData = await getIPGeolocation(ip);

        // Check if VPN detection is enabled in forum settings
        const vpnDetectionEnabled = getSetting('vpn_detection_enabled', false);

        // BACKUP VPN PROTECTION: Only block VPN users if detection is enabled
        if (geoData?.is_vpn && vpnDetectionEnabled && location.pathname !== '/vpn-blocked') {
          console.log('🚨 BACKUP VPN DETECTION: Blocking VPN user at IP tracking level');
          window.location.href = '/vpn-blocked';
          return;
        } else if (geoData?.is_vpn && !vpnDetectionEnabled) {
          console.log('🔧 VPN detected but blocking disabled - allowing access');
        }

        // Extract category and topic IDs from the path
        const pathParts = location.pathname.split('/');
        let categoryId = null;
        let topicId = null;

        if (pathParts[1] === 'c' && pathParts[2]) {
          // Category page: /c/category-slug
          const { data: category } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', pathParts[2])
            .single();
          categoryId = category?.id;
        } else if (pathParts[1] === 't' && pathParts[2]) {
          // Topic page: /t/topic-slug
          const { data: topic } = await supabase
            .from('topics')
            .select('id, category_id')
            .eq('slug', pathParts[2])
            .single();
          topicId = topic?.id;
          categoryId = topic?.category_id;
        }

        // Get search query if present
        const searchParams = new URLSearchParams(location.search);
        const searchQuery = searchParams.get('q') || searchParams.get('search');

        // Log the page visit with geolocation data
        if (geoData) {
          await supabase.rpc('log_page_visit_with_geolocation', {
            p_ip_address: ip,
            p_session_id: sessionId,
            p_page_path: location.pathname + location.search,
            p_page_title: document.title,
            p_referrer: document.referrer || null,
            p_user_agent: navigator.userAgent,
            p_search_query: searchQuery,
            p_category_id: categoryId,
            p_topic_id: topicId,
            p_country_code: geoData.country_code,
            p_country_name: geoData.country_name,
            p_city: geoData.city,
            p_region: geoData.region,
            p_latitude: geoData.latitude,
            p_longitude: geoData.longitude,
            p_timezone: geoData.timezone,
            p_is_vpn: geoData.is_vpn,
            p_is_proxy: geoData.is_proxy,
            p_isp: geoData.isp
          });
        } else {
          // Fallback to original function if geolocation fails
          await supabase.rpc('log_page_visit', {
            p_ip_address: ip,
            p_session_id: sessionId,
            p_page_path: location.pathname + location.search,
            p_page_title: document.title,
            p_referrer: document.referrer || null,
            p_user_agent: navigator.userAgent,
            p_search_query: searchQuery,
            p_category_id: categoryId,
            p_topic_id: topicId
          });
        }
      } catch (error) {
        console.error('Failed to track page visit:', error);
      }
    };

    trackPageVisit();
  }, [location.pathname, location.search]);

  const logActivity = async (
    activityType: string,
    contentId?: string,
    contentType?: string,
    actionData?: any,
    isBlocked = false,
    blockedReason?: string
  ) => {
    try {
      const ip = await getUserIP();
      const sessionId = sessionManager.getSessionId();
      
      if (!ip || !sessionId) return;

      await supabase.rpc('log_ip_activity', {
        p_ip_address: ip,
        p_session_id: sessionId,
        p_activity_type: activityType,
        p_content_id: contentId || null,
        p_content_type: contentType || null,
        p_action_data: actionData || null,
        p_is_blocked: isBlocked,
        p_blocked_reason: blockedReason || null
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  return { logActivity };
};