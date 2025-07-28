import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useTopicBookmarks = (topicId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get user's bookmarks
  const { data: bookmarks, isLoading } = useQuery({
    queryKey: ['topic-bookmarks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
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
        
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Check if current topic is bookmarked
  const isBookmarked = topicId && bookmarks?.some(b => b.topic_id === topicId);

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
    mutationFn: async ({ topicId, isCurrentlyBookmarked }: { topicId: string; isCurrentlyBookmarked: boolean }) => {
      if (!user?.id) throw new Error('Must be logged in');

      if (isCurrentlyBookmarked) {
        const { error } = await supabase
          .from('topic_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('topic_id', topicId);
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('topic_bookmarks')
          .insert({
            user_id: user.id,
            topic_id: topicId,
            notification_enabled: true
          });
          
        if (error) throw error;
      }
    },
    onSuccess: (_, { isCurrentlyBookmarked }) => {
      queryClient.invalidateQueries({ queryKey: ['topic-bookmarks', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['topic-bookmark-count', topicId] });
      
      toast.success(
        isCurrentlyBookmarked 
          ? 'Topic removed from bookmarks' 
          : 'Topic bookmarked! You\'ll get notified of new posts.'
      );
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
      toggleBookmark.mutate({ topicId, isCurrentlyBookmarked: !!isBookmarked }),
    toggleNotifications,
    isToggling: toggleBookmark.isPending,
  };
};