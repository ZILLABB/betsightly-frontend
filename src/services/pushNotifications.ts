import { API_BASE_URL } from "../config/apiConfig";

const NOTIFICATION_PREF_KEY = "bs_push_enabled";

async function fetchVapidKey(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/vapid-public-key`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.public_key || null;
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }

  const vapidKey = await fetchVapidKey();
  if (!vapidKey) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    const subJson = subscription.toJSON();
    const res = await fetch(`${API_BASE_URL}/notifications/web-push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        keys: subJson.keys,
        user_agent: navigator.userAgent,
      }),
    });

    if (res.ok) {
      localStorage.setItem(NOTIFICATION_PREF_KEY, "true");
      return true;
    }
    return false;
  } catch (err) {
    if (import.meta.env.DEV) console.error("Push subscription failed:", err);
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;

    const subJson = subscription.toJSON();
    await fetch(`${API_BASE_URL}/notifications/web-push/unsubscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        keys: subJson.keys,
      }),
    });

    await subscription.unsubscribe();
    localStorage.setItem(NOTIFICATION_PREF_KEY, "false");
    return true;
  } catch {
    return false;
  }
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission {
  return "Notification" in window ? Notification.permission : "denied";
}
