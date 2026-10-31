import { supabase } from "@/integrations/supabase/client";

export const VAPID_PUBLIC_KEY = "BCeqCiB1BIpmyfMMAqhKJJ6fEcKRQqrgV4rJR0x41Dj9OjqZqC-pBMmy2HSXUXOSbprA2doQYRjl8Q-vFhYRl-A";

export type PushStatus = "enabled" | "unsupported" | "open-in-new-tab" | "denied" | "not-signed-in" | "error";

function toKey(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function pushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function isPushEnabled() {
  if (!pushSupported() || Notification.permission !== "granted") return false;
  const reg = await navigator.serviceWorker.getRegistration("/app/");
  return !!(await reg?.pushManager.getSubscription());
}

/** Call from a button tap. */
export async function enablePush(): Promise<PushStatus> {
  if (!pushSupported()) return "unsupported";
  if (window.self !== window.top) return "open-in-new-tab";
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "not-signed-in";
  const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (perm !== "granted") return "denied";
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/app/", updateViaCache: "none" });
    await navigator.serviceWorker.ready;
    const sub =
      (await reg.pushManager.getSubscription()) ||
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(VAPID_PUBLIC_KEY) }));
    const json = sub.toJSON() as any;
    const { error } = await (supabase as any).from("push_subscriptions").upsert(
      { user_id: user.id, endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth, user_agent: navigator.userAgent },
      { onConflict: "endpoint" },
    );
    if (error) throw error;
    return "enabled";
  } catch (e) {
    console.error(e);
    return "error";
  }
}
