import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useTopicBookmarks = (topicId?: string) => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  // Debug logging
  console.log('useTopicBookmarks - User:', user?.id, 'Loading:', loading);

  // Get user's bookmarks
  const { data: bookmarks, isLoading, error } = useQuery({
    queryKey: ['topic-bookmarks', user?.id],
    queryFn: async () => {
      console.log('Fetching bookmarks for user:', user?.id);
      
      if (!user?.id) {
        console.log('No user ID available');
        return [];
      }
      
      const { data, error } = await supabase
        .from('topic_bookmarks')
        .select(`
          id,
          user_id,
          topic_id,
          notification_enabled,
          created_at,
          topics (
            id,
            title,
            slug,
            last_reply_at,
            reply_count,
            view_count,
            category_id,
            categories (
              name,
              color,
              slug
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching bookmarks:', error);
        throw error;
      }
      
      console.log('Bookmarks fetched:', data?.length || 0, 'items');
      return data || [];
    },
    enabled: !!user?.id && !loading,
    retry: (failureCount, error) => {
      // Retry on auth-related errors
      if (failureCount < 3 && error?.message?.includes('JWT')) {
        return true;
      }
      return false;
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Check if current topic is bookmarked
  const isBookmarked = Boolean(topicId && bookmarks?.some(b => b.topic_id === topicId));
  
  // Debug logging for bookmark state
  if (topicId) {
    console.log(`Topic ${topicId} bookmarked:`, isBookmarked, 'Total bookmarks:', bookmarks?.length || 0);
  }

  // Get bookmark count for a topic
  const { data: bookmarkCount } = useQuery({
    queryKey: ['topic-bookmark-count', topicId],
    queryFn: async () => {
      if (!topicId) return 0;
      
      const { count, error } = await supabase
        .from('topic_bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', topicId);
        
      if (error) throw error;
      return count || 0;
    },
    enabled: !!topicId,
  });

  // Toggle bookmark mutation
  const toggleBookmark = useMutation({
    mutationFn: async (topicId: string) => {
      if (!user?.id) throw new Error('Must be logged in');

      // Check current state in database first
      const { data: existingBookmark, error: checkError } = await supabase
        .from('topic_bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('topic_id', topicId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingBookmark) {
        // Delete existing bookmark
        const { error } = await supabase
          .from('topic_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('topic_id', topicId);
          
        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Create new bookmark
        const { error } = await supabase
          .from('topic_bookmarks')
          .insert({
            user_id: user.id,
            topic_id: topicId,
            notification_enabled: true
          });
          
        if (error) {
          // Handle duplicate key constraint specifically
          if (error.code === '23505') {
            console.warn('Bookmark already exists, ignoring duplicate insert');
            return { action: 'exists' };
          }
          throw error;
        }
        return { action: 'added' };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['topic-bookmarks', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['topic-bookmark-count', topicId] });
      
      if (result.action === 'added') {
        toast.success('Topic bookmarked! You\'ll get notified of new posts.');
      } else if (result.action === 'removed') {
        toast.success('Topic removed from bookmarks');
      }
    },
    onError: (error) => {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark');
    },
  });

  // Toggle notification setting
  const toggleNotifications = useMutation({
    mutationFn: async ({ topicId, enabled }: { topicId: string; enabled: boolean }) => {
      if (!user?.id) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('topic_bookmarks')
        .update({ notification_enabled: enabled })
        .eq('user_id', user.id)
        .eq('topic_id', topicId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic-bookmarks', user?.id] });
      toast.success('Notification setting updated');
    },
    onError: (error) => {
      console.error('Error updating notification setting:', error);
      toast.error('Failed to update notification setting');
    },
  });

  return {
    bookmarks,
    isLoading,
    isBookmarked,
    bookmarkCount,
    toggleBookmark: (topicId: string) => 
      toggleBookmark.mutate(topicId),
    toggleNotifications,
    isToggling: toggleBookmark.isPending,
  };
};