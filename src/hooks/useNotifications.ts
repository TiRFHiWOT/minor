import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get notifications - simplified query to avoid complex joins
  const { data: rawNotifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('topic_notifications')
        .select(`
          id,
          user_id,
          topic_id,
          post_id,
          report_id,
          appeal_id,
          notification_type,
          is_read,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Get related topic details
  const { data: topics } = useQuery({
    queryKey: ['notification-topics', rawNotifications?.map(n => n.topic_id).filter(Boolean)],
    queryFn: async () => {
      const topicIds = rawNotifications?.map(n => n.topic_id).filter(Boolean) || [];
      if (topicIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('topics')
        .select(`
          id,
          title,
          slug,
          category_id,
          categories:category_id (
            name,
            color,
            slug
          )
        `)
        .in('id', topicIds);
        
      if (error) throw error;
      return data || [];
    },
    enabled: (rawNotifications?.length || 0) > 0,
  });

  // Get related report details for admin notifications
  const { data: reports } = useQuery({
    queryKey: ['notification-reports', rawNotifications?.map(n => n.report_id).filter(Boolean)],
    queryFn: async () => {
      const reportIds = rawNotifications?.map(n => n.report_id).filter(Boolean) || [];
      if (reportIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('reports')
        .select(`
          id,
          reason,
          description,
          status,
          created_at,
          reported_topic_id,
          reported_post_id
        `)
        .in('id', reportIds);
        
      if (error) throw error;
      return data || [];
    },
    enabled: (rawNotifications?.length || 0) > 0,
  });

  // Get related appeal details for admin notifications
  const { data: appeals } = useQuery({
    queryKey: ['notification-appeals', rawNotifications?.map(n => n.appeal_id).filter(Boolean)],
    queryFn: async () => {
      const appealIds = rawNotifications?.map(n => n.appeal_id).filter(Boolean) || [];
      if (appealIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('moderation_appeals')
        .select(`
          id,
          appeal_reason,
          status,
          content_type,
          created_at
        `)
        .in('id', appealIds);
        
      if (error) throw error;
      return data || [];
    },
    enabled: (rawNotifications?.length || 0) > 0,
  });

  // Combine all data
  const notifications = rawNotifications?.map(notification => {
    const topic = topics?.find(t => t.id === notification.topic_id);
    const report = reports?.find(r => r.id === notification.report_id);
    const appeal = appeals?.find(a => a.id === notification.appeal_id);
    
    return {
      ...notification,
      topic,
      report,
      appeal
    };
  }) || [];

  // Get unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { data, error } = await supabase
        .rpc('get_unread_notification_count', { p_user_id: user.id });
        
      if (error) throw error;
      return data || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark notification as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('topic_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
    },
  });

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('topic_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
    },
  });

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('topic-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'topic_notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
          queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user.id] });
          queryClient.invalidateQueries({ queryKey: ['notification-topics'] });
          queryClient.invalidateQueries({ queryKey: ['notification-reports'] });
          queryClient.invalidateQueries({ queryKey: ['notification-appeals'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'topic_notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
          queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    isMarkingRead: markAsRead.isPending,
  };
};