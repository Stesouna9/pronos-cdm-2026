/* push.js — abonnement aux notifications (Web Push).
   Sur iPhone, ça ne marche QUE si le site est installé sur l'écran
   d'accueil (Partager → Sur l'écran d'accueil). */
import { savePushSub } from "./league.js";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

export function pushSupported() {
  return typeof window !== "undefined"
    && "serviceWorker" in navigator
    && "PushManager" in window
    && typeof Notification !== "undefined";
}

function urlBase64ToUint8Array(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/* Demande la permission, abonne CET appareil et enregistre côté serveur.
   Retourne { ok } ou { error } avec un message simple. */
export async function enablePushOnThisDevice() {
  if (!pushSupported()) return { error: "unsupported" };
  if (!VAPID_PUBLIC_KEY) return { error: "config" };
  try {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return { error: "denied" };
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    const r = await savePushSub(sub.toJSON());
    if (r.error) return { error: r.error };
    return { ok: true };
  } catch (e) {
    return { error: e && e.message ? e.message : "échec" };
  }
}
