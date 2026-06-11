/* Service worker minimal : rend l'app installable (PWA).
   Réseau d'abord, pas de cache agressif (les données viennent de Supabase). */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {}); // requis pour l'installabilité
