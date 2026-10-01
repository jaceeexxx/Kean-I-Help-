function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(ch => ch.charCodeAt(0)));
}

async function ensureServiceWorker() {
  if (!("serviceWorker" in navigator)) throw new Error("Service workers are unavailable on this browser.");
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  return navigator.serviceWorker.register("/sw.js");
}

export async function currentPushSubscription() {
  if (!("serviceWorker" in navigator)) return null;
  const registration = await ensureServiceWorker();
  return registration.pushManager.getSubscription();
}

export async function enablePushSubscription() {
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Web Push is not supported on this browser/device.");
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notification permission was not granted.");
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) throw new Error("VAPID public key is not configured yet.");
  const registration = await ensureServiceWorker();
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
  const response = await fetch("/api/notifications/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription.toJSON()) });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Could not save push subscription. Sign in to enable cloud push.");
  }
  return subscription;
}

export async function disablePushSubscription() {
  const subscription = await currentPushSubscription();
  if (!subscription) return;
  await fetch("/api/notifications/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint }) }).catch(() => undefined);
  await subscription.unsubscribe();
}

export async function showPreviewNotification() {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) throw new Error("Notifications are unavailable here.");
  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notification permission was not granted.");
  const registration = await ensureServiceWorker();
  await registration.showNotification("Kean I Help? 💛", {
    body: "Today’s review is here when you’re ready, My love. No guilt, no rush.",
    icon: "/app-icon.svg",
    tag: "kih-preview",
    data: { url: "/review" },
  });
}
