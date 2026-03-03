"use server";

import { getSessionUser } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";

export async function savePushSubscription(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인 필요" };

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" }
  );

  if (error) return { error: error.message };
  return { success: true };
}

export async function deletePushSubscription(endpoint: string) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인 필요" };

  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", user.id);

  return { success: true };
}

export async function sendTestPush() {
  const { user } = await getSessionUser();
  if (!user) return { error: "로그인 필요" };

  await sendPushToUser(user.id, {
    title: "테스트 알림",
    body: "푸시 알림이 정상 작동합니다!",
    url: "/notifications",
    tag: "test",
  });

  return { success: true };
}
