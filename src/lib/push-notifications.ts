import { supabase } from "@/integrations/supabase/client";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function getVapidPublicKey(): Promise<string> {
  const { data, error } = await supabase.functions.invoke("get-vapid-key");
  if (error) throw error;
  return data.vapidPublicKey;
}

export async function subscribeToPush(imei: string): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push not supported");
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      const vapidKey = await getVapidPublicKey();
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }

    const subJson = subscription.toJSON();
    
    // Save to database
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        imei,
        endpoint: subJson.endpoint!,
        p256dh: subJson.keys!.p256dh!,
        auth: subJson.keys!.auth!,
      },
      { onConflict: "endpoint" }
    );

    if (error) {
      console.error("Save subscription error:", error);
      return false;
    }

    return true;
  } catch (e) {
    console.error("Push subscribe error:", e);
    return false;
  }
}

export async function isPushSubscribed(): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window;
}
