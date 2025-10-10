import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export const useAppeals = () => {
  const { data: appeals, isLoading } = useQuery({
    queryKey: ["appeals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("moderation_appeals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return {
    appeals,
    isLoading,
  };
};

export const useUpdateAppeal = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      adminResponse,
    }: {
      id: string;
      status: "approved" | "denied";
      adminResponse?: string;
    }) => {
      // Map UI-level status to DB-allowed status values for moderation_appeals
      // DB constraint allows: 'pending', 'reviewed', 'dismissed'
      const appealStatus = status === "approved" ? "reviewed" : "dismissed";

      const { error } = await supabase
        .from("moderation_appeals")
        .update({
          status: appealStatus,
          admin_response: adminResponse,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      // If appeal is approved (UI-level), we need to reject the content
      if (status === "approved") {
        const { data: appeal } = await supabase
          .from("moderation_appeals")
          .select("content_id, content_type")
          .eq("id", id)
          .single();

        if (appeal) {
          if (appeal.content_type === "topic") {
            await supabase
              .from("topics")
              .update({ moderation_status: "rejected" })
              .eq("id", appeal.content_id);
          } else if (appeal.content_type === "post") {
            await supabase
              .from("posts")
              .update({ moderation_status: "rejected" })
              .eq("id", appeal.content_id);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appeals"] });
      queryClient.invalidateQueries({ queryKey: ["appeals-count"] });
      queryClient.invalidateQueries({ queryKey: ["moderation-queue"] });
      toast({
        title: "Appeal updated",
        description: "Appeal has been processed successfully.",
      });
    },
    onError: (error) => {
      console.error("Error updating appeal:", error);
      toast({
        title: "Error",
        description: "Failed to update appeal.",
        variant: "destructive",
      });
    },
  });
};

export const useAppealsCount = () => {
  const { data: count } = useQuery({
    queryKey: ["appeals-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("moderation_appeals")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (error) throw error;
      return count || 0;
    },
  });

  return count || 0;
};
