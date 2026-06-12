/* Service worker : rend l'app installable (PWA) + reçoit les
   notifications push (résultats de match, alertes admin). */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {}); // requis pour l'installabilité

self.addEventListener("push", (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) {}
  const title = data.title || "⚽ CDM de Gabriel";
  e.waitUntil(self.registration.showNotification(title, {
    body: data.body || "",
    icon: "/pronos-cdm-2026/icon-192.png",
    badge: "/pronos-cdm-2026/icon-192.png",
    tag: data.tag || "pronos-cdm",
    data: { url: data.url || "/pronos-cdm-2026/" },
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/pronos-cdm-2026/";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ("focus" in c) return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
