import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAppeals, useUpdateAppeal } from "@/hooks/useAppeals";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  User,
  Calendar,
  FileText,
  AlertTriangle,
} from "lucide-react";

export const AppealsManager = () => {
  const { appeals, isLoading } = useAppeals();
  const updateAppeal = useUpdateAppeal();
  const [selectedAppeal, setSelectedAppeal] = useState<any>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  const handleReview = async (status: "approved" | "denied") => {
    if (!selectedAppeal) return;

    await updateAppeal.mutateAsync({
      id: selectedAppeal.id,
      status,
      adminResponse: adminResponse.trim() || undefined,
    });

    setIsReviewDialogOpen(false);
    setSelectedAppeal(null);
    setAdminResponse("");
  };

  const getStatusBadge = (status: string) => {
    // DB stores: 'pending', 'reviewed', 'dismissed'
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="secondary"
            className="bg-warning text-warning-foreground"
          >
            Pending
          </Badge>
        );
      case "reviewed":
        // 'reviewed' means the appeal was accepted (restored/approved)
        return (
          <Badge
            variant="default"
            className="bg-success text-success-foreground"
          >
            Approved
          </Badge>
        );
      case "dismissed":
        // 'dismissed' means the appeal was denied / dismissed by admin
        return <Badge variant="destructive">Denied</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filterAppealsByStatus = (status: string) => {
    return appeals?.filter((appeal) => appeal.status === status) || [];
  };

  const getContentTypeIcon = (contentType: string) => {
    return contentType === "topic" ? (
      <FileText className="h-4 w-4" />
    ) : (
      <MessageSquare className="h-4 w-4" />
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // appeal.status uses DB values: 'pending', 'reviewed', 'dismissed'
  const pendingAppeals = filterAppealsByStatus("pending");
  const reviewedAppeals = filterAppealsByStatus("reviewed").concat(
    filterAppealsByStatus("dismissed")
  );

  if (!appeals || appeals.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <AlertTriangle className="h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold">No Appeals Found</h3>
            <p className="text-muted-foreground">
              There are no moderation appeals to review at this time.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            Pending ({pendingAppeals.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed">
            Reviewed ({reviewedAppeals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingAppeals.length === 0 ? (
            <Card className="p-6 text-center">
              <div className="flex flex-col items-center gap-4">
                <CheckCircle className="h-12 w-12 text-success" />
                <div>
                  <h3 className="text-lg font-semibold">All Caught Up!</h3>
                  <p className="text-muted-foreground">
                    No pending appeals to review.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {pendingAppeals.map((appeal) => (
                  <Card key={appeal.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getContentTypeIcon(appeal.content_type)}
                            <span className="font-medium capitalize">
                              {appeal.content_type} Appeal
                            </span>
                            {getStatusBadge(appeal.status)}
                          </div>

                          <Dialog
                            open={isReviewDialogOpen}
                            onOpenChange={setIsReviewDialogOpen}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedAppeal(appeal);
                                  setAdminResponse("");
                                }}
                              >
                                Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Review Appeal</DialogTitle>
                              </DialogHeader>

                              {selectedAppeal && (
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                      Content Type
                                    </Label>
                                    <p className="text-sm capitalize">
                                      {selectedAppeal.content_type}
                                    </p>
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                      Appeal Reason
                                    </Label>
                                    <p className="text-sm">
                                      {selectedAppeal.appeal_reason}
                                    </p>
                                  </div>

                                  {selectedAppeal.content_context && (
                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium">
                                        Content Context
                                      </Label>
                                      <ScrollArea className="h-24 w-full rounded border p-3">
                                        <p className="text-sm">
                                          {selectedAppeal.content_context}
                                        </p>
                                      </ScrollArea>
                                    </div>
                                  )}

                                  <div className="space-y-2">
                                    <Label htmlFor="admin-response">
                                      Admin Response (Optional)
                                    </Label>
                                    <Textarea
                                      id="admin-response"
                                      value={adminResponse}
                                      onChange={(e) =>
                                        setAdminResponse(e.target.value)
                                      }
                                      placeholder="Provide feedback to the appellant..."
                                      rows={3}
                                    />
                                  </div>

                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      variant="outline"
                                      onClick={() =>
                                        setIsReviewDialogOpen(false)
                                      }
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleReview("denied")}
                                      disabled={updateAppeal.isLoading}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Deny Appeal
                                    </Button>
                                    <Button
                                      onClick={() => handleReview("approved")}
                                      disabled={updateAppeal.isLoading}
                                      className="bg-success hover:bg-success/90 text-success-foreground"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Approve Appeal
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium">
                              Appeal Reason:
                            </span>
                            <p className="text-sm text-muted-foreground mt-1">
                              {appeal.appeal_reason}
                            </p>
                          </div>

                          {appeal.content_context && (
                            <div>
                              <span className="text-sm font-medium">
                                Content Context:
                              </span>
                              <p className="text-sm text-muted-foreground mt-1 truncate max-w-lg">
                                {appeal.content_context}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {appeal.appellant_email || "Anonymous"}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDistanceToNow(new Date(appeal.created_at), {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-4">
          {reviewedAppeals.length === 0 ? (
            <Card className="p-6 text-center">
              <div className="flex flex-col items-center gap-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">No Reviewed Appeals</h3>
                  <p className="text-muted-foreground">
                    No appeals have been reviewed yet.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {reviewedAppeals.map((appeal) => (
                  <Card key={appeal.id} className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        {getContentTypeIcon(appeal.content_type)}
                        <span className="font-medium capitalize">
                          {appeal.content_type} Appeal
                        </span>
                        {getStatusBadge(appeal.status)}
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium">
                            Appeal Reason:
                          </span>
                          <p className="text-sm text-muted-foreground mt-1">
                            {appeal.appeal_reason}
                          </p>
                        </div>

                        {appeal.admin_response && (
                          <div>
                            <span className="text-sm font-medium">
                              Admin Response:
                            </span>
                            <p className="text-sm text-muted-foreground mt-1">
                              {appeal.admin_response}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {appeal.appellant_email || "Anonymous"}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Reviewed{" "}
                          {formatDistanceToNow(new Date(appeal.reviewed_at), {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
