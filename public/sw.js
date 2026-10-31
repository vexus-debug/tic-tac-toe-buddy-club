// Clinexus app worker: no page caching (pages stay network-fresh).
// It clears legacy PWA caches and handles device push notifications.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.allSettled(keys.map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { title: "Clinexus", body: event.data && event.data.text() }; }
  const title = data.title || "Clinexus";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/pwa-icon-192.png",
      badge: "/pwa-icon-192.png",
      tag: data.id || undefined,
      data: { url: data.id ? "/app/inbox/" + data.id : "/app/inbox" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/app/inbox", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of all) {
        if ("navigate" in c) { await c.focus(); return c.navigate(url); }
      }
      return self.clients.openWindow(url);
    })(),
  );
});
