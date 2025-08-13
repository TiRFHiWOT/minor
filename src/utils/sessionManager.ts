import { supabase } from '@/integrations/supabase/client';
import { safeStorage } from './safeStorage';

export interface TempUser {
  id: string;
  session_id: string;
  display_name: string;
  created_at: string;
  expires_at: string;
}

class SessionManager {
  private static instance: SessionManager;
  private sessionId: string | null = null;
  private tempUserId: string | null = null;

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  async initializeSession(): Promise<string> {
    try {
      // Check if we have a valid session in storage (mobile-safe)
      const storedSessionId = safeStorage.getItem('temp_session_id');
      const storedExpiry = safeStorage.getItem('temp_session_expiry');
      const storedTempUserId = safeStorage.getItem('temp_user_id');

      if (storedSessionId && storedExpiry && storedTempUserId) {
        try {
          const expiry = new Date(storedExpiry);
          if (expiry > new Date()) {
            // Session is still valid
            this.sessionId = storedSessionId;
            this.tempUserId = storedTempUserId;
            return this.tempUserId;
          }
        } catch (error) {
          console.warn('Invalid stored session data, creating new session');
          this.clearSession();
        }
      }

      // Create new session
      return this.createNewSession();
    } catch (error) {
      console.error('Failed to initialize session:', error);
      // Fallback - create a basic fallback session without database calls
      this.sessionId = 'fallback_' + Date.now();
      this.tempUserId = 'temp_' + Date.now();
      return this.tempUserId;
    }
  }

  private async createNewSession(): Promise<string> {
    // Generate new session ID
    this.sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    
    try {
      // Add timeout for mobile networks
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Session creation timeout')), 10000);
      });
      
      const sessionPromise = supabase.rpc('get_or_create_temp_user', {
        p_session_id: this.sessionId
      });
      
      const { data, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error creating temp user:', error);
        // Don't throw error, create fallback session
        this.tempUserId = 'fallback_' + Date.now();
        console.warn('Using fallback session due to database error');
        return this.tempUserId;
      }

      this.tempUserId = data;
      
      // Store in localStorage with 12-hour expiry
      try {
        const expiry = new Date(Date.now() + 12 * 60 * 60 * 1000);
        safeStorage.setItem('temp_session_id', this.sessionId);
        safeStorage.setItem('temp_user_id', this.tempUserId);
        safeStorage.setItem('temp_session_expiry', expiry.toISOString());

        console.log('Created new temporary user session:', {
          sessionId: this.sessionId,
          tempUserId: this.tempUserId,
          expiry: expiry.toISOString()
        });
      } catch (storageError) {
        console.warn('Failed to store session in localStorage:', storageError);
      }

      return this.tempUserId;
    } catch (error) {
      console.error('Failed to create temp user session:', error);
      // Create fallback session that doesn't require database
      this.tempUserId = 'fallback_' + Date.now();
      console.warn('Using offline fallback session');
      return this.tempUserId;
    }
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  getTempUserId(): string | null {
    return this.tempUserId;
  }

  async getTempUserData(): Promise<TempUser | null> {
    if (!this.tempUserId) return null;

    try {
      const { data, error } = await supabase
        .from('temporary_users')
        .select('*')
        .eq('id', this.tempUserId)
        .single();

      if (error) {
        console.error('Error fetching temp user data:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch temp user data:', error);
      return null;
    }
  }

  clearSession(): void {
    this.sessionId = null;
    this.tempUserId = null;
    safeStorage.removeItem('temp_session_id');
    safeStorage.removeItem('temp_user_id');
    safeStorage.removeItem('temp_session_expiry');
  }

  async checkRateLimit(): Promise<{ canPost: boolean; remainingPosts: number }> {
    // POSTING LIMITS REMOVED - Always allow posting
    return { canPost: true, remainingPosts: 999999 };
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || '127.0.0.1';
    } catch (error) {
      console.warn('Failed to get real IP, using fallback');
      const userAgent = navigator.userAgent;
      const timestamp = Date.now();
      const hash = btoa(`${userAgent}-${timestamp}`).slice(0, 15);
      return `192.168.1.${hash.slice(-3).replace(/[^0-9]/g, '1')}`;
    }
  }

  async recordPost(): Promise<void> {
    if (!this.sessionId) {
      console.error('No session ID available for recording post');
      return;
    }

    try {
      const clientIP = await this.getClientIP();
      console.log('Recording enhanced anonymous activity for IP:', clientIP, 'Session:', this.sessionId);
      
      await supabase.rpc('record_enhanced_anonymous_activity', {
        user_ip: clientIP,
        p_session_id: this.sessionId,
        p_fingerprint_hash: null,
        p_content_type: 'post'
      });
      
      console.log('Activity recorded successfully');
    } catch (error) {
      console.error('Error recording anonymous activity:', error);
    }
  }
}

export const sessionManager = SessionManager.getInstance();