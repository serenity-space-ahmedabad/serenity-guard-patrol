// Serenity Space Patrol service worker: installable app + phone alerts. Always uses the network for pages and data.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: "Serenity Space Patrol", body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "Serenity Space Patrol", {
    body: d.body || "", tag: d.tag || "patrol", renotify: true, requireInteraction: true,
    vibrate: [500, 200, 500, 200, 500], icon: "icon.svg", badge: "icon.svg", data: { url: d.url || "./" },
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || "./", self.registration.scope).href;
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) { if (c.url.startsWith(self.registration.scope)) { await c.focus(); return; } }
    await self.clients.openWindow(url);
  })());
});
