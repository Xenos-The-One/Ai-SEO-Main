import { useState, useEffect } from "react";
import { useLocation, useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle, XCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function PortalContentDetail() {
  const params = useParams<{ id: string }>();
  const contentId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [comment, setComment] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("client_portal_token");
    const userData = localStorage.getItem("client_portal_user");
    
    if (!token || !userData) {
      setLocation("/portal/login");
      return;
    }
    
    setUser(JSON.parse(userData));
  }, [setLocation]);

  const { data: content, isLoading, refetch } = trpc.clientPortal.contentById.useQuery(
    { id: contentId },
    { enabled: contentId > 0 && !!user }
  );

  const approveMutation = trpc.clientPortal.approve.useMutation();
  const requestRevisionMutation = trpc.clientPortal.requestRevision.useMutation();

  const { data: feedback, refetch: refetchFeedback } = trpc.clientPortal.contentFeedback.useQuery(
    { contentId },
    { enabled: contentId > 0 && !!user }
  );
  const addFeedbackMutation = trpc.clientPortal.addFeedback.useMutation();

  const handleAddNote = async () => {
    if (!note.trim()) return;
    try {
      await addFeedbackMutation.mutateAsync({ contentId, note: note.trim() });
      setNote("");
      toast.success("Note sent");
      refetchFeedback();
    } catch (error: any) {
      toast.error(error.message || "Failed to send note");
    }
  };

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync({
        contentId,
      });
      toast.success("Content approved successfully");
      setShowApprovalDialog(false);
      setComment("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve content");
    }
  };

  const handleRequestRevision = async () => {
    if (!comment.trim()) {
      toast.error("Please provide feedback for the revision");
      return;
    }

    try {
      await requestRevisionMutation.mutateAsync({
        contentId,
        reason: comment,
      });
      toast.success("Revision requested successfully");
      setShowRevisionDialog(false);
      setComment("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to request revision");
    }
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading content...</div>
      </div>
    );
  }

  if (!content || content.clientId !== user.clientId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Content not found</h2>
          <p className="text-muted-foreground mb-4">This content doesn't exist or you don't have access to it</p>
          <Link href="/portal/content">
            <Button>Back to Content List</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const canApprove = content.status === "draft" || content.status === "in_progress";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/portal/content">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{content.title}</h1>
                <p className="text-sm text-muted-foreground">{content.topic}</p>
              </div>
            </div>
            <Badge className={
              content.status === "approved" ? "bg-green-500/10 text-green-500" :
              content.status === "in_progress" ? "bg-blue-500/10 text-blue-500" :
              "bg-yellow-500/10 text-yellow-500"
            }>
              {content.status.replace("_", " ")}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Content Preview */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {content.imageUrl && (
                  <img
                    src={content.imageUrl}
                    alt={content.title}
                    className="w-full h-72 object-cover rounded-lg mb-6"
                  />
                )}
                {content.content ? (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <Streamdown>{content.content}</Streamdown>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No content generated yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            {canApprove && user.role === "client_admin" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Button onClick={() => setShowApprovalDialog(true)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Content
                  </Button>
                  <Button variant="outline" onClick={() => setShowRevisionDialog(true)}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Request Revision
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Feedback & Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Feedback &amp; Notes</CardTitle>
                <p className="text-xs text-muted-foreground">Leave notes for our team about this content</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Share a note, suggestion, or requested change…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={4}
                  />
                  <Button
                    className="w-full"
                    onClick={handleAddNote}
                    disabled={addFeedbackMutation.isPending || !note.trim()}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {addFeedbackMutation.isPending ? "Sending…" : "Send Note"}
                  </Button>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {!feedback || feedback.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
                  ) : (
                    feedback.map((f: any) => (
                      <div key={f.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{f.authorName || "Client"}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(f.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{f.note}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Content Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">{new Date(content.createdAt).toLocaleDateString()}</p>
                </div>
                {content.scheduledPublishDate && (
                  <div>
                    <p className="text-muted-foreground">Scheduled</p>
                    <p className="font-medium">{new Date(content.scheduledPublishDate).toLocaleDateString()}</p>
                  </div>
                )}
                {content.wordCount ? (
                  <div>
                    <p className="text-muted-foreground">Word Count</p>
                    <p className="font-medium">{content.wordCount} words</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Approval Dialog */}
      {showApprovalDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Approve Content</CardTitle>
              <p className="text-sm text-muted-foreground">
                Confirm that this content is ready to be published
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Comment (Optional)</label>
                <Textarea
                  placeholder="Add any comments or feedback..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowApprovalDialog(false);
                    setComment("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? "Approving..." : "Approve"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revision Dialog */}
      {showRevisionDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Request Revision</CardTitle>
              <p className="text-sm text-muted-foreground">
                Provide feedback on what needs to be changed
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Feedback *</label>
                <Textarea
                  placeholder="Please describe what changes are needed..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={6}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowRevisionDialog(false);
                    setComment("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleRequestRevision}
                  disabled={requestRevisionMutation.isPending || !comment.trim()}
                >
                  {requestRevisionMutation.isPending ? "Sending..." : "Request Revision"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
