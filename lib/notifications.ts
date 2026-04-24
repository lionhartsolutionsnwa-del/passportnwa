import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationKind =
  | "rate_restaurant"
  | "receipt_approved"
  | "receipt_rejected"
  | "companion_request"
  | "companion_accepted"
  | "redemption_fulfilled"
  | "announcement";

export async function createNotification(params: {
  userId: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  linkUrl?: string;
  restaurantId?: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("notifications").insert({
    user_id: params.userId,
    kind: params.kind,
    title: params.title,
    body: params.body ?? null,
    link_url: params.linkUrl ?? null,
    related_restaurant_id: params.restaurantId ?? null,
  });
  if (error) console.error("[notifications] insert failed:", error);
}
