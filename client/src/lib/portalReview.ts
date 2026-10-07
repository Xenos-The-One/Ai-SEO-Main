/** Client-portal review state of a piece of content (null = not shared with the client). */
export type ClientReview = "pending" | "changes_requested" | "approved";

const LABELS: Record<ClientReview, string> = {
  pending: "Awaiting your review",
  changes_requested: "Changes requested",
  approved: "Approved",
};

const BADGE_CLASSES: Record<ClientReview, string> = {
  pending: "bg-orange-500/10 text-orange-500",
  changes_requested: "bg-blue-500/10 text-blue-500",
  approved: "bg-green-500/10 text-green-500",
};

export function clientReviewLabel(state: string | null | undefined): string {
  return (state && LABELS[state as ClientReview]) || "Shared";
}

export function clientReviewBadgeClass(state: string | null | undefined): string {
  return (state && BADGE_CLASSES[state as ClientReview]) || "bg-muted text-muted-foreground";
}

/** Labels for the kinds of portal feedback entries. */
export const FEEDBACK_KIND_LABELS: Record<string, string> = {
  revision_request: "Requested changes",
  approval: "Approved",
};
