import {
  getVapidPublicKey,
  subscribeToPush,
} from "../services/notifications-service";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function setupPushNotifications(): Promise<void> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register("/service-worker.js");

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return;
    }

    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      return;
    }

    const publicKey = await getVapidPublicKey();
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await subscribeToPush(subscription.toJSON());
  } catch (err) {
    console.error("Push notification setup failed:", err);
  } 
}