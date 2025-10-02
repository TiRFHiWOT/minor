import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEditPost } from "@/hooks/useEditPost";
import { useEditTopic } from "@/hooks/useEditTopic";
import { useToast } from "@/hooks/use-toast";

type ReportLike = {
  reported_post_id?: string | null;
  post?: { content?: string } | null;
  reported_topic_id?: string | null;
  topic?: { title?: string; content?: string } | null;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  report: ReportLike | null;
  onSaved?: () => void;
}

export const EditReportedContentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  report,
  onSaved,
}) => {
  const { toast } = useToast();
  const { mutateAsync: editPost } = useEditPost();
  const { mutateAsync: editTopic } = useEditTopic();

  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  const htmlToPlain = (html?: string | null) => {
    if (!html) return "";
    try {
      const withBreaks = html.replace(/<br\s*\/?>/gi, "\n");
      const withNewlines = withBreaks.replace(
        /<\/(?:div|p)>\s*<(?:div|p)[^>]*>/gi,
        "\n"
      );
      const withoutDivs = withNewlines.replace(/<\/?(?:div|p)[^>]*>/gi, "");
      const doc = new DOMParser().parseFromString(withoutDivs, "text/html");
      return (doc.body.textContent || "").trim();
    } catch (e) {
      // Fallback: remove tags roughly
      return html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .trim();
    }
  };

  React.useEffect(() => {
    if (!report) return;
    if (report.reported_post_id && report.post) {
      setContent(htmlToPlain(report.post.content ?? ""));
      setTitle("");
    } else if (report.reported_topic_id && report.topic) {
      setTitle(report.topic.title || "");
      setContent(htmlToPlain(report.topic.content ?? ""));
    }
  }, [report]);

  // Reset title/content to the provided report values (discard unsaved edits)
  const resetToReport = React.useCallback(() => {
    if (!report) {
      setTitle("");
      setContent("");
      return;
    }
    if (report.reported_post_id && report.post) {
      setContent(htmlToPlain(report.post.content ?? ""));
      setTitle("");
    } else if (report.reported_topic_id && report.topic) {
      setTitle(report.topic.title || "");
      setContent(htmlToPlain(report.topic.content ?? ""));
    } else {
      setTitle("");
      setContent("");
    }
  }, [report]);

  // When the modal opens, ensure fields reflect the current report
  React.useEffect(() => {
    if (isOpen) resetToReport();
  }, [isOpen, resetToReport]);

  const handleSave = async () => {
    if (!report) return;
    setIsSaving(true);
    try {
      if (report.reported_post_id) {
        await editPost({ postId: report.reported_post_id, content });
      } else if (report.reported_topic_id) {
        await editTopic({ topicId: report.reported_topic_id, title, content });
      }

      toast({ title: "Saved", description: "Content updated" });
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      const message = (err as Error)?.message ?? "Failed to save";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!report) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) {
          // discard unsaved edits when the dialog is closed by outside click
          resetToReport();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Edit Reported Content</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {report.reported_topic_id && (
            <div>
              <label className="text-sm text-muted-foreground block mb-1">
                Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle((e.target as HTMLInputElement).value)}
              />
            </div>
          )}

          <div>
            <label className="text-sm text-muted-foreground block mb-2">
              Content
            </label>
            <Textarea
              value={content}
              onChange={(e) =>
                setContent((e.target as HTMLTextAreaElement).value)
              }
              rows={8}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                // discard unsaved edits when clicking Cancel
                resetToReport();
                onClose();
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditReportedContentModal;
