import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Share2, Mail, Send, CheckCircle2, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Account = { id: string; platform: string };

export default function Distribution() {
  // --- Social ---
  const [content, setContent] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [postResults, setPostResults] = useState<any>(null);

  const accountsQuery = trpc.social.accounts.useQuery(undefined, { retry: false });
  const postMutation = trpc.social.post.useMutation();
  const accounts: Account[] = accountsQuery.data ?? [];

  const toggleAccount = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const selectedAccounts = accounts.filter((a) => selectedIds.includes(a.id));

  const handlePost = async () => {
    try {
      const res = await postMutation.mutateAsync({
        content,
        accounts: selectedAccounts.map((a) => ({ platform: a.platform, accountId: a.id })),
        publishNow: true,
      });
      setPostResults(res);
      toast.success(`Post ${res.status}`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to post");
    }
  };

  // --- Newsletter ---
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipientsRaw, setRecipientsRaw] = useState("");
  const [sendResult, setSendResult] = useState<any>(null);

  const sendMutation = trpc.newsletter.send.useMutation();
  const recipients = recipientsRaw.split(/[\s,;]+/).map((r) => r.trim()).filter(Boolean);

  const handleSend = async () => {
    try {
      const res = await sendMutation.mutateAsync({ subject, html: body, recipients });
      setSendResult(res);
      toast.success(`Newsletter sent to ${res.recipientCount} recipients`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to send newsletter");
    }
  };

  const socialReady = content.trim().length > 0 && selectedIds.length > 0;
  const newsletterReady = subject.trim() && body.trim() && recipients.length > 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Distribution</h1>
        <p className="text-muted-foreground mt-2">Publish to social media and send newsletters</p>
      </div>

      <Tabs defaultValue="social" className="space-y-6">
        <TabsList>
          <TabsTrigger value="social"><Share2 className="h-4 w-4 mr-2" />Social</TabsTrigger>
          <TabsTrigger value="newsletter"><Mail className="h-4 w-4 mr-2" />Newsletter</TabsTrigger>
        </TabsList>

        {/* Social */}
        <TabsContent value="social" className="space-y-6">
          <Card className="p-6 space-y-4">
            <div>
              <Label className="text-sm">Connected accounts</Label>
              {accountsQuery.isLoading && <p className="text-sm text-muted-foreground mt-2">Checking…</p>}
              {accountsQuery.error && (
                <p className="text-sm text-muted-foreground mt-2">Not configured — set ZERNIO_API_KEY to connect accounts.</p>
              )}
              {accountsQuery.data && accounts.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  No accounts connected yet. Connect your social accounts in the Zernio dashboard, then refresh.
                </p>
              )}
              <div className="flex flex-wrap gap-4 mt-2">
                {accounts.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 text-sm cursor-pointer capitalize">
                    <Checkbox checked={selectedIds.includes(a.id)} onCheckedChange={() => toggleAccount(a.id)} />
                    {a.platform}
                    <span className="text-xs text-muted-foreground normal-case">({a.id.slice(-6)})</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="post">Post</Label>
              <Textarea id="post" rows={5} value={content} onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post…" className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">{content.length} characters</p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={!socialReady || postMutation.isPending}>
                  <Send className="h-4 w-4 mr-2" />Review & Post
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Publish this post?</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-2">
                      <div>Posting to: <strong className="capitalize">{selectedAccounts.map((a) => a.platform).join(", ")}</strong></div>
                      <div className="p-3 rounded bg-muted text-foreground text-sm whitespace-pre-wrap">{content}</div>
                      <div className="text-xs">This publishes immediately on your connected accounts.</div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handlePost}>Confirm & Post</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Card>

          {postResults && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Result</h3>
              <div className="flex items-center gap-2 text-sm mb-3">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Status: <span className="font-medium capitalize">{postResults.status}</span>
              </div>
              {postResults.postUrls?.map((p: { platform: string; url: string }, i: number) => (
                <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline">
                  <span className="capitalize">{p.platform}</span> <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </Card>
          )}
        </TabsContent>

        {/* Newsletter */}
        <TabsContent value="newsletter" className="space-y-6">
          <Card className="p-6 space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="body">Body (HTML)</Label>
              <Textarea id="body" rows={10} value={body} onChange={(e) => setBody(e.target.value)}
                placeholder="<h1>Hello</h1><p>Your newsletter…</p>" className="mt-2 font-mono text-sm" />
            </div>
            <div>
              <Label htmlFor="recipients">Recipients</Label>
              <Textarea id="recipients" rows={4} value={recipientsRaw} onChange={(e) => setRecipientsRaw(e.target.value)}
                placeholder="one@example.com, two@example.com" className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">{recipients.length} recipient(s) — sent via BCC.</p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={!newsletterReady || sendMutation.isPending}>
                  <Send className="h-4 w-4 mr-2" />Review & Send
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Send this newsletter?</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-2">
                      <div>Subject: <strong>{subject}</strong></div>
                      <div>Recipients: <strong>{recipients.length}</strong></div>
                      <div className="text-xs">This sends the email immediately.</div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSend}>Confirm & Send</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Card>

          {sendResult && (
            <Card className="p-6">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Sent to {sendResult.recipientCount} recipient(s){sendResult.id ? ` (id: ${sendResult.id})` : ""}.
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
